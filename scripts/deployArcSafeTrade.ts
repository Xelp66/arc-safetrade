import hre from "hardhat";

const ARC_USDC_ADDRESS =
  process.env.ARC_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";

async function main() {
  const { ethers } = hre;
  const escrow = await ethers.deployContract("ArcSafeTradeEscrow", [
    ARC_USDC_ADDRESS,
  ]);

  await escrow.waitForDeployment();

  console.log("ArcSafeTradeEscrow deployed to:", await escrow.getAddress());
  console.log("USDC token:", ARC_USDC_ADDRESS);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
