import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

export function StatusVerifikasi({ status, confidence }: { status: string; confidence?: number }) {
  if (status === "Disubmit") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 p-3 text-blue-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">
          Sedang diverifikasi otomatis oleh Juri AI... Mohon tunggu (~15 detik).
        </span>
      </div>
    );
  }

  if (status === "Sengketa") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-amber-500">
        <AlertTriangle className="h-5 w-5" />
        <span className="text-sm font-medium">
          AI mendeteksi keraguan (Akurasi: {confidence}%). Masuk masa sanggah untuk ditinjau oleh Admin.
        </span>
      </div>
    );
  }

  if (status === "Selesai") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-green-500">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-medium">Verifikasi Berhasil! Dana telah dicairkan on-chain.</span>
      </div>
    );
  }

  return null;
}
