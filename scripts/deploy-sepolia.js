const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Deploying CryptoChuck to Sepolia Testnet...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance < hre.ethers.parseEther("0.1")) {
    console.log("⚠️  Warning: Low balance! You may need more test ETH from faucets.");
    console.log("    Get free Sepolia ETH from:");
    console.log("    - https://sepoliafaucet.com/");
    console.log("    - https://www.infura.io/faucet/sepolia");
  }
  
  console.log("\n⏳ Deploying contracts...\n");

  // 1. Deploy HenNFT
  console.log("1️⃣  Deploying HenNFT...");
  const HenNFT = await hre.ethers.getContractFactory("HenNFT");
  const henNFT = await HenNFT.deploy();
  await henNFT.waitForDeployment();
  const henNFTAddress = await henNFT.getAddress();
  console.log("✅ HenNFT deployed to:", henNFTAddress);

  // 2. Deploy HenBreeding
  console.log("\n2️⃣  Deploying HenBreeding...");
  const HenBreeding = await hre.ethers.getContractFactory("HenBreeding");
  const henBreeding = await HenBreeding.deploy(henNFTAddress);
  await henBreeding.waitForDeployment();
  const henBreedingAddress = await henBreeding.getAddress();
  console.log("✅ HenBreeding deployed to:", henBreedingAddress);

  // 3. Deploy HenBattle
  console.log("\n3️⃣  Deploying HenBattle...");
  const HenBattle = await hre.ethers.getContractFactory("HenBattle");
  const henBattle = await HenBattle.deploy(henNFTAddress);
  await henBattle.waitForDeployment();
  const henBattleAddress = await henBattle.getAddress();
  console.log("✅ HenBattle deployed to:", henBattleAddress);

  // 4. Deploy HenRacing
  console.log("\n4️⃣  Deploying HenRacing...");
  const HenRacing = await hre.ethers.getContractFactory("HenRacing");
  const henRacing = await HenRacing.deploy(henNFTAddress);
  await henRacing.waitForDeployment();
  const henRacingAddress = await henRacing.getAddress();
  console.log("✅ HenRacing deployed to:", henRacingAddress);

  // 5. Deploy BettingSystem
  console.log("\n5️⃣  Deploying BettingSystem...");
  const BettingSystem = await hre.ethers.getContractFactory("BettingSystem");
  const bettingSystem = await BettingSystem.deploy(henBattleAddress, henRacingAddress);
  await bettingSystem.waitForDeployment();
  const bettingSystemAddress = await bettingSystem.getAddress();
  console.log("✅ BettingSystem deployed to:", bettingSystemAddress);

  // 6. Set authorized contracts
  console.log("\n⚙️  Configuring contract permissions...");
  
  console.log("   Setting Breeding contract...");
  const tx1 = await henNFT.setBreedingContract(henBreedingAddress);
  await tx1.wait();
  console.log("   ✅ Breeding contract authorized");
  
  console.log("   Setting Battle contract...");
  const tx2 = await henNFT.setBattleContract(henBattleAddress);
  await tx2.wait();
  console.log("   ✅ Battle contract authorized");
  
  console.log("   Setting Racing contract...");
  const tx3 = await henNFT.setRacingContract(henRacingAddress);
  await tx3.wait();
  console.log("   ✅ Racing contract authorized");

  // Save deployment info
  const deployment = {
    network: "sepolia",
    chainId: 11155111,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    contracts: {
      HenNFT: henNFTAddress,
      HenBreeding: henBreedingAddress,
      HenBattle: henBattleAddress,
      HenRacing: henRacingAddress,
      BettingSystem: bettingSystemAddress
    },
    explorer: {
      HenNFT: `https://sepolia.etherscan.io/address/${henNFTAddress}`,
      HenBreeding: `https://sepolia.etherscan.io/address/${henBreedingAddress}`,
      HenBattle: `https://sepolia.etherscan.io/address/${henBattleAddress}`,
      HenRacing: `https://sepolia.etherscan.io/address/${henRacingAddress}`,
      BettingSystem: `https://sepolia.etherscan.io/address/${bettingSystemAddress}`
    }
  };

  const deploymentDir = 'deployments';
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir);
  }

  const deploymentFile = `${deploymentDir}/sepolia-${Date.now()}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));

  // Update frontend config
  const frontendConfig = `// Auto-generated for Sepolia deployment
// Generated at: ${new Date().toISOString()}
// Network: Sepolia Testnet (Chain ID: 11155111)

