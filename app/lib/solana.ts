import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

// Using the environment variable for RPC URL with devnet as fallback
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
  "https://api.devnet.solana.com";

export function getConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, "confirmed");
}

// Helper function to get formatted balance
export async function getWalletBalance(publicKey: PublicKey): Promise<number> {
  try {
    const connection = getConnection();
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9; // Convert to SOL
  } catch (error) {
    console.error("Error fetching balance:", error);
    throw error;
  }
}

export function buildTransferTransaction(
  from: string,
  to: string,
  amount: number
): Transaction {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey(from),
      toPubkey: new PublicKey(to),
      lamports: amount * 1e9, // Convert SOL to lamports
    })
  );

  return transaction;
}

