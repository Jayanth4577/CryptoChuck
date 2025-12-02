import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Contract addresses from environment
export const CONTRACT_ADDRESSES = {
  HEN_NFT: process.env.HEN_NFT_ADDRESS,
  HEN_BREEDING: process.env.HEN_BREEDING_ADDRESS,
  HEN_BATTLE: process.env.HEN_BATTLE_ADDRESS,
  HEN_RACING: process.env.HEN_RACING_ADDRESS,
  BETTING_SYSTEM: process.env.BETTING_SYSTEM_ADDRESS,
};

// RPC Provider
export const getProvider = () => {
  return new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
};

// Contract ABIs - Dynamically import JSON files
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadABI = (contractName) => {
  try {
    const abiPath = join(__dirname, '..', 'abis', `${contractName}.json`);
    const abiFile = readFileSync(abiPath, 'utf-8');
    return JSON.parse(abiFile).abi;
  } catch (error) {
    console.error(`Failed to load ABI for ${contractName}:`, error);
    throw error;
  }
};

const ABI_MAP = {
  HenNFT: loadABI('HenNFT'),
  HenBreeding: loadABI('HenBreeding'),
  HenBattle: loadABI('HenBattle'),
  HenRacing: loadABI('HenRacing'),
  BettingSystem: loadABI('BettingSystem'),
};

export const getContractABI = (contractName) => {
  const abi = ABI_MAP[contractName];
  if (!abi) {
    throw new Error(`ABI not found for contract: ${contractName}`);
  }
  return abi;
};

// Get contract instance (read-only)
export const getContract = (contractName, address) => {
  const provider = getProvider();
  const abi = getContractABI(contractName);
  return new ethers.Contract(address, abi, provider);
};
