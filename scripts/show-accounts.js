// Display Hardhat test accounts
const hre = require("hardhat");

async function main() {
  console.log("\n=== Hardhat Test Accounts ===\n");
  
  const accounts = await hre.ethers.getSigners();
  
  for (let i = 0; i < Math.min(5, accounts.length); i++) {
    const account = accounts[i];
    const balance = await hre.ethers.provider.getBalance(account.address);
    console.log(`Account #${i}:`);
    console.log(`  Address: ${account.address}`);
    console.log(`  Balance: ${hre.ethers.formatEther(balance)} ETH`);
    console.log();
  }
  
  console.log("\n=== Import Account #0 into MetaMask ===");
  console.log("Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  console.log("\nSteps:");
  console.log("1. Open MetaMask");
  console.log("2. Click the account icon → Import Account");
  console.log("3. Select 'Private Key'");
  console.log("4. Paste the private key above");
  console.log("5. Click 'Import'");
  console.log("\nThis account has 10,000 ETH and owns the minted hens!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
