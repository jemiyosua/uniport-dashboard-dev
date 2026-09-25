// Membangkitkan src/data/dummy.ts — data dummy pengganti API matrix (kanwils, branches, marketings).
// Isinya diturunkan dari data contoh (src/data/sumber.ts) supaya nama cabang & MO cocok dengan angka
// dashboard. Jalankan ulang bila data contoh berubah:  npm run dummy
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const keluar = join(tmpdir(), `uniport-sumber-${process.pid}.mjs`);
await build({ entryPoints: ['src/data/sumber.ts'], bundle: true, platform: 'node', format: 'esm', outfile: keluar, logLevel: 'warning' });
const { DATA } = await import(pathToFileURL(keluar).href);

const opsi = (value, label) => `{ value: ${JSON.stringify(value)}, label: ${JSON.stringify(label)} }`;
const kodeKanwil = (id) => id.replace(/^KW/, '');

// Kode cabang meniru format backend (6 digit, mulai 100001), urut per wilayah.
const kodeCabang = new Map(DATA.cabang.map((c, i) => [c.id, String(100001 + i)]));

let s = `// ─────────────────────────────────────────────────────────────────────────────
// DATA DUMMY — pengganti respons API backend Matrix (bawaan; VITE_SUMBER_DATA=api untuk API asli).
// Bentuknya sama persis dengan respons asli: { value, label }.
//
// DIBANGKITKAN OTOMATIS oleh tools/buat-dummy.mjs dari data contoh (src/data/sumber.ts),
// jadi nama cabang & MO cocok dengan angka di dashboard. Jangan diedit manual; jalankan
// \`npm run dummy\` bila data contoh berubah.
// Tidak memuat nama nasabah (Aturan Emas).
// ─────────────────────────────────────────────────────────────────────────────

export interface OpsiDummy { value: string; label: string }

/** GET matrix/kanwils */
export const DUMMY_KANWIL: OpsiDummy[] = [
${DATA.kanwil.map((k) => `  ${opsi(kodeKanwil(k.id), k.nama)},`).join('\n')}
];

/** POST matrix/branches, body { kanwil } → kunci = value wilayah. */
export const DUMMY_CABANG: Record<string, OpsiDummy[]> = {
${DATA.kanwil.map((k) => `  ${JSON.stringify(kodeKanwil(k.id))}: [\n${DATA.cabang.filter((c) => c.kanwilId === k.id).map((c) => `    ${opsi(kodeCabang.get(c.id), c.nama)},`).join('\n')}\n  ],`).join('\n')}
};

/** POST matrix/marketings, body { branch } → kunci = value cabang. */
export const DUMMY_MARKETING: Record<string, OpsiDummy[]> = {
${DATA.cabang.map((c) => `  ${JSON.stringify(kodeCabang.get(c.id))}: [${DATA.mo.filter((m) => m.cabangId === c.id).map((m) => opsi(m.id, m.kode)).join(', ')}],`).join('\n')}
};
`;
writeFileSync('src/data/dummy.ts', s);
console.log(`src/data/dummy.ts: ${DATA.kanwil.length} wilayah, ${DATA.cabang.length} cabang, ${DATA.mo.length} MO`);
