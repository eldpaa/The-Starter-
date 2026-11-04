# Flow & Arsitektur: Web3 x AI Starter Kit

Dokumentasi alur logika dan first principle dari template `template-web3-ai-starter`.

---

## 1. Komponen Utama & File

* **Smart Contract (`contracts/`):**
  * `contracts/src/MultiEscrow.sol`: Dual currency (tBNB & ERC-20), 5 Status siklus hidup (`Dibuka`, `Disubmit`, `Sengketa`, `Selesai`, `Dibatalkan`), refund deadline, dan sengketa admin.
  * `contracts/test/MultiEscrow.t.sol`: Unit test otomatis Foundry (Eligible, Not Eligible, Ragu/Sengketa, Refund Expiry).
  * `contracts/script/Deploy.s.sol`: Script deployment otomatis ke BSC Testnet dengan broadcast Foundry.
  * `contracts/foundry.toml` & `.env.example`: Konfigurasi RPC network, compiler solc 0.8.20, dan Etherscan/BscScan verifier.
* **Backend Relayer & AI Oracle (`backend/`):**
  * `backend/package.json` & `.env.example`: Konfigurasi dependensi Hono & Viem.
  * `backend/src/config.ts`: Membaca `PORT`, `RPC_URL`, `CONTRACT_ADDRESS`, `ORACLE_PRIVATE_KEY`, dan konfigurasi LLM.
  * `backend/src/contracts.ts`: Definisi ABI `MultiEscrow` dan event `WorkSubmitted`.
  * `backend/src/lib/chain.ts`: `publicClient` (baca RPC) & `oracleWallet` (tanda tangan transaksi via `ORACLE_PRIVATE_KEY`).
  * `backend/src/lib/ai.ts`: Gerbang panggilan LLM dengan Strict JSON Schema & `temperature: 0`.
  * `backend/src/services/judge.ts`: Skema 4 field (`eligible`, `confidence_score`, `butuhManusia`, `alasan`) dan System Prompt terstruktur dengan threshold $0.80$.
  * `backend/src/services/relayer.ts`: Eksekusi transaksi `fulfillVerification` on-chain dan pembaca status escrow.
  * `backend/src/indexer/watcher.ts`: Event listener `WorkSubmitted` untuk auto-trigger AI Oracle.
  * `backend/src/index.ts`: Server Hono API dengan rute `POST /api/verify` dan `GET /api/status/:address`.
  * `backend/src/uji-oracle.ts`: Skrip pengujian 3 skenario bukti (Valid, Salah Total, Ambigu/Rusak).
* **Frontend UI (`frontend/`):**
  * `frontend/package.json` & `.env.example`: Dependensi Vite, React 19, Tailwind CSS v4, RainbowKit, Wagmi.
  * `frontend/src/lib/wagmi.ts`: Konfigurasi RainbowKit & Wagmi khusus jaringan BSC Testnet (`bscTestnet`).
  * `frontend/src/lib/contracts.ts`: Definisi ABI MultiEscrow & pemetaan status numerik ke label UI.
  * `frontend/src/providers.tsx`: Root wrapper React (WagmiProvider, QueryClientProvider, RainbowKitProvider).
  * `frontend/src/components/ConnectWallet.tsx`: Tombol koneksi Web3 modal siap pakai.
  * `frontend/src/components/FormSubmitWork.tsx`: Formulir pengiriman bukti tugas (`submitWork`) dengan status hash & receipt BscScan.
  * `frontend/src/components/StatusVerifikasi.tsx`: Indikator status visual responsif (`Disubmit` / `Sengketa` / `Selesai`).
  * `frontend/src/App.tsx`: Dashboard utama penggabung detail escrow, submit form, dan status AI real-time.
  * `frontend/src/main.tsx`: Entry point React DOM.
* **Dokumentasi & Setup:**
  * `README.md`: Dokumentasi utama repositori (Problem, Solution, Arsitektur, On-Chain Proof of Work, Quickstart, Roadmap).
  * `flow.md`: Dokumentasi first principles teknis monorepo.

---

## 2. Diagram Alur Logika Backend Relayer & Oracle

