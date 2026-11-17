// --- Paleta del proyecto y conversión de la rueda cromática ---
globalThis.StudioColorTools = {
  standardColors: [
    { name: 'Blanco', hex: '#ffffff' },
    { name: 'Negro', hex: '#000000' },
    { name: 'Gris claro', hex: '#d1d5db' },
    { name: 'Gris', hex: '#6b7280' },
    { name: 'Gris oscuro', hex: '#374151' },
    { name: 'Rojo', hex: '#ff0000' },
    { name: 'Naranja', hex: '#ff8000' },
    { name: 'Amarillo', hex: '#ffff00' },
    { name: 'Verde', hex: '#008000' },
    { name: 'Cian', hex: '#00ffff' },
    { name: 'Azul', hex: '#0000ff' },
    { name: 'Violeta', hex: '#8000ff' },
    { name: 'Rosa', hex: '#ff69b4' },
    { name: 'Marrón', hex: '#8b4513' },
  ],
  get baseColors() {
    return this.standardColors.map((color) => color.hex);
  },
  valid: (value) => /^#[0-9a-f]{6}$/i.test(value),
  palette(values = [], current) {
    const colors = this.standardColors.map((color) => ({ ...color }));
    const seen = new Set(this.baseColors);
    for (const value of [...values, current]) {
      if (!this.valid(value)) continue;
      const hex = value.toLowerCase();
      if (!seen.has(hex)) {
        colors.push({ name: 'Custom', hex });
        seen.add(hex);
      }
    }
    return colors;
  },
  // Elige texto blanco o negro por contraste, también en tonos personalizados.
  textColor(hex) {
    const channels = hex
      .slice(1)
      .match(/../g)
      .map((part) => parseInt(part, 16) / 255)
      .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
    const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    return luminance > 0.179 ? '#000000' : '#ffffff';
  },
  toHex(h, s, v) {
    const c = v * s,
      x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
      m = v - c;
    const rgb =
      h < 60
        ? [c, x, 0]
        : h < 120
          ? [x, c, 0]
          : h < 180
            ? [0, c, x]
            : h < 240
              ? [0, x, c]
              : h < 300
                ? [x, 0, c]
                : [c, 0, x];
    return (
      '#' +
      rgb
        .map((value) =>
          Math.round((value + m) * 255)
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')
    );
  },
  fromHex(value) {
    const rgb = value
      .slice(1)
      .match(/../g)
      .map((part) => parseInt(part, 16) / 255);
    const [r, g, b] = rgb,
      max = Math.max(...rgb),
      min = Math.min(...rgb),
      delta = max - min;
    let h = !delta
      ? 0
      : max === r
        ? 60 * (((g - b) / delta) % 6)
        : max === g
          ? 60 * ((b - r) / delta + 2)
          : 60 * ((r - g) / delta + 4);
    return { h: (h + 360) % 360, s: max ? delta / max : 0, v: max };
  },
};

// --- Controles compartidos: el mismo formulario en todos los contextos ---
globalThis.StudioComponents = {
  // La elección rápida aplica un color; la personalización trabaja en un borrador.
  ColorPicker: {
    props: { modelValue: String, label: String, caption: String },
    inject: { studioPalette: { default: null } },
    emits: ['update:modelValue'],
    data() {
      return { open: false, customOpen: false, hex: '#000000', h: 0, s: 0, v: 1 };
    },
    computed: {
      colors() {
        return StudioColorTools.palette(this.studioPalette?.getColors() || [], this.modelValue);
      },
      validHex() {
        return StudioColorTools.valid(this.hex);
      },
      wheelMarker() {
        const radians = (this.h * Math.PI) / 180;
        return {
          left: 50 + 49 * this.s * Math.cos(radians) + '%',
          top: 50 + 49 * this.s * Math.sin(radians) + '%',
        };
      },
    },
    methods: {
      colorText: (hex) => StudioColorTools.textColor(hex),
      choose(value) {
        if (!StudioColorTools.valid(value)) return;
        this.$emit('update:modelValue', value.toLowerCase());
        this.open = false;
      },
      customize() {
        this.hex = StudioColorTools.valid(this.modelValue) ? this.modelValue : '#ffffff';
        Object.assign(this, StudioColorTools.fromHex(this.hex));
        this.open = false;
        this.customOpen = true;
      },
      editHex(value) {
        this.hex = value;
        if (StudioColorTools.valid(value)) Object.assign(this, StudioColorTools.fromHex(value));
      },
      updateHex() {
        this.hex = StudioColorTools.toHex(this.h, this.s, this.v);
      },
      wheelPoint(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
        const y = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
        this.h = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
        this.s = Math.min(1, Math.hypot(x, y));
        this.updateHex();
      },
      startWheel(event) {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        this.wheelPoint(event);
      },
      moveWheel(event) {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) this.wheelPoint(event);
      },
      wheelKey(event) {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        if (event.key === 'ArrowLeft') this.h = (this.h + 355) % 360;
        if (event.key === 'ArrowRight') this.h = (this.h + 5) % 360;
        if (event.key === 'ArrowUp') this.s = Math.min(1, this.s + 0.05);
        if (event.key === 'ArrowDown') this.s = Math.max(0, this.s - 0.05);
        this.updateHex();
      },
      saveColor() {
        if (!StudioColorTools.valid(this.hex)) return;
        const color = this.hex.toLowerCase();
        this.studioPalette?.add(color);
        this.choose(color);
        this.customOpen = false;
      },
    },
    template: `<div class="color-picker">
      <span class="field-caption">{{ caption || label }}</span>
      <v-menu v-model="open" :close-on-content-click="false" location="bottom end">
        <template #activator="{ props }">
          <button v-bind="props" type="button" class="color-trigger" :aria-label="label" :title="label">
            <span :style="{backgroundColor: modelValue || '#000000'}"></span>
          </button>
        </template>
        <section class="color-popover" :aria-label="'Selector de ' + label">
          <div class="color-swatches" role="group" aria-label="Paleta activa">
            <button v-for="color in colors" :key="color.hex" type="button" :style="{backgroundColor:color.hex, color:colorText(color.hex)}"
              :aria-label="'Usar ' + color.name + ' ' + color.hex.toUpperCase()" :aria-pressed="modelValue?.toLowerCase() === color.hex" @click="choose(color.hex)">
              <span>{{ color.name }}</span><code>{{ color.hex.toUpperCase() }}</code>
            </button>
          </div>
          <button type="button" class="color-personalize" @click="customize">Personalizar color…</button>
        </section>
      </v-menu>
      <v-dialog v-model="customOpen" max-width="360">
        <section class="color-custom-modal panel" :aria-label="'Personalizar ' + label">
          <div class="dialog-heading"><h3>Personalizar color</h3></div>
          <div class="color-wheel" role="group" tabindex="0" aria-label="Rueda cromática" aria-description="Arrastra para elegir tono y saturación. Flechas izquierda y derecha cambian el tono; arriba y abajo la saturación."
            @pointerdown="startWheel" @pointermove="moveWheel" @keydown="wheelKey">
            <span class="color-wheel-shade" :style="{opacity:1-v}"></span>
            <span class="color-wheel-marker" :style="wheelMarker"></span>
          </div>
          <label class="color-brightness">Luminosidad<input type="range" min="0" max="1" step="0.01" v-model.number="v" @input="updateHex" aria-label="Luminosidad del color" /></label>
          <div class="color-custom-value">
            <span class="color-sample" :style="{backgroundColor:validHex ? hex : modelValue}" aria-label="Muestra del color"></span>
            <label>Hexadecimal<input type="text" :value="hex" maxlength="7" :aria-label="'Hexadecimal de ' + label" @input="editHex($event.target.value)" spellcheck="false" :aria-invalid="!validHex" /></label>
            <button type="button" class="control-icon" @click="customOpen=false" aria-label="Cancelar" title="Cancelar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg>
            </button>
            <button type="button" class="control-icon color-save" :disabled="!validHex" @click="saveColor" aria-label="Guardar color" title="Guardar color">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>
            </button>
          </div>
        </section>
      </v-dialog>
    </div>`,
  },
  GenreSelect: {
    props: { modelValue: String, genres: Array, label: { default: 'Estilo musical' } },
    emits: ['update:modelValue'],
    template: `<label class="genre-field">{{ label }}
      <select :aria-label="label" :value="modelValue || ''" @change="$emit('update:modelValue', $event.target.value)">
        <option v-for="genre in genres" :key="genre" :value="genre">{{ genre }}</option>
        <option v-if="modelValue && !genres.includes(modelValue)" :value="modelValue">{{ modelValue }}</option>
        <option value="">Otro estilo…</option>
      </select>
      <input v-if="!genres.includes(modelValue)" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" :aria-label="'Escribir ' + label" placeholder="Escribir estilo musical" maxlength="100" />
    </label>`,
  },
  RecordFields: {
    props: { record: Object, genres: Array, overflow: Object, original: Object },
    methods: {
      isCustom(key) {
        return this.original && String(this.record[key] || '') !== String(this.original[key] || '');
      },
      fieldHint(key) {
        const messages = [];
        if (this.overflow?.[key])
          messages.push('Se acorta en la tarjeta con esta fuente y tamaño.');
        if (this.original) messages.push('Original: ' + (this.original[key] || 'Sin texto'));
        return messages.join(' ');
      },
    },
    template: `<div class="record-fields">
      <div class="record-core">
        <label v-for="field in [
          {key:'artist', label:'Artista A', aria:'Artista A', placeholder:'Artista A'},
          {key:'artistB', label:'Artista B', aria:'Artista B', placeholder:'Opcional'},
          {key:'a', label:'Título cara A', aria:'Canción A', placeholder:'Título de la cara A'},
          {key:'b', label:'Título cara B', aria:'Canción B', placeholder:'Título de la cara B'}
        ]" :key="field.key">{{ field.label }}
          <span class="record-input-wrap" :class="{'has-restore': isCustom(field.key), 'has-overflow': overflow?.[field.key]}">
            <input v-model="record[field.key]" :aria-label="field.aria" maxlength="300"
              :placeholder="field.placeholder" :class="{'long-value': overflow?.[field.key]}"
              :title="fieldHint(field.key)" :aria-description="fieldHint(field.key)" />
            <button v-if="isCustom(field.key)" type="button" class="field-restore"
              @click="record[field.key] = original[field.key] || ''"
              :aria-label="'Restaurar original de ' + field.label" title="Volver al original">↶</button>
          </span>
        </label>
      </div>
      <details class="record-metadata"><summary>Datos musicales y selección</summary>
        <genre-select v-model="record.category" :genres="genres"></genre-select>
        <label>Velocidad del disco<select v-model="record.rpm" aria-label="Velocidad del disco"><option>33 RPM</option><option>45 RPM</option><option>78 RPM</option></select></label>
        <label>Número de selección<input v-model="record.number" aria-label="Número de selección" maxlength="60" /></label>
        <label>Sello<input v-model="record.label" aria-label="Sello" maxlength="300" /></label>
        <label>Año<input v-model="record.year" aria-label="Año" maxlength="20" /></label>
      </details>
    </div>`,
  },
  FontPicker: {
    props: { modelValue: String, options: Array, label: String, sample: String, inherit: Boolean },
    emits: ['update:modelValue'],
    data() {
      return { query: '' };
    },
    computed: {
      matchingFonts() {
        const plain = (value) =>
          String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
        const query = plain(this.query).trim();
        return (this.options || []).filter((font) =>
          plain(font.label + ' ' + font.value + ' ' + (font.keywords || '')).includes(query),
        );
      },
    },
    methods: {
      choose(value) {
        this.$emit('update:modelValue', value);
        this.$refs.menu.open = false;
      },
    },
    template: `<div class="font-picker"><span class="field-caption">{{ label }}</span>
      <details ref="menu" @toggle="query = ''"><summary :aria-label="label"><span :style="{fontFamily:modelValue || 'inherit'}">{{ modelValue || 'La misma que las canciones' }}</span><span aria-hidden="true">⌄</span></summary>
        <div class="font-options" role="group" :aria-label="label">
          <span class="font-search"><input type="search" v-model="query" :aria-label="'Buscar ' + label" placeholder="Buscar fuente…" autocomplete="off" /></span>
          <p v-if="!matchingFonts.length" class="font-empty" role="status">No hay fuentes con ese nombre.</p>
          <button v-if="inherit" type="button" :aria-pressed="!modelValue" @click="choose('')">La misma que las canciones</button>
          <button v-for="font in matchingFonts" :key="font.value" type="button" :aria-pressed="modelValue === font.value" @click="choose(font.value)">
            <small>{{ font.label }}</small><span :style="{fontFamily:font.value}">{{ sample || 'Música con carácter · ÁÉÍÓÚ Ñ' }}</span>
          </button>
        </div>
      </details>
    </div>`,
  },
};
