import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { ref, computed, watch, nextTick } from 'vue';
import XLSX from 'xlsx';
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
assert.match(output.innerHTML, /left:20mm/);
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
await nextTick();
assert.equal(app.cards.value.length, 0);
assert.equal(app.collections.value.length, 2);
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
assert.match(output.innerHTML, /left:170mm/);
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
