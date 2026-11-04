import React, { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { multiEscrowAbi, CONTRACT_ADDRESS } from "../lib/contracts";
import { translations, Language } from "../lib/translations";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

interface FormSubmitWorkProps {
  status: string;
  statusRawIndex?: number;
  lang?: Language;
  onSuccess?: () => void;
}

export function FormSubmitWork({
  status,
  statusRawIndex,
  lang = "en",
  onSuccess,
}: FormSubmitWorkProps) {
  const [proofURI, setProofURI] = useState("");
  const { isConnected } = useAccount();
  const t = translations[lang];

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

  // Bounty is open if statusRawIndex === 0 (or status matches Open / Dibuka)
  const isBountyOpen = statusRawIndex === 0 || status === "Dibuka" || status === "Open";

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
        {t.submitWorkTitle}
      </h3>
      <p className="mt-1 text-sm text-slate-400">
        {t.submitWorkSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {!isConnected ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
            <strong>{t.walletNotConnected}</strong>
          </div>
        ) : !isBountyOpen ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 text-xs text-slate-300">
            <strong>{t.bountyLocked}</strong>
          </div>
        ) : null}

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
            {t.proofUriLabel}
          </label>
          <input
            type="text"
            required
            disabled={!isConnected || !isBountyOpen || isSubmitting || isConfirming}
            value={proofURI}
            onChange={(e) => setProofURI(e.target.value)}
            placeholder={t.proofPlaceholder}
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
              {t.signingTx}
            </>
          ) : isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.confirmingTx}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {t.submitButton}
            </>
          )}
        </button>
      </form>

      {submitError && (
        <div className="mt-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-400">
          {t.submitFailed} {submitError.message}
        </div>
      )}

      {isConfirmed && hash && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{t.submitSuccess}</span>
          </div>
          <a
            href={`https://testnet.bscscan.com/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono underline hover:text-emerald-300"
          >
            {t.viewOnBscScan}
          </a>
        </div>
      )}
    </div>
  );
}
