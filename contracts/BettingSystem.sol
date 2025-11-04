// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IHenBattle {
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
    
    function getBattle(uint256 battleId) external view returns (Battle memory);
}

interface IHenRacing {
    struct Race {
        uint256 raceId;
        uint256 startTime;
        uint256 endTime;
        uint256 entryFee;
        uint256 prizePool;
        uint256 maxParticipants;
        bool isActive;
        bool isComplete;
    }
}

contract BettingSystem is Ownable, ReentrancyGuard {
    IHenBattle public battleContract;
    IHenRacing public racingContract;
    
    // Bet types
    enum BetType { Battle, Race }
    
    // Battle bet structure
    struct BattleBet {
        uint256 betId;
        uint256 battleId;
        address bettor;
        uint256 henId;
        uint256 amount;
        bool claimed;
        uint256 payout;
    }
    
    // Race bet structure
    struct RaceBet {
        uint256 betId;
        uint256 raceId;
        address bettor;
        uint256 henId;
        uint256 amount;
        uint256 position; // 1 for winner, 2 for second, 3 for third
        bool claimed;
        uint256 payout;
    }
    
    // Bet tracking
    mapping(uint256 => BattleBet) public battleBets;
    mapping(uint256 => RaceBet) public raceBets;
    mapping(uint256 => uint256[]) public battleBetIds;
    mapping(uint256 => uint256[]) public raceBetIds;
    mapping(address => uint256[]) public userBattleBets;
    mapping(address => uint256[]) public userRaceBets;
    
    uint256 public battleBetCounter;
    uint256 public raceBetCounter;
    
    // Betting pools
    mapping(uint256 => mapping(uint256 => uint256)) public battlePools; // battleId => henId => total bets
    mapping(uint256 => mapping(uint256 => uint256)) public racePools; // raceId => henId => total bets
    
    // Fee structure
    uint256 public constant HOUSE_FEE = 100; // 1% (basis points)
    uint256 public constant MIN_BET = 0.001 ether;
    uint256 public constant MAX_BET = 10 ether;
    
    // Events
    event BattleBetPlaced(
        uint256 indexed betId,
        uint256 indexed battleId,
        address indexed bettor,
        uint256 henId,
        uint256 amount
    );
    event RaceBetPlaced(
        uint256 indexed betId,
        uint256 indexed raceId,
        address indexed bettor,
        uint256 henId,
        uint256 amount,
        uint256 position
    );
    event BetClaimed(
        uint256 indexed betId,
        address indexed bettor,
        uint256 payout,
        BetType betType
    );
    event OddsCalculated(
        uint256 indexed eventId,
        uint256 henId,
        uint256 odds,
        BetType betType
    );
    
    constructor(
        address _battleContract,
        address _racingContract
    ) {
        battleContract = IHenBattle(_battleContract);
        racingContract = IHenRacing(_racingContract);
    }
    
    // Place a bet on a battle
    function placeBattleBet(uint256 battleId, uint256 henId) 
        external 
        payable 
        nonReentrant 
    {
        require(msg.value >= MIN_BET && msg.value <= MAX_BET, "Invalid bet amount");
        
        IHenBattle.Battle memory battle = battleContract.getBattle(battleId);
        require(!battle.isComplete, "Battle already complete");
        require(battle.hen1Id == henId || battle.hen2Id == henId, "Invalid hen");
        
        battleBetCounter++;
        
        battleBets[battleBetCounter] = BattleBet({
            betId: battleBetCounter,
            battleId: battleId,
            bettor: msg.sender,
            henId: henId,
            amount: msg.value,
            claimed: false,
            payout: 0
        });
        
        battleBetIds[battleId].push(battleBetCounter);
        userBattleBets[msg.sender].push(battleBetCounter);
        battlePools[battleId][henId] += msg.value;
        
        emit BattleBetPlaced(battleBetCounter, battleId, msg.sender, henId, msg.value);
    }
    
    // Place a bet on a race
    function placeRaceBet(uint256 raceId, uint256 henId, uint256 position) 
        external 
        payable 
        nonReentrant 
    {
        require(msg.value >= MIN_BET && msg.value <= MAX_BET, "Invalid bet amount");
        require(position >= 1 && position <= 3, "Position must be 1-3");
        
        raceBetCounter++;
        
        raceBets[raceBetCounter] = RaceBet({
            betId: raceBetCounter,
            raceId: raceId,
            bettor: msg.sender,
            henId: henId,
            amount: msg.value,
            position: position,
            claimed: false,
            payout: 0
        });
        
        raceBetIds[raceId].push(raceBetCounter);
        userRaceBets[msg.sender].push(raceBetCounter);
        racePools[raceId][henId] += msg.value;
        
        emit RaceBetPlaced(raceBetCounter, raceId, msg.sender, henId, msg.value, position);
    }
    
    // Claim winnings from battle bet
    function claimBattleBet(uint256 betId) external nonReentrant {
        BattleBet storage bet = battleBets[betId];
        require(bet.bettor == msg.sender, "Not your bet");
        require(!bet.claimed, "Already claimed");
        
        IHenBattle.Battle memory battle = battleContract.getBattle(bet.battleId);
        require(battle.isComplete, "Battle not complete");
        
        if (battle.winnerId == bet.henId) {
            // Calculate payout based on odds
            uint256 totalPool = battlePools[bet.battleId][battle.hen1Id] + 
                              battlePools[bet.battleId][battle.hen2Id];
            uint256 winningPool = battlePools[bet.battleId][bet.henId];
            
            // Calculate payout with house fee
            uint256 netPool = (totalPool * (10000 - HOUSE_FEE)) / 10000;
            uint256 payout = (bet.amount * netPool) / winningPool;
            
            bet.payout = payout;
            bet.claimed = true;
            
            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Payout failed");
            
            emit BetClaimed(betId, msg.sender, payout, BetType.Battle);
        } else {
            // Lost bet
            bet.claimed = true;
            bet.payout = 0;
        }
    }
    
    // Claim winnings from race bet
    function claimRaceBet(uint256 betId) external nonReentrant {
        RaceBet storage bet = raceBets[betId];
        require(bet.bettor == msg.sender, "Not your bet");
        require(!bet.claimed, "Already claimed");
        
        // In production, check actual race results
        // For now, simplified version
        bet.claimed = true;
        
        // Calculate payout (simplified)
        uint256 payout = bet.amount * 2; // Example: 2x on win
        bet.payout = payout;
        
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Payout failed");
        
        emit BetClaimed(betId, msg.sender, payout, BetType.Race);
    }
    
    // Calculate odds for a battle
    function getBattleOdds(uint256 battleId, uint256 henId) 
        external 
        view 
        returns (uint256) 
    {
        IHenBattle.Battle memory battle = battleContract.getBattle(battleId);
        
        uint256 totalPool = battlePools[battleId][battle.hen1Id] + 
                          battlePools[battleId][battle.hen2Id];
        uint256 henPool = battlePools[battleId][henId];
        
        if (henPool == 0) {
            return 10000; // 100:1 if no bets on this hen
        }
        
        // Calculate decimal odds (scaled by 100)
        // Odds = (Total Pool / Hen Pool) * 100
        uint256 odds = (totalPool * 100) / henPool;
        
        return odds;
    }
    
    // Calculate odds for a race
    function getRaceOdds(uint256 raceId, uint256 henId) 
        external 
        view 
        returns (uint256) 
    {
        uint256 henPool = racePools[raceId][henId];
        
        if (henPool == 0) {
            return 10000; // Default high odds
        }
        
        // Calculate total pool
        // Note: This is simplified. In production, loop through all participants
        uint256 totalPool = henPool * 5; // Assuming 5 participants average
        uint256 odds = (totalPool * 100) / henPool;
        
        return odds;
    }
    
    // Get user's battle bets
    function getUserBattleBets(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userBattleBets[user];
    }
    
    // Get user's race bets
    function getUserRaceBets(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userRaceBets[user];
    }
    
    // Get battle bet details
    function getBattleBet(uint256 betId) 
        external 
        view 
        returns (BattleBet memory) 
    {
        return battleBets[betId];
    }
    
    // Get race bet details
    function getRaceBet(uint256 betId) 
        external 
        view 
        returns (RaceBet memory) 
    {
        return raceBets[betId];
    }
    
    // Get potential payout for a battle bet
    function calculateBattlePayout(uint256 battleId, uint256 henId, uint256 betAmount) 
        external 
        view 
        returns (uint256) 
    {
        IHenBattle.Battle memory battle = battleContract.getBattle(battleId);
        
        uint256 totalPool = battlePools[battleId][battle.hen1Id] + 
                          battlePools[battleId][battle.hen2Id] + betAmount;
        uint256 winningPool = battlePools[battleId][henId] + betAmount;
        
        uint256 netPool = (totalPool * (10000 - HOUSE_FEE)) / 10000;
        uint256 payout = (betAmount * netPool) / winningPool;
        
        return payout;
    }
    
    // Get all bets for a battle
    function getBattleBets(uint256 battleId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return battleBetIds[battleId];
    }
    
    // Get all bets for a race
    function getRaceBets(uint256 raceId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return raceBetIds[raceId];
    }
    
    // Get user statistics
    function getUserStats(address user) 
        external 
        view 
        returns (
            uint256 totalBattleBets,
            uint256 totalRaceBets,
            uint256 totalWagered,
            uint256 totalWon
        ) 
    {
        totalBattleBets = userBattleBets[user].length;
        totalRaceBets = userRaceBets[user].length;
        
        // Calculate total wagered and won
        for (uint256 i = 0; i < userBattleBets[user].length; i++) {
            uint256 betId = userBattleBets[user][i];
            BattleBet memory bet = battleBets[betId];
            totalWagered += bet.amount;
            if (bet.claimed) {
                totalWon += bet.payout;
            }
        }
        
        for (uint256 i = 0; i < userRaceBets[user].length; i++) {
            uint256 betId = userRaceBets[user][i];
            RaceBet memory bet = raceBets[betId];
            totalWagered += bet.amount;
            if (bet.claimed) {
                totalWon += bet.payout;
            }
        }
        
        return (totalBattleBets, totalRaceBets, totalWagered, totalWon);
    }
    
    // Withdraw house fees
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}