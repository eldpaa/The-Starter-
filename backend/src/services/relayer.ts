import { client, oracleWallet } from "../lib/chain";
import { CONTRACT_ADDRESS } from "../config";
import { multiEscrowAbi, statusLabel } from "../contracts";

export const bacaStatusEscrow = async () => {
  const [statusNum, creator, worker, proofURI, lastScore, rewardAmount] = await client.multicall({
    contracts: [
      { address: CONTRACT_ADDRESS, abi: multiEscrowAbi, functionName: "status" },
      { address: CONTRACT_ADDRESS, abi: multiEscrowAbi, functionName: "creator" },
      { address: CONTRACT_ADDRESS, abi: multiEscrowAbi, functionName: "worker" },
      { address: CONTRACT_ADDRESS, abi: multiEscrowAbi, functionName: "proofURI" },
      { address: CONTRACT_ADDRESS, abi: multiEscrowAbi, functionName: "lastConfidenceScore" },
      { address: CONTRACT_ADDRESS, abi: multiEscrowAbi, functionName: "rewardAmount" },
    ],
    allowFailure: false,
  });

  return {
    status: statusLabel[statusNum as number] ?? "Unknown",
    creator,
    worker,
    proofURI,
    lastConfidenceScore: Number(lastScore),
    rewardAmount: rewardAmount.toString(),
  };
};

export const kirimVonisOracle = async (
  eligible: boolean,
  butuhManusia: boolean,
  confidenceScore: number,
  alasan: string
) => {
  if (!oracleWallet) {
    throw new Error("ORACLE_PRIVATE_KEY belum disetel di .env!");
  }

  // Konversi confidence_score (0.00 - 1.00) ke skala uint8 (0 - 100) untuk smart contract
  const scoreUint8 = Math.min(100, Math.max(0, Math.round(confidenceScore * 100)));

  console.log(`📡 Mengirim transaksi fulfillVerification ke ${CONTRACT_ADDRESS}...`);
  console.log(`   eligible: ${eligible} | butuhManusia: ${butuhManusia} | score: ${scoreUint8}`);

  const hash = await oracleWallet.writeContract({
    address: CONTRACT_ADDRESS,
    abi: multiEscrowAbi,
    functionName: "fulfillVerification",
    args: [eligible, butuhManusia, scoreUint8, alasan],
    gasPrice: await client.getGasPrice(),
  });

  const receipt = await client.waitForTransactionReceipt({ hash });
  console.log(`✅ Vonis sukses on-chain! Tx Hash: ${hash} (Block: ${receipt.blockNumber})`);

  return {
    hash,
    blockNumber: receipt.blockNumber.toString(),
    status: receipt.status,
  };
};
