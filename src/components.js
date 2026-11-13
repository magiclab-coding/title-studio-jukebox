// --- Controles compartidos: el mismo formulario en todos los contextos ---
globalThis.StudioComponents = {
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
    props: { record: Object, genres: Array },
    template: `<div class="record-fields">
      <div class="record-core">
        <label>Artista A<input v-model="record.artist" aria-label="Artista A" maxlength="300" placeholder="Artista principal" /></label>
        <label>Artista B<input v-model="record.artistB" aria-label="Artista B" maxlength="300" placeholder="Opcional" /></label>
        <label>Canción A<input v-model="record.a" aria-label="Canción A" maxlength="300" placeholder="Título de la cara A" /></label>
        <label>Canción B<input v-model="record.b" aria-label="Canción B" maxlength="300" placeholder="Título de la cara B" /></label>
      </div>
      <details class="record-metadata"><summary>Datos musicales y selección</summary>
        <genre-select v-model="record.category" :genres="genres"></genre-select>
        <label>Velocidad del disco<select v-model="record.rpm" aria-label="Velocidad del disco"><option value="">Usar ajuste del proyecto</option><option>33 RPM</option><option>45 RPM</option><option>78 RPM</option></select></label>
        <label>Número de selección<input v-model="record.number" aria-label="Número de selección" maxlength="60" /></label>
        <label>Sello<input v-model="record.label" aria-label="Sello" maxlength="300" /></label>
        <label>Año<input v-model="record.year" aria-label="Año" maxlength="20" /></label>
      </details>
    </div>`,
  },
  FontPicker: {
    props: { modelValue: String, options: Array, label: String, sample: String, inherit: Boolean },
    emits: ['update:modelValue'],
    methods: {
      choose(value) {
        this.$emit('update:modelValue', value);
        this.$refs.menu.open = false;
      },
    },
    template: `<div class="font-picker"><span class="field-caption">{{ label }}</span>
      <details ref="menu"><summary :aria-label="label"><span :style="{fontFamily:modelValue || 'inherit'}">{{ modelValue || 'La misma que las canciones' }}</span><span aria-hidden="true">⌄</span></summary>
        <div class="font-options" role="group" :aria-label="label">
          <button v-if="inherit" type="button" :aria-pressed="!modelValue" @click="choose('')">La misma que las canciones</button>
          <button v-for="font in options" :key="font.value" type="button" :aria-pressed="modelValue === font.value" @click="choose(font.value)">
            <small>{{ font.label }}</small><span :style="{fontFamily:font.value}">{{ sample || 'Música con carácter · ÁÉÍÓÚ Ñ' }}</span>
          </button>
        </div>
      </details>
    </div>`,
  },
};
