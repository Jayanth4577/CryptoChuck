import { useEffect } from 'react';
import './TransactionModal.css';
import { getEtherscanLink, getTransactionStatus } from '../utils/errorHandler';

const TransactionModal = ({ 
  isOpen, 
  onClose, 
  status, 
  txHash, 
  chainId,
  message 
}) => {
  // Auto-close on success after 3 seconds
  useEffect(() => {
    if (status === 'confirmed' && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, isOpen, onClose]);

  if (!isOpen) return null;

  const statusInfo = getTransactionStatus(status);
  const etherscanLink = txHash && chainId ? getEtherscanLink(txHash, chainId) : null;

  return (
    <div className="transaction-modal-overlay" onClick={onClose}>
      <div className="transaction-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="transaction-content">
          <div 
            className="transaction-icon" 
            style={{ 
              color: statusInfo.color,
              animation: status === 'pending' ? 'spin 2s linear infinite' : 'none'
            }}
          >
            {statusInfo.icon}
          </div>
          
          <h3 className="transaction-status">{statusInfo.text}</h3>
          
          {message && (
            <p className="transaction-message">{message}</p>
          )}
          
          {txHash && (
            <div className="transaction-hash">
              <span className="hash-label">Transaction Hash:</span>
              <code className="hash-value">{txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}</code>
            </div>
          )}
          
          {etherscanLink && (
            <a 
              href={etherscanLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="etherscan-link"
            >
              View on Etherscan →
            </a>
          )}
          
          {status === 'pending' && (
            <div className="loading-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}
          
          {status === 'confirmed' && (
            <button onClick={onClose} className="btn btn-primary">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
