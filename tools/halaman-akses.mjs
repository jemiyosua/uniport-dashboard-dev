// Halaman lokal berisi tautan portal (akses-portal.html), dibuat oleh `npm run link`.
// Berkas ini SETARA KUNCI MASUK semua portal: jangan di-commit, di-deploy, atau dibagikan utuh.
// Sudah tercantum di .gitignore; bagikan tautan satu per satu ke pemiliknya.

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** @param {{ label: string, ket: string, url: string }[]} daftar  @param {Date | null} berlakuSampai null = selamanya */
export function halamanAkses(daftar, berlakuSampai) {
  const tgl = (d) => d.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
  const kartu = daftar.map((c) => {
    const u = new URL(c.url);
    return `
      <li class="kartu">
        <div class="judul">
          <strong>${esc(c.label)}</strong>
          <span class="redup">${esc(c.ket)}</span>
        </div>
        <code title="${esc(c.url)}">${esc(u.host + u.pathname)}?akses=…</code>
        <div class="aksi">
          <a class="tombol utama" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Buka portal</a>
          <button type="button" class="tombol" data-salin="${esc(c.url)}">Salin tautan</button>
        </div>
      </li>`;
  }).join('');

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="referrer" content="no-referrer">
<title>Tautan Portal Uniport</title>
<style>
  :root {
    --latar: #f4f6f5; --permukaan: #ffffff; --garis: #e3e7e5; --teks: #17201b; --redup: #56615b;
    --merek: #14743a; --merek-hover: #0f5f2f; --waspada-latar: #fdf3e1; --waspada-teks: #7a4a05;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --latar: #101412; --permukaan: #181d1a; --garis: #2a322e; --teks: #e8ece9; --redup: #a3aea8;
      --merek: #3fae6a; --merek-hover: #56c27f; --waspada-latar: #3a2c12; --waspada-teks: #f3cf8a;
      color-scheme: dark;
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--latar); color: var(--teks); font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 32px 16px 48px; }
  h1 { font-size: 24px; margin: 0 0 4px; letter-spacing: -0.01em; }
  .redup { color: var(--redup); }
  .peringatan { margin: 20px 0; padding: 12px 16px; border-radius: 12px; background: var(--waspada-latar); color: var(--waspada-teks); font-size: 14px; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
  .kartu { background: var(--permukaan); border: 1px solid var(--garis); border-radius: 16px; padding: 16px; display: grid; gap: 10px; }
  .judul { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; }
  .judul strong { font-size: 18px; }
  code { font: 13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--redup); overflow-wrap: anywhere; }
  .aksi { display: flex; flex-wrap: wrap; gap: 8px; }
  .tombol { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 18px; border-radius: 999px;
    border: 1px solid var(--garis); background: var(--permukaan); color: var(--teks); font: inherit; font-weight: 600; text-decoration: none; cursor: pointer; }
  .tombol:hover { border-color: var(--redup); }
  .tombol.utama { background: var(--merek); border-color: var(--merek); color: #fff; }
  .tombol.utama:hover { background: var(--merek-hover); border-color: var(--merek-hover); }
  .tombol:focus-visible { outline: 3px solid var(--merek); outline-offset: 2px; }
  .kaki { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: space-between; font-size: 14px; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .tombol.utama { color: #0b1f13; } }
</style>
</head>
<body>
<main>
  <h1>Tautan Portal Uniport</h1>
  <p class="redup">${berlakuSampai ? `Berlaku sampai ${esc(tgl(berlakuSampai))}` : 'Berlaku tanpa batas waktu'} · dibuat ${esc(tgl(new Date()))}</p>
  <p class="peringatan"><strong>Rahasia.</strong> Halaman ini membuka semua portal, termasuk Direksi. Simpan hanya di komputer Anda. Kirim tautan satu per satu hanya ke pemiliknya.</p>
  <ul>${kartu}
  </ul>
  <div class="kaki">
    <span class="redup">Setiap portal terbuka di tab baru, jadi beberapa peran bisa dibuka bersamaan.</span>
  </div>
</main>
<script>
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-salin]');
    if (!b) return;
    const teks = b.getAttribute('data-salin');
    let ok = false;
    try { await navigator.clipboard.writeText(teks); ok = true; } catch {
      const t = document.createElement('textarea'); t.value = teks; document.body.appendChild(t); t.select();
      try { ok = document.execCommand('copy'); } catch {} t.remove();
    }
    const asli = b.dataset.asli || (b.dataset.asli = b.textContent);
    b.textContent = ok ? 'Tersalin ✓' : 'Gagal menyalin';
    setTimeout(() => { b.textContent = asli; }, 1600);
  });
</script>
</body>
</html>
`;
}
