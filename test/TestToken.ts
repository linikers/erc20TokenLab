import { expect } from "chai";
import { ethers } from "hardhat";

describe("TestToken", function () {
  it("Should have correct name, symbol and total supply", async function () {
    const initialSupply = 1000000;
    const TestToken = await ethers.getContractFactory("TestToken");
    const token = await TestToken.deploy(initialSupply);

    expect(await token.name()).to.equal("TestToken");
    expect(await token.symbol()).to.equal("TTK");
    
    const expectedSupply = ethers.parseEther(initialSupply.toString());
    expect(await token.totalSupply()).to.equal(expectedSupply);
  });

  it("Should mint the initial supply to the deployer", async function () {
    const [owner] = await ethers.getSigners();
    const initialSupply = 1000000;
    const TestToken = await ethers.getContractFactory("TestToken");
    const token = await TestToken.deploy(initialSupply);

    const ownerBalance = await token.balanceOf(owner.address);
    const expectedSupply = ethers.parseEther(initialSupply.toString());
    expect(ownerBalance).to.equal(expectedSupply);
  });
});
