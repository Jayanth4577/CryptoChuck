# 🚀 CryptoChuck - Quick Start Guide

## Prerequisites
- Node.js installed
- MetaMask browser extension
- Terminal/Command prompt

## Setup (5 minutes)

### Step 1: Start Hardhat Node
Open terminal 1:
```bash
cd C:\Users\jayan\OneDrive\Documents\BTA\CryptoChuck
npx hardhat node
```
✅ Keep this terminal running

### Step 2: Deploy Contracts
Open terminal 2:
```bash
cd C:\Users\jayan\OneDrive\Documents\BTA\CryptoChuck
npx hardhat run scripts/deploy.js --network localhost
```
✅ Contracts deployed! Addresses auto-updated in frontend.

### Step 3: Import Test Account to MetaMask
Use this private key to import Account #0:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**How to import:**
1. Open MetaMask
2. Click account icon → "Import Account"
3. Select "Private Key"
4. Paste the key above
5. Click "Import"

✅ You now have ~10,000 ETH!

### Step 4: Add Hardhat Network to MetaMask
1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Fill in:
   - **Network Name**: Hardhat Local
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH
4. Click "Save"
5. Switch to "Hardhat Local" network

### Step 5: Mint Initial Hens
In terminal 2:
```bash
npx hardhat run scripts/mint-initial.js --network localhost
```
✅ 6 hens minted!

### Step 6: Start Frontend
Open terminal 3:
```bash
cd C:\Users\jayan\OneDrive\Documents\BTA\CryptoChuck\frontend
npm run dev
```
✅ Frontend running at http://localhost:3000

### Step 7: Open & Connect
1. Open browser to http://localhost:3000
2. Click "Connect Wallet"
3. Select MetaMask
4. Approve connection

## 🎮 Start Playing!

### Minting
- Go to "Home" or "My Hens"
- Click "Mint New Hen"
- Confirm transaction (0.01 ETH)

### Breeding
- Go to "Breeding"
- Select 2 parent hens
- View predicted offspring
- Click "Breed Hens" (0.01 ETH)

### Battling
- Go to "Battle"
- Select your hen
- Select opponent hen
- Click "Start Battle"
- Watch the battle log!

### Racing
- Go to "Racing"
- View active races
- Click "Enter Race"
- Select your hen
- Confirm entry (0.005 ETH)

### Betting
- Go to "Betting"
- View available battles/races
- Select event
- Choose hen
- Enter bet amount
- Confirm bet

### Marketplace
- Go to "Marketplace"
- List: Select your hen, set price, click "List"
- Buy: Browse listings, click "Buy"
- Delist: Find your listing, click "Delist"

## 🔧 Troubleshooting

### "Wrong Network" Banner
Switch MetaMask to "Hardhat Local" network

### No Hens Showing
Make sure you're using the imported account (0xf39F...)

### Frontend Not Loading
1. Check terminal 3 - is dev server running?
2. Clear browser cache (Ctrl+Shift+R)
3. Restart dev server

### Transactions Failing
1. Check you're on Hardhat Local network
2. Verify sufficient ETH balance
3. Check for cooldown periods

## 📊 Useful Commands

```bash
# Check if node is running
netstat -an | findstr "8545"

# View test accounts with balances
npx hardhat run scripts/show-accounts.js --network localhost

# Test all features
npx hardhat run scripts/test-all-features.js --network localhost

# Clean and redeploy
npx hardhat clean
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

## 💡 Tips

- **Breeding**: Parents need 7 days cooldown before breeding again
- **Battles**: Hens need 1 hour cooldown after each battle
- **Racing**: Speed is the most important stat
- **Marketplace**: Set competitive prices to sell faster
- **Betting**: Check odds before placing bets

## 🎯 What to Try First

1. ✅ Mint 6 hens
2. ✅ Check their traits in "My Hens"
3. ✅ Battle two hens
4. ✅ Enter a race
5. ✅ Breed two hens to create offspring
6. ✅ List a hen on marketplace
7. ✅ Place a bet on a battle

## 📞 Need Help?

Check `FUNCTIONALITY_COMPLETE.md` for detailed documentation of all features.

---

**Enjoy CryptoChuck! 🐔⚔️🏁**
