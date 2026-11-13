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
