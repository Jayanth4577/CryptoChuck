// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IHenNFT {
    struct HenTraits {
        uint8 strength;
        uint8 speed;
        uint8 stamina;
        uint8 intelligence;
        uint8 luck;
        uint8 generation;
        uint256 birthTime;
        uint256 lastBreedTime;
        uint256 wins;
        uint256 losses;
        uint256 racesWon;
        bool isAlive;
    }
    
    function getHenTraits(uint256 tokenId) external view returns (HenTraits memory);
    function ownerOf(uint256 tokenId) external view returns (address);
    function updateBattleStats(uint256 tokenId, bool won) external;
}

contract HenBattle is Ownable, ReentrancyGuard {
    IHenNFT public henNFT;
    
    // Battle structure
    struct Battle {
        uint256 battleId;
        uint256 hen1Id;
        uint256 hen2Id;
        address player1;
        address player2;
        uint256 startTime;
        uint256 endTime;
        uint256 winnerId;
        bool isComplete;
        uint256 rewardAmount;
    }
    
    // Battle history
    mapping(uint256 => Battle) public battles;
    mapping(address => uint256[]) public playerBattles;
    uint256 public battleCounter;
    
    // Rewards
    uint256 public constant BATTLE_REWARD = 100 * 10**18; // 100 tokens
    uint256 public constant BATTLE_COOLDOWN = 1 hours;
    mapping(uint256 => uint256) public lastBattleTime;
    
    // Events
    event BattleCreated(
        uint256 indexed battleId,
        uint256 indexed hen1Id,
        uint256 indexed hen2Id,
        address player1,
        address player2
    );
    event BattleComplete(
        uint256 indexed battleId,
        uint256 winnerId,
        uint256 loserId,
        address winner,
        uint256 rewardAmount
    );
    event BattleRound(
        uint256 indexed battleId,
        uint256 round,
        uint256 hen1Damage,
        uint256 hen2Damage,
        uint256 hen1Health,
        uint256 hen2Health
    );
    
    constructor(address _henNFTAddress) {
        henNFT = IHenNFT(_henNFTAddress);
    }
    
    // Create and execute a battle
    function createBattle(uint256 hen1Id, uint256 hen2Id) 
        external 
        nonReentrant 
        returns (uint256) 
    {
        require(henNFT.ownerOf(hen1Id) == msg.sender, "Not owner of hen 1");
        require(hen1Id != hen2Id, "Cannot battle with itself");
        require(
            block.timestamp >= lastBattleTime[hen1Id] + BATTLE_COOLDOWN,
            "Hen 1 on cooldown"
        );
        require(
            block.timestamp >= lastBattleTime[hen2Id] + BATTLE_COOLDOWN,
            "Hen 2 on cooldown"
        );
        
        IHenNFT.HenTraits memory hen1 = henNFT.getHenTraits(hen1Id);
        IHenNFT.HenTraits memory hen2 = henNFT.getHenTraits(hen2Id);
        
        require(hen1.isAlive && hen2.isAlive, "Hen must be alive");
        
        battleCounter++;
        address player2 = henNFT.ownerOf(hen2Id);
        
        battles[battleCounter] = Battle({
            battleId: battleCounter,
            hen1Id: hen1Id,
            hen2Id: hen2Id,
            player1: msg.sender,
            player2: player2,
            startTime: block.timestamp,
            endTime: 0,
            winnerId: 0,
            isComplete: false,
            rewardAmount: BATTLE_REWARD
        });
        
        playerBattles[msg.sender].push(battleCounter);
        playerBattles[player2].push(battleCounter);
        
        lastBattleTime[hen1Id] = block.timestamp;
        lastBattleTime[hen2Id] = block.timestamp;
        
        emit BattleCreated(battleCounter, hen1Id, hen2Id, msg.sender, player2);
        
        // Execute battle immediately
        _executeBattle(battleCounter);
        
        return battleCounter;
    }
    
    // Execute battle logic
    function _executeBattle(uint256 battleId) private {
        Battle storage battle = battles[battleId];
        
        IHenNFT.HenTraits memory hen1 = henNFT.getHenTraits(battle.hen1Id);
        IHenNFT.HenTraits memory hen2 = henNFT.getHenTraits(battle.hen2Id);
        
        // Calculate initial health based on stamina
        uint256 hen1Health = uint256(hen1.stamina) * 10;
        uint256 hen2Health = uint256(hen2.stamina) * 10;
        
        uint256 round = 0;
        uint256 maxRounds = 20;
        
        // Battle simulation
        while (hen1Health > 0 && hen2Health > 0 && round < maxRounds) {
            round++;
            
            // Determine who attacks first (based on speed)
            bool hen1First = _determineFirstAttacker(hen1, hen2, round);

            // Declare damage variables outside conditional blocks so they exist for the emit
            uint256 damage1 = 0;
            uint256 damage2 = 0;

            if (hen1First) {
                damage1 = _calculateDamage(hen1, hen2, round);
                hen2Health = hen2Health > damage1 ? hen2Health - damage1 : 0;

                if (hen2Health > 0) {
                    damage2 = _calculateDamage(hen2, hen1, round);
                    hen1Health = hen1Health > damage2 ? hen1Health - damage2 : 0;
                }
            } else {
                damage2 = _calculateDamage(hen2, hen1, round);
                hen1Health = hen1Health > damage2 ? hen1Health - damage2 : 0;

                if (hen1Health > 0) {
                    damage1 = _calculateDamage(hen1, hen2, round);
                    hen2Health = hen2Health > damage1 ? hen2Health - damage1 : 0;
                }
            }

            emit BattleRound(battleId, round, damage1, damage2, hen1Health, hen2Health);
        }
        
        // Determine winner
        uint256 winnerId;
        uint256 loserId;
        address winner;
        
        if (hen1Health > hen2Health) {
            winnerId = battle.hen1Id;
            loserId = battle.hen2Id;
            winner = battle.player1;
        } else if (hen2Health > hen1Health) {
            winnerId = battle.hen2Id;
            loserId = battle.hen1Id;
            winner = battle.player2;
        } else {
            // Tie - use luck as tiebreaker
            if (hen1.luck >= hen2.luck) {
                winnerId = battle.hen1Id;
                loserId = battle.hen2Id;
                winner = battle.player1;
            } else {
                winnerId = battle.hen2Id;
                loserId = battle.hen1Id;
                winner = battle.player2;
            }
        }
        
        battle.winnerId = winnerId;
        battle.endTime = block.timestamp;
        battle.isComplete = true;
        
        // Update stats
        henNFT.updateBattleStats(winnerId, true);
        henNFT.updateBattleStats(loserId, false);
        
        emit BattleComplete(battleId, winnerId, loserId, winner, BATTLE_REWARD);
    }
    
    // Determine which hen attacks first
    function _determineFirstAttacker(
        IHenNFT.HenTraits memory hen1,
        IHenNFT.HenTraits memory hen2,
        uint256 round
    ) private view returns (bool) {
        if (hen1.speed > hen2.speed) {
            return true;
        } else if (hen2.speed > hen1.speed) {
            return false;
        } else {
            // Equal speed - use randomness
            uint256 random = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                round,
                hen1.speed,
                hen2.speed
            ))) % 2;
            return random == 0;
        }
    }
    
    // Calculate damage dealt
    function _calculateDamage(
        IHenNFT.HenTraits memory attacker,
        IHenNFT.HenTraits memory defender,
        uint256 round
    ) private view returns (uint256) {
        // Base damage from strength
        uint256 baseDamage = uint256(attacker.strength);
        
        // Intelligence affects strategy (bonus damage)
        uint256 intelligenceBonus = (uint256(attacker.intelligence) * baseDamage) / 200;
        
        // Luck affects critical hits
        uint256 luckRoll = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            round,
            attacker.luck,
            block.prevrandao
        ))) % 100;
        
        uint256 criticalMultiplier = 100;
        if (luckRoll < attacker.luck / 2) {
            criticalMultiplier = 150; // 1.5x damage on crit
        }
        
        // Defense reduction from defender's stamina
        uint256 defense = uint256(defender.stamina) / 10;
        
        uint256 totalDamage = (baseDamage + intelligenceBonus) * criticalMultiplier / 100;
        totalDamage = totalDamage > defense ? totalDamage - defense : 1;
        
        return totalDamage;
    }
    
    // Get battle details
    function getBattle(uint256 battleId) 
        external 
        view 
        returns (Battle memory) 
    {
        return battles[battleId];
    }
    
    // Get player's battle history
    function getPlayerBattles(address player) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return playerBattles[player];
    }
    
    // Get hen's battle stats
    function getHenBattleStats(uint256 henId) 
        external 
        view 
        returns (
            uint256 totalBattles,
            uint256 wins,
            uint256 losses,
            uint256 winRate,
            uint256 cooldownRemaining
        ) 
    {
        IHenNFT.HenTraits memory traits = henNFT.getHenTraits(henId);
        totalBattles = traits.wins + traits.losses;
        wins = traits.wins;
        losses = traits.losses;
        winRate = totalBattles > 0 ? (wins * 100) / totalBattles : 0;
        
        uint256 cooldown = 0;
        if (block.timestamp < lastBattleTime[henId] + BATTLE_COOLDOWN) {
            cooldown = (lastBattleTime[henId] + BATTLE_COOLDOWN) - block.timestamp;
        }
        
        return (totalBattles, wins, losses, winRate, cooldown);
    }
    
    // Check if hen can battle
    function canBattle(uint256 henId) external view returns (bool, string memory) {
        IHenNFT.HenTraits memory traits = henNFT.getHenTraits(henId);
        
        if (!traits.isAlive) {
            return (false, "Hen not alive");
        }
        
        if (block.timestamp < lastBattleTime[henId] + BATTLE_COOLDOWN) {
            return (false, "Hen on cooldown");
        }
        
        return (true, "Can battle");
    }
}