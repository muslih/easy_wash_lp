# Easywash — Astro + Bot Telegram

Website: **https://easy-wash-bjm.vercel.app** · Repo: **github.com/muslih/easy_wash_lp** (branch `master`)

Website Easywash (Astro 6 + Tailwind CSS 4, mobile friendly). Isi website (paket, harga,
teks, nomor WhatsApp, alamat, foto, logo) bisa diatur oleh **admin grup Telegram Easywash**
lewat bot, tanpa menyentuh kode.

## Cara kerjanya

```
Admin di grup Telegram ──► Bot (/api/telegram, Vercel Function) ──► commit ke GitHub (src/content/site.json + foto)
                                                                          │
Grup Telegram ◄── "✅ Website sudah diperbarui" (GitHub Action) ◄── Vercel build ulang otomatis (±1–2 menit)
```

- Semua konten ada di **`src/content/site.json`** (bisa juga diedit manual).
- Foto/logo yang dikirim lewat bot disimpan di `src/assets/`.
- Hanya **admin grup** yang bisa mengubah. Anggota biasa ditolak.
- Semua halaman tetap statis; hanya `/api/telegram` yang berjalan sebagai Vercel Function.

## Menjalankan di komputer

Butuh Node.js 22 (minimal 22.12).

```bash
npm install
npm run dev      # http://localhost:4321
npm run build
```

---

## Setup bot (sekali saja, ±10 menit)

### 1. Token bot
@BotFather → `/mybots` → pilih bot → **API Token**. Pastikan bot sudah masuk grup Easywash
(tidak perlu jadi admin). Ketik `/id` di grup untuk memastikan ID grup (`-5330493853`).

### 2. Token GitHub
GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate new token:
- Repository access: **Only select repositories → easy_wash_lp**
- Permissions → Repository → **Contents: Read and write**

### 3. Environment variables di Vercel
Vercel → project **easy-wash-bjm** → Settings → **Environment Variables** (centang Production):

| Nama | Isi |
|---|---|
| `TELEGRAM_BOT_TOKEN` | token dari BotFather |
| `TELEGRAM_GROUP_ID` | `-5330493853` |
| `TELEGRAM_WEBHOOK_SECRET` | kode acak bebas (huruf/angka), min. 16 karakter |
| `GITHUB_TOKEN` | token GitHub dari langkah 2 |
| `GITHUB_REPO` | `muslih/easy_wash_lp` |
| `GITHUB_BRANCH` | `master` |
| `SITE_URL` | `https://easy-wash-bjm.vercel.app` |

Lalu **Redeploy** (Deployments → ⋯ → Redeploy) agar variabel terbaca.

### 4. Kabar deploy ke grup (opsional tapi disarankan)
GitHub repo → Settings → Secrets and variables → **Actions** → New repository secret:
`TELEGRAM_BOT_TOKEN` dan `TELEGRAM_GROUP_ID` (isi sama seperti di atas).
Workflow `.github/workflows/telegram-deploy-notify.yml` akan mengirim "✅ Website sudah diperbarui"
atau "❌ gagal" ke grup setiap Vercel selesai deploy.

### 5. Sambungkan webhook
Di komputer, salin `.env.example` menjadi `.env`, isi nilainya (sama dengan di Vercel), lalu:

```bash
npm install
npm run bot:setup
# ✅ @nama_bot terhubung ke https://easy-wash-bjm.vercel.app/api/telegram
```

Selesai — ketik `/menu` di grup.

---

## Memakai bot

| Perintah | Fungsi |
|---|---|
| `/menu` | Menu utama |
| `/paket` | Tambah, ubah, urutkan, hapus paket & harga |
| `/teks` | Ubah teks halaman (hero, keunggulan, langkah, dsb.) |
| `/info` | Nomor WhatsApp, nama usaha, alamat, jam buka, link Maps |
| `/foto` | Ganti foto utama & logo |
| `/lihat` | Ringkasan isi website |
| `/id` | Lihat ID chat (untuk setup) |

**Mengubah sesuatu:** tekan tombol ✏️ → bot mengirim pesan → **balas (reply)** pesan itu dengan isi baru.

- Harga: `12000` atau `12.000`
- Fitur paket: satu fitur per baris
- Kosongkan kolom opsional: kirim `-`
- Paket baru: `Nama | Harga | Satuan | Durasi`, mis. `Cuci Sepatu | 25000 | pasang | 3 hari`
- Logo PNG transparan: kirim sebagai **File**, bukan Foto

## Mencoba bot di komputer (opsional)

```bash
npm run bot        # mode polling, mematikan webhook sementara
npm run bot:setup  # kembalikan ke webhook Vercel setelah selesai mencoba
```

## Struktur penting

```
src/content/site.json        ← semua konten website (diubah oleh bot)
src/assets/                  ← foto & logo
src/data/schema.ts           ← daftar kolom yang bisa diubah bot + validasi
src/pages/api/telegram.ts    ← webhook bot (Vercel Function)
bot/                         ← logika bot Telegram
scripts/setup-bot.ts         ← daftarkan webhook & menu perintah
.github/workflows/           ← kabar deploy ke grup Telegram
```

`overrides.vite` di `package.json` sengaja mengunci Vite 7 agar `@tailwindcss/vite` cocok dengan Astro 6.
