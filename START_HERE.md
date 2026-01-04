# 🎯 START HERE - Simple Instructions

## 📱 Wallet: Use **Phantom**

1. **Install Phantom**: https://phantom.app
2. **Create/Import wallet** (save seed phrase!)
3. **Fund it** with SOL (or use devnet for testing)

---

## 🏃 Run in 3 Steps

### Step 1: Install Dependencies
```bash
cd /Users/kanchali/Solana
npm install
```

### Step 2: Add OpenAI Key
```bash
# Create .env.local file
echo "OPENAI_API_KEY=sk-your-key-here" > .env.local
```
Get key from: https://platform.openai.com/api-keys

### Step 3: Run
```bash
npm run dev
```

Then open: **http://localhost:3000**

---

## 🎤 How to Use

1. **Connect Phantom** wallet
2. Click **"🎤 Start Voice Command"**
3. Say: **"Send 0.1 SOL to [address]"**
4. **Confirm** → **Sign in Phantom** → Done!

---

## ⚡ Quick Run (All-in-One)

```bash
./run.sh
```

This script will:
- Check Node.js
- Create .env.local (asks for API key)
- Install dependencies
- Start server

---

## 🧪 Test First on Devnet

1. Edit `app/lib/solana.ts`
2. Change to: `"https://api.devnet.solana.com"`
3. Get free SOL: https://faucet.solana.com
4. Test safely!

---

## ❓ Need More Help?

- **Full Guide**: See `QUICK_START.md`
- **Troubleshooting**: See `QUICK_START.md` → Troubleshooting section

