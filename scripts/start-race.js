const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get race ID from command line argument
  const raceId = process.env.RACE_ID || "1";
  
  console.log(`🏁 Starting race #${raceId}...`);

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

  // Get contract
  const HenRacing = await hre.ethers.getContractAt(
    "HenRacing",
    deployment.contracts.HenRacing
  );

  console.log("HenRacing contract:", deployment.contracts.HenRacing);

  try {
    // Get race info
    const participants = await HenRacing.getRaceParticipants(raceId);
    console.log(`\n📊 Race #${raceId} has ${participants.length} participants`);
    
    if (participants.length < 2) {
      console.log("❌ Cannot start race: Need at least 2 participants");
      return;
    }

    console.log("Participants:");
    for (let i = 0; i < participants.length; i++) {
      console.log(`   - Hen #${participants[i]}`);
    }

    console.log("\n🎬 Starting race...");
    const tx = await HenRacing.startRace(raceId);
    const receipt = await tx.wait();
    
    console.log("✅ Race started successfully!");
    console.log(`   Transaction hash: ${receipt.hash}`);
    
    // Get race results
    console.log("\n🏆 Race Results:");
    const results = await HenRacing.getRaceResults(raceId);
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
      console.log(`   ${medal} Position ${result.position}: Hen #${result.henId}`);
      console.log(`      Owner: ${result.owner}`);
      console.log(`      Prize: ${hre.ethers.formatEther(result.prize)} ETH`);
    }

  } catch (error) {
    console.error("❌ Error starting race:", error.message);
    
    if (error.message.includes("Race not ready to start")) {
      console.log("\n💡 The race hasn't reached its start time yet.");
      console.log("   Wait until the scheduled start time or the race is full.");
    } else if (error.message.includes("Not enough participants")) {
      console.log("\n💡 The race needs at least 2 participants to start.");
    } else if (error.message.includes("Race already complete")) {
      console.log("\n💡 This race has already finished.");
      console.log("   You can view the results in the Racing page.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
