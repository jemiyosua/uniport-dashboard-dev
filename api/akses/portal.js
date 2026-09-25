// Fungsi serverless Vercel: GET /admin (rewrite di vercel.json) → halaman tautan keempat portal.
// Terbuka tanpa kata sandi. Halaman ini membuka semua portal (termasuk Direksi) selamanya, jadi siapa pun
// yang tahu alamatnya bisa masuk.
import { halamanAkses } from '../../tools/halaman-akses.mjs';
import { ambilKunci, buatTautan, CONTOH_PORTAL } from '../../tools/lib-akses.mjs';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const teks = (kode, pesan) => { res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.status(kode).send(pesan); };

  let kunci;
  try { kunci = ambilKunci(); } catch (e) {
    console.error(`[admin] ${e.message}`);
    return teks(503, 'Layanan akses belum dikonfigurasi (AKSES_KUNCI kosong atau salah format).');
  }

  const dasar = process.env.PORTAL_URL || `https://${req.headers['x-forwarded-host'] || req.headers.host}/`;
  const daftar = CONTOH_PORTAL.map((c) => ({ ...c, url: buatTautan(c.peran, c.unitId, 0, dasar, kunci) }));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.status(200).send(halamanAkses(daftar));
}
