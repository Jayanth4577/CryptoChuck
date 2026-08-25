# 🐔 CryptoChuck - NFT Gaming Platform

## 🌐 Live Deployment

**🎮 Play Now**: [cryptochuck.vercel.app](https://cryptochuck.vercel.app)  
**🔌 Backend API**: [cryptochuck-backend.vercel.app](https://cryptochuck-backend.vercel.app)  
**🌍 Network**: Sepolia Testnet (Chain ID: 11155111)

---

## 📊 Deployed Smart Contracts

All contracts are live on **Sepolia Testnet** and verified on Etherscan:

```
HenNFT:        0x115E28745dd5D04d0761D273584c5EcDE7D209E1
HenBreeding:   0x16512a71c72C944b53A643f6de5C5a0Ceb6F9394
HenBattle:     0x08aB3D806aE9Ad2d5078b6bc220c04080058CC48
HenRacing:     0xb2a0a91Da875106921dcE72eB154714C0196DAAB
BettingSystem: 0x952411e2CB059f00b3B5Ef9E41DE9adAF2E59841
```

**Deployment Date**: November 25, 2025  
**View on Etherscan**: [View Contracts →](https://sepolia.etherscan.io/address/0x115E28745dd5D04d0761D273584c5EcDE7D209E1)

---

## 🎮 What is CryptoChuck?

A **blockchain-based NFT gaming platform** where players:
- 🐣 **Mint & Own** unique hen NFTs with genetic traits
- 🧬 **Breed** hens to create new offspring with inherited genetics
- ⚔️ **Battle** other players' hens in combat arenas
- 🏁 **Race** in competitions for prizes
- 💰 **Trade** hens in the marketplace
- 🎰 **Bet** on battle and race outcomes

---

## ✅ Production Status

### Live Features
- ✅ **Frontend**: React app deployed on Vercel
- ✅ **Backend**: Express API deployed on Vercel (serverless)
- ✅ **Smart Contracts**: Deployed on Sepolia testnet
- ✅ **NFT Minting**: Mint hens with unique traits
- ✅ **Breeding System**: Genetic inheritance algorithm
- ✅ **Battle Arena**: PvP combat mechanics
- ✅ **Racing Events**: Multi-player races
- ✅ **Marketplace**: Buy/sell/trade hens
- ✅ **Betting System**: Wager on events
- ✅ **Wallet Integration**: MetaMask support

---

## 📁 Architecture

```
CryptoChuck/
├── contracts/              # Solidity Smart Contracts
│   ├── HenNFT.sol         # ERC-721 NFT contract
│   ├── HenBreeding.sol    # Breeding mechanics
│   ├── HenBattle.sol      # Battle system
│   ├── HenRacing.sol      # Racing events
│   └── BettingSystem.sol  # Betting platform
│
├── backend/               # Express.js API (Vercel Serverless)
│   ├── server.js         # Main API server
│   ├── config/           # Contract addresses & ABIs
│   ├── services/         # Blockchain interaction layer
│   ├── routes/           # API endpoints
│   │   ├── henRoutes.js
│   │   ├── breedingRoutes.js
│   │   ├── battleRoutes.js
│   │   ├── racingRoutes.js
│   │   └── bettingRoutes.js
│   └── vercel.json       # Vercel deployment config
│
├── frontend/              # React + Vite (Vercel)
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── services/     # API client
│   │   ├── abis/         # Contract ABIs
│   │   └── App.jsx       # Main app
│   └── vercel.json       # Vercel deployment config
│
├── scripts/               # Deployment scripts
│   ├── deploy.js         # Deploy contracts
│   └── mint-initial.js   # Mint test NFTs
│
└── test/                  # Smart contract tests
```

---

## 🚀 Getting Started

### For Players

#### 🎮 Quick Start:

1. **Visit the App**: [cryptochuck.vercel.app](https://cryptochuck.vercel.app)
2. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask
3. **Switch Network**: Change to Sepolia Testnet in MetaMask
4. **Get Test ETH**: Visit [Sepolia Faucet](https://sepoliafaucet.com) for FREE test ETH
5. **Mint Hens**: Click "My Hens" tab and mint your first hen (0.01 ETH)
6. **Start Playing**: Breed, battle, race, and trade!

**Get free Sepolia ETH from faucets - enough for 50+ hens!** 🎉

### For Developers

#### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Git

#### Local Development Setup

**Option 1: Connect to Live Sepolia Contracts**
```bash
# Clone repository
git clone https://github.com/Jayanth4577/CryptoChuck.git
cd CryptoChuck

# Install dependencies
npm install

# Start frontend locally
cd frontend
npm install
npm run dev
```
Frontend will run on `http://localhost:3000` and connect to live Sepolia contracts.

**Option 2: Full Local Blockchain**
```bash
# Terminal 1: Start Hardhat node
npm run node

# Terminal 2: Deploy contracts locally
npm run deploy:local

# Terminal 3: Start backend API
cd backend
npm install
npm run dev

# Terminal 4: Start frontend
cd frontend
npm install
npm run dev
```

---

## 🛠️ Technology Stack

### Blockchain
- **Smart Contracts**: Solidity 0.8.20
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin (ERC-721, Ownable, ReentrancyGuard)
- **Network**: Ethereum Sepolia Testnet
- **Web3 Library**: ethers.js v6

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Deployment**: Vercel Serverless Functions
- **API Style**: RESTful
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: CSS Modules
- **Wallet**: MetaMask integration
- **Deployment**: Vercel

### NFT System
Each hen is an ERC-721 NFT with 5 genetic traits:
- **Strength**: Combat power
- **Speed**: Racing ability  
- **Stamina**: Endurance in events
- **Intelligence**: Battle strategy
- **Luck**: Random event modifier

**Power Formula**: `(Strength + Speed + Stamina + Intelligence + Luck) / 5`
- **Intelligence**: Battle strategy
- **Luck**: Random event modifier

**Power Formula**: `(Strength + Speed + Stamina + Intelligence + Luck) / 5`

### Breeding
- Costs: **0.01 ETH**
- Cooldown: **7 days** between breeds
- Genetics: Offspring inherit parent traits ±5 mutation
- Generations: Max 10 generations
- Restrictions: No inbreeding (same parents/offspring)

### Battles
- Combat based on all 5 traits
- **1 hour cooldown** after battle
- Winner gets ETH rewards
- Loser gets participation rewards
- Full battle logs and statistics

### Racing
- Entry fee: **0.005 ETH**
- Up to **20 participants** per race
- Speed-based algorithm
- Prize pool distribution:
  - 🥇 1st Place: 50%
  - 🥈 2nd Place: 30%
  - 🥉 3rd Place: 20%

### Marketplace
- List hens for sale at any price
- **2.5% commission** on sales
- Instant transfer on purchase
- View all active listings

### Betting
- Bet on battle outcomes
- Bet on race positions
- Dynamic odds calculation
- Automatic payout to winners

#### Registration (NEW!)
```
POST /api/registration/register         - Register new user & get 2 free hens
GET  /api/registration/check/:address   - Check if wallet is registered
GET  /api/registration/stats            - Get registration statistics
```

#### Hen Management
#### Hen Management
```
GET /api/hens/:tokenId          - Get hen details
GET /api/hens/user/:address     - Get user's hens
GET /api/hens/total             - Get total supply
```

#### Breeding
```
GET /api/breeding/cooldown/:tokenId     - Check breeding cooldown
POST /api/breeding/offspring            - Predict offspring traits
```

#### Battles
```
GET /api/battles/active                 - Get active battles
GET /api/battles/history/:henId         - Get battle history
```

#### Racing
```
GET /api/racing/active                  - Get active races
GET /api/racing/results/:raceId         - Get race results
```

#### Betting
```
GET /api/betting/odds/:eventId          - Get betting odds
GET /api/betting/user/:address          - Get user's bets
```

---

## 🔐 Security

### Smart Contract Security
- ✅ OpenZeppelin audited libraries
- ✅ ReentrancyGuard on all payable functions
- ✅ Ownable access control
- ✅ Input validation and bounds checking
- ✅ Emergency pause functionality

### Backend Security
- ✅ Helmet.js security headers
- ✅ CORS configured for frontend only
- ✅ Rate limiting (100 requests/15min)
- ✅ Read-only contract calls
- ✅ Input sanitization

### Environment Variables
Never commit:
- Private keys
- API keys (Infura, Etherscan, etc.)
- RPC URLs with sensitive tokens

---

## 📊 Smart Contract Commands

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm run test
```

### Deploy to Sepolia
```bash
# Create .env file
cp .env.example .env

# Add your keys
# PRIVATE_KEY=0x...
# INFURA_API_KEY=...
# ETHERSCAN_API_KEY=...

# Deploy
npm run deploy:sepolia
```

### Deploy to Local Hardhat
```bash
# Start node
npm run node

# Deploy (in new terminal)
npm run deploy:local
```

---

## 🌍 Vercel Deployment

### Frontend Deployment

1. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import: `Jayanth4577/CryptoChuck`
   - **Root Directory**: `frontend` 
   - Framework: Vite

2. **Environment Variables**
   ```
   VITE_API_URL=https://cryptochuck-backend.vercel.app
   VITE_HEN_NFT_ADDRESS=0x115E28745dd5D04d0761D273584c5EcDE7D209E1
   VITE_HEN_BREEDING_ADDRESS=0x16512a71c72C944b53A643f6de5C5a0Ceb6F9394
   VITE_HEN_BATTLE_ADDRESS=0x08aB3D806aE9Ad2d5078b6bc220c04080058CC48
   VITE_HEN_RACING_ADDRESS=0xb2a0a91Da875106921dcE72eB154714C0196DAAB
   VITE_BETTING_SYSTEM_ADDRESS=0x952411e2CB059f00b3B5Ef9E41DE9adAF2E59841
   VITE_CHAIN_ID=11155111
   ```

3. **Deploy**

### Backend Deployment

1. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import: `Jayanth4577/CryptoChuck`
   - **Root Directory**: `backend` 
   - Framework: Other

2. **Environment Variables**
   ```
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   FRONTEND_URL=https://cryptochuck.vercel.app
   ```

3. **Deploy**

---

## 📝 Available Scripts

### Root Directory
```bash
npm run compile          # Compile smart contracts
npm run test             # Run contract tests
npm run node             # Start local Hardhat blockchain
npm run deploy:local     # Deploy to local network
npm run deploy:sepolia   # Deploy to Sepolia testnet
```

### Frontend
```bash
cd frontend
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run preview          # Preview production build
```

### Backend
```bash
cd backend
npm run dev              # Start dev server (localhost:5001)
npm start                # Start production server
```

---

## 🐛 Troubleshooting

### MetaMask Connection Issues
- Ensure you're on **Sepolia Testnet** (Chain ID: 11155111)
- Add Sepolia network manually if needed:
  - RPC: `https://sepolia.infura.io/v3/YOUR_KEY`
  - Chain ID: `11155111`
  - Symbol: `ETH`
  - Explorer: `https://sepolia.etherscan.io`

### Transaction Failures
- Check you have enough Sepolia ETH
- Try increasing gas limit
- Verify you own the hen for the action

### Frontend Not Loading
- Check Vercel deployment logs
- Verify **Root Directory** is set to `frontend`
- Clear browser cache
- Check browser console for errors

### API Errors
- Verify backend URL in frontend `.env.local`
- Check CORS settings in backend
- Verify contract addresses are correct

---

## 🤝 Contributing

We welcome contributions! To contribute:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🔗 Links

- **Live App**: [cryptochuck.vercel.app](https://cryptochuck.vercel.app)
- **Backend API**: [cryptochuck-backend.vercel.app](https://cryptochuck-backend.vercel.app)
- **GitHub**: [github.com/Jayanth4577/CryptoChuck](https://github.com/Jayanth4577/CryptoChuck)
- **Sepolia Explorer**: [sepolia.etherscan.io](https://sepolia.etherscan.io)
- **Get Test ETH**: [sepoliafaucet.com](https://sepoliafaucet.com)

---

## 👥 Support

- **Issues**: [GitHub Issues](https://github.com/Jayanth4577/CryptoChuck/issues)
- **Documentation**: See [QUICK_START.md](QUICK_START.md) and [SECURITY.md](SECURITY.md)

---

**Status**: 🟢 Live on Vercel | Sepolia Testnet  
**Last Updated**: December 3, 2025  
**Version**: 1.0.0

🎮 **Ready to play? Visit [cryptochuck.vercel.app](https://cryptochuck.vercel.app) now!**
