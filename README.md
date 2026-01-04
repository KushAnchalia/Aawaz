🔊 Aawaz - Voice-First Web3 Platform
<div align="center">
<img width="1512" height="825" alt="image" src="https://github.com/user-attachments/assets/55767ac3-aef2-40e0-9b7e-a5e873b1dfd0" />
<img width="1512" height="830" alt="image" src="https://github.com/user-attachments/assets/10d6678f-19c0-4811-8ff9-2f8c29a8f8a8" />
<img width="1512" height="830" alt="image" src="https://github.com/user-attachments/assets/bf96a2f5-193f-4288-8bfa-6f6f12ef9802" />\<img width="1512" height="820" alt="image" src="https://github.com/user-attachments/assets/9763e1d0-7869-4c82-b0e0-e914a1100bb1" />
<img width="1512" height="821" alt="image" src="https://github.com/user-attachments/assets/2cb3a2f0-5e9f-493b-a0ff-7ff348b8bec3" />

Web3, powered by voice.
Live Demo • Report Bug • Request Feature
</div>

🌟 What is Aawaz?
Aawaz is a voice-call–based Web3 agent platform that enables users to interact with blockchain systems using natural spoken language. Instead of navigating complex dashboards, writing code, or manually signing multiple transactions, users can simply speak to an intelligent agent and perform on-chain actions securely and hands-free.
🎯 Problem Statement
Current Web3 platforms rely heavily on screens, text, and complex user interfaces, making blockchain interaction difficult, slow, and inaccessible for many users. Executing trades, creating NFTs, interacting with DeFi protocols like Hyperliquid, or building and auditing smart contracts requires technical expertise and manual effort. This excludes non-technical users and creates serious accessibility barriers for people with disabilities.
There is no voice-first system that allows users to call an intelligent agent and perform on-chain actions naturally, the way they speak.
💡 Solution
Aawaz transforms Web3 interaction from a technical, screen-driven experience into a conversational, voice-first interface, empowering traders, creators, developers, and users with disabilities to participate in the decentralized ecosystem with ease and confidence.

✨ Key Features
🎙️ 1. AI Voice Trading Agent
Execute on-chain actions via voice commands with multi-layer security and confirmations.
Example Commands:

"Send 0.1 SOL to ABCD wallet"
"Check my wallet balance"

Features:

Hands-free, secure crypto transactions
Real-time voice feedback
Multi-layer confirmation for safety
Wallet signature authentication


🎤 2. AI Voice NFT Marketplace
Create, buy, and monetize voice as digital assets.
For Creators:

Mint your voice as an NFT
Set usage rights and licensing terms
Earn passive income from voice sales
On-chain consent and revenue splits

For Buyers:

Purchase voice NFTs from creators/celebrities
Generate personalized AI speech using purchased voice models
Example: "Happy Birthday Kush" in Amitabh Bachchan's voice

Accessibility Impact:

Enables people with disabilities to earn through voice-based content creation
No cameras, editing skills, or physical effort required
Monetize voice, personality, and identity directly on-chain


🌐 3. Network Analyzer Agent
Intelligent monitoring of blockchain health and performance.
Capabilities:

Tracks network congestion and latency
Monitors gas fees and failed transactions
Provides real-time network insights
Helps optimize transaction timing


🧩 4. Smart Contract Generator Agent
Generate production-ready smart contracts from natural language.
Example:
"Create a crowdfunding contract with a deadline and refund logic"
Supports:

NFT contracts
DeFi protocols
Token transfers
Custom permissions
Anchor framework (Solana)

Benefits:

Reduces development time
Minimizes human error
Lowers barrier to Web3 development


🛡️ 5. Smart Contract Optimizer & Vulnerability Detection
Advanced security and performance analysis.
Features:

Optimizes contracts for gas efficiency
Detects security vulnerabilities and attack vectors
Suggests best practices
Provides comprehensive security scores
Real-time vulnerability reporting


⚡ 6. Hyperliquid Integration
Voice-based interaction with advanced DeFi trading platform.
Capabilities:

Place orders via voice
Check positions and balances
Monitor market conditions
Execute complex DeFi strategies


♿ Accessibility-First Design
Aawaz is built for everyone, especially people with disabilities.
Who Benefits:
👁️‍🗨️ Visually Impaired Users

