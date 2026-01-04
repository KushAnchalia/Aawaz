"use client";
import { useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction } from "@solana/web3.js";
import { getConnection, buildTransferTransaction } from "../lib/solana";
import { validateTransfer } from "../lib/policy";

export default function VoiceButton() {
  const { publicKey, signTransaction, connected } = useWallet();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("");
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (!connected || !publicKey) {
      setStatus("Please connect your wallet first");
      return;
    }

    // Check for browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("Listening...");
      setTranscript("");
    };

    recognition.onresult = async (e: any) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setStatus("Processing...");

      try {
        // Parse intent from voice command
        const response = await fetch("/api/parse-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        const intent = await response.json();

        if (intent.action === "transfer_sol") {
          // Validate transaction
          const validation = validateTransfer(intent.amount, intent.to);
          if (!validation.allowed) {
            setStatus(`Error: ${validation.reason}`);
            return;
          }

          // Show confirmation
          const confirmMessage = `Send ${intent.amount} SOL to ${intent.to.slice(0, 8)}...${intent.to.slice(-8)}?`;
          const confirmed = window.confirm(confirmMessage);

          if (!confirmed) {
            setStatus("Transaction cancelled");
            return;
          }

          // Build and sign transaction
          await executeTransfer(intent.amount, intent.to);
        } else if (intent.action === "clarify") {
          setStatus("Could not understand. Please try again.");
        } else if (intent.action === "cancel") {
          setStatus("Cancelled");
        }
      } catch (error) {
        console.error("Error processing voice command:", error);
        setStatus("Error processing command");
      }
    };

    recognition.onerror = (e: any) => {
      setIsListening(false);
      setStatus(`Error: ${e.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const executeTransfer = async (amount: number, to: string) => {
    if (!publicKey || !signTransaction) {
      setStatus("Wallet not connected");
      return;
    }

    try {
      setStatus("Building transaction...");

      // Build transaction
      const transaction = buildTransferTransaction(
        publicKey.toBase58(),
        to,
        amount
      );

      // Get recent blockhash
      const connection = getConnection();
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      setStatus("Please sign in your wallet...");

      // Sign transaction
      const signedTx = await signTransaction(transaction);

      setStatus("Sending transaction...");

      // Send transaction
      const signature = await connection.sendRawTransaction(
        signedTx.serialize(),
        {
          skipPreflight: false,
          maxRetries: 3,
        }
      );

      // Confirm transaction
      await connection.confirmTransaction(signature, "confirmed");

      setStatus(`✅ Success! Transaction: ${signature.slice(0, 8)}...`);
    } catch (error: any) {
      console.error("Transaction error:", error);
      setStatus(`Error: ${error.message || "Transaction failed"}`);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={!connected}
        style={{
          padding: "1.5rem 3rem",
          fontSize: "1.2rem",
          backgroundColor: isListening ? "#ef4444" : "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "12px",
          cursor: connected ? "pointer" : "not-allowed",
          opacity: connected ? 1 : 0.5,
          fontWeight: "bold",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (connected) {
            e.currentTarget.style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {isListening ? "🛑 Stop" : "🎤 Start Voice Command"}
      </button>

      {transcript && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "white",
          }}
        >
          <strong>You said:</strong> {transcript}
        </div>
      )}

      {status && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: "8px",
            color: "white",
            fontWeight: "500",
          }}
        >
          {status}
        </div>
      )}

      {!connected && (
        <p style={{ marginTop: "1rem", color: "white" }}>
          Connect your wallet to start
        </p>
      )}
    </div>
  );
}

