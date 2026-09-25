// Layanan API akses portal (contoh acuan untuk tim TI) — tanpa dependensi.
//   POST /api/akses/dekrip   body: { "token": "<token dari tautan>" }  (lihat layaniDekrip)
//
// Jalankan: npm run api   (port dari AKSES_PORT, bawaan 8787)
// Saat `npm run dev` / `npm run preview` endpoint yang sama sudah dilayani dev server Vite
// (lihat vite.config.ts), jadi layanan ini hanya perlu untuk build yang dibuka dari server lain.
import { createServer } from 'node:http';
import { ambilKunci, layaniDekrip, muatEnv } from './lib-akses.mjs';

muatEnv();
const kunci = ambilKunci();
const PORT = Number(process.env.AKSES_PORT || 8787);
// Asal yang boleh memanggil API (untuk build yang dibuka dari domain lain). Kosong = hanya lewat proxy.
const ASAL = (process.env.AKSES_ASAL_DIIZINKAN || '').split(',').map((s) => s.trim()).filter(Boolean);

createServer((req, res) => {
  if (req.url !== '/api/akses/dekrip') {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ galat: 'tidak ditemukan' }));
  }
  layaniDekrip(req, res, kunci, ASAL);
}).listen(PORT, () => console.log(`API akses portal berjalan di http://localhost:${PORT}/api/akses/dekrip`));
