import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist/vendor', { recursive: true });
for (const [a, b] of [
  ['vue/dist/vue.global.prod.js', 'vue.js'],
  ['vuetify/dist/vuetify.min.js', 'vuetify.js'],
  ['vuetify/dist/vuetify.min.css', 'vuetify.css'],
  ['xlsx/dist/xlsx.full.min.js', 'xlsx.js'],
])
  await copyFile('node_modules/' + a, 'dist/vendor/' + b);
for (const f of ['index.html', 'app.js', 'style.css', 'pdf.js'])
  await copyFile('src/' + f, 'dist/' + f);
