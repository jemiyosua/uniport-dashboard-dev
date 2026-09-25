# Uniport Executive Dashboard (React + Vite + TypeScript)

Prototipe peragaan dashboard eksekutif Asuransi Sinar Mas berdasarkan PRD "Uniport Executive Dashboard".
Hasil build berupa **satu berkas HTML mandiri** (`dist/index.html`) yang bisa dibuka lewat `file://` tanpa server atau internet.

```bash
npm install
npm run dev        # server pengembangan + HMR
npm run build      # typecheck + dist/index.html (semua JS/CSS di-inline)
npm run typecheck
```

## Akses portal lewat tautan terenkripsi

Tidak ada login/logout. Setiap pengguna membuka portal lewat tautan `…/?akses=<token>`. Frontend mengirim token ke
API (`POST /api/akses/dekrip`), dan API men-decrypt token itu (AES-256-GCM, kunci `AKSES_KUNCI` di `.env`, **hanya di
server**) menjadi `{ peran, unitId }`. Token yang diubah, palsu, atau kedaluwarsa ditolak dengan 401.

```bash
cp .env.example .env && npm run kunci   # salin baris AKSES_KUNCI=… ke .env
npm run dev                             # dev server sekaligus melayani /api/akses/dekrip
npm run link                            # tautan contoh untuk keempat portal
npm run link -- pemimpin-wilayah KW2 7  # tautan untuk unit tertentu, berlaku 7 hari
```

Saat `npm run dev`, halaman tanpa tautan menampilkan tombol peragaan untuk keempat portal (hanya di dev server,
tidak ikut ke build). `VITE_AKSES_TAUTAN=mati` membuka URL langsung sebagai portal Direksi, khusus pengembangan.

| Portal | `unitId` | Data yang bisa dibuka | Menu | Cari (⌘K) | Ekspor posisi |
| --- | --- | --- | --- | --- | --- |
| Direksi | `NAS` | Semua Kantor Wilayah, cabang, dan MO | Semua | Ya | Ya |
| Pemimpin Wilayah | `KW1`… | Cabang dan MO di wilayahnya | Semua | Ya | Ya |
| Pimpinan Cabang | `KW3-C04`… | MO di cabangnya | Semua | Ya | Ya |
| Marketing Officer | `MO0561`… | Data miliknya sendiri | Dashboard, Perlu Tindakan, Renewal, Ritme Kerja, Detail | Tidak | Tidak |

Cakupan data diatur `dalamAkar` (`src/logika/agregasi.ts`); menu dan fitur per peran diatur `src/logika/izin.ts`.
Untuk build yang dibuka dari server lain, `npm run api` menjalankan layanan dekrip yang sama di `:8787`
(`tools/api-akses.mjs`, contoh acuan untuk tim TI). Seluruh data contoh masih ikut di dalam bundle browser, jadi
hierarki di atas baru ditegakkan di tampilan. Agar benar-benar aman, API produksi harus mengembalikan **hanya data dalam
cakupan** hasil decrypt, bukan sekadar peran.

## API backend Go (Matrix)

Frontend memanggil backend Go lewat `/api-go/…`. Dev server meneruskannya ke `URL_GO` di `.env`, karena backend tidak
mengirim header CORS. Alamat server internal pun tidak ikut tertulis di kode browser. Untuk build produksi, reverse proxy
harus menyediakan jalur `/api-go` yang sama, atau set `VITE_API_GO` ke alamat yang mengizinkan CORS.

| Endpoint | Method | Dipakai untuk |
| --- | --- | --- |
| `matrix/kanwils` | GET | Pilihan filter Pemimpin Wilayah (portal Direksi). Kalau tidak terjangkau, dipakai daftar lokal. |
| `matrix/branches` | POST, body `{"kanwil": "<value>"}` | Pilihan filter Pimpinan Cabang. `value` diambil dari pilihan filter wilayah (`kanwils`). Kalau tidak terjangkau, dipakai daftar lokal. |
| `matrix/marketings` | POST, body `{"branch": "<value>"}` | Pilihan filter Marketing Officer. `value` diambil dari pilihan filter cabang (`branches`). Cabang tanpa MO mengembalikan `[]`. |

Ketiga endpoint mengembalikan `{ success, data: [{ value, label }] }`.

Klien ada di `src/api/matrix.ts`.

**Data dummy (bawaan):** daftar wilayah, cabang, serta MO diambil dari `src/data/dummy.ts` tanpa memanggil backend.
Untuk memakai API asli, isi `VITE_SUMBER_DATA=api` di `.env`. File itu dibangkitkan dari data contoh dengan `npm run dummy`, sehingga nama
cabang dan MO cocok dengan angka dashboard.

## Data: CONTOH, bukan asli

Repo ini belum memuat ekspor eReport, HCQ, eTarget, atau Matrix Distribution. `src/data/sumber.ts` membangkitkan
rincian cabang, MO, prospek, dan effort dengan PRNG ber-seed, jadi angkanya sama setiap kali dimuat. Hanya total nasional
yang dijangkarkan ke angka PRD (NWP 2025 Rp 583,0 M, Jan–Jul 2026 Rp 298,8 M, target Rp 740,0 M). Cabang dan MO
memakai kode (`Cabang 1.01`, `MO-0001`), bukan nama asli. Nama nasabah dan prospek tidak ada di model data (Aturan Emas).
Untuk memakai data asli, ganti `bangkitkanData()` dengan pemuat yang mengembalikan bentuk `SumberData` yang sama.

## Struktur

| Lokasi | Isi |
| --- | --- |
| `src/config/dashboard.ts` | Ambang, bobot, SLA, dan periode. Ikut ter-inline ke HTML, jadi jangan simpan rahasia di sini |
| `src/data/sumber.ts` | Model data + generator data contoh |
| `src/logika/` | Agregasi per cakupan/peran, prioritas, proyeksi, AI Insight berbasis aturan (bukan LLM), dan ekspor CSV |
| `src/components/` | Sidebar, Topbar, Kartu, ikon, dan grafik SVG buatan sendiri (tanpa pustaka chart) |
| `src/pages/` | Susunan lengkap untuk pimpinan dan susunan ringkas untuk Marketing Officer |

