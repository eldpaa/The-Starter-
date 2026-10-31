# Autonomous AI Oracle Escrow (Web3 x AI Starter Kit)

> **Brankas sayembara terdesentralisasi berbasis BNB Smart Chain dengan sistem kurasi hasil kerja otomatis bertenaga Juri AI dan penyelesaian sengketa netral.**

---

## 📌 Problem & Solution

### Masalah (Problem)
1. **Pencairan Lambat & Bias Manusia:** Pada platform sayembara Web3 tradisional (Bounty/Grants), kreator tugas sering membutuhkan waktu berhari-hari atau berminggu-minggu untuk memeriksa bukti pengerjaan (*proof of work*) peserta.
2. **Risiko Penipuan Creator (Rug-pull):** Pekerja sering khawatir pekerjaannya diambil tanpa dibayar karena verifikasi dilakukan secara sepihak oleh pembuat tugas.
3. **Halusinasi & Ketidakpastian AI:** Jika AI digunakan sebagai verifikator tanpa pengaman ketat, AI rawan terkena *prompt injection* atau salah memberi vonis saat bukti yang diserahkan ambigu.

### Solusi (Solution)
* **Smart Contract Dual-Currency Escrow:** Dana hadiah (tBNB atau ERC-20) terkunci secara *trustless* di kontrak sejak sayembara dibuat.
* **Deterministic AI Oracle (Hono + Viem):** Backend bertindak sebagai relayer yang mendengarkan event on-chain `WorkSubmitted`, lalu memanggil model LLM dengan **Strict JSON Schema** dan `temperature: 0` untuk menilai kecocokan bukti secara objektif.
* **Ambang Batas Kepercayaan (Threshold $\ge 0.80$):**
  * Jika skor valid $\ge 0.80 \rightarrow$ Dana dicairkan seketika ke dompet pekerja.
  * Jika bukti salah total $\ge 0.80 \rightarrow$ Status brankas di-reset ke `Dibuka`.
  * Jika skor $< 0.80$ (ambigu/link rusak/indikasi manipulasi) $\rightarrow$ Kontrak otomatis masuk ke masa sanggah (**Status Sengketa**) untuk ditinjau oleh Admin netral.

---

## 🏗️ System Architecture

