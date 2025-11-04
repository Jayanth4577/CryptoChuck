const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
  console.log();

  // Deploy HenNFT
  console.log("Deploying HenNFT...");
  const HenNFT = await hre.ethers.getContractFactory("HenNFT");
  const henNFT = await HenNFT.deploy();
  await henNFT.waitForDeployment();
  const henNFTAddress = await henNFT.getAddress();
  console.log("HenNFT deployed to:", henNFTAddress);
  console.log();

  // Deploy HenBreeding
  console.log("Deploying HenBreeding...");
  const HenBreeding = await hre.ethers.getContractFactory("HenBreeding");
  const henBreeding = await HenBreeding.deploy(henNFTAddress);
  await henBreeding.waitForDeployment();
  const henBreedingAddress = await henBreeding.getAddress();
  console.log("HenBreeding deployed to:", henBreedingAddress);
  console.log();

  // Deploy HenBattle
  console.log("Deploying HenBattle...");
  const HenBattle = await hre.ethers.getContractFactory("HenBattle");
  const henBattle = await HenBattle.deploy(henNFTAddress);
  await henBattle.waitForDeployment();
  const henBattleAddress = await henBattle.getAddress();
  console.log("HenBattle deployed to:", henBattleAddress);
  console.log();

  // Deploy HenRacing
  console.log("Deploying HenRacing...");
  const HenRacing = await hre.ethers.getContractFactory("HenRacing");
  const henRacing = await HenRacing.deploy(henNFTAddress);
  await henRacing.waitForDeployment();
  const henRacingAddress = await henRacing.getAddress();
  console.log("HenRacing deployed to:", henRacingAddress);
  console.log();

  // Deploy BettingSystem
  console.log("Deploying BettingSystem...");
  const BettingSystem = await hre.ethers.getContractFactory("BettingSystem");
  const bettingSystem = await BettingSystem.deploy(henBattleAddress, henRacingAddress);
  await bettingSystem.waitForDeployment();
  const bettingSystemAddress = await bettingSystem.getAddress();
  console.log("BettingSystem deployed to:", bettingSystemAddress);
  console.log();

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      HenNFT: henNFTAddress,
      HenBreeding: henBreedingAddress,
      HenBattle: henBattleAddress,
      HenRacing: henRacingAddress,
      BettingSystem: bettingSystemAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(
    deploymentsDir,
    `${hre.network.name}-${Date.now()}.json`
  );
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("\nContract Addresses:");
  console.log("HenNFT:", henNFTAddress);
  console.log("HenBreeding:", henBreedingAddress);
  console.log("HenBattle:", henBattleAddress);
  console.log("HenRacing:", henRacingAddress);
  console.log("BettingSystem:", bettingSystemAddress);
  console.log("\nDeployment info saved to:", deploymentPath);

  // Verify contracts on Etherscan (if not local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n=== Verifying Contracts on Etherscan ===");
    console.log("Waiting 30 seconds before verification...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        address: henNFTAddress,
        constructorArguments: [],
      });
      console.log("HenNFT verified");
    } catch (error) {
      console.log("HenNFT verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: henBreedingAddress,
        constructorArguments: [henNFTAddress],
      });
      console.log("HenBreeding verified");
    } catch (error) {
      console.log("HenBreeding verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: henBattleAddress,
        constructorArguments: [henNFTAddress],
      });
      console.log("HenBattle verified");
    } catch (error) {
      console.log("HenBattle verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: henRacingAddress,
        constructorArguments: [henNFTAddress],
      });
      console.log("HenRacing verified");
    } catch (error) {
      console.log("HenRacing verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: bettingSystemAddress,
        constructorArguments: [henBattleAddress, henRacingAddress],
      });
      console.log("BettingSystem verified");
    } catch (error) {
      console.log("BettingSystem verification failed:", error.message);
    }
  }

  console.log("\n=== Next Steps ===");
  console.log("1. Update frontend/.env with contract addresses");
  console.log("2. Run 'npx hardhat run scripts/mint-initial.js --network <network>' to mint initial hens");
  console.log("3. Start the frontend with 'cd frontend && npm run dev'");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });