import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import Marketplace from './components/Marketplace';
import Breeding from './components/Breeding';
import BattleArena from './components/BattleArena';
import RaceTrack from './components/RaceTrack';
import BettingAnalytics from './components/BettingAnalytics';

// Import ABIs (you'll need to copy these from artifacts after compilation)
import HenNFTJson from './abis/HenNFT.json';
import HenBreedingJson from './abis/HenBreeding.json';
import HenBattleJson from './abis/HenBattle.json';
import HenRacingJson from './abis/HenRacing.json';
import BettingSystemJson from './abis/BettingSystem.json';
import { CONTRACT_ADDRESSES } from './config/contracts';

// Extract the ABIs
const HenNFTABI = HenNFTJson.abi;
const HenBreedingABI = HenBreedingJson.abi;
const HenBattleABI = HenBattleJson.abi;
const HenRacingABI = HenRacingJson.abi;
const BettingSystemABI = BettingSystemJson.abi;

function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [myHens, setMyHens] = useState([]);
  const [selectedTab, setSelectedTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [wrongNetwork, setWrongNetwork] = useState(false);

  // Initialize Web3
  useEffect(() => {
    // Check if user previously connected
    if (window.ethereum && window.ethereum.selectedAddress) {
      // Only auto-connect if already connected
      checkExistingConnection();
    }
  }, []);

  // Load user's hens when account changes
  useEffect(() => {
    if (account && contracts.henNFT) {
      loadMyHens();
    }
  }, [account, contracts]);

  const checkExistingConnection = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        // Silently connect without showing errors
        await initWeb3();
      }
    } catch (error) {
      // Ignore errors on auto-connect, user can manually connect
      console.log('No existing connection found');
    }
  };

  const initWeb3 = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!');
      return;
    }

    try {
      // Handle Brave Wallet and other provider conflicts
      let ethereum = window.ethereum;
      
      // If multiple providers exist (like Brave Wallet + MetaMask)
      if (ethereum.providers?.length) {
        ethereum = ethereum.providers.find((provider) => provider.isMetaMask);
        if (!ethereum) {
          alert('Please set MetaMask as your default wallet in Brave settings!');
          return;
        }
      }
      
      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);

        // Verify contract addresses exist on the connected network
        if (!CONTRACT_ADDRESSES.henNFT) {
          console.error('HenNFT contract address is not set');
          alert('HenNFT contract address is missing. Check src/config/contracts.js');
          return;
        }

        // Check that the contract is deployed on the currently selected network/provider
        try {
          const code = await provider.getCode(CONTRACT_ADDRESSES.henNFT);
          if (!code || code === '0x') {
            console.error(`No contract deployed at ${CONTRACT_ADDRESSES.henNFT} on the current network`);
            setWrongNetwork(true);
            return;
          } else {
            setWrongNetwork(false);
          }
        } catch (err) {
          console.error('Error while checking contract code:', err);
          setWrongNetwork(true);
          return;
        }

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
        alert(error.message);
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
        
        // Convert BigInt values to Numbers for React rendering
        hensData.push({
          id: henId.toString(),
          strength: Number(traits.strength),
          speed: Number(traits.speed),
          stamina: Number(traits.stamina),
          intelligence: Number(traits.intelligence),
          luck: Number(traits.luck),
          generation: Number(traits.generation),
          wins: Number(traits.wins),
          losses: Number(traits.losses),
          racesWon: Number(traits.racesWon),
        });
      }

      setMyHens(hensData);
    } catch (error) {
      console.error('Error loading hens:', error);
      // Only show alert if it's a real error, not a network mismatch on initial load
      if (error.code === 'BAD_DATA' || (error.message && error.message.includes('could not decode result data'))) {
        // Show a less intrusive error - just log it
        console.warn('⚠️ Contract not found on current network. Please switch MetaMask to Hardhat Local (localhost:8545, Chain ID: 31337)');
        // Clear hens array so UI shows empty state instead of old data
        setMyHens([]);
      } else {
        console.error('Failed to load hens:', error.data?.message || error.message);
        setMyHens([]);
      }
    }
    setLoading(false);
  };

  const mintHen = async () => {
    setLoading(true);
    try {
      // Get the mint price from the contract
      const mintPrice = await contracts.henNFT.MINT_PRICE();
      console.log('Mint price:', ethers.formatEther(mintPrice), 'ETH');
      
      // Create the transaction with the exact value
      const tx = await contracts.henNFT.mintHen({
        value: mintPrice,
        gasLimit: 500000 // Add explicit gas limit
      });
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);
      
      alert('Hen minted successfully!');
      loadMyHens();
    } catch (error) {
      console.error('Error minting hen:', error);
      // More detailed error message
      const errorMessage = error.data?.message || error.message || 'Unknown error';
      alert('Failed to mint hen: ' + errorMessage);
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
          <span className="generation-badge">Gen {hen.generation}</span>
        </div>
        <div className="hen-stats">
          <div className="stat">
            <span className="stat-label">💪 Strength:</span>
            <div className="stat-bar">
              <div className="stat-fill" style={{ width: `${hen.strength}%` }}></div>
              <span className="stat-value">{hen.strength}</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-label">⚡ Speed:</span>
            <div className="stat-bar">
              <div className="stat-fill" style={{ width: `${hen.speed}%` }}></div>
              <span className="stat-value">{hen.speed}</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-label">❤️ Stamina:</span>
            <div className="stat-bar">
              <div className="stat-fill" style={{ width: `${hen.stamina}%` }}></div>
              <span className="stat-value">{hen.stamina}</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-label">🧠 Intelligence:</span>
            <div className="stat-bar">
              <div className="stat-fill" style={{ width: `${hen.intelligence}%` }}></div>
              <span className="stat-value">{hen.intelligence}</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-label">🍀 Luck:</span>
            <div className="stat-bar">
              <div className="stat-fill" style={{ width: `${hen.luck}%` }}></div>
              <span className="stat-value">{hen.luck}</span>
            </div>
          </div>
        </div>
        <div className="hen-record">
          <span>🏆 Wins: {hen.wins}</span>
          <span>❌ Losses: {hen.losses}</span>
          <span>🏁 Races Won: {hen.racesWon}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="app-header-modern">
        <div className="header-inner">
          <div className="brand">🐔 CryptoChuck</div>
          <nav className="nav">
            <button onClick={() => setSelectedTab('home')} className={`nav-btn ${selectedTab === 'home' ? 'active' : ''}`}>
              Home
            </button>
            <button onClick={() => setSelectedTab('my-hens')} className={`nav-btn ${selectedTab === 'my-hens' ? 'active' : ''}`}>
              My Hens
            </button>
            <button onClick={() => setSelectedTab('breeding')} className={`nav-btn ${selectedTab === 'breeding' ? 'active' : ''}`}>
              Breeding
            </button>
            <button onClick={() => setSelectedTab('battle')} className={`nav-btn ${selectedTab === 'battle' ? 'active' : ''}`}>
              Battle
            </button>
            <button onClick={() => setSelectedTab('racing')} className={`nav-btn ${selectedTab === 'racing' ? 'active' : ''}`}>
              Racing
            </button>
            <button onClick={() => setSelectedTab('betting')} className={`nav-btn ${selectedTab === 'betting' ? 'active' : ''}`}>
              Betting
            </button>
            <button onClick={() => setSelectedTab('marketplace')} className={`nav-btn ${selectedTab === 'marketplace' ? 'active' : ''}`}>
              Marketplace
            </button>
          </nav>
          <div className="wallet-info">
            {account ? (
              <span className="wallet-chip">{formatAddress(account)}</span>
            ) : (
              <button className="btn btn-primary" onClick={initWeb3}>Connect Wallet</button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {wrongNetwork && account && (
          <div style={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #ff5252',
            color: 'white'
          }}>
            <h3 style={{margin: '0 0 0.5rem 0', fontSize: '1.1rem'}}>⚠️ Wrong Network</h3>
            <p style={{margin: '0 0 0.75rem 0', fontSize: '0.95rem'}}>
              Please switch MetaMask to <strong>Hardhat Local</strong> network:
            </p>
            <ul style={{margin: '0', paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6'}}>
              <li>Network: Hardhat Local</li>
              <li>RPC URL: http://127.0.0.1:8545</li>
              <li>Chain ID: 31337</li>
            </ul>
          </div>
        )}
        
        {selectedTab === 'home' && (
          <div className="home-section">
            <div className="hero-modern panel">
              <h2>Welcome to CryptoChuck!</h2>
              <p>Own, breed, battle, and race unique NFT hens on the blockchain</p>
              <button onClick={mintHen} disabled={loading || !account} className="btn btn-primary">
                {loading ? 'Minting...' : 'Mint Your First Hen (0.01 ETH)'}
              </button>
            </div>
            <div className="grid-responsive">
              <div className="card">
                <h3>🧬 Breeding</h3>
                <p>Breed your hens to create offspring with unique genetic traits</p>
              </div>
              <div className="card">
                <h3>⚔️ Battles</h3>
                <p>Engage in skill-based combat and earn rewards</p>
              </div>
              <div className="card">
                <h3>🏁 Racing</h3>
                <p>Compete in races and win prizes</p>
              </div>
              <div className="card">
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
              <button onClick={mintHen} disabled={loading} className="btn btn-primary">
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

      <footer className="footer-modern">
        <div className="footer-inner">
        <p className="muted">&copy; 2024 CryptoChuck. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Discord</a>
          <a href="#">Twitter</a>
          <a href="#">Docs</a>
        </div>
        </div>
      </footer>
    </div>
  );
}

export default App;