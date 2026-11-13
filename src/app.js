const { createApp, ref, computed, watch } = Vue;
// --- Diseños disponibles y campos del disco ---
const templates = [
  {
    id: 'arrows',
    name: 'Classic Arrows',
    group: 'Clásicos',
    description: 'Flechas junto al artista',
    ink: '#a44736',
    paper: '#fff9e9',
  },
  {
    id: 'ribbon',
    name: 'Ribbon No. 45',
    group: 'Clásicos',
    description: 'Líneas finas y artista central',
    ink: '#36776b',
    paper: '#f6f5e7',
  },
  {
    id: 'block',
    name: 'Midnight Block',
    group: 'Clásicos',
    description: 'Contraste y geometría',
    ink: '#324d70',
    paper: '#f5f3e9',
  },
  {
    id: 'stars',
    name: 'Starlight',
    group: 'Vintage',
    description: 'Estrellas de los cincuenta',
    ink: '#ac8234',
    paper: '#fff9e8',
  },
  {
    id: 'stamp',
    name: 'The Hit Parade',
    group: 'Vintage',
    description: 'Sello y personalidad',
    ink: '#b84b38',
    paper: '#fff4d9',
  },
  {
    id: 'lines',
    name: 'Studio Lines',
    group: 'Minimalistas',
    description: 'Líneas limpias',
    ink: '#293e39',
    paper: '#fffdf4',
  },
  {
    id: 'two',
    name: 'Two Artists',
    group: 'Clásicos',
    description: 'Dos artistas separados por /',
    ink: '#5e5779',
    paper: '#f8f3ed',
  },
  {
    id: 'mono',
    name: 'Typewriter',
    group: 'Minimalistas',
    description: 'El ritmo de la tipografía',
    ink: '#3b4140',
    paper: '#f4efdf',
  },
  {
    id: 'brush',
    name: 'Pincel · El Río',
    group: 'Vintage',
    description: 'Canciones azules y artista central con trazos laterales',
    ink: '#005bbb',
    artistInk: '#111111',
    paper: '#ffffff',
    font: 'Trade Winds',
    showMeta: false,
  },
];
// Fuentes libres incluidas en el build; no dependen de servicios externos.
const fontOptions = [
  { value: 'Trade Winds', label: 'Trade Winds · Pincel desgastado' },
  { value: 'Permanent Marker', label: 'Permanent Marker · Rotulador' },
  { value: 'DM Sans', label: 'DM Sans · Moderna y limpia' },
  { value: 'Space Grotesk', label: 'Space Grotesk · Geométrica' },
  { value: 'Oswald', label: 'Oswald · Condensada' },
  { value: 'Playfair Display', label: 'Playfair Display · Editorial' },
  { value: 'Georgia', label: 'Georgia · Clásica' },
  { value: 'Arial', label: 'Arial · Sans' },
  { value: 'monospace', label: 'Monoespaciada' },
];
// Solo el dibujo une ambos artistas; los formularios conservan dos campos.
const artistName = (c) =>
  [c.artist, c.artistB]
    .map((name) => String(name || '').trim())
    .filter(Boolean)
    .join(' / ');
