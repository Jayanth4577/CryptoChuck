# 🔄 Updating Existing Frontend Deployment

**Your Situation:** You already have a frontend deployed on Vercel with the old code (without backend integration).

## 🎯 Quick Update Strategy

You have **2 options** - choose based on your preference:

---

## ⚡ Option 1: Gradual Update (RECOMMENDED - Zero Downtime)

This approach deploys the backend first, then updates the frontend to use it.

### Step 1: Deploy Backend (5 minutes)

1. Go to: **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select: `Jayanth4577/CryptoChuck`
4. Settings:
   - **Project Name**: `cryptochuck-backend`
   - **Root Directory**: `backend` ⬅️ IMPORTANT
   - **Framework Preset**: `Other`

5. **Environment Variables** (click "Add" for each):

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
HEN_NFT_ADDRESS=0x115E28745dd5D04d0761D273584c5EcDE7D209E1
HEN_BREEDING_ADDRESS=0x16512a71c72C944b53A643f6de5C5a0Ceb6F9394
HEN_BATTLE_ADDRESS=0x08aB3D806aE9Ad2d5078b6bc220c04080058CC48
HEN_RACING_ADDRESS=0xb2a0a91Da875106921dcE72eB154714C0196DAAB
BETTING_SYSTEM_ADDRESS=0x952411e2CB059f00b3B5Ef9E41DE9adAF2E59841
FRONTEND_URL=https://YOUR-FRONTEND-URL.vercel.app
NODE_ENV=production
```

6. Click **Deploy**
7. **SAVE YOUR BACKEND URL**: e.g., `https://cryptochuck-backend-xyz.vercel.app`

### Step 2: Update Existing Frontend (2 minutes)

1. Go to **Vercel Dashboard** → Find your existing frontend project
2. Click **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Add:
   ```
   Name: VITE_API_URL
   Value: https://cryptochuck-backend-xyz.vercel.app
   ```
5. Click **Save**

### Step 3: Redeploy Frontend (1 minute)

**Method A - Dashboard (Easiest):**
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **⋮** (three dots) menu
4. Click **"Redeploy"**
5. Select **"Use existing Build Cache: No"** ⬅️ IMPORTANT
6. Click **"Redeploy"**

**Method B - Git Push:**
```bash
cd C:\Users\jayan\OneDrive\Documents\BTA\CryptoChuck
git pull origin master
# Vercel will automatically deploy
```

### Step 4: Verify (1 minute)

**Backend Health Check:**
```bash
curl https://YOUR-BACKEND-URL.vercel.app/api/health
```

Expected response:
```json
{"success":true,"status":"healthy","timestamp":"..."}
```

**Frontend Test:**
1. Visit your frontend URL
2. Open browser console (F12)
3. Look for any errors
4. Connect wallet and test minting

---

## 🔥 Option 2: Clean Slate (Start Fresh)

If you want to redeploy everything from scratch:

### Step 1: Delete Old Frontend Deployment (Optional)

1. Go to Vercel Dashboard
2. Find your frontend project
3. Settings → scroll to bottom → **"Delete Project"**

### Step 2: Deploy Backend

Follow **Option 1 - Step 1** above

### Step 3: Deploy Fresh Frontend

1. Go to: **https://vercel.com/new**
2. Import: `Jayanth4577/CryptoChuck`
3. Settings:
   - **Project Name**: `cryptochuck`
   - **Root Directory**: `frontend` ⬅️ IMPORTANT
   - **Framework**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Environment Variables:
```env
VITE_API_URL=https://YOUR-BACKEND-URL.vercel.app
VITE_HEN_NFT_ADDRESS=0x115E28745dd5D04d0761D273584c5EcDE7D209E1
VITE_HEN_BREEDING_ADDRESS=0x16512a71c72C944b53A643f6de5C5a0Ceb6F9394
VITE_HEN_BATTLE_ADDRESS=0x08aB3D806aE9Ad2d5078b6bc220c04080058CC48
VITE_HEN_RACING_ADDRESS=0xb2a0a91Da875106921dcE72eB154714C0196DAAB
VITE_BETTING_SYSTEM_ADDRESS=0x952411e2CB059f00b3B5Ef9E41DE9adAF2E59841
```

5. Deploy

### Step 4: Update Backend CORS

1. Go to backend project → Settings → Environment Variables
2. Edit `FRONTEND_URL` → change to new frontend URL
3. Redeploy backend

---

## 🔍 Troubleshooting

### Issue: "CORS Error" in Browser Console

**Solution:**
1. Go to backend project in Vercel
2. Settings → Environment Variables
3. Update `FRONTEND_URL` to match your actual frontend URL (no trailing slash)
4. Redeploy backend

### Issue: "Failed to fetch" from API

**Solution:**
1. Check backend is deployed: visit `https://YOUR-BACKEND-URL.vercel.app/api/health`
2. Check frontend has `VITE_API_URL` environment variable set
3. Check browser console for exact error message

### Issue: Frontend Build Fails

**Solution:**
The frontend still works without backend API! The API service layer is optional. The app will use direct contract calls if backend is unavailable.

### Issue: Backend Returns 500 Error

**Solution:**
1. Check backend logs: Vercel Dashboard → Backend Project → Deployments → View Function Logs
2. Verify `SEPOLIA_RPC_URL` is correct
3. Verify contract addresses are correct

---

## 📊 What Changes After Update?

### Before (Old Frontend):
- Frontend connects directly to blockchain
- All contract reads happen from user's browser
- Slower initial load times

### After (With Backend):
- Frontend still connects to blockchain for transactions (minting, breeding, etc.)
- Backend provides cached blockchain data (faster reads)
- Better performance for fetching hen lists, battle data, etc.

**Important:** Write operations (minting, breeding, battles) still happen from user's wallet in the frontend. The backend only provides read-only data.

---

## ✅ Recommended: Option 1 (Gradual Update)

**Why?**
- ✅ Zero downtime
- ✅ Keep your existing frontend URL
- ✅ Easy to rollback if issues occur
- ✅ Takes only ~8 minutes total

**Steps Recap:**
1. Deploy backend (new project)
2. Add `VITE_API_URL` to existing frontend
3. Redeploy frontend
4. Done!

---

## 🔐 Security Reminder

⚠️ **IMPORTANT**: Your previous wallet and API keys were compromised. Before production:

1. **Create NEW wallet**
2. **Get NEW Infura API key**: https://infura.io/dashboard
3. **Revoke old keys**
4. **Redeploy contracts** with new wallet
5. **Update all environment variables** with new addresses

---

## 💡 Pro Tips

- **Backend is optional**: Your frontend will work fine without it for now
- **Test backend separately**: Use `curl` or Postman to test API endpoints
- **Monitor logs**: Check Vercel logs if anything fails
- **Use existing URL**: Option 1 keeps your current frontend URL intact

---

## 🆘 Need Help?

Check these files for more details:
- `DEPLOYMENT.md` - Complete deployment guide
- `QUICK_DEPLOY.md` - Quick reference
- `backend/README.md` - API documentation

Or check Vercel logs:
- Dashboard → Your Project → Deployments → View Logs
