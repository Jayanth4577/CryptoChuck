/**
 * Parse blockchain error and return user-friendly message
 * @param {Error} error - The error object from ethers.js
 * @returns {string} User-friendly error message
 */
export const parseError = (error) => {
  // User rejected transaction
  if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
    return '❌ You rejected the transaction';
  }
  
  // Insufficient funds
  if (error.message && error.message.includes('insufficient funds')) {
    return '❌ Insufficient ETH for gas fees. Get test ETH from Sepolia faucet.';
  }
  
  // User rejected in MetaMask
  if (error.message && error.message.toLowerCase().includes('user rejected')) {
    return '❌ Transaction rejected in MetaMask';
  }
  
  // Cooldown period not elapsed
  if (error.message && error.message.includes('Cooldown')) {
    return '⏳ Cooldown period not finished. Please wait before trying again.';
  }
  
  // Not owner of NFT
  if (error.message && error.message.includes('Not owner')) {
    return '❌ You don\'t own this hen';
  }
  
  // Invalid hen IDs
  if (error.message && error.message.includes('Invalid')) {
    return '❌ Invalid hen selected';
  }
  
  // Same parent breeding error
  if (error.message && error.message.includes('same parent')) {
    return '❌ Cannot breed hen with itself';
  }
  
  // Racing already started
  if (error.message && error.message.includes('already started')) {
    return '⏳ Race already in progress';
  }
  
  // Battle already in progress
  if (error.message && error.message.includes('battle in progress')) {
    return '⚔️ Battle already in progress';
  }
  
  // Betting errors
  if (error.message && error.message.includes('Betting closed')) {
    return '🚫 Betting is closed for this event';
  }
  
  if (error.message && error.message.includes('Minimum bet')) {
    return '💰 Bet amount too low. Check minimum bet requirement.';
  }
  
  // Network errors
  if (error.message && error.message.includes('network')) {
    return '🌐 Network error. Check your connection and MetaMask network.';
  }
  
  // Contract not deployed
  if (error.code === 'BAD_DATA' || (error.message && error.message.includes('could not decode'))) {
    return '⚠️ Wrong network. Switch MetaMask to Sepolia Testnet (Chain ID: 11155111)';
  }
  
  // Gas estimation failed
  if (error.message && error.message.includes('gas')) {
    return '⛽ Transaction may fail or gas estimation failed. Check your inputs.';
  }
  
  // Nonce too high (transaction queue issue)
  if (error.message && error.message.includes('nonce')) {
    return '🔄 Transaction queue error. Try resetting MetaMask account (Settings > Advanced > Reset Account)';
  }
  
  // Default fallback
  const shortMessage = error.message?.substring(0, 150) || 'Unknown error';
  return `❌ Transaction failed: ${shortMessage}`;
};

/**
 * Get Etherscan link for transaction
 * @param {string} txHash - Transaction hash
 * @param {number} chainId - Chain ID (11155111 for Sepolia)
 * @returns {string} Etherscan URL
 */
export const getEtherscanLink = (txHash, chainId = 11155111) => {
  if (chainId === 11155111) {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  } else if (chainId === 1) {
    return `https://etherscan.io/tx/${txHash}`;
  } else if (chainId === 137) {
    return `https://polygonscan.com/tx/${txHash}`;
  } else {
    return null; // Local network
  }
};

/**
 * Format transaction status for UI display
 * @param {string} status - Transaction status ('pending', 'confirmed', 'failed')
 * @returns {object} Icon and color
 */
export const getTransactionStatus = (status) => {
  switch (status) {
    case 'pending':
      return { icon: '⏳', color: '#fbbf24', text: 'Pending...' };
    case 'confirmed':
      return { icon: '✅', color: '#10b981', text: 'Confirmed!' };
    case 'failed':
      return { icon: '❌', color: '#ef4444', text: 'Failed' };
    default:
      return { icon: '⏳', color: '#6b7280', text: 'Unknown' };
  }
};
