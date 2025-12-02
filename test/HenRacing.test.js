const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper functions for time manipulation
async function getLatestTime() {
  const block = await ethers.provider.getBlock('latest');
  return block.timestamp;
}

async function increaseTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine");
}

async function setNextBlockTimestamp(timestamp) {
  await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  await ethers.provider.send("evm_mine");
}

describe("HenRacing", function () {
  let henNFT;
  let henRacing;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy HenNFT
    const HenNFT = await ethers.getContractFactory("HenNFT");
    henNFT = await HenNFT.deploy();
    await henNFT.waitForDeployment();

    // Deploy HenRacing
    const HenRacing = await ethers.getContractFactory("HenRacing");
    henRacing = await HenRacing.deploy(await henNFT.getAddress());
    await henRacing.waitForDeployment();

    // Set racing contract in HenNFT
    await henNFT.setRacingContract(await henRacing.getAddress());

    // Mint hens for testing
    await henNFT.connect(addr1).mintHen({ value: ethers.parseEther("0.01") });
    await henNFT.connect(addr2).mintHen({ value: ethers.parseEther("0.01") });
    await henNFT.connect(addr3).mintHen({ value: ethers.parseEther("0.01") });
  });

  describe("Deployment", function () {
    it("Should set the correct HenNFT address", async function () {
      expect(await henRacing.henNFT()).to.equal(await henNFT.getAddress());
    });

    it("Should have correct prize distribution", async function () {
      const dist = await henRacing.prizeDistribution(0);
      expect(dist).to.equal(50); // 50%
    });
  });

  describe("Race Creation", function () {
    it("Should allow owner to create race", async function () {
      const startTime = (await getLatestTime()) + 3600; // 1 hour from now
      
      await expect(
        henRacing.createRace(startTime, ethers.parseEther("0.005"), 10)
      ).to.emit(henRacing, "RaceCreated");
    });

    it("Should fail if start time is in past", async function () {
      const startTime = (await getLatestTime()) - 3600; // 1 hour ago
      
      await expect(
        henRacing.createRace(startTime, ethers.parseEther("0.005"), 10)
      ).to.be.revertedWith("Start time must be in future");
    });

    it("Should fail if max participants invalid", async function () {
      const startTime = (await getLatestTime()) + 3600;
      
      await expect(
        henRacing.createRace(startTime, ethers.parseEther("0.005"), 1)
      ).to.be.revertedWith("Invalid participant count");
    });

    it("Should fail if non-owner tries to create race", async function () {
      const startTime = (await getLatestTime()) + 3600;
      
      await expect(
        henRacing.connect(addr1).createRace(startTime, ethers.parseEther("0.005"), 10)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Race Entry", function () {
    let raceId;
    let startTime;

    beforeEach(async function () {
      startTime = (await getLatestTime()) + 3600;
      const tx = await henRacing.createRace(startTime, ethers.parseEther("0.005"), 10);
      const receipt = await tx.wait();
      raceId = 1; // First race
    });

    it("Should allow hen to enter race", async function () {
      await expect(
        henRacing.connect(addr1).enterRace(raceId, 1, { value: ethers.parseEther("0.005") })
      ).to.emit(henRacing, "HenEntered");
    });

    it("Should fail if entry fee not paid", async function () {
      await expect(
        henRacing.connect(addr1).enterRace(raceId, 1, { value: ethers.parseEther("0.001") })
      ).to.be.revertedWith("Incorrect entry fee");
    });

    it("Should fail if not owner of hen", async function () {
      await expect(
        henRacing.connect(addr2).enterRace(raceId, 1, { value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Not owner of hen");
    });

    it("Should fail if hen already in race", async function () {
      await henRacing.connect(addr1).enterRace(raceId, 1, { value: ethers.parseEther("0.005") });
      
      await expect(
        henRacing.connect(addr1).enterRace(raceId, 1, { value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Hen already in race");
    });

    it("Should fail if race already started", async function () {
      // Fast forward past start time
      await setNextBlockTimestamp(startTime + 1);
      
      await expect(
        henRacing.connect(addr1).enterRace(raceId, 1, { value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Race already started");
    });

    it("Should accumulate prize pool", async function () {
      await henRacing.connect(addr1).enterRace(raceId, 1, { value: ethers.parseEther("0.005") });
      await henRacing.connect(addr2).enterRace(raceId, 2, { value: ethers.parseEther("0.005") });
      
      const race = await henRacing.races(raceId);
      expect(race.prizePool).to.equal(ethers.parseEther("0.01"));
    });
  });

  describe("Race Execution", function () {
    let raceId;
    let startTime;

    beforeEach(async function () {
      startTime = (await getLatestTime()) + 3600;
      await henRacing.createRace(startTime, ethers.parseEther("0.005"), 10);
      raceId = 1;
      
      // Enter three hens
      await henRacing.connect(addr1).enterRace(raceId, 1, { value: ethers.parseEther("0.005") });
      await henRacing.connect(addr2).enterRace(raceId, 2, { value: ethers.parseEther("0.005") });
      await henRacing.connect(addr3).enterRace(raceId, 3, { value: ethers.parseEther("0.005") });
      
      // Fast forward past start time
      await setNextBlockTimestamp(startTime + 1);
    });

    it("Should allow owner to start race", async function () {
      await expect(
        henRacing.startRace(raceId)
      ).to.emit(henRacing, "RaceStarted");
    });

    it("Should fail if non-owner tries to start", async function () {
      await expect(
        henRacing.connect(addr1).startRace(raceId)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail if race not started yet", async function () {
      // Create a new race in the future
      const futureTime = (await getLatestTime()) + 7200;
      await henRacing.createRace(futureTime, ethers.parseEther("0.005"), 10);
      
      await expect(
        henRacing.startRace(2)
      ).to.be.revertedWith("Race not started yet");
    });

    it("Should complete race and distribute prizes", async function () {
      await henRacing.startRace(raceId);
      
      await expect(
        henRacing.completeRace(raceId)
      ).to.emit(henRacing, "RaceComplete");
    });

    it("Should award XP to participants", async function () {
      const hen1Before = await henNFT.getHenTraits(1);
      
      await henRacing.startRace(raceId);
      await henRacing.completeRace(raceId);
      
      const hen1After = await henNFT.getHenTraits(1);
      
      // Should have gained either 105 XP (winner) or 30 XP (participant)
      expect(Number(hen1After.xp)).to.be.greaterThan(Number(hen1Before.xp));
    });

    it("Should update winner's race stats", async function () {
      await henRacing.startRace(raceId);
      await henRacing.completeRace(raceId);
      
      // Get race results to find winner
      const race = await henRacing.races(raceId);
      
      // At least one hen should have racesWon incremented
      const hen1 = await henNFT.getHenTraits(1);
      const hen2 = await henNFT.getHenTraits(2);
      const hen3 = await henNFT.getHenTraits(3);
      
      const totalRacesWon = Number(hen1.racesWon) + Number(hen2.racesWon) + Number(hen3.racesWon);
      expect(totalRacesWon).to.be.at.least(1);
    });

    it("Should mark race as complete", async function () {
      await henRacing.startRace(raceId);
      await henRacing.completeRace(raceId);
      
      const race = await henRacing.races(raceId);
      expect(race.isComplete).to.be.true;
    });

    it("Should distribute prizes according to prize distribution", async function () {
      const balanceBefore1 = await ethers.provider.getBalance(addr1.address);
      const balanceBefore2 = await ethers.provider.getBalance(addr2.address);
      const balanceBefore3 = await ethers.provider.getBalance(addr3.address);
      
      await henRacing.startRace(raceId);
      await henRacing.completeRace(raceId);
      
      const balanceAfter1 = await ethers.provider.getBalance(addr1.address);
      const balanceAfter2 = await ethers.provider.getBalance(addr2.address);
      const balanceAfter3 = await ethers.provider.getBalance(addr3.address);
      
      // At least one should have received prizes
      const totalGained = (balanceAfter1 - balanceBefore1) + (balanceAfter2 - balanceBefore2) + (balanceAfter3 - balanceBefore3);
      expect(totalGained).to.be.greaterThan(0);
    });
  });

  describe("View Functions", function () {
    let raceId;

    beforeEach(async function () {
      const startTime = (await getLatestTime()) + 3600;
      await henRacing.createRace(startTime, ethers.parseEther("0.005"), 10);
      raceId = 1;
      
      await henRacing.connect(addr1).enterRace(raceId, 1, { value: ethers.parseEther("0.005") });
      await henRacing.connect(addr2).enterRace(raceId, 2, { value: ethers.parseEther("0.005") });
    });

    it("Should return race participants", async function () {
      const participants = await henRacing.getRaceParticipants(raceId);
      expect(participants.length).to.equal(2);
      expect(participants[0]).to.equal(1);
      expect(participants[1]).to.equal(2);
    });

    it("Should check if race is active", async function () {
      const race = await henRacing.races(raceId);
      expect(race.isActive).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle race with minimum participants", async function () {
      const startTime = (await getLatestTime()) + 3600;
      await henRacing.createRace(startTime, ethers.parseEther("0.005"), 10);
      const raceId = 1;
      
      // Enter only 2 hens
      await henRacing.connect(addr1).enterRace(raceId, 1, { value: ethers.parseEther("0.005") });
      await henRacing.connect(addr2).enterRace(raceId, 2, { value: ethers.parseEther("0.005") });
      
      await setNextBlockTimestamp(startTime + 1);
      
      await henRacing.startRace(raceId);
      await expect(
        henRacing.completeRace(raceId)
      ).to.emit(henRacing, "RaceComplete");
    });

    it("Should prevent entering full race", async function () {
      const startTime = (await getLatestTime()) + 3600;
      await henRacing.createRace(startTime, ethers.parseEther("0.005"), 2);
      const raceId = 1;
      
      await henRacing.connect(addr1).enterRace(raceId, 1, { value: ethers.parseEther("0.005") });
      await henRacing.connect(addr2).enterRace(raceId, 2, { value: ethers.parseEther("0.005") });
      
      await expect(
        henRacing.connect(addr3).enterRace(raceId, 3, { value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Race is full");
    });
  });
});
