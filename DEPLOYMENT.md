# 🚀 Deploy CryptoChuck Frontend to Vercel

Follow these steps to deploy your frontend to Vercel (free hosting):

## Option 1: Deploy via Vercel Dashboard (Easiest)

### Step 1: Push to GitHub

```bash
# Make sure you're in the project root
cd C:\Users\jayan\OneDrive\Documents\BTA\CryptoChuck

# Initialize git (if not already done)
git init
git add .
git commit -m "Add landing page and prepare for deployment"

# Push to GitHub
git branch -M master
git remote add origin https://github.com/Jayanth4577/CryptoChuck.git
git push -u origin master
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your `CryptoChuck` repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Click "Deploy"

Your site will be live at: `https://cryptochuck.vercel.app` (or similar)

---

## Option 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```powershell
npm install -g vercel
```

### Step 2: Login to Vercel

```powershell
vercel login
```

### Step 3: Deploy

```powershell
# Navigate to frontend directory
cd frontend

# Deploy
vercel --prod
```

Answer the prompts:
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- Project name? **cryptochuck**
- Directory? **./
**
- Want to override settings? **N**

---

## Configuration

### Update Contract Addresses for Sepolia

Make sure `frontend/src/config/contracts.js` has Sepolia addresses:

```javascript
export const CONTRACT_ADDRESSES = {
  henNFT: '0x115E28745dd5D04d0761D273584c5EcDE7D209E1',
  henBreeding: '0x16512a71c72C944b53A643f6de5C5a0Ceb6F9394',
  henBattle: '0x08aB3D806aE9Ad2d5078b6bc220c04080058CC48',
  henRacing: '0xb2a0a91Da875106921dcE72eB154714C0196DAAB',
  bettingSystem: '0x952411e2CB059f00b3B5Ef9E41DE9adAF2E59841'
};

export const NETWORK_CONFIG = {
  chainId: 11155111,
  name: 'Sepolia Testnet',
  rpcUrl: 'https://sepolia.infura.io/v3/56c857ab8ed5406b86d247e317ff7672',
  blockExplorer: 'https://sepolia.etherscan.io'
};
```

---

## Testing Your Deployed Site

1. Visit your Vercel URL
2. Connect MetaMask to Sepolia network
3. Test all features:
   - Landing page loads
   - Wallet connection works
   - Minting hens
   - Battles, races, breeding
   - Betting system
   - Marketplace

---

## Custom Domain (Optional)

1. In Vercel dashboard, go to Project Settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS settings as instructed

---

## Environment Variables (If Needed)

If you need to add environment variables:

1. Go to Project Settings in Vercel
2. Click "Environment Variables"
3. Add variables (like API keys)
4. Redeploy

---

## Continuous Deployment

Every time you push to GitHub master branch, Vercel will automatically redeploy!

```bash
git add .
git commit -m "Update feature"
git push origin master
# Vercel auto-deploys!
```

---

## Troubleshooting

### Build Fails

Check that `frontend/package.json` has:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Routing Issues

Make sure `frontend/vercel.json` exists with SPA config

### Blank Page

Check browser console for errors. Usually MetaMask connection issues.

---

## Share Your Game

Once deployed, share this info:

**🎮 Play CryptoChuck:**
- Website: https://your-url.vercel.app
- Network: Sepolia Testnet
- Get test ETH: https://sepoliafaucet.com

**📋 Quick Start:**
1. Install MetaMask
2. Add Sepolia network
3. Get free test ETH
4. Visit site and connect wallet
5. Mint your first hen!

---

## Performance Optimization

For better performance, add to `frontend/vite.config.js`:

```javascript
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ethers: ['ethers']
        }
      }
    }
  }
}
```

---

## Analytics (Optional)

Add Vercel Analytics:

```bash
cd frontend
npm install @vercel/analytics
```

In `frontend/src/main.jsx`:
```javascript
import { inject } from '@vercel/analytics';
inject();
```

---

Your CryptoChuck game is now live and accessible worldwide! 🎉
