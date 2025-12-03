import { useState, useEffect } from 'react';
import './Registration.css';

const Registration = ({ account, onRegistrationComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [showFaucetHelp, setShowFaucetHelp] = useState(false);
  const [tokenIds, setTokenIds] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // Check if user is already registered
  useEffect(() => {
    if (account) {
      checkRegistration();
    }
  }, [account]);

  const checkRegistration = async () => {
    try {
      setCheckingRegistration(true);
      const response = await fetch(`${API_URL}/api/registration/check/${account}`);
      const data = await response.json();
      
      if (data.success && data.isRegistered) {
        setIsRegistered(true);
      }
    } catch (err) {
      console.error('Error checking registration:', err);
    } finally {
      setCheckingRegistration(false);
    }
  };

  const handleRegister = async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/registration/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account,
          email: email.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTokenIds(data.data.henTokenIds);
        setIsRegistered(true);
        
        // Call parent callback if provided
        if (onRegistrationComplete) {
          onRegistrationComplete(data.data);
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingRegistration) {
    return (
      <div className="registration-container">
        <div className="registration-card">
          <p>Checking registration status...</p>
        </div>
      </div>
    );
  }

  if (isRegistered) {
    return (
      <div className="registration-container">
        <div className="registration-card success-card">
          <h2>✅ Already Registered!</h2>
          <p>Your wallet is already registered. You can start playing!</p>
          <div className="faucet-section">
            <h3>Need More Test ETH?</h3>
            <p>Get free Sepolia ETH for transactions:</p>
            <div className="faucet-links">
              <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer">
                Sepolia Faucet #1
              </a>
              <a href="https://www.infura.io/faucet/sepolia" target="_blank" rel="noopener noreferrer">
                Infura Faucet
              </a>
              <a href="https://faucet.quicknode.com/ethereum/sepolia" target="_blank" rel="noopener noreferrer">
                QuickNode Faucet
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="registration-container">
        <div className="registration-card success-card">
          <div className="success-icon">🎉</div>
          <h2>Registration Successful!</h2>
          <p className="success-message">
            Welcome to CryptoChuck! Your account is registered.
          </p>
          
          <div className="next-steps">
            <h3>🎮 Next Steps:</h3>
            <ol>
              <li>Get free Sepolia ETH from faucets below</li>
              <li>Go to "My Hens" and mint your first hens (0.01 ETH each)</li>
              <li>Start breeding, battling, and racing!</li>
            </ol>
          </div>

          <div className="faucet-section">
            <h3>💰 Get Free Test ETH</h3>
            <p>You'll need Sepolia ETH to mint hens and play (it's totally free!)</p>
            <div className="faucet-links">
              <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="faucet-button">
                🚰 Get Free Sepolia ETH
              </a>
              <a href="https://www.infura.io/faucet/sepolia" target="_blank" rel="noopener noreferrer" className="faucet-button">
                🚰 Infura Faucet
              </a>
            </div>
            <p className="faucet-note">
              You'll receive 0.5 ETH from the faucet - enough for 50 hens!
            </p>
          </div>

          <button 
            className="start-playing-btn"
            onClick={() => onRegistrationComplete && onRegistrationComplete({})}
          >
            Start Playing! 🎮
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-container">
      <div className="registration-card">
        <div className="registration-header">
          <h2>🐔 Join CryptoChuck!</h2>
          <p className="subtitle">Register free and start your adventure!</p>
        </div>

        <div className="registration-benefits">
          <h3>What You Get:</h3>
          <ul>
            <li>✅ Free account registration</li>
            <li>✅ Access to all game features</li>
            <li>✅ Get free Sepolia ETH from faucets</li>
            <li>✅ Mint hens and start playing!</li>
          </ul>
        </div>

        {!account && (
          <div className="connect-wallet-prompt">
            <p>👆 Connect your MetaMask wallet above to register</p>
          </div>
        )}

        {account && (
          <div className="registration-form">
            <div className="form-group">
              <label htmlFor="email">Email (Optional)</label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <small>We'll never spam you. Used only for important updates.</small>
            </div>

            <div className="wallet-info">
              <strong>Wallet:</strong> {account.slice(0, 6)}...{account.slice(-4)}
            </div>

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            <button
              className="register-btn"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Registering... (This may take 30-60 seconds)
                </>
              ) : (
                'Register & Get Free Hens 🎁'
              )}
            </button>

            <div className="registration-note">
              <p>
                ⚠️ After registration, you'll need Sepolia ETH for game transactions.
                <button 
                  className="link-button"
                  onClick={() => setShowFaucetHelp(!showFaucetHelp)}
                >
                  {showFaucetHelp ? 'Hide' : 'Show'} how to get it
                </button>
              </p>
              
              {showFaucetHelp && (
                <div className="faucet-help">
                  <h4>Get Free Sepolia ETH:</h4>
                  <ol>
                    <li>Visit any faucet below</li>
                    <li>Connect your wallet or paste address</li>
                    <li>Request 0.5 ETH (instant!)</li>
                    <li>Come back and play!</li>
                  </ol>
                  <div className="faucet-links">
                    <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer">
                      Sepolia Faucet
                    </a>
                    <a href="https://www.infura.io/faucet/sepolia" target="_blank" rel="noopener noreferrer">
                      Infura Faucet
                    </a>
                    <a href="https://faucet.quicknode.com/ethereum/sepolia" target="_blank" rel="noopener noreferrer">
                      QuickNode Faucet
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="registration-footer">
          <p>By registering, you agree to our terms of service.</p>
          <p>One registration per wallet address.</p>
        </div>
      </div>
    </div>
  );
};

export default Registration;
