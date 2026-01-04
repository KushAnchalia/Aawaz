import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { cameraService } from '../services/CameraService';
import { gestureRecognizer } from '../services/GestureRecognizer';
import { intentParser, SignIntent } from '../services/IntentParser';
import { transactionBuilder } from '../services/TransactionBuilder';
import { PublicKey, Connection } from '@solana/web3.js';

interface UICAgentProps {
    onSpeak?: (text: string) => void;
    onStopSpeech?: () => void;
    onAction?: (agent: string, command: string) => void;
}

export default function UICAgent({ onSpeak, onStopSpeech, onAction }: UICAgentProps) {
    const { publicKey, sendTransaction, connected } = useWallet();
    const [status, setStatus] = useState<"IDLE" | "TRACKING" | "ANALYZING" | "CONFIRMING" | "EXECUTING" | "SUCCESS">("IDLE");
    const [currentGesture, setCurrentGesture] = useState<SignIntent | null>(null);
    const [detectedIntent, setDetectedIntent] = useState<SignIntent | null>(null);
    const [txStatus, setTxStatus] = useState<string>("");
    const [landmarkCount, setLandmarkCount] = useState<number>(0);
    const [trackingInfo, setTrackingInfo] = useState<string>("Not Initialized");

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();

    // Update tracking info periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setTrackingInfo(gestureRecognizer.trackingStatus);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // Step 1: Start Camera & Tracking
    const startAgent = async () => {
        onStopSpeech?.();
        try {
            await gestureRecognizer.init();
            if (videoRef.current) {
                await cameraService.startCamera(videoRef.current);
                setStatus("TRACKING");
                startTrackingLoop();
            }
        } catch (err) {
            console.error(err);
            onSpeak?.("Bhai, I couldn't start the camera. Please check permissions.");
        }
    };

    const startTrackingLoop = () => {
        gestureRecognizer.onResults((results: any) => {
            const count = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
            setLandmarkCount(count);

            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    gestureRecognizer.drawLandmarks(ctx, results);

                    const intent = intentParser.parseLandmarks(results);
                    if (intent.intent !== "UNKNOWN") {
                        setCurrentGesture(intent);

                        // Auto-select intent if high confidence and not currently confirming
                        if (intent.confidence > 0.85 && status === "TRACKING") {
                            if (intent.intent === "TRANSFER_SOL") {
                                handleDetectedIntent(intent);
                            }
                        }
                    } else {
                        setCurrentGesture(null);
                    }
                }
            }
        });

        const loop = async () => {
            if (videoRef.current && status === "TRACKING") {
                await gestureRecognizer.send(videoRef.current);
            }
            requestRef.current = requestAnimationFrame(loop);
        };
        requestRef.current = requestAnimationFrame(loop);
    };

    const stopAgent = () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        cameraService.stopCamera();
        setStatus("IDLE");
        setDetectedIntent(null);
        setTxStatus("");
    };

    const handleDetectedIntent = (intent: SignIntent) => {
        setDetectedIntent(intent);
        setStatus("CONFIRMING");
        onSpeak?.(`Bhai, I detected a sign to ${intent.intent.replace('_', ' ')}. Please make a closed fist to confirm or open palm to cancel.`);
    };

    // Step 2: Confirmation & Execution
    useEffect(() => {
        if (status === "CONFIRMING" && currentGesture) {
            if (currentGesture.intent === "CONFIRM") {
                executeTransaction();
            } else if (currentGesture.intent === "CANCEL" || currentGesture.intent === "TRANSFER_SOL") {
                setStatus("TRACKING");
                setDetectedIntent(null);
                onSpeak?.("Action cancelled. Back to tracking.");
            }
        }
    }, [currentGesture, status]);

    const executeTransaction = async () => {
        if (!connected || !publicKey || !detectedIntent) {
            onSpeak?.("Bhai, please connect your wallet first.");
            return;
        }

        setStatus("EXECUTING");
        setTxStatus("Building transaction...");

        try {
            const recipient = publicKey.toBase58();
            const tx = await transactionBuilder.buildTransfer(
                publicKey,
                recipient,
                detectedIntent.amount || 0.1
            );

            setTxStatus("Requesting signature from Phantom...");
            const signature = await sendTransaction(tx, getConnection());
            setTxStatus(`Success! Signature: ${signature.slice(0, 8)}...`);
            setStatus("SUCCESS");
            onSpeak?.("Transaction executed successfully through sign language!");

            setTimeout(() => stopAgent(), 5000);
        } catch (err: any) {
            console.error(txStatus, err);
            setTxStatus(`Error: ${err.message}`);
            setStatus("TRACKING");
            onSpeak?.(`Transaction failed: ${err.message}`);
        }
    };

    return (
        <div style={{
            padding: "2.5rem",
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            borderRadius: "40px",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(40px)",
            color: "white",
            maxWidth: "800px",
            margin: "0 auto",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                <h3 style={{ fontSize: "2.2rem", fontWeight: "950", margin: "0 0 10px 0", letterSpacing: "-1.5px", background: "linear-gradient(135deg, #ffffff 0%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    🤟 Sign Master AI
                </h3>
                <p style={{ color: "#94a3b8", fontSize: "1.1rem", fontWeight: "500" }}>
                    Coordinated Agency (CA) for Non-Verbal Blockchain Interaction
                </p>
            </div>

            <div style={{ position: "relative", marginBottom: "2rem" }}>
                <div style={{
                    width: "100%",
                    height: "400px",
                    background: "#020617",
                    borderRadius: "30px",
                    overflow: "hidden",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    boxShadow: "inset 0 0 50px rgba(0,0,0,0.8)"
                }}>
                    <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <canvas ref={canvasRef} width={1280} height={720} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

                    {status === "IDLE" && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2,6,23,0.8)" }}>
                            <button onClick={startAgent} style={{ padding: "15px 40px", borderRadius: "20px", background: "#6366f1", border: "none", color: "white", fontWeight: "800", cursor: "pointer" }}>
                                📹 Initialize Camera
                            </button>
                        </div>
                    )}
                </div>

                {/* Tracking Hud */}
                {status !== "IDLE" && (
                    <div style={{ position: "absolute", top: 20, left: 20, right: 20, display: "flex", justifyContent: "space-between" }}>
                        <div style={{ background: "rgba(0,0,0,0.6)", padding: "10px 15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(5px)" }}>
                            <span style={{ color: "#818cf8", fontWeight: "900" }}>INTENT: </span>
                            <span style={{ fontWeight: "700" }}>{currentGesture?.intent || "SCANNING..."}</span>
                            <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>STATUS: {trackingInfo}</div>
                            <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>HANDS: {landmarkCount}</div>
                        </div>
                        <div style={{ background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "10px 15px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "900" }}>
                            ● LIVE TRACKING
                        </div>
                    </div>
                )}
            </div>

            {/* Interaction Panels */}
            {status === "CONFIRMING" && detectedIntent && (
                <div style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)", padding: "2rem", borderRadius: "30px", border: "1px solid rgba(99, 102, 241, 0.3)", marginBottom: "2rem", textAlign: "center" }}>
                    <h4 style={{ margin: "0 0 15px 0", color: "#818cf8" }}>GESTURE DETECTED</h4>
                    <div style={{ fontSize: "1.5rem", fontWeight: "900", marginBottom: "20px" }}>
                        {detectedIntent.intent === "TRANSFER_SOL" ? `Transfer ${detectedIntent.amount} SOL` : detectedIntent.intent}
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
                        <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "15px", borderRadius: "15px", border: "1px solid #10b981" }}>
                            ✊ <span style={{ fontWeight: "800", color: "#10b981" }}>FIST TO CONFIRM</span>
                        </div>
                        <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: "15px", borderRadius: "15px", border: "1px solid #ef4444" }}>
                            ✋ <span style={{ fontWeight: "800", color: "#ef4444" }}>PALM TO CANCEL</span>
                        </div>
                    </div>
                </div>
            )}

            {(status === "EXECUTING" || status === "SUCCESS") && (
                <div style={{ background: "rgba(0,0,0,0.4)", padding: "2rem", borderRadius: "30px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: "800", color: status === "SUCCESS" ? "#10b981" : "#818cf8" }}>
                        {txStatus}
                    </div>
                    {status === "SUCCESS" && (
                        <button onClick={stopAgent} style={{ marginTop: "20px", padding: "10px 25px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", cursor: "pointer" }}>
                            Close Session
                        </button>
                    )}
                </div>
            )}

            <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", textAlign: "center" }}>
                <div style={{ padding: "15px", background: "rgba(255,255,255,0.03)", borderRadius: "20px", fontSize: "0.8rem", color: "#94a3b8" }}>
                    <strong>OPEN PALM</strong><br />Send Mode
                </div>
                <div style={{ padding: "15px", background: "rgba(255,255,255,0.03)", borderRadius: "20px", fontSize: "0.8rem", color: "#94a3b8" }}>
                    <strong>ONE FINGER</strong><br />Check Balance
                </div>
                <div style={{ padding: "15px", background: "rgba(255,255,255,0.03)", borderRadius: "20px", fontSize: "0.8rem", color: "#94a3b8" }}>
                    <strong>CLOSED FIST</strong><br />Sign Tx
                </div>
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.6; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

function getConnection() {
    return new Connection("https://api.devnet.solana.com", "confirmed");
}
