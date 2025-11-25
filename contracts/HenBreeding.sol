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
    function mintOffspring(
        address to,
        uint8 strength,
        uint8 speed,
        uint8 stamina,
        uint8 intelligence,
        uint8 luck,
        uint8 generation
    ) external returns (uint256);
}

contract HenBreeding is Ownable, ReentrancyGuard {
    IHenNFT public henNFT;
    
    // Breeding costs and cooldowns
    uint256 public constant BREEDING_COST = 0.01 ether;
    uint256 public constant BREEDING_COOLDOWN = 7 days;
    uint256 public constant MAX_GENERATION = 10;
    
    // Track breeding pairs to prevent inbreeding
    mapping(uint256 => mapping(uint256 => bool)) public hasBred;
    mapping(uint256 => uint256) public breedCount;
    mapping(uint256 => uint256[]) public offspring;
    
    // Events
    event BreedingInitiated(
        uint256 indexed parent1Id,
        uint256 indexed parent2Id,
        uint256 indexed offspringId,
        address breeder
    );
    event OffspringBorn(uint256 indexed tokenId, IHenNFT.HenTraits traits);
    
    constructor(address _henNFTAddress) {
        henNFT = IHenNFT(_henNFTAddress);
    }
    
    // Breed two hens
    function breedHens(uint256 parent1Id, uint256 parent2Id) 
        external 
        payable 
        nonReentrant 
        returns (uint256) 
    {
        require(msg.value >= BREEDING_COST, "Insufficient breeding fee");
        require(parent1Id != parent2Id, "Cannot breed with itself");
        require(henNFT.ownerOf(parent1Id) == msg.sender, "Not owner of parent 1");
        require(henNFT.ownerOf(parent2Id) == msg.sender, "Not owner of parent 2");
        require(!hasBred[parent1Id][parent2Id] && !hasBred[parent2Id][parent1Id], "Already bred");
        
        IHenNFT.HenTraits memory parent1 = henNFT.getHenTraits(parent1Id);
        IHenNFT.HenTraits memory parent2 = henNFT.getHenTraits(parent2Id);
        
        require(parent1.isAlive && parent2.isAlive, "Parent must be alive");
        require(
            block.timestamp >= parent1.lastBreedTime + BREEDING_COOLDOWN,
            "Parent 1 cooldown not finished"
        );
        require(
            block.timestamp >= parent2.lastBreedTime + BREEDING_COOLDOWN,
            "Parent 2 cooldown not finished"
        );
        require(
            parent1.generation < MAX_GENERATION && parent2.generation < MAX_GENERATION,
            "Max generation reached"
        );
        
        // Mark as bred
        hasBred[parent1Id][parent2Id] = true;
        hasBred[parent2Id][parent1Id] = true;
        breedCount[parent1Id]++;
        breedCount[parent2Id]++;
        
        // Generate offspring traits (simplified - use Chainlink VRF in production)
        uint256 seed = _generateOffspringId(parent1Id, parent2Id);
        IHenNFT.HenTraits memory offspringTraits = _inheritTraits(parent1, parent2, seed);

        // Mint offspring via HenNFT contract (breeding contract must be authorized in HenNFT)
        uint256 newTokenId = henNFT.mintOffspring(
            msg.sender,
            offspringTraits.strength,
            offspringTraits.speed,
            offspringTraits.stamina,
            offspringTraits.intelligence,
            offspringTraits.luck,
            offspringTraits.generation
        );

        // Record offspring relationship (store the actual tokenId)
        offspring[parent1Id].push(newTokenId);
        offspring[parent2Id].push(newTokenId);

        emit BreedingInitiated(parent1Id, parent2Id, newTokenId, msg.sender);
        emit OffspringBorn(newTokenId, offspringTraits);

        return newTokenId;
    }
    
    // Calculate offspring traits based on parents
    function _inheritTraits(
        IHenNFT.HenTraits memory parent1,
        IHenNFT.HenTraits memory parent2,
        uint256 seed
    ) private view returns (IHenNFT.HenTraits memory) {
        uint8 generation = parent1.generation > parent2.generation ? 
                          parent1.generation + 1 : parent2.generation + 1;
        
        return IHenNFT.HenTraits({
            strength: _inheritAttribute(parent1.strength, parent2.strength, seed, "strength"),
            speed: _inheritAttribute(parent1.speed, parent2.speed, seed, "speed"),
            stamina: _inheritAttribute(parent1.stamina, parent2.stamina, seed, "stamina"),
            intelligence: _inheritAttribute(parent1.intelligence, parent2.intelligence, seed, "intelligence"),
            luck: _inheritAttribute(parent1.luck, parent2.luck, seed, "luck"),
            generation: generation,
            birthTime: block.timestamp,
            lastBreedTime: 0,
            wins: 0,
            losses: 0,
            racesWon: 0,
            isAlive: true
        });
    }
    
    // Inherit single attribute with genetic variation
    function _inheritAttribute(
        uint8 parent1Attr,
        uint8 parent2Attr,
        uint256 seed,
        string memory attrName
    ) private view returns (uint8) {
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            seed,
            attrName,
            parent1Attr,
            parent2Attr
        ))) % 100;
        
        // 40% chance from parent1, 40% from parent2, 20% mutation
        if (random < 40) {
            return _mutate(parent1Attr, seed);
        } else if (random < 80) {
            return _mutate(parent2Attr, seed);
        } else {
            // Average with mutation
            uint8 avg = uint8((uint16(parent1Attr) + uint16(parent2Attr)) / 2);
            return _mutate(avg, seed);
        }
    }
    
    // Apply random mutation (+/- 5 points)
    function _mutate(uint8 value, uint256 seed) private view returns (uint8) {
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            seed,
            value,
            block.prevrandao
        ))) % 11; // 0-10
        
        int16 mutation = int16(uint16(random)) - 5; // -5 to +5
        int16 newValue = int16(uint16(value)) + mutation;
        
        // Clamp between 1 and 100
        if (newValue < 1) return 1;
        if (newValue > 100) return 100;
        return uint8(uint16(newValue));
    }
    
    // Generate pseudo-unique offspring ID
    function _generateOffspringId(uint256 parent1Id, uint256 parent2Id) 
        private 
        view 
        returns (uint256) 
    {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            parent1Id,
            parent2Id,
            msg.sender,
            block.prevrandao
        )));
    }
    
    // Get breeding info for a hen
    function getBreedingInfo(uint256 tokenId) 
        external 
        view 
        returns (
            uint256 breedingCount,
            uint256 cooldownRemaining,
            uint256[] memory offspringIds
        ) 
    {
        IHenNFT.HenTraits memory traits = henNFT.getHenTraits(tokenId);
        uint256 cooldown = 0;
        
        if (block.timestamp < traits.lastBreedTime + BREEDING_COOLDOWN) {
            cooldown = (traits.lastBreedTime + BREEDING_COOLDOWN) - block.timestamp;
        }
        
        return (
            breedCount[tokenId],
            cooldown,
            offspring[tokenId]
        );
    }
    
    // Check if two hens can breed
    function canBreed(uint256 parent1Id, uint256 parent2Id) 
        external 
        view 
        returns (bool, string memory) 
    {
        if (parent1Id == parent2Id) {
            return (false, "Cannot breed with itself");
        }
        
        if (hasBred[parent1Id][parent2Id] || hasBred[parent2Id][parent1Id]) {
            return (false, "Already bred together");
        }
        
        IHenNFT.HenTraits memory parent1 = henNFT.getHenTraits(parent1Id);
        IHenNFT.HenTraits memory parent2 = henNFT.getHenTraits(parent2Id);
        
        if (!parent1.isAlive || !parent2.isAlive) {
            return (false, "Parent not alive");
        }
        
        if (block.timestamp < parent1.lastBreedTime + BREEDING_COOLDOWN) {
            return (false, "Parent 1 on cooldown");
        }
        
        if (block.timestamp < parent2.lastBreedTime + BREEDING_COOLDOWN) {
            return (false, "Parent 2 on cooldown");
        }
        
        if (parent1.generation >= MAX_GENERATION || parent2.generation >= MAX_GENERATION) {
            return (false, "Max generation reached");
        }
        
        return (true, "Can breed");
    }
    
    // Get offspring of a hen
    function getOffspring(uint256 parentId) external view returns (uint256[] memory) {
        return offspring[parentId];
    }
    
    // Withdraw breeding fees
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}