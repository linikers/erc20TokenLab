import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyToken", function () {
  it("Should have the correct name and symbol", async function () {
    const initialSupply = 1000000;
    const MyToken = await ethers.getContractFactory("MyToken");
    const token = await MyToken.deploy(initialSupply);

    expect(await token.name()).to.equal("Token Lab");
    expect(await token.symbol()).to.equal("TKLAB");
  });

  it("Should assign the total supply to the owner", async function () {
    const [owner] = await ethers.getSigners();
    const initialSupply = 1000000;
    const MyToken = await ethers.getContractFactory("MyToken");
    const token = await MyToken.deploy(initialSupply);

    const ownerBalance = await token.balanceOf(owner.address);
    expect(await token.totalSupply()).to.equal(ownerBalance);
  });
});
