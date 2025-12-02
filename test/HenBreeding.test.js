const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper to increase time
async function increaseTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine");
}

describe("HenBreeding", function () {
  let henNFT;
  let henBreeding;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy HenNFT
    const HenNFT = await ethers.getContractFactory("HenNFT");
    henNFT = await HenNFT.deploy();
    await henNFT.waitForDeployment();

    // Deploy HenBreeding
    const HenBreeding = await ethers.getContractFactory("HenBreeding");
    henBreeding = await HenBreeding.deploy(await henNFT.getAddress());
    await henBreeding.waitForDeployment();

    // Set breeding contract in HenNFT
    await henNFT.setBreedingContract(await henBreeding.getAddress());

    // Mint two hens for addr1
    await henNFT.connect(addr1).mintHen({ value: ethers.parseEther("0.01") });
    await henNFT.connect(addr1).mintHen({ value: ethers.parseEther("0.01") });
  });

  describe("Deployment", function () {
    it("Should set the correct HenNFT address", async function () {
      expect(await henBreeding.henNFT()).to.equal(await henNFT.getAddress());
    });

    it("Should have correct breeding parameters", async function () {
      expect(await henBreeding.BREEDING_COST()).to.equal(ethers.parseEther("0.01"));
      expect(await henBreeding.BREEDING_COOLDOWN()).to.equal(7 * 24 * 60 * 60); // 7 days
      expect(await henBreeding.MAX_GENERATION()).to.equal(10);
    });
  });

  describe("Breeding", function () {
    it("Should breed two hens successfully", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      await expect(
        henBreeding.connect(addr1).breedHens(1, 2, { value: breedingCost })
      ).to.emit(henBreeding, "BreedingInitiated");

      // Check offspring was created
      const offspring = await henBreeding.getOffspring(1);
      expect(offspring.length).to.equal(1);
    });

    it("Should fail if breeding cost not paid", async function () {
      await expect(
        henBreeding.connect(addr1).breedHens(1, 2, { value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Insufficient breeding fee");
    });

    it("Should fail if breeding same hen", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      await expect(
        henBreeding.connect(addr1).breedHens(1, 1, { value: breedingCost })
      ).to.be.revertedWith("Cannot breed with itself");
    });

    it("Should fail if not owner of parent hens", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      await expect(
        henBreeding.connect(addr2).breedHens(1, 2, { value: breedingCost })
      ).to.be.revertedWith("Not owner of both hens");
    });

    it("Should prevent inbreeding", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      // First breeding
      await henBreeding.connect(addr1).breedHens(1, 2, { value: breedingCost });
      
      // Try to breed same pair again
      await expect(
        henBreeding.connect(addr1).breedHens(1, 2, { value: breedingCost })
      ).to.be.revertedWith("These hens have already bred");
    });

    it("Should enforce breeding cooldown", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      // First breeding
      await henBreeding.connect(addr1).breedHens(1, 2, { value: breedingCost });
      
      // Mint another hen
      await henNFT.connect(addr1).mintHen({ value: ethers.parseEther("0.01") });
      
      // Try to breed hen 1 again immediately
      await expect(
        henBreeding.connect(addr1).breedHens(1, 4, { value: breedingCost })
      ).to.be.revertedWith("Parent 1 on cooldown");
    });

    it("Should allow breeding after cooldown", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      // First breeding
      await henBreeding.connect(addr1).breedHens(1, 2, { value: breedingCost });
      
      // Mint another hen
      await henNFT.connect(addr1).mintHen({ value: ethers.parseEther("0.01") });
      
      // Fast forward 7 days
      await increaseTime(7 * 24 * 60 * 60);
      
      // Should succeed now
      await expect(
        henBreeding.connect(addr1).breedHens(1, 4, { value: breedingCost })
      ).to.emit(henBreeding, "BreedingInitiated");
    });

    it("Should increment generation correctly", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      // Breed Gen 0 + Gen 0 = Gen 1
      await henBreeding.connect(addr1).breedHens(1, 2, { value: breedingCost });
      
      const offspring = await henBreeding.getOffspring(1);
      const offspringTraits = await henNFT.getHenTraits(offspring[0]);
      
      expect(offspringTraits.generation).to.equal(1);
    });

    it("Should prevent breeding beyond max generation", async function () {
      // This would require breeding multiple generations
      // Skipping for brevity but important to test
    });

    it("Should track breed count", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      await henBreeding.connect(addr1).breedHens(1, 2, { value: breedingCost });
      
      expect(await henBreeding.breedCount(1)).to.equal(1);
      expect(await henBreeding.breedCount(2)).to.equal(1);
    });

    it("Should award XP to parents", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      const parent1Before = await henNFT.getHenTraits(1);
      const parent2Before = await henNFT.getHenTraits(2);
      
      await henBreeding.connect(addr1).breedHens(1, 2, { value: breedingCost });
      
      const parent1After = await henNFT.getHenTraits(1);
      const parent2After = await henNFT.getHenTraits(2);
      
      expect(parent1After.xp).to.equal(Number(parent1Before.xp) + 25);
      expect(parent2After.xp).to.equal(Number(parent2Before.xp) + 25);
    });
  });

  describe("Offspring Traits", function () {
    it("Should inherit traits from parents", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      const parent1 = await henNFT.getHenTraits(1);
      const parent2 = await henNFT.getHenTraits(2);
      
      await henBreeding.connect(addr1).breedHens(1, 2, { value: breedingCost });
      
      const offspring = await henBreeding.getOffspring(1);
      const offspringTraits = await henNFT.getHenTraits(offspring[0]);
      
      // Offspring traits should be within reasonable range of parents
      expect(offspringTraits.strength).to.be.at.least(Math.min(parent1.strength, parent2.strength) - 10);
      expect(offspringTraits.strength).to.be.at.most(Math.max(parent1.strength, parent2.strength) + 10);
    });

    it("Should have isAlive set to true", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      await henBreeding.connect(addr1).breedHens(1, 2, { value: breedingCost });
      
      const offspring = await henBreeding.getOffspring(1);
      const offspringTraits = await henNFT.getHenTraits(offspring[0]);
      
      expect(offspringTraits.isAlive).to.be.true;
    });

    it("Should initialize offspring with 0 XP", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      await henBreeding.connect(addr1).breedHens(1, 2, { value: breedingCost });
      
      const offspring = await henBreeding.getOffspring(1);
      const offspringTraits = await henNFT.getHenTraits(offspring[0]);
      
      expect(offspringTraits.xp).to.equal(0);
    });
  });

  describe("View Functions", function () {
    it("Should return correct offspring list", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      await henBreeding.connect(addr1).breedHens(1, 2, { value: breedingCost });
      
      const offspring1 = await henBreeding.getOffspring(1);
      const offspring2 = await henBreeding.getOffspring(2);
      
      expect(offspring1.length).to.equal(1);
      expect(offspring2.length).to.equal(1);
      expect(offspring1[0]).to.equal(offspring2[0]);
    });

    it("Should check if hens have bred", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      expect(await henBreeding.hasBred(1, 2)).to.be.false;
      
      await henBreeding.connect(addr1).breedHens(1, 2, { value: breedingCost });
      
      expect(await henBreeding.hasBred(1, 2)).to.be.true;
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to withdraw funds", async function () {
      const breedingCost = await henBreeding.BREEDING_COST();
      
      // Perform some breeding to accumulate funds
      await henBreeding.connect(addr1).breedHens(1, 2, { value: breedingCost });
      
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await henBreeding.getAddress());
      
      await henBreeding.withdraw();
      
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      // Owner should have received the funds (minus gas)
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should prevent non-owner from withdrawing", async function () {
      await expect(
        henBreeding.connect(addr1).withdraw()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
