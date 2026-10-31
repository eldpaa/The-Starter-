import { Hono } from "hono";
import { cors } from "hono/cors";
import { isAddress } from "viem";
import { PORT, CONTRACT_ADDRESS } from "./config";
import { verifikasiBukti } from "./services/judge";
import { bacaStatusEscrow, kirimVonisOracle } from "./services/relayer";
import { startWatcher } from "./indexer/watcher";

const app = new Hono();

app.use("/*", cors());

// Endpoint Kesehatan Server
app.get("/health", (c) => {
  return c.json({
    status: "online",
    contract: CONTRACT_ADDRESS,
    time: new Date().toISOString(),
  });
});

// Langkah 6: GET /api/status/:address → Cek status verifikasi dan data escrow worker
app.get("/api/status/:address", async (c) => {
  const addr = c.req.param("address");
  if (!isAddress(addr)) {
    return c.json({ error: "Alamat wallet tidak valid" }, 400);
  }

  try {
    const data = await bacaStatusEscrow();
    const isWorker = data.worker.toLowerCase() === addr.toLowerCase();

    return c.json({
      wallet: addr,
      isWorker,
      escrow: data,
    });
  } catch (err: any) {
    return c.json({ error: err?.message ?? String(err) }, 500);
  }
});

// Langkah 6: POST /api/verify → Memicu verifikasi manual jika event terlewat
app.post("/api/verify", async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body || !body.rules || !body.proof || !body.worker) {
    return c.json({
      error: "Body harus memuat: rules (string), proof (string), worker (address)"
    }, 400);
  }

  if (!isAddress(body.worker)) {
    return c.json({ error: "Alamat worker tidak valid" }, 400);
  }

  try {
    console.log(`\n[MANUAL TRIGGER] Memulai verifikasi bukti untuk worker: ${body.worker}`);
    
    // Langkah 4: Ambil Data & Panggil AI Oracle
    const vonis = await verifikasiBukti(body.rules, body.proof, body.worker);

    // Langkah 5: Eksekusi Transaksi Relayer ke Smart Contract
    const tx = await kirimVonisOracle(
      vonis.eligible,
      vonis.butuhManusia,
      vonis.confidence_score,
      vonis.alasan
    );

    return c.json({
      ok: true,
      vonis,
      transaksi: tx,
    }, 200);
  } catch (err: any) {
    return c.json({ error: err?.message ?? String(err) }, 500);
  }
});

// Jalankan Watcher Event Listener saat server menyala
if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
  startWatcher();
} else {
  console.log("ℹ️ CONTRACT_ADDRESS belum disetel di .env; Watcher dinonaktifkan.");
}

console.log(`🚀 Hono API berjalan di http://localhost:${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
