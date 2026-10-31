import { client } from "../lib/chain";
import { CONTRACT_ADDRESS } from "../config";
import { workSubmittedEvent } from "../contracts";
import { verifikasiBukti } from "../services/judge";
import { bacaStatusEscrow, kirimVonisOracle } from "../services/relayer";

const prosesVerifikasi = async (worker: string, proofURI: string) => {
  try {
    const ATURAN_DEFAULT = "Dokumentasi backend dan kode sumber sesuai spesifikasi proyek.";
    console.log(`🤖 Memulai penilaian AI Oracle...`);
    const vonis = await verifikasiBukti(ATURAN_DEFAULT, proofURI, worker);

    console.log(`⚖️ Hasil Vonis AI:`);
    console.log(`   Eligible     : ${vonis.eligible}`);
    console.log(`   Score        : ${vonis.confidence_score}`);
    console.log(`   ButuhManusia : ${vonis.butuhManusia}`);
    console.log(`   Alasan       : "${vonis.alasan}"`);

    // Eksekusi transaksi on-chain oleh Oracle
    await kirimVonisOracle(
      vonis.eligible,
      vonis.butuhManusia,
      vonis.confidence_score,
      vonis.alasan
    );
  } catch (err: any) {
    console.error("❌ Gagal memproses verifikasi submission:", err?.message ?? err);
  }
};

export const startWatcher = () => {
  console.log(`👀 Memulai Event Listener untuk kontrak: ${CONTRACT_ADDRESS}`);

  // Cek apakah ada tugas yang sudah berstatus 'Disubmit' on-chain tapi belum divonis
  bacaStatusEscrow().then(async (data) => {
    if (data.status === "Disubmit" && data.proofURI && data.worker) {
      console.log(`\n📌 [PENDING TASK] Menemukan tugas on-chain yang menunggu verifikasi:`);
      console.log(`   Pekerja : ${data.worker}`);
      console.log(`   Bukti   : ${data.proofURI}`);
      await prosesVerifikasi(data.worker, data.proofURI);
    }
  }).catch((err) => {
    console.error("⚠️ Gagal mengecek status awal escrow:", err?.message ?? err);
  });

  // Dengarkan event WorkSubmitted baru dari smart contract
  return client.watchEvent({
    address: CONTRACT_ADDRESS,
    event: workSubmittedEvent,
    onLogs: async (logs) => {
      for (const log of logs) {
        const worker = log.args.worker;
        const proofURI = log.args.proofURI;

        if (!worker || !proofURI) continue;

        console.log(`\n🔔 [EVENT DETEKSI] WorkSubmitted`);
        console.log(`   Pekerja : ${worker}`);
        console.log(`   Bukti   : ${proofURI}`);

        await prosesVerifikasi(worker, proofURI);
      }
    },
    onError: (error) => {
      console.error("⚠️ Watcher error:", error.message);
    },
  });
};
