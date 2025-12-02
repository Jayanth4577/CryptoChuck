// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

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
    function updateRaceStats(uint256 tokenId) external;
}

contract HenRacing is Ownable, ReentrancyGuard {
    IHenNFT public henNFT;
    
    // Race structure
    struct Race {
        uint256 raceId;
        uint256 startTime;
        uint256 endTime;
        uint256 entryFee;
        uint256 prizePool;
        uint256 maxParticipants;
        uint256[] participants;
        uint256[] finalPositions;
        bool isActive;
        bool isComplete;
        mapping(uint256 => uint256) henToPosition;
    }
    
    // Race results
    struct RaceResult {
        uint256 raceId;
        uint256 henId;
        address owner;
        uint256 position;
        uint256 finishTime;
        uint256 prize;
    }
    
    mapping(uint256 => Race) public races;
    mapping(uint256 => RaceResult[]) public raceResults;
    mapping(uint256 => mapping(uint256 => bool)) public henInRace;
    mapping(uint256 => uint256) public henActiveRace; // Tracks which race a hen is currently in (0 = none)
    uint256 public raceCounter;
    uint256 public activeRacesCount;
    uint256 public constant MAX_ACTIVE_RACES = 2;
    uint256 public constant RACE_DURATION = 30; // 30 seconds
    
    // Prize distribution (1st: 50%, 2nd: 30%, 3rd: 20%)
    uint256[3] public prizeDistribution = [50, 30, 20];
    
    // Events
    event RaceCreated(
        uint256 indexed raceId,
        uint256 startTime,
        uint256 entryFee,
        uint256 maxParticipants
    );
    event HenEntered(
        uint256 indexed raceId,
        uint256 indexed henId,
        address indexed owner
    );
    event RaceStarted(uint256 indexed raceId, uint256[] participants);
    event RaceComplete(
        uint256 indexed raceId,
        uint256[] winners,
        uint256[] prizes
    );
    event PrizeAwarded(
        uint256 indexed raceId,
        uint256 indexed henId,
        address indexed owner,
        uint256 position,
        uint256 prize
    );
    
    constructor(address _henNFTAddress) {
        henNFT = IHenNFT(_henNFTAddress);
    }
    
    // Create a new race (anyone can create)
    function createRace(
        uint256 entryFee,
        uint256 maxParticipants
    ) external returns (uint256) {
        require(activeRacesCount < MAX_ACTIVE_RACES, "Maximum active races reached");
        require(entryFee >= 0.001 ether && entryFee <= 1 ether, "Entry fee must be 0.001-1 ETH");
        require(maxParticipants >= 5 && maxParticipants <= 20, "Participant count must be 5-20");
        
        raceCounter++;
        activeRacesCount++;
        Race storage newRace = races[raceCounter];
        newRace.raceId = raceCounter;
        newRace.startTime = 0; // Will be set when race starts
        newRace.entryFee = entryFee;
        newRace.maxParticipants = maxParticipants;
        newRace.isActive = true;
        newRace.isComplete = false;
        
        emit RaceCreated(raceCounter, block.timestamp, entryFee, maxParticipants);
        return raceCounter;
    }
    
    // Enter a hen in a race
    function enterRace(uint256 raceId, uint256 henId) 
        external 
        payable 
        nonReentrant 
    {
        Race storage race = races[raceId];
        
        require(race.isActive, "Race not active");
        require(!race.isComplete, "Race already complete");
        require(race.startTime == 0 || block.timestamp < race.startTime, "Race already started");
        require(henNFT.ownerOf(henId) == msg.sender, "Not owner of hen");
        require(!henInRace[raceId][henId], "Hen already entered");
        require(henActiveRace[henId] == 0, "Hen already in an active race");
        require(race.participants.length < race.maxParticipants, "Race full");
        require(msg.value >= race.entryFee, "Insufficient entry fee");
        
        IHenNFT.HenTraits memory traits = henNFT.getHenTraits(henId);
        require(traits.isAlive, "Hen must be alive");
        
        race.participants.push(henId);
        race.prizePool += race.entryFee;
        henInRace[raceId][henId] = true;
        henActiveRace[henId] = raceId;
        
        emit HenEntered(raceId, henId, msg.sender);
        
        // Refund excess payment
        if (msg.value > race.entryFee) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - race.entryFee}("");
            require(success, "Refund failed");
        }
    }
    
    // Manually start a race
    function startRace(uint256 raceId) external {
        Race storage race = races[raceId];
        require(race.isActive, "Race not active");
        require(race.startTime == 0 || race.startTime > 0, "Invalid race");
        require(race.participants.length >= 5, "Minimum 5 participants required");
        require(!race.isComplete, "Race already complete");
        
        race.startTime = block.timestamp;
        
        emit RaceStarted(raceId, race.participants);
    }
    
    // Complete a race after 30 seconds
    function completeRace(uint256 raceId) external {
        Race storage race = races[raceId];
        require(race.startTime > 0, "Race not started");
        require(!race.isComplete, "Race already complete");
        require(block.timestamp >= race.startTime + RACE_DURATION, "Race still in progress");
        
        _simulateRace(raceId);
        
        // Auto-create a new race with same settings if under limit
        if (activeRacesCount < MAX_ACTIVE_RACES) {
            raceCounter++;
            activeRacesCount++;
            Race storage newRace = races[raceCounter];
            newRace.raceId = raceCounter;
            newRace.startTime = 0;
            newRace.entryFee = race.entryFee;
            newRace.maxParticipants = race.maxParticipants;
            newRace.isActive = true;
            newRace.isComplete = false;
            
            emit RaceCreated(raceCounter, block.timestamp, race.entryFee, race.maxParticipants);
        }
    }
    
    // Simulate race based on hen attributes
    function _simulateRace(uint256 raceId) private {
        Race storage race = races[raceId];
        uint256[] memory participants = race.participants;
        uint256[] memory finishTimes = new uint256[](participants.length);
        
        // Calculate finish time for each hen
        for (uint256 i = 0; i < participants.length; i++) {
            uint256 henId = participants[i];
            IHenNFT.HenTraits memory traits = henNFT.getHenTraits(henId);
            
            // Base time inversely proportional to speed
            uint256 baseTime = 10000 - (uint256(traits.speed) * 50);
            
            // Stamina affects consistency
            uint256 staminaFactor = (uint256(traits.stamina) * 10);
            
            // Luck affects race outcome
            uint256 luckBonus = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                henId,
                i,
                block.prevrandao
            ))) % uint256(traits.luck);
            
            finishTimes[i] = baseTime - staminaFactor - luckBonus;
        }
        
        // Sort participants by finish time
        _sortByFinishTime(participants, finishTimes);
        
        // Assign positions and distribute prizes
        _distributeRacePrizes(raceId, participants);
        
        race.finalPositions = participants;
        race.isComplete = true;
        race.endTime = block.timestamp;
        activeRacesCount--;
        
        // Clear hen active race tracking
        for (uint256 i = 0; i < participants.length; i++) {
            henActiveRace[participants[i]] = 0;
        }
    }
    
    // Sort hens by finish time (bubble sort for simplicity)
    function _sortByFinishTime(
        uint256[] memory participants,
        uint256[] memory finishTimes
    ) private pure {
        uint256 n = participants.length;
        for (uint256 i = 0; i < n - 1; i++) {
            for (uint256 j = 0; j < n - i - 1; j++) {
                if (finishTimes[j] > finishTimes[j + 1]) {
                    // Swap finish times
                    (finishTimes[j], finishTimes[j + 1]) = (finishTimes[j + 1], finishTimes[j]);
                    // Swap participants
                    (participants[j], participants[j + 1]) = (participants[j + 1], participants[j]);
                }
            }
        }
    }
    
    // Distribute prizes to winners
    function _distributeRacePrizes(uint256 raceId, uint256[] memory sortedParticipants) private {
        Race storage race = races[raceId];
        uint256 prizePool = race.prizePool;
        
        uint256[] memory winners = new uint256[](3);
        uint256[] memory prizes = new uint256[](3);
        
        // Distribute to top 3
        uint256 winnersCount = sortedParticipants.length < 3 ? sortedParticipants.length : 3;
        
        for (uint256 i = 0; i < winnersCount; i++) {
            uint256 henId = sortedParticipants[i];
            uint256 prize = (prizePool * prizeDistribution[i]) / 100;
            address owner = henNFT.ownerOf(henId);
            
            winners[i] = henId;
            prizes[i] = prize;
            
            // Update race stats
            if (i == 0) {
                henNFT.updateRaceStats(henId);
            }
            
            // Store result
            raceResults[raceId].push(RaceResult({
                raceId: raceId,
                henId: henId,
                owner: owner,
                position: i + 1,
                finishTime: block.timestamp,
                prize: prize
            }));
            
            race.henToPosition[henId] = i + 1;
            
            // Transfer prize
            (bool success, ) = payable(owner).call{value: prize}("");
            require(success, "Prize transfer failed");
            
            emit PrizeAwarded(raceId, henId, owner, i + 1, prize);
        }
        
        emit RaceComplete(raceId, winners, prizes);
    }
    
    // Get race details
    function getRaceParticipants(uint256 raceId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return races[raceId].participants;
    }
    
    // Get race results
    function getRaceResults(uint256 raceId) 
        external 
        view 
        returns (RaceResult[] memory) 
    {
        return raceResults[raceId];
    }
    
    // Get hen's race statistics
    function getHenRaceStats(uint256 henId) 
        external 
        view 
        returns (
            uint256 totalRaces,
            uint256 wins,
            uint256 totalPrizes
        ) 
    {
        IHenNFT.HenTraits memory traits = henNFT.getHenTraits(henId);
        wins = traits.racesWon;
        
        // Count total races participated
        uint256 raceCount = 0;
        uint256 totalEarned = 0;
        
        for (uint256 i = 1; i <= raceCounter; i++) {
            if (henInRace[i][henId]) {
                raceCount++;
                
                // Sum prizes
                RaceResult[] memory results = raceResults[i];
                for (uint256 j = 0; j < results.length; j++) {
                    if (results[j].henId == henId) {
                        totalEarned += results[j].prize;
                    }
                }
            }
        }
        
        return (raceCount, wins, totalEarned);
    }
    
    // Check if hen can enter race
    function canEnterRace(uint256 raceId, uint256 henId) 
        external 
        view 
        returns (bool, string memory) 
    {
        Race storage race = races[raceId];
        
        if (!race.isActive) {
            return (false, "Race not active");
        }
        
        if (race.isComplete) {
            return (false, "Race already complete");
        }
        
        if (race.startTime > 0 && block.timestamp >= race.startTime) {
            return (false, "Race already started");
        }
        
        if (henInRace[raceId][henId]) {
            return (false, "Hen already entered");
        }
        
        if (henActiveRace[henId] != 0) {
            return (false, "Hen in active race");
        }
        
        if (race.participants.length >= race.maxParticipants) {
            return (false, "Race full");
        }
        
        IHenNFT.HenTraits memory traits = henNFT.getHenTraits(henId);
        if (!traits.isAlive) {
            return (false, "Hen not alive");
        }
        
        return (true, "Can enter");
    }
    
    // Cancel race (only if not enough participants)
    function cancelRace(uint256 raceId) external onlyOwner {
        Race storage race = races[raceId];
        require(!race.isComplete, "Race already complete");
        require(race.startTime == 0, "Race already started");
        require(race.participants.length < 5, "Too many participants to cancel");
        
        // Refund participants and clear tracking
        for (uint256 i = 0; i < race.participants.length; i++) {
            uint256 henId = race.participants[i];
            address owner = henNFT.ownerOf(henId);
            henActiveRace[henId] = 0;
            
            (bool success, ) = payable(owner).call{value: race.entryFee}("");
            require(success, "Refund failed");
        }
        
        race.isActive = false;
        if (activeRacesCount > 0) {
            activeRacesCount--;
        }
    }
}