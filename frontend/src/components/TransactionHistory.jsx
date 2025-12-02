import { useState, useEffect } from 'react';
import './TransactionHistory.css';

const TransactionHistory = ({ account, chainId = 11155111 }) => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadTransactions();
  }, [account]);

  const loadTransactions = () => {
    const stored = localStorage.getItem(`txHistory_${account}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Sort by timestamp, newest first
      parsed.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(parsed);
    }
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your transaction history?')) {
      localStorage.removeItem(`txHistory_${account}`);
      setTransactions([]);
    }
  };

  const getEtherscanLink = (txHash) => {
    if (chainId === 11155111) {
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    } else if (chainId === 1) {
      return `https://etherscan.io/tx/${txHash}`;
    }
    return null;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'mint': return '🎨';
      case 'breed': return '🧬';
      case 'battle': return '⚔️';
      case 'race': return '🏁';
      case 'buy': return '💰';
      case 'sell': return '💸';
      case 'train': return '💪';
      case 'rename': return '🏷️';
      default: return '📝';
    }
  };

  const getTypeLabel = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatHash = (hash) => {
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };

  if (!account) {
    return (
      <div className="tx-history-container">
        <div className="empty-state">
          <h3>📜 Transaction History</h3>
          <p>Connect your wallet to see transaction history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tx-history-container">
      <div className="tx-history-header">
        <h2>📜 Transaction History</h2>
        <button 
          className="btn btn-sm btn-danger" 
          onClick={clearHistory}
          disabled={transactions.length === 0}
        >
          Clear History
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions yet</p>
          <p className="hint">Start minting, breeding, or battling to see your history here!</p>
        </div>
      ) : (
        <div className="tx-history-list">
          {transactions.map((tx, index) => (
            <div key={index} className="tx-history-item">
              <div className="tx-icon">{getTypeIcon(tx.type)}</div>
              
              <div className="tx-details">
                <div className="tx-type">{getTypeLabel(tx.type)}</div>
                <div className="tx-description">{tx.description}</div>
                <div className="tx-time">{formatDate(tx.timestamp)}</div>
              </div>

              <div className="tx-actions">
                {tx.txHash && getEtherscanLink(tx.txHash) && (
                  <a
                    href={getEtherscanLink(tx.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                    title="View on Etherscan"
                  >
                    {formatHash(tx.txHash)}
                  </a>
                )}
                {tx.status === 'confirmed' && (
                  <span className="tx-status confirmed">✅ Confirmed</span>
                )}
                {tx.status === 'failed' && (
                  <span className="tx-status failed">❌ Failed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to add transaction to history
export const addToHistory = (account, transaction) => {
  const stored = localStorage.getItem(`txHistory_${account}`) || '[]';
  const history = JSON.parse(stored);
  
  history.push({
    ...transaction,
    timestamp: Date.now()
  });

  // Keep only last 50 transactions
  if (history.length > 50) {
    history.shift();
  }

  localStorage.setItem(`txHistory_${account}`, JSON.stringify(history));
};

export default TransactionHistory;
