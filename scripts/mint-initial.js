const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = hre.network.name;
  console.log(`Minting initial hens on network: ${network}`);

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    throw new Error(`deployments directory not found. Run the deploy script first (npm run deploy:local)`);
  }

  const files = fs.readdirSync(deploymentsDir).filter((f) => f.startsWith(`${network}-`));
  if (files.length === 0) {
    throw new Error(`No deployments found for network '${network}'. Run 'npm run deploy:local' first.`);
  }

  files.sort(); // filenames include timestamp so sorting gives chronological order
  const latest = files[files.length - 1];
  const deploymentInfo = JSON.parse(fs.readFileSync(path.join(deploymentsDir, latest), "utf8"));
  const henNFTAddress = deploymentInfo.contracts && deploymentInfo.contracts.HenNFT;
  if (!henNFTAddress) {
    throw new Error(`HenNFT address not found in ${latest}`);
  }

  console.log(`Using HenNFT at: ${henNFTAddress}`);

  const [minter] = await hre.ethers.getSigners();
  console.log(`Minting from account: ${minter.address}`);

  const HenNFT = await hre.ethers.getContractFactory("HenNFT");
  const henNFT = HenNFT.attach(henNFTAddress).connect(minter);

  // Get required mint price
  const mintPrice = await henNFT.MINT_PRICE();
  console.log(`Mint price (wei): ${mintPrice.toString()}`);

  const count = process.env.COUNT ? parseInt(process.env.COUNT, 10) : 3;
  console.log(`Minting ${count} hens...`);

  for (let i = 0; i < count; i++) {
    const tx = await henNFT.mintHen({ value: mintPrice });
    console.log(`Sent mint tx ${i + 1}: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Mint tx ${i + 1} mined in block ${receipt.blockNumber}`);

    // Try to find HenMinted event
    try {
      const event = receipt.events && receipt.events.find((e) => e.event === "HenMinted");
      if (event) {
        const [tokenId, owner] = event.args;
        console.log(`-> Hen minted: tokenId=${tokenId.toString()} owner=${owner}`);
      }
    } catch (err) {
      // fallback: nothing
    }
  }

  console.log("Done minting initial hens.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
