import './FaucetGuide.css';

const FaucetGuide = () => {
  const faucets = [
    {
      name: "Alchemy Faucet",
      url: "https://www.alchemy.com/faucets/ethereum-sepolia",
      method: "Login with Google/Email",
      amount: "0.5 ETH",
      time: "24 hours",
      note: "✅ EASIEST - Just login, no verification needed",
      recommended: true
    },
    {
      name: "QuickNode Faucet",
      url: "https://faucet.quicknode.com/ethereum/sepolia",
      method: "Twitter account",
      amount: "0.05 ETH",
      time: "12 hours",
      note: "Fast & reliable"
    },
    {
      name: "Infura Faucet",
      url: "https://www.infura.io/faucet/sepolia",
      method: "Login",
      amount: "0.5 ETH",
      time: "24 hours",
      note: "Very reliable"
    },
    {
      name: "Sepolia PoW Faucet",
      url: "https://sepolia-faucet.pk910.de/",
      method: "Mine in browser",
      amount: "Variable",
      time: "Continuous",
      note: "No limits, but takes time (run overnight)"
    },
    {
      name: "Google Cloud Faucet",
      url: "https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
      method: "Google account",
      amount: "0.05 ETH",
      time: "24 hours",
      note: "No Twitter needed"
    }
  ];

  return (
    <div className="faucet-guide-container">
      <div className="guide-header">
        <h1>🚰 Get FREE Sepolia ETH</h1>
        <p className="guide-subtitle">
          You don't need ANY real money! These faucets give you FREE test ETH to play CryptoChuck.
        </p>
        <div className="important-note">
          <h3>⚡ Important:</h3>
          <ul>
            <li>✅ Completely FREE - no payment needed</li>
            <li>✅ No mainnet ETH required</li>
            <li>✅ Just connect your MetaMask wallet</li>
            <li>✅ Get 0.5 ETH = enough for 50 hen NFTs!</li>
          </ul>
        </div>
      </div>

      <div className="quick-start-section">
        <h2>🚀 Quick Start (2 minutes)</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <div className="step-content">
              <h3>Make sure you're on Sepolia Network</h3>
              <p>Open MetaMask → Click network dropdown → Select "Sepolia"</p>
              <div className="help-box">
                Don't see Sepolia? Click "Show/hide test networks" in MetaMask settings
              </div>
            </div>
          </div>

          <div className="step">
            <span className="step-number">2</span>
            <div className="step-content">
              <h3>Copy your wallet address</h3>
              <p>Click on your address in MetaMask to copy it</p>
              <div className="address-example">
                Example: 0x1234...5678
              </div>
            </div>
          </div>

          <div className="step">
            <span className="step-number">3</span>
            <div className="step-content">
              <h3>Visit a faucet (recommended below)</h3>
              <p>Click any faucet link, paste your address, and claim!</p>
            </div>
          </div>

          <div className="step">
            <span className="step-number">4</span>
            <div className="step-content">
              <h3>Wait 30-60 seconds</h3>
              <p>ETH will appear in your MetaMask automatically</p>
            </div>
          </div>
        </div>
      </div>

      <div className="faucets-section">
        <h2>🌊 Available Faucets</h2>
        <p className="faucets-note">Pick any one below - they're all FREE!</p>
        
        <div className="faucets-grid">
          {faucets.map((faucet, index) => (
            <div key={index} className={`faucet-card ${faucet.recommended ? 'recommended' : ''}`}>
              {faucet.recommended && (
                <div className="recommended-badge">⭐ RECOMMENDED</div>
              )}
              <h3>{faucet.name}</h3>
              <div className="faucet-details">
                <div className="detail-row">
                  <span className="label">Method:</span>
                  <span className="value">{faucet.method}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Amount:</span>
                  <span className="value highlight">{faucet.amount}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Cooldown:</span>
                  <span className="value">{faucet.time}</span>
                </div>
              </div>
              <p className="faucet-note">{faucet.note}</p>
              <a 
                href={faucet.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="faucet-btn"
              >
                Get Free ETH →
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="pro-tips-section">
        <h2>💡 Pro Tips</h2>
        <div className="tips-grid">
          <div className="tip">
            <h4>🎯 Use Multiple Faucets</h4>
            <p>Visit 2-3 different faucets to get more ETH faster!</p>
          </div>
          <div className="tip">
            <h4>⏰ Mining Faucet Overnight</h4>
            <p>Use the PoW faucet overnight - it mines while you sleep and has no limits!</p>
          </div>
          <div className="tip">
            <h4>🔄 Daily Claims</h4>
            <p>Come back every 24 hours to claim again if you run out</p>
          </div>
          <div className="tip">
            <h4>💰 How Much Do You Need?</h4>
            <p>0.5 ETH = 50 hens. Start with 2-3 hens and you're good to play!</p>
          </div>
        </div>
      </div>

      <div className="troubleshooting-section">
        <h2>❓ Troubleshooting</h2>
        <div className="faq">
          <div className="faq-item">
            <h4>Why do faucets exist?</h4>
            <p>They're run by blockchain companies to help developers test their apps. You're using test money, not real money!</p>
          </div>
          <div className="faq-item">
            <h4>Is this really free?</h4>
            <p>YES! 100% free. No credit card, no payment, nothing. Just login and claim.</p>
          </div>
          <div className="faq-item">
            <h4>What if faucet says "too many requests"?</h4>
            <p>Try a different faucet from the list above. Each has different rate limits.</p>
          </div>
          <div className="faq-item">
            <h4>ETH not showing up?</h4>
            <p>Make sure MetaMask is on Sepolia network. Check again in 1-2 minutes.</p>
          </div>
          <div className="faq-item">
            <h4>Can't switch to Sepolia network?</h4>
            <p>Go to MetaMask Settings → Advanced → Show test networks (toggle ON)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaucetGuide;
