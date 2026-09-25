// Halaman berisi tautan keempat portal: akses-portal.html (lokal, `npm run link`) dan /admin di Vercel
// (api/akses/portal.js). Setara kunci masuk semua portal: jangan di-commit atau dibagikan utuh.
// Satu berkas mandiri tanpa sumber eksternal (font/ikon/skrip), jadi juga bisa dibuka lewat file://.

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const svg = (isi, ukuran = 24) =>
  `<svg viewBox="0 0 24 24" width="${ukuran}" height="${ukuran}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${isi}</svg>`;

const IKON = {
  direksi: svg('<path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-5h6v5"/><path d="M9 11h.01M15 11h.01"/>'),
  wilayah: svg('<path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>'),
  cabang: svg('<path d="M4 10h16l-1.5-5h-13z"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>'),
  marketing: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  buka: svg('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>', 18),
  salin: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>', 18),
  kunci: svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 18),
};

/** Tampilan per peran; kunci = nilai `peran` di CONTOH_PORTAL (tools/lib-akses.mjs). */
const TAMPIL = {
  direksi: { ikon: IKON.direksi, aksen: 'a1', cakupan: 'Seluruh Kantor Wilayah, cabang, dan Marketing Officer.' },
  'pemimpin-wilayah': { ikon: IKON.wilayah, aksen: 'a2', cakupan: 'Cabang dan Marketing Officer di wilayahnya.' },
  'pimpinan-cabang': { ikon: IKON.cabang, aksen: 'a3', cakupan: 'Marketing Officer di cabangnya.' },
  'marketing-officer': { ikon: IKON.marketing, aksen: 'a4', cakupan: 'Data miliknya sendiri, menu ringkas.' },
};

