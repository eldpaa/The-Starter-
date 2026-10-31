import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESS, multiEscrowAbi, STATUS_LABELS } from "./lib/contracts";
import { ConnectWallet } from "./components/ConnectWallet";
import { FormSubmitWork } from "./components/FormSubmitWork";
import { StatusVerifikasi } from "./components/StatusVerifikasi";
import { Coins, Clock, ShieldCheck, User, ExternalLink, RefreshCw } from "lucide-react";

export function App() {
  const { data: statusIndex, refetch: refetchStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: multiEscrowAbi,
    functionName: "status",
    query: { refetchInterval: 4000 },
  });

  const { data: rewardAmount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: multiEscrowAbi,
    functionName: "rewardAmount",
  });

  const { data: tokenAddress } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: multiEscrowAbi,
    functionName: "token",
  });

  const { data: creatorAddress } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: multiEscrowAbi,
    functionName: "creator",
  });

  const { data: workerAddress } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: multiEscrowAbi,
    functionName: "worker",
  });

  const { data: deadlineTimestamp } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: multiEscrowAbi,
    functionName: "deadline",
  });

  const { data: confidenceScore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: multiEscrowAbi,
    functionName: "lastConfidenceScore",
    query: { refetchInterval: 4000 },
  });

  const currentStatus =
    statusIndex !== undefined ? STATUS_LABELS[statusIndex] : "Loading...";

  const isNativeBNB =
    !tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000";

  const deadlineDate = deadlineTimestamp
    ? new Date(Number(deadlineTimestamp) * 1000).toLocaleString("id-ID")
    : "-";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 font-bold text-white shadow-lg shadow-blue-500/20">
              AI
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Web3 x AI Escrow</h1>
              <p className="text-xs text-slate-400">BNB Smart Chain Testnet</p>
            </div>
          </div>
          <ConnectWallet />
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Banner Status & Actions */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Sayembara Tugas (Bounty Escrow)
            </h2>
            <p className="text-sm text-slate-400">
              Dana terkunci aman di smart contract. Juri AI memverifikasi hasil kerja secara otomatis.
            </p>
          </div>
          <button
            onClick={() => refetchStatus()}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Perbarui Data On-Chain
          </button>
        </div>

        {/* Real-time AI Status Notification */}
        <div className="mb-6">
          <StatusVerifikasi
            status={currentStatus}
            confidence={confidenceScore ? Number(confidenceScore) : undefined}
          />
        </div>

        {/* Escrow Details Card Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card Status & Reward */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Status Kontrak</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  currentStatus === "Selesai"
                    ? "bg-green-500/20 text-green-400"
                    : currentStatus === "Sengketa"
                    ? "bg-amber-500/20 text-amber-400"
                    : currentStatus === "Disubmit"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-slate-700 text-slate-200"
                }`}
              >
                {currentStatus}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-400">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Hadiah</p>
                <p className="text-xl font-bold text-white">
                  {rewardAmount ? formatEther(rewardAmount) : "0"}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    {isNativeBNB ? "tBNB" : "Token ERC-20"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Card Deadline */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Batas Waktu (Deadline)
            </span>
            <div className="mt-4 flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-400">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Tenggat Selesai</p>
                <p className="text-sm font-semibold text-slate-200">{deadlineDate}</p>
              </div>
            </div>
          </div>

          {/* Card Creator & Worker */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pihak Terkait
            </span>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <User className="h-3.5 w-3.5" /> Creator:
                </span>
                <span className="font-mono text-slate-300">
                  {creatorAddress ? `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}` : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Worker:
                </span>
                <span className="font-mono text-slate-300">
                  {workerAddress && workerAddress !== "0x0000000000000000000000000000000000000000"
                    ? `${workerAddress.slice(0, 6)}...${workerAddress.slice(-4)}`
                    : "Belum Ada"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Work Form */}
        <div className="mt-8">
          <FormSubmitWork status={currentStatus} onSuccess={() => refetchStatus()} />
        </div>

        {/* Footer info link */}
        <footer className="mt-12 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          <p>
            Alamat Kontrak:{" "}
            <a
              href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-blue-400 underline hover:text-blue-300"
            >
              {CONTRACT_ADDRESS} <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