```
                                      ┌─────────────────────────────────┐
                                      │      Worker / Peserta Tugas     │
                                      └────────────────┬────────────────┘
                                                       │ 1. submitWork(proofURI)
                                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Smart Contract: MultiEscrow.sol                    │
│                      (BNB Smart Chain Testnet)                         │
└───────────────────────┬────────────────────────────────────────────────┘
                        │ 2. emit WorkSubmitted(worker, proofURI)
                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Backend Relayer & Indexer (Hono API)                 │
│  - watcher.ts  : Event Listener Web3 (Viem)                            │
│  - judge.ts    : AI Evaluator (Prompt Injection Guard & Strict Schema) │
│  - relayer.ts  : Transaction Signer via Oracle Private Key             │
└───────────────────────┬────────────────────────────────────────────────┘
                        │ 3. fulfillVerification(eligible, butuhManusia, score)
                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Keputusan On-Chain (State Machine)                   │
│  ├── [Eligible = true, butuhManusia = false]  ──▶ Payout Cair ke Worker│
│  ├── [Eligible = false, butuhManusia = false] ──▶ Reset status Dibuka  │
│  └── [butuhManusia = true (Score < 0.80)]     ──▶ Status Sengketa      │
│                                                   (Admin Mediasi)      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Project Links & Verified Contract

* **Source Repository:** [GitHub Repository](https://github.com/eldpaa/The-Starter-)
* **Verified Contract (BscScan Testnet):** [`0xF267733e996938bFfe8437F6D60Be6D5798268e4`](https://testnet.bscscan.com/address/0xF267733e996938bFfe8437F6D60Be6D5798268e4)
* **dApp Web Interface:** [dApp Client Link](https://github.com/eldpaa/The-Starter-#3-frontend-dapp-frontend)

### 📜 On-Chain Proof of Work (Live Testnet Verification)

Seluruh tahapan *state machine* dApp telah teruji secara penuh di **BNB Smart Chain Testnet**:

| No | Tahapan Eksekusi | Akun / Peran | Transaction Hash | Status On-Chain |
|---|---|---|---|---|
| 1 | **Contract Deployment** | Creator / Deployer | [`0xc123486ecaa70c3ee0d8956872095f45a02b38404998f23cd6a7fb093a6f9b7f`](https://testnet.bscscan.com/tx/0xc123486ecaa70c3ee0d8956872095f45a02b38404998f23cd6a7fb093a6f9b7f) | Berhasil lock `0.001 tBNB` |
| 2 | **Worker Submit Work** | Worker (`0x29F6...`) | [`0x638ed80d22e5dc767c202bdc37c5a7453932f746cfdc68e0eea6f5735993d875`](https://testnet.bscscan.com/tx/0x638ed80d22e5dc767c202bdc37c5a7453932f746cfdc68e0eea6f5735993d875) | Status $\rightarrow$ `Disubmit` |
| 3 | **AI Oracle Fulfill (Dispute)** | Relayer (`0xd7D1...`) | [`0xc769cc87bc5a8df85a0c54aa2f3d533068ed5b3ef69381c27e9e89a8a5132bf5`](https://testnet.bscscan.com/tx/0xc769cc87bc5a8df85a0c54aa2f3d533068ed5b3ef69381c27e9e89a8a5132bf5) | Status $\rightarrow$ `Sengketa` (Score 0.5 < 0.80) |
| 4 | **Admin Settlement & Payout** | Admin (`0x7567...`) | [`0x52f2cb055dcca0436c87d374662f5e40fb0b629f595ef4b2d787d1ed754d6dae`](https://testnet.bscscan.com/tx/0x52f2cb055dcca0436c87d374662f5e40fb0b629f595ef4b2d787d1ed754d6dae) | Status $\rightarrow$ `Selesai` (Dana Cair) |

---

## 📁 Struktur Monorepo

```bash
template-web3-ai-starter/
├── contracts/               # Smart Contract & Pengujian Foundry
│   ├── src/
│   │   └── MultiEscrow.sol  # Dual-currency escrow, deadline, sengketa netral
│   ├── test/
│   │   └── MultiEscrow.t.sol# 4 skenario unit test otomatis Foundry
│   ├── script/
│   │   └── Deploy.s.sol     # Script deploy otomatis ke BSC Testnet
│   ├── foundry.toml         # Konfigurasi compiler & RPC endpoint
│   └── .env.example
├── backend/                 # Hono API & AI Oracle Relayer
│   ├── src/
│   │   ├── index.ts         # Server HTTP Hono (endpoint verifikasi manual & status)
│   │   ├── config.ts        # Parser variabel environment
│   │   ├── contracts.ts     # Interface ABI & Event
│   │   ├── lib/
│   │   │   ├── ai.ts        # Client LLM (Strict JSON Schema)
│   │   │   └── chain.ts     # Public & Oracle Wallet Client (Viem)
│   │   ├── services/
│   │   │   ├── judge.ts     # System prompt juri & logika threshold 0.80
│   │   │   └── relayer.ts   # Eksekusi transaksi on-chain
│   │   ├── indexer/
│   │   │   └── watcher.ts   # Event listener otomatis
│   │   └── uji-oracle.ts    # Skrip uji 3 skenario bukti
│   └── .env.example
├── frontend/                # Antarmuka dApp Web3
│   ├── src/
│   │   ├── App.tsx          # Dashboard utama & kartu info on-chain
│   │   ├── providers.tsx    # RainbowKit & Wagmi provider
│   │   ├── lib/
│   │   │   ├── wagmi.ts     # Konfigurasi BSC Testnet
│   │   │   └── contracts.ts # ABI & mapping status
│   │   └── components/
│   │       ├── ConnectWallet.tsx    # Tombol koneksi Web3 modal
│   │       ├── FormSubmitWork.tsx   # Form submit proofURI on-chain
│   │       └── StatusVerifikasi.tsx # Status visual responsif AI
│   └── .env.example
├── flow.md                  # Dokumentasi arsitektur dan first principles
└── README.md                # Dokumentasi utama repositori
```

---

## 🚀 Quickstart: Cara Menjalankan Proyek

### 1. Smart Contracts (`contracts/`)

**Prasyarat:** Pasang [Foundry](https://getfoundry.sh/).

```bash
cd contracts

