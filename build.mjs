import { mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
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
for (const file of ['app.js', 'pdf.js', 'style.css']) {
  const result = await transform(await readFile('src/' + file, 'utf8'), {
    loader: file.endsWith('.css') ? 'css' : 'js',
    minify: true,
    target: 'es2020',
  });
  await writeFile('dist/' + file, result.code);
}
// Conserva las directivas, atributos entrecomillados y mayúsculas de Vue/SVG.
await writeFile(
  'dist/index.html',
  await minify(await readFile('src/index.html', 'utf8'), {
    collapseWhitespace: true,
    removeComments: true,
    caseSensitive: true,
    keepClosingSlash: true,
  }),
);
