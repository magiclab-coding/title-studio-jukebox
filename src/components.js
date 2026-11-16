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
          <span class="record-input-wrap">
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
