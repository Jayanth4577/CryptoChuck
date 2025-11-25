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

    // Hen attributes
    struct HenTraits {
        uint8 strength;     // 1-100
        uint8 speed;        // 1-100
        uint8 stamina;      // 1-100
        uint8 intelligence; // 1-100
        uint8 luck;         // 1-100
        uint8 generation;   // 0 for initial, increases with breeding
        uint256 birthTime;
        uint256 lastBreedTime;
        uint256 wins;
        uint256 losses;
        uint256 racesWon;
        bool isAlive;
    }

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
            birthTime: block.timestamp,
            lastBreedTime: 0,
            wins: 0,
            losses: 0,
            racesWon: 0,
            isAlive: true
        });

        henTraits[newTokenId] = traits;

        emit HenMinted(newTokenId, msg.sender, traits);
        return newTokenId;
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
            birthTime: block.timestamp,
            lastBreedTime: 0,
            wins: 0,
            losses: 0,
            racesWon: 0,
            isAlive: true
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