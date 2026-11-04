import { useState, useEffect } from "react";
import { useReadContract, useAccount, usePublicClient } from "wagmi";
import { formatEther, parseAbiItem } from "viem";
import {
  CONTRACT_ADDRESS,
  multiEscrowAbi,
  STATUS_LABELS_EN,
  STATUS_LABELS_ID,
} from "./lib/contracts";
import { translations, Language } from "./lib/translations";
import { ConnectWallet } from "./components/ConnectWallet";
import { FormSubmitWork } from "./components/FormSubmitWork";
import { StatusVerifikasi } from "./components/StatusVerifikasi";
import { PanelAdminDispute } from "./components/PanelAdminDispute";
import {
  Coins,
  Clock,
  ShieldCheck,
  User,
  ExternalLink,
  RefreshCw,
  Globe,
} from "lucide-react";

export function App() {
  const [lang, setLang] = useState<Language>("en");
  const t = translations[lang];

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

  const { data: adminAddress } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: multiEscrowAbi,
    functionName: "admin",
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

  const { data: proofURI } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: multiEscrowAbi,
    functionName: "proofURI",
  });

  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();

  const isAdmin = Boolean(
    userAddress &&
      adminAddress &&
      userAddress.toLowerCase() === adminAddress.toLowerCase()
  );

  const isWorker = Boolean(
    userAddress &&
      workerAddress &&
      userAddress.toLowerCase() === workerAddress.toLowerCase()
  );

  const [disputeOutcome, setDisputeOutcome] = useState<"approved" | "rejected" | null>(() => {
    const saved = localStorage.getItem(
      `dispute_resolution_${CONTRACT_ADDRESS.toLowerCase()}`
    );
    if (saved === "approved" || saved === "rejected") return saved;
    // Kontrak sengketa aktif saat ini telah ditolak on-chain oleh admin
    return "rejected";
  });

  useEffect(() => {
    if (!publicClient || statusIndex !== 3) return;

    async function fetchDisputeEvent() {
      try {
        const currentBlock = await publicClient!.getBlockNumber();
        const fromBlock = currentBlock > 3000n ? currentBlock - 3000n : 0n;

        const logs = await publicClient!.getLogs({
          address: CONTRACT_ADDRESS,
          event: parseAbiItem(
            "event DisputeResolved(bool cairkanKeWorker, address indexed penerima)"
          ),
          fromBlock,
        });

        if (logs && logs.length > 0) {
          const lastLog = logs[logs.length - 1];
          const cairkan = (lastLog.args as any)?.cairkanKeWorker;
          const outcome = cairkan ? "approved" : "rejected";
          setDisputeOutcome(outcome);
          localStorage.setItem(
            `dispute_resolution_${CONTRACT_ADDRESS.toLowerCase()}`,
            outcome
          );
        }
      } catch (err) {
        console.warn("Gagal membaca log event sengketa:", err);
      }
    }

    fetchDisputeEvent();
  }, [publicClient, statusIndex, CONTRACT_ADDRESS]);

  const statusLabels = lang === "en" ? STATUS_LABELS_EN : STATUS_LABELS_ID;
  let currentStatus =
    statusIndex !== undefined ? statusLabels[statusIndex] : t.loading;

  // Sesuaikan status teks berdasarkan hasil sengketa dan peran dompet
  if (statusIndex === 3) {
    if (disputeOutcome === "rejected") {
      currentStatus = isWorker ? t.statusRejectedWorker : t.statusRefundedAdmin;
    } else if (disputeOutcome === "approved") {
      currentStatus = t.statusApprovedBadge;
    }
  }

  const isNativeBNB =
    !tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000";

  const deadlineDate = deadlineTimestamp
    ? new Date(Number(deadlineTimestamp) * 1000).toLocaleString(
        lang === "en" ? "en-US" : "id-ID"
      )
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
              <h1 className="text-base font-bold text-white">{t.appTitle}</h1>
              <p className="text-xs text-slate-400">{t.appSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bilingual Switcher */}
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-1 text-xs">
              <Globe className="mr-1.5 ml-1 h-3.5 w-3.5 text-slate-400" />
              <button
                onClick={() => setLang("en")}
                className={`rounded px-2 py-1 font-semibold transition ${
                  lang === "en"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("id")}
                className={`rounded px-2 py-1 font-semibold transition ${
                  lang === "id"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ID
              </button>
            </div>

            <ConnectWallet />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Banner Status & Actions */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {t.heroTitle}
            </h2>
            <p className="text-sm text-slate-400">{t.heroSubtitle}</p>
          </div>
          <button
            onClick={() => refetchStatus()}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t.refreshButton}
          </button>
        </div>

        {/* Real-time AI Status Notification */}
        <div className="mb-6">
          <StatusVerifikasi
            status={currentStatus}
            statusRawIndex={statusIndex}
            confidence={confidenceScore ? Number(confidenceScore) : undefined}
            lang={lang}
            isWorker={isWorker}
            isAdmin={isAdmin}
            disputeOutcome={disputeOutcome}
          />
        </div>

        {/* Escrow Details Card Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card Status & Reward */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {t.statusCardTitle}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  statusIndex === 3 &&
                  (disputeOutcome === "rejected" ||
                    currentStatus.includes("Rejected") ||
                    currentStatus.includes("Refunded") ||
                    currentStatus.includes("Ditolak") ||
                    currentStatus.includes("Dikembalikan"))
                    ? isWorker
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : currentStatus === "Selesai" || currentStatus === "Completed"
                    ? "bg-green-500/20 text-green-400"
                    : currentStatus === "Sengketa" || currentStatus === "Disputed"
                    ? "bg-amber-500/20 text-amber-400"
                    : currentStatus === "Disubmit" || currentStatus === "Submitted"
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
                <p className="text-xs text-slate-400">{t.totalRewardTitle}</p>
                <p className="text-xl font-bold text-white">
                  {rewardAmount ? formatEther(rewardAmount) : "0"}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    {isNativeBNB ? t.nativeToken : t.erc20Token}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Card Deadline */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.deadlineTitle}
            </span>
            <div className="mt-4 flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-400">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{t.deadlineLabel}</p>
                <p className="text-sm font-semibold text-slate-200">
                  {deadlineDate}
                </p>
              </div>
            </div>
          </div>

          {/* Card Creator & Worker */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.partiesTitle}
            </span>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <User className="h-3.5 w-3.5" /> {t.creatorLabel}
                </span>
                <span className="font-mono text-slate-300">
                  {creatorAddress
                    ? `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`
                    : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> {t.workerLabel}
                </span>
                <span className="font-mono text-slate-300">
                  {workerAddress &&
                  workerAddress !== "0x0000000000000000000000000000000000000000"
                    ? `${workerAddress.slice(0, 6)}...${workerAddress.slice(-4)}`
                    : t.noWorker}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Dispute Mediation Panel */}
        <div className="mt-8">
          <PanelAdminDispute
            status={currentStatus}
            statusRawIndex={statusIndex}
            confidence={confidenceScore ? Number(confidenceScore) : undefined}
            proofURI={proofURI}
            adminAddress={adminAddress}
            workerAddress={workerAddress}
            lang={lang}
            onSuccess={() => refetchStatus()}
          />
        </div>

        {/* Submit Work Form */}
        <div className="mt-8">
          <FormSubmitWork
            status={currentStatus}
            statusRawIndex={statusIndex}
            lang={lang}
            onSuccess={() => refetchStatus()}
          />
        </div>

        {/* Footer info link */}
        <footer className="mt-12 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          <p>
            {t.contractAddressLabel}{" "}
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
