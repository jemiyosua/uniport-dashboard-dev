import { useMemo } from 'react';
import { DataTable, type Kolom } from '../../components/DataTable';
import { BatangMendatar } from '../../components/grafik/Grafik';
import { Ikon } from '../../components/Ikon';
import { Bagian, Kartu, KepalaKartu, PilStatus } from '../../components/Kartu';
import { LABEL_JT, type Cakupan, type Kelompok_JT, type ProspekPrioritas } from '../../logika/agregasi';
import type { Dasbor } from '../../logika/dasbor';
import { bilangan, rp } from '../../logika/format';

function teksJatuhTempo(sisa: number | null) {
  if (sisa === null) return '–';
  if (sisa < 0) return <span className="teks-turun"><Ikon nama="clock" ukuran={14} /> lewat {-sisa} hari</span>;
  if (sisa === 0) return <span className="teks-waspada">hari ini</span>;
  return `${sisa} hari lagi`;
}

type BarisPrioritas = ProspekPrioritas & { peringkat: number };

export function TabelPrioritas({ daftar, tampilMO, tampilCabang, onBuka }: {
  daftar: ProspekPrioritas[]; tampilMO: boolean; tampilCabang: boolean; onBuka?: (c: Cakupan) => void;
}) {
  // Peringkat = urutan skor prioritas asli, tetap terbaca meski tabel diurutkan ulang.
  const baris = useMemo<BarisPrioritas[]>(() => daftar.map((p, i) => ({ ...p, peringkat: i + 1 })), [daftar]);
  const kolom: Kolom<BarisPrioritas>[] = [
    { kunci: 'peringkat', judul: '#', isi: (p) => <span className="teks-redup">{p.peringkat}</span>, nilai: (p) => p.peringkat },
    { kunci: 'id', judul: 'ID Prospek', isi: (p) => <span className="mono">{p.id}</span>, nilai: (p) => p.id },
    { kunci: 'status', judul: 'Status', isi: (p) => <PilStatus status={p.status} />, nilai: (p) => p.status, saring: true },
    { kunci: 'tahap', judul: 'Tahap', isi: (p) => p.tahap, nilai: (p) => p.tahap, saring: true },
    { kunci: 'premi', judul: 'Estimasi premi', isi: (p) => rp(p.premi), nilai: (p) => p.premi, kanan: true },
    { kunci: 'jt', judul: 'Batas tindak lanjut', isi: (p) => teksJatuhTempo(p.sisaHari), nilai: (p) => p.sisaHari },
    ...(tampilMO ? [{
      kunci: 'mo', judul: 'MO', nilai: (p: BarisPrioritas) => p.moKode,
      isi: (p: BarisPrioritas) => onBuka ? <button type="button" className="tautan" onClick={() => onBuka({ tingkat: 'mo', id: p.moId })}>{p.moKode}</button> : p.moKode,
    }] : []),
    ...(tampilCabang ? [{ kunci: 'cabang', judul: 'Cabang', isi: (p: BarisPrioritas) => p.cabangNama, nilai: (p: BarisPrioritas) => p.cabangNama, saring: true }] : []),
    { kunci: 'skor', judul: 'Skor', isi: (p) => <strong>{p.skor.toFixed(1).replace('.', ',')}</strong>, nilai: (p) => p.skor, kanan: true },
  ];
  return (
    <DataTable
      data={baris} kolom={kolom} kunciBaris={(p) => p.id} urutAwal={{ kunci: 'peringkat', arah: 'naik' }}
      placeholderCari="Cari ID, tahap, MO, cabang…" pesanKosong="Tidak ada prospek terbuka pada cakupan & filter ini."
    />
  );
}

const IKON_JT: Record<Kelompok_JT, 'alert' | 'clock' | 'calendar'> = { lewat: 'alert', hariIni: 'clock', h1_3: 'calendar', h4_7: 'calendar' };

export function PerluTindakan({ d, onBuka, onEkspor }: { d: Dasbor; onBuka: (c: Cakupan) => void; onEkspor: () => void }) {
  	return (
		<Bagian
			id="tindakan" judul="Perlu Tindakan"
		>
			<div className="grid-4">
				{(Object.keys(LABEL_JT) as Kelompok_JT[]).map((k) => (
				<Kartu key={k} className={`ubin-jt jt-${k}`}>
					<span className="jt-label"><Ikon nama={IKON_JT[k]} ukuran={18} /> {LABEL_JT[k]}</span>
					<strong className="angka-kpi">{bilangan(d.jt[k].jumlah)}</strong>
					<span className="teks-redup">estimasi premi {rp(d.jt[k].premi)}</span>
				</Kartu>
				))}
			</div>

			<div className="grid-2-1">
				<Kartu>
					<KepalaKartu
						ikon="list" judul="Prioritas Tindak Lanjut" sub="Tanpa nama nasabah/prospek — hanya ID (Aturan Emas)."
						aksi={<button type="button" className="tombol kecil sekunder" onClick={onEkspor}><Ikon nama="download" ukuran={16} /> CSV</button>}
					/>
					<TabelPrioritas daftar={d.prioritas} tampilMO tampilCabang={d.cakupan.tingkat !== 'cabang'} onBuka={onBuka} />
				</Kartu>
				<Kartu>
					<KepalaKartu ikon="layers" judul="Sebaran Beban" sub={`Lewat + hari ini, per ${d.labelAnak}`} />
					{d.beban.length ? (
						<BatangMendatar
						data={d.beban.slice(0, 10).map((b) => ({ label: b.nama, nilai: b.jumlah, ket: rp(b.premi) }))}
						format={(n) => `${bilangan(n)}`} onPilih={(i) => onBuka(d.beban[i].unit)}
						/>
					) : <p className="kosong-isi">Tidak ada beban mendesak.</p>}
					{d.beban.length > 10 && <p className="catatan">Menampilkan 10 dari {d.beban.length} unit dengan beban terbanyak.</p>}
				</Kartu>
			</div>
    	</Bagian>
  	);
}
