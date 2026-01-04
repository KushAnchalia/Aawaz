# 🎤 Solana Voice Transaction Agent

A production-grade voice-controlled Solana transaction agent that allows you to execute SOL transfers using voice commands. Built with Next.js, Web Speech API, Groq AI, and Solana Web3.js.

## 🚀 Features

- ✅ Voice-to-transaction pipeline
- ✅ Intent parsing using Groq AI (Llama 3.1 8B) for fast, reliable responses
- ✅ Secure wallet integration (Phantom)
- ✅ Transaction confirmation flow
- ✅ Policy engine with spending limits
- ✅ Solana transactions (configured for devnet/testnet by default)
- ✅ Smart Contract Studio with generation and auditing
- ✅ Celebrity Voice Agents and NFT creation
- ✅ Network Analyzer and transaction optimization

## 📋 Prerequisites

- Node.js 18+ installed
- Phantom wallet browser extension
- Groq API key (see below)
- Some SOL in your wallet (or get free devnet SOL from faucet)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp env.example .env.local
```

Edit `.env.local` and configure for Groq:

**Groq Configuration (Recommended - Production Ready)**
```
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

You can also use other providers:

**Ollama (Local - Free)**
```
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

**Hugging Face (Cloud - Free Tier)**
```
LLM_PROVIDER=huggingface
HUGGINGFACE_API_KEY=your_token_here
```

### 3. Add Hume AI for Voice Features

For celebrity voice agents and advanced voice synthesis:

```
HUME_API_KEY=your_hume_api_key
HUME_SECRET_KEY=your_hume_secret_key
```

Get keys from [hume.ai](https://hume.ai)

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🎯 How to Use

### Step 1: Connect Your Wallet

1. Open `http://localhost:3000` in your browser
2. Click "Select Wallet" and choose Phantom
3. Approve the connection in your wallet

### Step 2: Start Voice Command

1. Click the "🎤 Start Voice Command" button
2. Allow microphone access when prompted
3. Speak clearly: **"Send 0.1 SOL to [Solana address]"**

### Step 3: Confirm Transaction

1. Review the confirmation dialog
2. Click "OK" to proceed
3. Sign the transaction in your Phantom wallet
4. Wait for confirmation

### Example Voice Commands

- ✅ "Send 0.1 SOL to 9xQeWvG816bUx9EPjYj6MrHZGCMahqK9saPJKGmx8eE"
- ✅ "Transfer 0.25 SOL to 9xQeWvG816bUx9EPjYj6MrHZGCMahqK9saPJKGmx8eE"
- ✅ "Send 0.05 SOL to [address]"

## 🔒 Security Features

- **No Private Key Storage**: All signing happens in your wallet
- **Transaction Limits**: Max 0.5 SOL per transaction
- **Explicit Confirmation**: Every transaction requires user approval
- **Policy Validation**: Address and amount validation before execution
- **Smart Contract Auditing**: Built-in security analysis

## 📁 Project Structure

```
solana-voice-agent/
├── app/
│   ├── api/
│   │   └── parse-intent/
│   │       └── route.ts          # AI intent parsing API
│   ├── components/
│   │   ├── VoiceButton.tsx       # Voice input component
│   │   ├── WalletConnect.tsx    # Wallet connection UI
│   │   ├── SmartContractCreator.tsx # Contract generation/auditing
│   │   └── MasterRouter.tsx      # Main dashboard
│   ├── lib/
│   │   ├── ai.ts                 # AI integration (Groq/OpenAI/Hugging Face)
│   │   ├── solana.ts             # Solana transaction builders
│   │   └── policy.ts             # Security policy engine
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main page
│   └── globals.css               # Global styles
├── providers.tsx                 # Wallet provider setup
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Technical Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Voice**: Web Speech API (browser-native)
- **AI**: Groq AI (Llama 3.1 8B) for fast intent parsing
- **Blockchain**: @solana/web3.js, @solana/wallet-adapter
- **Wallet**: Phantom (via Solana Wallet Adapter)

## 🚨 Important Notes

1. **Browser Compatibility**: Web Speech API works best in Chrome/Edge. Safari support is limited.

2. **Network**: By default, this uses **Solana devnet (testnet)** for safe testing. To switch to mainnet, see `DEVNET_SETUP.md`.

3. **Spending Limits**: Current limits are:
   - Max 0.5 SOL per transaction
   - Max 1.0 SOL per day (tracking not yet implemented)

4. **AI Provider**: Uses Groq AI for fast, reliable responses. See configuration above for alternatives.

## 🐛 Troubleshooting

### "Speech recognition not supported"
- Use Chrome or Edge browser
- Ensure microphone permissions are granted

### "Wallet not connected"
- Install Phantom wallet extension
- Refresh the page and reconnect

### "Transaction failed"
- Check you have enough SOL for fees
- Verify the recipient address is valid
- Check network connection

### "Failed to parse intent"
- Check your AI provider is configured correctly
- For Groq: Verify API key is correct
- For Ollama: Make sure `ollama serve` is running
- For Hugging Face: Verify API key is correct
- Try speaking more clearly

## 🌐 Production Deployment

See `DEPLOY_TO_VERCEL.md` for instructions on deploying to Vercel with Groq AI.

## 🔮 Next Steps (Roadmap)

- [ ] NFT minting via voice
- [ ] Daily spending limit tracking
- [ ] Transaction history
- [ ] Voice confirmation phrases
- [ ] Session-based approvals
- [ ] Mobile app support

## 📝 License

MIT

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. Always verify transactions before signing. Start with small amounts for testing.

