// Contract addresses configuration
// Uses environment variables for flexibility across deployments
export const CONTRACT_ADDRESSES = {
  henNFT: import.meta.env.VITE_HEN_NFT_ADDRESS || '0x115E28745dd5D04d0761D273584c5EcDE7D209E1',
  henBreeding: import.meta.env.VITE_HEN_BREEDING_ADDRESS || '0x16512a71c72C944b53A643f6de5C5a0Ceb6F9394',
  henBattle: import.meta.env.VITE_HEN_BATTLE_ADDRESS || '0x08aB3D806aE9Ad2d5078b6bc220c04080058CC48',
  henRacing: import.meta.env.VITE_HEN_RACING_ADDRESS || '0xb2a0a91Da875106921dcE72eB154714C0196DAAB',
  bettingSystem: import.meta.env.VITE_BETTING_SYSTEM_ADDRESS || '0x952411e2CB059f00b3B5Ef9E41DE9adAF2E59841',
};

// Network configuration
export const NETWORK_CONFIG = {
  sepolia: {
    chainId: '0xaa36a7', // 11155111 in hex
    chainName: 'Sepolia Testnet',
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  localhost: {
    chainId: '0x7a69', // 31337 in hex
    chainName: 'Hardhat Local',
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

// Export for easy importing
export default {
  addresses: CONTRACT_ADDRESSES,
  network: NETWORK_CONFIG,
};
