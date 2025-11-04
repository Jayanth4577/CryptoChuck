import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import Marketplace from './components/Marketplace';
import Breeding from './components/Breeding';
import BattleArena from './components/BattleArena';
import RaceTrack from './components/RaceTrack';
import BettingAnalytics from './components/BettingAnalytics';

// Import ABIs (you'll need to copy these from artifacts after compilation)
import HenNFTABI from './abis/HenNFT.json';
import HenBreedingABI from './abis/HenBreeding.json';
import HenBattleABI from './abis/HenBattle.json';
import HenRacingABI from './abis/HenRacing.json';
import BettingSystemABI from './abis/BettingSystem.json';

// Contract addresses from .env
const CONTRACT_ADDRESSES = {
  henNFT: import.meta.env.VITE_HEN_NFT_ADDRESS,
  henBreeding: import.meta.env.VITE_HEN_BREEDING_ADDRESS,
  henBattle: import.meta.env.VITE_HEN_BATTLE_ADDRESS,
  henRacing: import.meta.env.VITE_HEN_RACING_ADDRESS,
  bettingSystem: import.meta.env.VITE_BETTING_SYSTEM_ADDRESS,
};

function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [myHens, setMyHens] = useState([]);
  const [selectedTab, setSelectedTab] = useState('home');
  const [loading, setLoading] = useState(false);

  // Initialize Web3
  useEffect(() => {
    initWeb3();
  }, []);

  // Load user's hens when account changes
  useEffect(() => {
    if (account && contracts.henNFT) {
      loadMyHens();
    }
  }, [account, contracts]);

  const initWeb3 = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        
        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0]);

        // Initialize contracts
        const henNFT = new ethers.Contract(CONTRACT_ADDRESSES.henNFT, HenNFTABI, signer);
        const henBreeding = new ethers.Contract(CONTRACT_ADDRESSES.henBreeding, HenBreedingABI, signer);
        const henBattle = new ethers.Contract(CONTRACT_ADDRESSES.henBattle, HenBattleABI, signer);
        const henRacing = new ethers.Contract(CONTRACT_ADDRESSES.henRacing, HenRacingABI, signer);
        const bettingSystem = new ethers.Contract(CONTRACT_ADDRESSES.bettingSystem, BettingSystemABI, signer);

        setContracts({ henNFT, henBreeding, henBattle, henRacing, bettingSystem });

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          setAccount(accounts[0]);
        });
      } catch (error) {
        console.error('Error connecting to Web3:', error);
        alert('Please install MetaMask!');
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const loadMyHens = async () => {
    setLoading(true);
    try {
      const henIds = await contracts.henNFT.getHensByOwner(account);
      const hensData = [];

      for (let i = 0; i < henIds.length; i++) {
        const henId = henIds[i];
        const traits = await contracts.henNFT.getHenTraits(henId);
        hensData.push({
          id: henId.toString(),
          ...traits,
        });
      }

      setMyHens(hensData);
    } catch (error) {
      console.error('Error loading hens:', error);
    }
    setLoading(false);
  };

  const mintHen = async () => {
    setLoading(true);
    try {
      const mintPrice = await contracts.henNFT.MINT_PRICE();
      const tx = await contracts.henNFT.mintHen({ value: mintPrice });
      await tx.wait();
      alert('Hen minted successfully!');
      loadMyHens();
    } catch (error) {
      console.error('Error minting hen:', error);
      alert('Failed to mint hen: ' + error.message);
    }
    setLoading(false);
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const renderHenCard = (hen) => {
    return (
      <div key={hen.id} className="hen-card">
        <div className="hen-card-header">
          <h3>Hen #{hen.id}</h3>
          <span className="generation-badge">Gen {hen.generation.toString()}</span>
        </div>
        <div className="hen-stats">
          <div className="stat">
            <span className="stat-label">💪 Strength:</span>
            <div className="stat-bar">
              <div className="stat-fill" style={{ width: `${hen.strength}%` }}></div>
              <span className="stat-value">{hen.strength.toString()}</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-label">⚡ Speed:</span>
            <div className="stat-bar">
              <div className="stat-fill" style={{ width: `${hen.speed}%` }}></div>
              <span className="stat-value">{hen.speed.toString()}</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-label">❤️ Stamina:</span>
            <div className="stat-bar">
              <div className="stat-fill" style={{ width: `${hen.stamina}%` }}></div>
              <span className="stat-value">{hen.stamina.toString()}</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-label">🧠 Intelligence:</span>
            <div className="stat-bar">
              <div className="stat-fill" style={{ width: `${hen.intelligence}%` }}></div>
              <span className="stat-value">{hen.intelligence.toString()}</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-label">🍀 Luck:</span>
            <div className="stat-bar">
              <div className="stat-fill" style={{ width: `${hen.luck}%` }}></div>
              <span className="stat-value">{hen.luck.toString()}</span>
            </div>
          </div>
        </div>
        <div className="hen-record">
          <span>🏆 Wins: {hen.wins.toString()}</span>
          <span>❌ Losses: {hen.losses.toString()}</span>
          <span>🏁 Races Won: {hen.racesWon.toString()}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🐔 CryptoHens</h1>
          <nav>
            <button onClick={() => setSelectedTab('home')} className={selectedTab === 'home' ? 'active' : ''}>
              Home
            </button>
            <button onClick={() => setSelectedTab('my-hens')} className={selectedTab === 'my-hens' ? 'active' : ''}>
              My Hens
            </button>
            <button onClick={() => setSelectedTab('breeding')} className={selectedTab === 'breeding' ? 'active' : ''}>
              Breeding
            </button>
            <button onClick={() => setSelectedTab('battle')} className={selectedTab === 'battle' ? 'active' : ''}>
              Battle
            </button>
            <button onClick={() => setSelectedTab('racing')} className={selectedTab === 'racing' ? 'active' : ''}>
              Racing
            </button>
            <button onClick={() => setSelectedTab('betting')} className={selectedTab === 'betting' ? 'active' : ''}>
              Betting
            </button>
            <button onClick={() => setSelectedTab('marketplace')} className={selectedTab === 'marketplace' ? 'active' : ''}>
              Marketplace
            </button>
          </nav>
          <div className="wallet-info">
            {account ? (
              <span className="connected">{formatAddress(account)}</span>
            ) : (
              <button onClick={initWeb3}>Connect Wallet</button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {selectedTab === 'home' && (
          <div className="home-section">
            <div className="hero">
              <h2>Welcome to CryptoHens!</h2>
              <p>Own, breed, battle, and race unique NFT hens on the blockchain</p>
              <button onClick={mintHen} disabled={loading || !account} className="mint-button">
                {loading ? 'Minting...' : 'Mint Your First Hen (0.01 ETH)'}
              </button>
            </div>
            <div className="features">
              <div className="feature">
                <h3>🧬 Breeding</h3>
                <p>Breed your hens to create offspring with unique genetic traits</p>
              </div>
              <div className="feature">
                <h3>⚔️ Battles</h3>
                <p>Engage in skill-based combat and earn rewards</p>
              </div>
              <div className="feature">
                <h3>🏁 Racing</h3>
                <p>Compete in races and win prizes</p>
              </div>
              <div className="feature">
                <h3>🎰 Betting</h3>
                <p>Bet on battles and races to earn passive income</p>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'my-hens' && (
          <div className="my-hens-section">
            <div className="section-header">
              <h2>My Hens ({myHens.length})</h2>
              <button onClick={mintHen} disabled={loading} className="mint-button-small">
                {loading ? 'Minting...' : 'Mint New Hen'}
              </button>
            </div>
            {loading ? (
              <div className="loading">Loading your hens...</div>
            ) : myHens.length === 0 ? (
              <div className="empty-state">
                <p>You don't have any hens yet!</p>
                <button onClick={mintHen} className="mint-button">
                  Mint Your First Hen
                </button>
              </div>
            ) : (
              <div className="hens-grid">
                {myHens.map(renderHenCard)}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'breeding' && (
          <Breeding 
            contracts={contracts} 
            account={account}
            loadMyHens={loadMyHens}
          />
        )}

        {selectedTab === 'battle' && (
          <BattleArena 
            contracts={contracts} 
            account={account}
          />
        )}

        {selectedTab === 'racing' && (
          <RaceTrack 
            contracts={contracts} 
            account={account}
          />
        )}

        {selectedTab === 'betting' && (
          <BettingAnalytics 
            contracts={contracts} 
            account={account}
          />
        )}

        {selectedTab === 'marketplace' && (
          <Marketplace 
            contracts={contracts} 
            account={account} 
            loadMyHens={loadMyHens}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 CryptoHens. All rights reserved.</p>
        <div className="social-links">
          <a href="#">Discord</a>
          <a href="#">Twitter</a>
          <a href="#">Docs</a>
        </div>
      </footer>
    </div>
  );
}

export default App;