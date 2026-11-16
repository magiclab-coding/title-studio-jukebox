// Desarrollo local: reconstrucción automática, acceso solo desde este ordenador.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
let revision = 0,
  building = false,
  pending = false;
async function build() {
  if (building) {
    pending = true;
    return;
  }
  building = true;
  await new Promise((resolve) => {
    const child = spawn(process.execPath, ['build.mjs'], { cwd: root, stdio: 'inherit' });
    child.on('exit', (code) => {
      if (!code) revision++;
      resolve();
    });
    child.on('error', (error) => {
      console.error(error);
      resolve();
    });
  });
  building = false;
  if (pending) {
    pending = false;
    await build();
  }
}
await build();
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.url === '/__revision') {
    res.end(String(revision));
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, 'dist', '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(path.join(root, 'dist') + path.sep)) throw Error('Invalid path');
    if (!(await stat(file)).isFile()) throw Error('Not a file');
    let bytes = await readFile(file);
    if (file.endsWith('.html'))
      bytes = Buffer.from(
        bytes
          .toString()
          .replace(
            '</body>',
            `<script>let version=${revision};setInterval(async()=>{try{const next=await(await fetch('/__revision')).text();if(+next!==version)location.reload()}catch{}},1000)</script></body>`,
          ),
      );
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(bytes);
  } catch {
    res.statusCode = 404;
    res.end('No encontrado');
  }
});
const port = Number(process.env.PORT || 5173);
server.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => console.log(`Desarrollo local: http://127.0.0.1:${port}`));
let timer;
const watchers = ['src', 'scripts'].map((dir) =>
  watch(path.join(root, dir), () => {
    clearTimeout(timer);
    timer = setTimeout(build, 150);
  }),
);
process.on('SIGINT', () => {
  watchers.forEach((w) => w.close());
  server.close(() => process.exit(0));
});
