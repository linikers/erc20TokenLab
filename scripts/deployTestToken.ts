import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying TestToken with the account:", deployer.address);

  // Use command-line argument for initial supply, default to 1,000,000
  const initialSupplyArg = process.env.INITIAL_SUPPLY || process.argv[2] || "1000000";
  const initialSupply = parseInt(initialSupplyArg, 10);
  if (isNaN(initialSupply) || initialSupply <= 0) {
    throw new Error("Invalid initial supply. Must be a positive integer.");
  }
  console.log("Initial supply:", initialSupply);
  const TestToken = await ethers.getContractFactory("TestToken");
  const token = await TestToken.deploy(initialSupply);

  await token.waitForDeployment();

  console.log("TestToken deployed to:", await token.getAddress());
  console.log("Symbol:", await token.symbol());
  console.log("Total Supply:", (await token.totalSupply()).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
