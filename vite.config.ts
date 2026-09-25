import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
// @ts-ignore — modul Node biasa tanpa deklarasi tipe.
import { ambilKunci, buatTautan, CONTOH_PORTAL, layaniDekrip } from './tools/lib-akses.mjs';

/**
 * Layanan akses portal di dalam dev/preview server, supaya tidak perlu `npm run api` terpisah.
 * - POST /api/akses/dekrip → peran & unit dari token tautan (kunci tetap di sisi Node).
 * - GET  /api/akses/contoh → tautan peragaan keempat portal. HANYA dev server: membuat tautan
 *   berarti memberi akses, jadi endpoint ini tidak pernah ada di build maupun `npm run api`.
 */
function aksesPortal(): Plugin {
  const pasang = (mw: Connect.Server, contoh: boolean) => {
    // Kunci dibaca saat dipakai: tanpa AKSES_KUNCI server tetap jalan (mis. VITE_AKSES_TAUTAN=mati),
    // hanya layanan aksesnya yang menjawab 503.
    const denganKunci = (f: (kunci: Buffer, req: Connect.IncomingMessage, res: import('node:http').ServerResponse) => void): Connect.NextHandleFunction =>
      (req, res) => {
        let kunci: Buffer;
        try { kunci = ambilKunci(); } catch (e) {
          res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ galat: (e as Error).message }));
        }
        f(kunci, req, res);
      };
    mw.use('/api/akses/dekrip', denganKunci((kunci, req, res) => layaniDekrip(req, res, kunci)));
    if (contoh) mw.use('/api/akses/contoh', denganKunci((kunci, req, res) => {
      const dasar = `http://${req.headers.host}/`;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(CONTOH_PORTAL.map((c: { peran: string; unitId: string }) => ({ ...c, url: buatTautan(c.peran, c.unitId, 1, dasar, kunci) }))));
    }));
  };
  return {
    name: 'akses-portal',
    configureServer: (server) => pasang(server.middlewares, true),
    configurePreviewServer: (server) => pasang(server.middlewares, false),
  };
}

// Satu berkas HTML mandiri: seluruh JS/CSS di-inline.
export default defineConfig(({ mode }) => {
  // Awalan '' = baca semua variabel .env di sisi Node saja; tidak ada yang ikut ke browser
  // kecuali yang berawalan VITE_.
  const env = loadEnv(mode, process.cwd(), '');

  // URL_GO menunjuk ke backend Go (…/api/v1/matrix/). Endpoint ditulis relatif dari /api/v1
  // (mis. "matrix/kanwils"), jadi akhiran "matrix/" dibuang dari target proxy.
  const go = env.URL_GO ? new URL(env.URL_GO) : null;
  const dasarGo = go ? go.pathname.replace(/\/?matrix\/?$/, '').replace(/\/$/, '') : '';

  return {
    plugins: [react(), viteSingleFile(), aksesPortal()],
    base: './',
    server: {
      // Port & alamat tetap supaya tautan akses (npm run link) selalu menunjuk ke tempat yang sama.
      // 127.0.0.1 = hanya dari komputer ini (data rahasia internal tidak terbuka ke jaringan).
      host: '127.0.0.1',
      port: 5175,
      strictPort: true,
      proxy: {
        // Backend Go: /api-go/matrix/kanwils → {URL_GO tanpa "matrix/"}/matrix/kanwils.
        // Lewat proxy karena backend tidak mengirim header CORS.
        ...(go && {
          '/api-go': {
            target: go.origin, changeOrigin: true,
            rewrite: (p: string) => p.replace(/^\/api-go/, dasarGo),
            // Backend tidak terjangkau → jawab cepat dengan 502 berbentuk sama seperti balasan backend,
            // alih-alih menggantung sampai koneksi OS menyerah.
            configure: (proxy) => {
              // proxyTimeout bawaan tidak berlaku saat tahap membuka koneksi; pasang batas sendiri.
              proxy.on('proxyReq', (proxyReq) => {
                const t = setTimeout(() => proxyReq.destroy(Object.assign(new Error('ETIMEDOUT'), { code: 'ETIMEDOUT' })), 8000);
                proxyReq.on('response', () => clearTimeout(t));
                proxyReq.on('close', () => clearTimeout(t));
              });
              proxy.on('error', (err, _req, res) => {
                if (!('writeHead' in res) || res.headersSent) return;
                res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, message: `Backend Go (${go.host}) tidak terjangkau: ${(err as NodeJS.ErrnoException).code ?? err.message}` }));
              });
            },
          },
        }),
      },
    },
  };
});
