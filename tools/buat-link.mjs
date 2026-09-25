// Membuat tautan portal terenkripsi.
//   npm run link                         → tautan contoh untuk keempat portal + halaman akses-portal.html
//   npm run link -- <peran> <unitId> [hari] [urlDasar]    (hari 0/kosong = berlaku selamanya)
// Contoh: npm run link -- pemimpin-wilayah KW2 7
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { halamanAkses } from './halaman-akses.mjs';
import { ambilKunci, buatTautan, CONTOH_PORTAL, PERAN_SAH } from './lib-akses.mjs';

const kunci = ambilKunci();
const [peran, unitId, hari = '0', dasar = process.env.PORTAL_URL || 'http://127.0.0.1:5175/'] = process.argv.slice(2);

if (peran) {
  if (!PERAN_SAH.includes(peran) || !unitId) {
    console.error(`Peran harus salah satu dari: ${PERAN_SAH.join(', ')}, dan unitId wajib diisi.`);
    process.exit(1);
  }
  console.log(buatTautan(peran, unitId, hari, dasar, kunci));
} else {
  const daftar = CONTOH_PORTAL.map((c) => ({ ...c, url: buatTautan(c.peran, c.unitId, hari, dasar, kunci) }));
  for (const c of daftar) console.log(`\n${c.label} (${c.ket})\n${c.url}`);
  console.log(Number(hari) > 0 ? `\nBerlaku ${hari} hari.` : '\nBerlaku selamanya (dicabut dengan mengganti AKSES_KUNCI).');

  // Halaman lokal untuk membuka/menyalin keempat tautan (tidak ikut git, lihat .gitignore).
  const berkas = fileURLToPath(new URL('../akses-portal.html', import.meta.url));
  writeFileSync(berkas, halamanAkses(daftar), { mode: 0o600 });
  console.log(`Halaman tautan: ${berkas}`);
}
