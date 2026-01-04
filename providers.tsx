"use client";
import { WalletProvider, ConnectionProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useMemo } from "react";
import { clusterApiUrl } from "@solana/web3.js";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Using testnet - you can also use WalletAdapterNetwork.Devnet for devnet
  const endpoint = useMemo(() => {
    // Use testnet RPC endpoint
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.testnet.solana.com";
  }, []);
  
  // Standard wallets (Phantom, Solflare, etc.) are auto-detected
  // No need to manually add them - they're registered as Standard Wallets

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

