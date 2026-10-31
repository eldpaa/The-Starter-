import { parseAbi } from "viem";

export const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const STATUS_LABELS = [
  "Dibuka",
  "Disubmit",
  "Sengketa",
  "Selesai",
  "Dibatalkan",
] as const;

export type StatusEscrow = (typeof STATUS_LABELS)[number];

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
  "event WorkSubmitted(address indexed worker, string proofURI)",
  "event VerificationCompleted(bool eligible, bool butuhManusia, uint8 confidenceScore, string alasan)",
  "event DisputeTriggered(uint8 confidenceScore, string alasan)",
  "event DisputeResolved(bool cairkanKeWorker, address indexed penerima)",
  "event RewardReleased(address indexed to, uint256 amount)",
  "event BountyCancelled()",
]);
