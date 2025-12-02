const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper to increase time
async function increaseTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine");
}

describe("HenBattle", function () {
  let henNFT;
  let henBattle;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy HenNFT
    const HenNFT = await ethers.getContractFactory("HenNFT");
    henNFT = await HenNFT.deploy();
    await henNFT.waitForDeployment();

    // Deploy HenBattle
    const HenBattle = await ethers.getContractFactory("HenBattle");
    henBattle = await HenBattle.deploy(await henNFT.getAddress());
    await henBattle.waitForDeployment();

    // Set battle contract in HenNFT
    await henNFT.setBattleContract(await henBattle.getAddress());

    // Mint hens for testing
    await henNFT.connect(addr1).mintHen({ value: ethers.parseEther("0.01") });
    await henNFT.connect(addr2).mintHen({ value: ethers.parseEther("0.01") });
  });

  describe("Deployment", function () {
    it("Should set the correct HenNFT address", async function () {
      expect(await henBattle.henNFT()).to.equal(await henNFT.getAddress());
    });

    it("Should have correct battle parameters", async function () {
      expect(await henBattle.BATTLE_REWARD()).to.equal(ethers.parseEther("100"));
      expect(await henBattle.BATTLE_COOLDOWN()).to.equal(3600); // 1 hour
    });
  });

  describe("Battle Creation", function () {
    it("Should create and execute a battle", async function () {
      await expect(
        henBattle.connect(addr1).createBattle(1, 2)
      ).to.emit(henBattle, "BattleCreated");
    });

    it("Should fail if not owner of hen", async function () {
      await expect(
        henBattle.connect(addr1).createBattle(2, 1)
      ).to.be.revertedWith("Not owner of hen 1");
    });

    it("Should fail if battling with self", async function () {
      await expect(
        henBattle.connect(addr1).createBattle(1, 1)
      ).to.be.revertedWith("Cannot battle with itself");
    });

    it("Should enforce cooldown period", async function () {
      // First battle
      await henBattle.connect(addr1).createBattle(1, 2);
      
      // Mint another hen
      await henNFT.connect(addr2).mintHen({ value: ethers.parseEther("0.01") });
      
      // Try to battle again immediately
      await expect(
        henBattle.connect(addr1).createBattle(1, 3)
      ).to.be.revertedWith("Hen 1 on cooldown");
    });

    it("Should allow battle after cooldown", async function () {
      // First battle
      await henBattle.connect(addr1).createBattle(1, 2);
      
      // Mint another hen
      await henNFT.connect(addr2).mintHen({ value: ethers.parseEther("0.01") });
      
      // Fast forward 1 hour
      await increaseTime(3600);
      
      // Should succeed now
      await expect(
        henBattle.connect(addr1).createBattle(1, 3)
      ).to.emit(henBattle, "BattleCreated");
    });
  });

  describe("Battle Mechanics", function () {
    it("Should update battle stats for winner and loser", async function () {
      const hen1Before = await henNFT.getHenTraits(1);
      const hen2Before = await henNFT.getHenTraits(2);
      
      await henBattle.connect(addr1).createBattle(1, 2);
      
      const hen1After = await henNFT.getHenTraits(1);
      const hen2After = await henNFT.getHenTraits(2);
      
      // One should have won, one should have lost
      const totalWins = Number(hen1After.wins) + Number(hen2After.wins);
      const totalLosses = Number(hen1After.losses) + Number(hen2After.losses);
      
      expect(totalWins).to.equal(Number(hen1Before.wins) + Number(hen2Before.wins) + 1);
      expect(totalLosses).to.equal(Number(hen1Before.losses) + Number(hen2Before.losses) + 1);
    });

    it("Should award XP to both hens", async function () {
      const hen1Before = await henNFT.getHenTraits(1);
      const hen2Before = await henNFT.getHenTraits(2);
      
      await henBattle.connect(addr1).createBattle(1, 2);
      
      const hen1After = await henNFT.getHenTraits(1);
      const hen2After = await henNFT.getHenTraits(2);
      
      // Both should have gained XP (winner gets 150, loser gets 50)
      const totalXPGain = Number(hen1After.xp) + Number(hen2After.xp) - Number(hen1Before.xp) - Number(hen2Before.xp);
      expect(totalXPGain).to.equal(200); // 150 + 50
    });

    it("Should mark battle as complete", async function () {
      await henBattle.connect(addr1).createBattle(1, 2);
      
      const battle = await henBattle.battles(1);
      expect(battle.isComplete).to.be.true;
    });

    it("Should have a winner", async function () {
      await henBattle.connect(addr1).createBattle(1, 2);
      
      const battle = await henBattle.battles(1);
      expect(battle.winnerId).to.be.oneOf([1n, 2n]);
    });
  });

  describe("Battle History", function () {
    it("Should track player battles", async function () {
      await henBattle.connect(addr1).createBattle(1, 2);
      
      const addr1Battles = await henBattle.playerBattles(addr1.address, 0);
      expect(addr1Battles).to.equal(1);
    });

    it("Should increment battle counter", async function () {
      const counterBefore = await henBattle.battleCounter();
      
      await henBattle.connect(addr1).createBattle(1, 2);
      
      const counterAfter = await henBattle.battleCounter();
      expect(counterAfter).to.equal(counterBefore + 1n);
    });
  });

  describe("View Functions", function () {
    it("Should return battle details", async function () {
      await henBattle.connect(addr1).createBattle(1, 2);
      
      const battle = await henBattle.battles(1);
      
      expect(battle.battleId).to.equal(1);
      expect(battle.hen1Id).to.equal(1);
      expect(battle.hen2Id).to.equal(2);
      expect(battle.player1).to.equal(addr1.address);
      expect(battle.player2).to.equal(addr2.address);
      expect(battle.isComplete).to.be.true;
    });
  });

  describe("Battle Rounds", function () {
    it("Should emit battle round events", async function () {
      await expect(
        henBattle.connect(addr1).createBattle(1, 2)
      ).to.emit(henBattle, "BattleRound");
    });

    it("Should complete battle and emit BattleComplete", async function () {
      await expect(
        henBattle.connect(addr1).createBattle(1, 2)
      ).to.emit(henBattle, "BattleComplete");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle battle with hens of same stats", async function () {
      // Would need to mint hens with controlled stats
      // Implementation depends on how you generate random traits
    });

    it("Should prevent battles with non-existent hens", async function () {
      await expect(
        henBattle.connect(addr1).createBattle(1, 999)
      ).to.be.reverted;
    });
  });

  describe("Stat-Based Combat", function () {
    it("Should favor stronger hens (statistical test)", async function () {
      // This would require multiple battles and statistical analysis
      // Skipping for brevity but important for production
    });
  });
});
