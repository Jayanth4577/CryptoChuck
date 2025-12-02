# 📖 Backend Deployment - Detailed Walkthrough

## 🎯 What You're Doing

You're creating a **NEW separate project** on Vercel for your backend API server. This will run **alongside** your existing frontend (they're independent projects using the same GitHub repo but different folders).

---

## ⏱️ Time Needed: ~5 minutes

---

## 📝 Step-by-Step Instructions

### STEP 1: Open Vercel's Import Page

1. Go to: **https://vercel.com/new**
2. You'll see a page titled **"Import Git Repository"**
3. Make sure you're logged in (same Vercel account as your frontend)

---

### STEP 2: Select Your GitHub Repository

1. Look for the search box that says **"Search for a repository..."**
2. Type or find: **`Jayanth4577/CryptoChuck`**
3. Click on it when it appears
4. Click the **"Import"** button next to the repository name

**❓ Why the same repo as your frontend?**
> Because we organized your backend and frontend in **separate folders** (`backend/` and `frontend/`). Vercel will deploy only the folder you specify in the next step.

---

### STEP 3: Configure the Project

You'll see a **"Configure Project"** page. Fill in these settings:

#### A) Project Name
```
Field: "Project Name"
Value: cryptochuck-backend
```
💡 **Tip:** Name it differently from your frontend project (e.g., if frontend is "cryptochuck", use "cryptochuck-backend")

#### B) Root Directory ⚠️ **MOST IMPORTANT!**
```
Look for: "Root Directory" section
Action: Click the "Edit" button
Selection: Choose "backend" from the dropdown
```

**Visual guide:**
```
Root Directory
├─ 📁 contracts/          ❌ Don't choose this
├─ 📁 backend/            ✅ CHOOSE THIS ONE!
├─ 📁 frontend/           ❌ Don't choose this
└─ 📁 scripts/            ❌ Don't choose this
```

💡 **Why is this important?**
> This tells Vercel to **ONLY deploy the backend folder**, not the entire project. Without this, Vercel would try to deploy the whole repo and fail.

#### C) Framework Preset
```
Field: "Framework Preset"
Selection: Other
```
💡 We're using Express.js, which isn't in the preset dropdown.

#### D) Build Settings (Leave as defaults)
```
Build Command: (leave empty or default)
Output Directory: (leave empty or default)
Install Command: (leave empty or default)
```

---

### STEP 4: Add Environment Variables ⚠️ **CRITICAL STEP!**

Scroll down to the **"Environment Variables"** section. You need to add **8 variables**.

Click **"Add"** or **"Add Another"** for each variable:

---

#### Variable 1: Blockchain Connection
```
Name: SEPOLIA_RPC_URL
Value: https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY
```

**Where to get YOUR_INFURA_API_KEY:**
1. Go to https://infura.io/dashboard
2. Login or create account
3. Create new API key or use existing one
4. Copy the API key
5. Replace `YOUR_INFURA_API_KEY` with your actual key

**Example:**
```
https://sepolia.infura.io/v3/abc123def456ghi789
```

💡 **What this does:** Connects your backend to the Sepolia testnet blockchain.

---

#### Variables 2-6: Contract Addresses

These tell the backend which smart contracts to read data from:

```
Name: HEN_NFT_ADDRESS
Value: 0x115E28745dd5D04d0761D273584c5EcDE7D209E1
```

```
Name: HEN_BREEDING_ADDRESS
Value: 0x16512a71c72C944b53A643f6de5C5a0Ceb6F9394
```

```
Name: HEN_BATTLE_ADDRESS
Value: 0x08aB3D806aE9Ad2d5078b6bc220c04080058CC48
```

```
Name: HEN_RACING_ADDRESS
Value: 0xb2a0a91Da875106921dcE72eB154714C0196DAAB
```

```
Name: BETTING_SYSTEM_ADDRESS
Value: 0x952411e2CB059f00b3B5Ef9E41DE9adAF2E59841
```

💡 **What these do:** These are the addresses of your deployed smart contracts on Sepolia testnet. The backend reads blockchain data from these contracts.

---

#### Variable 7: CORS Configuration
```
Name: FRONTEND_URL
Value: https://YOUR-ACTUAL-FRONTEND-URL.vercel.app
```

**How to find YOUR frontend URL:**
1. Go to https://vercel.com/dashboard
2. Click on your existing frontend project
3. Look at the top - you'll see the URL (e.g., `https://cryptochuck-abc123.vercel.app`)
4. Copy that EXACT URL
5. Paste it here (no trailing slash!)

**Examples of correct URLs:**
- ✅ `https://cryptochuck.vercel.app`
- ✅ `https://cryptochuck-abc123.vercel.app`
- ✅ `https://my-game.vercel.app`

