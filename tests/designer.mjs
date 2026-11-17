import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { DOMParser } from 'linkedom';
import { test } from 'node:test';

const context = { DOMParser, StudioComponents: {}, crypto: globalThis.crypto };
vm.runInNewContext(readFileSync('src/designer.js', 'utf8'), context);
const tools = context.StudioTemplateTools;
const fit = (value, font, px, width) => {
  const text = String(value);
  const max = Math.floor(width / (px * 0.6));
  return {
    text: text.length > max ? text.slice(0, Math.max(0, max - 1)) + '…' : text,
    truncated: text.length > max,
  };
};
const sample = {
  artist: 'Uno',
  artistB: 'Dos',
  a: 'Primera',
  b: 'Segunda',
  ink: '#123456',
  artistInk: '#654321',
  paper: '#ffffff',
  font: 'Arial',
  titlePx: 20,
  artistPx: 19,
  showGenre: true,
  showRpm: true,
  showNumber: true,
};

test('campos vinculados, color, visibilidad, orden y recorte usan el mismo dibujo', () => {
  const t = tools.newTemplate();
  const card = { ...sample, customDesign: t.design };
  let svg = tools.render(card, { width: 76, height: 38 }, { fit });
  assert.match(svg, />Uno \/ Dos</);
  assert.match(svg, />Primera</);
  assert.match(svg, /fill="#123456"/);
  card.a = 'W'.repeat(80);
  assert.equal(tools.overflow(card, 'a', fit), true);
  assert.match(tools.render(card, { width: 76, height: 38 }, { fit }), /…<\/text>/);
  card.titlePx = 4;
  assert.equal(tools.overflow(card, 'a', fit), false);
  const metadata = tools.element('text', 'rpm');
  t.design.elements.push(metadata);
  card.rpm = '45 RPM';
  assert.match(tools.render(card, { width: 76, height: 38 }, { fit }), />45 RPM</);
  card.showRpm = false;
  assert.doesNotMatch(tools.render(card, { width: 76, height: 38 }, { fit }), />45 RPM</);
  t.design.elements[0].visible = false;
  assert.equal(tools.overflow(card, 'a', fit), false);
  assert.doesNotMatch(tools.render(card, { width: 76, height: 38 }, { fit }), />WW/);
});

test('SVG importado conserva gráficos, transformaciones y degradados sin contenido activo', () => {
  const source =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" onload="alert(1)"><defs><linearGradient id="g"><stop offset="0" stop-color="#ff0000"/></linearGradient></defs><g transform="translate(2 3)" style="fill:url(#g);stroke:#000000"><path d="M0 0H90V40Z"/></g><use href="#g"/><script>alert(1)</script><foreignObject><iframe src="https://evil.invalid"/></foreignObject><image href="https://evil.invalid/x"/><a href="javascript:alert(1)"><rect width="4"/></a></svg>';
  const clean = tools.sanitizeSvg(source);
  assert.match(clean, /linearGradient/);
  assert.match(clean, /fill="url\(#asset-0\)"/);
  assert.match(clean, /transform="translate\(2 3\)"/);
  assert.doesNotMatch(clean, /onload|script|foreignObject|iframe|evil|javascript|<image|<a /);
  assert.throws(() => tools.sanitizeSvg('<!DOCTYPE svg><svg/>'));
  assert.throws(() => tools.sanitizeSvg('x'.repeat(1000001)));
  const t = tools.newTemplate();
  t.design.elements.push({ ...tools.element('svg'), svg: source, width: 100, height: 50 });
  const card = { ...sample, customDesign: t.design };
  const output = tools.render(card, { width: 76, height: 38 }, { fit });
  assert.doesNotMatch(decodeURIComponent(output), /evil|onload|alert/);
  assert.match(output, /data:image\/svg\+xml/);
});

