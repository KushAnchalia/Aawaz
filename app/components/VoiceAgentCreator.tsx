"use client";
import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, percentAmount } from "@metaplex-foundation/umi";

export default function VoiceAgentCreator() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0.1");
  const [category, setCategory] = useState("General");
  const [uploading, setUploading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [status, setStatus] = useState("");
  const [mintedAddress, setMintedAddress] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleMint = async () => {
    if (!wallet.publicKey || !file) {
      alert("Please connect wallet and select a file");
      return;
    }

    try {
      setUploading(true);
      setStatus("⏳ Uploading to IPFS...");

      // 1. Upload to IPFS via our API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("metadata", JSON.stringify({
        name,
        description,
        attributes: [
          { trait_type: "Voice", value: "Custom" },
          { trait_type: "Category", value: category },
          { trait_type: "Creator", value: wallet.publicKey.toBase58() }
        ]
      }));

      const uploadRes = await fetch("/api/ipfs/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.success && !uploadData.uri) throw new Error("Upload failed: " + (uploadData.error || "Unknown error"));

      setUploading(false);
      setMinting(true);
      setStatus("⏳ Minting NFT on Solana...");

      // 2. Initialize Umi
      const umi = createUmi(connection.rpcEndpoint)
        .use(walletAdapterIdentity(wallet))
        .use(mplTokenMetadata());

      const mint = generateSigner(umi);

      // 3. Mint NFT
      // Use the metadata URI returned from IPFS upload
      const uri = uploadData.metadataUri || "https://example.com/metadata.json";

      const { signature } = await createNft(umi, {
        mint,
        name: name,
        symbol: "VOICE",
        uri: uri,
        sellerFeeBasisPoints: percentAmount(5), // 5% royalty
        isCollection: false,
      }).sendAndConfirm(umi);

      setMintedAddress(mint.publicKey.toString());

      // 4. Register in our backend (for the marketplace indexing)
      setRegistering(true);
      setStatus("⏳ Finalizing Publication...");
      const regRes = await fetch("/api/voice-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          creator: wallet.publicKey.toBase58(),
          prompt: "Custom Voice Agent", // Default prompt
          category: category,
          voiceStyle: "Custom",
          nftMintAddress: mint.publicKey.toString(),
          image: uploadData.imageUri,
          voiceId: mint.publicKey.toString() // Use Mint Address as Voice ID for now
        })
      });

      if (!regRes.ok) throw new Error("Backend registration failed. The server might be unstable.");

      setStatus("✅ Voice NFT Published!");
      alert("Voice NFT Minted Successfully!");

      // Reset form
      setName("");
      setDescription("");
      setFile(null);
      setPrice("0.1");

    } catch (error: any) {
      console.error("Minting error:", error);
      setStatus(`❌ Error: ${error.message}`);
      alert(`Error: ${error.message}`);
    } finally {
      setUploading(false);
      setMinting(false);
      setRegistering(false);
    }
  };

  return (
    <div style={{ padding: "1.5rem", backgroundColor: "#f9fafb", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
      <h3 style={{ fontSize: "1.3rem", marginBottom: "1rem", color: "#333" }}>
        🎙️ Create Voice NFT
      </h3>

      {!wallet.connected ? (
        <div style={{ textAlign: "center", padding: "1rem", backgroundColor: "#fef3c7", borderRadius: "8px", color: "#92400e" }}>
          Please connect your wallet to create a voice NFT.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", color: "#333", marginBottom: "0.5rem" }}>Voice Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              placeholder="e.g. My Custom Voice"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", color: "#333", marginBottom: "0.5rem" }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              placeholder="Describe the voice..."
              rows={3}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", color: "#333", marginBottom: "0.5rem" }}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
            >
              <option value="General">General</option>
              <option value="Business">Business</option>
              <option value="Casual">Casual</option>
              <option value="Entertainment">Entertainment</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", color: "#333", marginBottom: "0.5rem" }}>Price (SOL)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              placeholder="0.1"
              step="0.01"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", color: "#333", marginBottom: "0.5rem" }}>Voice Sample (Audio)</label>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #e5e7eb", background: "white" }}
            />
          </div>

          <div style={{ paddingTop: "1rem" }}>
            <button
              onClick={handleMint}
              disabled={uploading || minting || registering || !file || !name}
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor: uploading || minting || registering || !file || !name ? "#9ca3af" : "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: uploading || minting || registering || !file || !name ? "not-allowed" : "pointer",
                boxShadow: uploading || minting || registering || !file || !name ? "none" : "0 8px 16px rgba(139, 92, 246, 0.3)"
              }}
            >
              {uploading ? "Uploading to IPFS..." : minting ? "Minting NFT..." : registering ? "Finalizing..." : "✨ Mint Voice NFT"}
            </button>
          </div>

          {status && (
            <div style={{
              padding: "1rem",
              borderRadius: "8px",
              background: status.includes("❌") ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
              color: status.includes("❌") ? "#ef4444" : "#10b981",
              fontWeight: "700",
              textAlign: "center",
              border: `1px solid ${status.includes("❌") ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}`
            }}>
              {status}
            </div>
          )}

          {mintedAddress && (
            <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#d1fae5", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
              <p style={{ color: "#065f46", fontWeight: "500", margin: 0 }}>NFT Minted Successfully!</p>
              <p style={{ fontSize: "0.85rem", color: "#047857", overflowWrap: "break-word" }}>Address: {mintedAddress}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
