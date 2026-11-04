import { Loader2, AlertTriangle, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { translations, Language } from "../lib/translations";

export function StatusVerifikasi({
  status,
  statusRawIndex,
  confidence,
  lang = "en",
  isWorker = false,
  isAdmin = false,
  disputeOutcome = null,
}: {
  status: string;
  statusRawIndex?: number;
  confidence?: number;
  lang?: Language;
  isWorker?: boolean;
  isAdmin?: boolean;
  disputeOutcome?: "approved" | "rejected" | null;
}) {
  const t = translations[lang];

  if (
    statusRawIndex === 1 ||
    status === "Disubmit" ||
    status === "Submitted"
  ) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 p-3 text-blue-400 border border-blue-500/20">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">{t.verifyingAlert}</span>
      </div>
    );
  }

  if (
    statusRawIndex === 2 ||
    status === "Sengketa" ||
    status === "Disputed"
  ) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-amber-400 border border-amber-500/20">
        <AlertTriangle className="h-5 w-5" />
        <span className="text-sm font-medium">{t.disputeAlert(confidence)}</span>
      </div>
    );
  }

  const isResolvedOrCompleted =
    statusRawIndex === 3 ||
    status === "Selesai" ||
    status === "Completed" ||
    disputeOutcome !== null ||
    status.includes("Rejected") ||
    status.includes("Refunded") ||
    status.includes("Ditolak") ||
    status.includes("Dikembalikan");

  if (isResolvedOrCompleted) {
    // 1. Kasus Sengketa Ditolak (Refund Creator)
    const isRejected =
      disputeOutcome === "rejected" ||
      status.includes("Rejected") ||
      status.includes("Refunded") ||
      status.includes("Ditolak") ||
      status.includes("Dikembalikan");

    if (isRejected) {
      if (isWorker) {
        return (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400 border border-red-500/20">
            <XCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{t.workerRejectedAlert}</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-amber-400 border border-amber-500/20">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{t.adminRejectedAlert}</span>
        </div>
      );
    }

    // 2. Kasus Sengketa Disetujui
    if (disputeOutcome === "approved") {
      if (isWorker) {
        return (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-green-400 border border-green-500/20">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{t.workerApprovedAlert}</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-green-400 border border-green-500/20">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{t.adminApprovedAlert}</span>
        </div>
      );
    }

    // 3. Kasus Selesai Biasa (Tanpa Sengketa)
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-green-400 border border-green-500/20">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-medium">{t.completedAlert}</span>
      </div>
    );
  }

  return null;
}