const columns = [
  { key: 'number', label: 'Selección' },
  { key: 'artist', label: 'Artista A' },
  { key: 'artistB', label: 'Artista B' },
  { key: 'a', label: 'Canción A' },
  { key: 'b', label: 'Canción B' },
  { key: 'category', label: 'Estilo musical' },
  { key: 'rpm', label: 'Velocidad' },
  { key: 'label', label: 'Sello' },
  { key: 'year', label: 'Año' },
];
const uid = () => globalThis.crypto?.randomUUID?.() || Date.now() + '-' + Math.random();
// Completa los campos y conserva los nombres de estilo de las copias antiguas.
const normalize = (c) => {
  const style =
    { classic: 'arrows', mint: 'ribbon', midnight: 'block' }[c.style] || c.style || 'arrows';
  const t = templates.find((t) => t.id === style) || templates[0];
  const parts = !c.artistB ? String(c.artist || '').split(/\s+\/\s+/) : [c.artist || ''];
  return {
    id: uid(),
    artist: '',
    a: 'Nuevo título',
    b: '',
    number: '',
    artistB: '',
    category: 'HIT TUNES',
    label: '',
    year: '',
    rpm: '',
    size: 100,
    font: t.font || 'Georgia',
    artistFont: '',
    artistSize: 100,
    artistInk: t.artistInk || '#202020',
    showMeta: t.showMeta !== false,
    ...c,
    style,
    artist: parts[0],
    artistB: c.artistB || parts.slice(1).join(' / '),
    titlePx: c.titlePx ?? (20 * (+c.size || 100)) / 100,
    artistPx: c.artistPx ?? (19 * (+c.artistSize || 100)) / 100,
    showGenre: c.showGenre ?? (c.showMeta ?? t.showMeta) !== false,
    showRpm: c.showRpm ?? (c.showMeta ?? t.showMeta) !== false,
    showNumber: c.showNumber ?? (c.showMeta ?? t.showMeta) !== false,
    ink: c.ink || t.ink,
    paper: c.paper || t.paper,
  };
};
// Datos de ejemplo: solo se usan cuando el navegador no tiene un proyecto guardado.
const demo = [
  ['ELVIS PRESLEY', 'Jailhouse Rock', 'Treat Me Nice', 'ROCK & ROLL', 'arrows'],
  ['CHUCK BERRY', 'Johnny B. Goode', 'Around and Around', 'HIT TUNES', 'ribbon'],
  ['THE PLATTERS', 'Only You', 'The Great Pretender', 'OLD FAVORITES', 'block'],
  ['LITTLE RICHARD', 'Tutti Frutti', 'Long Tall Sally', 'RHYTHM & BLUES', 'stamp'],
  ['BUDDY HOLLY', 'Everyday', 'Peggy Sue', 'HIT TUNES', 'stars'],
  ['EDDIE COCHRAN', 'Summertime Blues', 'C’mon Everybody', 'ROCK & ROLL', 'lines'],
].map((v, i) =>
  normalize({ artist: v[0], a: v[1], b: v[2], category: v[3], style: v[4], number: 'A' + (i + 1) }),
);
// Los textos del usuario se escapan antes de incorporarlos al SVG.
const esc = (s) =>
  String(s ?? '').replace(
    /[<>&"']/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c],
  );
// --- Renderizado común a pantalla, exportación e impresión ---
function makeSvg(c, settings) {
  const color = (value, fallback) => (/^#[0-9a-f]{6}$/i.test(value) ? value : fallback);
  const ink = color(c.ink, '#005bbb');
  const artistInk = color(c.artistInk, '#202020');
  const paper = color(c.paper, '#ffffff');
  const H = (300 * settings.height) / settings.width;
  const sy = H / 150;
  const font = c.font || 'Georgia';
  const artistFont = c.artistFont || font;
  const name = artistName(c);
  const titlePx = c.titlePx ?? (20 * (+c.size || 100)) / 100;
  const artistPx = c.artistPx ?? (19 * (+c.artistSize || 100)) / 100;
  const textSize = (text, px) =>
    Math.min(+px || 20, 270 / Math.max(1, String(text || '').length) / 0.72) * Math.min(1, sy);
  const tx = (text, y, px, family = font, fill = ink) =>
    `<text x="150" y="${y * sy}" text-anchor="middle" dominant-baseline="middle" font-family="${esc(family)}" font-size="${textSize(text, px)}px" font-weight="400" fill="${fill}">${esc(text)}</text>`;
  // Las fuentes se incrustan también en el SVG: la exportación y el PDF usan el mismo dibujo.
  const fontCss = [...new Set([font, artistFont])]
    .map((f) => globalThis.StudioFonts?.[f] || '')
    .join('');
  let art = '';
  if (c.style === 'brush') {
    const half = Math.min(132, name.length * textSize(name, artistPx) * 0.36 + 8);
    const left = 150 - half;
    const right = 150 + half;
    // Trazos laterales interrumpidos por el nombre, sin marco exterior.
    art = `<path d="M4 ${76 * sy}L${left} ${72 * sy}L${left} ${75 * sy}Z M296 ${76 * sy}L${right} ${72 * sy}L${right} ${75 * sy}Z" fill="${artistInk}"/>`;
  } else if (c.style === 'arrows') {
    art = `<path d="M14 ${74 * sy}l10 -4v8z M286 ${74 * sy}l-10 -4v8z" fill="${artistInk}"/>`;
  } else if (c.style === 'stars') {
    art = `<text x="12" y="${78 * sy}" fill="${artistInk}">✦</text><text x="276" y="${78 * sy}" fill="${artistInk}">✦</text>`;
  } else if (['lines', 'stamp', 'ribbon', 'block'].includes(c.style)) {
    art = `<path d="M14 ${58 * sy}h272 M14 ${91 * sy}h272" fill="none" stroke="${artistInk}" stroke-width="${c.style === 'block' ? 2 : 0.7}" stroke-dasharray="${c.style === 'stamp' ? '3 2' : '0'}"/>`;
  }
  const meta =
    ((c.showGenre ?? c.showMeta !== false) ? tx(c.category, 13, 7, 'Arial', artistInk) : '') +
    ((c.showRpm ?? c.showMeta !== false)
      ? tx(c.rpm || settings.rpm, 139, 7, 'Arial', artistInk)
      : '') +
    ((c.showNumber ?? c.showMeta !== false)
      ? `<text x="10" y="${139 * sy}" fill="${artistInk}" font-family="Arial" font-size="7">${esc(c.number)}</text>`
      : '');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${settings.width}mm" height="${settings.height}mm" viewBox="0 0 300 ${H}" role="img" aria-label="${esc(name + ' ' + c.a)}"><style>${fontCss}</style><rect width="300" height="${H}" fill="${paper}"/>${art}${tx(c.a, 37, titlePx)}${tx(name, 75, artistPx, artistFont, artistInk)}${tx(c.b, 112, titlePx)}${meta}</svg>`;
}

createApp({
  setup() {
    // --- Estado inicial y compatibilidad con copias anteriores ---
    let saved;
    try {
      saved = JSON.parse(
        localStorage.getItem('title-studio-v3') ||
          localStorage.getItem('title-studio-v2') ||
          localStorage.getItem('title-studio-v1') ||
          'null',
      );
    } catch {}
    const collections = ref(
      saved?.collections || [
        {
          id: uid(),
          name: 'Mis discos',
          cards: (saved?.cards?.length ? saved.cards : demo).map(normalize),
        },
      ],
    );
    collections.value.forEach((group) => {
      group.cards = group.cards.map(normalize);
    });
    collections.value.forEach((group) => {
      if (group.name === 'Mi colección') group.name = 'Mis discos';
      else if (/^Colección \d+$/.test(group.name))
        group.name = group.name.replace('Colección', 'Discos');
    });
    const activeCollection = ref(saved?.activeCollection || collections.value[0].id);
    const cards = computed({
      get: () =>
        collections.value.find((c) => c.id === activeCollection.value)?.cards ||
        collections.value[0].cards,
      set: (v) => {
        (
          collections.value.find((c) => c.id === activeCollection.value) || collections.value[0]
        ).cards = v;
      },
    });
    const settings = ref({
      name: 'The Jukebox Edition',
      width: saved?.width || 76,
      height: saved?.height || 38,
      rpm: '45 RPM',
      paper: 'A4',
      orientation: 'portrait',
      margin: 10,
      gap: 4,
      guides: true,
      ...saved?.settings,
    });
    const compositions = ref(
        saved?.compositions || [{ id: uid(), name: 'Composición 1', items: [] }],
      ),
      activeComposition = ref(saved?.activeComposition || compositions.value[0]?.id),
      pinned = ref(saved?.pinned || false);
    const composition = computed(() =>
      compositions.value.find((c) => c.id === activeComposition.value),
    );
    const allCards = computed(() => collections.value.flatMap((c) => c.cards));
    // El disco aporta el contenido; cada posición conserva su propio estilo.
    const appearanceKeys = [
      'style',
      'ink',
      'artistInk',
      'paper',
      'font',
      'artistFont',
      'size',
      'artistSize',
      'showMeta',
      'showGenre',
      'showRpm',
      'showNumber',
      'titlePx',
      'artistPx',
    ];
    const appearanceOf = (c) => Object.fromEntries(appearanceKeys.map((k) => [k, c[k]]));
    // Añade identidad y apariencia a las tarjetas creadas con esquemas antiguos.
    function migrateCompositions() {
      compositions.value.forEach((c) =>
        c.items.forEach((i) => {
          i.id ||= uid();
          i.appearance ||= appearanceOf(
            allCards.value.find((c) => c.id === i.cardId) || normalize({}),
          );
          i.appearance.titlePx ??= (20 * (+i.appearance.size || 100)) / 100;
          i.appearance.artistPx ??= (19 * (+i.appearance.artistSize || 100)) / 100;
          for (const key of ['showGenre', 'showRpm', 'showNumber'])
            i.appearance[key] ??= i.appearance.showMeta !== false;
        }),
      );
    }
    migrateCompositions();
    const selectedItemId = ref(null),
      currentItem = computed(() =>
        composition.value?.items.find((i) => i.id === selectedItemId.value),
      );
    const renderedCard = (i) => {
      const c = allCards.value.find((c) => c.id === i.cardId);
      return c ? { ...c, ...i.appearance } : null;
    };
    const compositionCards = computed(
      () => composition.value?.items.map(renderedCard).filter(Boolean) || [],
    );
    // --- Selección, navegación y estado temporal de la interfaz ---
    const selected = ref(saved?.ui?.selected || cards.value[0]?.id),
      view = ref(
        ['compose', 'collection', 'templates', 'print', 'transfer', 'settings'].includes(
          saved?.ui?.view,
        )
          ? saved.ui.view
          : 'compose',
      ),
      drawer = ref(false),
      mode = ref(saved?.ui?.mode === 'single' ? 'single' : 'grid'),
      zoom = ref(Math.max(0.65, Math.min(3, Number(saved?.ui?.zoom) || 1))),
      query = ref(''),
      templateFilter = ref('Todos'),
      saveStatus = ref('Todo guardado'),
      snackbar = ref(false),
      message = ref(''),
      history = ref([]),
      importRows = ref([]),
      importHeaders = ref([]),
      mapping = ref({}),
      importFile = ref(''),
      pasted = ref('');
    const page = ref(1),
      pageSize = ref([25, 50, 100].includes(saved?.ui?.pageSize) ? saved.ui.pageSize : 25),
      filters = ref({}),
      sortKey = ref('number'),
      sortDirection = ref(1),
      picked = ref([]),
      picker = ref(false),
      pickerQuery = ref(''),
      pickerPage = ref(1),
      printSource = ref(saved?.printSource || 'collection'),
      printPage = ref(1),
      composePage = ref(Math.max(0, Number(saved?.ui?.composePage) || 0)),
      deleteSheetDialog = ref(false),
      groupDialog = ref(false),
      groupName = ref(''),
      groupEditing = ref(false),
      backupScope = ref('system'),
      pendingBackup = ref(null),
      versions = ref([]);
    try {
      versions.value = JSON.parse(localStorage.getItem('title-studio-versions') || '[]');
    } catch {}
    // --- Persistencia y deshacer ---
    // La instantánea incluye datos y preferencias, pero no los modales abiertos.
    const snapshot = () => ({
      schema: 5,
      ui: {
        selected: selected.value,
        view: view.value,
        mode: mode.value,
        zoom: zoom.value,
        pageSize: pageSize.value,
        composePage: composePage.value,
      },
      printSource: printSource.value,
      collections: collections.value,
      activeCollection: activeCollection.value,
      compositions: compositions.value,
      activeComposition: activeComposition.value,
      settings: settings.value,
      pinned: pinned.value,
    });
    let last = JSON.stringify(snapshot()),
      skip = false,
      dragging = false,
      hydrating = false;
    const notify = (m) => {
      message.value = m;
      snackbar.value = true;
    };
    // Durante el arrastre se guarda el estado, sin crear un paso de deshacer por píxel.
    watch(
      [
        collections,
        compositions,
        activeCollection,
        activeComposition,
        settings,
        pinned,
        printSource,
        selected,
        view,
        mode,
        zoom,
        pageSize,
        composePage,
      ],
      () => {
        const next = JSON.stringify(snapshot());
        if (!skip && !dragging && next !== last) {
          history.value.push(last);
          if (history.value.length > 30) history.value.shift();
        }
        skip = false;
        last = next;
        try {
          localStorage.setItem('title-studio-v3', next);
          saveStatus.value = 'Todo guardado';
        } catch {
          saveStatus.value = 'Sin guardado local';
          notify('No se pudo guardar. Descarga una copia JSON.');
        }
      },
      { deep: true },
    );
    watch(activeCollection, () => {
      if (view.value === 'collection') {
        selected.value = cards.value[0]?.id;
        selectedItemId.value = null;
      }
      page.value = 1;
      picked.value = [];
      query.value = '';
      filters.value = {};
      pickerPage.value = 1;
    });
    // Evita redistribuir tarjetas mientras se recupera su geometría guardada.
    function restore(s) {
      if (!Array.isArray(s.collections) || !s.collections.length) throw Error('Copia no válida');
      hydrating = true;
      Vue.nextTick(() => (hydrating = false));
      collections.value = s.collections.map((group) => ({
        ...group,
        cards: group.cards.map(normalize),
      }));
      compositions.value = s.compositions || [];
      migrateCompositions();
      selectedItemId.value = null;
      activeCollection.value = s.activeCollection || s.collections[0].id;
      activeComposition.value = s.activeComposition || compositions.value[0]?.id;
      settings.value = { ...settings.value, ...s.settings };
      printSource.value = ['collection', 'composition', 'selected'].includes(s.printSource)
        ? s.printSource
        : 'collection';
      pinned.value = !!s.pinned;
      selected.value = s.ui?.selected || cards.value[0]?.id;
      if (s.ui) {
        if (
          ['compose', 'collection', 'templates', 'print', 'transfer', 'settings'].includes(
            s.ui.view,
          )
        )
          view.value = s.ui.view;
        mode.value = s.ui.mode === 'single' ? 'single' : 'grid';
        composePage.value = Math.max(0, Number(s.ui.composePage) || 0);
        zoom.value = Math.max(0.65, Math.min(3, Number(s.ui.zoom) || 1));
        if ([25, 50, 100].includes(s.ui.pageSize)) pageSize.value = s.ui.pageSize;
      }
    }
    // Las diez copias locales complementan el JSON descargable; no lo sustituyen.
    function checkpoint() {
      versions.value.unshift({
        id: uid(),
        date: new Date().toISOString(),
        data: JSON.parse(JSON.stringify(snapshot())),
      });
      versions.value = versions.value.slice(0, 10);
      try {
        localStorage.setItem('title-studio-versions', JSON.stringify(versions.value));
        notify('Versión recuperable guardada');
      } catch {
        notify('Sin espacio: descarga una copia completa');
      }
    }
    function restoreVersion(v) {
      checkpoint();
      restore(JSON.parse(JSON.stringify(v.data)));
      notify('Versión recuperada');
    }
    // --- Listas de discos de vinilos y composiciones de salida ---
    function newCollection() {
      groupEditing.value = false;
      groupName.value = '';
      groupDialog.value = true;
    }
    function renameCollection() {
      groupEditing.value = true;
      groupName.value = collectionName.value;
      groupDialog.value = true;
    }
    function saveGroup() {
      const name = groupName.value.trim().slice(0, 100);
      if (!name) return;
      if (groupEditing.value) collectionName.value = name;
      else {
        const group = { id: uid(), name, cards: [] };
        collections.value.push(group);
        activeCollection.value = group.id;
      }
      groupDialog.value = false;
    }
    function deleteCollection() {
      if (collections.value.length === 1) return;
      checkpoint();
      const ids = new Set(cards.value.map((c) => c.id));
      compositions.value.forEach((c) => (c.items = c.items.filter((i) => !ids.has(i.cardId))));
      collections.value = collections.value.filter((c) => c.id !== activeCollection.value);
      activeCollection.value = collections.value[0].id;
    }
    function newComposition() {
      const c = { id: uid(), name: 'Composición ' + (compositions.value.length + 1), items: [] };
      compositions.value.push(c);
      activeComposition.value = c.id;
    }
    function deleteComposition() {
      compositions.value = compositions.value.filter((c) => c.id !== activeComposition.value);
      activeComposition.value = compositions.value[0]?.id;
    }
    function copyComposition() {
      if (!composition.value) return;
      const c = JSON.parse(JSON.stringify(composition.value));
      c.id = uid();
      c.name += ' (copia)';
      compositions.value.push(c);
      activeComposition.value = c.id;
    }
    // --- Correspondencia entre huecos y coordenadas físicas ---
    // Las posiciones se almacenan en milímetros; el zoom solo cambia su presentación.
    function slotPosition(index) {
      const k = index % capacity.value;
      return {
        page: Math.floor(index / capacity.value),
        x:
          settings.value.margin +
          (k % Math.max(1, printCols.value)) * (settings.value.width + settings.value.gap),
        y:
          settings.value.margin +
          Math.floor(k / Math.max(1, printCols.value)) *
            (settings.value.height + settings.value.gap),
      };
    }
    function slotIndex(item) {
      return (
        (item.page || 0) * capacity.value +
        Math.round(
          (item.y - settings.value.margin) / (settings.value.height + settings.value.gap),
        ) *
          Math.max(1, printCols.value) +
        Math.round((item.x - settings.value.margin) / (settings.value.width + settings.value.gap))
      );
    }
    // La inserción múltiple ocupa los primeros huecos libres sin cerrar otros huecos.
    function addToComposition(ids = picked.value) {
      if (!composition.value) newComposition();
      const present = new Set(composition.value.items.map((i) => i.cardId)),
        occupied = new Set(composition.value.items.map(slotIndex));
      ids.forEach((id) => {
        if (!present.has(id) && allCards.value.some((c) => c.id === id)) {
          let index = composePage.value * capacity.value;
          while (occupied.has(index)) index++;
          composition.value.items.push({
            id: uid(),
            cardId: id,
            appearance: appearanceOf(allCards.value.find((c) => c.id === id)),
            ...slotPosition(index),
          });
          present.add(id);
          occupied.add(index);
        }
      });
      notify('Discos añadidos a la composición');
      picker.value = false;
      picked.value = [];
    }
    function openPicker() {
      picked.value = [];
      sourceQuery.value = '';
      sourceCollection.value = '';
      pickerPage.value = 1;
      picker.value = true;
    }
    function pickAllResults() {
      picked.value = [...new Set([...picked.value, ...batchRecords.value.map((c) => c.id)])];
    }
    function removeFromComposition(id) {
      if (composition.value)
        composition.value.items = composition.value.items.filter(
          (i) =>
            i.id !== id && (composition.value.items.some((x) => x.id === id) || i.cardId !== id),
        );
      actionCardId.value = null;
      cardActions.value = false;
      if (editingId.value === id) editingId.value = null;
    }
    // --- Acciones contextuales y formularios de tarjeta ---
    const editingId = ref(null),
      cardActions = ref(false),
      styleDialog = ref(false),
      extraPages = ref(0);
    const optionsDialog = ref(false),
      insertMode = ref('new'),
      sourceCollection = ref(''),
      sourceQuery = ref(''),
      sourceRecordId = ref(''),
      destinationCollection = ref(activeCollection.value),
      movingItemId = ref(null),
      styleOnDraft = ref(false);
    const actionCardId = ref(null),
      editorDialog = ref(false),
      deleteDialog = ref(false),
      editorMode = ref('edit'),
      editorContext = ref('composition'),
      draft = ref(normalize({})),
      pendingSlot = ref(null),
      editorSource = ref(null);
    watch(activeComposition, () => {
      selectedItemId.value = null;
      editingId.value = null;
      cardActions.value = false;
      actionCardId.value = null;
      extraPages.value = 0;
      editorDialog.value = false;
      deleteDialog.value = false;
    });
    function selectCard(id) {
      if (suppressCardClick) return;
      const item =
        composition.value?.items.find((i) => i.id === id) ||
        composition.value?.items.find((i) => i.cardId === id);
      selectedItemId.value = item?.id || null;
      selected.value = item?.cardId || id;
      const key = item?.id || id;
      actionCardId.value = actionCardId.value === key ? null : key;
    }
    function selectForEdit(item) {
      selectedItemId.value = item.id;
      selected.value = item.cardId;
      editCard();
    }
    // Alternativa táctil al arrastre: elegir la tarjeta y después su destino.
    function beginMove() {
      if (suppressCardClick) return;
      movingItemId.value = currentItem.value?.id;
      actionCardId.value = null;
      notify('Toca el hueco de destino. Si está ocupado, las tarjetas se desplazarán.');
    }
    function moveToSlot(index) {
      moveItem(movingItemId.value, index);
      movingItemId.value = null;
    }
    function slotClick(slot) {
      if (movingItemId.value) {
        moveToSlot(slot.index);
        return;
      }
      if (slot.item) selectCard(slot.item.id);
      else createAtSlot(slot.index);
    }
    // La búsqueda reúne discos de cualquier lista de discos sin cambiar la lista de discos activa.
    const sourceRecords = computed(() =>
      collections.value
        .filter((c) => !sourceCollection.value || c.id === sourceCollection.value)
        .flatMap((group) => group.cards.map((card) => ({ ...card, collectionName: group.name })))
        .filter((c) =>
          plain(artistName(c) + ' ' + c.a + ' ' + c.b + ' ' + c.number).includes(
            plain(sourceQuery.value),
          ),
        ),
    );
    const batchRecords = computed(() =>
      sourceRecords.value.filter(
        (card) => !composition.value?.items.some((item) => item.cardId === card.id),
      ),
    );
    function chooseSource(id) {
      sourceRecordId.value = id;
      const c = allCards.value.find((c) => c.id === id);
      if (c) draft.value = normalize({ ...c });
    }
    // En un formulario se cambia el borrador; cancelar no modifica la composición.
    const styleCard = computed(() => (styleOnDraft.value ? draft.value : current.value));
    function openStyle(onDraft = false) {
      styleOnDraft.value = onDraft;
      styleDialog.value = true;
      actionCardId.value = null;
    }
    function useTemplate(t) {
      const target = styleDialog.value ? styleCard.value : current.value;
      Object.assign(target, {
        style: t.id,
        ink: t.ink,
        paper: t.paper,
        font: t.font || (t.id === 'mono' ? 'monospace' : target.font),
        artistFont: '',
        artistInk: t.artistInk || '#202020',
        showMeta: t.showMeta !== false,
        showGenre: t.showMeta !== false,
        showRpm: t.showMeta !== false,
        showNumber: t.showMeta !== false,
      });
    }

    // El borrador separa los cambios pendientes del disco y de su posición.
    function openCardEditor(action = 'edit') {
      editorContext.value = view.value === 'collection' ? 'discs' : 'composition';
      editorMode.value = action;
      editorSource.value = currentItem.value?.id || current.value.id;
      draft.value = normalize({
        ...current.value,
        ...(action === 'duplicate' ? { id: uid(), number: current.value.number + '*' } : {}),
      });
      editorDialog.value = true;
      actionCardId.value = null;
    }
    function editCard() {
      cardActions.value = false;
      if (innerWidth <= 1100) {
        openCardEditor('edit');
        return;
      }
      mode.value = 'grid';
      editingId.value = currentItem.value?.id || current.value.id;
      actionCardId.value = null;
      Vue.nextTick(() => document.querySelector('.inline-card-editor input')?.focus());
    }
    function finishEditing() {
      editingId.value = null;
    }
    function createAtSlot(index) {
      editorContext.value = 'composition';
      if (!validPrint.value || composition.value?.items.some((i) => slotIndex(i) === index)) return;
      pendingSlot.value = index;
      insertMode.value = 'existing';
      sourceRecordId.value = '';
      sourceQuery.value = '';
      sourceCollection.value = '';
      destinationCollection.value = activeCollection.value;
      editorMode.value = 'create';
      draft.value = normalize({
        number: 'A' + (cards.value.length + 1),
        style: current.value.style,
      });
      editorDialog.value = true;
      actionCardId.value = null;
    }
    function openNewDisc() {
      editorContext.value = 'discs';
      editorMode.value = 'create';
      insertMode.value = 'new';
      destinationCollection.value = activeCollection.value;
      draft.value = normalize({ number: 'A' + (cards.value.length + 1) });
      selectedItemId.value = null;
      editorDialog.value = true;
    }
    function editDisc(card) {
      selected.value = card.id;
      selectedItemId.value = null;
      openCardEditor('edit');
    }
    // Confirma por separado la creación del disco y la de su tarjeta en la composición.
    function saveCardEditor() {
      if (editorMode.value === 'create' && editorContext.value === 'discs') {
        const owner = collections.value.find((c) => c.id === destinationCollection.value);
        if (!owner) return;
        const card = normalize({ ...draft.value, id: uid() });
        owner.cards.push(card);
        selected.value = card.id;
        editorDialog.value = false;
        notify('Disco guardado');
        return;
      }
      if (editorMode.value === 'create') {
        if (
          insertMode.value === 'existing' &&
          !allCards.value.some((c) => c.id === sourceRecordId.value)
        ) {
          notify('Elige un disco de una lista de discos.');
          return;
        }
        if (!composition.value) newComposition();
        if (composition.value.items.some((i) => slotIndex(i) === pendingSlot.value)) {
          notify('Este hueco ya está ocupado.');
          return;
        }
        let c;
        if (insertMode.value === 'existing')
          c = allCards.value.find((c) => c.id === sourceRecordId.value);
        else {
          const owner = collections.value.find((c) => c.id === destinationCollection.value);
          if (!owner) return;
          c = normalize({ ...draft.value, id: uid() });
          owner.cards.push(c);
        }
        const item = {
          id: uid(),
          cardId: c.id,
          appearance: appearanceOf(draft.value),
          ...slotPosition(pendingSlot.value),
        };
        composition.value.items.push(item);
        selected.value = c.id;
        selectedItemId.value = item.id;
      } else if (editorMode.value === 'duplicate') {
        // Una copia reutiliza el vinilo original y recibe identidad, estilo y hueco propios.
        const source = composition.value?.items.find((i) => i.id === editorSource.value);
        if (!source) return;
        const occupied = new Set(composition.value.items.map(slotIndex));
        let index = 0;
        while (occupied.has(index)) index++;
        const item = {
          id: uid(),
          cardId: source.cardId,
          appearance: appearanceOf(draft.value),
          ...slotPosition(index),
        };
        composition.value.items.push(item);
        selected.value = item.cardId;
        selectedItemId.value = item.id;
      } else {
        const item = composition.value?.items.find((i) => i.id === editorSource.value),
          original = allCards.value.find((c) => c.id === (item?.cardId || editorSource.value));
        if (!original) return;
        const content = Object.fromEntries(columns.map((c) => [c.key, draft.value[c.key]]));
        Object.assign(original, content);
        if (item) item.appearance = appearanceOf(draft.value);
        else Object.assign(original, appearanceOf(draft.value));
        selected.value = original.id;
        selectedItemId.value = item?.id || null;
      }
      editorDialog.value = false;
      actionCardId.value = selectedItemId.value;
    }
    function requestDelete() {
      editorSource.value = currentItem.value?.id || current.value.id;
      deleteDialog.value = true;
      actionCardId.value = null;
    }
    function confirmDelete() {
      removeFromComposition(editorSource.value);
      deleteDialog.value = false;
    }
    const gridPages = computed(() => Math.max(compositionPages.value, extraPages.value, 1));
    function addSheet() {
      if (!composition.value) newComposition();
      const next = gridPages.value;
      composition.value.pages = next + 1;
      composePage.value = next;
    }
    // Borrar una hoja elimina solo sus posiciones; los vinilos siguen en Discos.
    function deleteSheet() {
      if (gridPages.value <= 1 || !composition.value) return;
      const page = composePage.value,
        count = gridPages.value;
      composition.value.items = composition.value.items.filter((item) => (item.page || 0) !== page);
      composition.value.items.forEach((item) => {
        if (item.page > page) item.page--;
      });
      composition.value.pages = count - 1;
      extraPages.value = 0;
      composePage.value = Math.min(page, count - 2);
      selectedItemId.value = null;
      deleteSheetDialog.value = false;
    }
    const compositionSlots = computed(() =>
      Array.from({ length: gridPages.value * capacity.value }, (_, index) => ({
        ...slotPosition(index),
        index,
        item: placedItems.value.find((i) => slotIndex(i) === index),
      })),
    );
    function duplicateInComposition() {
      openCardEditor('duplicate');
    }
    const collectionName = computed({
      get: () => collections.value.find((c) => c.id === activeCollection.value)?.name || '',
      set: (v) => {
        const c = collections.value.find((c) => c.id === activeCollection.value);
        if (c) c.name = v;
      },
    });
    // El editor escribe los textos en el disco y el estilo en la posición seleccionada.
    const current = computed(() => {
      const base =
        allCards.value.find((c) => c.id === selected.value) || cards.value[0] || normalize({});
      const item = currentItem.value;
      if (!item || item.cardId !== base.id || view.value === 'collection') return base;
      return new Proxy(base, {
        get: (target, key) =>
          appearanceKeys.includes(key) ? (item.appearance[key] ?? target[key]) : target[key],
        set: (target, key, value) => {
          if (appearanceKeys.includes(key)) item.appearance[key] = value;
          else target[key] = value;
          return true;
        },
      });
    });
    // --- Contextos de trabajo y operaciones sobre los discos ---
    const navigation = [
      { id: 'collection', icon: '▤', name: 'Discos' },
      { id: 'templates', icon: '◈', name: 'Diseños y plantillas' },
      { id: 'compose', icon: '▦', name: 'Composición' },
      { id: 'print', icon: '▧', name: 'Impresión y salida' },
    ];
    function add() {
      const c = normalize({ number: 'A' + (cards.value.length + 1), style: current.value?.style });
      cards.value.push(c);
      selected.value = c.id;
      notify('Disco añadido. Puedes editarlo en la tabla o en la etiqueta.');
    }
    function duplicate(c) {
      const n = { ...c, id: uid(), number: c.number + '*' };
      cards.value.splice(cards.value.indexOf(c) + 1, 0, n);
      selected.value = n.id;
      notify('Etiqueta duplicada');
    }
    function remove(id) {
      cards.value = cards.value.filter((c) => c.id !== id);
      compositions.value.forEach((c) => (c.items = c.items.filter((i) => i.cardId !== id)));
      if (selected.value === id) selected.value = cards.value[0]?.id;
      notify('Disco eliminado. Puedes deshacer el cambio.');
    }
    function undo() {
      const s = history.value.pop();
      if (!s) return;
      skip = true;
      restore(JSON.parse(s));
      notify('Último cambio deshecho');
    }
    // --- Geometría del papel y validación del formato ---
    const dimensions = computed(() => {
      const d = { A4: [210, 297], A3: [297, 420], Letter: [215.9, 279.4] }[
        settings.value.paper
      ] || [210, 297];
      return settings.value.orientation === 'landscape' ? [d[1], d[0]] : d;
    });
    const printCols = computed(() =>
      Math.max(
        0,
        Math.floor(
          (dimensions.value[0] - 2 * settings.value.margin + settings.value.gap) /
            (settings.value.width + settings.value.gap),
        ),
      ),
    );
    const printRows = computed(() =>
      Math.max(
        0,
        Math.floor(
          (dimensions.value[1] - 2 * settings.value.margin + settings.value.gap) /
            (settings.value.height + settings.value.gap),
        ),
      ),
    );
    const validPrint = computed(
      () =>
        Number.isFinite(+settings.value.width) &&
        settings.value.width >= 25 &&
        settings.value.height >= 12 &&
        settings.value.gap >= 0 &&
        settings.value.margin >= 0 &&
        printCols.value > 0 &&
        printRows.value > 0,
    );
    const capacity = computed(() => Math.max(1, printCols.value * printRows.value));
    const printCards = computed(() =>
      printSource.value === 'composition'
        ? compositionCards.value
        : printSource.value === 'selected'
          ? [current.value]
          : cards.value,
    );
    const compositionPages = computed(() =>
      Math.max(
        1,
        composition.value?.pages || 1,
        ...(composition.value?.items.map((i) => (i.page || 0) + 1) || [1]),
      ),
    );
    const pageCount = computed(() =>
      printSource.value === 'composition'
        ? compositionPages.value
        : Math.ceil(printCards.value.length / capacity.value),
    );
    // La compactación es explícita: quitar una tarjeta conserva su hueco.
    function reflow(target) {
      const comp = target?.items ? target : composition.value;
      comp?.items.forEach((item, i) => {
        const k = i % capacity.value;
        Object.assign(item, {
          page: Math.floor(i / capacity.value),
          x:
            settings.value.margin +
            (k % Math.max(1, printCols.value)) * (settings.value.width + settings.value.gap),
          y:
            settings.value.margin +
            Math.floor(k / Math.max(1, printCols.value)) *
              (settings.value.height + settings.value.gap),
        });
      });
    }
    // Al cambiar de papel se conserva el índice lógico de cada hueco, no su píxel.
    watch(
      () =>
        [
          settings.value.orientation,
          settings.value.paper,
          settings.value.width,
          settings.value.height,
          settings.value.margin,
          settings.value.gap,
        ].join('|'),
      (_, previous) => {
        if (!hydrating && validPrint.value) {
          const [orientation, paper, w, h, m, g] = previous.split('|'),
            dims = { A4: [210, 297], A3: [297, 420], Letter: [215.9, 279.4] }[paper] || [210, 297];
          if (orientation === 'landscape') dims.reverse();
          const cols = Math.max(1, Math.floor((dims[0] - 2 * m + +g) / (+w + +g))),
            rows = Math.max(1, Math.floor((dims[1] - 2 * m + +g) / (+h + +g)));
          compositions.value.forEach((c) => {
            c.items.forEach((i) => {
              const index =
                (i.page || 0) * cols * rows +
                Math.round((i.y - m) / (+h + +g)) * cols +
                Math.round((i.x - m) / (+w + +g));
              Object.assign(i, slotPosition(Math.max(0, index)));
            });
          });
        }
        printPage.value = 1;
      },
    );
    const sheetStyle = computed(() => ({ aspectRatio: dimensions.value[0] / dimensions.value[1] }));
    const horizontalOffset = (cols) =>
      (dimensions.value[0] -
        (cols * settings.value.width + Math.max(0, cols - 1) * settings.value.gap)) /
        2 -
      settings.value.margin;
    const compositionOffset = computed(() => horizontalOffset(Math.max(1, printCols.value)));
    const printOffset = computed(() =>
      horizontalOffset(
        printSource.value === 'composition'
          ? Math.max(1, printCols.value)
          : Math.max(1, Math.min(printCols.value, printCards.value.length)),
      ),
    );
    const itemStyle = (i) => ({
      left:
        ((i.x + (view.value === 'print' ? printOffset.value : compositionOffset.value)) /
          dimensions.value[0]) *
          100 +
        '%',
      top: (i.y / dimensions.value[1]) * 100 + '%',
      width: (settings.value.width / dimensions.value[0]) * 100 + '%',
      height: (settings.value.height / dimensions.value[1]) * 100 + '%',
    });
    const placedItems = computed(
      () =>
        composition.value?.items
          .map((i) => ({ ...i, card: renderedCard(i) }))
          .filter((i) => i.card) || [],
    );
    // Move into a gap directly; occupied targets shift intervening cards without closing other gaps.
    function moveItem(id, to) {
      const items = composition.value?.items;
      if (!items) return;
      const moving = items.find((i) => i.id === id) || items.find((i) => i.cardId === id);
      if (!moving) return;
      const from = slotIndex(moving);
      to = Math.max(0, to);
      if (from === to) return;
      const occupied = items.find((i) => slotIndex(i) === to && i !== moving);
      if (occupied) {
        const direction = to > from ? -1 : 1;
        items
          .filter(
            (i) =>
              i !== moving &&
              slotIndex(i) >= Math.min(from, to) &&
              slotIndex(i) <= Math.max(from, to),
          )
          .forEach((i) => Object.assign(i, slotPosition(slotIndex(i) + direction)));
      }
      Object.assign(moving, slotPosition(to));
      items.sort((a, b) => slotIndex(a) - slotIndex(b));
      composePage.value = Math.floor(to / capacity.value);
    }
    function cardKey(e, item) {
      if (e.target !== e.currentTarget) return;
      const step = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -Math.max(1, printCols.value),
        ArrowDown: Math.max(1, printCols.value),
      }[e.key];
      if (step) {
        e.preventDefault();
        moveItem(item.id, slotIndex(item) + step);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCard(item.id);
      }
    }
    // --- Reordenación por teclado, ratón y pantalla táctil ---
    let suppressCardClick = false;
    function dragStart(e, item) {
      // En móvil solo el asa inicia un arrastre; el resto permite desplazar la página.
      if (e.pointerType === 'touch' && !e.target.closest('.move-handle')) return;
      if (
        e.button !== 0 ||
        editingId.value === item.id ||
        e.target.closest('button:not(.move-handle),input')
      )
        return;
      const el = e.currentTarget.closest('.positioned-label') || e.currentTarget,
        startX = e.clientX,
        startY = e.clientY,
        before = JSON.stringify(snapshot());
      let moved = false;
      const move = (ev) => {
        if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 10) return;
        if (!moved) {
          moved = true;
          dragging = true;
          suppressCardClick = true;
          selected.value = item.cardId;
          selectedItemId.value = item.id;
          actionCardId.value = null;
          el.setPointerCapture(e.pointerId);
          el.classList.add('dragging');
        }
        ev.preventDefault();
        const sheets = [...document.querySelectorAll('.composition-sheet')];
        let best = 0,
          dist = Infinity;
        sheets.forEach((sheet, p) => {
          const r = sheet.getBoundingClientRect(),
            d = Math.max(r.top - ev.clientY, 0, ev.clientY - r.bottom);
          if (d < dist) {
            dist = d;
            best = p;
          }
        });
        const r = sheets[best].getBoundingClientRect(),
          s = settings.value;
        const col = Math.max(
          0,
          Math.min(
            printCols.value - 1,
            Math.floor(
              (((ev.clientX - r.left) / r.width) * dimensions.value[0] -
                s.margin -
                compositionOffset.value) /
                (s.width + s.gap),
            ),
          ),
        );
        const row = Math.max(
          0,
          Math.min(
            printRows.value - 1,
            Math.floor(
              (((ev.clientY - r.top) / r.height) * dimensions.value[1] - s.margin) /
                (s.height + s.gap),
            ),
          ),
        );
        moveItem(item.id, composePage.value * capacity.value + row * printCols.value + col);
      };
      // Un gesto cancelado restaura el estado; un gesto completo añade un solo deshacer.
      const stop = (ev) => {
        if (moved) {
          if (ev.type === 'pointercancel') restore(JSON.parse(before));
          else if (JSON.stringify(snapshot()) !== before) {
            history.value.push(before);
            if (history.value.length > 30) history.value.shift();
          }
          el.classList.remove('dragging');
        }
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', stop);
        window.removeEventListener('pointercancel', stop);
        Vue.nextTick(() => (dragging = false));
        setTimeout(() => (suppressCardClick = false), 100);
      };
      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', stop);
      window.addEventListener('pointercancel', stop);
    }
    // --- Gestos de navegación lateral ---
    let gesture;
    function gestureStart(e) {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      gesture = {
        x: t.clientX,
        y: t.clientY,
        allowed: !!e.target.closest('.sidebar,.icon-rail') || t.clientX < 32,
      };
    }
    function gestureEnd(e) {
      if (!gesture || !e.changedTouches.length) return;
      const t = e.changedTouches[0],
        dx = t.clientX - gesture.x,
        dy = t.clientY - gesture.y;
      if (gesture.allowed && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        drawer.value = dx > 0;
        if (dx < 0) pinned.value = false;
      }
      gesture = null;
    }
    // --- Tabla de lista de discos: búsqueda, filtros y paginación ---
    const filtered = computed(() =>
      cards.value
        .filter(
          (c) =>
            columns.some((col) => plain(c[col.key] || '').includes(plain(query.value))) &&
            columns.every(
              (col) =>
                !filters.value[col.key] ||
                plain(c[col.key] || '').includes(plain(filters.value[col.key])),
            ),
        )
        .slice()
        .sort(
          (a, b) =>
            String(a[sortKey.value] || '').localeCompare(String(b[sortKey.value] || ''), 'es', {
              numeric: true,
            }) * sortDirection.value,
        ),
    );
    const totalPages = computed(() =>
      Math.max(1, Math.ceil(filtered.value.length / pageSize.value)),
    );
    const pagedCards = computed(() =>
      filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
    );
    watch([query, filters, pageSize], () => (page.value = 1), { deep: true });
    watch(totalPages, (n) => (page.value = Math.min(page.value, n)));
    const pickerCards = computed(() =>
      cards.value.filter((c) =>
        plain(artistName(c) + ' ' + c.a + ' ' + c.number).includes(plain(pickerQuery.value)),
      ),
    );
    watch(pickerQuery, () => (pickerPage.value = 1));
    watch([sourceQuery, sourceCollection], () => (pickerPage.value = 1));
    function togglePicked(id) {
      picked.value = picked.value.includes(id)
        ? picked.value.filter((x) => x !== id)
        : [...picked.value, id];
    }
    function sortColumn(key) {
      sortDirection.value = sortKey.value === key ? -sortDirection.value : 1;
      sortKey.value = key;
    }
    function autoCloseSidebar() {
      if (innerWidth > 900 && !pinned.value) drawer.value = false;
    }
    function mobileClose() {
      if (!pinned.value || innerWidth <= 900) drawer.value = false;
    }
    const allNavigation = [
      ...navigation,
      { id: 'transfer', icon: '⇅', name: 'Importar y exportar' },
      { id: 'settings', icon: '⚙', name: 'Ajustes del proyecto' },
    ];
    // --- Copias transportables y exportación de listas de discos ---
    function saveEverything() {
      checkpoint();
      download(
        'title-studio-completo-' + new Date().toISOString().slice(0, 10) + '.json',
        JSON.stringify({ ...snapshot(), versions: versions.value }, null, 2),
        'application/json',
      );
      notify('Copia completa descargada');
    }
    function download(name, data, type) {
      const u = URL.createObjectURL(new Blob([data], { type }));
      const a = document.createElement('a');
      a.href = u;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 2000);
    }
    // Excel treats formula-like values as formulas on CSV open. Escape those cells on CSV export.
    const safeCSV = (v) => (typeof v === 'string' && /^[=+@\-]/.test(v) ? "'" + v : v);
    function exportData(type) {
      if (type === 'json') {
        if (backupScope.value === 'composition' && !composition.value) {
          notify('Crea o elige una composición antes de guardarla.');
          return;
        }
        download(
          'title-studio.json',
          JSON.stringify(
            backupScope.value === 'system'
              ? { ...snapshot(), versions: versions.value }
              : backupScope.value === 'collection'
                ? {
                    schema: 3,
                    kind: 'collection',
                    collection: collections.value.find((c) => c.id === activeCollection.value),
                  }
                : backupScope.value === 'composition'
                  ? {
                      schema: 3,
                      kind: 'composition',
                      composition: composition.value,
                      cards: [
                        ...new Map(
                          composition.value.items.map((i) => [
                            i.cardId,
                            allCards.value.find((c) => c.id === i.cardId),
                          ]),
                        ).values(),
                      ].filter(Boolean),
                      settings: settings.value,
                    }
                  : { schema: 3, kind: 'settings', settings: settings.value },
            null,
            2,
          ),
          'application/json',
        );
        return;
      }
      const rows = cards.value.map((c) =>
        Object.fromEntries(
          columns.map((col) => [
            col.label,
            type === 'csv' ? safeCSV(c[col.key] || '') : c[col.key] || '',
          ]),
        ),
      );
      const ws = XLSX.utils.json_to_sheet(rows);
      if (type === 'csv') {
        download(
          'title-studio.csv',
          '\ufeff' + XLSX.utils.sheet_to_csv(ws, { FS: ';' }),
          'text/csv;charset=utf-8',
        );
      } else {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Discos');
        XLSX.writeFile(wb, 'title-studio.xlsx');
      }
      notify('Archivo exportado');
    }
    // --- Importación de hojas de cálculo y copias JSON ---
    const aliases = {
      number: ['seleccion', 'selection', 'number', 'numero'],
      artist: ['artista a', 'artist a', 'artista', 'artist', 'artista a'],
      a: ['cancion a', 'canción a', 'cara a', 'a', 'titulo', 'title', 'title a', 'sidea'],
      b: ['cancion b', 'canción b', 'cara b', 'b', 'title b', 'sideb'],
      artistB: ['artista b', 'artist b', 'artistb'],
      category: ['estilo musical', 'genero', 'género', 'categoria', 'category', 'genre'],
      rpm: ['velocidad', 'rpm', 'speed'],
      label: ['sello', 'label'],
      year: ['año', 'ano', 'year'],
    };
    function plain(s) {
      return String(s)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    }
    function prepare(rows, name) {
      if (!rows.length) throw Error('El archivo no tiene filas.');
      if (rows.length > 10000) throw Error('El máximo por importación es 10.000 discos.');
      importRows.value = rows;
      importHeaders.value = [...new Set(rows.flatMap((r) => Object.keys(r)))];
      importFile.value = name;
      mapping.value = Object.fromEntries(
        columns.map((c) => [
          c.key,
          importHeaders.value.find((h) => aliases[c.key].includes(plain(h))) || '',
        ]),
      );
      notify('Archivo leído. Revisa la asignación de columnas.');
    }
    async function readFile(file) {
      if (!file) return;
      try {
        if (file.size > 15 * 1024 * 1024) throw Error('El archivo supera los 15 MB.');
        if (/\.json$/i.test(file.name)) {
          const data = JSON.parse(await file.text());
          if (!(Array.isArray(data.collections) || Array.isArray(data.cards) || data.kind))
            throw Error('Copia JSON no válida.');
          pendingBackup.value = data;
          notify('Copia leída: revisa y confirma la carga.');
          return;
        }
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', codepage: 65001 });
        const ws = wb.Sheets[wb.SheetNames[0]];
        prepare(XLSX.utils.sheet_to_json(ws, { defval: '', raw: false }), file.name);
      } catch (e) {
        notify(e.message || 'No se pudo leer el archivo.');
      }
    }
    function parsePasted() {
      try {
        let wb = XLSX.read(pasted.value, { type: 'string', raw: true });
        let ws = wb.Sheets[wb.SheetNames[0]];
        const first = XLSX.utils.sheet_to_json(ws, { header: 1 })[0] || [];
        const isHeader = first.some((h) => Object.values(aliases).flat().includes(plain(h)));
        prepare(
          XLSX.utils.sheet_to_json(
            ws,
            isHeader
              ? { defval: '' }
              : { header: ['Artista', 'Cara A', 'Cara B', 'Selección'], defval: '' },
          ),
          'Datos pegados',
        );
      } catch (e) {
        notify(e.message);
      }
    }
    function commitImport() {
      if (!mapping.value.artist || !mapping.value.a) {
        notify('Asigna como mínimo Artista y Cara A.');
        return;
      }
      const rows = importRows.value
        .filter(
          (r) =>
            String(r[mapping.value.artist] || '').trim() || String(r[mapping.value.a] || '').trim(),
        )
        .map((r) =>
          normalize(
            Object.fromEntries(
              columns.map((c) => [c.key, String(r[mapping.value[c.key]] ?? '').slice(0, 300)]),
            ),
          ),
        );
      if (!rows.length) {
        notify('No hay filas con datos.');
        return;
      }
      cards.value.push(...rows);
      selected.value = rows[0].id;
      importRows.value = [];
      notify(rows.length + ' discos añadidos a la lista de discos.');
      view.value = 'collection';
    }
    // Valida estructura, medidas e identificadores antes de sustituir datos locales.
    function validateBackup(s) {
      if (!s || typeof s !== 'object') throw Error('Copia no válida');
      if (s.settings) {
        const q = s.settings;
        for (const k of ['width', 'height', 'margin', 'gap'])
          if (q[k] !== undefined && (!Number.isFinite(q[k]) || q[k] < 0 || q[k] > 420))
            throw Error('Medida no válida: ' + k);
        if (q.orientation && !['portrait', 'landscape'].includes(q.orientation))
          throw Error('Orientación no válida');
      }
      const groups =
        s.collections || (s.collection ? [s.collection] : s.cards ? [{ cards: s.cards }] : []);
      for (const group of groups) {
        if (!Array.isArray(group.cards) || group.cards.length > 10000)
          throw Error('Lista de discos no válida');
        for (const c of group.cards) {
          if (
            !c ||
            typeof c.artist !== 'string' ||
            typeof c.a !== 'string' ||
            typeof c.b !== 'string'
          )
            throw Error('Disco no válido');
        }
      }
      if (s.collections) {
        if (
          !s.collections.length ||
          s.collections.some((c) => typeof c.id !== 'string' || typeof c.name !== 'string')
        )
          throw Error('Listas de discos no válidas');
        const ids = s.collections.flatMap((c) => c.cards.map((r) => r.id));
        if (ids.some((id) => typeof id !== 'string') || new Set(ids).size !== ids.length)
          throw Error('Identificadores de disco no válidos');
      }
      for (const c of s.compositions || (s.composition ? [s.composition] : [])) {
        if (!c || !Array.isArray(c.items) || typeof c.name !== 'string')
          throw Error('Composición no válida');
        for (const i of c.items)
          if (
            typeof i.cardId !== 'string' ||
            !Number.isFinite(i.x) ||
            !Number.isFinite(i.y) ||
            !Number.isInteger(i.page) ||
            i.page < 0
          )
            throw Error('Posición de tarjeta no válida');
      }
    }
    function loadBackup() {
      const s = pendingBackup.value;
      if (!s) return;
      try {
        validateBackup(s);
        checkpoint();
        hydrating = true;
        Vue.nextTick(() => (hydrating = false));
        if (s.collections) {
          if (!s.collections.length || s.collections.some((c) => !Array.isArray(c.cards)))
            throw Error('Listas de discos no válidas');
          restore(s);
          if (Array.isArray(s.versions)) {
            versions.value = [
              ...versions.value.slice(0, 1),
              ...s.versions
                .filter((v) => v?.data?.collections && typeof v.date === 'string')
                .slice(0, 9),
            ];
            localStorage.setItem('title-studio-versions', JSON.stringify(versions.value));
          }
        } else if (s.kind === 'settings') {
          settings.value = { ...settings.value, ...s.settings };
        } else if (s.kind === 'composition') {
          // Una copia parcial remapea referencias para evitar colisiones con los discos existentes.
          const idmap = new Map();
          const imported = (s.cards || []).map((c) => {
            const n = normalize({ ...c, id: uid() });
            idmap.set(c.id, n.id);
            return n;
          });
          cards.value.push(...imported);
          const c = {
            ...s.composition,
            id: uid(),
            items: s.composition.items
              .map((i) => ({
                ...i,
                id: uid(),
                appearance:
                  i.appearance ||
                  appearanceOf((s.cards || []).find((c) => c.id === i.cardId) || normalize({})),
                cardId: idmap.get(i.cardId),
              }))
              .filter((i) => i.cardId),
          };
          settings.value = { ...settings.value, ...s.settings };
          compositions.value.push(c);
          activeComposition.value = c.id;
        } else {
          const old = s.collection || { name: 'Discos importados', cards: s.cards };
          const c = {
            id: uid(),
            name: old.name,
            cards: old.cards.map((c) => normalize({ ...c, id: uid() })),
          };
          collections.value.push(c);
          activeCollection.value = c.id;
        }
        pendingBackup.value = null;
        notify('Copia cargada. Se ha conservado una versión anterior.');
      } catch (e) {
        notify(e.message);
      }
    }
    // --- Salida física: PDF e impresión del navegador ---
    // Congela contenido y medidas para que la salida no cambie mientras se genera.
    function printJob() {
      const s = JSON.parse(JSON.stringify(settings.value)),
        dims = [...dimensions.value],
        per = capacity.value;
      const pages = Array.from({ length: pageCount.value }, (_, i) =>
        printSource.value === 'composition'
          ? placedItems.value.filter((x) => x.page === i)
          : printCards.value.slice(i * per, (i + 1) * per).map((card, k) => ({
              card,
              x: s.margin + (k % printCols.value) * (s.width + s.gap),
              y: s.margin + Math.floor(k / printCols.value) * (s.height + s.gap),
            })),
      );
      return {
        s,
        dims,
        pages: JSON.parse(
          JSON.stringify(
            pages.map((items) => items.map((item) => ({ ...item, x: item.x + printOffset.value }))),
          ),
        ),
      };
    }
    const pdfBusy = ref(false);
    async function exportPdf() {
      if (!validPrint.value || !printCards.value.length || pdfBusy.value) return;
      pdfBusy.value = true;
      try {
        const job = printJob();
        const bytes = await StudioPDF.create(job, makeSvg);
        download(
          'title-studio-' + job.s.paper + '-' + job.s.orientation + '-1a1.pdf',
          bytes,
          'application/pdf',
        );
        notify('PDF descargado con medidas 1:1');
      } catch (e) {
        notify('No se pudo generar el PDF: ' + e.message);
      } finally {
        pdfBusy.value = false;
      }
    }
    // El CSS fija milímetros; el escalado final sigue dependiendo del diálogo de impresión.
    function printAll() {
      if (!validPrint.value || !printCards.value.length) return;
      const { s, dims, pages } = printJob();
      document.getElementById('print-output').innerHTML =
        `<style>@page{size:${dims[0]}mm ${dims[1]}mm;margin:0}</style>` +
        pages
          .map(
            (items) =>
              `<section class="print-page" style="position:relative;width:${dims[0]}mm;height:${dims[1]}mm">` +
              items
                .map(
                  (item) =>
                    `<div style="position:absolute;left:${item.x}mm;top:${item.y}mm;width:${s.width}mm;height:${s.height}mm;${s.guides ? 'outline:.15mm dashed #888' : ''}">${makeSvg(item.card, s)}</div>`,
                )
                .join('') +
              '</section>',
          )
          .join('');
      Vue.nextTick(() => window.print());
    }
    const previewItems = computed(() =>
      printSource.value === 'composition'
        ? placedItems.value.filter((i) => i.page === printPage.value - 1)
        : printCards.value
            .slice((printPage.value - 1) * capacity.value, printPage.value * capacity.value)
            .map((card, k) => ({
              card,
              x:
                settings.value.margin +
                (k % Math.max(1, printCols.value)) * (settings.value.width + settings.value.gap),
              y:
                settings.value.margin +
                Math.floor(k / Math.max(1, printCols.value)) *
                  (settings.value.height + settings.value.gap),
            })),
    );
    watch([printSource, activeComposition, activeCollection], () => (printPage.value = 1));
    watch(
      gridPages,
      (count) => {
        composePage.value = Math.min(composePage.value, count - 1);
      },
      { immediate: true },
    );
    watch(activeComposition, () => {
      if (!hydrating) composePage.value = 0;
    });
    // --- API expuesta a la plantilla Vue ---
    return {
      openPicker,
      pickAllResults,
      openNewDisc,
      editDisc,
      editorContext,
      composePage,
      deleteSheetDialog,
      deleteSheet,
      groupDialog,
      groupName,
      groupEditing,
      renameCollection,
      saveGroup,
      artistName,
      printJob,
      optionsDialog,
      selectedItemId,
      currentItem,
      insertMode,
      sourceCollection,
      sourceQuery,
      sourceRecordId,
      destinationCollection,
      sourceRecords,
      batchRecords,
      chooseSource,
      movingItemId,
      beginMove,
      moveToSlot,
      slotClick,
      selectForEdit,
      openStyle,
      styleCard,
      useTemplate,
      actionCardId,
      editorDialog,
      deleteDialog,
      editorMode,
      draft,
      openCardEditor,
      saveCardEditor,
      requestDelete,
      confirmDelete,
      addSheet,
      editingId,
      cardActions,
      styleDialog,
      selectCard,
      editCard,
      finishEditing,
      createAtSlot,
      compositionSlots,
      gridPages,
      extraPages,
      duplicateInComposition,
      slotIndex,
      saveEverything,
      pdfBusy,
      exportPdf,
      allNavigation,
      gestureStart,
      gestureEnd,
      moveItem,
      cardKey,
      autoCloseSidebar,
      collections,
      activeCollection,
      collectionName,
      newCollection,
      deleteCollection,
      compositions,
      activeComposition,
      composition,
      compositionCards,
      newComposition,
      deleteComposition,
      copyComposition,
      addToComposition,
      removeFromComposition,
      reflow,
      placedItems,
      compositionPages,
      itemStyle,
      dragStart,
      dimensions,
      pinned,
      page,
      pageSize,
      filters,
      sortKey,
      sortDirection,
      sortColumn,
      totalPages,
      pagedCards,
      picked,
      togglePicked,
      picker,
      pickerQuery,
      pickerPage,
      pickerCards,
      printSource,
      printPage,
      previewItems,
      backupScope,
      pendingBackup,
      loadBackup,
      versions,
      checkpoint,
      restoreVersion,
      templates,
      fontOptions,
      columns,
      cards,
      settings,
      selected,
      current,
      view,
      drawer,
      mode,
      zoom,
      query,
      templateFilter,
      saveStatus,
      snackbar,
      message,
      history,
      importRows,
      importHeaders,
      mapping,
      importFile,
      pasted,
      navigation,
      genres: [
        'HIT TUNES',
        'ROCK & ROLL',
        'RHYTHM & BLUES',
        'OLD FAVORITES',
        'JAZZ',
        'POP',
        'COUNTRY',
        'WALTZ / VARIETY',
        'EXTENDED PLAY',
      ],
      pageTitle: computed(() => allNavigation.find((n) => n.id === view.value)?.name || 'Discos'),
      filtered,
      visibleTemplates: computed(() =>
        templates.filter(
          (t) => templateFilter.value === 'Todos' || t.group === templateFilter.value,
        ),
      ),
      printCols,
      printRows,
      validPrint,
      printCards,
      pageCount,
      sheetStyle,
      add,
      duplicate,
      remove,
      removeCurrent: () => remove(current.value.id),
      undo,
      changed: () => {},
      mobileClose,
      editText: (c, k, e) => {
        c[k] = e.target.innerText.trim().slice(0, 300);
      },
      stripStyle: (c) => ({
        '--ink': c.ink,
        '--paper': c.paper,
        '--title-size': ((+c.size || 100) / 100) * 20 + 'px',
        fontFamily: c.font,
        aspectRatio: settings.value.width / settings.value.height,
      }),
      svg: (c) => makeSvg(c, settings.value),
      applyAll: () => {
        const appearance = appearanceOf(current.value);
        composition.value?.items.forEach((i) => (i.appearance = { ...appearance }));
        notify('Estilo aplicado a esta composición');
      },
      sortByArtist: () => cards.value.sort((a, b) => a.artist.localeCompare(b.artist)),
      renumber: () => {
        cards.value.forEach((c, i) => (c.number = 'A' + (i + 1)));
        notify('Selecciones renumeradas');
      },
      exportData,
      readFile,
      parsePasted,
      commitImport,
      printAll,
      exportSvg: () =>
        download(
          'etiqueta-' + current.value.number + '.svg',
          makeSvg(current.value, settings.value),
          'image/svg+xml',
        ),
      exportSample: () =>
        download(
          'plantilla-title-studio.csv',
          '\ufeffSelección;Artista;Cara A;Cara B;Artista B;Categoría;Sello;Año\nA1;Elvis Presley;Jailhouse Rock;Treat Me Nice;;ROCK & ROLL;RCA Victor;1957',
          'text/csv;charset=utf-8',
        ),
    };
  },
})
  .use(
    Vuetify.createVuetify({
      theme: {
        defaultTheme: 'studio',
        themes: {
          studio: {
            dark: false,
            colors: {
              primary: '#b9553b',
              secondary: '#213d36',
              background: '#f7f7f2',
              surface: '#ffffff',
            },
          },
        },
      },
      defaults: { VBtn: { rounded: 'lg', elevation: 0 } },
    }),
  )
  .component('genre-select', globalThis.StudioComponents.GenreSelect)
  .component('record-fields', globalThis.StudioComponents.RecordFields)
  .component('font-picker', globalThis.StudioComponents.FontPicker)
  .mount('#app');
