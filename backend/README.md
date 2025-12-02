# CryptoChuck Backend API

Backend API server for the CryptoChuck NFT Game, providing read-only blockchain data access.

## Features

- RESTful API for contract data retrieval
- Sepolia testnet integration
- Rate limiting and security headers
- CORS configuration
- Serverless deployment ready (Vercel)

## API Endpoints

### Hens
- `GET /api/hens/hen/:tokenId` - Get hen details by token ID
- `GET /api/hens/user/:address/hens` - Get all hens owned by address
- `GET /api/hens/mint-price` - Get current mint price

### Breeding
- `GET /api/breeding/cooldown` - Get breeding cooldown period
- `GET /api/breeding/cost` - Get breeding cost

### Battles
- `GET /api/battles/active` - Get all active battles
- `GET /api/battles/min-wager` - Get minimum wager amount

### Racing
- `GET /api/racing/active` - Get all active races
- `GET /api/racing/entry-fee` - Get race entry fee

### Betting
- `GET /api/betting/active` - Get all active bets
- `GET /api/betting/min-amount` - Get minimum bet amount

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your values:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
HEN_NFT_ADDRESS=0x115E28745dd5D04d0761D273584c5EcDE7D209E1
# ... other addresses
FRONTEND_URL=http://localhost:5173
PORT=3001
```

4. Run development server:
```bash
npm run dev
```

Server will start on http://localhost:3001

## Deployment to Vercel

### Option 1: Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
4. Add environment variables:
   - `SEPOLIA_RPC_URL`
   - `HEN_NFT_ADDRESS`
   - `HEN_BREEDING_ADDRESS`
   - `HEN_BATTLE_ADDRESS`
   - `HEN_RACING_ADDRESS`
   - `BETTING_SYSTEM_ADDRESS`
   - `FRONTEND_URL`
   - `NODE_ENV=production`
5. Deploy

### Option 2: Vercel CLI
```bash
cd backend
vercel login
vercel --prod
```

## Environment Variables

Required environment variables for deployment:

| Variable | Description | Example |
|----------|-------------|---------|
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint | `https://sepolia.infura.io/v3/YOUR_KEY` |
| `HEN_NFT_ADDRESS` | HenNFT contract address | `0x115E28...` |
| `HEN_BREEDING_ADDRESS` | HenBreeding contract address | `0x16512a...` |
| `HEN_BATTLE_ADDRESS` | HenBattle contract address | `0x08aB3D...` |
| `HEN_RACING_ADDRESS` | HenRacing contract address | `0xb2a0a9...` |
| `BETTING_SYSTEM_ADDRESS` | BettingSystem contract address | `0x952411...` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-app.vercel.app` |
| `NODE_ENV` | Environment mode | `production` |

## Architecture

- **Express.js** - Web framework
- **ethers.js** - Blockchain interaction
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers
- **Rate Limiting** - API protection

## Notes

- All blockchain operations are **read-only**
- Write operations (mint, battle, etc.) are done from frontend with user's wallet
- API is designed for serverless deployment on Vercel
- Rate limited to 100 requests per 15 minutes per IP
