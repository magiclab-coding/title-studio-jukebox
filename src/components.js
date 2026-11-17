// --- Controles compartidos: el mismo formulario en todos los contextos ---
globalThis.StudioComponents = {
  // Un selector compartido mantiene la misma paleta y entrada libre en todos los editores.
  ColorPicker: {
    props: { modelValue: String, label: String, caption: String },
    emits: ['update:modelValue'],
    data() {
      return {
        open: false,
        hex: this.modelValue || '#000000',
        colors: ['#ffffff', '#f7f2df', '#e5e7eb', '#9ca3af', '#374151', '#000000',
          '#7f1d1d', '#b9553b', '#ef4444', '#f97316', '#f59e0b', '#ffcc00',
          '#854d0e', '#a3a635', '#16a34a', '#213d36', '#377d71', '#14b8a6',
          '#0891b2', '#005bbb', '#28548a', '#172d40', '#6366f1', '#7c3aed',
          '#581c87', '#a21caf', '#db2777', '#f472b6', '#fda4af', '#a16207'],
      };
    },
    watch: {
      modelValue(value) { this.hex = value || '#000000'; },
    },
    methods: {
      choose(value) {
        if (!/^#[0-9a-f]{6}$/i.test(value)) return;
        this.hex = value;
        this.$emit('update:modelValue', value);
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
          <div class="color-swatches" role="group" aria-label="Paleta de colores">
            <button v-for="color in colors" :key="color" type="button" :style="{backgroundColor:color}"
              :aria-label="'Usar ' + color" :aria-pressed="modelValue?.toLowerCase() === color" @click="choose(color)"></button>
          </div>
          <div class="color-custom">
            <label>Personalizado<input type="color" :value="modelValue || '#000000'" :aria-label="'Color personalizado de ' + label" @input="choose($event.target.value)" /></label>
            <label>Hexadecimal<input type="text" v-model="hex" maxlength="7" pattern="#[0-9a-fA-F]{6}" :aria-label="'Hexadecimal de ' + label" @input="choose(hex)" @blur="hex=modelValue || '#000000'" spellcheck="false" /></label>
          </div>
          <button type="button" class="text-btn" @click="open=false">Listo</button>
        </section>
      </v-menu>
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
