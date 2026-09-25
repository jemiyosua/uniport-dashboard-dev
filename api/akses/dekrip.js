// Fungsi serverless Vercel: POST /api/akses/dekrip — padanan middleware dev server (vite.config.ts)
// dan tools/api-akses.mjs. Kunci dibaca dari Environment Variable AKSES_KUNCI di proyek Vercel.
import { ambilKunci, dekrip } from '../../tools/lib-akses.mjs';

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const kirim = (kode, isi) => res.status(kode).send(JSON.stringify(isi));

  if (req.method !== 'POST') return kirim(405, { galat: 'metode tidak diizinkan' });

  let kunci;
  try { kunci = ambilKunci(); } catch (e) {
    console.error(`[akses] ${e.message}`);
    return kirim(503, { galat: 'layanan akses belum dikonfigurasi' });
  }

  // Vercel sudah mem-parse body JSON; string tetap diterima untuk jaga-jaga.
  let token;
  try { token = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {}).token; } catch { token = undefined; }
  if (!token) return kirim(400, { galat: 'token wajib diisi' });

  try {
    kirim(200, dekrip(token, kunci));
  } catch (e) {
    // Alasan rinci hanya di log server; klien cukup tahu tautannya tidak berlaku.
    const t = String(token);
    console.warn(`[akses] ditolak: ${e.message} (panjang token ${t.length}, awal ${t.slice(0, 6)}…)`);
    kirim(401, { galat: 'tautan tidak valid atau sudah kedaluwarsa' });
  }
}
