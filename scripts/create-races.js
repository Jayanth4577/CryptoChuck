const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🏁 Creating races...");

  // Get deployment info
  const networkName = hre.network.name;
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const files = fs.readdirSync(deploymentsDir);
  
  // Get the latest deployment file
  const deploymentFiles = files
    .filter(f => f.startsWith(networkName))
    .sort()
    .reverse();
  
  if (deploymentFiles.length === 0) {
    throw new Error(`No deployment file found for network ${networkName}`);
  }

  const deploymentFile = deploymentFiles[0];
  const deploymentPath = path.join(deploymentsDir, deploymentFile);
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  // Get contracts
  const HenRacing = await hre.ethers.getContractAt(
    "HenRacing",
    deployment.contracts.HenRacing
  );

  console.log("HenRacing contract:", deployment.contracts.HenRacing);

  // Create 2 races (max limit)
  const races = [
    {
      entryFee: hre.ethers.parseEther("0.01"),
      maxParticipants: 10,
      description: "Race #1 - Standard Entry"
    },
    {
      entryFee: hre.ethers.parseEther("0.02"),
      maxParticipants: 15,
      description: "Race #2 - Premium Entry"
    }
  ];

  console.log("\n📋 Creating races...\n");

  for (let i = 0; i < races.length; i++) {
    const race = races[i];
    
    try {
      const tx = await HenRacing.createRace(
        race.entryFee,
        race.maxParticipants
      );
      
      await tx.wait();
      
      console.log(`✅ Race ${i + 1} created:`);
      console.log(`   Description: ${race.description}`);
      console.log(`   Entry Fee: ${hre.ethers.formatEther(race.entryFee)} ETH`);
      console.log(`   Max Participants: ${race.maxParticipants}`);
      console.log(`   Prize Pool (when full): ${hre.ethers.formatEther(race.entryFee * BigInt(race.maxParticipants))} ETH`);
      console.log("");
    } catch (error) {
      console.error(`❌ Failed to create race ${i + 1}:`, error.message);
    }
  }

  console.log("🎉 Race creation complete!");
  console.log("\n📊 Prize Distribution:");
  console.log("   🥇 1st Place: 50% of prize pool");
  console.log("   🥈 2nd Place: 30% of prize pool");
  console.log("   🥉 3rd Place: 20% of prize pool");
  console.log("\n💡 Racing Rules:");
  console.log("   • Maximum 2 active races at a time");
  console.log("   • Minimum 5 participants required to start");
  console.log("   • Each hen can only be in 1 race at a time");
  console.log("   • Race duration: 30 seconds");
  console.log("   • User controls when to start the race");
  console.log("\n🏁 Use the Racing page to enter hens and start races!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
