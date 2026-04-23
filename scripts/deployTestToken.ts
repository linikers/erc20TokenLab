import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying TestToken with the account:", deployer.address);

  const initialSupply = 1000000; // 1 milhão
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
