import { mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { transform } from 'esbuild';
import { minify } from 'html-minifier-terser';

// --- Distribución de producción ---
// El código fuente conserva formato y comentarios; solo dist se minifica.
await rm('dist', { recursive: true, force: true });
await mkdir('dist/vendor', { recursive: true });
for (const [source, target] of [
  ['vue/dist/vue.global.prod.js', 'vue.js'],
  ['vuetify/dist/vuetify.min.js', 'vuetify.js'],
  ['vuetify/dist/vuetify.min.css', 'vuetify.css'],
  ['xlsx/dist/xlsx.full.min.js', 'xlsx.js'],
])
  await copyFile('node_modules/' + source, 'dist/vendor/' + target);

// El icono se publica sin alterar la imagen original.
for (const file of ['favicon.png', 'favicon.ico']) await copyFile('src/' + file, 'dist/' + file);

await import('./scripts/build-fonts.mjs');

// No se renombran propiedades públicas utilizadas por las plantillas de Vue.
for (const file of ['app.js', 'components.js', 'pdf.js', 'style.css']) {
  let source = await readFile('src/' + file, 'utf8');
  // Las plantillas de los controles son HTML dentro de cadenas JavaScript.
  if (file === 'components.js') {
    for (const match of [...source.matchAll(/template: `([\s\S]*?)`/g)]) {
      const template = await minify(match[1], { collapseWhitespace: true, caseSensitive: true });
      source = source.replace(match[0], 'template: ' + JSON.stringify(template));
    }
  }
  const result = await transform(source, {
    loader: file.endsWith('.css') ? 'css' : 'js',
    minify: true,
    target: 'es2020',
  });
  await writeFile('dist/' + file, result.code);
}
// Cada URL identifica su contenido y evita mezclar recursos de versiones distintas.
let html = await readFile('src/index.html', 'utf8');
for (const match of [...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)]) {
  const file = match[1];
  const hash = createHash('sha256')
    .update(await readFile('dist/' + file))
    .digest('hex')
    .slice(0, 12);
  html = html.replace(match[0], match[0].slice(0, -1) + '?v=' + hash + '"');
}
// Conserva las directivas, atributos entrecomillados y mayúsculas de Vue/SVG.
await writeFile(
  'dist/index.html',
  await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    caseSensitive: true,
    keepClosingSlash: true,
  }),
);
