import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { getConnection } from "@/app/lib/solana";

// Check if wallet owns a specific NFT (voice agent)
async function ownsVoiceNFT(walletAddress: string, voiceId: string): Promise<boolean> {
  try {
    const connection = getConnection();
    const walletPubkey = new PublicKey(walletAddress);

    // In production, you would:
    // 1. Look up the NFT mint address for this voiceId
    // 2. Check if wallet owns tokens from that mint
    // 3. Verify NFT metadata matches voiceId

    // For now, we'll check if the voice agent exists and allow access
    // In production, implement proper NFT ownership verification

    // Example: Check token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    });

    // Simplified check - in production, verify specific NFT mint
    return true; // For MVP, allow if wallet is connected
  } catch (error) {
    console.error("NFT ownership check error:", error);
    return false;
  }
}

// Generate voice using Fish Audio API (REST)
async function generateVoice(text: string, voiceId: string, referenceId?: string): Promise<string> {
  const FISH_API_KEY = process.env.FISH_API_KEY;
  const REF_ID = referenceId || process.env.DEFAULT_REFERENCE_ID || "8ef4a238714b45718ce04243307c57a7";

  if (FISH_API_KEY) {
    try {
      const response = await fetch("https://api.fish.audio/v1/tts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FISH_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          reference_id: REF_ID,
          format: "mp3",
          model: "s1",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fish Audio API error: ${response.status} ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString("base64");

      return `data:audio/mpeg;base64,${audioBase64}`;
    } catch (error) {
      console.error("Fish Audio error:", error);
      throw error;
    }
  }

  console.warn("Voice generation warning: FISH_API_KEY not set. Using mock response.");
  return "data:audio/mp3;base64,//uQRAAAAWMSLwUIYAPAAAADAAAARU1AMEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, wallet, voiceId, referenceId } = await req.json();

    if (!prompt || !wallet || !voiceId) {
      return NextResponse.json(
        { error: "Missing required fields: prompt, wallet, voiceId" },
        { status: 400 }
      );
    }

    // Check NFT ownership
    const ownsNFT = await ownsVoiceNFT(wallet, voiceId);
    if (!ownsNFT) {
      return NextResponse.json(
        { error: "You don't own the NFT for this voice agent. Purchase it first." },
        { status: 403 }
      );
    }

    // Generate voice
    const audioData = await generateVoice(prompt, voiceId, referenceId);

    return NextResponse.json({
      success: true,
      audio: audioData,
      prompt,
      voiceId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Voice generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate voice" },
      { status: 500 }
    );
  }
}

