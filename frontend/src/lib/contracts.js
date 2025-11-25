import { ethers } from 'ethers';
import HenNFTJson from '../abis/HenNFT.json';
import HenBreedingJson from '../abis/HenBreeding.json';
import HenBattleJson from '../abis/HenBattle.json';
import HenRacingJson from '../abis/HenRacing.json';
import BettingSystemJson from '../abis/BettingSystem.json';
import { CONTRACT_ADDRESSES } from '../config/contracts';

export function getProvider() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  // Fallback to localhost RPC
  return new ethers.JsonRpcProvider('http://127.0.0.1:8545');
}

export async function getSigner() {
  const provider = getProvider();
  if (typeof window !== 'undefined' && window.ethereum) {
    await provider.send('eth_requestAccounts', []);
    return provider.getSigner();
  }
  return provider.getSigner();
}

export async function getContracts(signerOrProvider) {
  const providerOrSigner = signerOrProvider || getProvider();

  const henNFT = new ethers.Contract(CONTRACT_ADDRESSES.henNFT, HenNFTJson.abi, providerOrSigner);
  const henBreeding = new ethers.Contract(CONTRACT_ADDRESSES.henBreeding, HenBreedingJson.abi, providerOrSigner);
  const henBattle = new ethers.Contract(CONTRACT_ADDRESSES.henBattle, HenBattleJson.abi, providerOrSigner);
  const henRacing = new ethers.Contract(CONTRACT_ADDRESSES.henRacing, HenRacingJson.abi, providerOrSigner);
  const bettingSystem = new ethers.Contract(CONTRACT_ADDRESSES.bettingSystem, BettingSystemJson.abi, providerOrSigner);

  return { henNFT, henBreeding, henBattle, henRacing, bettingSystem };
}

export default getContracts;
