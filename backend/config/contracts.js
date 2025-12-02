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

// Contract ABIs - Import from abis folder
import HenNFTABI from '../abis/HenNFT.json' assert { type: 'json' };
import HenBreedingABI from '../abis/HenBreeding.json' assert { type: 'json' };
import HenBattleABI from '../abis/HenBattle.json' assert { type: 'json' };
import HenRacingABI from '../abis/HenRacing.json' assert { type: 'json' };
import BettingSystemABI from '../abis/BettingSystem.json' assert { type: 'json' };

const ABI_MAP = {
  HenNFT: HenNFTABI.abi,
  HenBreeding: HenBreedingABI.abi,
  HenBattle: HenBattleABI.abi,
  HenRacing: HenRacingABI.abi,
  BettingSystem: BettingSystemABI.abi,
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