test('normalización limita valores, rechaza recursos y conserva copias transportables', () => {
  const t = tools.newTemplate();
  t.id = 'custom-example';
  t.name = 'Transportable';
  t.design.elements[0].x = -999;
  t.design.elements[0].fontSize = Infinity;
  const normalized = tools.normalizeTemplate(t);
  assert.equal(normalized.design.elements[0].x, 0);
  assert.equal(normalized.design.elements[0].fontSize, 20);
  assert.equal(tools.normalizeTemplate(JSON.parse(JSON.stringify(normalized))).id, t.id);
  assert.throws(() => tools.normalizeDesign({ elements: Array(81).fill(tools.element()) }));
  assert.throws(() =>
    tools.normalizeDesign({
      elements: [{ ...tools.element('image'), src: 'https://evil.invalid' }],
    }),
  );
  assert.throws(() => tools.normalizeDesign({ elements: [{ type: 'foreignObject' }] }));
  const copy = tools.clone(normalized);
  copy.design.elements[0].x = 80;
  assert.equal(normalized.design.elements[0].x, 0);
});

test('edición local: deshacer, rehacer, ordenar y duplicar no modifican el original', () => {
  const component = context.StudioComponents.TemplateDesigner;
  const initial = tools.newTemplate();
  const editor = component.data.call({ initial });
  for (const [key, method] of Object.entries(component.methods)) editor[key] = method.bind(editor);
  Object.defineProperties(editor, {
    layers: { get: () => editor.model.design.elements },
    selectedLayer: { get: () => editor.layers.find((e) => e.id === editor.selectedId) },
  });
  component.mounted.call(editor);
  const original = JSON.stringify(initial);
  editor.add('rect');
  editor.remember();
  assert.equal(editor.layers.length, 4);
  editor.undo();
  assert.equal(editor.layers.length, 3);
  editor.redo();
  assert.equal(editor.layers.length, 4);
  editor.selectedId = editor.layers[0].id;
  editor.align('center');
  assert.equal(editor.selectedLayer.x, 10);
  editor.duplicate();
  assert.equal(editor.layers.length, 5);
  editor.order(-1);
  assert.equal(editor.layers[3].id, editor.selectedId);
  editor.remove();
  assert.equal(editor.layers.length, 4);
  assert.equal(JSON.stringify(initial), original);
});

test('una plantilla integrada se convierte en campos y gráficos independientes', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150">' +
    '<rect width="300" height="150" fill="#ffffff"/>' +
    '<path d="M10 50H290" fill="none" stroke="#654321" stroke-width="3"/>' +
    '<rect x="10" y="58" width="280" height="34" fill="#654321"/>' +
    '<text data-disc-field="a" data-disc-width="280" x="150" y="37" text-anchor="middle" dominant-baseline="middle" font-family="Courier Prime" font-size="24px" fill="#123456">Muestra</text>' +
    '<text data-disc-field="artist" data-disc-width="260" x="150" y="75" text-anchor="middle" dominant-baseline="middle" font-family="Oswald" font-size="19px" fill="#ffffff">Artista</text>' +
    '</svg>';
  const converted = tools.fromBuiltinSvg(svg, {
    ...sample,
    name: 'Integrada',
    graphicsInk: '#654321',
  });
  assert.equal(converted.id, '');
  assert.equal(converted.design.elements.length, 4);
  assert.equal(converted.design.elements[0].type, 'svg');
  assert.equal(converted.design.elements[1].type, 'rect');
  const title = converted.design.elements.find((e) => e.field === 'a');
  assert.equal(title.width, 280);
  assert.equal(title.font, 'Courier Prime');
  assert.equal(title.fontSize, 24);
  assert.equal(title.baseline, 'middle');
  const artist = converted.design.elements.find((e) => e.field === 'artist');
  assert.equal(artist.colorRole, 'artistInk');
  assert.equal(converted.artistInk, '#ffffff');
  const card = {
    ...sample,
    graphicsInk: '#abcdef',
    paper: '#eeeeee',
    customDesign: converted.design,
  };
  const rendered = tools.render(card, { width: 76, height: 38 }, { fit });
  assert.match(rendered, />Primera</);
  assert.match(rendered, /fill="#eeeeee"/);
  assert.match(decodeURIComponent(rendered), /stroke="#abcdef"/);
  const cloned = tools.clone(converted);
  cloned.design.elements[2].x = 88;
  assert.notEqual(converted.design.elements[2].x, 88);
  assert.equal(
    tools.normalizeTemplate(JSON.parse(JSON.stringify(converted))).design.elements.length,
    4,
  );
});

