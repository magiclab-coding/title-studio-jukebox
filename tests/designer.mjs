import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { DOMParser } from 'linkedom';
import { test } from 'node:test';

const context = { DOMParser, StudioComponents: {}, crypto: globalThis.crypto };
vm.runInNewContext(readFileSync('src/components.js', 'utf8'), context);
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

test('la tinta automática persiste y contrasta con el papel, la cartela y el fondo propio', () => {
  const colors = context.StudioColorTools;
  assert.equal(colors.automaticInk('#000000'), '#ffffff');
  assert.equal(colors.automaticInk('#ffffff'), '#000000');
  assert.equal(colors.automaticInk('#ff0000'), '#000000');
  assert.equal(colors.automaticInk('#ffff00'), '#0000ff');
  for (const background of ['#ffffff', '#000000', '#777777', '#ff0000', '#0000ff', '#f6f5e7']) {
    const foreground = colors.automaticInk(background);
    const backdrop = colors.luminance(background) + 0.05;
    const ink = colors.luminance(foreground) + 0.05;
    const bestContrast = Math.max(backdrop / 0.05, 1.05 / backdrop);
    assert.ok(Math.max(ink / backdrop, backdrop / ink) >= Math.min(7, bestContrast), background);
  }
  const template = tools.newTemplate();
  const title = template.design.elements[0];
  template.ink = 'auto';
  title.colorRole = 'fixed';
  title.fill = 'auto';
  const panel = {
    ...tools.element('rect'),
    x: title.x,
    y: title.y,
    width: title.width,
    height: title.height,
    colorRole: 'fixed',
    fill: '#8000ff',
  };
  template.design.elements.unshift(panel);
  const restored = tools.normalizeTemplate(JSON.parse(JSON.stringify(template)));
  const card = { ...sample, ...restored, customDesign: restored.design };
  const layer = restored.design.elements[1];
  const renderedInk = () =>
    new DOMParser()
      .parseFromString(tools.render(card, { width: 76, height: 38 }, { fit }), 'image/svg+xml')
      .querySelector('text')
      .getAttribute('fill');
  assert.equal(restored.ink, 'auto');
  assert.equal(layer.fill, 'auto');
  assert.equal(renderedInk(), colors.automaticInk(panel.fill));
  layer.background = '#000000';
  assert.equal(renderedInk(), colors.automaticInk(layer.background));
  layer.background = 'transparent';
  restored.design.elements[0].visible = false;
  assert.equal(renderedInk(), colors.automaticInk(card.paper));
});

test('el fondo vinculado sigue la tarjeta y conserva su color propio al desvincularlo', () => {
  const template = tools.newTemplate();
  const title = template.design.elements[0];
  title.background = '#abcdef';
  title.backgroundRole = 'artistInk';
  const restored = tools.normalizeTemplate(JSON.parse(JSON.stringify(template)));
  assert.equal(restored.design.elements[0].backgroundRole, 'artistInk');
  const card = { ...sample, customDesign: restored.design };
  const render = () => tools.render(card, { width: 76, height: 38 }, { fit });
  assert.match(render(), /data-text-background="true"[^>]*fill="#654321"/);
  card.artistInk = 'transparent';
  assert.doesNotMatch(render(), /data-text-background/);
  delete restored.design.elements[0].backgroundRole;
  assert.match(render(), /data-text-background="true"[^>]*fill="#abcdef"/);
  template.design.elements[1].colorRole = 'paper';
  assert.equal(tools.normalizeTemplate(template).design.elements[1].colorRole, 'paper');
});

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
  t.design.elements[0].locked = true;
  delete t.design.elements[1].locked;
  const normalized = tools.normalizeTemplate(t);
  assert.equal(normalized.design.elements[0].x, 0);
  assert.equal(normalized.design.elements[0].fontSize, 20);
  assert.equal(normalized.design.elements[1].locked, false);
  const restored = tools.normalizeTemplate(JSON.parse(JSON.stringify(normalized)));
  assert.equal(restored.id, t.id);
  assert.equal(restored.design.elements[0].locked, true);
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
  delete legacy.design.elements[1].backgroundRole;
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

