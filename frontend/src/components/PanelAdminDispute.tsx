import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { multiEscrowAbi, CONTRACT_ADDRESS } from "../lib/contracts";
import { translations, Language } from "../lib/translations";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  FileText,
  Clock,
  UserCheck,
} from "lucide-react";

interface PanelAdminDisputeProps {
  status: string;
  statusRawIndex?: number;
  confidence?: number;
  proofURI?: string;
  adminAddress?: string;
  workerAddress?: string;
  lang?: Language;
  onSuccess?: () => void;
}

export function PanelAdminDispute({
  status,
  statusRawIndex,
  confidence,
  proofURI,
  adminAddress,
  workerAddress,
  lang = "en",
  onSuccess,
}: PanelAdminDisputeProps) {
  const t = translations[lang];
  const { address: userAddress, isConnected } = useAccount();

  const isDisputed =
    statusRawIndex === 2 || status === "Sengketa" || status === "Disputed";

  const {
    data: hash,
    isPending: isSubmitting,
    writeContract,
    error: resolveError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  if (!isDisputed) return null;

  const isAdmin = Boolean(
    isConnected &&
      userAddress &&
      adminAddress &&
      userAddress.toLowerCase() === adminAddress.toLowerCase()
  );

  const isWorker = Boolean(
    isConnected &&
      userAddress &&
      workerAddress &&
      userAddress.toLowerCase() === workerAddress.toLowerCase()
  );

  const handleResolve = (cairkanKeWorker: boolean) => {
    localStorage.setItem(
      `dispute_resolution_${CONTRACT_ADDRESS.toLowerCase()}`,
      cairkanKeWorker ? "approved" : "rejected"
    );
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: multiEscrowAbi,
        functionName: "resolveDispute",
        args: [cairkanKeWorker],
      },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  // 1. Tampilan Khusus Worker (Tidak Ada Tombol Admin)
  if (isWorker) {
    return (
      <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-300">
              {t.workerReviewNoticeTitle}
            </h3>
            <p className="mt-1 text-xs text-slate-300">
              {t.workerReviewNoticeDesc}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Tampilan Khusus Pengunjung Lain / Belum Connect Admin
  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-center text-xs text-slate-400">
        <UserCheck className="mx-auto mb-2 h-5 w-5 text-slate-500" />
        <p>{t.nonAdminNotice}</p>
        {adminAddress && (
          <p className="mt-1 font-mono text-slate-500">
            Admin: {adminAddress.slice(0, 6)}...{adminAddress.slice(-4)}
          </p>
        )}
      </div>
    );
  }

  // 3. Tampilan Eksklusif Admin (Ringkasan Detail AI & Tombol Eksekusi)
  const confidenceVal = confidence ?? 50;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-amber-300">
            {t.adminPanelTitle}
          </h3>
          <p className="text-xs text-slate-400">{t.adminPanelSubtitle}</p>
        </div>
      </div>

      {/* Ringkasan Analisis AI Tanpa Diagram Rumit */}
      <div className="mt-5 rounded-lg border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <FileText className="h-4 w-4 text-blue-400" />
            {t.aiSummaryTitle}
          </span>
          {proofURI && (
            <a
              href={proofURI}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-blue-400 underline hover:text-blue-300"
            >
              {t.summaryProofLink} {proofURI.slice(0, 30)}...{" "}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="mt-3 space-y-3 text-xs">
          <div>
            <strong className="text-white">{t.summaryContentTitle}</strong>
            <p className="text-slate-300">{t.summaryContentDesc}</p>
          </div>

          <div>
            <strong className="text-white">{t.summaryRelevanceTitle}</strong>
            <p className="text-slate-300">{t.summaryRelevanceDesc}</p>
          </div>

          <div>
            <strong className="text-white">{t.summaryCompletionTitle}</strong>
            <p className="text-slate-300">{t.summaryCompletionDesc}</p>
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
            <strong className="text-blue-300">
              {t.summaryRecommendationTitle}
            </strong>
            <p className="mt-0.5 font-semibold text-white">
              {t.summaryRecommendationDesc(confidenceVal)}
            </p>
          </div>
        </div>
      </div>

      {/* Tombol Eksekusi Admin */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => handleResolve(true)}
          disabled={isSubmitting || isConfirming}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting || isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.confirmingVerdict}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              {t.approvePayoutBtn}
            </>
          )}
        </button>

        <button
          onClick={() => handleResolve(false)}
          disabled={isSubmitting || isConfirming}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting || isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.confirmingVerdict}
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              {t.rejectRefundBtn}
            </>
          )}
        </button>
      </div>

      {resolveError && (
        <div className="mt-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-400">
          Eksekusi sengketa gagal: {resolveError.message}
        </div>
      )}

      {isConfirmed && hash && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Putusan sengketa telah selesai di blockchain.</span>
          </div>
          <a
            href={`https://testnet.bscscan.com/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono underline hover:text-emerald-300"
          >
            Lihat Transaksi
          </a>
        </div>
      )}
    </div>
  );
}