```
[Peserta Submit Tugas on-chain]
              │
              ▼
    (Event WorkSubmitted)
              │
              ▼
[watcher.ts (Event Listener)] ──▶ Ekstrak: worker & proofURI
              │
              ▼
[judge.ts (AI Oracle)] ─────────▶ Evaluasi kriteria + Threshold 0.80
              │
              ▼
[relayer.ts (Oracle Wallet)] ───▶ Eksekusi fulfillVerification(eligible, butuhManusia, score, alasan)
              │
              ▼
[Smart Contract MultiEscrow.sol]
  ├── eligible: true, butuhManusia: false ──▶ Status Selesai (Dana Cair ke Worker)
  ├── eligible: false, butuhManusia: false ──▶ Status Dibuka (Reset Worker)
  └── butuhManusia: true                   ──▶ Status Sengketa (Admin resolveDispute)
```

---

## 3. Diagram Alur Interaksi Frontend dApp

```
[Pengguna / Peserta]
         │
         ▼
[ConnectWallet (RainbowKit)] ──▶ Terhubung ke BSC Testnet (tBNB)
         │
         ▼
[App.tsx (Wagmi Hook)] ───────▶ Membaca on-chain: Status, Hadiah, Deadline
         │
         ├─── Jika status == "Dibuka" ────▶ [FormSubmitWork.tsx]
         │                                       │ (Kirim proofURI on-chain)
         │                                       ▼
         │                                 (Status berubah jadi "Disubmit")
         │
         └─── Jika status == "Disubmit" ──▶ [StatusVerifikasi.tsx]
                                                 ├── Animasi loading (~15 detik)
                                                 ├── Juri AI memverifikasi di backend
                                                 └── UI otomatis refresh status on-chain
```
## 4. Rangkuman Jejak Rekam On-Chain (On-Chain Audit Trail)

Seluruh bukti transaksi telah diverifikasi dan terekam di BNB Smart Chain Testnet:
1. Deploy Kontrak MultiEscrow: 0xF267733e996938bFfe8437F6D60Be6D5798268e4

logs terminal = 
contracts on  master [!+?] ❯ forge script script/Deploy.s.sol:DeployEscrow --rpc-url bscTestnet --broadcast -vvvv
[⠊] Compiling...
[⠊] Compiling 1 files with Solc 0.8.20
[⠒] Solc 0.8.20 finished in 894.94ms
Compiler run successful!
Traces:
  [1152276] DeployEscrow::run()
    ├─ [0] VM::envUint("DEPLOYER_PRIVATE_KEY") [staticcall]
    │   └─ ← [Return] <env var value>
    ├─ [0] VM::envAddress("ORACLE_ADDRESS") [staticcall]
    │   └─ ← [Return] <env var value>
    ├─ [0] VM::envAddress("ADMIN_ADDRESS") [staticcall]
    │   └─ ← [Return] <env var value>
    ├─ [0] VM::startBroadcast(<pk>)
    │   └─ ← [Return]
    ├─ [1113733] → new MultiEscrow@0xF267733e996938bFfe8437F6D60Be6D5798268e4
    │   └─ ← [Return] 4733 bytes of code
    ├─ [0] VM::stopBroadcast()
    │   └─ ← [Return]
    └─ ← [Return] MultiEscrow: [0xF267733e996938bFfe8437F6D60Be6D5798268e4]


Script ran successfully.

== Return ==
escrow: contract MultiEscrow 0xF267733e996938bFfe8437F6D60Be6D5798268e4

## Setting up 1 EVM.
==========================
Simulated On-chain Traces:

  [971093] → new MultiEscrow@0xF267733e996938bFfe8437F6D60Be6D5798268e4
    └─ ← [Return] 4733 bytes of code


2. Worker Submit Work: Tx 0x638ed80d22e5dc...(Status → Disubmit)

