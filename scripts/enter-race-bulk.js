const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🏁 Entering hens into race...");

  const [deployer, ...accounts] = await hre.ethers.getSigners();
  
  // Get deployment info
  const networkName = hre.network.name;
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const files = fs.readdirSync(deploymentsDir);
  
  const deploymentFile = files.find(f => f.startsWith(networkName));
  if (!deploymentFile) {
    throw new Error(`No deployment file found for network ${networkName}`);
  }

  const deploymentPath = path.join(deploymentsDir, deploymentFile);
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const HenNFT = await hre.ethers.getContractAt("HenNFT", deployment.contracts.HenNFT);
  const HenRacing = await hre.ethers.getContractAt("HenRacing", deployment.contracts.HenRacing);

  console.log("HenNFT contract:", deployment.contracts.HenNFT);
  console.log("HenRacing contract:", deployment.contracts.HenRacing);

  const raceId = 1; // Enter race #1
  const race = await HenRacing.races(raceId);
  const entryFee = race.entryFee;

  console.log(`\nEntering Race #${raceId}`);
  console.log(`Entry Fee: ${hre.ethers.formatEther(entryFee)} ETH`);

  // Get hens owned by deployer
  const henIds = await HenNFT.getHensByOwner(deployer.address);
  console.log(`\nFound ${henIds.length} hens owned by deployer`);

  // Enter first 3 hens into the race
  const hensToEnter = Math.min(3, henIds.length);
  
  for (let i = 0; i < hensToEnter; i++) {
    const henId = henIds[i];
    try {
      console.log(`\nEntering Hen #${henId}...`);
      const tx = await HenRacing.enterRace(raceId, henId, {
        value: entryFee
      });
      await tx.wait();
      console.log(`✅ Hen #${henId} entered successfully!`);
    } catch (error) {
      console.error(`❌ Failed to enter Hen #${henId}:`, error.message);
    }
  }

  // Now mint and enter hens for other accounts to reach 5 participants
  console.log("\n🐔 Minting hens for other accounts to reach minimum participants...");
  
  const mintPrice = await HenNFT.mintPrice();
  const accountsToUse = accounts.slice(0, 3); // Use first 3 accounts

  for (let i = 0; i < accountsToUse.length; i++) {
    const account = accountsToUse[i];
    
    try {
      // Mint hen for this account
      console.log(`\nMinting hen for account ${i + 1}...`);
      const mintTx = await HenNFT.connect(account).mintHen({
        value: mintPrice
      });
      await mintTx.wait();
      
      // Get the newly minted hen
      const accountHens = await HenNFT.getHensByOwner(account.address);
      const newHenId = accountHens[accountHens.length - 1];
      
      console.log(`✅ Hen #${newHenId} minted for account ${i + 1}`);
      
      // Enter the race
      console.log(`Entering Hen #${newHenId} into race...`);
      const enterTx = await HenRacing.connect(account).enterRace(raceId, newHenId, {
        value: entryFee
      });
      await enterTx.wait();
      
      console.log(`✅ Hen #${newHenId} entered race successfully!`);
    } catch (error) {
      console.error(`❌ Failed for account ${i + 1}:`, error.message);
    }
  }

  // Check race status
  const participants = await HenRacing.getRaceParticipants(raceId);
  console.log(`\n🏁 Race #${raceId} Status:`);
  console.log(`   Participants: ${participants.length}/${race.maxParticipants}`);
  console.log(`   Prize Pool: ${hre.ethers.formatEther(race.prizePool)} ETH`);
  
  if (participants.length >= 5) {
    console.log(`\n✅ Race has minimum participants and is ready to start!`);
    console.log(`   Go to the frontend and click "Start Race" button`);
  } else {
    console.log(`\n⚠️  Need ${5 - participants.length} more participants to start`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
