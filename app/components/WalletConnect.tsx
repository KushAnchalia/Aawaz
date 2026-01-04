"use client";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { getConnection } from "../lib/solana";

export default function WalletConnect() {
  const { connected, publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (connected && publicKey) {
      setLoading(true);
      setError(null);
      
      const fetchBalance = async () => {
        try {
          console.log("Fetching balance for:", publicKey.toBase58());
          // Use getBalance with 'confirmed' commitment to get most recent balance
          const connection = getConnection();
          const bal = await connection.getBalance(publicKey, "confirmed");
          const solBalance = bal / 1e9; // Convert to SOL
          console.log("Balance fetched:", solBalance);
          setBalance(solBalance);
          setLastUpdated(new Date().toLocaleTimeString());
        } catch (err: any) {
          console.error("Error fetching balance:", err);
          setError(err.message || "Failed to fetch balance");
          setBalance(0); // Set to 0 on error to show the message
        } finally {
          setLoading(false);
        }
      };

      fetchBalance();
      // Update every 2 seconds for faster updates
      const interval = setInterval(fetchBalance, 2000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
      setError(null);
      setLastUpdated("");
      setLoading(false);
    }
  }, [connected, publicKey]);

  if (!mounted) return null;

  return (
    <div style={{ marginBottom: "2rem", textAlign: "center" }}>
      <WalletMultiButton />
      {connected && publicKey && (
        <div style={{ marginTop: "1rem", color: "#666", fontSize: "0.9rem" }}>
          <div>Connected: {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}</div>
          {loading ? (
            <div style={{ marginTop: "0.5rem", color: "#94a3b8" }}>
              Balance: Loading...
            </div>
          ) : (
            <div style={{ marginTop: "0.5rem", fontWeight: "bold", color: balance && balance > 0 ? "#10b981" : "#ef4444" }}>
              Balance: {balance !== null ? balance.toFixed(4) : "0.0000"} SOL
              {balance === 0 && (
                <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#f59e0b" }}>
                  (Get free SOL from faucet)
                </span>
              )}
              {error && (
                <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#ef4444" }}>
                  (Error: {error})
                </span>
              )}
              {lastUpdated && (
                <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "#94a3b8" }}>
                  (Updated: {lastUpdated})
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

