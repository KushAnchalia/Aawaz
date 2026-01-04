"use client";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { getConnection, getWalletBalance, buildTransferTransaction } from "../lib/solana";

export default function WalletConnect() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [network, setNetwork] = useState<string>("");
  const [requestingAirdrop, setRequestingAirdrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Airdrop for devnet
  const handleAirdrop = async () => {
    if (!publicKey) return;
    setRequestingAirdrop(true);
    try {
      const connection = getConnection();
      const signature = await connection.requestAirdrop(publicKey, 1e9); // 1 SOL
      await connection.confirmTransaction(signature, "confirmed");
      alert("Airdrop successful! 1 SOL added.");
      fetchBalance(); // refresh after airdrop
    } catch (err) {
      console.error("Airdrop failed:", err);
      alert("Airdrop failed. Try faucet.solana.com or retry later.");
    } finally {
      setRequestingAirdrop(false);
    }
  };

  // Fetch balance in SOL
  const fetchBalance = async () => {
    if (!connected || !publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const bal = await getWalletBalance(publicKey);
      setBalance(bal);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch balance");
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  // Send SOL transaction example
  const sendSol = async (to: string, amount: number) => {
    if (!connected || !publicKey || !sendTransaction) return;
    try {
      const tx = buildTransferTransaction(publicKey.toBase58(), to, amount);
      const signature = await sendTransaction(tx, getConnection());
      await getConnection().confirmTransaction(signature, "confirmed");
      alert(`Sent ${amount} SOL successfully!`);
      fetchBalance(); // update balance
    } catch (err) {
      console.error("Transaction failed:", err);
      alert("Transaction failed. Check console.");
    }
  };

  // Determine network from RPC URL
  useEffect(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "";
    if (rpcUrl.includes("devnet")) setNetwork("Devnet");
    else if (rpcUrl.includes("mainnet")) setNetwork("Mainnet");
    else setNetwork("Custom");
  }, []);

  // Auto-fetch balance every 10s
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
  }, [connected, publicKey]);

  return (
    <div style={{ marginBottom: "2rem", textAlign: "center" }}>
      <WalletMultiButton />

      {connected && publicKey && (
        <div style={{ marginTop: "1rem", color: "#666", fontSize: "0.9rem" }}>
          <div>
            Connected: {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
          </div>

          <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.2rem", display: "flex", gap: "8px", alignItems: "center" }}>
            <span>Network: {network}</span>
            <span style={{ fontSize: "0.7rem" }}>({process.env.NEXT_PUBLIC_SOLANA_RPC_URL})</span>
            <button
              onClick={fetchBalance}
              disabled={loading}
              style={{
                padding: "4px 8px",
                fontSize: "0.75rem",
                background: "#334155",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div style={{ marginTop: "0.5rem", fontWeight: "bold", color: balance && balance > 0 ? "#10b981" : "#ef4444" }}>
            Balance: {balance !== null ? balance.toFixed(4) : "—"} SOL
          </div>

          {error && (
            <div style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "#ef4444" }}>
              {error}
            </div>
          )}

          {network === "Devnet" && balance !== null && balance < 1 && (
            <button
              onClick={handleAirdrop}
              disabled={requestingAirdrop}
              style={{
                marginTop: "10px",
                padding: "5px 10px",
                fontSize: "0.8rem",
                background: "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                opacity: requestingAirdrop ? 0.7 : 1,
              }}
            >
              {requestingAirdrop ? "Requesting..." : "Get 1 Devnet SOL"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
