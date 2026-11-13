import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { compile } from '@vue/compiler-dom';
import vm from 'node:vm';

// Compila el DOM real: detecta expresiones rotas que las pruebas de setup no ven.
for (const directory of ['src', 'dist']) {
  const html = await readFile(`${directory}/index.html`, 'utf8');
  const { document } = parseHTML(html);
  const template = document.querySelector('#app').innerHTML;
  assert.ok(template.includes('v-app'));
  const { code } = compile(template, { mode: 'function' });
  new Function('Vue', code);
  for (const file of ['app.js', 'pdf.js']) {
    new vm.Script(await readFile(`${directory}/${file}`, 'utf8'));
  }
}
// Impide publicar de nuevo copias sin minificar de los archivos propios.
for (const file of ['index.html', 'app.js', 'pdf.js', 'style.css']) {
  const source = await readFile(`src/${file}`, 'utf8');
  const built = await readFile(`dist/${file}`, 'utf8');
  assert.ok(built.length < source.length * 0.9, `${file} debe estar minificado`);
}
console.log('Plantillas y archivos de producción válidos y minificados.');

// Los SVG exportados deben disponer de fuentes reales, con sus licencias locales.
const fontContext = { document: { createElement: () => ({}), head: { appendChild() {} } } };
vm.runInNewContext(await readFile('dist/fonts.js', 'utf8'), fontContext);
assert.equal(Object.keys(fontContext.StudioFonts).length, 6);
for (const css of Object.values(fontContext.StudioFonts))
  assert.match(css, /data:font\/woff2;base64,/);
for (const slug of [
  'trade-winds',
  'permanent-marker',
  'dm-sans',
  'oswald',
  'space-grotesk',
  'playfair-display',
]) {
  assert.ok((await readFile(`dist/licenses/${slug}.txt`, 'utf8')).length > 100);
}
const builtHtml = await readFile('dist/index.html', 'utf8');
assert.match(builtHtml, /<select[^>]*aria-label="Género del disco"/);
assert.doesNotMatch(builtHtml, /<datalist/);