test('la búsqueda de fuentes admite nombres, estilo de máquina y acentos', () => {
  const shared = {};
  vm.runInNewContext(readFileSync('src/components.js', 'utf8'), shared);
  const picker = shared.StudioComponents.FontPicker;
  const options = [
    {
      value: 'Courier Prime',
      label: 'Courier Prime · Máquina clásica',
      keywords: 'typewriter máquina',
    },
    {
      value: 'Special Elite',
      label: 'Special Elite · Máquina desgastada',
      keywords: 'typewriter máquina',
    },
    { value: 'Arial', label: 'Arial · Sans' },
  ];
  for (const query of ['maquina', 'máquina', 'typewriter']) {
    assert.equal(picker.computed.matchingFonts.call({ query, options }).length, 2);
  }
  assert.equal(
    picker.computed.matchingFonts.call({ query: 'Courier', options })[0].value,
    'Courier Prime',
  );
  assert.equal(picker.computed.matchingFonts.call({ query: 'inexistente', options }).length, 0);
});

test('el artista en inversa mantiene su color al cambiar el papel y admite otro color', () => {
  const legacy = tools.newTemplate();
  legacy.paper = '#ffffff';
  legacy.design.elements[1].colorRole = 'paper';
  legacy.design.elements[1].fill = '#ffffff';
  const template = tools.normalizeTemplate(legacy);
  assert.equal(template.artistInk, '#ffffff');
  assert.equal(template.design.elements[1].colorRole, 'artistInk');
  const card = {
    ...sample,
    ...template,
    paper: '#ffcc00',
    artistInk: '#ab12cd',
    customDesign: template.design,
  };
  const rendered = tools.render(card, { width: 76, height: 38 }, { fit });
  assert.match(rendered, /fill="#ab12cd"[^>]*>Uno \/ Dos</);
  assert.match(rendered, /fill="#ffcc00"/);
});

test('paleta compartida incluye colores de recursos y elimina duplicados', () => {
  const shared = {};
  vm.runInNewContext(readFileSync('src/components.js', 'utf8'), shared);
  const colors = shared.StudioColorTools;
  assert.ok(colors.baseColors.includes('#b9553b'));
  assert.ok(colors.baseColors.includes('#213d36'));
  assert.deepEqual(
    Array.from(
      colors.collect([
        { ink: '#ABCDEF', svg: '<path fill="#abcdef" stroke="#123456"/>' },
        '#123456',
      ]),
    ),
    ['#abcdef', '#123456'],
  );
  for (const hex of ['#000000', '#ffffff', '#ab12cd', '#00ff00', '#808080']) {
    const { h, s, v } = colors.fromHex(hex);
    assert.equal(colors.toHex(h, s, v), hex);
  }
});

test('personalizar usa un borrador y solo guardar añade y aplica el color', () => {
  const shared = {};
  vm.runInNewContext(readFileSync('src/components.js', 'utf8'), shared);
  const component = shared.StudioComponents.ColorPicker;
  const emitted = [],
    added = [];
  const picker = {
    ...component.data.call({}),
    modelValue: '#ffffff',
    studioPalette: { add: (color) => added.push(color) },
    $emit: (...args) => emitted.push(args),
  };
  for (const [key, method] of Object.entries(component.methods)) picker[key] = method.bind(picker);
  picker.customize();
  picker.editHex('#ab12cd');
  assert.equal(emitted.length, 0);
  assert.equal(added.length, 0);
  picker.customOpen = false;
  picker.customize();
  assert.equal(picker.hex, '#ffffff');
  picker.editHex('#12');
  picker.saveColor();
  assert.equal(emitted.length, 0);
  picker.editHex('#ab12cd');
  picker.saveColor();
  assert.deepEqual(added, ['#ab12cd']);
  assert.deepEqual(emitted, [['update:modelValue', '#ab12cd']]);
  assert.equal(picker.customOpen, false);
});
