import { mkdir, copyFile } from 'node:fs/promises';
// --- Distribución estática ---
// Solo el build copia las dependencias de terceros; src conserva el código propio legible.
await mkdir('dist/vendor', { recursive: true });
for (const [a, b] of [
  ['vue/dist/vue.global.prod.js', 'vue.js'],
  ['vuetify/dist/vuetify.min.js', 'vuetify.js'],
  ['vuetify/dist/vuetify.min.css', 'vuetify.css'],
  ['xlsx/dist/xlsx.full.min.js', 'xlsx.js'],
])
  await copyFile('node_modules/' + a, 'dist/vendor/' + b);
// Copia los archivos propios sin minificarlos ni modificar sus rutas relativas.
for (const f of ['index.html', 'app.js', 'style.css', 'pdf.js'])
  await copyFile('src/' + f, 'dist/' + f);
