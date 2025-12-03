# 🎁 Registration System Setup Guide

## Overview

The registration system allows new users to receive **2 free hen NFTs** automatically when they sign up. This removes the barrier of entry and helps onboard new players.

## Architecture

### Components:
1. **UserRegistry Smart Contract** - Tracks registered users on-chain
2. **Backend Registration API** - Sponsors mints using a funded wallet
3. **Frontend Registration UI** - Beautiful onboarding experience

---

## 🚀 Deployment Steps

### Step 1: Deploy UserRegistry Contract

```bash
# Add deployment script
cd CryptoChuck
```

Create `scripts/deploy-registry.js`:
```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying UserRegistry...");
  
  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const registry = await UserRegistry.deploy();
  await registry.waitForDeployment();
  
  const address = await registry.getAddress();
  console.log("UserRegistry deployed to:", address);
  
  // Save address
  const fs = require('fs');
  fs.appendFileSync('.env', `\nUSER_REGISTRY_ADDRESS=${address}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy-registry.js --network sepolia
```

**Copy the deployed address** - you'll need it next.

---

### Step 2: Setup Sponsorship Wallet

The sponsorship wallet pays for new users' hen mints.

#### Create New Wallet:
```bash
# In MetaMask:
# 1. Create new account
# 2. Name it "CryptoChuck Sponsor"
# 3. Export private key
```

#### Fund the Wallet:
```bash
# Send Sepolia ETH to sponsor wallet
# Recommended: 1-2 ETH (supports ~50-100 registrations)

# Each registration costs approximately:
# - 2 mints: 0.02 ETH
# - Gas fees: ~0.005-0.01 ETH
# - Total: ~0.025-0.03 ETH per user
```

---

### Step 3: Configure Backend

Add to `backend/.env`:
```env
# Registration System
USER_REGISTRY_ADDRESS=0xYourRegistryAddress
SPONSOR_PRIVATE_KEY=0xYourSponsorWalletPrivateKey

# Existing variables
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
FRONTEND_URL=https://cryptochuck.vercel.app
```

**⚠️ SECURITY WARNING:**
- Never commit `.env` file
- Never share sponsor private key
- Use a dedicated wallet only for sponsorship
- Monitor wallet balance regularly

---

### Step 4: Add UserRegistry ABI to Backend

```bash
# Copy ABI file
cp artifacts/contracts/UserRegistry.sol/UserRegistry.json backend/abis/
```

---

### Step 5: Deploy Backend to Vercel

```bash
cd backend

# Make sure registrationRoutes.js is included
git add .
git commit -m "Add registration system"
git push

# Vercel will auto-deploy
```

Add environment variables in Vercel:
- Go to Vercel Dashboard → Backend Project → Settings → Environment Variables
- Add: `USER_REGISTRY_ADDRESS`
- Add: `SPONSOR_PRIVATE_KEY`

Redeploy backend after adding env vars.

---

### Step 6: Update Frontend

The Registration component is already created. Just import it in your main App:

```javascript
// In frontend/src/App.jsx
import Registration from './components/Registration';

function App() {
  const [account, setAccount] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  
  return (
    <div>
      {showRegistration && (
        <Registration 
          account={account}
          onRegistrationComplete={(data) => {
            console.log('User registered:', data);
            setShowRegistration(false);
            // Refresh user's hens
          }}
        />
      )}
    </div>
  );
}
```

---

### Step 7: Deploy Frontend to Vercel

```bash
cd frontend
git add .
git commit -m "Add registration UI"
git push

# Vercel auto-deploys
```

---

## 🧪 Testing

### Test Registration Flow:

1. **Create test wallet** in MetaMask
2. **Visit your app** with new wallet
3. **Click Register**
4. **Wait 30-60 seconds** for:
   - Registry contract call
   - 2 hen mints
   - 2 transfers to user wallet
5. **Check wallet** - should have 2 hens!

### Monitor Sponsor Wallet:

```bash
# Check balance regularly
# When balance < 0.5 ETH, refund from faucets
```

---

## 💰 Cost Analysis

### Per Registration:
- Minting cost: 2 × 0.01 ETH = **0.02 ETH**
- Registry gas: ~**0.002 ETH**
- Transfer gas: 2 × ~0.001 ETH = **0.002 ETH**
- **Total: ~0.024 ETH per user**

### Budget Planning:
- 10 users: 0.24 ETH
- 50 users: 1.2 ETH
- 100 users: 2.4 ETH

**Get Sepolia ETH from faucets:**
- https://sepoliafaucet.com (0.5 ETH/day)
- https://www.infura.io/faucet/sepolia (0.5 ETH/day)
- https://faucet.quicknode.com/ethereum/sepolia (0.5 ETH/day)

---

## 🔒 Security Features

### Built-in Protection:
✅ One registration per wallet address
✅ Email deduplication (optional)
✅ Rate limiting (3 attempts per hour per IP)
✅ Owner-only registry writes
✅ Sponsor key never exposed to frontend

### Best Practices:
- Monitor sponsor wallet balance
- Set up alerts for low balance
- Regularly check registration stats
- Review unusual registration patterns

---

## 📊 API Usage

### Check if User Registered:
```javascript
const response = await fetch(`${API_URL}/api/registration/check/${address}`);
const data = await response.json();
console.log(data.isRegistered); // true/false
```

### Register New User:
```javascript
const response = await fetch(`${API_URL}/api/registration/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: '0x...',
    email: 'user@example.com' // optional
  })
});
```

### Get Stats:
```javascript
const response = await fetch(`${API_URL}/api/registration/stats`);
const data = await response.json();
console.log(data.stats.totalRegistrations);
```

---

## 🎯 Next Steps

After deployment:
1. ✅ Test with multiple wallets
2. ✅ Monitor sponsor wallet balance
3. ✅ Set up balance alerts
4. ✅ Update README with registration info
5. ✅ Share registration link with users!

---

## 🆘 Troubleshooting

### Error: "Sponsorship wallet needs funding"
**Solution**: Send more Sepolia ETH to sponsor wallet

### Error: "User already registered"
**Solution**: User can only register once per wallet

### Error: "Too many registration attempts"
**Solution**: Wait 1 hour or try different network/IP

### Transactions Taking Long
**Solution**: Normal! Registration involves multiple transactions (registry + 2 mints + 2 transfers). Can take 30-90 seconds.

---

## 📞 Support

Need help? Check:
- Backend logs in Vercel dashboard
- Frontend console for errors
- Sponsor wallet balance
- Sepolia testnet status

---

**🎉 Congratulations! Your registration system is ready to onboard new players!**