/** @param {{ peran: string, label: string, ket: string, url: string }[]} daftar */
export function halamanAkses(daftar) {
  const kartu = daftar.map((c, i) => {
    const t = TAMPIL[c.peran] ?? { ikon: IKON.kunci, aksen: 'a1', cakupan: '' };
    const path = new URL(c.url).pathname;
    return `
      <li class="kartu ${t.aksen}" style="--i:${i}">
        <div class="kepala">
          <span class="ikon">${t.ikon}</span>
          <span class="path">${esc(path)}</span>
        </div>
        <h2>${esc(c.label)}</h2>
        <p class="unit">${esc(c.ket)}</p>
        <p class="cakupan">${esc(t.cakupan)}</p>
        <div class="aksi">
          <a class="tombol utama" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Buka portal ${IKON.buka}</a>
          <button type="button" class="tombol ikon-saja" data-salin="${esc(c.url)}" aria-label="Salin tautan ${esc(c.label)}" title="Salin tautan">${IKON.salin}</button>
        </div>
      </li>`;
  }).join('');

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>Portal Admin Uniport</title>
<style>
  :root {
    --latar: #eef2ef; --permukaan: #ffffff; --garis: #e1e7e3; --teks: #142019; --redup: #57625c;
    --merek: #14743a; --merek-hover: #0f5f2f; --merek-tua: #0b4a25; --pada-merek: #ffffff;
    --a1: #14743a; --a1-latar: #e3f2e8;
    --a2: #0f766e; --a2-latar: #dff3f0;
    --a3: #1d5fb8; --a3-latar: #e3edfa;
    --a4: #9a5b06; --a4-latar: #fbefd9;
    --bayang: 0 1px 2px rgb(16 40 26 / 6%), 0 8px 24px -12px rgb(16 40 26 / 18%);
    --bayang-naik: 0 2px 4px rgb(16 40 26 / 8%), 0 18px 40px -16px rgb(16 40 26 / 30%);
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --latar: #0d1210; --permukaan: #161c19; --garis: #26302b; --teks: #e7ece9; --redup: #a1ada6;
      --merek: #3fae6a; --merek-hover: #58c381; --merek-tua: #0f3a22; --pada-merek: #06170d;
      --a1: #5cc583; --a1-latar: #173323;
      --a2: #4cc7b9; --a2-latar: #133230;
      --a3: #7fb0f5; --a3-latar: #172a45;
      --a4: #f0b862; --a4-latar: #3a2a12;
      --bayang: 0 1px 2px rgb(0 0 0 / 40%);
      --bayang-naik: 0 18px 40px -18px rgb(0 0 0 / 70%);
      color-scheme: dark;
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; background: var(--latar); color: var(--teks);
    font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; }

  .pita { position: relative; overflow: hidden; color: #fff; padding: 20px 16px 88px;
    background: radial-gradient(120% 140% at 100% 0%, #2c9a58 0%, transparent 55%), linear-gradient(135deg, #14743a, #0b4a25); }
  .pita::after { content: ""; position: absolute; inset: auto -10% -60% auto; width: 420px; height: 420px; border-radius: 50%;
    border: 56px solid rgb(255 255 255 / 6%); pointer-events: none; }
  .bingkai { max-width: 960px; margin: 0 auto; position: relative; }
  .merek { display: flex; align-items: center; gap: 12px; }
  .merek strong { display: block; font-size: 18px; line-height: 1.1; }
  .merek small { display: block; font-size: 13px; opacity: .8; }
  .lencana { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px;
    background: rgb(255 255 255 / 14%); border: 1px solid rgb(255 255 255 / 22%); font-size: 13px; font-weight: 600; }
  .sambut { margin-top: 40px; max-width: 560px; }
  .sambut h1 { margin: 0; font-size: clamp(28px, 5vw, 38px); line-height: 1.15; letter-spacing: -0.02em; }
  .sambut p { margin: 10px 0 0; font-size: 16px; opacity: .88; }

  main { max-width: 960px; margin: -56px auto 0; padding: 0 16px 40px; position: relative; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 16px; }
  .kartu { --aksen: var(--a1); --aksen-latar: var(--a1-latar);
    position: relative; display: flex; flex-direction: column; padding: 22px; border-radius: 20px; overflow: hidden;
    background: var(--permukaan); border: 1px solid var(--garis); box-shadow: var(--bayang);
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
    animation: muncul .45s cubic-bezier(.2,.7,.3,1) both; animation-delay: calc(var(--i) * 60ms); }
  .kartu::before { content: ""; position: absolute; inset: 0 0 auto; height: 4px; background: var(--aksen); }
  .kartu:hover { transform: translateY(-3px); box-shadow: var(--bayang-naik); border-color: color-mix(in srgb, var(--aksen) 35%, var(--garis)); }
  .a2 { --aksen: var(--a2); --aksen-latar: var(--a2-latar); }
  .a3 { --aksen: var(--a3); --aksen-latar: var(--a3-latar); }
  .a4 { --aksen: var(--a4); --aksen-latar: var(--a4-latar); }
  @keyframes muncul { from { opacity: 0; transform: translateY(10px); } }

  .kepala { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .ikon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 14px; background: var(--aksen-latar); color: var(--aksen); }
  .path { font: 600 13px/1 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--aksen); background: var(--aksen-latar);
    padding: 7px 10px; border-radius: 8px; }
  h2 { margin: 18px 0 0; font-size: 21px; letter-spacing: -0.01em; }
  .unit { margin: 2px 0 0; font-weight: 600; color: var(--redup); }
  .cakupan { margin: 10px 0 0; color: var(--redup); font-size: 15px; flex: 1; }

  .aksi { display: flex; gap: 8px; margin-top: 20px; }
  .tombol { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; padding: 0 18px;
    border-radius: 12px; border: 1px solid var(--garis); background: var(--permukaan); color: var(--teks);
    font: inherit; font-weight: 600; text-decoration: none; cursor: pointer; transition: background .15s, border-color .15s, color .15s; }
  .tombol.utama { flex: 1; background: var(--merek); border-color: var(--merek); color: var(--pada-merek); }
  .tombol.utama svg { transition: transform .15s; }
  .tombol.utama:hover { background: var(--merek-hover); border-color: var(--merek-hover); }
  .tombol.utama:hover svg { transform: translateX(3px); }
  .tombol.ikon-saja { width: 46px; padding: 0; color: var(--redup); }
  .tombol.ikon-saja:hover { color: var(--aksen); border-color: var(--aksen); background: var(--aksen-latar); }
  .tombol:focus-visible { outline: 3px solid var(--aksen, var(--merek)); outline-offset: 2px; }

  .catatan { margin-top: 24px; display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 14px;
    background: var(--a4-latar); color: var(--teks); font-size: 14px; }
  .catatan svg { flex: none; color: var(--a4); margin-top: 1px; }
  .kaki { margin-top: 28px; text-align: center; font-size: 13px; color: var(--redup); }

  .toast { position: fixed; left: 50%; bottom: 24px; transform: translate(-50%, 16px); opacity: 0; pointer-events: none;
    padding: 10px 16px; border-radius: 999px; background: var(--teks); color: var(--latar); font-size: 14px; font-weight: 600;
    box-shadow: var(--bayang-naik); transition: opacity .2s, transform .2s; }
  .toast.tampil { opacity: 1; transform: translate(-50%, 0); }

  @media (max-width: 480px) { .pita { padding-bottom: 76px; } .sambut { margin-top: 28px; } .kartu { padding: 18px; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
</style>
</head>
<body>
<header class="pita">
  <div class="bingkai">
    <div class="merek">
      <svg viewBox="0 0 32 32" width="40" height="40" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#fff"/><path d="M9 11v6.5a7 7 0 0 0 14 0V11" fill="none" stroke="#14743a" stroke-width="3" stroke-linecap="round"/></svg>
      <span><strong>Uniport</strong><small>Executive Dashboard</small></span>
      <span class="lencana">${IKON.kunci} Portal Admin</span>
    </div>
    <div class="sambut">
      <h1>Pilih portal yang ingin dibuka</h1>
      <p>Setiap portal terbuka di tab baru sesuai peran dan cakupan datanya, jadi beberapa peran bisa dibuka bersamaan.</p>
    </div>
  </div>
</header>
<main>
  <ul>${kartu}
  </ul>
  <div class="catatan" role="note">
    ${IKON.kunci}
    <span><strong>Rahasia.</strong> Halaman ini membuka semua portal, termasuk Direksi. Kirim tautan satu per satu hanya kepada pemiliknya.</span>
  </div>
  <p class="kaki">Rahasia internal · Asuransi Sinar Mas</p>
</main>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script>
  const toast = document.getElementById('toast');
  let jeda;
  const kabari = (pesan) => {
    toast.textContent = pesan; toast.classList.add('tampil');
    clearTimeout(jeda); jeda = setTimeout(() => toast.classList.remove('tampil'), 1800);
  };
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-salin]');
    if (!b) return;
    const teks = b.getAttribute('data-salin');
    let ok = false;
    try { await navigator.clipboard.writeText(teks); ok = true; } catch {
      const t = document.createElement('textarea'); t.value = teks; document.body.appendChild(t); t.select();
      try { ok = document.execCommand('copy'); } catch {} t.remove();
    }
    kabari(ok ? 'Tautan ' + b.getAttribute('aria-label').replace('Salin tautan ', '') + ' tersalin' : 'Gagal menyalin tautan');
  });
</script>
</body>
</html>
`;
}
