import { parseAbi, parseAbiItem } from "viem";

export const statusLabel = ["Dibuka", "Disubmit", "Sengketa", "Selesai", "Dibatalkan"] as const;
export type StatusEscrow = (typeof statusLabel)[number];

export const multiEscrowAbi = parseAbi([
  "function status() view returns (uint8)",
  "function creator() view returns (address)",
  "function admin() view returns (address)",
  "function token() view returns (address)",
  "function rewardAmount() view returns (uint256)",
  "function deadline() view returns (uint256)",
  "function oracle() view returns (address)",
  "function worker() view returns (address)",
  "function proofURI() view returns (string)",
  "function lastConfidenceScore() view returns (uint8)",
  "function fulfillVerification(bool eligible, bool butuhManusia, uint8 confidenceScore, string calldata alasan)",
  "function submitWork(string calldata _proofURI)",
  "function cancelBounty()",
  "function claimRefundExpired()",
  "function resolveDispute(bool cairkanKeWorker)",
  "function updateOracle(address newOracle)",
]);

export const workSubmittedEvent = parseAbiItem(
  "event WorkSubmitted(address indexed worker, string proofURI)"
);

export const verificationCompletedEvent = parseAbiItem(
  "event VerificationCompleted(bool eligible, bool butuhManusia, uint8 confidenceScore, string alasan)"
);
