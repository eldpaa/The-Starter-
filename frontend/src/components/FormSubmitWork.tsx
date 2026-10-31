import React, { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { multiEscrowAbi, CONTRACT_ADDRESS } from "../lib/contracts";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

interface FormSubmitWorkProps {
  status: string;
  onSuccess?: () => void;
}

export function FormSubmitWork({ status, onSuccess }: FormSubmitWorkProps) {
  const [proofURI, setProofURI] = useState("");
  const { isConnected } = useAccount();

  const {
    data: hash,
    isPending: isSubmitting,
    writeContract,
    error: submitError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const isBountyOpen = status === "Dibuka";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofURI.trim() || !isBountyOpen) return;

    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: multiEscrowAbi,
        functionName: "submitWork",
        args: [proofURI.trim()],
      },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-slate-100">
        Kirim Bukti Tugas (Submit Work)
      </h3>
      <p className="mt-1 text-sm text-slate-400">
        Masukkan URL bukti pengerjaan (link GitHub / IPFS) untuk dievaluasi
        otomatis oleh Juri AI.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
            Proof URI
          </label>
          <input
            type="text"
            required
            disabled={!isConnected || !isBountyOpen || isSubmitting || isConfirming}
            value={proofURI}
            onChange={(e) => setProofURI(e.target.value)}
            placeholder="https://github.com/developer/project/pull/1"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!isConnected || !isBountyOpen || !proofURI.trim() || isSubmitting || isConfirming}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menandatangani Transaksi di Dompet...
            </>
          ) : isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menunggu Konfirmasi Blockchain...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Kirim Tugas ke Escrow
            </>
          )}
        </button>
      </form>

      {submitError && (
        <div className="mt-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-400">
          Gagal submit: {submitError.message}
        </div>
      )}

      {isConfirmed && hash && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Tugas berhasil dikirim ke blockchain!</span>
          </div>
          <a
            href={`https://testnet.bscscan.com/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono underline hover:text-emerald-300"
          >
            Lihat di BscScan ↗
          </a>
        </div>
      )}
    </div>
  );
}
