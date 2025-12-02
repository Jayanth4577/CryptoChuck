# 🔒 Security Guide for CryptoChuck

## ⚠️ CRITICAL: Private Key Security

### Current Security Issue

If you have **committed your `.env` file to Git** or **shared your private key**, your wallet is compromised. Follow these steps immediately:

### 1. Rotate Your Private Key (URGENT)

1. **Create a NEW wallet** in MetaMask:
   - Open MetaMask → Click account icon → "Create Account"
   - Name it "CryptoChuck Deployment" or similar
   - **Save the NEW private key securely** (never share it!)

2. **Transfer remaining funds** from old wallet to new wallet:
   - Send any test ETH from compromised wallet to new wallet
   - Record the new wallet address

3. **Update `.env` file** with the new private key:
   ```env
   PRIVATE_KEY=your_new_private_key_here
   INFURA_API_KEY=your_infura_key
   ETHERSCAN_API_KEY=your_etherscan_key
   ```

4. **NEVER commit `.env` again**:
   - Verify `.env` is in `.gitignore`
   - Run: `git rm --cached .env` (if previously committed)
   - Commit: `git commit -m "Remove .env from tracking"`

### 2. Verify `.gitignore` Configuration

Make sure your `.gitignore` includes:

```gitignore
# Environment variables
.env
.env.local
.env.production

# Private keys
*.pem
*.key
hardhat.config.js (if it contains keys)

# Secrets
secrets/
private/
```

### 3. Check Git History for Exposed Keys

```powershell
# Check if .env was ever committed
git log --all --full-history -- .env

# If found, consider using BFG Repo-Cleaner to remove from history
# https://rtyley.github.io/bfg-repo-cleaner/
```

---

## 🎯 Best Practices for Production

### Use Deployment-Only Wallets

**NEVER use your main wallet for smart contract deployment!**

1. **Main Wallet**: Your personal funds (high value)
2. **Deployment Wallet**: Contract deployment only (minimal ETH)
3. **Testing Wallet**: Sepolia testnet testing (free test ETH)

### Secure Your Private Keys

| ✅ DO | ❌ DON'T |
|-------|----------|
| Store keys in `.env` (not tracked by Git) | Commit `.env` to GitHub |
| Use hardware wallets for mainnet | Share private keys in Discord/Telegram |
| Use different wallets for dev/prod | Store keys in frontend code |
| Enable 2FA on all accounts | Hardcode keys in contracts |
| Backup keys offline (paper/USB) | Screenshot keys and share them |

### Environment Variable Management

**For Local Development:**
```env
# .env (NEVER commit this file)
PRIVATE_KEY=0xYourPrivateKeyHere
INFURA_API_KEY=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**For Production (Vercel, etc.):**
- Use Vercel's Environment Variables UI
- Set as "Encrypted" and "Production only"
- Never expose in frontend code

---

## 🚨 What to Do If Key is Exposed

### Immediate Actions (Within 1 hour)

1. **Transfer ALL funds** to a new, secure wallet
2. **Revoke all contract approvals** on exposed wallet:
   - Visit: https://revoke.cash
   - Connect compromised wallet
   - Revoke all token approvals

3. **Alert team members** if this is a shared project

4. **Rotate API keys**:
   - Generate new Infura API key
   - Generate new Etherscan API key
   - Update `.env` with new keys

### Investigation (Within 24 hours)

1. Check blockchain explorer for unauthorized transactions:
   - Sepolia: https://sepolia.etherscan.io/address/YOUR_ADDRESS
   - Mainnet: https://etherscan.io/address/YOUR_ADDRESS

2. Review all contract ownerships and permissions

3. Document the breach for future reference

---

## 🛡️ Contract Security Best Practices

### Smart Contract Ownership

The deployed contracts use `Ownable` pattern. After deployment:

1. **Transfer ownership** to a multi-sig wallet (Gnosis Safe)
2. **Renounce ownership** if contracts are meant to be immutable
3. **Use Timelock** for critical functions

Example:
```solidity
// In HenNFT.sol
function transferOwnership(address newOwner) public onlyOwner {
    // Only call this with a secure multi-sig wallet
    super.transferOwnership(newOwner);
}
```

### Access Control

Current contracts have authorized addresses:
- `breedingContract` can mint offspring
- `battleContract` can update battle stats
- `racingContract` can update race stats

**Verify these addresses after deployment!**

```javascript
// After deployment, verify in console
await henNFT.breedingContract(); // Should match deployed HenBreeding address
await henNFT.battleContract();   // Should match deployed HenBattle address
await henNFT.racingContract();   // Should match deployed HenRacing address
```

---

## 🔐 Production Deployment Checklist

Before deploying to mainnet:

### Pre-Deployment

- [ ] Create dedicated deployment wallet
- [ ] Fund wallet with minimum required ETH (estimate gas costs)
- [ ] Test all contracts on Sepolia testnet
- [ ] Run security audit (or use automated tools like Slither)
- [ ] Enable contract verification on Etherscan
- [ ] Document all contract addresses

### Post-Deployment

- [ ] Verify all contracts on Etherscan
- [ ] Transfer ownership to multi-sig wallet
- [ ] Set authorized contract addresses
- [ ] Test all functions with small amounts
- [ ] Monitor first 24 hours for suspicious activity
- [ ] Backup all deployment details offline

### Monitoring

- [ ] Set up Etherscan alerts for contract activity
- [ ] Monitor contract balance daily
- [ ] Check for unusual transaction patterns
- [ ] Review contract events regularly

---

## 📞 Incident Response Contacts

### If You Discover a Vulnerability

1. **DO NOT** publicly disclose it
2. Email security contact (if applicable)
3. Pause contracts if possible (if pausable)
4. Document the issue thoroughly

### Emergency Contract Pause

If your contracts have pausable functionality:

```javascript
// Emergency pause
await henNFT.pause();
await henBreeding.pause();
await henBattle.pause();
```

---

## 🔗 Useful Security Resources

### Audit Tools
- **Slither**: Static analysis for Solidity
- **Mythril**: Security analysis tool
- **Securify**: Automated security scanner

### Learning Resources
- [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/4.x/security)
- [ConsenSys Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Solidity Security Considerations](https://docs.soliditylang.org/en/latest/security-considerations.html)

### Incident Response
- [Rekt News](https://rekt.news/) - Learn from past hacks
- [Blockchain Security DB](https://consensys.github.io/blockchainSecurityDB/)

---

## ✅ Security Checklist Summary

- [ ] Private keys stored in `.env` (not committed to Git)
- [ ] `.gitignore` configured correctly
- [ ] Using deployment-only wallet (not main wallet)
- [ ] Hardware wallet for mainnet deployments
- [ ] Contract ownership transferred to multi-sig
- [ ] All contract addresses verified
- [ ] Emergency pause mechanism tested
- [ ] Monitoring set up for suspicious activity
- [ ] Team educated on security best practices
- [ ] Incident response plan documented

---

**Remember**: Security is an ongoing process, not a one-time setup. Stay vigilant! 🛡️
