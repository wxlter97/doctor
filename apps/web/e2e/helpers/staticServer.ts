import { createServer, type Server } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain',
};

/** Servidor estático con fallback SPA; `setRoot` cambia la carpeta servida en caliente (simula un deploy nuevo). */
export async function startStaticServer(port: number, root: string): Promise<{ server: Server; setRoot: (r: string) => void }> {
  let current = root;
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    let file = join(current, path);
    const ok = await stat(file).then((s) => s.isFile(), () => false);
    if (!ok) file = join(current, 'index.html');
    const headers: Record<string, string> = { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' };
    if (file.endsWith('sw.js') || file.endsWith('index.html')) headers['Cache-Control'] = 'no-cache';
    res.writeHead(200, headers);
    res.end(await readFile(file));
  });
  await new Promise<void>((r) => server.listen(port, r));
  return { server, setRoot: (r) => { current = r; } };
}
