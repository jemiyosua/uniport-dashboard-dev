// Enkripsi/dekripsi token akses portal — HANYA untuk sisi server (Node).
// Jangan pernah di-import dari src/: kuncinya tidak boleh ikut ke browser.
//
// Format token: base64url( iv[12] | ciphertext | authTag[16] ), AES-256-GCM.
// Isi token (JSON): { p: peran, u: unitId, exp: detik-epoch }.
// GCM sekaligus menjamin keaslian: token yang diubah satu karakter pun gagal didekrip.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PERAN_SAH = ['direksi', 'pemimpin-wilayah', 'pimpinan-cabang', 'marketing-officer'];

/** Muat .env sederhana (Node 18 belum punya --env-file). Variabel yang sudah ada di environment menang. */
export function muatEnv() {
  const berkas = fileURLToPath(new URL('../.env', import.meta.url));
  if (!existsSync(berkas)) return;
  for (const baris of readFileSync(berkas, 'utf8').split(/\r?\n/)) {
    const m = baris.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

export function ambilKunci() {
  muatEnv();
  const k = process.env.AKSES_KUNCI;
  if (!k) throw new Error('AKSES_KUNCI belum diisi di .env — buat dengan: npm run kunci');
  const kunci = Buffer.from(k, 'base64url');
  if (kunci.length !== 32) throw new Error('AKSES_KUNCI harus 32 byte (base64url)');
  return kunci;
}

export function kunciBaru() {
  return randomBytes(32).toString('base64url');
}

export function enkrip(isi, kunci) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', kunci, iv);
  const data = Buffer.concat([c.update(JSON.stringify(isi), 'utf8'), c.final()]);
  return Buffer.concat([iv, data, c.getAuthTag()]).toString('base64url');
}

/** Mengembalikan { peran, unitId, exp } atau melempar Error bila token rusak/palsu/kedaluwarsa. */
export function dekrip(token, kunci) {
  const buf = Buffer.from(String(token), 'base64url');
  if (buf.length < 12 + 16 + 2) throw new Error('token rusak');
  const iv = buf.subarray(0, 12), tag = buf.subarray(buf.length - 16), data = buf.subarray(12, buf.length - 16);
  const d = createDecipheriv('aes-256-gcm', kunci, iv);
  d.setAuthTag(tag);
  const isi = JSON.parse(Buffer.concat([d.update(data), d.final()]).toString('utf8'));
  if (!PERAN_SAH.includes(isi.p) || typeof isi.u !== 'string') throw new Error('isi token tidak sah');
  if (typeof isi.exp !== 'number' || isi.exp * 1000 < Date.now()) throw new Error('token kedaluwarsa');
  return { peran: isi.p, unitId: isi.u, exp: isi.exp };
}

/**
 * Unit contoh per portal (lihat PERSONA di src/data/sumber.ts):
 * Nasional, Kantor Wilayah 1, Cabang Samarinda, Novita Lubis.
 */
export const CONTOH_PORTAL = [
  { label: 'Direksi', ket: 'Nasional', peran: 'direksi', unitId: 'NAS' },
  { label: 'Pemimpin Wilayah', ket: 'Kantor Wilayah 1', peran: 'pemimpin-wilayah', unitId: 'KW1' },
  { label: 'Pimpinan Cabang', ket: 'Cabang Samarinda', peran: 'pimpinan-cabang', unitId: 'KW3-C04' },
  { label: 'Marketing Officer', ket: 'Novita Lubis', peran: 'marketing-officer', unitId: 'MO0561' },
];

/** Tautan portal `<dasar>?akses=<token>` yang berlaku `hari` hari. */
export function buatTautan(peran, unitId, hari, dasar, kunci) {
  const token = enkrip({ p: peran, u: unitId, exp: Math.floor(Date.now() / 1000) + Number(hari) * 86400 }, kunci);
  const url = new URL(dasar);
  url.searchParams.set('akses', token);
  return url.toString();
}

/**
 * Penangan POST /api/akses/dekrip untuk server Node biasa maupun middleware dev server Vite.
 *   body: { "token": "<token dari tautan>" }
 *   200 → { "peran": "...", "unitId": "...", "exp": 1790000000 }
 *   401 → { "galat": "..." } bila token rusak, palsu, atau kedaluwarsa.
 * `asal` = daftar origin yang boleh memanggil langsung (CORS); kosong = hanya dari origin yang sama.
 */
export function layaniDekrip(req, res, kunci, asal = []) {
  const origin = req.headers.origin;
  const kirim = (kode, isi) => {
    const h = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
    if (origin && asal.includes(origin)) Object.assign(h, { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' });
    res.writeHead(kode, h);
    res.end(JSON.stringify(isi));
  };
  if (req.method === 'OPTIONS') {
    res.writeHead(204, asal.includes(origin) ? {
      'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin',
    } : {});
    return res.end();
  }
  if (req.method !== 'POST') return kirim(405, { galat: 'metode tidak diizinkan' });

  let isi = '';
  req.on('data', (c) => { isi += c; if (isi.length > 4096) req.destroy(); });
  req.on('end', () => {
    try {
      const { token } = JSON.parse(isi || '{}');
      if (!token) return kirim(400, { galat: 'token wajib diisi' });
      kirim(200, dekrip(token, kunci));
    } catch (e) {
      // Alasan rinci hanya di log server; klien cukup tahu tautannya tidak berlaku.
      const t = (() => { try { return String(JSON.parse(isi).token ?? ''); } catch { return ''; } })();
      console.warn(`[akses] ${new Date().toLocaleTimeString('id-ID')} ditolak: ${e.message} (panjang token ${t.length}, awal ${t.slice(0, 6)}…)`);
      kirim(401, { galat: 'tautan tidak valid atau sudah kedaluwarsa' });
    }
  });
}
