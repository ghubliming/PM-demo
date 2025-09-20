import { ethers } from "hardhat";

async function main() {
  console.log("Deploying PredictionMarket contract...");
  
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy();
  
  await predictionMarket.waitForDeployment();
  const address = await predictionMarket.getAddress();
  
  console.log(`PredictionMarket deployed to: ${address}`);
  
  // Create a sample market for demo
  const duration = 24 * 60 * 60; // 24 hours
  const tx = await predictionMarket.createMarket(
    "Will Bitcoin reach $100,000 by end of 2024?",
    "Yes, Bitcoin will reach $100k",
    "No, Bitcoin won't reach $100k",
    duration
  );
  
  await tx.wait();
  console.log("Sample market created!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });