"use client";
import { useState, useEffect } from "react";

interface NetworkAnalyzerProps {
    onSpeak?: (text: string) => void;
    onStopSpeech?: () => void;
}

export default function NetworkAnalyzer({ onSpeak, onStopSpeech }: NetworkAnalyzerProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastSpoken, setLastSpoken] = useState(0);

    const fetchStats = async (isManual = false) => {
        if (isManual) setLoading(true);
        try {
            const res = await fetch("/api/network/status");
            const data = await res.json();
            setStats(data);

            // Speak only on manual refresh or first load to avoid polling noise
            if (isManual || lastSpoken === 0) {
                const statusText = `The Solana network is currently ${data.congestionLevel}, with ${data.tps.toLocaleString()} transactions per second.`;
                onSpeak?.(statusText);
                setLastSpoken(Date.now());
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (isManual) setLoading(false);
            else setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) return <div style={{ color: "#94a3b8", fontWeight: "bold" }}>⏳ Synchronizing Solana Network data...</div>;

    const congestionColor = stats?.congestionLevel === "LOW" ? "#10b981" : stats?.congestionLevel === "MEDIUM" ? "#f59e0b" : "#ef4444";
    const congestionText = stats?.congestionLevel === "LOW" ? "NORMAL" : stats?.congestionLevel;
    const deployAdvice = stats?.congestionLevel === "HIGH" ? "⚠️ Wait for drop" : "🚀 Ready to deploy!";

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>

            {/* TPS Card */}
            <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "30px", borderRadius: "30px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}>
                <h3 style={{ fontSize: "1.1rem", color: "#94a3b8", marginBottom: "10px", fontWeight: "800" }}>Current TPS</h3>
                <div style={{ fontSize: "3rem", fontWeight: "900", color: "white", letterSpacing: "-1px" }}>
                    {stats.tps.toLocaleString()}
                </div>
                <div style={{ fontSize: "0.95rem", color: "#10b981", marginTop: "10px", fontWeight: "700" }}>Devnet network</div>
            </div>

            {/* Congestion Card */}
            <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "30px", borderRadius: "30px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}>
                <h3 style={{ fontSize: "1.1rem", color: "#94a3b8", marginBottom: "10px", fontWeight: "800" }}>Network Congestion</h3>
                <div style={{ fontSize: "3rem", fontWeight: "900", color: congestionColor, letterSpacing: "-1px" }}>
                    {congestionText}
                </div>
                <div style={{ fontSize: "0.95rem", color: "#94a3b8", marginTop: "10px" }}>Traffic load is stable</div>
            </div>

            {/* Fees Card */}
            <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "30px", borderRadius: "30px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}>
                <h3 style={{ fontSize: "1.1rem", color: "#94a3b8", marginBottom: "10px", fontWeight: "800" }}>Priority Fee (Avg)</h3>
                <div style={{ fontSize: "3rem", fontWeight: "900", color: "#f1f5f9", letterSpacing: "-1px" }}>
                    {stats.averageFee.toLocaleString()}
                </div>
                <div style={{ fontSize: "0.95rem", color: "#94a3b8", marginTop: "10px" }}>micro-lamports / unit</div>
            </div>

            {/* Recommendation Card */}
            <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "30px", borderRadius: "30px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: "1.1rem", color: "#94a3b8", marginBottom: "10px", fontWeight: "800" }}>Deploy Advice</h3>
                <div style={{ fontSize: "1.4rem", fontWeight: "900", margin: "10px 0", color: "white" }}>
                    {deployAdvice}
                </div>
                <button
                    style={{
                        width: "100%",
                        padding: "15px",
                        borderRadius: "15px",
                        border: "none",
                        background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
                        color: "white",
                        fontWeight: "900",
                        cursor: "pointer",
                        boxShadow: "0 10px 20px rgba(0, 0, 0, 0.4)",
                        transition: "all 0.3s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    onClick={() => { onStopSpeech?.(); fetchStats(true); }}
                >
                    Refresh Status ⚡
                </button>
            </div>

        </div>
    );
}
