import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Ikon } from './Ikon';

export interface Kolom<T> {
  kunci: string;
  judul: string;
  /** Isi sel yang ditampilkan. */
  isi: (b: T) => ReactNode;
  /** Nilai mentah untuk urut, cari, dan filter. Tanpa ini kolom tidak bisa diurutkan/dicari. */
  nilai?: (b: T) => string | number | null | undefined;
  kanan?: boolean;
  /** false = judul kolom tidak bisa diklik untuk mengurutkan. */
  urut?: boolean;
  /** true = tampilkan dropdown filter berisi nilai unik kolom ini (untuk kolom kategori). */
  saring?: boolean;
  /** Teks sel dipotong/wrap: 'bungkus' = boleh turun baris (kolom teks panjang). */
  bungkus?: boolean;
}

type Arah = 'naik' | 'turun';
const UKURAN = [10, 25, 50, 100];
const pembanding = new Intl.Collator('id', { numeric: true, sensitivity: 'base' });

/**
 * Tabel data dengan pencarian, filter per kolom, urut per kolom, dan paging — seluruhnya di sisi
 * browser. Dipakai untuk semua tabel dashboard supaya perilakunya seragam.
 */
export function DataTable<T>({
  data, kolom, kunciBaris, urutAwal, ukuranAwal = 10, pesanKosong = 'Tidak ada data.', placeholderCari = 'Cari…',
  tanpaCari = false,
}: {
  data: T[]; kolom: Kolom<T>[]; kunciBaris: (b: T) => string;
  urutAwal?: { kunci: string; arah: Arah }; ukuranAwal?: number; pesanKosong?: string; placeholderCari?: string;
  /** Sembunyikan kolom cari (mis. tabel referensi yang sangat pendek). */
  tanpaCari?: boolean;
}) {
  const [q, setQ] = useState('');
  const [saringan, setSaringan] = useState<Record<string, string>>({});
  const [urut, setUrut] = useState(urutAwal);
  const [halaman, setHalaman] = useState(1);
  const [ukuran, setUkuran] = useState(ukuranAwal);

  // Kembali ke halaman 1 setiap kali isi tabel atau kriterianya berubah.
  useEffect(() => { setHalaman(1); }, [data, q, saringan, ukuran]);

  const kolomSaring = kolom.filter((k) => k.saring && k.nilai);
  const pilihanSaring = useMemo(() => Object.fromEntries(kolomSaring.map((k) => [
    k.kunci, [...new Set(data.map((b) => String(k.nilai!(b) ?? '')).filter(Boolean))].sort(pembanding.compare),
  ])), [data, kolom]);

  const hasil = useMemo(() => {
    const kata = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const dapatDicari = kolom.filter((k) => k.nilai);
    let baris = data.filter((b) => {
      for (const [kunci, v] of Object.entries(saringan)) {
        if (!v) continue;
        const k = kolom.find((x) => x.kunci === kunci);
        if (k?.nilai && String(k.nilai(b) ?? '') !== v) return false;
      }
      if (!kata.length) return true;
      const teks = dapatDicari.map((k) => String(k.nilai!(b) ?? '')).join(' ').toLowerCase();
      return kata.every((w) => teks.includes(w));
    });
    const k = urut && kolom.find((x) => x.kunci === urut.kunci);
    if (k?.nilai) {
      const arah = urut!.arah === 'naik' ? 1 : -1;
      baris = [...baris].sort((a, b) => {
        const va = k.nilai!(a), vb = k.nilai!(b);
        if (va == null || va === '') return 1;           // kosong selalu di bawah
        if (vb == null || vb === '') return -1;
        return (typeof va === 'number' && typeof vb === 'number' ? va - vb : pembanding.compare(String(va), String(vb))) * arah;
      });
    }
    return baris;
  }, [data, kolom, q, saringan, urut]);

  const jumlahHalaman = Math.max(1, Math.ceil(hasil.length / ukuran));
  const hal = Math.min(halaman, jumlahHalaman);
  const awal = (hal - 1) * ukuran;
  const tampil = hasil.slice(awal, awal + ukuran);
  const adaKriteria = q.trim() !== '' || Object.values(saringan).some(Boolean);

  const klikJudul = (k: Kolom<T>) => {
    if (!k.nilai || k.urut === false) return;
    // Klik pertama: angka besar→kecil, teks A→Z; klik berikutnya membalik arah.
    setUrut((u) => u?.kunci === k.kunci
      ? { kunci: k.kunci, arah: u.arah === 'naik' ? 'turun' : 'naik' }
      : { kunci: k.kunci, arah: data.length && typeof k.nilai!(data[0]) === 'number' ? 'turun' : 'naik' });
  };

  return (
    <div className="datatable">
      {(!tanpaCari || kolomSaring.length > 0) && (
        <div className="dt-alat">
          {!tanpaCari && (
            <label className="dt-cari">
              <Ikon nama="search" ukuran={16} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholderCari} aria-label="Cari di tabel" />
              {q && <button type="button" onClick={() => setQ('')} aria-label="Hapus pencarian"><Ikon nama="x" ukuran={14} /></button>}
            </label>
          )}
          {kolomSaring.map((k) => (
            <label key={k.kunci} className="dt-saring">
              <span className="sr-only">Filter {k.judul}</span>
              <select value={saringan[k.kunci] ?? ''} onChange={(e) => setSaringan((s) => ({ ...s, [k.kunci]: e.target.value }))}>
                <option value="">Semua {k.judul.toLowerCase()}</option>
                {pilihanSaring[k.kunci].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          ))}
          {adaKriteria && (
            <button type="button" className="tombol kecil sekunder" onClick={() => { setQ(''); setSaringan({}); }}>
              <Ikon nama="x" ukuran={14} /> Hapus filter
            </button>
          )}
        </div>
      )}

      <div className="tabel-bungkus">
        <table className="tabel">
          <thead>
            <tr>
              {kolom.map((k) => {
                const bisaUrut = !!k.nilai && k.urut !== false;
                const aktif = urut?.kunci === k.kunci;
                return (
                  <th key={k.kunci} className={k.kanan ? 'kanan' : undefined}
                    aria-sort={aktif ? (urut!.arah === 'naik' ? 'ascending' : 'descending') : undefined}>
                    {bisaUrut ? (
                      <button type="button" className={`urut ${aktif ? 'aktif' : ''}`} onClick={() => klikJudul(k)}>
                        {k.judul}
                        <Ikon nama={aktif ? (urut!.arah === 'naik' ? 'arrowUp' : 'arrowDown') : 'chevronDown'} ukuran={14} className={aktif ? '' : 'dt-ikon-pasif'} />
                      </button>
                    ) : k.judul}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {tampil.map((b) => (
              <tr key={kunciBaris(b)}>
                {kolom.map((k) => (
                  <td key={k.kunci} className={[k.kanan && 'kanan', k.bungkus && 'bungkus'].filter(Boolean).join(' ') || undefined}>{k.isi(b)}</td>
                ))}
              </tr>
            ))}
            {tampil.length === 0 && (
              <tr><td colSpan={kolom.length} className="dt-kosong">{adaKriteria ? 'Tidak ada baris yang cocok dengan pencarian/filter.' : pesanKosong}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {hasil.length > 0 && (
        <div className="dt-kaki">
          <span className="teks-redup">
            Menampilkan {awal + 1}–{Math.min(awal + ukuran, hasil.length)} dari {hasil.length.toLocaleString('id-ID')}
            {adaKriteria && ` (disaring dari ${data.length.toLocaleString('id-ID')})`}
          </span>
          <label className="dt-ukuran">
            <span className="teks-redup">Baris</span>
            <select value={ukuran} onChange={(e) => setUkuran(Number(e.target.value))} aria-label="Baris per halaman">
              {UKURAN.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          {jumlahHalaman > 1 && (
            <nav className="dt-halaman" aria-label="Halaman tabel">
              <button type="button" onClick={() => setHalaman(hal - 1)} disabled={hal === 1} aria-label="Halaman sebelumnya"><Ikon nama="chevronsLeft" ukuran={14} /></button>
              {nomorHalaman(hal, jumlahHalaman).map((n, i) => n === 0
                ? <span key={`e${i}`} className="dt-elipsis">…</span>
                : <button type="button" key={n} onClick={() => setHalaman(n)} className={n === hal ? 'aktif' : ''} aria-current={n === hal ? 'page' : undefined}>{n}</button>)}
              <button type="button" onClick={() => setHalaman(hal + 1)} disabled={hal === jumlahHalaman} aria-label="Halaman berikutnya"><Ikon nama="chevronsLeft" ukuran={14} className="putar" /></button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}

/** Nomor halaman ringkas: 1 … 4 5 [6] 7 8 … 20 (0 = elipsis). */
function nomorHalaman(kini: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, kini - 1, kini, kini + 1]);
  if (kini <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (kini >= total - 2) [total - 3, total - 2, total - 1].forEach((n) => set.add(n));
  const urut = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const hasil: number[] = [];
  urut.forEach((n, i) => { if (i && n - urut[i - 1] > 1) hasil.push(0); hasil.push(n); });
  return hasil;
}
