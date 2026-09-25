// Hak akses per peran — satu-satunya tempat aturan ini ditulis.
//
// Peran & unit datang dari tautan akses (hasil decrypt API), jadi tidak bisa diganti dari tampilan.
// Cakupan DATA (unit mana yang boleh dibuka) diatur `dalamAkar` di agregasi.ts; berkas ini mengatur
// HALAMAN dan FITUR yang tersedia. Keduanya baru ditegakkan di tampilan — lihat catatan di README.
import type { Peran } from './agregasi';

export type Halaman =
  | 'ringkasan' | 'tindakan' | 'renewal' | 'proyeksi' | 'kinerja' | 'ritme'
  | 'insight' | 'orang-kunci' | 'ditanyakan' | 'detail';

export interface Izin {
  halaman: readonly Halaman[];
  /** Cari cabang/MO di header (⌘K). */
  cari: boolean;
  /** Ekspor CSV posisi unit di bawah cakupan (peringkat cabang/MO). */
  eksporPosisi: boolean;
}

const SEMUA: readonly Halaman[] = [
  'ringkasan', 'tindakan', 'renewal', 'proyeksi', 'kinerja', 'ritme', 'insight', 'orang-kunci', 'ditanyakan', 'detail',
];

export const IZIN: Record<Peran, Izin> = {
  // Nasional: seluruh Kantor Wilayah, cabang, dan MO.
  direksi: { halaman: SEMUA, cari: true, eksporPosisi: true },
  // Cabang & MO di wilayahnya.
  'pemimpin-wilayah': { halaman: SEMUA, cari: true, eksporPosisi: true },
  // MO di cabangnya.
  'pimpinan-cabang': { halaman: SEMUA, cari: true, eksporPosisi: true },
  // Hanya data sendiri. Halaman peringkat & yang menyebut rekan kerja (Kinerja, Orang Kunci,
  // Perlu Ditanyakan) serta olahan tingkat pimpinan (Proyeksi, AI Insight) tidak tersedia.
  'marketing-officer': {
    halaman: ['ringkasan', 'tindakan', 'renewal', 'ritme', 'detail'],
    cari: false, eksporPosisi: false,
  },
};

export const bolehHalaman = (peran: Peran, id: string): id is Halaman =>
  (IZIN[peran].halaman as readonly string[]).includes(id);
