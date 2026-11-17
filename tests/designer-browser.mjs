import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

// Sirve la distribución real para comprobar el editor y sus controles en navegador.
const root = path.resolve('dist');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};
const server = createServer(async (req, res) => {
  try {
    const file = path.resolve(
      root,
      '.' + new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '/index.html'),
    );
    if (!file.startsWith(root + path.sep)) throw Error('Ruta no válida');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch {
    res.statusCode = 404;
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch();
await mkdir('.test-artifacts', { recursive: true });
try {
  for (const width of [360, 720, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      acceptDownloads: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('dialog', (dialog) => dialog.accept());
    try {
      await page.goto('http://127.0.0.1:' + server.address().port);
      await page
        .locator('.icon-rail')
        .getByRole('button', { name: 'Diseños y plantillas', exact: true })
        .click();
      const create = page
        .locator('.page-actions')
        .getByRole('button', { name: 'Crear plantilla', exact: true });
      await create.click();
      const editor = page.locator('.template-designer');
      await editor.waitFor();
      await editor.getByLabel('Nombre', { exact: true }).fill('Plantilla navegador ' + width);
      assert.equal(await editor.locator('.designer-layers li').count(), 3);
      await editor.getByRole('button', { name: 'Añadir rectángulo', exact: true }).click();
      await editor.getByLabel('Nombre de la capa', { exact: true }).fill('Fondo central');
      await editor.getByLabel('Ancho', { exact: true }).fill('160');
      await editor.getByRole('button', { name: 'Centrar horizontalmente', exact: true }).click();
      assert.equal(await editor.getByLabel('X', { exact: true }).inputValue(), '70');
      await editor.getByRole('button', { name: 'Deshacer en plantilla', exact: true }).click();
      await editor.getByRole('button', { name: 'Rehacer en plantilla', exact: true }).click();
      await editor.getByRole('button', { name: 'Enviar capa hacia atrás', exact: true }).click();
      await editor.locator('input[type="file"][accept*=".svg"]').setInputFiles({
        name: 'adorno.svg',
        mimeType: 'image/svg+xml',
        buffer: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><path d="M0 25L50 0L100 25L50 50Z" fill="#28548a"/><script>alert("unsafe")</script></svg>',
        ),
      });
      await page.waitForFunction(
        () => document.querySelectorAll('.designer-layers li').length === 5,
      );
      assert.equal(
        await editor.getByLabel('Nombre de la capa', { exact: true }).inputValue(),
        'adorno.svg',
      );
      const stage = editor.locator('.designer-stage');
      await stage.scrollIntoViewIfNeeded();
      await stage.focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await editor.getByLabel('X', { exact: true }).inputValue(), '11');
      const layout = await editor.evaluate((node) => {
        const r = node.getBoundingClientRect();
        const tools = Array.from(node.querySelectorAll('.designer-tools .control-icon')).map(
          (b) => {
            const rect = b.getBoundingClientRect();
            return { height: rect.height, width: rect.width };
          },
        );
        const inputs = Array.from(node.querySelectorAll('.designer-measures input')).map(
          (input) => {
            const rect = input.getBoundingClientRect();
            return { left: rect.left, top: rect.top, height: rect.height };
          },
        );
        return {
          left: r.left,
          right: r.right,
          overflow: node.scrollWidth - node.clientWidth,
          tools,
          inputs,
        };
      });
      assert.ok(layout.left >= 0 && layout.right <= width + 1, 'El modal cabe en el viewport');
      assert.ok(layout.overflow <= 1, 'El editor no tiene desbordamiento horizontal');
      assert.ok(
        layout.tools.every((b) => b.width === 42 && b.height === 42),
        'Iconos homogéneos',
      );
      assert.ok(
        layout.inputs.every((input) => input.height === 42),
        'Campos con la misma altura',
      );
      if (width === 360)
        assert.ok(
          layout.inputs.every((input) => Math.abs(input.left - layout.inputs[0].left) < 1),
          'Una entrada por fila en móvil',
        );
      await editor
        .getByRole('button', { name: 'Exportar plantilla JSON', exact: true })
        .scrollIntoViewIfNeeded();
      const downloadPromise = page.waitForEvent('download');
      await editor.getByRole('button', { name: 'Exportar plantilla JSON', exact: true }).click();
      assert.equal((await downloadPromise).suggestedFilename(), 'title-studio-plantilla.json');
      await stage.scrollIntoViewIfNeeded();
      await page.screenshot({ path: '.test-artifacts/designer-' + width + '.png', fullPage: true });
      await editor.getByRole('button', { name: 'Guardar plantilla', exact: true }).click();
      await editor.waitFor({ state: 'detached' });
      const card = page
        .locator('.template-card')
        .filter({ hasText: 'Plantilla navegador ' + width });
      await card.waitFor();
      await page.reload();
      await card.waitFor();
      await card.click();
      await editor.waitFor();
      assert.equal(
        await editor.getByLabel('Nombre', { exact: true }).inputValue(),
        'Plantilla navegador ' + width,
      );
      assert.equal(await editor.locator('.designer-layers li').count(), 5);
      assert.deepEqual(errors, [], 'Sin errores de ejecución Vue');
      console.log(
        'PASS: editor real, importación, historial, guardado y medidas a ' + width + ' px',
      );
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
