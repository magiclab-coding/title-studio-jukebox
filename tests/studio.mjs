import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { ref, computed, watch, nextTick } from 'vue';
import XLSX from 'xlsx';
// --- Entorno mínimo: ejecuta la lógica Vue sin abrir un navegador real ---
let app,
  printed = 0;
const storage = new Map(),
  output = { innerHTML: '' };
const context = {
  Vue: {
    ref,
    computed,
    watch,
    nextTick,
    createApp: (options) => {
      app = options.setup();
      return {
        use() {
          return this;
        },
        mount() {},
        component() {
          return this;
        },
      };
    },
  },
  Vuetify: { createVuetify: () => ({}) },
  XLSX,
  localStorage: { getItem: (k) => storage.get(k) || null, setItem: (k, v) => storage.set(k, v) },
  innerWidth: 360,
  crypto: globalThis.crypto,
  window: {
    print() {
      printed++;
    },
  },
  document: {
    querySelector: () => null,
    getElementById: () => output,
    createElement: () => ({ click() {} }),
  },
  URL: { createObjectURL: () => '', revokeObjectURL() {} },
  Blob,
  setTimeout: () => {},
};
// --- Composición, geometría física e impresión ---
vm.runInNewContext(readFileSync('src/components.js', 'utf8'), context);
vm.runInNewContext(readFileSync('src/app.js', 'utf8'), context);
assert.equal(app.cards.value.length, 6);
assert.equal(app.compositionCards.value.length, 0);
app.addToComposition(app.cards.value.slice(0, 2).map((c) => c.id));
await nextTick();
assert.equal(app.compositionCards.value.length, 2);
app.composition.value.items[0].x = 20;
await nextTick();
app.printSource.value = 'composition';
app.printAll();
await nextTick();
assert.equal(printed, 1);
assert.match(output.innerHTML, /left:37mm/);
assert.equal((output.innerHTML.match(/<svg/g) || []).length, 2);
app.settings.value.orientation = 'landscape';
await nextTick();
assert.deepEqual([...app.dimensions.value], [297, 210]);
assert.equal(app.printCols.value, 3);
assert.equal(app.settings.value.width, 76);
assert.equal(app.settings.value.height, 38);
assert.equal(app.composition.value.items[0].x, 10);
app.printSource.value = 'collection';
app.printAll();
await nextTick();
assert.equal((output.innerHTML.match(/<svg/g) || []).length, 6);
assert.match(output.innerHTML, /@page\{size:297mm 210mm/);
app.composition.value.items[0].x = 23;
await nextTick();
// --- Recuperación completa y copias parciales ---
app.checkpoint();
const backup = JSON.parse(storage.get('title-studio-v3'));
const originalId = app.cards.value[0].id;
app.copyComposition();
await nextTick();
assert.equal(app.compositions.value.length, 2);
app.deleteComposition();
await nextTick();
assert.equal(app.compositions.value.length, 1);
app.undo();
await nextTick();
assert.equal(app.compositions.value.length, 2);
app.pendingBackup.value = backup;
app.loadBackup();
await nextTick();
assert.equal(app.compositions.value.length, 1);
assert.equal(app.cards.value[0].id, originalId);
assert.equal(app.compositionCards.value.length, 2);
assert.equal(app.composition.value.items[0].x, 23);
const scoped = {
  kind: 'composition',
  composition: JSON.parse(JSON.stringify(app.composition.value)),
  cards: JSON.parse(JSON.stringify(app.compositionCards.value)),
  settings: JSON.parse(JSON.stringify(app.settings.value)),
};
app.pendingBackup.value = scoped;
app.loadBackup();
await nextTick();
assert.equal(app.compositions.value.length, 2);
assert.equal(app.cards.value.length, 8);
assert.notEqual(app.composition.value.items[0].cardId, originalId);
assert.equal(app.compositionCards.value.length, 2);
app.newCollection();
app.groupName.value = 'Otros discos';
app.saveGroup();
await nextTick();
assert.equal(app.cards.value.length, 0);
assert.equal(app.collections.value.length, 2);
// --- Importación extensa y paginación ---
app.pasted.value =
  'Artista;Cara A;Cara B;Selección\n' +
  Array.from({ length: 1000 }, (_, i) => `Artista ${i};Canción ${i};B;A${i}`).join('\n');
app.parsePasted();
assert.equal(app.importRows.value.length, 1000);
app.commitImport();
await nextTick();
assert.equal(app.cards.value.length, 1000);
assert.equal(app.pagedCards.value.length, 25);
assert.equal(app.totalPages.value, 40);
app.filters.value.artist = 'Artista 99';
await nextTick();
assert.equal(app.filtered.value.length, 11);
assert.equal(app.pagedCards.value.length, 11);
app.settings.value.width = 400;
await nextTick();
assert.equal(app.validPrint.value, false);
// Collection switching clears stale filters/selections; print source persists in full backup.
app.settings.value.width = 76;
await nextTick();
const second = app.activeCollection.value;
app.activeCollection.value = app.collections.value[0].id;
await nextTick();
assert.equal(app.cards.value.length, 8);
app.activeCollection.value = second;
await nextTick();
assert.equal(app.cards.value.length, 1000);
app.printSource.value = 'composition';
await nextTick();
assert.equal(JSON.parse(storage.get('title-studio-v3')).printSource, 'composition');
app.addToComposition(app.cards.value.slice(0, 3).map((c) => c.id));
await nextTick();
app.reflow();
await nextTick();
const ids = app.composition.value.items.map((i) => i.cardId);
app.moveItem(ids[0], 2);
await nextTick();
assert.deepEqual(
  [...app.composition.value.items.slice(0, 3).map((i) => i.cardId)],
  [ids[1], ids[2], ids[0]],
);
app.composition.value.items.forEach((i, k) => {
  assert.equal(i.x, 10 + (k % app.printCols.value) * 80);
});
app.removeFromComposition(ids[1]);
await nextTick();
assert.equal(app.composition.value.items[0].x, 90);
// Empty slots remain available, creation occupies the requested slot and persists in output.
assert.equal(app.compositionSlots.value[0].item, undefined);
app.view.value = 'compose';
const countBeforeCreate = app.cards.value.length;
app.createAtSlot(0);
await nextTick();
assert.equal(app.editorDialog.value, true);
assert.equal(app.cards.value.length, countBeforeCreate);
app.editorDialog.value = false;
assert.equal(app.compositionSlots.value[0].item, undefined);
app.createAtSlot(0);
app.insertMode.value = 'new';
app.draft.value.artist = 'Nuevo artista';
app.saveCardEditor();
await nextTick();
const created = app.current.value.id,
  createdItem = app.currentItem.value.id;
assert.equal(app.slotIndex(app.currentItem.value), 0);
app.actionCardId.value = null;
app.selectCard(createdItem);
assert.equal(app.actionCardId.value, createdItem);
app.editCard();
assert.equal(app.editorMode.value, 'edit');
app.draft.value.artist = 'Cambio cancelado';
app.editorDialog.value = false;
assert.equal(app.current.value.artist, 'Nuevo artista');
app.editCard();
app.draft.value.artist = 'Cambio guardado';
app.saveCardEditor();
assert.equal(app.current.value.artist, 'Cambio guardado');
app.duplicateInComposition();
assert.equal(app.editorMode.value, 'duplicate');
const beforeDuplicate = app.compositionCards.value.length,
  beforeDiscs = app.cards.value.length;
app.saveCardEditor();
await nextTick();
assert.equal(app.compositionCards.value.length, beforeDuplicate + 1);
assert.equal(app.cards.value.length, beforeDiscs);
assert.equal(app.current.value.id, created);
const duplicateId = app.currentItem.value.id;
app.requestDelete();
assert.equal(app.deleteDialog.value, true);
assert.ok(app.composition.value.items.some((i) => i.id === duplicateId));
app.confirmDelete();
assert.ok(!app.composition.value.items.some((i) => i.id === duplicateId));
assert.ok(app.cards.value.some((c) => c.id === created));
app.removeFromComposition(createdItem);
await nextTick();
assert.equal(app.compositionSlots.value[0].item, undefined);
app.moveItem(ids[0], app.printCols.value * app.printRows.value + 2);
await nextTick();
assert.equal(app.compositionPages.value, 2);
app.addSheet();
await nextTick();
assert.equal(app.compositionPages.value, 3);
app.printSource.value = 'composition';
app.printAll();
await nextTick();
assert.match(output.innerHTML, /left:190.5mm/);
assert.equal(
  JSON.parse(storage.get('title-studio-v3')).compositions.find(
    (c) => c.id === app.activeComposition.value,
  ).pages,
  3,
);
const target = { closest: () => true };
app.gestureStart({ touches: [{ clientX: 20, clientY: 80 }], target });
app.gestureEnd({ changedTouches: [{ clientX: 140, clientY: 90 }] });
assert.equal(app.drawer.value, true);
app.gestureStart({ touches: [{ clientX: 140, clientY: 80 }], target });
app.gestureEnd({ changedTouches: [{ clientX: 20, clientY: 90 }] });
assert.equal(app.drawer.value, false);
const savedSlots = app.composition.value.items.map((i) => app.slotIndex(i));
app.settings.value.orientation = 'portrait';
await nextTick();
assert.deepEqual(
  app.composition.value.items.map((i) => app.slotIndex(i)),
  savedSlots,
);
// Cross-collection insertion references the original vinyl and stores style per placement.
const mainComposition = app.activeComposition.value,
  foreign = app.collections.value[0].cards[0],
  foreignStyle = foreign.style;
app.createAtSlot(0);
app.chooseSource(foreign.id);
app.openStyle(true);
app.useTemplate(app.templates[2]);
app.styleDialog.value = false;
app.saveCardEditor();
await nextTick();
const firstPlacement = app.currentItem.value.id;
assert.equal(app.current.value.id, foreign.id);
assert.equal(app.current.value.style, 'block');
assert.equal(foreign.style, foreignStyle);
const collectionSize = app.collections.value[0].cards.length;
app.newComposition();
await nextTick();
const otherComposition = app.activeComposition.value;
app.createAtSlot(4);
app.chooseSource(foreign.id);
app.openStyle(true);
app.useTemplate(app.templates[1]);
app.styleDialog.value = false;
app.saveCardEditor();
await nextTick();
assert.equal(app.current.value.style, 'ribbon');
assert.equal(app.slotIndex(app.currentItem.value), 4);
assert.equal(app.collections.value[0].cards.length, collectionSize);
app.activeComposition.value = mainComposition;
await nextTick();
app.selectCard(firstPlacement);
assert.equal(app.current.value.style, 'block');
assert.equal(app.slotIndex(app.currentItem.value), 0);
app.beginMove();
assert.equal(app.movingItemId.value, firstPlacement);
app.slotClick({ index: 7 });
await nextTick();
assert.equal(app.slotIndex(app.currentItem.value), 7);
assert.equal(app.movingItemId.value, null);
app.zoom.value = 3;
await nextTick();
assert.equal(JSON.parse(storage.get('title-studio-v3')).ui.zoom, 3);
const latest = JSON.parse(storage.get('title-studio-v3'));
app.pendingBackup.value = latest;
app.loadBackup();
await nextTick();
app.selectCard(firstPlacement);
assert.equal(app.current.value.style, 'block');
assert.equal(app.slotIndex(app.currentItem.value), 7);
app.printSource.value = 'composition';
app.printAll();
await nextTick();
assert.match(output.innerHTML, /#324d70/);
app.saveEverything();
await nextTick();
assert.ok(app.versions.value.length);
console.log(
  'PASS: selective composition, physical layout, print sources, full/scoped restore, undo, collections, 1,000-row import, pagination and filters',
);

// --- Diseños personalizados y compatibilidad del campo único de artista ---
const rendered = vm.runInNewContext(
  `makeSvg(normalize({style:'brush', artist:'MIGUEL RÍOS', a:'EL RIO', b:'VUELVO A GRANADA'}), {width:76, height:38, rpm:'45 RPM'})`,
  context,
);
assert.match(rendered, /fill="#005bbb">EL RIO/);
assert.match(rendered, /fill="#111111">MIGUEL RÍOS/);
assert.ok(rendered.indexOf('>EL RIO</text>') < rendered.indexOf('>MIGUEL RÍOS</text>'));
assert.ok(rendered.indexOf('>MIGUEL RÍOS</text>') < rendered.indexOf('>VUELVO A GRANADA</text>'));
assert.doesNotMatch(rendered, /stroke="/);
assert.match(rendered, />HIT TUNES</);
assert.match(rendered, />45 RPM</);
const oldArtist = vm.runInNewContext(
  `normalize({artist:'Artista A', artistB:'Artista B'})`,
  context,
);
assert.equal(oldArtist.artist, 'Artista A');
assert.equal(oldArtist.artistB, 'Artista B');
for (const t of app.templates) {
  const svg = app.svg({ ...app.cards.value[0], style: t.id });
  assert.doesNotMatch(svg, /<rect[^>]*stroke=/);
}
// Los nuevos atributos viven en cada posición, no en el disco compartido.
app.useTemplate(app.templates.find((t) => t.id === 'brush'));
app.current.value.artistInk = '#663399';
app.current.value.artistFont = 'DM Sans';
assert.equal(app.currentItem.value.appearance.artistInk, '#663399');
assert.notEqual(foreign.artistInk, '#663399');
assert.equal(app.currentItem.value.appearance.artistFont, 'DM Sans');
console.log(
  'PASS: custom layouts, separate inks, no outer frames, shared artist field and independent appearance',
);

// --- Anotaciones: alta sin composición, artistas A/B, lotes y hojas reversibles ---
app.view.value = 'collection';
const beforeNew = app.cards.value.length,
  beforePlaces = app.composition.value.items.length;
app.openNewDisc();
assert.equal(app.cards.value.length, beforeNew);
app.draft.value.artist = 'Artista de prueba A';
app.draft.value.artistB = 'Artista de prueba B';
app.draft.value.a = 'Canción de prueba A';
app.draft.value.b = 'Canción de prueba B';
app.saveCardEditor();
await nextTick();
assert.equal(app.cards.value.length, beforeNew + 1);
assert.equal(app.composition.value.items.length, beforePlaces);
const createdDisc = app.cards.value.at(-1);
assert.equal(createdDisc.artistB, 'Artista de prueba B');
assert.match(app.svg(createdDisc), /Artista de prueba A \/ Artista de prueba B/);
assert.equal(vm.runInNewContext(`normalize({artist:'AC/DC'}).artist`, context), 'AC/DC');
assert.equal(vm.runInNewContext(`normalize({artist:'Uno / Dos'}).artistB`, context), 'Dos');
assert.equal(vm.runInNewContext(`normalize({size:120}).titlePx`, context), 24);

app.newComposition();
app.view.value = 'compose';
app.settings.value = {
  ...app.settings.value,
  paper: 'A4',
  orientation: 'portrait',
  width: 76,
  height: 38,
  gap: 4,
  margin: 10,
};
await nextTick();
const sourceDiscs = app.cards.value.slice(0, 6);
app.addToComposition(sourceDiscs.slice(0, 3).map((c) => c.id));
await nextTick();
assert.equal(app.composition.value.items.length, 3);
app.printSource.value = 'composition';
const centered = app.printJob();
assert.equal(centered.pages[0][0].x, 27);
assert.equal(centered.pages[0][1].x, 107);
assert.equal(centered.pages[0][0].y, 10); // No centrar verticalmente.
assert.equal(app.composition.value.items[0].x, 10); // No reescribir los huecos guardados.
app.addSheet();
await nextTick();
assert.equal(app.composePage.value, 1);
app.addToComposition(sourceDiscs.slice(3, 5).map((c) => c.id));
await nextTick();
assert.equal(app.composition.value.items.filter((i) => i.page === 1).length, 2);
app.addSheet();
app.addToComposition([sourceDiscs[5].id]);
await nextTick();
app.composePage.value = 1;
await nextTick();
const discsBeforeDelete = app.cards.value.length;
app.deleteSheet();
await nextTick();
assert.equal(app.gridPages.value, 2);
assert.equal(app.composition.value.items.length, 4);
assert.equal(app.cards.value.length, discsBeforeDelete);
assert.equal(app.composition.value.items.find((i) => i.cardId === sourceDiscs[5].id).page, 1);
app.undo();
await nextTick();
assert.equal(app.gridPages.value, 3);
assert.equal(app.composition.value.items.length, 6);
app.printSource.value = 'selected';
const singlePrint = app.printJob();
assert.equal(singlePrint.pages[0][0].x, 67);
assert.equal(singlePrint.pages[0][0].y, 10);
const hiddenMetadata = app.svg({
  ...createdDisc,
  category: 'JAZZ',
  rpm: '78 RPM',
  number: 'Z99',
  titlePx: 24,
  showGenre: false,
  showRpm: false,
  showNumber: false,
});
assert.doesNotMatch(hiddenMetadata, />JAZZ<|>78 RPM<|>Z99</);
const onlyGenre = app.svg({
  ...createdDisc,
  category: 'JAZZ',
  rpm: '78 RPM',
  number: 'Z99',
  showGenre: true,
  showRpm: false,
  showNumber: false,
});
assert.match(onlyGenre, />JAZZ</);
assert.doesNotMatch(onlyGenre, />78 RPM<|>Z99</);
console.log(
  'PASS: disc-only creation, A/B artists, batch insertion, reversible sheet deletion, horizontal-only centering and metadata toggles',
);

// --- Revisión 7.0.8: estilos independientes, columnas y edición uniforme ---
assert.equal(vm.runInNewContext(`normalize({}).rpm`, context), '45 RPM');
assert.equal(vm.runInNewContext(`normalize({rpm:'78 RPM'}).rpm`, context), '78 RPM');
assert.deepEqual([...app.visibleColumns.value.map((c) => c.key)], ['artist', 'artistB', 'a', 'b']);
app.columnKeys.value.push('rpm');
await nextTick();
assert.ok(JSON.parse(storage.get('title-studio-v3')).ui.columnKeys.includes('rpm'));
app.columnKeys.value = ['artist', 'artistB', 'a', 'b'];
app.newComposition();
app.view.value = 'compose';
await nextTick();
const styleSources = app.cards.value.slice(0, 3);
app.addToComposition(styleSources.map((c) => c.id));
await nextTick();
app.selectCard(app.composition.value.items[0].id);
const sourceBeforeStyles = JSON.stringify(styleSources);
const previewBefore = app.templatePreview(
  app.templates.find((t) => t.id === 'ribbon'),
  app.current.value,
);
app.openStyle(false);
app.useTemplate(app.templates.find((t) => t.id === 'brush'));
assert.equal(
  app.templatePreview(
    app.templates.find((t) => t.id === 'ribbon'),
    app.current.value,
  ),
  previewBefore,
);
assert.equal(JSON.stringify(styleSources), sourceBeforeStyles);
app.current.value.category = 'JAZZ';
app.current.value.showGenre = false;
app.current.value.showRpm = false;
app.current.value.showNumber = false;
app.useTemplate(app.templates.find((t) => t.id === 'inverse'));
assert.equal(app.current.value.showGenre, false);
assert.doesNotMatch(app.svg(app.current.value), />JAZZ<|>45 RPM</);
assert.doesNotMatch(
  app.templatePreview(
    app.templates.find((t) => t.id === 'brush'),
    app.current.value,
  ),
  />JAZZ<|>45 RPM</,
);
const inverseSvg = app.svg({
  ...app.current.value,
  artist: 'ARTISTA EN NEGATIVO',
  artistB: '',
  paper: '#ffffff',
});
assert.match(inverseSvg, /fill="#ffffff">ARTISTA EN NEGATIVO/);
app.styleDialog.value = false;
const placesBeforeAll = JSON.stringify(app.composition.value.items);
app.openStyleAll();
app.useTemplate(app.templates.find((t) => t.id === 'block'));
assert.equal(JSON.stringify(app.composition.value.items), placesBeforeAll);
app.applyAll();
assert.ok(app.composition.value.items.every((item) => item.appearance.style === 'block'));
assert.notEqual(
  app.composition.value.items[0].appearance,
  app.composition.value.items[1].appearance,
);
context.innerWidth = 1440;
app.editCard();
assert.equal(app.editorDialog.value, true);
assert.equal(app.editingId.value, null);
app.editorDialog.value = false;
app.selectCard(app.currentItem.value.id);
app.actionCardId.value = app.currentItem.value.id;
app.dismissCardActions({ target: { closest: () => ({}) } });
assert.equal(app.actionCardId.value, app.currentItem.value.id);
app.dismissCardActions({ target: { closest: () => null } });
assert.equal(app.actionCardId.value, null);

// El mismo temporizador y la misma captura del gesto que usa el navegador.
app.addSheet();
app.composePage.value = 0;
await nextTick();
const dragItem = app.composition.value.items[0];
const beforeDragIndex = app.slotIndex(dragItem);
const listeners = new Map(),
  timers = new Map();
let timerId = 0,
  captured = false,
  released = false;
context.setTimeout = (fn, delay) => {
  const id = ++timerId;
  timers.set(id, { fn, delay });
  return id;
};
context.clearTimeout = (id) => timers.delete(id);
context.window.addEventListener = (name, fn) => listeners.set(name, fn);
context.window.removeEventListener = (name) => listeners.delete(name);
const rect = { left: 100, right: 500, top: 100, bottom: 660, width: 400, height: 560 };
context.document.querySelectorAll = () => [{ getBoundingClientRect: () => rect }];
const capture = {
  setPointerCapture() {
    captured = true;
  },
  hasPointerCapture: () => true,
  releasePointerCapture() {
    released = true;
  },
};
const element = {
  closest: (selector) => (selector === '.canvas' ? capture : element),
  classList: { add() {}, remove() {} },
};
app.dragStart(
  {
    pointerType: 'mouse',
    button: 0,
    target: { closest: () => null },
    currentTarget: element,
    clientX: 220,
    clientY: 160,
    pointerId: 1,
  },
  dragItem,
);
listeners.get('pointermove')({ clientX: 495, clientY: 190, preventDefault() {} });
assert.equal(captured, true);
assert.equal(app.dragEdge.value, 1);
const pageTimer = [...timers.values()].find((timer) => timer.delay === 650);
assert.ok(pageTimer);
pageTimer.fn();
await nextTick();
assert.equal(app.composePage.value, 1);
assert.equal(dragItem.page, 1);
listeners.get('pointercancel')({ type: 'pointercancel' });
await nextTick();
assert.equal(released, true);
assert.equal(app.dragActive.value, false);
assert.equal(app.composePage.value, 0);
assert.equal(
  app.slotIndex(app.composition.value.items.find((item) => item.id === dragItem.id)),
  beforeDragIndex,
);
assert.equal(listeners.size, 0);
assert.equal(app.moveAcrossPage(dragItem.id, -1, 0), false);
assert.equal(app.moveAcrossPage(dragItem.id, 1, 0), true);
assert.equal(app.moveAcrossPage(dragItem.id, 1, 0), false);
assert.equal(app.moveAcrossPage(dragItem.id, -1, 0), true);
console.log(
  'PASS: independent presets, metadata visibility, column persistence, bulk draft, desktop modal and pointer-drag page turning/cancel',
);
