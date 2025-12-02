import { useState } from 'react';
import './LandingPage.css';

export default function LandingPage({ onConnect }) {
  const [showGuide, setShowGuide] = useState(false);

  const features = [
    {
      icon: '🎨',
      title: 'Own NFT Hens',
      description: 'Each hen is a unique NFT with special traits stored on the blockchain'
    },
    {
      icon: '⚔️',
      title: 'Battle Arena',
      description: 'Fight other hens in skill-based combat and earn rewards'
    },
    {
      icon: '🏁',
      title: 'Racing Events',
      description: 'Compete in races for prize pools with top 3 winners'
    },
    {
      icon: '🐣',
      title: 'Breeding System',
      description: 'Breed hens to create offspring with inherited traits'
    },
    {
      icon: '🎰',
      title: 'Betting System',
      description: 'Bet on battles and races to earn passive income'
    },
    {
      icon: '💰',
      title: 'Marketplace',
      description: 'Buy, sell, and trade hens with other players'
    }
  ];

  const stats = [
    { value: '100%', label: 'On-Chain', description: 'Fully decentralized' },
    { value: '5', label: 'Game Modes', description: 'Battle, Race, Breed, Bet, Trade' },
    { value: '∞', label: 'Possibilities', description: 'Infinite trait combinations' }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🐔 NFT Battle Game</div>
          <h1 className="hero-title">
            Welcome to <span className="gradient-text">CryptoChuck</span>
          </h1>
          <p className="hero-subtitle">
            Own, breed, and battle unique NFT hens on the blockchain.
            <br />
            Fight for glory, race for prizes, bet for rewards!
          </p>
          
          <div className="hero-actions">
            <button className="btn-primary" onClick={onConnect}>
              🦊 Connect Wallet & Play
            </button>
            <button className="btn-secondary" onClick={() => setShowGuide(true)}>
              📖 Quick Start Guide
            </button>
          </div>

          <div className="hero-info">
            <div className="info-item">
              <span className="info-icon">🌐</span>
              <span>Sepolia Testnet</span>
            </div>
            <div className="info-item">
              <span className="info-icon">✅</span>
              <span>Verified Contracts</span>
            </div>
            <div className="info-item">
              <span className="info-icon">🎮</span>
              <span>Free to Play (Test ETH)</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-hen hen-1">🐔</div>
          <div className="floating-hen hen-2">🐓</div>
          <div className="floating-hen hen-3">🐥</div>
          <div className="glow-effect"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Game Features</h2>
        <p className="section-subtitle">Everything you need for an epic NFT gaming experience</p>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How to Get Started</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Install MetaMask</h3>
              <p>Download the MetaMask browser extension</p>
              <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="step-link">
                Get MetaMask →
              </a>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Add Sepolia Network</h3>
              <p>Connect to Sepolia testnet in MetaMask</p>
              <button className="step-link" onClick={() => setShowGuide(true)}>
                View Guide →
              </button>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Get Test ETH</h3>
              <p>Claim free Sepolia ETH from faucets</p>
              <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="step-link">
                Get Free ETH →
              </a>
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Start Playing!</h3>
              <p>Connect your wallet and mint your first hen</p>
              <button className="step-link" onClick={onConnect}>
                Play Now →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-description">{stat.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Your Hen Empire?</h2>
          <p>Join the battle, breed champions, and dominate the arena!</p>
          <button className="btn-primary btn-large" onClick={onConnect}>
            🎮 Start Playing Now
          </button>
        </div>
      </section>

      {/* Quick Start Guide Modal */}
      {showGuide && (
        <div className="modal-overlay" onClick={() => setShowGuide(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowGuide(false)}>×</button>
            <h2>🚀 Quick Start Guide</h2>
            
            <div className="guide-section">
              <h3>1. Setup MetaMask</h3>
              <ol>
                <li>Install <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">MetaMask Extension</a></li>
                <li>Create a new wallet or import existing one</li>
                <li>Save your seed phrase securely (never share it!)</li>
              </ol>
            </div>

            <div className="guide-section">
              <h3>2. Add Sepolia Network</h3>
              <div className="network-config">
                <div className="config-item">
                  <strong>Network Name:</strong> Sepolia Testnet
                </div>
                <div className="config-item">
                  <strong>RPC URL:</strong> https://sepolia.infura.io/v3/56c857ab8ed5406b86d247e317ff7672
                </div>
                <div className="config-item">
                  <strong>Chain ID:</strong> 11155111
                </div>
                <div className="config-item">
                  <strong>Currency:</strong> ETH
                </div>
                <div className="config-item">
                  <strong>Explorer:</strong> https://sepolia.etherscan.io
                </div>
              </div>
              <p className="guide-note">
                💡 Or enable "Show test networks" in MetaMask settings → Advanced
              </p>
            </div>

            <div className="guide-section">
              <h3>3. Get Free Test ETH</h3>
              <p>Visit these faucets to get free Sepolia ETH:</p>
              <ul className="faucet-list">
                <li>
                  <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer">
                    🌊 Alchemy Sepolia Faucet (Recommended)
                  </a>
                </li>
                <li>
                  <a href="https://www.infura.io/faucet/sepolia" target="_blank" rel="noopener noreferrer">
                    💧 Infura Sepolia Faucet
                  </a>
                </li>
                <li>
                  <a href="https://faucets.chain.link/sepolia" target="_blank" rel="noopener noreferrer">
                    🔗 Chainlink Sepolia Faucet
                  </a>
                </li>
              </ul>
            </div>

            <div className="guide-section">
              <h3>4. Game Basics</h3>
              <div className="game-basics">
                <div className="basic-item">
                  <strong>🎨 Mint Hens:</strong> 0.01 ETH - Each hen has unique stats
                </div>
                <div className="basic-item">
                  <strong>⚔️ Battle:</strong> 0.005 ETH - Winner takes rewards
                </div>
                <div className="basic-item">
                  <strong>🏁 Race:</strong> Variable entry - Top 3 get prizes
                </div>
                <div className="basic-item">
                  <strong>🐣 Breed:</strong> 0.01 ETH - Create offspring with inherited traits
                </div>
                <div className="basic-item">
                  <strong>🎰 Bet:</strong> 0.001-10 ETH - Bet on battles and races
                </div>
              </div>
            </div>

            <div className="guide-section">
              <h3>5. Hen Stats Explained</h3>
              <ul>
                <li><strong>💪 Strength:</strong> Determines attack damage in battles</li>
                <li><strong>⚡ Speed:</strong> Affects hit chance, dodge, and racing performance</li>
                <li><strong>❤️ Stamina:</strong> Determines health points in battles</li>
                <li><strong>🧠 Intelligence:</strong> Increases critical hit chance</li>
                <li><strong>🍀 Luck:</strong> Random bonus factor in all activities</li>
              </ul>
            </div>

            <button className="btn-primary" onClick={() => {
              setShowGuide(false);
              onConnect();
            }}>
              Got It! Let's Play 🎮
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>🐔 CryptoChuck</h4>
            <p>The ultimate NFT hen battle game</p>
          </div>
          
          <div className="footer-section">
            <h4>Game</h4>
            <ul>
              <li><a href="#" onClick={onConnect}>Play Now</a></li>
              <li><a href="https://sepolia.etherscan.io/address/0x115E28745dd5D04d0761D273584c5EcDE7D209E1" target="_blank" rel="noopener noreferrer">Smart Contracts</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li><a href="#" onClick={() => setShowGuide(true)}>Quick Start</a></li>
              <li><a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer">Get Test ETH</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Community</h4>
            <ul>
              <li><a href="https://github.com/Jayanth4577/CryptoChuck" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2025 CryptoChuck. Built on Ethereum Sepolia Testnet.</p>
          <p>⚠️ This is a testnet game. Use test ETH only!</p>
        </div>
      </footer>
    </div>
  );
}
