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
  async function checkViewport(width) {
    const start = performance.now();
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
      if (width === 360) {
        await page
          .locator('.icon-rail')
          .getByRole('button', { name: 'Impresión y salida', exact: true })
          .click();
        assert.equal(
          await page.getByRole('button', { name: /Imprimir con el navegador/ }).count(),
          0,
        );
        const pdf = page.getByRole('button', { name: /Descargar PDF · 1:1/ });
        const downloadReady = page.waitForEvent('download');
        await pdf.click();
        const download = await downloadReady;
        assert.match(download.suggestedFilename(), /-1a1\.pdf$/);
        assert.ok(
          (await readFile(await download.path())).subarray(0, 5).equals(Buffer.from('%PDF-')),
        );
      }
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
      const styleModal = page.locator('.style-modal:visible');
      await page.getByRole('button', { name: 'Valores de plantilla Ribbon No. 45' }).click();
      const styleTitle = styleModal.getByRole('heading', {
        name: 'Estilo del diseño',
        exact: true,
      });
      await styleTitle.waitFor();
      assert.ok(
        await styleTitle.evaluate(
          (node) => node.offsetHeight <= parseFloat(getComputedStyle(node).lineHeight) + 1,
        ),
      );
      const styleHeader = styleModal.locator('.dialog-heading');
      const styleClose = styleModal.getByRole('button', { name: 'Cerrar estilos', exact: true });
      const headerPositions = await Promise.all([
        styleClose.boundingBox(),
        styleTitle.boundingBox(),
        styleHeader.boundingBox(),
      ]);
      assert.ok(
        headerPositions[0].x < headerPositions[1].x,
        'Cerrar queda a la izquierda del título',
      );
      assert.ok(
        Math.abs(
          headerPositions[1].x +
            headerPositions[1].width / 2 -
            headerPositions[2].x -
            headerPositions[2].width / 2,
        ) < 3,
        'El título queda centrado en el modal',
      );
      const chooseStyleFont = async (label, name) => {
        const picker = styleModal.locator('.font-picker').filter({ hasText: label });
        await picker.locator('summary').click();
        await picker.getByRole('button', { name }).click();
      };
      if (width === 360) {
        await chooseStyleFont('Fuente canciones', /Monoespaciada/);
        assert.equal(
          await styleModal
            .locator('.custom-style-preview svg text')
            .first()
            .getAttribute('font-family'),
          'monospace',
        );
      }
      await styleModal.getByRole('button', { name: 'Cerrar estilos' }).click();
      await styleModal.waitFor({ state: 'hidden' });
      if (width === 360) {
        const ribbon = page.getByRole('button', { name: 'Valores de plantilla Ribbon No. 45' });
        await ribbon.click();
        const chooseColor = async (label, choice) => {
          await styleModal.getByRole('button', { name: label, exact: true }).click();
          await page
            .locator('.color-popover:visible')
            .getByRole('button', { name: choice })
            .click();
        };
        const preview = styleModal.locator('.custom-style-preview svg');
        const song = preview.locator('text').first();
        const artist = preview.locator('text').filter({ hasText: /Elvis Presley/i });
        await chooseColor('Color canciones', 'Usar Automático');
        await chooseColor('Color artista', 'Usar Automático');
        const songInk = await song.getAttribute('fill');
        const artistInk = await artist.getAttribute('fill');
        await chooseColor('Color del papel', 'Usar Negro #000000');
        assert.notEqual(await song.getAttribute('fill'), songInk);
        assert.equal(await song.getAttribute('fill'), '#ffffff');
        assert.equal(await artist.getAttribute('fill'), artistInk);
        await chooseColor('Color de elementos gráficos', 'Usar Amarillo #FFFF00');
        assert.notEqual(await artist.getAttribute('fill'), artistInk);
        assert.equal(await artist.getAttribute('fill'), '#0000ff');
        await styleModal
          .getByRole('button', { name: 'Color de elementos gráficos', exact: true })
          .click();
        const swatches = page.locator('.color-popover:visible');
        const pink = swatches.getByRole('button', { name: 'Usar Rosa #FF69B4', exact: true });
        const yellow = swatches.getByRole('button', { name: 'Usar Amarillo #FFFF00', exact: true });
        const orange = swatches.getByRole('button', { name: 'Usar Naranja #FF8000', exact: true });
        const textColor = (swatch) =>
          swatch.locator('span').evaluate((el) => getComputedStyle(el).color);
        assert.equal(await textColor(pink), 'rgb(255, 255, 255)');
        assert.equal(await textColor(yellow), 'rgb(0, 0, 255)');
        assert.equal(await textColor(orange), 'rgb(255, 255, 255)');
        await orange.click();
        assert.equal(await artist.getAttribute('fill'), '#ffffff');
        await swatches.waitFor({ state: 'hidden' });
        await preview.screenshot({ path: '.test-artifacts/tinta-naranja-movil.png' });
        await chooseColor('Color de elementos gráficos', 'Usar Rosa #FF69B4');
        assert.equal(await artist.getAttribute('fill'), '#ffffff');
        await swatches.waitFor({ state: 'hidden' });
        await preview.screenshot({ path: '.test-artifacts/tinta-rosa-intenso-movil.png' });
        const chooseCustomBackground = async (label, hex) => {
          const palette = page.locator('.color-popover:visible');
          await styleModal.getByRole('button', { name: label, exact: true }).click();
          await palette.getByRole('button', { name: 'Personalizar color…' }).click();
          await page.getByRole('textbox', { name: 'Hexadecimal de ' + label }).fill(hex);
          await page.getByRole('button', { name: 'Guardar color', exact: true }).click();
          await palette.getByRole('button', { name: new RegExp('Usar Custom .*' + hex) }).click();
        };
        await chooseCustomBackground('Color del papel', '#ED649E');
        await chooseCustomBackground('Color de elementos gráficos', '#F9C1D8');
        assert.equal(await song.getAttribute('fill'), '#ffffff');
        assert.equal(await artist.getAttribute('fill'), '#000000');
        await page.locator('.color-popover:visible').waitFor({ state: 'hidden' });
        await styleModal.screenshot({
          path: '.test-artifacts/tinta-rosa-movil.png',
          animations: 'disabled',
        });
        await styleModal.getByRole('button', { name: 'Guardar estilo' }).click();
        await styleModal.waitFor({ state: 'hidden' });
        await page.reload();
        await ribbon.click();
        await styleModal.getByRole('button', { name: 'Color canciones' }).click();
        const automatic = page
          .locator('.color-popover:visible')
          .getByRole('button', { name: 'Usar Automático' });
        await automatic.waitFor();
        assert.equal(await automatic.getAttribute('aria-pressed'), 'true');
        await automatic.hover();
        await page.screenshot({
          path: '.test-artifacts/tinta-automatica-movil.png',
          animations: 'disabled',
        });
        await automatic.click();
        await styleModal.getByRole('button', { name: 'Cerrar estilos' }).click();
        await styleModal.waitFor({ state: 'hidden' });
        // Las demás pruebas parten del catálogo original.
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page
          .locator('.icon-rail')
          .getByRole('button', { name: 'Diseños y plantillas', exact: true })
          .click();
      }
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
          await palette.locator('.color-choice').first().waitFor();
          // La animación del menú escala sus medidas hasta que termina.
          await palette.locator('.color-choice').first().hover();
          assert.equal(
            await palette.locator('.color-choice > span').filter({ hasNotText: 'Custom' }).count(),
            17,
          );
          await palette.getByRole('button', { name: 'Usar Rojo #FF0000', exact: true }).waitFor();
          const paperRow = palette.locator('.color-row').nth(1);
          assert.ok((await paperRow.innerText()).includes('Papel actual'));
          assert.ok((await paperRow.innerText()).includes(background.toUpperCase()));
          const colorControls = await visual.locator('.designer-color-row').evaluateAll((rows) =>
            rows.map((row) =>
              Array.from(row.querySelectorAll('select, .color-trigger'), (control) => {
                const rect = control.getBoundingClientRect();
                return {
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                  center: rect.top + rect.height / 2,
                };
              }),
            ),
          );
          assert.equal(colorControls.length, 2);
          for (const [select, picker] of colorControls) {
            assert.ok(Math.abs(select.height - 42) < 0.1 && Math.abs(picker.height - 42) < 0.1);
            assert.ok(Math.abs(select.center - picker.center) < 1 && select.left < picker.left);
          }
          assert.equal(colorControls[0][1].left, colorControls[1][1].left);
          assert.equal(colorControls[0][1].width, colorControls[1][1].width);
          const inkLink = visual.getByRole('combobox', { name: 'Vincular tinta con', exact: true });
          const backgroundLink = visual.getByRole('combobox', {
            name: 'Vincular fondo con',
            exact: true,
          });
          assert.deepEqual(await inkLink.locator('option').allTextContents(), [
            'Color de canción',
            'Color de artista',
            'Color de elementos',
            'Color de papel',
            'Color propio',
          ]);
          assert.deepEqual(
            await backgroundLink.locator('option').allTextContents(),
            await inkLink.locator('option').allTextContents(),
          );
          assert.equal(await backgroundLink.inputValue(), 'fixed');
          const colorRows = await palette.locator('.color-row').evaluateAll((nodes) =>
            nodes.map((node) => {
              const rect = node.getBoundingClientRect();
              return {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                text: node.textContent,
              };
            }),
          );
          assert.ok(
            colorRows.every(
              (row) => row.height === 40 && Math.abs(row.left - colorRows[0].left) < 1,
            ),
            'Un color por fila',
          );
          assert.ok(colorRows[2].text.includes('Automático'));
          assert.ok(colorRows[8].text.includes('Rojo') && colorRows[8].text.includes('#FF0000'));
          await palette.screenshot({ path: '.test-artifacts/palette-rows-' + width + '.png' });
          assert.equal(
            await palette.locator('input').count(),
            0,
            'La paleta rápida no tiene campos de edición',
          );
          assert.ok(
            (await palette.locator('.color-choice').first().innerText()).includes('Transparente'),
          );
          assert.equal(
            await palette.locator('.color-swatches > :last-child').innerText(),
            'Personalizar color…',
          );
          await palette.getByRole('button', { name: 'Personalizar color…', exact: true }).click();
          const customColor = page.locator('.color-custom-modal:visible');
          await customColor.waitFor();
          const beforeColor = await visual
            .locator('.designer-drawing svg text')
            .filter({ hasText: 'Artista A / Artista B' })
            .getAttribute('fill');
          await customColor.getByLabel('Hexadecimal de Tinta', { exact: true }).fill('#123abc');
          await customColor.getByRole('button', { name: 'Cancelar', exact: true }).click();
          await customColor.waitFor({ state: 'hidden' });
          assert.equal(
            await visual
              .locator('.designer-drawing svg text')
              .filter({ hasText: 'Artista A / Artista B' })
              .getAttribute('fill'),
            beforeColor,
          );
          await visual.getByRole('button', { name: 'Tinta', exact: true }).click();
          await palette.getByRole('button', { name: 'Personalizar color…', exact: true }).click();
          await customColor.waitFor();
          // La rueda y las acciones deben caber juntas incluso con poca altura útil.
          await page.setViewportSize({ width, height: 560 });
          await customColor.getByLabel('Hexadecimal de Tinta', { exact: true }).click();
          await page.waitForFunction(() => {
            const input = document.querySelector('.color-custom-modal input[type="text"]');
            return input && Math.abs(input.getBoundingClientRect().height - 42) < 0.01;
          });
          const compactLayout = await customColor.evaluate((node) => {
            const bounds = node.getBoundingClientRect();
            const controls = Array.from(
              node.querySelectorAll(
                '.color-custom-value input, .color-custom-value button, .color-sample',
              ),
            ).map((control) => {
              const r = control.getBoundingClientRect();
              return {
                width: r.width,
                height: r.height,
                center: r.top + r.height / 2,
                left: r.left,
                right: r.right,
              };
            });
            const wheel = node.querySelector('.color-wheel').getBoundingClientRect();
            return {
              left: bounds.left,
              right: bounds.right,
              top: bounds.top,
              bottom: bounds.bottom,
              overflow: node.scrollWidth - node.clientWidth,
              controls,
              wheelTop: wheel.top,
              wheelBottom: wheel.bottom,
            };
          });
          // Las animaciones pueden dejar diferencias de milésimas de píxel.
          const near42 = (value) => Math.abs(value - 42) < 0.1;
          assert.ok(
            compactLayout.left >= 0 &&
              compactLayout.right <= width + 1 &&
              compactLayout.top >= 0 &&
              compactLayout.bottom <= 560,
            'Modal completo en pantalla',
          );
          assert.ok(compactLayout.overflow <= 1, 'Sin desbordamiento horizontal');
          assert.ok(
            compactLayout.controls.every(
              (control) =>
                near42(control.height) &&
                Math.abs(control.center - compactLayout.controls[0].center) < 1,
            ),
            'Muestra, campo e iconos alineados',
          );
          assert.ok(
            compactLayout.controls.slice(2).every((control) => near42(control.width)),
            'Iconos homogéneos',
          );
          assert.ok(
            compactLayout.wheelTop >= compactLayout.top &&
              compactLayout.wheelBottom <= compactLayout.bottom,
            'Rueda completa',
          );
          await customColor.screenshot({ path: '.test-artifacts/compact-color-' + width + '.png' });
          const wheel = customColor.getByRole('group', { name: 'Rueda cromática', exact: true });
          await wheel.click({ position: { x: 150, y: 80 } });
          assert.match(
            await customColor.getByLabel('Hexadecimal de Tinta', { exact: true }).inputValue(),
            /^#[0-9a-f]{6}$/i,
          );
          await customColor.getByLabel('Hexadecimal de Tinta', { exact: true }).fill('#ab12cd');
          await customColor.getByRole('button', { name: 'Guardar color', exact: true }).click();
          await customColor.waitFor({ state: 'hidden' });
          await page.setViewportSize({ width, height: 900 });

          // Guardar añade al final, pero no cambia aún el color del artista.
          await palette
            .getByRole('button', { name: 'Usar Custom 1 #AB12CD', exact: true })
            .waitFor();
          assert.equal(
            await visual
              .locator('.designer-drawing svg text')
              .filter({ hasText: 'Artista A / Artista B' })
              .getAttribute('fill'),
            beforeColor,
          );
          await palette.getByRole('button', { name: 'Personalizar color…', exact: true }).click();
          await customColor.getByLabel('Hexadecimal de Tinta', { exact: true }).fill('#12abcd');
          await customColor.getByRole('button', { name: 'Guardar color', exact: true }).click();
          await customColor.waitFor({ state: 'hidden' });
          const customNames = await palette
            .locator('.color-choice')
            .filter({ hasText: 'Custom' })
            .allTextContents();
          assert.equal(customNames.length, 2);
          assert.ok(customNames[0].includes('Custom 1') && customNames[1].includes('Custom 2'));
          assert.ok(customNames[0].includes('#AB12CD') && customNames[1].includes('#12ABCD'));
          await palette.getByRole('button', { name: 'Usar Custom 1 #AB12CD', exact: true }).click();
          await visual.getByRole('button', { name: 'Tinta', exact: true }).click();
          await palette
            .getByRole('button', { name: 'Eliminar color #AB12CD', exact: true })
            .click();
          await palette
            .getByRole('button', { name: 'Usar Custom 1 #AB12CD', exact: true })
            .waitFor({ state: 'detached' });
          assert.equal(
            await visual
              .locator('.designer-drawing svg text')
              .filter({ hasText: 'Artista A / Artista B' })
              .getAttribute('fill'),
            '#ab12cd',
          );
          // Volver a crear el eliminado lo sitúa detrás del resto de Custom.
          await palette.getByRole('button', { name: 'Personalizar color…', exact: true }).click();
          await customColor.getByLabel('Hexadecimal de Tinta', { exact: true }).fill('#ab12cd');
          await customColor.getByRole('button', { name: 'Guardar color', exact: true }).click();
          await customColor.waitFor({ state: 'hidden' });
          const recreated = await palette
            .locator('.color-choice')
            .filter({ hasText: 'Custom' })
            .allTextContents();
          assert.ok(recreated[0].includes('#12ABCD') && recreated[1].includes('#AB12CD'));
          assert.ok(recreated[0].includes('Custom 1') && recreated[1].includes('Custom 2'));
          await palette.getByRole('button', { name: 'Usar Custom 2 #AB12CD', exact: true }).click();
          await palette.waitFor({ state: 'hidden' });
          await visual.getByRole('button', { name: 'Papel', exact: true }).click();
          await palette
            .getByRole('button', { name: 'Usar Custom 2 #AB12CD', exact: true })
            .waitFor();
          await page.keyboard.press('Escape');
          await palette.waitFor({ state: 'hidden' });
          // El fondo de cada texto es independiente de la tinta y del papel.
          await visual.getByRole('button', { name: 'Fondo', exact: true }).click();
          await palette.getByRole('button', { name: 'Usar Rojo #FF0000', exact: true }).click();
          assert.equal(
            await visual.locator('[data-text-background]').getAttribute('fill'),
            '#ff0000',
          );
          await palette.waitFor({ state: 'hidden' });
          await visual.getByRole('button', { name: 'Fondo', exact: true }).click();
          await palette
            .getByRole('button', { name: 'Usar Transparente #00000000', exact: true })
            .click();
          await visual.locator('[data-text-background]').waitFor({ state: 'detached' });
          const savedColor = await page.evaluate(
            () => JSON.parse(localStorage.getItem('title-studio-v3')).settings.colorPalette,
          );
          assert.ok(savedColor.includes('#ab12cd'));
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
          // Al cambiar el papel, el acceso directo se actualiza en otro selector.
          await palette.waitFor({ state: 'hidden' });
          await visual.getByRole('button', { name: 'Papel', exact: true }).click();
          await palette.getByRole('button', { name: 'Usar Azul #0000FF', exact: true }).click();
          await palette.waitFor({ state: 'hidden' });
          await visual.getByRole('button', { name: 'Tinta', exact: true }).click();
          const previousInkRole = await inkLink.inputValue();
          await palette
            .getByRole('button', { name: 'Vincular a Papel actual #0000FF', exact: true })
            .click();
          assert.equal(await inkLink.inputValue(), 'paper');
          assert.equal(
            await visual
              .locator('.designer-drawing svg text')
              .filter({ hasText: 'Artista A / Artista B' })
              .getAttribute('fill'),
            '#0000ff',
          );
          await palette.waitFor({ state: 'hidden' });
          await inkLink.selectOption(previousInkRole);
          await visual.getByRole('button', { name: 'Tinta', exact: true }).click();
          await palette.getByRole('button', { name: 'Usar Custom 2 #AB12CD', exact: true }).click();
          await palette.waitFor({ state: 'hidden' });
          await visual.getByRole('button', { name: 'Fondo', exact: true }).click();
          await palette
            .getByRole('button', { name: 'Vincular a Papel actual #0000FF', exact: true })
            .click();
          assert.equal(await backgroundLink.inputValue(), 'paper');
          assert.equal(
            await visual.locator('[data-text-background]').getAttribute('fill'),
            '#0000ff',
          );
          await visual.getByRole('button', { name: 'Fondo', exact: true }).click();
          await palette.getByRole('button', { name: 'Usar Rojo #FF0000', exact: true }).click();
          assert.equal(
            await visual.locator('[data-text-background]').getAttribute('fill'),
            '#ff0000',
          );
          assert.equal(
            await visual.locator('.designer-drawing > svg > rect').getAttribute('fill'),
            '#ff0000',
          );
          await backgroundLink.selectOption('fixed');
          await visual.locator('[data-text-background]').waitFor({ state: 'detached' });
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
      if (width === 360) {
        const scroll = editor.locator('.designer-content');
        const close = editor.getByRole('button', { name: 'Cerrar editor de plantilla' });
        const save = editor.getByRole('button', { name: 'Guardar plantilla', exact: true });
        await close.hover();
        const bounds = async () => ({
          top: (await close.boundingBox()).y,
          bottom: (await save.boundingBox()).y,
        });
        const before = await bounds();
        await scroll.evaluate((node) => (node.scrollTop = node.scrollHeight));
        await page.waitForFunction(
          () => document.querySelector('.designer-content').scrollTop > 100,
        );
        const after = await bounds();
        assert.ok(Math.abs(before.top - after.top) < 1, JSON.stringify({ before, after }));
        assert.ok(Math.abs(before.bottom - after.bottom) < 1, JSON.stringify({ before, after }));
        assert.equal(Math.round((await save.boundingBox()).width), 30);
        assert.ok(await save.locator('span').isVisible());
        assert.equal(Math.round(before.top), Math.round(before.bottom));
        assert.ok(await editor.locator('.designer-cancel').isHidden());
        await scroll.evaluate((node) => (node.scrollTop = 0));
      }
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
      await page.waitForFunction(() => {
        const editor = document.querySelector('.template-designer');
        return editor.querySelectorAll('.font-options button').length === 5;
      });
      assert.equal(await editor.locator('.font-options button').count(), 5);
      await fontSearch.fill('maquina');
      await page.waitForFunction(() => {
        const editor = document.querySelector('.template-designer');
        return editor.querySelectorAll('.font-options button').length === 5;
      });
      assert.equal(await editor.locator('.font-options button').count(), 5);
      await fontSearch.fill('sin coincidencias');
      await editor.getByText('No hay fuentes con ese nombre.', { exact: true }).waitFor();
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
      await editor.getByLabel('Capa Actual', { exact: true }).fill('Fondo central');
      await editor.locator('.designer-stroke-width').fill('3');
      const borderRole = editor.getByRole('combobox', { name: 'Vincular trazo con', exact: true });
      assert.deepEqual(await borderRole.locator('option').allTextContents(), [
        'Color de canción',
        'Color de artista',
        'Color de elementos',
        'Color de papel',
        'Color propio',
      ]);
      await borderRole.selectOption('paper');
      assert.equal(await borderRole.inputValue(), 'paper');
      const borderPreview = editor.locator('.designer-drawing svg rect[stroke-width]').last();
      await editor.getByRole('button', { name: 'Papel', exact: true }).click();
      const borderPalette = page.locator('.color-popover:visible');
      await borderPalette.getByRole('button', { name: 'Usar Rojo #FF0000', exact: true }).click();
      assert.equal(await borderPreview.getAttribute('stroke'), '#ff0000');
      await editor
        .locator('.designer-border-row')
        .getByRole('button', { name: 'Color trazo', exact: true })
        .click();
      await page
        .getByRole('region', { name: 'Selector de Color trazo' })
        .getByRole('button', { name: 'Usar Verde #008000', exact: true })
        .click();
      assert.equal(await borderRole.inputValue(), 'fixed');
      assert.equal(await borderPreview.getAttribute('stroke'), '#008000');
      const borderControls = await editor
        .locator(
          '.designer-border-row:not(.designer-object-paint-row) input, .designer-border-row:not(.designer-object-paint-row) select, .designer-border-row:not(.designer-object-paint-row) .color-trigger',
        )
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const rect = node.getBoundingClientRect();
            return { top: rect.top, bottom: rect.bottom, height: rect.height };
          }),
        );
      assert.equal(borderControls.length, 3);
      assert.ok(
        borderControls.every((control) => Math.abs(control.bottom - borderControls[0].bottom) < 2),
      );
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
        await editor.getByLabel('Capa Actual', { exact: true }).inputValue(),
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
        for (let i = 0; i < 6; i += 2) {
          assert.ok(Math.abs(layout.inputs[i].top - layout.inputs[i + 1].top) < 1);
          assert.ok(layout.inputs[i].left < layout.inputs[i + 1].left);
        }

      // El candado protege la capa, mientras el ojo sigue controlando el dibujo.
      const lockName = 'Bloqueo de capa: adorno.svg';
      const lock = editor.getByRole('button', { name: lockName, exact: true });
      const eye = editor.getByRole('button', {
        name: 'Visibilidad de capa: adorno.svg',
        exact: true,
      });
      assert.equal(await lock.getAttribute('aria-pressed'), 'false');
      await lock.click();
      assert.equal(await lock.getAttribute('aria-pressed'), 'true');
      const row = editor.locator('.designer-layers li').filter({
        has: page.getByRole('button', { name: lockName, exact: true }),
      });
      const buttons = await row.locator('button.control-icon').evaluateAll((elements) =>
        elements.map((button) => {
          const rect = button.getBoundingClientRect();
          return { width: rect.width, height: rect.height, center: rect.top + rect.height / 2 };
        }),
      );
      assert.equal(buttons.length, 3);
      assert.ok(buttons.every((button) => button.width === 42 && button.height === 42));
      assert.ok(buttons.every((button) => Math.abs(button.center - buttons[0].center) < 1));
      await row.screenshot({ path: '.test-artifacts/locked-layer-' + width + '.png' });
      const image = editor.locator('.designer-drawing svg image');
      await eye.click();
      assert.equal(await eye.getAttribute('aria-pressed'), 'false');
      await image.waitFor({ state: 'detached' });
      await eye.click();
      assert.equal(await eye.getAttribute('aria-pressed'), 'true');
      await image.waitFor({ state: 'visible' });
      const xInput = editor.getByLabel('X', { exact: true });
      assert.ok(await xInput.isDisabled());
      assert.ok(await row.getByRole('button', { name: 'Eliminar capa: adorno.svg' }).isDisabled());
      assert.ok(await editor.getByRole('button', { name: 'Enviar capa hacia atrás' }).isDisabled());
      assert.equal(await handle.count(), 0);
      await editor.getByRole('button', { name: 'Eliminar capa: Título cara A' }).click();
      assert.equal(await editor.locator('.designer-layers li').count(), 4);
      assert.equal(await row.locator('.designer-layer-name').getAttribute('aria-pressed'), 'true');
      await editor.getByRole('button', { name: 'Deshacer en plantilla', exact: true }).click();
      assert.equal(await editor.locator('.designer-layers li').count(), 5);
      await stage.scrollIntoViewIfNeeded();
      const lockedRect = await stage.boundingBox();
      const lockX = lockedRect.x + (80 * lockedRect.width) / 300;
      const lockY = lockedRect.y + (110 * lockedRect.height) / 150;
      await page.mouse.click(lockX, lockY);
      assert.equal(
        await editor.getByLabel('Capa Actual', { exact: true }).inputValue(),
        'Título cara B',
      );
      await row.locator('.designer-layer-name').click();
      await stage.focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Delete');
      assert.equal(await xInput.inputValue(), '27');
      assert.equal(await editor.locator('.designer-layers li').count(), 5);
      await editor.getByRole('button', { name: 'Vaciar lienzo', exact: true }).click();
      assert.equal(await editor.locator('.designer-layers li').count(), 1);
      assert.equal(await lock.getAttribute('aria-pressed'), 'true');
      await editor.getByRole('button', { name: 'Deshacer en plantilla', exact: true }).click();
      assert.equal(await editor.locator('.designer-layers li').count(), 5);

      await editor
        .getByRole('button', { name: 'Exportar plantilla JSON', exact: true })
        .scrollIntoViewIfNeeded();
      const downloadPromise = page.waitForEvent('download');
      await editor.getByRole('button', { name: 'Exportar plantilla JSON', exact: true }).click();
      assert.equal((await downloadPromise).suggestedFilename(), 'title-studio-plantilla.json');
      await stage.scrollIntoViewIfNeeded();
      await page.screenshot({ path: '.test-artifacts/designer-' + width + '.png', fullPage: true });
      await editor.getByRole('button', { name: 'Título cara A', exact: true }).click();
      await editor.getByRole('button', { name: 'Fondo', exact: true }).click();
      await page.getByRole('button', { name: /Vincular a Papel actual/ }).click();
      await editor.getByRole('button', { name: 'Guardar plantilla', exact: true }).click();
      await editor.waitFor({ state: 'detached' });
      const card = page
        .locator('.template-card')
        .filter({ hasText: 'Plantilla navegador ' + width });
      await card.waitFor();
      await page.reload();
      await card.waitFor();
      await card.locator('.template-name').click();
      await styleTitle.waitFor();
      await styleModal.locator('.custom-style-preview svg image').waitFor({ state: 'visible' });
      await styleModal.getByRole('button', { name: 'Color del papel', exact: true }).click();
      await page.getByRole('button', { name: 'Usar Verde #008000', exact: true }).click();
      const linkedBackground = styleModal.locator('.custom-style-preview [data-text-background]');
      assert.equal(await linkedBackground.getAttribute('fill'), '#008000');
      const previewText = styleModal.locator('.custom-style-preview svg text');
      if (width === 360) {
        // La canción A tiene una fuente propia en su capa, asignada en el editor.
        assert.equal(await previewText.first().getAttribute('font-family'), 'Courier Prime');
        await chooseStyleFont('Fuente canciones', /Monoespaciada/);
        assert.equal(await previewText.first().getAttribute('font-family'), 'monospace');
        await chooseStyleFont('Fuente artista', /Arial · Sans/);
        assert.equal(
          await previewText.filter({ hasText: /Elvis Presley/i }).getAttribute('font-family'),
          'Arial',
        );
      }
      await styleModal.getByRole('button', { name: 'Guardar estilo' }).click();
      await styleModal.waitFor({ state: 'hidden' });
      if (width === 360) await page.reload();
      await card.locator('.template-name').click();
      assert.equal(await linkedBackground.getAttribute('fill'), '#008000');
      if (width === 360) {
        assert.equal(await previewText.first().getAttribute('font-family'), 'monospace');
        assert.equal(
          await previewText.filter({ hasText: /Elvis Presley/i }).getAttribute('font-family'),
          'Arial',
        );
        await styleModal.screenshot({ path: '.test-artifacts/style-font-360.png' });
      }
      await styleModal.getByRole('button', { name: 'Cerrar estilos' }).click();
      await styleModal.waitFor({ state: 'hidden' });
      await page
        .getByRole('button', { name: 'Editar plantilla Plantilla navegador ' + width, exact: true })
        .click();
      assert.equal(await lock.getAttribute('aria-pressed'), 'true');
      await lock.click();
      await editor.getByRole('button', { name: 'adorno.svg', exact: true }).click();
      assert.ok(await xInput.isEnabled());
      await editor.getByRole('button', { name: 'Cerrar editor de plantilla', exact: true }).click();
      await editor.waitFor({ state: 'detached' });
      assert.ok(
        await page.evaluate(() =>
          JSON.parse(localStorage.getItem('title-studio-v3')).settings.colorPalette.includes(
            '#ab12cd',
          ),
        ),
      );

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
        `PASS: editor real, importación, historial, guardado y medidas a ${width} px (${((performance.now() - start) / 1000).toFixed(1)} s)`,
      );
    } finally {
      await context.close();
    }
  }
  // Cada anchura utiliza su propia sesión y escribe capturas con nombres distintos.
  const results = await Promise.allSettled([360, 720, 1280].map(checkViewport));
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length) {
    throw new AggregateError(
      failures.map((failure) => failure.reason),
      'Fallaron las comprobaciones de navegador',
    );
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
