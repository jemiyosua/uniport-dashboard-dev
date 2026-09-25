import { useMemo } from 'react';
import { DataTable, type Kolom } from '../../components/DataTable';
import { TAHUN_LALU } from '../../config/dashboard';
import { Ikon } from '../../components/Ikon';
import { Bagian, ChipDelta, Kartu, KepalaKartu, Progres } from '../../components/Kartu';
import { labelPeriode, periodePenuh, type BarisKinerja, type Cakupan } from '../../logika/agregasi';
import type { Dasbor } from '../../logika/dasbor';
import { delta, persen, rp } from '../../logika/format';

type BarisPeringkat = BarisKinerja & { peringkat: number };
const angka = (n: number) => (isFinite(n) ? n : null);

export function Kinerja({ d, onBuka, onEksporPosisi }: { d: Dasbor; onBuka: (c: Cakupan) => void; onEksporPosisi: () => void }) {
  // Peringkat tetap = urutan NWP periode; tabel bisa diurutkan ulang per kolom.
  const baris = useMemo<BarisPeringkat[]>(() => d.anak.map((b, i) => ({ ...b, peringkat: i + 1 })), [d.anak]);
  const kolom: Kolom<BarisPeringkat>[] = [
    { kunci: 'peringkat', judul: '#', isi: (b) => <span className="teks-redup">{b.peringkat}</span>, nilai: (b) => b.peringkat },
    { kunci: 'unit', judul: 'Unit', nilai: (b) => b.nama, isi: (b) => <button type="button" className="tautan" onClick={() => onBuka(b.unit)}>{b.nama}</button> },
    { kunci: 'nwp', judul: `NWP ${labelPeriode(d.periode).replace(/ \d{4}$/, '')}`, isi: (b) => rp(b.prod.nwp26), nilai: (b) => b.prod.nwp26, kanan: true },
    {
      kunci: 'capaian', judul: 'Capaian berjalan', kanan: true, nilai: (b) => angka(b.prod.capaianBerjalan),
      isi: (b) => <div className="sel-progres kanan"><Progres nilai={b.prod.capaianBerjalan} label={`Capaian ${persen(b.prod.capaianBerjalan, 0)}`} /><strong>{persen(b.prod.capaianBerjalan, 0)}</strong></div>,
    },
    { kunci: 'laju', judul: `Laju vs ${TAHUN_LALU}`, kanan: true, nilai: (b) => angka(b.prod.pertumbuhanLaju), isi: (b) => <ChipDelta nilai={b.prod.pertumbuhanLaju} teks={delta(b.prod.pertumbuhanLaju)} /> },
    { kunci: 'profit', judul: 'Profit', kanan: true, isi: (b) => rp(b.prod.profit), nilai: (b) => b.prod.profit },
  ];
  const kel = d.prod.perKelompok;

  return (
    <Bagian id="kinerja" judul="Kinerja">
      <div className="tumpuk">
        <Kartu>
          <KepalaKartu
            ikon="chart" judul={d.labelAnak ? `Peringkat ${d.labelAnak}` : 'Peringkat unit'} sub="Klik nama untuk turun satu tingkat."
            aksi={baris.length > 0 && <button type="button" className="tombol kecil sekunder" onClick={onEksporPosisi}><Ikon nama="download" ukuran={16} /> CSV</button>}
          />
          {baris.length === 0 ? (
            <p className="kosong-isi">
              Tidak ada unit di bawah {d.nama} untuk diperingkat. Pilih cabang atau wilayah di filter untuk membandingkan unit.
            </p>
          ) : (
            <DataTable
              data={baris} kolom={kolom} kunciBaris={(b) => b.unit.id} urutAwal={{ kunci: 'peringkat', arah: 'naik' }}
              placeholderCari={`Cari ${d.labelAnak.toLowerCase()}…`}
            />
          )}
        </Kartu>
        <Kartu className="kartu-banding">
          <div>
          <KepalaKartu ikon="trend" judul="Tahun berjalan vs tahun lalu" sub="Rata-rata per bulan, bukan total mentah." />
          <div className="banding">
            {(['Direct', 'Captive'] as const).map((k) => {
              const g = kel[k].laju25 > 0 ? kel[k].laju26 / kel[k].laju25 - 1 : NaN;
              return (
                <div className="banding-baris" key={k}>
                  <span className="ubin-kepala"><i className="titik" style={{ background: k === 'Direct' ? 'var(--seri-1)' : 'var(--seri-2)' }} />{k}</span>
                  <div className="banding-angka">
                    <span><small className="teks-redup">{TAHUN_LALU}</small>{rp(kel[k].laju25)}</span>
                    <span><small className="teks-redup">2026</small><b>{rp(kel[k].laju26)}</b></span>
                    <ChipDelta nilai={g} teks={delta(g)} />
                  </div>
                </div>
              );
            })}
            <div className="banding-baris total">
              <span className="ubin-kepala">Total</span>
              <div className="banding-angka">
                <span><small className="teks-redup">{TAHUN_LALU}</small>{rp(d.prod.laju25)}</span>
                <span><small className="teks-redup">2026</small><b>{rp(d.prod.laju26)}</b></span>
                <ChipDelta nilai={d.prod.pertumbuhanLaju} teks={delta(d.prod.pertumbuhanLaju)} />
              </div>
            </div>
          </div>
          <p className="catatan">
            {periodePenuh(d.periode) ? <>
              Berkas 2025 mencakup 12 bulan, 2026 baru 7 bulan. Total mentah akan tampak turun{' '}
              {delta(d.prod.nwp26 / d.prod.nwp25 - 1)}; laju per bulan menunjukkan {delta(d.prod.pertumbuhanLaju)}.
            </> : <>Laju 2026 = rata-rata per bulan {labelPeriode(d.periode)}; pembanding = rata-rata 12 bulan 2025.</>}
          </p>
          </div>
          <div>
          <KepalaKartu ikon="layers" judul="Sub-channel" sub={`NWP ${labelPeriode(d.periode)}`} />
          <ul className="daftar-sub">
            {d.prod.perSubKanal.map((s) => (
              <li key={s.nama}><span>{s.nama}</span><b>{rp(s.nwp26)}</b></li>
            ))}
          </ul>
          </div>
        </Kartu>
      </div>
    </Bagian>
  );
}
