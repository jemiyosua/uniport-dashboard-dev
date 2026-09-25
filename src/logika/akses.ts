// Akses portal lewat TAUTAN TERENKRIPSI (menggantikan login/logout).
//
// Alur: tautan berisi ?akses=<token> → token dikirim ke API → API men-decrypt dengan
// kunci yang hanya ada di server → mengembalikan { peran, unitId }. Browser tidak
// pernah memegang kunci dan tidak bisa membuat/membaca token sendiri.
//
// Token disimpan di sessionStorage (bukan hasil decrypt-nya) lalu dihapus dari address
// bar, supaya tidak ikut ter-screenshot atau tersalin; saat refresh token diverifikasi ulang.
//
// Path tautan memberi label portal (/direksi, /pinwil, /pincab, /marketing) supaya mudah dikenali,
// tetapi PERAN tetap ditentukan token. Path yang tidak cocok dengan peran di token ditolak
// ('salah-portal'); path tanpa label (mis. / atau index.html) tetap diterima.
import { akarAkses, peranDariPath, type Cakupan, type Peran } from './agregasi';

export interface Akses { peran: Peran; unitId: string; akar: Cakupan }
export type HasilAkses =
  | { ok: true; akses: Akses }
  | { ok: false; alasan: 'tanpa-token' | 'ditolak' | 'tak-terjangkau' }
  | { ok: false; alasan: 'salah-portal'; peranToken: Peran; peranPath: Peran };

const KUNCI_SIMPAN = 'uniport-akses';
const API = (import.meta.env.VITE_API_AKSES ?? '/api').replace(/\/$/, '');

/** Ambil token dari ?akses=… (lalu bersihkan dari URL) atau dari sesi tab sebelumnya. */
function ambilToken(): string | null {
  const url = new URL(window.location.href);
  const dariUrl = url.searchParams.get('akses');
  if (dariUrl) {
    try { sessionStorage.setItem(KUNCI_SIMPAN, dariUrl); } catch { /* mode privat: token hanya berlaku sekali muat */ }
    url.searchParams.delete('akses');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    return dariUrl;
  }
  try { return sessionStorage.getItem(KUNCI_SIMPAN); } catch { return null; }
}

function lupakanToken() {
  try { sessionStorage.removeItem(KUNCI_SIMPAN); } catch { /* abaikan */ }
}

export async function periksaAkses(): Promise<HasilAkses> {
  const token = ambilToken();
  if (!token) return { ok: false, alasan: 'tanpa-token' };

  let res: Response;
  try {
    res = await fetch(`${API}/akses/dekrip`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }), cache: 'no-store',
    });
  } catch {
    return { ok: false, alasan: 'tak-terjangkau' };
  }
  if (!res.ok) {
    if (res.status === 400 || res.status === 401 || res.status === 403) { lupakanToken(); return { ok: false, alasan: 'ditolak' }; }
    return { ok: false, alasan: 'tak-terjangkau' };
  }

  const isi = (await res.json().catch(() => null)) as { peran?: string; unitId?: string } | null;
  // Token sah secara kriptografis tetapi unitnya tidak dikenal / tidak cocok dengan perannya → tolak juga.
  const akar = isi?.peran && isi.unitId ? akarAkses(isi.peran, isi.unitId) : null;
  if (!akar) { lupakanToken(); return { ok: false, alasan: 'ditolak' }; }
  // Token tetap disimpan: pengguna yang salah mengetik path cukup kembali ke portalnya.
  const peranPath = peranDariPath(window.location.pathname);
  if (peranPath && peranPath !== isi!.peran) {
    return { ok: false, alasan: 'salah-portal', peranToken: isi!.peran as Peran, peranPath };
  }
  return { ok: true, akses: { peran: isi!.peran as Peran, unitId: isi!.unitId!, akar } };
}
