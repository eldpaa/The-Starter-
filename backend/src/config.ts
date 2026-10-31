import type { Address } from "viem";

export const PORT = Number(process.env.PORT ?? 3000);
export const RPC_URL = process.env.RPC_URL ?? "https://bsc-testnet.drpc.org";
export const CONTRACT_ADDRESS = (process.env.CONTRACT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address;

// Kunci rahasia Oracle untuk menandatangani transaksi on-chain
export const ORACLE_PRIVATE_KEY = (process.env.ORACLE_PRIVATE_KEY ?? process.env.ORACLE_PK)?.trim() as `0x${string}`;

export const LLM = {
  baseUrl: (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").trim().replace(/\/$/, ""),
  apiKey: (process.env.LLM_API_KEY ?? process.env.AI_API_KEY)?.trim() ?? "",
  model: (process.env.LLM_MODEL ?? "gpt-4o-mini").trim(),
} as const;
