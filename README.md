# 🐔 CryptoChuck - NFT Fighting Game

## Project Overview
A blockchain-based game where players own, breed, and battle with virtual hens as NFTs. Features include skill-based combat, breeding mechanics, racing events, and a betting system.

## 📁 Project Structure

```
cryptochuck/
├── contracts/                    # Smart Contracts
│   ├── HenNFT.sol               # Main NFT contract
│   ├── HenBreeding.sol          # Breeding mechanics
│   ├── HenBattle.sol            # Battle system
│   ├── HenRacing.sol            # Racing events
│   └── BettingSystem.sol        # Betting mechanics
├── frontend/                     # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── HenCard.jsx
│   │   │   ├── BattleArena.jsx
│   │   │   ├── BreedingLab.jsx
│   │   │   ├── RaceTrack.jsx
│   │   │   └── Marketplace.jsx
│   │   ├── hooks/
│   │   │   ├── useContract.js
│   │   │   └── useWallet.js
│   │   ├── utils/
│   │   │   ├── web3.js
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── scripts/                      # Deployment Scripts
│   ├── deploy.js
│   └── mint-initial.js
├── test/                         # Smart Contract Tests
│   ├── HenNFT.test.js
│   ├── HenBreeding.test.js
│   └── HenBattle.test.js
├── hardhat.config.js
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MetaMask or compatible Web3 wallet
- Ethereum testnet ETH (Sepolia recommended)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd cryptohens
```

2. **Install dependencies**
```bash
npm install
cd frontend && npm install && cd ..
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings:
# PRIVATE_KEY=your_wallet_private_key
# ALCHEMY_API_KEY=your_alchemy_key
# ETHERSCAN_API_KEY=your_etherscan_key
```

4. **Compile contracts**
```bash
npx hardhat compile
```

5. **Run tests**
```bash
npx hardhat test
```

6. **Deploy to testnet**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

7. **Start frontend**
```bash
cd frontend
npm run dev
```

## 🎮 Game Features

### ✅ Implemented (PS#33 & PS#34)

#### Core NFT System
- Each hen is an ERC-721 NFT with unique traits
- Attributes: Strength, Speed, Stamina, Intelligence, Luck
- **FULLY FUNCTIONAL MARKETPLACE** - Buy, sell, and trade
- On-chain metadata storage
- 2.5% marketplace fee
- Filter and sort listings
- One-click buying/selling

#### Breeding & Genetics
- Breed two hens to create offspring
- Genetic trait inheritance system
- Cooldown periods between breeding
- Rare trait combinations

#### Battle System
- Turn-based combat mechanics
- Skill-based outcomes using hen attributes
- Battle rewards (tokens/items)
- Win/loss tracking

#### Racing Events
- Timed racing competitions
- Multiple hens compete simultaneously
- Rewards for top finishers
- Speed-based attribute importance

#### Betting Mechanism
- Bet on battle outcomes
- Bet on race results
- Odds calculation system
- Passive income opportunities

### 🔄 In Progress
- Advanced AI for NPC battles
- Tournament brackets
- Guild/clan system
- Achievement NFTs

### 📋 Remaining Tasks

#### Smart Contracts
- [ ] Audit security vulnerabilities
- [ ] Optimize gas costs
- [ ] Implement upgrade proxy pattern
- [ ] Add emergency pause functionality

#### Frontend
- [ ] Mobile responsive design
- [ ] Battle animations
- [ ] Sound effects and music
- [ ] Leaderboard system
- [ ] User profile pages

#### Backend/Infrastructure
- [ ] Set up subgraph for event indexing
- [ ] IPFS integration for metadata
- [ ] Backend API for off-chain data
- [ ] WebSocket for real-time updates

#### Testing & Deployment
- [ ] Complete unit test coverage
- [ ] Integration tests
- [ ] Load testing
- [ ] Mainnet deployment checklist

#### Documentation
- [ ] API documentation
- [ ] Smart contract documentation
- [ ] User guide/tutorial
- [ ] Video walkthrough

## 🛠️ Technology Stack

- **Blockchain**: Ethereum (EVM-compatible)
- **Smart Contracts**: Solidity 0.8.20
- **Development**: Hardhat
- **Frontend**: React + Vite
- **Web3**: ethers.js v6
- **Styling**: Tailwind CSS
- **Testing**: Chai, Mocha
- **Storage**: IPFS (planned)

## 📊 Smart Contract Architecture

### HenNFT.sol
Main NFT contract inheriting ERC-721. Handles minting, burning, and trait management.

### HenBreeding.sol
Manages breeding logic, cooldowns, and genetic calculations. Ensures no inbreeding.

### HenBattle.sol
Implements battle mechanics with randomness using Chainlink VRF (recommended).

### HenRacing.sol
Handles race events, entry fees, and prize distribution.

### BettingSystem.sol
Manages bet placement, odds calculation, and payout distribution.

## 🔐 Security Considerations

- All contracts use OpenZeppelin libraries
- ReentrancyGuard on all payable functions
- Access control with Ownable pattern
- Emergency pause functionality
- Slippage protection on trades
- Rate limiting on actions

## 💰 Token Economics

- **Initial Mint**: 10,000 Gen-0 Hens
- **Breeding Cost**: 0.01 ETH + game tokens
- **Battle Entry**: Free (rewards in game tokens)
- **Race Entry**: 0.005 ETH
- **Marketplace Fee**: 2.5%
- **Betting Fee**: 1%

## 🗺️ Roadmap

### Phase 1 (Q4 2024) ✅
- Core NFT functionality
- Basic breeding
- Simple battles

### Phase 2 (Q1 2025) ✅
- Racing events
- Betting system
- Marketplace launch

### Phase 3 (Q2 2025) 🔄
- Mobile app
- Tournament system
- Guild features

### Phase 4 (Q3 2025) 📋
- Cross-chain bridge
- P2E rewards expansion
- Metaverse integration

## 🤝 Contributing

We welcome contributions! Please see CONTRIBUTING.md for details.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE.md

## 🐛 Known Issues

- Gas costs high for breeding (optimization needed)
- Frontend needs loading states
- Race animation performance issues

## 📞 Support

- Discord: [Join our server]
- Twitter: @CryptoHens
- Email: support@cryptohens.io

## 🙏 Acknowledgments

- OpenZeppelin for secure contract templates
- Hardhat team for development tools
- Community testers and early adopters

---

**Status**: Beta v0.2.0 | Last Updated: October 2024