Voice-based transactions without screen dependency
Spoken confirmations and audio security prompts
Independent financial access

🦽 Users with Motor Disabilities

Fully voice-driven actions
No manual input required
Removes physical friction

🧠 Neurodivergent Users

Conversational flow
Step-by-step voice confirmations
Reduced cognitive load

💰 Economic Inclusion for Disabled Creators
Aawaz allows people with disabilities to earn by turning their voice into a digital asset. By selling voice NFTs and licensing their voice for personalized audio generation, creators can earn passive income without cameras, editing, or complex tools—using only their voice.

🛠️ Tech Stack
Frontend

Next.js 14 (App Router)
TypeScript
TailwindCSS

AI & Agents

LLM-based intent parsing
Agent orchestration
Function calling
Natural language processing

Blockchain

Solana (Primary chain)
Anchor Framework
SPL Tokens
Metaplex (NFTs)
Solana Web3.js

Wallet Integration

Phantom
WalletConnect


🚀 Getting Started
Prerequisites

Node.js 18+
npm or pnpm
Phantom wallet (for testing)

Installation
bash# Clone the repository
git clone https://github.com/KushAnchalia/Aawaz.git
cd Aawaz

# Install dependencies
npm install
# or
pnpm install

# Set up environment variables
cp env.example .env.local

# Run development server
npm run dev
# or
pnpm dev
Environment Variables
Create a .env.local file:
envNEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
Running Locally
bashnpm run dev
Open http://localhost:3000 to see the application.

🎯 Target Audience
1️⃣ Developers

Agents: Smart Contract Generator, Optimizer, Network Analyzer
Value: Faster development, reduced bugs, production-ready contracts

2️⃣ Traders

Agents: AI Voice Trading Agent, Network Analyzer
Value: Faster execution, hands-free trading, better reaction time

3️⃣ Content Creators

Agents: Voice NFT Marketplace
Value: New revenue stream, ownership of voice, fan engagement

4️⃣ People with Disabilities

All Agents
Value: Equal access, financial independence, economic inclusion


📊 Architecture
Voice → Intent → Action Flow
User Voice Command
       ↓
Speech-to-Text (Web Speech API)
       ↓
Intent Extraction (LLM)
       ↓
Agent Routing
       ↓
Action Validation
       ↓
Wallet Signature
       ↓
Blockchain Execution
       ↓
Voice Confirmation
Security Architecture
Voice Command
    ↓
LLM → Intent Plan
    ↓
Rules Engine → Validation
    ↓
User → Wallet Signature
    ↓
Chain → Execute Transaction
Key Principle: LLM never touches private keys. All transactions require user wallet signature.

🗺️ Roadmap
Phase 1: MVP ✅

 Voice → Intent → Solana transaction
 Smart Contract Generator
 Security Analysis
 Basic UI/UX

Phase 2: Current 🚧

 Voice NFT Marketplace
 Network Analyzer integration
 Hyperliquid integration
 Multi-wallet support

Phase 3: Future 🔮

 Multi-chain support (Ethereum, Polygon)
 Advanced trading strategies
 Mobile app (iOS/Android)
 Voice biometric authentication
 Multilingual support


🤝 Contributing
Contributions are welcome! Here's how you can help:

Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request


📝 Documentation

Quick Start Guide
Smart Contract Setup
Voice NFT Guide
API Documentation


🌍 Social Impact
Aawaz aligns with:

UN SDG 10 – Reduced Inequalities
UN SDG 8 – Decent Work & Economic Growth
UN SDG 9 – Inclusive Innovation

Mission: Enable anyone — regardless of ability — to access, build, trade, and create in Web3 using only their voice.

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

👤 Author
Kush Anchalia

GitHub: @KushAnchalia
Project Link: https://github.com/KushAnchalia/Aawaz
Live Demo: https://aawazi.vercel.app/


🙏 Acknowledgments

Solana Foundation
Anthropic (Claude)
Next.js Team
Anchor Framework


📞 Support
If you have any questions or need support:

Open an Issue
Contact: kushanchalia@gmail.com
Twitter: https://x.com/AnchaliaKush


<div align="center">
Made with ❤️ for an accessible, voice-first Web3
⭐ Star this repo if you find it useful!
Live Demo • Documentation • Report Bug
</div>
