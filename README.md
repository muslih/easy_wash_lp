# Easywash — Astro + Bot Telegram

Website Easywash (Astro 6 + Tailwind CSS 4, mobile friendly). Isi website (paket, harga,
teks, nomor WhatsApp, alamat, foto, logo) bisa diatur oleh **admin grup Telegram Easywash**
lewat bot, tanpa menyentuh kode.

## Cara kerjanya

```
Admin di grup Telegram ──► Bot (Netlify Function) ──► commit ke GitHub (src/content/site.json + foto)
                                                              │
Grup Telegram ◄── "✅ Website sudah diperbarui" ◄── Netlify build ulang otomatis (±1–2 menit)
```

- Semua konten ada di **`src/content/site.json`** (bisa juga diedit manual).
- Foto/logo yang dikirim lewat bot disimpan di `src/assets/`.
- Hanya **admin grup** yang bisa mengubah. Anggota biasa ditolak.
- Bot bisa dipakai di grup atau di chat pribadi (asalkan kamu admin grup).

## Menjalankan website di komputer

Butuh Node.js 22 (minimal 22.12).

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # hasil statis di folder dist/
```

---

## Setup pertama kali (±15 menit)

### 1. Siapkan bot
1. Buka **@BotFather** → `/mybots` → pilih bot kamu → **API Token**. Simpan token ini (rahasia!).
2. Masukkan bot ke grup Easywash. Bot **tidak perlu** jadi admin.
3. Di grup, ketik `/id@nama_bot_kamu` untuk memastikan ID grup
   (seharusnya `-5330493853`; kalau grup sudah jadi supergroup, ID-nya diawali `-100…`).

### 2. Upload proyek ke GitHub
1. Buat repo baru (boleh private), lalu push isi folder ini.
2. Buat token: GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate:
   - Repository access: hanya repo website ini
   - Permissions → **Contents: Read and write**

### 3. Hubungkan ke Netlify
1. Netlify → **Add new site → Import from GitHub** → pilih repo.
   Pengaturan build otomatis terbaca dari `netlify.toml`.
   *Jika proyek ada di subfolder repo, isi **Base directory** dengan nama subfolder itu.*
2. **Site configuration → Environment variables**, isi (lihat `.env.example`):

   | Nama | Isi |
   |---|---|
   | `TELEGRAM_BOT_TOKEN` | token dari BotFather |
   | `TELEGRAM_GROUP_ID` | `-5330493853` |
   | `TELEGRAM_WEBHOOK_SECRET` | kode acak bebas, min. 16 karakter |
   | `GITHUB_TOKEN` | token GitHub dari langkah 2 |
   | `GITHUB_REPO` | `username/nama-repo` |
   | `GITHUB_BRANCH` | `main` |
   | `GITHUB_PROJECT_DIR` | kosong, atau nama subfolder jika proyek di subfolder |
   | `SITE_URL` | alamat website, mis. `https://easywash.netlify.app` |

3. Deploy ulang (Deploys → Trigger deploy) agar variabel terbaca.

### 4. Sambungkan bot ke website (sekali saja)
Di komputer, salin `.env.example` menjadi `.env`, isi nilainya sama dengan di Netlify, lalu:

```bash
npm install
npm run bot:setup
# ✅ @nama_bot terhubung ke https://easywash.netlify.app/api/telegram
```

Selesai! Ketik `/menu` di grup.

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

Setelah disimpan, website diperbarui dalam ±1–2 menit dan bot mengabari grup saat selesai.

## Mode tanpa Netlify Functions (opsional)

Untuk mencoba bot di komputer sendiri (mode polling), isi `.env` lalu:

```bash
npm run bot
```

Catatan: mode polling mematikan webhook. Jalankan `npm run bot:setup` lagi untuk kembali ke webhook Netlify.

## Struktur penting

```
src/content/site.json     ← semua konten website (diubah oleh bot)
src/assets/               ← foto & logo
src/data/schema.ts        ← daftar kolom yang bisa diubah bot + validasi
bot/                      ← kode bot Telegram
netlify/functions/        ← webhook bot + notifikasi deploy ke grup
scripts/setup-bot.ts      ← mendaftarkan webhook & menu perintah
```

`overrides.vite` di `package.json` sengaja mengunci Vite 7 agar `@tailwindcss/vite` cocok dengan Astro 6.
