# 🚀 Quick Deployment Reference

## Backend Deployment (Step 1)

### Vercel Dashboard
1. Visit: https://vercel.com/new
2. Import: `Jayanth4577/CryptoChuck`
3. Settings:
   - **Project Name**: `cryptochuck-backend`
   - **Root Directory**: `backend`
   - **Framework**: `Other`

4. **Environment Variables** (8 required):
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
HEN_NFT_ADDRESS=0x115E28745dd5D04d0761D273584c5EcDE7D209E1
HEN_BREEDING_ADDRESS=0x16512a71c72C944b53A643f6de5C5a0Ceb6F9394
HEN_BATTLE_ADDRESS=0x08aB3D806aE9Ad2d5078b6bc220c04080058CC48
HEN_RACING_ADDRESS=0xb2a0a91Da875106921dcE72eB154714C0196DAAB
BETTING_SYSTEM_ADDRESS=0x952411e2CB059f00b3B5Ef9E41DE9adAF2E59841
FRONTEND_URL=http://localhost:5173
NODE_ENV=production
```

5. Click **Deploy**
6. **Save Backend URL**: `https://cryptochuck-backend.vercel.app` (or your assigned URL)

---

## Frontend Deployment (Step 2)

### Vercel Dashboard
1. Visit: https://vercel.com/new (again)
2. Import: `Jayanth4577/CryptoChuck` (same repo)
3. Settings:
   - **Project Name**: `cryptochuck`
   - **Root Directory**: `frontend`
   - **Framework**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Environment Variables** (6 required):
```
VITE_API_URL=https://cryptochuck-backend.vercel.app
VITE_HEN_NFT_ADDRESS=0x115E28745dd5D04d0761D273584c5EcDE7D209E1
VITE_HEN_BREEDING_ADDRESS=0x16512a71c72C944b53A643f6de5C5a0Ceb6F9394
VITE_HEN_BATTLE_ADDRESS=0x08aB3D806aE9Ad2d5078b6bc220c04080058CC48
VITE_HEN_RACING_ADDRESS=0xb2a0a91Da875106921dcE72eB154714C0196DAAB
VITE_BETTING_SYSTEM_ADDRESS=0x952411e2CB059f00b3B5Ef9E41DE9adAF2E59841
```

5. Click **Deploy**
6. **Save Frontend URL**: `https://cryptochuck.vercel.app` (or your assigned URL)

---

## Update Backend CORS (Step 3)

1. Go to backend Vercel project: `https://vercel.com/dashboard`
2. Select `cryptochuck-backend` project
3. Go to **Settings** → **Environment Variables**
4. Edit `FRONTEND_URL`:
   - Change from: `http://localhost:5173`
   - Change to: `https://cryptochuck.vercel.app` (your frontend URL)
5. Go to **Deployments** tab
6. Click the **...** menu on latest deployment
7. Click **Redeploy**

---

## Verify Deployment

### Backend Health Check
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

### Frontend Test
1. Visit your frontend URL
2. Click **Connect Wallet**
3. Switch MetaMask to **Sepolia Testnet**
4. Try minting a hen

---

## API Endpoints (Backend)

### Hens
- `GET /api/hens/hen/:tokenId` - Get hen details
- `GET /api/hens/user/:address/hens` - Get user's hens
- `GET /api/hens/mint-price` - Get mint price

### Breeding
- `GET /api/breeding/cooldown` - Get cooldown
- `GET /api/breeding/cost` - Get cost

### Battles
- `GET /api/battles/active` - Get active battles
- `GET /api/battles/min-wager` - Get min wager

### Racing
- `GET /api/racing/active` - Get active races
- `GET /api/racing/entry-fee` - Get entry fee

### Betting
- `GET /api/betting/active` - Get active bets
- `GET /api/betting/min-amount` - Get min amount

---

## Troubleshooting

### Backend Issues
- **Check logs**: Vercel Dashboard → Project → Deployments → View Logs
- **Test endpoint**: `curl https://YOUR-BACKEND-URL.vercel.app/api/health`
- **Verify env vars**: Settings → Environment Variables

### Frontend Issues
- **CORS errors**: Update `FRONTEND_URL` in backend and redeploy
- **Contract not found**: Verify MetaMask is on Sepolia (Chain ID: 11155111)
- **API errors**: Check browser console, verify `VITE_API_URL` is correct

### Common Errors
| Error | Solution |
|-------|----------|
| `CORS policy error` | Update backend `FRONTEND_URL` with correct frontend URL |
| `Contract not deployed` | Switch MetaMask to Sepolia testnet |
| `API_URL not defined` | Add `VITE_API_URL` to frontend env vars |
| `500 Internal Server Error` | Check backend logs, verify RPC URL is valid |

---

## Local Development

### Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

Update `frontend/.env.local`:
```
VITE_API_URL=http://localhost:3001
```

---

## Important Notes

⚠️ **Security Reminder**: 
- Your previous wallet was compromised
- Create NEW wallet before production use
- Get NEW API keys (Infura, Etherscan)
- Redeploy contracts with new credentials

📝 **Contract Addresses** (Sepolia):
- Currently using addresses from compromised deployment
- Update after redeploying with new wallet

🔗 **Useful Links**:
- Sepolia Faucet: https://sepoliafaucet.com
- Infura Dashboard: https://infura.io/dashboard
- Etherscan API: https://etherscan.io/myapikey
- Vercel Dashboard: https://vercel.com/dashboard

---

## Next Steps After Deployment

1. ✅ Verify both deployments are working
2. ✅ Test wallet connection
3. ✅ Test hen minting
4. 🔒 **IMPORTANT**: Secure new wallet and redeploy contracts
5. 🎨 Customize frontend domain (optional)
6. 📊 Monitor usage and errors
7. 🚀 Share with users!

---

For detailed explanations, see **DEPLOYMENT.md**
