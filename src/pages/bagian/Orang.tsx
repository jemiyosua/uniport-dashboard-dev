import { AMBANG_CABANG_KONSENTRASI, AMBANG_MO_TURUN, BULAN_P26, PORSI_KONSENTRASI } from '../../config/dashboard';
import { DataTable } from '../../components/DataTable';
import { Ikon } from '../../components/Ikon';
import { Bagian, Kartu, KepalaKartu, Progres } from '../../components/Kartu';
import { jumlahBulan, labelPeriode, type Cakupan } from '../../logika/agregasi';
import type { Dasbor } from '../../logika/dasbor';
import { persen, rp } from '../../logika/format';

function Penegas() {
  return (
    <p className="penegas">
      <Ikon nama="info" ukuran={18} />
      <span><strong>Bahan percakapan, bukan penilaian kinerja.</strong> Produksi bisa turun atau terkonsentrasi karena alasan wajar — pindah peran, cuti, portofolio dialihkan.</span>
    </p>
  );
}

export function OrangKunci({ d, onBuka }: { d: Dasbor; onBuka: (c: Cakupan) => void }) {
  return (
    <Bagian id="orang-kunci" judul="Ketergantungan Orang Kunci" sub="Cabang mana yang berisiko kalau satu orang berhenti?">
      <Penegas />
      <Kartu>
        <KepalaKartu
          ikon="users" judul={`${d.konsentrasi.length} cabang bertumpu pada satu MO`}
          sub={`Porsi MO terbesar ≥ ${persen(PORSI_KONSENTRASI, 0)} · hanya cabang dengan produksi ≥ ${rp((AMBANG_CABANG_KONSENTRASI * jumlahBulan(d.periode)) / BULAN_P26)} dalam periode`}
        />
        {d.konsentrasi.length ? (
          <DataTable
            data={d.konsentrasi} kunciBaris={(k) => k.cabang.id} urutAwal={{ kunci: 'porsi', arah: 'turun' }}
            placeholderCari="Cari cabang atau MO…"
            kolom={[
              { kunci: 'cabang', judul: 'Cabang', nilai: (k) => k.cabang.nama, isi: (k) => <button type="button" className="tautan" onClick={() => onBuka({ tingkat: 'cabang', id: k.cabang.id })}>{k.cabang.nama}</button> },
              { kunci: 'mo', judul: 'MO terbesar', nilai: (k) => k.moTeratas.kode, isi: (k) => <button type="button" className="tautan" onClick={() => onBuka({ tingkat: 'mo', id: k.moTeratas.id })}>{k.moTeratas.kode}</button> },
              { kunci: 'nwp', judul: `Produksi ${labelPeriode(d.periode)}`, kanan: true, nilai: (k) => k.nwp26, isi: (k) => rp(k.nwp26) },
              { kunci: 'porsi', judul: 'Porsi MO terbesar', nilai: (k) => k.porsi, isi: (k) => <div className="sel-progres"><Progres nilai={k.porsi} label={`Porsi ${persen(k.porsi, 0)}`} /><strong>{persen(k.porsi, 0)}</strong></div> },
            ]}
          />
        ) : <p className="kosong-isi">Tidak ada cabang yang melewati ambang pada cakupan ini.</p>}
      </Kartu>
    </Bagian>
  );
}

export function PerluDitanyakan({ d, onBuka }: { d: Dasbor; onBuka: (c: Cakupan) => void }) {
  return (
    <Bagian id="ditanyakan" judul="Perlu Ditanyakan" sub="Siapa yang produksinya jatuh drastis dan perlu ditanyakan — bukan dinilai?">
      <Penegas />
      <Kartu>
        <KepalaKartu
          ikon="userQ" judul={`${d.ditanyakan.length} MO turun ke nol atau minus`}
          sub={`Tahun lalu di atas ${rp(AMBANG_MO_TURUN)}. MO yang baru bergabung tidak diikutkan.`}
        />
        {d.ditanyakan.length ? (
          <DataTable
            data={d.ditanyakan} kunciBaris={(m) => m.id} urutAwal={{ kunci: 'nwp25', arah: 'turun' }}
            placeholderCari="Cari MO atau cabang…"
            kolom={[
              { kunci: 'mo', judul: 'MO', nilai: (m) => m.kode, isi: (m) => <button type="button" className="tautan" onClick={() => onBuka({ tingkat: 'mo', id: m.id })}>{m.kode}</button> },
              { kunci: 'cabang', judul: 'Cabang', nilai: (m) => m.cabangNama, isi: (m) => m.cabangNama, saring: true },
              { kunci: 'kanal', judul: 'Sub-channel', nilai: (m) => m.subKanal, isi: (m) => m.subKanal, saring: true },
              { kunci: 'nwp25', judul: 'NWP 2025', kanan: true, nilai: (m) => m.nwp25, isi: (m) => rp(m.nwp25) },
              { kunci: 'nwp26', judul: `NWP ${labelPeriode(d.periode)}`, kanan: true, nilai: (m) => m.nwp26, isi: (m) => <span className="teks-turun">{rp(m.nwp26)}</span> },
            ]}
          />
        ) : <p className="kosong-isi">Tidak ada MO yang memenuhi kriteria pada cakupan ini.</p>}
      </Kartu>
    </Bagian>
  );
}
