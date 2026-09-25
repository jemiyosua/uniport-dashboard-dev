// Membuat tautan portal terenkripsi.
//   npm run link                         → tautan contoh untuk keempat portal
//   npm run link -- <peran> <unitId> [hari] [urlDasar]
// Contoh: npm run link -- pemimpin-wilayah KW2 7
import { ambilKunci, buatTautan, CONTOH_PORTAL, PERAN_SAH } from './lib-akses.mjs';

const kunci = ambilKunci();
const [peran, unitId, hari = '30', dasar = process.env.PORTAL_URL || 'http://127.0.0.1:5175/'] = process.argv.slice(2);

if (peran) {
  if (!PERAN_SAH.includes(peran) || !unitId) {
    console.error(`Peran harus salah satu dari: ${PERAN_SAH.join(', ')}, dan unitId wajib diisi.`);
    process.exit(1);
  }
  console.log(buatTautan(peran, unitId, hari, dasar, kunci));
} else {
  for (const c of CONTOH_PORTAL) console.log(`\n${c.label} (${c.ket})\n${buatTautan(c.peran, c.unitId, hari, dasar, kunci)}`);
  console.log(`\nBerlaku ${hari} hari.`);
}
