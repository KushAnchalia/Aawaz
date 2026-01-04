import Providers from "../providers";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";

export const metadata = {
  title: "Solana Voice Agent",
  description: "Voice-controlled Solana transaction agent",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

