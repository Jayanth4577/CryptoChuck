// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract HenNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Hen attributes - Optimized struct packing (saves gas)
    struct HenTraits {
        // Slot 1 (32 bytes): All uint8 attributes packed together
        uint8 strength;     // 1-100
        uint8 speed;        // 1-100
        uint8 stamina;      // 1-100
        uint8 intelligence; // 1-100
        uint8 luck;         // 1-100
        uint8 generation;   // 0 for initial, increases with breeding
        // Slot 2: birthTime
        uint48 birthTime;   // Timestamp fits in 48 bits (until year 8921556)
        uint48 lastBreedTime;
        uint32 wins;        // Max 4.2 billion wins (more than enough)
        uint32 losses;      // Max 4.2 billion losses
        uint32 racesWon;    // Max 4.2 billion races
        uint32 xp;          // Experience points
        bool isAlive;
        uint8 trainingLevel; // 0-10, increases with training
    }
    
    // Training constants
    uint256 public constant TRAIN_PRICE = 0.005 ether; // Cost to train a hen
    uint256 public constant RENAME_PRICE = 0.001 ether; // Cost to rename a hen
    uint256 public constant MAX_TRAINING_LEVEL = 10;
    
    // XP and Leveling constants
    uint256 public constant XP_PER_BATTLE = 50;
    uint256 public constant XP_PER_BATTLE_WIN = 100;
    uint256 public constant XP_PER_RACE = 30;
    uint256 public constant XP_PER_RACE_WIN = 75;
    uint256 public constant XP_PER_BREED = 25;
    
    // Hen names (optional cosmetic feature)
    mapping(uint256 => string) public henNames;

    // Mapping from token ID to traits
    mapping(uint256 => HenTraits) public henTraits;
    // Authorized contracts
    address public breedingContract;
    address public battleContract;
    address public racingContract;
    
    // Marketplace
    struct Listing {
        uint256 price;
        address seller;
        bool isActive;
    }
    mapping(uint256 => Listing) public listings;

    // Events
    event HenMinted(uint256 indexed tokenId, address indexed owner, HenTraits traits);
    event HenListed(uint256 indexed tokenId, uint256 price, address indexed seller);
    event HenSold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);
    event HenDelisted(uint256 indexed tokenId, address indexed seller);
    event BattleResult(uint256 indexed henId, bool won);

    // Constants
    uint256 public constant MINT_PRICE = 0.01 ether;
    uint256 public constant MARKETPLACE_FEE = 250; // 2.5% (basis points)
    uint256 public constant MAX_SUPPLY = 10000;

    constructor() ERC721("CryptoHens", "HEN") {}

    // Mint a new hen
    function mintHen() external payable nonReentrant returns (uint256) {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(_tokenIds.current() < MAX_SUPPLY, "Max supply reached");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);

        // Generate random traits (in production, use Chainlink VRF)
        HenTraits memory traits = HenTraits({
            strength: uint8(_randomNumber(newTokenId, "strength") % 81 + 20),
            speed: uint8(_randomNumber(newTokenId, "speed") % 81 + 20),
            stamina: uint8(_randomNumber(newTokenId, "stamina") % 81 + 20),
            intelligence: uint8(_randomNumber(newTokenId, "intelligence") % 81 + 20),
            luck: uint8(_randomNumber(newTokenId, "luck") % 81 + 20),
            generation: 0,
            birthTime: uint48(block.timestamp),
            lastBreedTime: 0,
            wins: 0,
            losses: 0,
            racesWon: 0,
            xp: 0,
            isAlive: true,
            trainingLevel: 0
        });

        henTraits[newTokenId] = traits;

        emit HenMinted(newTokenId, msg.sender, traits);
        return newTokenId;
    }

    // Batch mint multiple hens (saves gas)
    function batchMintHens(uint256 quantity) external payable nonReentrant returns (uint256[] memory) {
        require(quantity > 0 && quantity <= 10, "Can mint 1-10 hens at once");
        require(msg.value >= MINT_PRICE * quantity, "Insufficient payment");
        require(_tokenIds.current() + quantity <= MAX_SUPPLY, "Would exceed max supply");

        uint256[] memory newTokenIds = new uint256[](quantity);

        for (uint256 i = 0; i < quantity; i++) {
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();
            
            _safeMint(msg.sender, newTokenId);

            // Generate random traits with unique seed per hen
            HenTraits memory traits = HenTraits({
                strength: uint8(_randomNumber(newTokenId, "strength") % 81 + 20),
                speed: uint8(_randomNumber(newTokenId, "speed") % 81 + 20),
                stamina: uint8(_randomNumber(newTokenId, "stamina") % 81 + 20),
                intelligence: uint8(_randomNumber(newTokenId, "intelligence") % 81 + 20),
                luck: uint8(_randomNumber(newTokenId, "luck") % 81 + 20),
                generation: 0,
                birthTime: uint48(block.timestamp),
                lastBreedTime: 0,
                wins: 0,
                losses: 0,
                racesWon: 0,
                xp: 0,
                isAlive: true,
                trainingLevel: 0
            });

            henTraits[newTokenId] = traits;
            newTokenIds[i] = newTokenId;

            emit HenMinted(newTokenId, msg.sender, traits);
        }

        return newTokenIds;
    }

    // List hen on marketplace
    function listHen(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");
        require(!listings[tokenId].isActive, "Already listed");

        listings[tokenId] = Listing({
            price: price,
            seller: msg.sender,
            isActive: true
        });

        emit HenListed(tokenId, price, msg.sender);
    }

    // Buy hen from marketplace
    function buyHen(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.isActive, "Not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");

        address seller = listing.seller;
        uint256 price = listing.price;

        // Calculate marketplace fee
        uint256 fee = (price * MARKETPLACE_FEE) / 10000;
        uint256 sellerAmount = price - fee;

        // Clear listing
        delete listings[tokenId];

        // Transfer NFT
        _transfer(seller, msg.sender, tokenId);

        // Transfer funds
        (bool successSeller, ) = payable(seller).call{value: sellerAmount}("");
        require(successSeller, "Transfer to seller failed");

        emit HenSold(tokenId, seller, msg.sender, price);

        // Refund excess payment
        if (msg.value > price) {
            (bool successRefund, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(successRefund, "Refund failed");
        }
    }

    // Delist hen from marketplace
    function delistHen(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "Not the seller");
        require(listings[tokenId].isActive, "Not listed");

        delete listings[tokenId];
        emit HenDelisted(tokenId, msg.sender);
    }

    // Train hen to boost stats (Token Sink)
    function trainHen(uint256 tokenId) external payable nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(msg.value >= TRAIN_PRICE, "Insufficient payment for training");
        require(henTraits[tokenId].trainingLevel < MAX_TRAINING_LEVEL, "Max training level reached");

        // Increase training level
        henTraits[tokenId].trainingLevel++;
        
        // Boost random stat by 1-3 points (max 100)
        uint256 rand = _randomNumber(tokenId, "train");
        uint256 statToBoost = rand % 5; // 0-4 for the 5 stats
        uint256 boost = (rand % 3) + 1; // 1-3 boost
        
        if (statToBoost == 0 && henTraits[tokenId].strength < 100) {
            henTraits[tokenId].strength = uint8(_min(100, uint256(henTraits[tokenId].strength) + boost));
        } else if (statToBoost == 1 && henTraits[tokenId].speed < 100) {
            henTraits[tokenId].speed = uint8(_min(100, uint256(henTraits[tokenId].speed) + boost));
        } else if (statToBoost == 2 && henTraits[tokenId].stamina < 100) {
            henTraits[tokenId].stamina = uint8(_min(100, uint256(henTraits[tokenId].stamina) + boost));
        } else if (statToBoost == 3 && henTraits[tokenId].intelligence < 100) {
            henTraits[tokenId].intelligence = uint8(_min(100, uint256(henTraits[tokenId].intelligence) + boost));
        } else if (statToBoost == 4 && henTraits[tokenId].luck < 100) {
            henTraits[tokenId].luck = uint8(_min(100, uint256(henTraits[tokenId].luck) + boost));
        }
        
        emit HenTrained(tokenId, henTraits[tokenId].trainingLevel);
    }
    
    // Rename hen (Cosmetic Token Sink)
    function renameHen(uint256 tokenId, string memory newName) external payable {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(msg.value >= RENAME_PRICE, "Insufficient payment for renaming");
        require(bytes(newName).length > 0 && bytes(newName).length <= 32, "Invalid name length");
        
        henNames[tokenId] = newName;
        emit HenRenamed(tokenId, newName);
    }
    
    // Helper function
    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
    
    // Events for new features
    event HenTrained(uint256 indexed tokenId, uint8 trainingLevel);
    event HenRenamed(uint256 indexed tokenId, string newName);

    // Update battle stats (only callable by battle contract)
    function updateBattleStats(uint256 tokenId, bool won) external {
        require(msg.sender == battleContract || msg.sender == owner(), "Not authorized");
        if (won) {
            henTraits[tokenId].wins++;
        } else {
            henTraits[tokenId].losses++;
        }
        emit BattleResult(tokenId, won);
    }

    // Update race stats
    function updateRaceStats(uint256 tokenId) external {
        require(msg.sender == racingContract || msg.sender == owner(), "Not authorized");
        henTraits[tokenId].racesWon++;
    }

    // Add XP and handle level-ups
    function addXP(uint256 tokenId, uint256 xpAmount) external {
        require(msg.sender == battleContract || msg.sender == racingContract || msg.sender == breedingContract || msg.sender == owner(), "Not authorized");
        require(_exists(tokenId), "Token does not exist");
        
        HenTraits storage hen = henTraits[tokenId];
        uint32 oldLevel = _calculateLevel(hen.xp);
        
        // Add XP (cap at uint32 max)
        uint256 newXP = uint256(hen.xp) + xpAmount;
        hen.xp = newXP > type(uint32).max ? type(uint32).max : uint32(newXP);
        
        uint32 newLevel = _calculateLevel(hen.xp);
        
        // Award stat bonuses for level-ups
        if (newLevel > oldLevel) {
            uint32 levelsGained = newLevel - oldLevel;
            // +1 to 2 random stats per level
            for (uint32 i = 0; i < levelsGained; i++) {
                _awardLevelUpBonus(tokenId, hen);
            }
        }
    }
    
    // Calculate level from XP (level = floor(sqrt(xp/100)))
    function _calculateLevel(uint32 xp) private pure returns (uint32) {
        if (xp == 0) return 1;
        uint256 level = _sqrt(uint256(xp) / 100);
        return level == 0 ? 1 : uint32(level);
    }
    
    // Award random stat bonuses on level-up
    function _awardLevelUpBonus(uint256 tokenId, HenTraits storage hen) private {
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, tokenId, hen.xp)));
        uint8 stat1 = uint8(rand % 5);
        uint8 stat2 = uint8((rand / 5) % 5);
        
        // Increase 1-2 random stats by 1 (cap at 100)
        if (stat1 == 0 && hen.strength < 100) hen.strength++;
        else if (stat1 == 1 && hen.speed < 100) hen.speed++;
        else if (stat1 == 2 && hen.stamina < 100) hen.stamina++;
        else if (stat1 == 3 && hen.intelligence < 100) hen.intelligence++;
        else if (stat1 == 4 && hen.luck < 100) hen.luck++;
        
        if (stat2 != stat1) {
            if (stat2 == 0 && hen.strength < 100) hen.strength++;
            else if (stat2 == 1 && hen.speed < 100) hen.speed++;
            else if (stat2 == 2 && hen.stamina < 100) hen.stamina++;
            else if (stat2 == 3 && hen.intelligence < 100) hen.intelligence++;
            else if (stat2 == 4 && hen.luck < 100) hen.luck++;
        }
    }
    
    // Square root helper (Babylonian method)
    function _sqrt(uint256 x) private pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    // Set authorized contract addresses
    function setBreedingContract(address _addr) external onlyOwner {
        breedingContract = _addr;
    }

    function setBattleContract(address _addr) external onlyOwner {
        battleContract = _addr;
    }

    function setRacingContract(address _addr) external onlyOwner {
        racingContract = _addr;
    }

    // Mint an offspring with precomputed traits - callable only by breeding contract
    function mintOffspring(
        address to,
        uint8 strength,
        uint8 speed,
        uint8 stamina,
        uint8 intelligence,
        uint8 luck,
        uint8 generation
    ) external nonReentrant returns (uint256) {
        require(msg.sender == breedingContract, "Only breeding contract can mint offspring");
        require(_tokenIds.current() < MAX_SUPPLY, "Max supply reached");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);

        HenTraits memory traits = HenTraits({
            strength: strength,
            speed: speed,
            stamina: stamina,
            intelligence: intelligence,
            luck: luck,
            generation: generation,
            birthTime: uint48(block.timestamp),
            lastBreedTime: 0,
            wins: 0,
            losses: 0,
            racesWon: 0,
            xp: 0,
            isAlive: true,
            trainingLevel: 0
        });

        henTraits[newTokenId] = traits;

        emit HenMinted(newTokenId, to, traits);
        return newTokenId;
    }

    // Get hen traits
    function getHenTraits(uint256 tokenId) external view returns (HenTraits memory) {
        require(_exists(tokenId), "Token does not exist");
        return henTraits[tokenId];
    }

    // Get hen power rating
    function getHenPower(uint256 tokenId) public view returns (uint256) {
        HenTraits memory traits = henTraits[tokenId];
        return uint256(traits.strength) + 
               uint256(traits.speed) + 
               uint256(traits.stamina) + 
               uint256(traits.intelligence) + 
               uint256(traits.luck);
    }

    // Get all hens owned by address
    function getHensByOwner(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory ownedHens = new uint256[](balance);
        uint256 counter = 0;

        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
            if (_exists(i) && ownerOf(i) == owner) {
                ownedHens[counter] = i;
                counter++;
            }
        }

        return ownedHens;
    }

    // Withdraw contract balance
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // Internal random number generator (use Chainlink VRF in production)
    function _randomNumber(uint256 tokenId, string memory attribute) private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            tokenId,
            attribute,
            msg.sender
        )));
    }

    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    // Solidity multiple inheritance requires overriding _burn when using ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}