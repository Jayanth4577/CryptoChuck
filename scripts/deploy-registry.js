const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting UserRegistry deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
  console.log();

  // Deploy UserRegistry
  console.log("Deploying UserRegistry...");
  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const registry = await UserRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("UserRegistry deployed to:", registryAddress);
  console.log();

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contract: {
      UserRegistry: registryAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(
    deploymentsDir,
    `registry-${hre.network.name}-${Date.now()}.json`
  );
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("\nContract Address:");
  console.log("UserRegistry:", registryAddress);
  console.log("\nDeployment info saved to:", deploymentPath);

  // Copy ABI to backend
  try {
    const artifactPath = path.join(__dirname, "../artifacts/contracts/UserRegistry.sol/UserRegistry.json");
    const backendAbisDir = path.join(__dirname, "../backend/abis");
    
    if (!fs.existsSync(backendAbisDir)) {
      fs.mkdirSync(backendAbisDir, { recursive: true });
    }
    
    const destPath = path.join(backendAbisDir, "UserRegistry.json");
    fs.copyFileSync(artifactPath, destPath);
    console.log("\nCopied UserRegistry ABI to backend/abis/");
  } catch (err) {
    console.log("Failed to copy ABI:", err.message);
  }

  // Add to .env
  try {
    const envPath = path.join(__dirname, "../backend/.env");
    const envContent = `\n# User Registry Contract\nUSER_REGISTRY_ADDRESS=${registryAddress}\n`;
    
    if (fs.existsSync(envPath)) {
      fs.appendFileSync(envPath, envContent);
      console.log("Added USER_REGISTRY_ADDRESS to backend/.env");
    } else {
      console.log("\n⚠️  Create backend/.env and add:");
      console.log(`USER_REGISTRY_ADDRESS=${registryAddress}`);
    }
  } catch (err) {
    console.log("Note: Manually add to backend/.env:");
    console.log(`USER_REGISTRY_ADDRESS=${registryAddress}`);
  }

  // Verify on Etherscan (if not local)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n=== Verifying on Etherscan ===");
    console.log("Waiting 30 seconds before verification...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        address: registryAddress,
        constructorArguments: [],
      });
      console.log("UserRegistry verified on Etherscan");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  console.log("\n=== Next Steps ===");
  console.log("1. Fund a sponsor wallet with Sepolia ETH");
  console.log("2. Add SPONSOR_PRIVATE_KEY to backend/.env");
  console.log("3. Deploy backend to Vercel with env variables");
  console.log("4. Test registration on frontend");
  console.log("\nSee REGISTRATION_SETUP.md for detailed instructions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
