import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { bscTestnet } from "wagmi/chains";

export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-project-id";

export const config = getDefaultConfig({
  appName: "Web3 x AI Escrow Starter",
  projectId: projectId,
  chains: [bscTestnet],
  ssr: false,
});
