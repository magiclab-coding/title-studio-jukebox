import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { DOMParser } from 'linkedom';
import { test } from 'node:test';

const context = { DOMParser, StudioComponents: {}, crypto: globalThis.crypto };
vm.runInNewContext(readFileSync('src/designer.js','utf8'),context);
const tools = context.StudioTemplateTools;
const fit = (value,font,px,width) => {
  const text = String(value);
  const max = Math.floor(width/(px*0.6));
  return {text:text.length > max ? text.slice(0,Math.max(0,max-1))+'…' : text,truncated:text.length > max};
};
const sample = {artist:'Uno',artistB:'Dos',a:'Primera',b:'Segunda',ink:'#123456',artistInk:'#654321',paper:'#ffffff',font:'Arial',titlePx:20,artistPx:19,showGenre:true,showRpm:true,showNumber:true};

test('campos vinculados, color, visibilidad, orden y recorte usan el mismo dibujo',() => {
  const t = tools.newTemplate();
  const card = {...sample,customDesign:t.design};
  let svg = tools.render(card,{width:76,height:38},{fit});
  assert.match(svg,/>Uno \/ Dos</);
  assert.match(svg,/>Primera</);
  assert.match(svg,/fill="#123456"/);
  card.a = 'W'.repeat(80);
  assert.equal(tools.overflow(card,'a',fit),true);
  assert.match(tools.render(card,{width:76,height:38},{fit}),/…<\/text>/);
  card.titlePx = 4;
  assert.equal(tools.overflow(card,'a',fit),false);
  const metadata = tools.element('text','rpm');
  t.design.elements.push(metadata);
  card.rpm = '45 RPM';
  assert.match(tools.render(card,{width:76,height:38},{fit}),/>45 RPM</);
  card.showRpm = false;
  assert.doesNotMatch(tools.render(card,{width:76,height:38},{fit}),/>45 RPM</);
  t.design.elements[0].visible = false;
  assert.equal(tools.overflow(card,'a',fit),false);
  assert.doesNotMatch(tools.render(card,{width:76,height:38},{fit}),/>WW/);
});

test('SVG importado conserva gráficos, transformaciones y degradados sin contenido activo',() => {
  const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" onload="alert(1)"><defs><linearGradient id="g"><stop offset="0" stop-color="#ff0000"/></linearGradient></defs><g transform="translate(2 3)" style="fill:url(#g);stroke:#000000"><path d="M0 0H90V40Z"/></g><use href="#g"/><script>alert(1)</script><foreignObject><iframe src="https://evil.invalid"/></foreignObject><image href="https://evil.invalid/x"/><a href="javascript:alert(1)"><rect width="4"/></a></svg>';
  const clean = tools.sanitizeSvg(source);
  assert.match(clean,/linearGradient/);
  assert.match(clean,/fill="url\(#asset-0\)"/);
  assert.match(clean,/transform="translate\(2 3\)"/);
  assert.doesNotMatch(clean,/onload|script|foreignObject|iframe|evil|javascript|<image|<a /);
  assert.throws(() => tools.sanitizeSvg('<!DOCTYPE svg><svg/>'));
  assert.throws(() => tools.sanitizeSvg('x'.repeat(1000001)));
  const t = tools.newTemplate();
  t.design.elements.push({...tools.element('svg'),svg:source,width:100,height:50});
  const card = {...sample,customDesign:t.design};
  const output = tools.render(card,{width:76,height:38},{fit});
  assert.doesNotMatch(decodeURIComponent(output),/evil|onload|alert/);
  assert.match(output,/data:image\/svg\+xml/);
});

test('normalización limita valores, rechaza recursos y conserva copias transportables',() => {
  const t = tools.newTemplate();
  t.id = 'custom-example'; t.name = 'Transportable';
  t.design.elements[0].x = -999;
  t.design.elements[0].fontSize = Infinity;
  const normalized = tools.normalizeTemplate(t);
  assert.equal(normalized.design.elements[0].x,0);
  assert.equal(normalized.design.elements[0].fontSize,20);
  assert.equal(tools.normalizeTemplate(JSON.parse(JSON.stringify(normalized))).id,t.id);
  assert.throws(() => tools.normalizeDesign({elements:Array(81).fill(tools.element())}));
  assert.throws(() => tools.normalizeDesign({elements:[{...tools.element('image'),src:'https://evil.invalid'}]}));
  assert.throws(() => tools.normalizeDesign({elements:[{type:'foreignObject'}]}));
  const copy = tools.clone(normalized);
  copy.design.elements[0].x = 80;
  assert.equal(normalized.design.elements[0].x,0);
});

test('edición local: deshacer, rehacer, ordenar y duplicar no modifican el original',() => {
  const component = context.StudioComponents.TemplateDesigner;
  const initial = tools.newTemplate();
  const editor = component.data.call({initial});
  for (const [key,method] of Object.entries(component.methods)) editor[key] = method.bind(editor);
  Object.defineProperties(editor,{
    layers:{get:() => editor.model.design.elements},
    selectedLayer:{get:() => editor.layers.find((e) => e.id === editor.selectedId)},
  });
  component.mounted.call(editor);
  const original = JSON.stringify(initial);
  editor.add('rect');
  editor.remember();
  assert.equal(editor.layers.length,4);
  editor.undo();
  assert.equal(editor.layers.length,3);
  editor.redo();
  assert.equal(editor.layers.length,4);
  editor.selectedId = editor.layers[0].id;
  editor.align('center');
  assert.equal(editor.selectedLayer.x,10);
  editor.duplicate();
  assert.equal(editor.layers.length,5);
  editor.order(-1);
  assert.equal(editor.layers[3].id,editor.selectedId);
  editor.remove();
  assert.equal(editor.layers.length,4);
  assert.equal(JSON.stringify(initial),original);
});
