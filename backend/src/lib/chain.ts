import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import { ORACLE_PRIVATE_KEY, RPC_URL } from "../config";

// Provider pembaca data blockchain (Public Client)
export const client = createPublicClient({
  chain: bscTestnet,
  transport: http(RPC_URL),
});

// Wallet Client penandatangan transaksi khusus Oracle
export const oracleAccount = ORACLE_PRIVATE_KEY ? privateKeyToAccount(ORACLE_PRIVATE_KEY) : null;

export const oracleWallet = oracleAccount
  ? createWalletClient({
      account: oracleAccount,
      chain: bscTestnet,
      transport: http(RPC_URL),
    })
  : null;