log terminal = 
review/web3-hackathon-review/template-web3-ai-starter ❯ cast send 0xF267733e996938bFfe8437F6D60Be6D5798268e4 "submitWork(string)" "https://github.com/developer/project/pull/1" --rpc-url https://dafrom                 0x29F652fEA2Fabd8D8673A68B175be2b32116F941
gasUsed              119214
from                 0x29F652fEA2Fabd8D8673A68B175be2b32116F941
gasUsed              119214
logs                 [{"address":"0xf267733e996938bffe8437f6d60be6d5798268e4","topics":["0x7222637ff073e2f9674b0a63b756fa166from                 0x29F652fEA2Fabd8D8673A68B175be2b32116F941
gasUsed              119214
gasUsed              119214
logs                 [{"address":"0xf267733e996938bffe8437f6d60be6d5798268e4","topics":["0x7222637ff073e2f9674b0a63b756fa166f70893c7ab038c22845a6b4dbbc8abf","0x00000000000000000000000029f652fea2fabd8d8673a68b175be2b32116f941"],"data":"0x00000000000000000000000e627e3","transactionHash":"0x638ed80d22e5dc767e627e3","transactionHash":"0x638ed80d22e5dc767c202bdc37c5a7453932f746cfdc68e0eea6f5735993d875","transactionIndex":"0x1","logIndex":"0x0","removed":false}]
logsBloom            0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002008000000000000008000000000000000000000000000000000000000080000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000200000000000000000000000000800000000000000000000000000000000000000000100
root
status               1 (success)
transactionHash      0x638ed80d22e5dc767c202bdc37c5a7453932f746cfdc68e0eea6f5735993d875
transactionIndex     1
type                 2
blobGasPrice
blobGasUsed
to                   0xF267733e996938bFfe8437F6D60Be6D5798268e4

3. AI Oracle Vonis Sengketa: Tx 0xc769cc87bc5a...(Skor 0.5 <0.80→ <0.80→ Status Sengketa)

logs terminal = 
web3-hackathon-review/template-web3-ai-starter/backend ❯ npm run dev

> dev
> bun run --hot src/index.ts

👀 Memulai Event Listener untuk kontrak: 0xF267733e996938bFfe8437F6D60Be6D5798268e4
🚀 Hono API berjalan di http://localhost:3000
Started development server: http://localhost:3000

📌 [PENDING TASK] Menemukan tugas on-chain yang menunggu verifikasi:
   Pekerja : 0x29F652fEA2Fabd8D8673A68B175be2b32116F941
   Bukti   : https://github.com/developer/project/pull/1
🤖 Memulai penilaian AI Oracle...
⚖️ Hasil Vonis AI:
   Eligible     : false
   Score        : 0.5
   ButuhManusia : true
   Alasan       : "Link bukti tidak dapat diakses"
📡 Mengirim transaksi fulfillVerification ke 0xF267733e996938bFfe8437F6D60Be6D5798268e4...
   eligible: false | butuhManusia: true | score: 50
✅ Vonis sukses on-chain! Tx Hash: 0xc769cc87bc5a8df85a0c54aa2f3d533068ed5b3ef69381c27e9e89a8a5132bf5 (Block: 140045372)


4. Admin Selesaikan Sengketa & Payout: Tx 0x52f2cb055dcc...(Dana cair → Status Selesai)

logs terminal = 
review/web3-hackathon-review/template-web3-ai-starter ❯ cast send 0xF267733e996938bFfe8437F6D60Be6D5798268e4 "resolveDispute(bool)" true --rpc-url https://data-seed-prebsc-1-s1.bnbchain.org:8545 --private-key 0x463ab8685e4a30bec856d880faf177f3767d0202479611bfccb49b0cd02f0ac5

blockHash            0x0043c6234ad65cb91f47ec614688379f33eb6768077a24f22c41b8673a6523b6
blockNumber          140050614
contractAddress
cumulativeGasUsed    195259
effectiveGasPrice    100000000
from                 0x7567d23aD84794ddAD3c53998e70349C10F4DF7E
gasUsed              41340
logs                 [{"address":"0xf267733e996938bffe8437f6d60be6d5798268e4","topics":["0x7a710f494850039a90f19432a11f8187b6226e1f50c3ad3e9b99e10e56c86091","0x00000000000000000000000029f652fea2fabd8d8673a68b175be2b32116f941"],"data":"0x00000000000000000000000000000000000000000000000000038d7ea4c68000","blockHash":"0x0043c6234ad65cb91f47ec614688379f33eb6768077a24f22c41b8673a6523b6","blockNumber":"0x85900b6","blockTimestamp":"0x6ae63c36","transactionHash":"0x52f2cb055dcca0436c87d374662f5e40fb0b629f595ef4b2d787d1ed754d6dae","transactionIndex":"0x3","logIndex":"0x3","removed":false},{"address":"0xf267733e996938bffe8437f6d60be6d5798268e4","topics":["0x2ec67f5b4db85d70dac82fb384845076250624bbdd05a1be5d6697957ec4a4cb","0x00000000000000000000000029f652fea2fabd8d8673a68b175be2b32116f941"],"data":"0x0000000000000000000000000000000000000000000000000000000000000001","blockHash":"0x0043c6234ad65cb91f47ec614688379f33eb6768077a24f22c41b8673a6523b6","blockNumber":"0x85900b6","blockTimestamp":"0x6ae63c36","transactionHash":"0x52f2cb055dcca0436c87d374662f5e40fb0b629f595ef4b2d787d1ed754d6dae","transactionIndex":"0x3","logIndex":"0x4","removed":false}]
logsBloom            0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000008000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000800000000000000000000000000000000000000000000000000000080000000000000000000000200000010000000000000000001800000000000000000000000000000000000000000000
root
status               1 (success)
transactionHash      0x52f2cb055dcca0436c87d374662f5e40fb0b629f595ef4b2d787d1ed754d6dae
transactionIndex     3
type                 2
blobGasPrice
blobGasUsed
to                   0xF267733e996938bFfe8437F6D60Be6D5798268e4


5. Frontend Reactive Sync: Antarmuka dApp me-refresh otomatis secara real-time tanpa reload halaman!

berganti dari yang seketa menjadi selesai 


## 5. Ringkasan Ekosistem

Arsitektur ini menggabungkan otomasi kurasi AI off-chain (Hono + LLM Strict JSON Schema) dengan kepastian hukum terdesentralisasi smart contract on-chain (BNB Smart Chain).

---

## 6. Alur Solusi Terstruktur: Panel Mediasi Admin (Human-in-the-Loop)

Dokumentasi alur penyelesaian sengketa berbasis kurasi AI dan konfirmasi satu-klik manusia tanpa CLI terminal:

### 1. Diagram Alur Mediasi

```
┌─────────────────────────────────────────────────────────────┐
│               PANEL MEDIASI ADMIN (WEB DAPP)                │
│                                                             │
│ 📋 Ringkasan Analisis AI (Checklist 4 Poin):                │
│  [✓] 1. Akses Link   : URL dapat diakses & responsif        │
│  [✓] 2. Relevansi    : Sesuai kriteria sayembara            │
│  [!] 3. Kelengkapan  : Bukti ambigu / butuh verifikasi      │
│  💡 4. Rekomendasi   : Saran keputusan juri AI              │
│                                                             │
│ [ Tombol Hijau: Setujui & Cairkan ]   [ Tombol Merah: Tolak ]│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
        Konfirmasi On-Chain (Wagmi / MetaMask Admin)
                               │
                               ▼
                MultiEscrow.resolveDispute(bool)
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
 [Setujui: Dana Cair ke Worker]         [Tolak: Refund ke Creator]
```

### 2. Format Checklist Ringkasan AI
1. **Aksesibilitas Bukti:** Validasi apakah link publik aktif (bukan 404, bukan private repo).
2. **Relevansi Pekerjaan:** Keselarasan materi submission dengan instruksi tugas.
3. **Kelengkapan Hasil:** Kode/demo fungsional tanpa indikasi manipulasi/plagiasi.
4. **Rekomendasi Juri AI:** Skor keyakinan akhir dan justifikasi objektif.

### 3. Analisis Keamanan & Gas Fee
* **Gas Fee:** Transaksi blockchain selalu membutuhkan gas fee. Perbedaannya terletak pada pembayar: server (custodial relayer) vs dompet admin (non-custodial).
* **Keamanan:** Pendekatan non-custodial via tombol Web dApp yang memicu MetaMask jauh lebih aman karena private key Admin tidak pernah disimpan di server backend, mencegah celah eksploitasi API publik.