test('paleta estándar ordenada, colores Custom y contraste legible', () => {
  const shared = {};
  vm.runInNewContext(readFileSync('src/components.js', 'utf8'), shared);
  const colors = shared.StudioColorTools;
  assert.equal(colors.standardColors.length, 15);
  assert.equal(colors.standardColors[0].hex, 'transparent');
  assert.equal(colors.standardColors.find((color) => color.name === 'Rojo').hex, '#ff0000');
  assert.equal(colors.standardColors.find((color) => color.name === 'Azul').hex, '#0000ff');
  const palette = colors.palette(['#ABCDEF', '#abcdef', '#ffffff', '#123456']);
  assert.equal(palette.length, 18);
  assert.equal(palette[16].name, 'Custom 1');
  assert.equal(palette[16].hex, '#abcdef');
  assert.equal(palette[17].hex, '#123456');
  assert.equal(colors.textColor('#ffff00'), '#000000');
  assert.equal(colors.textColor('#0000ff'), '#ffffff');
  for (const color of palette.filter((color) => colors.valid(color.hex))) {
    const rgb = color.hex
      .slice(1)
      .match(/../g)
      .map((part) => parseInt(part, 16) / 255)
      .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
    const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    const contrast =
      colors.textColor(color.hex) === '#000000'
        ? (luminance + 0.05) / 0.05
        : 1.05 / (luminance + 0.05);
    assert.ok(contrast >= 4.5, 'Contraste suficiente en ' + color.hex);
  }
  for (const hex of ['#000000', '#ffffff', '#ab12cd', '#00ff00', '#808080']) {
    const { h, s, v } = colors.fromHex(hex);
    assert.equal(colors.toHex(h, s, v), hex);
  }
});

test('personalizar añade el color sin aplicarlo hasta seleccionarlo', () => {
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
  assert.deepEqual(emitted, []);
  assert.equal(picker.customOpen, false);
  assert.equal(picker.open, true);
  picker.choose('#ab12cd');
  assert.deepEqual(emitted, [['update:modelValue', '#ab12cd']]);
});

test('fondos por capa, transparencias y JSON conservan el mismo dibujo', () => {
  const template = tools.newTemplate();
  const card = { ...sample, customDesign: template.design };
  assert.ok(template.design.elements.every((layer) => layer.background === 'transparent'));
  assert.doesNotMatch(
    tools.render(card, { width: 76, height: 38 }, { fit }),
    /data-text-background/,
  );
  template.design.elements[1].background = '#ff0000';
  template.design.elements[1].rotation = 15;
  template.design.elements[1].opacity = 0.5;
  const clean = tools.normalizeTemplate(JSON.parse(JSON.stringify(template)));
  assert.equal(clean.design.elements[1].background, '#ff0000');
  const svg = tools.render(
    { ...card, customDesign: clean.design },
    { width: 76, height: 38 },
    { fit },
  );
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const background = doc.querySelector('[data-text-background]');
  assert.equal(background.getAttribute('fill'), '#ff0000');
  assert.equal(background.parentNode.getAttribute('opacity'), '0.5');
  assert.match(background.parentNode.getAttribute('transform'), /rotate\(15/);
  assert.equal(background.nextElementSibling.localName, 'text');
  assert.equal(background.nextElementSibling.getAttribute('fill'), sample.artistInk);
  assert.equal(doc.querySelectorAll('[data-text-background]').length, 1);
  clean.design.elements[1].background = 'transparent';
  assert.doesNotMatch(
    tools.render({ ...card, customDesign: clean.design }, { width: 76, height: 38 }, { fit }),
    /data-text-background/,
  );
  clean.design.elements[0].background = 'url(https://external.invalid)';
  assert.equal(tools.normalizeTemplate(clean).design.elements[0].background, 'transparent');
  const transparent = tools.render(
    { ...card, paper: 'transparent', ink: 'transparent' },
    { width: 76, height: 38 },
    { fit },
  );
  const transparentDoc = new DOMParser().parseFromString(transparent, 'image/svg+xml');
  assert.equal(transparentDoc.querySelector('svg > rect').getAttribute('fill'), 'transparent');
});

test('papel contextual en segunda posición y Custom correlativos tras borrar', () => {
  const shared = {};
  vm.runInNewContext(readFileSync('src/components.js', 'utf8'), shared);
  const tools = shared.StudioColorTools;
  const palette = tools.palette(['#abcdef', '#123456', '#abcdef'], '#abcdef');
  assert.equal(palette[0].hex, 'transparent');
  assert.equal(palette[1].name, 'Papel actual');
  assert.equal(palette[1].hex, '#abcdef');
  assert.equal(palette[1].id, 'current-paper');
  assert.deepEqual(Array.from(palette.filter((color) => color.custom).map((color) => color.name)), [
    'Custom 1',
    'Custom 2',
  ]);
  const deleted = tools.palette(['#123456'], '#ff0000');
  assert.equal(deleted[1].hex, '#ff0000');
  assert.equal(deleted.at(-1).name, 'Custom 1');
  assert.equal(deleted.at(-1).hex, '#123456');
  const component = shared.StudioComponents.ColorPicker;
  const picker = { paper: '#111abc', studioPalette: { getColors: () => ['#123456'] } };
  assert.equal(component.computed.colors.call(picker)[1].hex, '#111abc');
  picker.paper = 'transparent';
  assert.equal(component.computed.colors.call(picker)[1].hex, 'transparent');
});
