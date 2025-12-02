import { ethers } from 'ethers';
import { getContract, CONTRACT_ADDRESSES } from '../config/contracts.js';

/**
 * Service layer for blockchain contract interactions
 * All read-only operations - write operations should be done from frontend with user's wallet
 */

export class ContractService {
  // HenNFT Operations
  static async getHenDetails(tokenId) {
    try {
      const contract = getContract('HenNFT', CONTRACT_ADDRESSES.HEN_NFT);
      const hen = await contract.getHenInfo(tokenId);
      return {
        name: hen.name,
        generation: hen.generation.toString(),
        genes: hen.genes.toString(),
        birthTime: hen.birthTime.toString(),
        lastBreedTime: hen.lastBreedTime.toString(),
        breedCount: hen.breedCount.toString(),
        wins: hen.wins.toString(),
        losses: hen.losses.toString(),
        speed: hen.speed.toString(),
        stamina: hen.stamina.toString(),
        aggression: hen.aggression.toString(),
      };
    } catch (error) {
      throw new Error(`Failed to get hen details: ${error.message}`);
    }
  }

  static async getUserHens(userAddress) {
    try {
      const contract = getContract('HenNFT', CONTRACT_ADDRESSES.HEN_NFT);
      const balance = await contract.balanceOf(userAddress);
      const hens = [];

      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
        const henDetails = await this.getHenDetails(tokenId);
        hens.push({ tokenId: tokenId.toString(), ...henDetails });
      }

      return hens;
    } catch (error) {
      throw new Error(`Failed to get user hens: ${error.message}`);
    }
  }

  static async getMintPrice() {
    try {
      const contract = getContract('HenNFT', CONTRACT_ADDRESSES.HEN_NFT);
      const price = await contract.MINT_PRICE();
      return ethers.formatEther(price);
    } catch (error) {
      throw new Error(`Failed to get mint price: ${error.message}`);
    }
  }

  // HenBreeding Operations
  static async getBreedingCooldown() {
    try {
      const contract = getContract('HenBreeding', CONTRACT_ADDRESSES.HEN_BREEDING);
      const cooldown = await contract.BREEDING_COOLDOWN();
      return cooldown.toString();
    } catch (error) {
      throw new Error(`Failed to get breeding cooldown: ${error.message}`);
    }
  }

  static async getBreedingCost() {
    try {
      const contract = getContract('HenBreeding', CONTRACT_ADDRESSES.HEN_BREEDING);
      const cost = await contract.BREEDING_COST();
      return ethers.formatEther(cost);
    } catch (error) {
      throw new Error(`Failed to get breeding cost: ${error.message}`);
    }
  }

  // HenBattle Operations
  static async getActiveBattles() {
    try {
      const contract = getContract('HenBattle', CONTRACT_ADDRESSES.HEN_BATTLE);
      const battleCount = await contract.battleCount();
      const battles = [];

      for (let i = 1; i <= battleCount; i++) {
        try {
          const battle = await contract.battles(i);
          if (battle.isActive) {
            battles.push({
              battleId: i.toString(),
              hen1Id: battle.hen1Id.toString(),
              hen2Id: battle.hen2Id.toString(),
              wager: ethers.formatEther(battle.wager),
              player1: battle.player1,
              isActive: battle.isActive,
            });
          }
        } catch (err) {
          console.log(`Battle ${i} not found or error:`, err.message);
        }
      }

      return battles;
    } catch (error) {
      throw new Error(`Failed to get active battles: ${error.message}`);
    }
  }

  static async getMinWager() {
    try {
      const contract = getContract('HenBattle', CONTRACT_ADDRESSES.HEN_BATTLE);
      const minWager = await contract.MIN_WAGER();
      return ethers.formatEther(minWager);
    } catch (error) {
      throw new Error(`Failed to get min wager: ${error.message}`);
    }
  }

  // HenRacing Operations
  static async getActiveRaces() {
    try {
      const contract = getContract('HenRacing', CONTRACT_ADDRESSES.HEN_RACING);
      const raceCount = await contract.raceCount();
      const races = [];

      for (let i = 1; i <= raceCount; i++) {
        try {
          const race = await contract.races(i);
          if (!race.completed && race.participants.length < 4) {
            races.push({
              raceId: i.toString(),
              entryFee: ethers.formatEther(race.entryFee),
              participants: race.participants.map(p => p.toString()),
              completed: race.completed,
            });
          }
        } catch (err) {
          console.log(`Race ${i} not found or error:`, err.message);
        }
      }

      return races;
    } catch (error) {
      throw new Error(`Failed to get active races: ${error.message}`);
    }
  }

  static async getRaceEntryFee() {
    try {
      const contract = getContract('HenRacing', CONTRACT_ADDRESSES.HEN_RACING);
      const fee = await contract.RACE_ENTRY_FEE();
      return ethers.formatEther(fee);
    } catch (error) {
      throw new Error(`Failed to get race entry fee: ${error.message}`);
    }
  }

  // BettingSystem Operations
  static async getActiveBets() {
    try {
      const contract = getContract('BettingSystem', CONTRACT_ADDRESSES.BETTING_SYSTEM);
      const betCount = await contract.betCount();
      const bets = [];

      for (let i = 1; i <= betCount; i++) {
        try {
          const bet = await contract.bets(i);
          if (bet.isActive) {
            bets.push({
              betId: i.toString(),
              eventType: bet.eventType.toString(),
              eventId: bet.eventId.toString(),
              totalPool: ethers.formatEther(bet.totalPool),
              isActive: bet.isActive,
              isResolved: bet.isResolved,
            });
          }
        } catch (err) {
          console.log(`Bet ${i} not found or error:`, err.message);
        }
      }

      return bets;
    } catch (error) {
      throw new Error(`Failed to get active bets: ${error.message}`);
    }
  }

  static async getMinBetAmount() {
    try {
      const contract = getContract('BettingSystem', CONTRACT_ADDRESSES.BETTING_SYSTEM);
      const minBet = await contract.MIN_BET_AMOUNT();
      return ethers.formatEther(minBet);
    } catch (error) {
      throw new Error(`Failed to get min bet amount: ${error.message}`);
    }
  }
}
