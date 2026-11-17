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
      const entries = page.locator('.template-entry');
      const editButtons = entries.locator('.template-actions button[title="Editar plantilla"]');
      assert.equal(
        await editButtons.count(),
        await entries.count(),
        'Todas las plantillas tienen lápiz',
      );

      // Integradas y propias deben abrir el mismo editor visual, con el diseño cargado.
      const builtinNames = [
        'Ribbon No. 45',
        'Pincel · El Río',
        'Artista en negativo',
        'Typewriter',
        'Sello Rock',
      ];
      for (const name of builtinNames) {
        await page.getByRole('button', { name: 'Editar plantilla ' + name, exact: true }).click();
        const visual = page.locator('.template-designer');
        await visual.waitFor();
        assert.equal(
          await visual.getByLabel('Nombre', { exact: true }).inputValue(),
          name + ' (copia)',
        );
        assert.ok((await visual.locator('.designer-layers li').count()) >= 6);
        assert.equal(await visual.getByLabel('Contenido', { exact: true }).inputValue(), 'a');
        assert.ok((await visual.locator('.designer-drawing svg text').count()) >= 6);
        assert.ok(
          (await visual
            .locator('.designer-drawing svg image, .designer-drawing svg g rect')
            .count()) > 0,
        );
        if (name === 'Ribbon No. 45') {
          const background = await visual
            .locator('.designer-drawing > svg > rect')
            .getAttribute('fill');
          await visual.getByRole('button', { name: 'Artista central', exact: true }).click();
          await visual.getByRole('button', { name: 'Tinta', exact: true }).click();
          const palette = page.locator('.color-popover:visible');
          assert.equal(await palette.locator('.color-swatches button').count(), 30);
          await palette.getByLabel('Hexadecimal de Tinta', { exact: true }).fill('#ab12cd');
          await palette.getByRole('button', { name: 'Listo', exact: true }).click();
          assert.equal(
            await visual.locator('.designer-drawing > svg > rect').getAttribute('fill'),
            background,
          );
          assert.equal(
            await visual
              .locator('.designer-drawing svg text')
              .filter({ hasText: 'Artista A / Artista B' })
              .getAttribute('fill'),
            '#ab12cd',
          );
          await page.screenshot({
            path: '.test-artifacts/integrated-editor-' + width + '.png',
            fullPage: true,
          });
        }
        await visual
          .getByRole('button', { name: 'Cerrar editor de plantilla', exact: true })
          .click();
        await visual.waitFor({ state: 'detached' });
      }
      const create = page
        .locator('.page-actions')
        .getByRole('button', { name: 'Crear plantilla', exact: true });
      await create.click();
      const editor = page.locator('.template-designer');
      await editor.waitFor();
      await editor.getByLabel('Nombre', { exact: true }).fill('Plantilla navegador ' + width);
      assert.equal(await editor.locator('.designer-layers li').count(), 3);
      // Carga real de las fuentes locales y elección con muestra en el selector compartido.
      const loaded = await page.evaluate(async () => {
        const families = ['Courier Prime', 'Cutive Mono', 'Special Elite', 'IBM Plex Mono'];
        return Promise.all(
          families.map(async (family) => {
            const faces = await document.fonts.load('20px "' + family + '"', 'ÁÉÍÓÚ ñ 45 RPM');
            return {
              family,
              loaded: faces.length > 0 && faces.every((face) => face.status === 'loaded'),
            };
          }),
        );
      });
      assert.ok(
        loaded.every((font) => font.loaded),
        'Fuentes reales cargadas, sin sustitución',
      );
      await editor.locator('.font-picker summary').click();
      const fontSearch = editor.getByRole('searchbox', {
        name: 'Buscar Fuente de la capa',
        exact: true,
      });
      const firstFamilies = await editor.locator('.font-options button small').allTextContents();
      assert.deepEqual(
        firstFamilies.slice(0, 4).map((text) => text.split(' · ')[0]),
        ['Courier Prime', 'Cutive Mono', 'Special Elite', 'IBM Plex Mono'],
      );
      await fontSearch.fill('typewriter');
      assert.equal(await editor.locator('.font-options button').count(), 5);
      await fontSearch.fill('maquina');
      assert.equal(await editor.locator('.font-options button').count(), 5);
      await fontSearch.fill('sin coincidencias');
      assert.ok(
        await editor.getByText('No hay fuentes con ese nombre.', { exact: true }).isVisible(),
      );
      await fontSearch.fill('Courier');
      const courier = editor.locator('.font-options button').filter({ hasText: 'Courier Prime' });
      await courier.waitFor();
      assert.ok(
        await courier
          .locator('span')
          .evaluate((node) => getComputedStyle(node).fontFamily.includes('Courier Prime')),
      );
      await courier.click();
      assert.equal(
        await editor.locator('.designer-drawing svg text').first().getAttribute('font-family'),
        'Courier Prime',
      );
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
      const rect = await stage.boundingBox();
      const from = { x: rect.x + (61 * rect.width) / 300, y: rect.y + (80 * rect.height) / 150 };
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(from.x + (16 * rect.width) / 300, from.y + (10 * rect.height) / 150, {
        steps: 5,
      });
      await page.mouse.up();
      assert.equal(await editor.getByLabel('X', { exact: true }).inputValue(), '27');
      assert.equal(await editor.getByLabel('Y', { exact: true }).inputValue(), '65');
      const handle = editor.locator('.designer-resize');
      const handleRect = await handle.boundingBox();
      await page.mouse.move(
        handleRect.x + handleRect.width / 2,
        handleRect.y + handleRect.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        handleRect.x + handleRect.width / 2 + (20 * rect.width) / 300,
        handleRect.y + handleRect.height / 2 + (10 * rect.height) / 150,
        { steps: 5 },
      );
      await page.mouse.up();
      assert.equal(await editor.getByLabel('Ancho', { exact: true }).inputValue(), '120');
      assert.equal(await editor.getByLabel('Alto', { exact: true }).inputValue(), '60');
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
      // El pie mantiene los tres controles dentro de la tarjeta en todos los anchos.
      const footer = await card.locator('.template-info').evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        return {
          left: bounds.left,
          right: bounds.right,
          top: bounds.top,
          bottom: bounds.bottom,
          buttons: Array.from(node.querySelectorAll('.template-actions button')).map((button) => {
            const rect = button.getBoundingClientRect();
            return {
              left: rect.left,
              right: rect.right,
              top: rect.top,
              bottom: rect.bottom,
              width: rect.width,
              height: rect.height,
            };
          }),
        };
      });
      assert.equal(footer.buttons.length, 3, 'Las acciones propias están dentro del pie');
      assert.ok(
        footer.buttons.every((button) => button.width === 42 && button.height === 42),
        'Controles del mismo tamaño',
      );
      assert.ok(
        footer.buttons.every(
          (button) =>
            button.left >= footer.left &&
            button.right <= footer.right &&
            button.top >= footer.top &&
            button.bottom <= footer.bottom,
        ),
        'Acciones contenidas en el pie',
      );
      assert.ok(
        footer.buttons.every((button) => Math.abs(button.top - footer.buttons[0].top) < 1),
        'Acciones alineadas',
      );
      assert.equal(await card.locator('.template-info').getByText('↗', { exact: true }).count(), 0);
      await card.screenshot({ path: '.test-artifacts/compact-template-' + width + '.png' });

      await page
        .locator('.template-entry')
        .filter({ has: card })
        .getByRole('button', { name: 'Editar plantilla Plantilla navegador ' + width, exact: true })
        .click();
      await editor.waitFor();
      assert.equal(
        await editor.getByLabel('Nombre', { exact: true }).inputValue(),
        'Plantilla navegador ' + width,
      );
      assert.equal(await editor.locator('.designer-layers li').count(), 5);
      assert.equal(
        await editor.locator('.designer-drawing svg text').first().getAttribute('font-family'),
        'Courier Prime',
      );
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