**Common mistakes:**
- ❌ `https://cryptochuck.vercel.app/` (no trailing slash!)
- ❌ `http://cryptochuck.vercel.app` (should be https)
- ❌ `cryptochuck.vercel.app` (missing https://)

💡 **What this does:** Allows your frontend to make API calls to the backend (CORS security).

---

#### Variable 8: Environment Mode
```
Name: NODE_ENV
Value: production
```

💡 **What this does:** Tells the backend it's running in production mode (affects error messages and logging).

---

### STEP 5: Deploy! 🚀

1. **Review all settings** - scroll up and double-check:
   - ✅ Root Directory is set to `backend`
   - ✅ All 8 environment variables are added
   - ✅ FRONTEND_URL matches your actual frontend URL

2. Click the big blue **"Deploy"** button

3. **Wait 2-3 minutes** while Vercel:
   - Clones your repository
   - Installs dependencies (`npm install`)
   - Starts your Express server
   - Makes it live

4. You'll see:
   - Progress logs scrolling
   - A success screen with confetti 🎉
   - Your deployment URL

---

### STEP 6: Save Your Backend URL 📝

After deployment succeeds:

1. **Copy the URL** shown on the success screen
   - It will look like: `https://cryptochuck-backend-xyz123.vercel.app`
   - Or similar with random characters

2. **Test it immediately:**
   - Click **"Visit"** or paste URL in browser
   - You should see a JSON response like:
   ```json
   {
     "success": true,
     "message": "CryptoChuck Backend API",
     "version": "1.0.0",
     "endpoints": {
       "hens": "/api/hens",
       "breeding": "/api/breeding",
       "battles": "/api/battles",
       "racing": "/api/racing",
       "betting": "/api/betting"
     }
   }
   ```

3. **Test the health check:**
   - Add `/api/health` to your URL
   - Visit: `https://YOUR-BACKEND-URL.vercel.app/api/health`
   - Should see:
   ```json
   {
     "success": true,
     "status": "healthy",
     "timestamp": "2025-12-03T..."
   }
   ```

4. **Save this URL!** You'll need it for Step 2 (updating frontend).

---

## ✅ What You've Accomplished

After completing this step, you have:

- ✅ A **separate backend API server** running on Vercel
- ✅ Backend **connected to Sepolia blockchain** via Infura
- ✅ Backend configured with your **smart contract addresses**
- ✅ **CORS enabled** so your frontend can call the API
- ✅ A **live API endpoint URL** ready to use

---

## 🔍 Visual Summary

```
BEFORE:
┌─────────────────────────┐
│  Your Frontend (Vercel) │  ← Already deployed
│  cryptochuck.vercel.app │
└─────────────────────────┘

AFTER:
┌─────────────────────────┐
│  Your Frontend (Vercel) │  ← Already deployed
│  cryptochuck.vercel.app │
└─────────────────────────┘
            ↓ calls API
┌─────────────────────────┐
│  Your Backend (Vercel)  │  ← Just deployed! ✨
│  cryptochuck-backend... │
└─────────────────────────┘
            ↓ reads data
┌─────────────────────────┐
│  Sepolia Blockchain     │
│  Smart Contracts        │
└─────────────────────────┘
```

---

## 🎯 Next Step

Now that your backend is deployed, you need to:
- **Update your frontend** to use this backend URL
- See **UPDATE_EXISTING.md → Step 2** for instructions

---

## 🐛 Troubleshooting

### Issue: Can't find my repository
**Solution:** Make sure you're logged into Vercel with the same account that has access to your GitHub.

### Issue: Root Directory option not visible
**Solution:** Click the **"Edit"** button next to "Root Directory" to reveal the folder selector.

### Issue: Deployment fails
**Solution:** 
1. Check Vercel logs (click "View Function Logs")
2. Verify all 8 environment variables are set correctly
3. Make sure Root Directory is set to `backend`

### Issue: Backend URL returns 404
**Solution:**
1. Make sure deployment finished successfully (green checkmark)
2. Wait 30 seconds after deployment
3. Try the health check: `/api/health`

### Issue: SEPOLIA_RPC_URL error
**Solution:**
1. Get a new Infura API key: https://infura.io/dashboard
2. Make sure the URL format is: `https://sepolia.infura.io/v3/YOUR_KEY`
3. Update environment variable in Vercel
4. Redeploy

---

## 💡 Pro Tips

1. **Test each API endpoint:**
   - `/api/hens/mint-price`
   - `/api/breeding/cost`
   - `/api/battles/min-wager`

2. **Bookmark your backend URL** - you'll reference it often

3. **Check logs** if anything doesn't work: Vercel Dashboard → Your Project → Deployments → View Logs

4. **Environment variables** can be updated anytime in: Settings → Environment Variables (then redeploy)

---

## 📚 Related Documentation

- **UPDATE_EXISTING.md** - Full update guide for your situation
- **backend/README.md** - API endpoint documentation
- **DEPLOYMENT.md** - Complete deployment reference
