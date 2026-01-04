"use client";
import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, percentAmount } from "@metaplex-foundation/umi";
import { PublicKey } from "@solana/web3.js";

export default function CreatorDashboard() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [uploading, setUploading] = useState(false);
    const [minting, setMinting] = useState(false);
    const [mintedAddress, setMintedAddress] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleMint = async () => {
        if (!wallet.publicKey || !file) return;

        try {
            setUploading(true);

            // 1. Upload to IPFS via our API
            const formData = new FormData();
            formData.append("file", file);
            formData.append("metadata", JSON.stringify({
                name,
                description,
                attributes: [
                    { trait_type: "Voice", value: "Custom" },
                    { trait_type: "Creator", value: wallet.publicKey.toBase58() }
                ]
            }));

            const uploadRes = await fetch("/api/ipfs/upload", {
                method: "POST",
                body: formData,
            });

            const uploadData = await uploadRes.json();
            if (!uploadData.success) throw new Error("Upload failed");

            setUploading(false);
            setMinting(true);

            // 2. Initialize Umi
            const umi = createUmi(connection.rpcEndpoint)
                .use(walletAdapterIdentity(wallet))
                .use(mplTokenMetadata());

            const mint = generateSigner(umi);

            // 3. Mint NFT
            // Note: We are using the mock metadata URI from our API.
            // In production, this URI should point to the actual uploaded JSON.
            const { signature } = await createNft(umi, {
                mint,
                name: name,
                symbol: "VOICE",
                uri: uploadData.metadataUri,
                sellerFeeBasisPoints: percentAmount(5), // 5% royalty
                isCollection: false,
            }).sendAndConfirm(umi);

            setMintedAddress(mint.publicKey.toString());

            // 4. Register in our backend (for the marketplace)
            await fetch("/api/voice-agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    price: price || "0.1",
                    creator: wallet.publicKey.toBase58(),
                    prompt: "Custom Voice Agent",
                    category: "Community",
                    voiceStyle: "Custom",
                    nftMintAddress: mint.publicKey.toString(),
                    image: uploadData.imageUri
                })
            });

            alert("Voice NFT Minted Successfully!");

        } catch (error: any) {
            console.error("Minting error:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setUploading(false);
            setMinting(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Create Voice NFT</h2>

            {!wallet.connected ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                    Please connect your wallet to create a voice NFT.
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Voice Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border rounded-md"
                            placeholder="e.g. My Custom Voice"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border rounded-md"
                            placeholder="Describe the voice..."
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (SOL)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full p-2 border rounded-md"
                            placeholder="0.1"
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Voice Sample (Audio)</label>
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileChange}
                            className="w-full border rounded-md p-2"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleMint}
                            disabled={uploading || minting || !file || !name}
                            className={`w-full py-3 px-4 rounded-md text-white font-bold transition-colors ${uploading || minting || !file || !name
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-purple-600 hover:bg-purple-700"
                                }`}
                        >
                            {uploading ? "Uploading to IPFS..." : minting ? "Minting NFT..." : "Mint Voice NFT"}
                        </button>
                    </div>

                    {mintedAddress && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-green-800 font-medium">NFT Minted Successfully!</p>
                            <p className="text-sm text-green-600 break-all">Address: {mintedAddress}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
