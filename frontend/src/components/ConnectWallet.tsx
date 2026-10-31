import { ConnectButton } from "@rainbow-me/rainbowkit";

export function ConnectWallet() {
  return (
    <div className="flex items-center">
      <ConnectButton showBalance={false} chainStatus="icon" />
    </div>
  );
}
