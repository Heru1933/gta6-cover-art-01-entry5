// A pocket static server for trying Neon Vice locally.
//
//   node serve.ts [--port 8080]
//
// It serves the files under app/ and nothing else: paths that climb out of
// app/ are refused, unknown files are a plain 404, and every response is
// marked no-store so a rebuilt cover is never hidden by a stale cache.
// Node 22 standard library only; this file is a development convenience
// and is not part of the handed-in app.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));

function chosenPort(argv) {
  const at = argv.indexOf('--port');
  const value = at === -1 ? 8080 : Number(argv[at + 1]);
  return Number.isInteger(value) && value > 0 && value < 65536 ? value : 8080;
}

const CONTENT_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
  ['.ttf', 'font/ttf'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

function resolveInsideApp(pathname) {
  const cleaned = normalize(decodeURIComponent(pathname));
  const target = resolve(join(appRoot, cleaned.endsWith('/') ? cleaned + 'index.html' : cleaned));
  if (target !== appRoot && !target.startsWith(appRoot + sep)) return null;
  return target;
}

const server = createServer((request, response) => {
  let target = null;
  try {
    target = resolveInsideApp(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    target = null;
  }
  if (!target) {
    response.writeHead(400).end('bad request');
    return;
  }
  let size = -1;
  try {
    const stats = statSync(target);
    if (stats.isFile()) size = stats.size;
  } catch {
    size = -1;
  }
  if (size < 0) {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': CONTENT_TYPES.get(extname(target).toLowerCase()) ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(target).pipe(response);
});

const port = chosenPort(process.argv.slice(2));
server.on('error', (error) => {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'unknown';
  console.error(`Neon Vice server could not start on port ${port} (${code}). Try --port with a free port.`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Neon Vice app is open at http://localhost:${port}`);
});