export const CONTRACT_ADDRESSES = {
  henNFT: '${henNFTAddress}',
  henBreeding: '${henBreedingAddress}',
  henBattle: '${henBattleAddress}',
  henRacing: '${henRacingAddress}',
  bettingSystem: '${bettingSystemAddress}'
};

export const NETWORK_CONFIG = {
  chainId: 11155111,
  name: 'Sepolia Testnet',
  rpcUrl: 'https://sepolia.infura.io/v3/56c857ab8ed5406b86d247e317ff7672',
  blockExplorer: 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18
  }
};

// Export for easy importing
export default {
  addresses: CONTRACT_ADDRESSES,
  network: NETWORK_CONFIG
};
`;

  fs.writeFileSync('frontend/src/config/contracts.js', frontendConfig);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📋 Deployment Summary:");
  console.log("   Network:        Sepolia Testnet");
  console.log("   Chain ID:       11155111");
  console.log("   Deployer:       ", deployer.address);
  console.log("   Block Number:   ", await hre.ethers.provider.getBlockNumber());
  console.log("\n📦 Contract Addresses:");
  console.log("   HenNFT:         ", henNFTAddress);
  console.log("   HenBreeding:    ", henBreedingAddress);
  console.log("   HenBattle:      ", henBattleAddress);
  console.log("   HenRacing:      ", henRacingAddress);
  console.log("   BettingSystem:  ", bettingSystemAddress);
  console.log("\n🔍 View on Etherscan:");
  console.log("   https://sepolia.etherscan.io/address/" + henNFTAddress);
  console.log("\n💾 Deployment saved to:", deploymentFile);
  console.log("✅ Frontend config updated at: frontend/src/config/contracts.js");
  
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\n⏳ Waiting 60 seconds before verification...");
    console.log("   (Etherscan needs time to index the contracts)");
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    console.log("\n🔍 Verifying contracts on Etherscan...\n");
    
    try {
      console.log("   Verifying HenNFT...");
      await hre.run("verify:verify", {
        address: henNFTAddress,
        constructorArguments: []
      });
      console.log("   ✅ HenNFT verified");
    } catch (e) {
      console.log("   ⚠️  HenNFT:", e.message.includes("already verified") ? "Already verified" : e.message);
    }

    try {
      console.log("   Verifying HenBreeding...");
      await hre.run("verify:verify", {
        address: henBreedingAddress,
        constructorArguments: [henNFTAddress]
      });
      console.log("   ✅ HenBreeding verified");
    } catch (e) {
      console.log("   ⚠️  HenBreeding:", e.message.includes("already verified") ? "Already verified" : e.message);
    }

    try {
      console.log("   Verifying HenBattle...");
      await hre.run("verify:verify", {
        address: henBattleAddress,
        constructorArguments: [henNFTAddress]
      });
      console.log("   ✅ HenBattle verified");
    } catch (e) {
      console.log("   ⚠️  HenBattle:", e.message.includes("already verified") ? "Already verified" : e.message);
    }

    try {
      console.log("   Verifying HenRacing...");
      await hre.run("verify:verify", {
        address: henRacingAddress,
        constructorArguments: [henNFTAddress]
      });
      console.log("   ✅ HenRacing verified");
    } catch (e) {
      console.log("   ⚠️  HenRacing:", e.message.includes("already verified") ? "Already verified" : e.message);
    }

    try {
      console.log("   Verifying BettingSystem...");
      await hre.run("verify:verify", {
        address: bettingSystemAddress,
        constructorArguments: [henBattleAddress, henRacingAddress]
      });
      console.log("   ✅ BettingSystem verified");
    } catch (e) {
      console.log("   ⚠️  BettingSystem:", e.message.includes("already verified") ? "Already verified" : e.message);
    }
  } else {
    console.log("\n⚠️  Skipping verification (ETHERSCAN_API_KEY not set)");
  }

  console.log("\n🎮 Next Steps:");
  console.log("   1. Switch MetaMask to Sepolia network");
  console.log("   2. Get test ETH from faucets if needed");
  console.log("   3. Run: cd frontend && npm run dev");
  console.log("   4. Connect wallet and mint your first hen!");
  console.log("\n💡 Useful Commands:");
  console.log("   Mint hens:    npx hardhat run scripts/mint-initial.js --network sepolia");
  console.log("   Create races: npx hardhat run scripts/create-races.js --network sepolia");
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
