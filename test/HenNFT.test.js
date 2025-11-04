const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HenNFT", function () {
  let henNFT;
  let owner;
  let addr1;
  let addr2;
  const MINT_PRICE = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const HenNFT = await ethers.getContractFactory("HenNFT");
    henNFT = await HenNFT.deploy();
    await henNFT.waitForDeployment();
  });

  describe("Minting", function () {
    it("Should mint a hen with correct traits", async function () {
      const tx = await henNFT.connect(addr1).mintHen({ value: MINT_PRICE });
      await tx.wait();

      const henId = 1;
      const traits = await henNFT.getHenTraits(henId);

      expect(traits.strength).to.be.gte(20);
      expect(traits.strength).to.be.lte(100);
      expect(traits.speed).to.be.gte(20);
      expect(traits.speed).to.be.lte(100);
      expect(traits.generation).to.equal(0);
      expect(traits.isAlive).to.be.true;
    });

    it("Should fail to mint without enough payment", async function () {
      await expect(
        henNFT.connect(addr1).mintHen({ value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should assign correct owner", async function () {
      await henNFT.connect(addr1).mintHen({ value: MINT_PRICE });
      expect(await henNFT.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should track multiple hens per owner", async function () {
      await henNFT.connect(addr1).mintHen({ value: MINT_PRICE });
      await henNFT.connect(addr1).mintHen({ value: MINT_PRICE });
      
      const hens = await henNFT.getHensByOwner(addr1.address);
      expect(hens.length).to.equal(2);
    });
  });

  describe("Marketplace", function () {
    beforeEach(async function () {
      await henNFT.connect(addr1).mintHen({ value: MINT_PRICE });
    });

    it("Should list a hen for sale", async function () {
      const price = ethers.parseEther("0.5");
      await henNFT.connect(addr1).listHen(1, price);

      const listing = await henNFT.listings(1);
      expect(listing.isActive).to.be.true;
      expect(listing.price).to.equal(price);
      expect(listing.seller).to.equal(addr1.address);
    });

    it("Should not allow non-owner to list", async function () {
      const price = ethers.parseEther("0.5");
      await expect(
        henNFT.connect(addr2).listHen(1, price)
      ).to.be.revertedWith("Not the owner");
    });

    it("Should allow buying a listed hen", async function () {
      const price = ethers.parseEther("0.5");
      await henNFT.connect(addr1).listHen(1, price);

      const initialBalance = await ethers.provider.getBalance(addr1.address);
      
      await henNFT.connect(addr2).buyHen(1, { value: price });

      expect(await henNFT.ownerOf(1)).to.equal(addr2.address);
      
      const listing = await henNFT.listings(1);
      expect(listing.isActive).to.be.false;
    });

    it("Should fail to buy unlisted hen", async function () {
      await expect(
        henNFT.connect(addr2).buyHen(1, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Not listed for sale");
    });

    it("Should delist a hen", async function () {
      const price = ethers.parseEther("0.5");
      await henNFT.connect(addr1).listHen(1, price);
      await henNFT.connect(addr1).delistHen(1);

      const listing = await henNFT.listings(1);
      expect(listing.isActive).to.be.false;
    });
  });

  describe("Stats and Traits", function () {
    it("Should calculate hen power correctly", async function () {
      await henNFT.connect(addr1).mintHen({ value: MINT_PRICE });
      
      const traits = await henNFT.getHenTraits(1);
      const expectedPower = Number(traits.strength) + Number(traits.speed) + 
                           Number(traits.stamina) + Number(traits.intelligence) + 
                           Number(traits.luck);
      
      const actualPower = await henNFT.getHenPower(1);
      expect(Number(actualPower)).to.equal(expectedPower);
    });

    it("Should update battle stats correctly", async function () {
      await henNFT.connect(addr1).mintHen({ value: MINT_PRICE });
      
      await henNFT.updateBattleStats(1, true);
      let traits = await henNFT.getHenTraits(1);
      expect(traits.wins).to.equal(1);
      expect(traits.losses).to.equal(0);

      await henNFT.updateBattleStats(1, false);
      traits = await henNFT.getHenTraits(1);
      expect(traits.wins).to.equal(1);
      expect(traits.losses).to.equal(1);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to withdraw funds", async function () {
      await henNFT.connect(addr1).mintHen({ value: MINT_PRICE });
      await henNFT.connect(addr2).mintHen({ value: MINT_PRICE });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await henNFT.getAddress());

      await henNFT.withdraw();

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should not allow non-owner to withdraw", async function () {
      await expect(
        henNFT.connect(addr1).withdraw()
      ).to.be.reverted;
    });
  });
});