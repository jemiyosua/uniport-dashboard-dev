// Fungsi serverless Vercel: GET /admin (rewrite di vercel.json) → halaman tautan keempat portal.
// Dilindungi HTTP Basic Auth: pengguna bebas, kata sandi = Environment Variable ADMIN_SANDI.
// Halaman ini membuka semua portal (termasuk Direksi), jadi tanpa ADMIN_SANDI endpoint ini menolak semua.
import { createHash, timingSafeEqual } from 'node:crypto';
import { halamanAkses } from '../../tools/halaman-akses.mjs';
import { ambilKunci, buatTautan, CONTOH_PORTAL } from '../../tools/lib-akses.mjs';

const sidik = (s) => createHash('sha256').update(String(s)).digest();

/** Kata sandi dari header `Authorization: Basic …` cocok dengan ADMIN_SANDI (perbandingan waktu-konstan). */
function sandiCocok(header, sandi) {
  const m = /^Basic\s+(.+)$/i.exec(header || '');
  if (!m) return false;
  const isi = Buffer.from(m[1], 'base64').toString('utf8');
  return timingSafeEqual(sidik(isi.slice(isi.indexOf(':') + 1)), sidik(sandi));
}

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const teks = (kode, pesan) => { res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.status(kode).send(pesan); };

  const sandi = process.env.ADMIN_SANDI;
  if (!sandi) return teks(503, 'Halaman admin belum dikonfigurasi (ADMIN_SANDI kosong).');
  if (!sandiCocok(req.headers.authorization, sandi)) {
    console.warn(`[admin] kata sandi salah/kosong dari ${req.headers['x-forwarded-for'] ?? 'tidak diketahui'}`);
    res.setHeader('WWW-Authenticate', 'Basic realm="Uniport Admin", charset="UTF-8"');
    return teks(401, 'Masukkan kata sandi admin.');
  }

  let kunci;
  try { kunci = ambilKunci(); } catch (e) {
    console.error(`[admin] ${e.message}`);
    return teks(503, 'Layanan akses belum dikonfigurasi (AKSES_KUNCI kosong atau salah format).');
  }

  const dasar = process.env.PORTAL_URL || `https://${req.headers['x-forwarded-host'] || req.headers.host}/`;
  const daftar = CONTOH_PORTAL.map((c) => ({ ...c, url: buatTautan(c.peran, c.unitId, 0, dasar, kunci) }));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.status(200).send(halamanAkses(daftar, null));
}
