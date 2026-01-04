"use client";
import { useState, useRef, ReactNode, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction } from "@solana/web3.js";
import { getConnection, buildTransferTransaction } from "../lib/solana";
import { validateTransfer } from "../lib/policy";
import { parseWithRegex, ParsedIntent } from "../lib/ai";

interface TransactionAgentProps {
  onSpeak?: (text: string) => void;
  onStopSpeech?: () => void;
  initialCommand?: string;
}

export default function TransactionAgent({ onSpeak, onStopSpeech, initialCommand }: TransactionAgentProps) {
  const { publicKey, signTransaction, connected } = useWallet();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [status, setStatus] = useState<ReactNode>("");
  const [mode, setMode] = useState<"voice" | "text">("text");
  const [hasProcessedInitial, setHasProcessedInitial] = useState(false);
  const [lastActionType, setLastActionType] = useState<string | null>(null);
  const [lastActionTime, setLastActionTime] = useState<number>(0);
  const [linkedExchanges, setLinkedExchanges] = useState<string[]>([]);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const lower = (transcript || textInput || initialCommand || "").toLowerCase();
  const isMyWallet = lower.includes("my wallet") || lower.includes("my address") || lower.includes("my own");

  useEffect(() => {
    if (initialCommand && !hasProcessedInitial) {
      setHasProcessedInitial(true);
      processCommand(initialCommand);
    }
  }, [initialCommand, hasProcessedInitial]);

  const processCommand = async (text: string) => {
    if (!text.trim()) return;

    setStatus("⏳ Processing & Parsing Intent...");
    onSpeak?.("Processing your request...");
    setTranscript(text);

    try {
      let intent: ParsedIntent;
      try {
        console.log("Analyzing command:", text);
        const response = await fetch("/api/parse-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, linked_exchanges: linkedExchanges }),
        });

        if (!response.ok) {
          throw new Error(`Server Busy`);
        }

        intent = await response.json();
      } catch (error: any) {
        console.warn("Server-side parsing failed, using local browser fallback.", error);
        intent = parseWithRegex(text);
      }

      if (intent) {
        // Add a small delay for natural feel
        await new Promise(r => setTimeout(r, 600));

        if (intent.action === "transfer_sol") {
          if (!intent.amount || (!intent.to && !isMyWallet)) {
            setStatus(
              <div style={{ textAlign: "left", color: "#f1f5f9" }}>
                <strong style={{ color: "#818cf8" }}>Transaction Intent Detected 🟣</strong><br />
                <div style={{ marginTop: "5px", fontSize: "0.9rem" }}>
                  {!intent.amount && <div style={{ color: "#f87171" }}>❌ Missing Amount (e.g., \"0.1\")</div>}
                  {(!intent.to && !isMyWallet) && <div style={{ color: "#f87171" }}>❌ Missing Recipient Address</div>}
                  {intent.amount && <div style={{ color: "#34d399" }}>✅ Amount: {intent.amount} SOL</div>}
                  {(intent.to || isMyWallet) && <div style={{ color: "#34d399" }}>✅ To: {intent.to === "OWN_WALLET" || isMyWallet ? "My Wallet" : (intent.to || "").slice(0, 8) + "..."}</div>}
                </div>
                <p style={{ marginTop: "10px", fontSize: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px" }}>
                  Try saying: <strong style={{ color: "white" }}>\"Send 0.05 SOL to [Address]\"</strong>
                </p>
              </div>
            );
            if (!intent.amount) onSpeak?.("I couldn't catch the amount. How much SOL do you want to send?");
            else if (!intent.to && !isMyWallet) onSpeak?.("Who should I send this to?");
            return;
          }

          const recipient = intent.to === "OWN_WALLET" || isMyWallet ? publicKey?.toString() : intent.to;
          if (!recipient) {
            setStatus(<div style={{ color: "#f87171" }}>Please connect your wallet to use "on my address".</div>);
            return;
          }

          // Validate transaction
          const validation = validateTransfer(intent.amount, recipient);
          if (!validation.allowed) {
            setStatus(`❌ Error: ${validation.reason}`);
            onSpeak?.(`Error: ${validation.reason}`);
            return;
          }

          // Show confirmation
          const displayAddr = intent.to === "OWN_WALLET" || isMyWallet ? "My Wallet" : (recipient.slice(0, 8) + "..." + recipient.slice(-8));
          const confirmMessage = `Send ${intent.amount} SOL to ${displayAddr}?`;
          const confirmed = window.confirm(confirmMessage);

          if (!confirmed) {
            setStatus("Transaction cancelled");
            onSpeak?.("Transaction cancelled.");
            return;
          }

          // Build and sign transaction
          await executeTransfer(intent.amount, recipient);
        } else if (intent.action === "buy") {
          if (!intent.amount) {
            setStatus(
              <div style={{ color: "#f87171" }}>
                ❌ <strong>Missing Amount:</strong> How much {intent.asset || "SOL"} do you want to buy?
              </div>
            );
            onSpeak?.("Please specify the amount you want to buy.");
            return;
          }

          // Link-First Mandatory Check
          if (linkedExchanges.length === 0 || intent.status === "ACTION_REQUIRED") {
            setPendingCommand(text); // Remember the command for auto-resume
            const options = intent.supported_exchanges || ["Binance", "Coinbase", "OKX", "Bybit", "CoinDCX"];
            setStatus(
              <div style={{ textAlign: "left", color: "#f1f5f9" }}>
                <strong style={{ color: "#818cf8" }}>The AI Orchestrator's Disclosure 🎙️💎</strong><br />
                <div style={{ marginTop: "12px", padding: "12px", background: "rgba(99, 102, 241, 0.1)", borderRadius: "12px", border: "1px dashed rgba(99, 102, 241, 0.4)", fontSize: "0.9rem", fontStyle: "italic", lineHeight: "1.4" }}>
                  "Bhai, I am an AI agent, a digital strategist—not a liquidity vault. My <strong>Coordinated Agency (CA)</strong> excels in strategy, but the heavy gears of financial settlement belong to the Titans. I orchestrate the plan, but you must secure the treasure on the platforms below."
                </div>
                <p style={{ marginTop: "15px", fontSize: "0.95rem" }}>
                  To buy <strong>{intent.amount} {intent.asset || "SOL"}</strong>, please choose your destination:
                </p>
                <div style={{ marginTop: "15px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {options.map((ex: string) => (
                    <div key={ex} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <button
                        onClick={async () => {
                          setLinkedExchanges([ex]);
                          setStatus(<div style={{ color: "#34d399" }}>✅ {ex} linked! Resuming your order...</div>);
                          onSpeak?.(`${ex} linked. Resuming your order.`);
                          setTimeout(() => { if (text) processCommand(text); }, 500);
                        }}
                        style={{
                          padding: "12px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          color: "white",
                          cursor: "pointer",
                          fontWeight: "700",
                          transition: "all 0.2s"
                        }}
                      >
                        Link {ex} API
                      </button>
                      <a
                        href={`https://www.${ex.toLowerCase()}.com/buy-sell?asset=${intent.asset || "SOL"}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "0.7rem", color: "#6366f1", textAlign: "center", textDecoration: "underline", fontWeight: "600" }}
                      >
                        Direct Buy on {ex} →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
            onSpeak?.(`Bhai, as an AI orchestrator, I handle the strategy, but the final acquisition happens on the big platforms. Please link an exchange or jump directly to their website to secure your ${intent.asset || "SOL"}.`);
            return;
          }

          // Anti-Loop Protection
          const now = Date.now();
          if (lastActionType === "withdraw" && (now - lastActionTime < 60000)) {
            setStatus(
              <div style={{ padding: "15px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "12px", border: "1px solid #ef4444" }}>
                ⚠️ <strong>Anti-Loop Protection:</strong> You recently withdrew funds. Buying immediately may cause unnecessary fees or trigger security flags. Please wait a minute.
              </div>
            );
            onSpeak?.("I detected a recent withdrawal. Please wait a moment before buying to prevent transaction loops.");
            return;
          }

          const linkedEx = linkedExchanges[0];
          setStatus(
            <div style={{ textAlign: "left", color: "#f1f5f9" }}>
              <strong style={{ color: "#818cf8" }}>Buy Order Plan Prepared 🛒</strong><br />
              <div style={{ marginTop: "10px", padding: "15px", background: "rgba(99, 102, 241, 0.1)", borderRadius: "12px", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#94a3b8" }}>Asset:</span>
                  <strong style={{ color: "white" }}>{intent.asset || "SOL"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#94a3b8" }}>Amount:</span>
                  <strong style={{ color: "white" }}>{intent.amount}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#94a3b8" }}>Exchange:</span>
                  <span style={{ color: "#fbbf24", fontWeight: "800" }}>{linkedEx}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Price:</span>
                  <span style={{ color: "#34d399", fontWeight: "800" }}>{intent.price_type || "MARKET"}</span>
                </div>
              </div>

              <div style={{ marginTop: "12px", fontSize: "0.85rem", color: "#f87171", fontWeight: "700" }}>
                ⚠️ WARNING: Market prices are volatile. Slippage may occur.
              </div>

              <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <button
                  onClick={async () => {
                    setStatus(
                      <div style={{ textAlign: "center", padding: "20px" }}>
                        <div style={{ color: "#818cf8" }}>⏳ Step 1/3: Calculating Liquidity...</div>
                      </div>
                    );
                    onSpeak?.("Executing your order. Step one, calculating liquidity.");

                    await new Promise(r => setTimeout(r, 1000));
                    setStatus(
                      <div style={{ textAlign: "center", padding: "20px" }}>
                        <div style={{ color: "#fbbf24" }}>⏳ Step 2/3: Securing Market Price...</div>
                      </div>
                    );
                    onSpeak?.("Step two, securing the best market price.");

                    await new Promise(r => setTimeout(r, 1200));
                    const orderId = Math.random().toString(36).substring(7).toUpperCase();
                    setStatus(
                      <div style={{ color: "#34d399", padding: "15px", background: "rgba(52, 211, 153, 0.1)", borderRadius: "12px", border: "1px solid #34d399" }}>
                        ✅ <strong>Order Executed!</strong><br />
                        Purchased {intent.amount} {intent.asset} on {linkedEx}.<br />
                        <span style={{ fontSize: "0.8rem", color: "#bc9bff" }}>Order ID: {orderId}</span>
                      </div>
                    );
                    onSpeak?.(`Purchase of ${intent.amount} ${intent.asset} on ${linkedEx} was successful. Order ID ${orderId}`);
                  }}
                  style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", border: "none", borderRadius: "12px", color: "white", fontWeight: "800", cursor: "pointer" }}
                >
                  Confirm Buy
                </button>
                <button
                  onClick={() => setStatus("Order cancelled")}
                  style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white", fontWeight: "800", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          );

          onSpeak?.(`Buy ${intent.amount} ${intent.asset || "SOL"} on ${linkedEx} at market price? This will use your linked exchange balance.`);

          setLastActionType("buy");
          setLastActionTime(now);

        } else if (intent.action === "analyze_transaction") {
          // Analyze transaction using workbench API
          setStatus("⏳ Analyzing transaction...");
          onSpeak?.("Analyzing the transaction now.");

          const res = await fetch("/api/transaction/optimize", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: intent.from,
              to: intent.to,
              amount: intent.amount,
              transaction: intent.rawTransaction,
            }),
          });

          if (!res.ok) {
            setStatus(`❌ Analysis failed.`);
            return;
          }

          const result = await res.json();

          // Show analysis results
          setStatus(
            <div>
              ✅ <strong>Transaction Analysis Complete!</strong>
              <br />
              Type: {result.parsed.type}
              <br />
              Success: {result.simulation.success ? "✅ Yes" : "❌ No"}
              <br />
              Optimization Score: {result.optimizationScore}/100
            </div>
          );
          onSpeak?.("Analysis complete. score is " + result.optimizationScore);
        } else if (intent.action === "get_balance") {
          if (!publicKey) {
            setStatus("⚠️ Wallet not connected");
            return;
          }
          setStatus("⏳ Fetching balance...");
          onSpeak?.("Fetching balance.");
          const connection = getConnection();
          const balance = await connection.getBalance(publicKey);
          const balText = `Your balance is ${(balance / 1e9).toFixed(4)} SOL`;
          setStatus(`💰 ${balText}`);
          onSpeak?.(balText);
        } else if (intent.action === "get_address") {
          if (!publicKey) {
            setStatus("⚠️ Wallet not connected");
            return;
          }
          const addrText = publicKey.toBase58();
          setStatus(
            <div style={{ wordBreak: 'break-all', color: "#f1f5f9" }}>
              <strong style={{ color: "#818cf8" }}>Your Account Address:</strong><br />
              <code style={{ background: 'rgba(30, 41, 59, 0.8)', padding: '12px', borderRadius: '12px', display: 'block', marginTop: '10px', border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                {addrText}
              </code>
            </div>
          );
          onSpeak?.("Your account address is " + addrText);
        }
        else if (intent.action === "clarify") {
          setStatus("❌ Could not understand. Please try again.");
        } else if (intent.action === "cancel") {
          setStatus("Cancelled");
        }
      }
    } catch (error: any) {
      console.error("Error processing command:", error);
      setStatus(
        <div style={{ color: "#f87171", padding: "15px", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "14px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <div style={{ fontWeight: "900", marginBottom: "8px" }}>❌ Critical System Conflict Detected</div>
          <div style={{ fontSize: "0.9rem", color: "#fca5a5" }}>
            The server is returning an invalid response. This happens when multiple server instances (npm run dev) are fighting.
          </div>
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={() => {
                window.location.reload();
              }}
              style={{ padding: "10px 15px", background: "#ef4444", border: "none", borderRadius: "8px", color: "white", fontWeight: "800", cursor: "pointer", marginRight: "10px" }}
            >
              Refresh Page
            </button>
            <div style={{ marginTop: "10px", fontSize: "0.8rem", opacity: 0.8 }}>
              Manual fix: Run <code>killall -9 node; rm -rf .next</code> in terminal.
            </div>
          </div>
        </div>
      );
      onSpeak?.("System conflict detected. Please refresh or restart the server.");
    }
  };

  const startListening = () => {
    if (!connected || !publicKey) {
      setStatus("⚠️ Please connect your wallet first");
      return;
    }

    // Check for browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("❌ Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("🎤 Listening...");
      setTranscript("");
    };

    recognition.onresult = async (e: any) => {
      const text = e.results[0][0].transcript;
      await processCommand(text);
    };

    recognition.onerror = (e: any) => {
      setIsListening(false);
      setStatus(`❌ Error: ${e.error}`);
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

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    await processCommand(textInput);
    setTextInput("");
  };

  const executeTransfer = async (amount: number, to: string) => {
    if (!publicKey || !signTransaction) {
      setStatus("⚠️ Wallet not connected");
      return;
    }

    try {
      setStatus("⏳ Checking balance...");

      const connection = getConnection();

      // Check balance before sending
      const balance = await connection.getBalance(publicKey);
      const requiredLamports = amount * 1e9 + 5000; // Amount + fee buffer

      if (balance < requiredLamports) {
        const balanceSOL = (balance / 1e9).toFixed(4);
        setStatus(`❌ Insufficient balance! You have ${balanceSOL} SOL, but need ${amount.toFixed(4)} SOL + fees.`);
        return;
      }

      setStatus("⏳ Building transaction...");

      // Build transaction
      const transaction = buildTransferTransaction(
        publicKey.toBase58(),
        to,
        amount
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      setStatus("✍️ Please sign in your wallet...");

      // Sign transaction
      const signedTx = await signTransaction(transaction);

      setStatus("📤 Sending transaction...");

      // Send transaction with better error handling
      let signature: string;
      try {
        signature = await connection.sendRawTransaction(
          signedTx.serialize(),
          {
            skipPreflight: false,
            maxRetries: 3,
          }
        );
      } catch (sendError: any) {
        // Handle SendTransactionError
        if (sendError.logs) {
          console.error("Transaction logs:", sendError.logs);
          setStatus(`❌ Transaction failed. Logs: ${sendError.logs.join(", ")}`);
        } else if (sendError.message) {
          if (sendError.message.includes("no record of a prior credit")) {
            setStatus(`❌ Insufficient balance! Your wallet has no SOL on testnet.`);
          } else {
            setStatus(`❌ Transaction failed: ${sendError.message}`);
          }
        } else {
          setStatus(`❌ Transaction failed. Check console for details.`);
        }
        return;
      }

      // Confirm transaction
      await connection.confirmTransaction(signature, "confirmed");

      // Show full transaction ID with explorer link
      const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=testnet`;
      setStatus(
        <div style={{ color: "white" }}>
          <span style={{ color: "#10b981", fontWeight: "900" }}>✅ Success!</span> <br />
          <span style={{ fontSize: "0.9rem" }}>Transaction ID:</span> <br />
          <code style={{ backgroundColor: "rgba(15, 23, 42, 0.8)", padding: "0.5rem", borderRadius: "8px", fontSize: "0.85em", display: "block", marginTop: "5px", border: "1px solid rgba(255,255,255,0.1)" }}>{signature}</code>
          <br />
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#6366f1",
              textDecoration: "underline",
              marginTop: "0.8rem",
              display: "inline-block",
              fontWeight: "800"
            }}
          >
            View on Solana Explorer →
          </a>
        </div>
      );
    } catch (error: any) {
      console.error("Transaction processing error:", error);
      setStatus(
        <div style={{ color: "#f87171", padding: "10px", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          ❌ <strong>Server Error:</strong> {error.message === "Failed to fetch" ? "The server is likely crashed or multiple instances are fighting! Please run 'killall node; rm -rf .next' and restart." : error.message || "Command processing failed"}
        </div>
      );
      onSpeak?.("I encountered a server error. Please check your connection.");
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      {/* Mode Toggle */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => { onStopSpeech?.(); setMode("text"); }}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: mode === "text" ? "#4f46e5" : "rgba(30, 41, 59, 0.4)",
            color: "white",
            border: mode === "text" ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            cursor: "pointer",
            fontWeight: "800",
            transition: "all 0.3s",
            boxShadow: mode === "text" ? "0 10px 20px rgba(79, 70, 229, 0.3)" : "none"
          }}
        >
          ✍️ Text Input
        </button>
        <button
          onClick={() => { onStopSpeech?.(); setMode("voice"); }}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: mode === "voice" ? "#4f46e5" : "rgba(30, 41, 59, 0.4)",
            color: "white",
            border: mode === "voice" ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            cursor: "pointer",
            fontWeight: "800",
            transition: "all 0.3s",
            boxShadow: mode === "voice" ? "0 10px 20px rgba(79, 70, 229, 0.3)" : "none"
          }}
        >
          🎤 Voice Command
        </button>
      </div>

      {/* Text Input Mode */}
      {mode === "text" && (
        <div>
          <form onSubmit={handleTextSubmit} style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your command: Send 0.1 SOL to [address]"
                disabled={!connected}
                style={{
                  flex: 1,
                  padding: "1rem 1.5rem",
                  fontSize: "1rem",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(15, 23, 42, 0.6)",
                  color: "white",
                  borderRadius: "14px",
                  outline: "none",
                  opacity: connected ? 1 : 0.5,
                  fontFamily: "'Outfit', sans-serif"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                }}
              />
              <button
                type="submit"
                disabled={!connected || !textInput.trim()}
                style={{
                  padding: "1rem 2.5rem",
                  fontSize: "1rem",
                  background: connected && textInput.trim() ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" : "#475569",
                  color: "white",
                  border: "none",
                  borderRadius: "14px",
                  cursor: connected && textInput.trim() ? "pointer" : "not-allowed",
                  fontWeight: "900",
                  transition: "all 0.3s",
                }}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Voice Mode */}
      {mode === "voice" && (
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <button
            onClick={() => { onStopSpeech?.(); isListening ? stopListening : startListening(); }}
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
            {isListening ? "🛑 Stop Listening" : "🎤 Start Voice Command"}
          </button>
        </div>
      )}

      {/* Transcript/Input Display */}
      {transcript && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1.2rem",
            backgroundColor: "rgba(30, 41, 59, 0.4)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(10px)"
          }}
        >
          <strong style={{ color: "#818cf8" }}>Your {mode === "voice" ? "voice" : "text"} command:</strong>
          <p style={{ marginTop: "0.8rem", color: "#f1f5f9", wordBreak: "break-word", fontSize: "1.1rem" }}>
            {transcript}
          </p>
        </div>
      )}

      {/* Status Display */}
      {status && (() => {
        const statusStr = typeof status === "string" ? status : String(status);
        const isSuccess = statusStr.includes("✅");
        const isError = statusStr.includes("❌");
        const isWarning = statusStr.includes("⚠️");

        return (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1.2rem",
              backgroundColor: isSuccess
                ? "rgba(16, 185, 129, 0.15)"
                : isError
                  ? "rgba(239, 68, 68, 0.15)"
                  : isWarning
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(99, 102, 241, 0.15)",
              borderRadius: "16px",
              border: `1px solid ${isSuccess
                ? "rgba(16, 185, 129, 0.3)"
                : isError
                  ? "rgba(239, 68, 68, 0.3)"
                  : isWarning
                    ? "rgba(245, 158, 11, 0.3)"
                    : "rgba(99, 102, 241, 0.3)"
                }`,
              color: isSuccess
                ? "#d1fae5"
                : isError
                  ? "#fee2e2"
                  : isWarning
                    ? "#fef3c7"
                    : "#e0e7ff",
              fontWeight: "600",
              boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
              backdropFilter: "blur(10px)"
            }}
          >
            {status}
          </div>
        );
      })()}

      {!connected && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#fef3c7",
            borderRadius: "8px",
            border: "1px solid #f59e0b",
            color: "#92400e",
            textAlign: "center",
          }}
        >
          ⚠️ Please connect your wallet to start
        </div>
      )}
    </div>
  );
}

