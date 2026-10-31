const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying MultiEscrow with account:", deployer.address);

  // Parameter Constructor MultiEscrow.sol
  const tokenAddress = hre.ethers.ZeroAddress; // address(0) untuk native tBNB
  const rewardAmount = hre.ethers.parseEther("0.001");
  const oracleAddress = process.env.ORACLE_ADDRESS;
  const adminAddress = process.env.ADMIN_ADDRESS;
  const deadlineJam = 24;

  if (!oracleAddress || !adminAddress) {
    throw new Error("Harap setel ORACLE_ADDRESS dan ADMIN_ADDRESS di file .env!");
  }

  const MultiEscrow = await hre.ethers.getContractFactory("MultiEscrow");
  const escrow = await MultiEscrow.deploy(
    tokenAddress,
    rewardAmount,
    oracleAddress,
    adminAddress,
    deadlineJam,
    { value: rewardAmount }
  );

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log("✅ MultiEscrow berhasil di-deploy ke:", address);
  console.log("\nPerintah verifikasi BscScan:");
  console.log(
    `npx hardhat verify --network bscTestnet ${address} "${tokenAddress}" "${rewardAmount}" "${oracleAddress}" "${adminAddress}" ${deadlineJam}`
  );
}

main().catch((error) => {
  console.error("❌ Deployment gagal:", error);
  process.exitCode = 1;
});