# 1. Salin environment
cp .env.example .env
# Edit .env dan isi DEPLOYER_PRIVATE_KEY, ORACLE_ADDRESS, ADMIN_ADDRESS

# 2. Jalankan Unit Test (4 skenario wajib)
forge test -vvv

# 3. Deploy ke BNB Smart Chain Testnet
forge script script/Deploy.s.sol:DeployEscrow \
  --rpc-url bscTestnet \
  --broadcast \
  --verify \
  -vvvv
```

---

### 2. Backend Relayer & AI Oracle (`backend/`)

**Prasyarat:** Node.js v20+ atau Bun.

```bash
cd backend

# 1. Install dependensi
npm install

# 2. Salin environment
cp .env.example .env
# Isi CONTRACT_ADDRESS, ORACLE_PRIVATE_KEY, dan AI_API_KEY (Gemini/OpenAI)

# 3. Jalankan pengujian skenario juri AI (3 kasus uji)
npm run test:oracle

# 4. Jalankan Event Watcher & Server API
npm run dev
```

---

### 3. Frontend dApp (`frontend/`)

```bash
cd frontend

# 1. Install dependensi
npm install

# 2. Salin environment
cp .env.example .env
# Masukkan VITE_CONTRACT_ADDRESS hasil deployment

# 3. Jalankan server lokal
npm run dev
```

Buka peramban pada URL interface dApp yang tersedia. Hubungkan dompet Anda ke **BNB Smart Chain Testnet** dan kirim bukti pekerjaan.

---

## 🛡️ Prinsip Keamanan & Desain Teknis (First Principles)

1. **Dual Currency Terstandarisasi:** Menggunakan `address(0)` untuk tBNB native (`msg.value`) dan antarmuka `SafeTransferLib` untuk token ERC-20 guna mencegah kerentanan pengiriman token non-standar.
2. **Anti-Collusion Dispute Resolution:** Fungsi `resolveDispute` dibatasi oleh modifier `hanyaAdmin` independen, bukan `hanyaCreator`, mencegah kreator nakal mencairkan dana kembali secara sepihak saat sengketa terjadi.
3. **Pertahanan Prompt Injection:** Input `proofURI` dan kriteria tugas diisolasi di blok data mentah (`user`). LLM diinstruksikan mengabaikan segala perintah yang mencoba memanipulasi format output atau memaksa persetujuan otomatis.
4. **Respon Deterministik:** Penggunaan `temperature: 0` dan *Structured Outputs (Strict JSON Schema)* memastikan backend selalu menerima JSON yang valid tanpa teks percakapan tambahan.

---

## 🗺️ Roadmap & Future Enhancements

* [ ] **zkTLS Integration:** Verifikasi bukti pekerjaan secara privat tanpa mengekspos kredensial atau API key sensitif ke publik.
* [ ] **Milestone-Based Escrow:** Dukungan pencairan bertahap untuk tugas skala besar dengan verifikasi multi-tahap.
* [ ] **Multi-Model Consensus Oracle:** Agregasi skor dari beberapa penyedia LLM independen untuk meminimalkan ketergantungan pada satu model AI.
* [ ] **Cross-Chain Expansion:** Perluasan protokol ke jaringan EVM Layer-2 dan ekosistem multi-chain lainnya.
