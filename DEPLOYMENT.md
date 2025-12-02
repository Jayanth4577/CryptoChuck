# 🚀 CryptoChuck - Separate Backend & Frontend Deployment Guide

This guide shows how to deploy the CryptoChuck NFT Game with **separate backend and frontend** on Vercel.

## 📁 Project Structure

```
CryptoChuck/
├── backend/          # Express API server (deployed separately)
│   ├── server.js
│   ├── routes/
│   ├── services/
│   ├── config/
│   └── vercel.json
├── frontend/         # React frontend (deployed separately)
│   ├── src/
│   ├── vite.config.js
│   └── vercel.json
├── contracts/        # Smart contracts
└── scripts/          # Deployment scripts
```

## 🔧 Backend Deployment

### Step 1: Deploy Backend to Vercel

**Option A: Vercel Dashboard** (Recommended)

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select: `Jayanth4577/CryptoChuck`
4. Configure project:
   ```
   Project Name: cryptochuck-backend
   Root Directory: backend
   Framework Preset: Other
   Build Command: (leave empty)
   Output Directory: (leave empty)
   ```

5. **Add Environment Variables:**
   ```
   SEPOLIA_RPC_URL = https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY
   HEN_NFT_ADDRESS = 0x115E28745dd5D04d0761D273584c5EcDE7D209E1
   HEN_BREEDING_ADDRESS = 0x16512a71c72C944b53A643f6de5C5a0Ceb6F9394
   HEN_BATTLE_ADDRESS = 0x08aB3D806aE9Ad2d5078b6bc220c04080058CC48
   HEN_RACING_ADDRESS = 0xb2a0a91Da875106921dcE72eB154714C0196DAAB
   BETTING_SYSTEM_ADDRESS = 0x952411e2CB059f00b3B5Ef9E41DE9adAF2E59841
   FRONTEND_URL = https://your-frontend.vercel.app (update after frontend deployment)
   NODE_ENV = production
   PORT = 3001
   ```

6. Click **"Deploy"**

7. **Save your backend URL**: `https://cryptochuck-backend.vercel.app`

**Option B: Vercel CLI**

```bash
cd backend
vercel login
vercel --prod
```

### Step 2: Test Backend API

Once deployed, test your backend:

```bash
curl https://YOUR-BACKEND-URL.vercel.app/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-12-03T..."
}
```

## 🎨 Frontend Deployment

### Step 1: Update Frontend Environment

Create/update `frontend/.env.local`:

```env
# Backend API URL (from backend deployment)
VITE_API_URL=https://cryptochuck-backend.vercel.app

# Contract Addresses (Sepolia)
VITE_HEN_NFT_ADDRESS=0x115E28745dd5D04d0761D273584c5EcDE7D209E1
VITE_HEN_BREEDING_ADDRESS=0x16512a71c72C944b53A643f6de5C5a0Ceb6F9394
VITE_HEN_BATTLE_ADDRESS=0x08aB3D806aE9Ad2d5078b6bc220c04080058CC48
VITE_HEN_RACING_ADDRESS=0xb2a0a91Da875106921dcE72eB154714C0196DAAB
VITE_BETTING_SYSTEM_ADDRESS=0x952411e2CB059f00b3B5Ef9E41DE9adAF2E59841
```

### Step 2: Deploy Frontend to Vercel

**Option A: Vercel Dashboard** (Recommended)

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select: `Jayanth4577/CryptoChuck` (same repo, different root)
4. Configure project:
   ```
   Project Name: cryptochuck
   Root Directory: frontend
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   ```

5. **Add Environment Variables:**
   ```
   VITE_API_URL = https://cryptochuck-backend.vercel.app
   VITE_HEN_NFT_ADDRESS = 0x115E28745dd5D04d0761D273584c5EcDE7D209E1
   VITE_HEN_BREEDING_ADDRESS = 0x16512a71c72C944b53A643f6de5C5a0Ceb6F9394
   VITE_HEN_BATTLE_ADDRESS = 0x08aB3D806aE9Ad2d5078b6bc220c04080058CC48
   VITE_HEN_RACING_ADDRESS = 0xb2a0a91Da875106921dcE72eB154714C0196DAAB
   VITE_BETTING_SYSTEM_ADDRESS = 0x952411e2CB059f00b3B5Ef9E41DE9adAF2E59841
   ```

6. Click **"Deploy"**

7. **Save your frontend URL**: `https://cryptochuck.vercel.app`

**Option B: Vercel CLI**

```bash
cd frontend
vercel login
vercel --prod
```

### Step 3: Update Backend CORS

After frontend is deployed, update backend environment variable:

1. Go to your backend Vercel project
2. Settings → Environment Variables
3. Update `FRONTEND_URL` to your actual frontend URL:
   ```
   FRONTEND_URL = https://cryptochuck.vercel.app
   ```
4. Redeploy backend (Deployments → click ... → Redeploy)

## 🔄 Local Development

### Backend (Terminal 1)
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:3001
```

### Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

For local development, update `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:3001
```

## 📡 API Endpoints

Your backend provides these endpoints:

### Hens
- `GET /api/hens/hen/:tokenId` - Get hen details
- `GET /api/hens/user/:address/hens` - Get user's hens
- `GET /api/hens/mint-price` - Get mint price

### Breeding
- `GET /api/breeding/cooldown` - Get cooldown period
- `GET /api/breeding/cost` - Get breeding cost

### Battles
- `GET /api/battles/active` - Get active battles
- `GET /api/battles/min-wager` - Get min wager

### Racing
- `GET /api/racing/active` - Get active races
- `GET /api/racing/entry-fee` - Get entry fee

### Betting
- `GET /api/betting/active` - Get active bets
- `GET /api/betting/min-amount` - Get min bet amount

## ✅ Verification Checklist

- [ ] Backend deployed to Vercel
- [ ] Backend environment variables configured
- [ ] Backend API health check passing
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables configured
- [ ] Backend CORS updated with frontend URL
- [ ] Test frontend can connect to backend
- [ ] Test MetaMask connection
- [ ] Test contract interactions

## 🔐 Security Notes

⚠️ **IMPORTANT**: Your previous wallet (`0x3Ee0B4Fd5E991eA2BAceB768d883d0b7B81205c5`) was compromised. You need to:

1. Create a NEW wallet
2. Revoke old Infura API key: https://infura.io/dashboard
3. Revoke old Etherscan API key: https://etherscan.io/myapikey
4. Get new API keys
5. Redeploy contracts with NEW wallet
6. Update both backend and frontend with NEW contract addresses

## 🎯 URLs Summary

After deployment, you'll have:

- **Frontend**: `https://cryptochuck.vercel.app` (user-facing app)
- **Backend**: `https://cryptochuck-backend.vercel.app` (API server)
- **Smart Contracts**: Deployed on Sepolia testnet

## 🐛 Troubleshooting

### Backend Issues
- Check Vercel logs: Dashboard → Your Project → Deployments → View Logs
- Verify environment variables are set
- Test API endpoints with curl or Postman

### Frontend Issues
- Check browser console for errors
- Verify `VITE_API_URL` is correct
- Ensure MetaMask is connected to Sepolia network

### CORS Errors
- Ensure backend `FRONTEND_URL` matches your frontend domain
- Redeploy backend after updating CORS settings

## 📚 Next Steps

1. Deploy backend first
2. Deploy frontend with backend URL
3. Update backend CORS with frontend URL
4. Test end-to-end functionality
5. Monitor both deployments for errors

Good luck! 🚀
