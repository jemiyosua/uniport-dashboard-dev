import { TANGGAL_ACUAN } from '../../config/dashboard';
import { DataTable, type Kolom } from '../../components/DataTable';
import { Ikon } from '../../components/Ikon';
import { Bagian, Kartu, KepalaKartu, PilStatus } from '../../components/Kartu';
import type { BarisRenewal } from '../../logika/agregasi';
import type { Dasbor } from '../../logika/dasbor';
import { bilangan, tanggalIso } from '../../logika/format';

const hariAcuan = (() => { const d = new Date(TANGGAL_ACUAN); d.setHours(0, 0, 0, 0); return d.getTime(); })();
/** Selisih hari dari tanggal acuan; negatif = sudah lewat. */
export const selisihHari = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - hariAcuan) / 86400000);
};
const selesai = (r: BarisRenewal) => r.status === 'Berhasil Renewal' || r.status === 'Tidak Renewal';

/** Polis belum selesai yang habis ≤ 30 hari lagi (atau sudah lewat) — dipakai lencana menu. */
export const renewalMendesak = (d: Dasbor) => d.renewal.filter((r) => !selesai(r) && selisihHari(r.akhir) <= 30).length;

function sisaMasa(r: BarisRenewal) {
  const n = selisihHari(r.akhir);
  if (selesai(r)) return null;
  if (n < 0) return <small className="teks-turun">lewat {-n} hari</small>;
  if (n <= 30) return <small className="teks-waspada">{n === 0 ? 'hari ini' : `${n} hari lagi`}</small>;
  return <small className="teks-redup">{n} hari lagi</small>;
}

function nextFu(iso: string | null) {
  if (!iso) return <span className="teks-redup">–</span>;
  const n = selisihHari(iso);
  if (n < 0) return <span className="teks-turun"><Ikon nama="clock" ukuran={14} /> {tanggalIso(iso)}</span>;
  if (n === 0) return <span className="teks-waspada">Hari ini</span>;
  return tanggalIso(iso);
}

const KOLOM: Kolom<BarisRenewal>[] = [
  { kunci: 'status', judul: 'Status', nilai: (r) => r.status, isi: (r) => <PilStatus status={r.status} />, saring: true },
  { kunci: 'nasabah', judul: 'Nasabah', nilai: (r) => r.nasabahId, isi: (r) => <span className="mono" title="ID tersamar — nama nasabah tidak ditampilkan (Aturan Emas)">{r.nasabahId}</span> },
  { kunci: 'sumber', judul: 'Sumber bisnis', nilai: (r) => r.subKanal, isi: (r) => r.subKanal, saring: true },
  { kunci: 'polis', judul: 'Nomor polis', nilai: (r) => r.noPolis, isi: (r) => <span className="mono">{r.noPolis}</span> },
  { kunci: 'awal', judul: 'Periode awal', nilai: (r) => r.awal, isi: (r) => tanggalIso(r.awal) },
  { kunci: 'akhir', judul: 'Periode akhir', nilai: (r) => r.akhir, isi: (r) => <span className="sel-dua">{tanggalIso(r.akhir)}{sisaMasa(r)}</span> },
  { kunci: 'cabang', judul: 'Cabang', nilai: (r) => r.cabangNama, isi: (r) => r.cabangNama, saring: true },
  { kunci: 'bisnis', judul: 'Bisnis', nilai: (r) => r.bisnis, isi: (r) => r.bisnis, saring: true },
  { kunci: 'fu', judul: 'Next FU', nilai: (r) => r.nextFu, isi: (r) => nextFu(r.nextFu) },
];

export function RenewalPolis({ d }: { d: Dasbor }) {
  const mendesak = renewalMendesak(d);
  return (
    <Bagian id="renewal" judul="Renewal" sub="Polis yang habis masa berlakunya dalam 30 hari terakhir s.d. 90 hari ke depan, beserta jadwal follow up berikutnya.">
      <Kartu>
        <KepalaKartu
          ikon="refresh" judul={`${bilangan(d.renewal.length)} polis`}
          sub={<>{bilangan(mendesak)} belum selesai dan habis ≤ 30 hari · nasabah ditampilkan sebagai ID tersamar (Aturan Emas) · <strong>data simulasi</strong>, sumber renewal belum tersambung</>}
        />
        <DataTable
          data={d.renewal} kolom={KOLOM} kunciBaris={(r) => r.id} urutAwal={{ kunci: 'akhir', arah: 'naik' }}
          placeholderCari="Cari nomor polis, ID nasabah, cabang…" pesanKosong="Tidak ada polis renewal pada cakupan & filter ini."
        />
      </Kartu>
    </Bagian>
  );
}
