# 7.0.9

- Recursos JavaScript y CSS identificados por el hash de su contenido para evitar mezclar archivos en caché de diferentes despliegues. Conserva los datos locales.
- Prueba de integridad entre cada URL de recurso y su contenido publicado.

# 7.0.8

- Columnas configurables y persistentes; inicialmente se muestran Artista A/B y Canción A/B. Velocidad predeterminada: 45 RPM.
- Guardar y deshacer usan iconos grandes con ayuda al pasar el ratón o enfocar.
- Previsualizaciones con fuentes propias por plantilla y visibilidad de metadatos respetada al cambiar de diseño.
- Diseños diferenciados con líneas gruesas, cintas, estrellas y artista en negativo; nuevas variantes Artista en negativo, Pill Line y Broadway Chevron.
- Edición e inserción mediante modal en escritorio y móvil; acciones contextuales con papelera y cierre al pulsar fuera.
- Arrastrar durante 650 ms junto a un borde cambia a la hoja contigua existente; cancelar restaura la posición original.
- Estilo para todas permite preparar y aplicar un mismo aspecto a todas las posiciones de la composición sin cambiar los discos originales.
- Pruebas de regresión de fuentes, metadatos, columnas, estilos independientes y arrastre entre hojas; compilación de producción minificada.

# 7.0.7

- Aplicadas las 14 anotaciones de interfaz: Discos/Mis discos, cabeceras con los nombres de la barra lateral y acciones Guardar/Deshacer a la derecha.
- Eliminado el nombre editable permanente; la creación y el cambio de nombre de listas se hacen en un modal.
- Alta de discos junto a Buscar mediante el formulario común. Artista A/B y Canción A/B visibles en todos los editores.
- Estilo musical con selector real también en la tabla; vista móvil en fichas con filtros y paginación.
- Inserción múltiple desde Composición y una sola hoja visible, con navegación, alta y eliminación reversible.
- Tamaños tipográficos en px, selección de fuentes con muestras y tres metadatos ocultables por separado.
- Centrado solo horizontal, común a composición, vista previa, impresión y PDF; se conservan la altura de filas y el margen superior.

# 7.0.6

- Plantilla Pincel inspirada en El Río: artista central y canciones arriba y abajo, sin marcos exteriores.
- Colores, fuentes y tamaños independientes para canciones y artista; metadatos opcionales.
- Seis fuentes libres locales, incrustadas en SVG y PDF, con sus licencias en la distribución.
- Dos artistas en un único campo separados por /, con compatibilidad para copias antiguas.
- Flechas visibles en todos los selectores y selector de género real con entrada personalizada.

# 7.0.5

- Añadido el favicon del pulpo con esquinas transparentes, PNG de 96 px e ICO de 16/32/48 px. Faltaban la declaración HTML y el archivo en la distribución.
- Ruta relativa compatible con GitHub Pages y versión en la URL para renovar la caché.

# 7.0.4

- Corregido el arranque en blanco causado por cadenas partidas dentro de interpolaciones Vue.
- Minificación de HTML, JavaScript y CSS solo en la distribución.
- Validación de las plantillas fuente y publicadas en integración continua.

## 7.0.3 · Comentarios y secciones del código

- Cabeceras de sección en aplicación, plantillas, estilos, PDF, pruebas y automatización.
- Comentarios breves sobre propiedad de datos, compatibilidad, coordenadas, borradores y limpieza de recursos.
- Garantías de publicación e idempotencia explicadas junto al código correspondiente.
- Regla persistente para comentar el código futuro sin repetir lo evidente.
- Revisión documental sin cambios de funcionamiento; versiones históricas intactas.

## 7.0.2 · Código fuente legible

- Formato del código activo JavaScript, HTML y CSS con sangrado y saltos de línea.
- Prettier fijado en dependencias, comandos format y format:check y comprobación en CI.
- Regla persistente de código legible en AGENTS.md; builds y dependencias fuera del repositorio.
- Instantáneas históricas y tags existentes conservados sin cambios.

## 7.0.1 · Flujo nativo de GitHub

- Ramas feature por interacción desde develop y publicación al integrar en main.
- CI de pruebas y build, tags/Releases reales y despliegue del mismo artefacto en Pages.
- Migración de las siete revisiones históricas y reglas persistentes en AGENTS.md.
- Pages pendiente de habilitación según visibilidad y plan de la cuenta.

## 7.0.0 · Colecciones y composiciones independientes

- Los vinilos pertenecen a colecciones; las composiciones guardan referencias, estilos propios y posiciones.
- Migración de composiciones anteriores: conserva sus tarjetas, diseños y huecos.
- Duplicar tarjeta crea otra posición del mismo disco, sin duplicarlo en la colección.
- Celda vacía: elegir un disco de cualquier colección o crear uno y elegir dónde guardarlo.
- Cambiar estilo desde la vista previa del formulario, antes de confirmar la inserción.
- Opciones de composición en modal; eliminadas cabecera global, cabecera decorativa de composición y pie.
- Zoom hasta 300 %, incluido en el guardado y la restauración.
- Mover en móvil: icono para arrastrar o tocar una celda de destino; las ocupadas desplazan tarjetas.
- Iconos translúcidos, centrados en móvil y en la esquina superior en escritorio.

## 6.0.0 · Acciones táctiles y formularios

- Tocar una tarjeta muestra cuatro iconos sobre ella: editar, estilo, duplicar y eliminar.
- En móvil, edición y duplicación en formularios con guardar/cancelar; eliminar abre confirmación.
- Tocar un hueco abre «Nueva tarjeta»; cancelar no crea discos ni ocupa huecos.
- Desactivado el arrastre móvil para permitir desplazamiento vertical sin mover tarjetas por accidente.
- Se mantiene el editor de escritorio.

## 5.0.0 · Composición compacta y contextual

- Cuadrícula con huecos vacíos: tocar crea una tarjeta editable en esa posición.
- Acciones por tarjeta: edición directa, estilos en modal, duplicar y vaciar hueco.
- Panel de contenido y acceso de edición visibles en escritorio; interfaz compacta en móvil.
- Vaciar conserva los huecos; arrastrar a un hueco lo ocupa sin compactar el resto.
- Hojas adicionales persistentes, conservadas en copias e impresión.
- Opciones de composición y selector de colección recogidos en menús y modales.

# Title Studio 4.0 · 12 noviembre 2026

- Barra minimizada con un icono por contexto, estado activo y nombres accesibles.
- Gestos horizontales desde la barra o el borde izquierdo: derecha abre, izquierda cierra/desfija; desplazamiento vertical independiente.
- Selector de colección activa permanente en la cabecera. Cambiar colección limpia filtros y selección de discos pendientes.
- Paneles principales renovados, controles más claros y adaptación a 360 × 640 píxeles.
- Tarjetas sin cabeceras: arrastre desde toda la superficie, inserción en cuadrícula y desplazamiento del resto, incluso entre hojas. Flechas del teclado como alternativa. Quitar tarjeta en el inspector.
- Guardar todo descarga JSON con colecciones, composiciones, estilos, ajustes, preferencias de interfaz e impresión y diez versiones de datos. La importación conserva una copia previa.
- Descarga directa PDF 1:1 con papel y orientación incorporados, contenido a 600 ppp y preferencia PrintScaling None. Las dimensiones no dependen del diálogo de impresión del navegador.
- Impresión del navegador tras actualizar el DOM y con una instantánea de configuración y contenido.
- Corregida la referencia al disco en el editor «Una etiqueta».

## Recuperar datos

Guardar todo → conservar el JSON descargado. Para restaurarlo: Importar y exportar → seleccionar JSON → revisar → Cargar copia. Reemplaza el sistema completo y guarda antes una versión recuperable. Ajustes → Versiones recuperables permite crear y restaurar hasta diez copias locales. Esas copias desaparecen si se borran los datos del navegador; el JSON es la copia transportable entre dispositivos. No hay sincronización automática entre dispositivos.

## Volver a una versión anterior del programa

Pedir en el chat: «Restaura Title Studio a la versión 3», o indicar 2 o 1. Se vuelve a desplegar la versión guardada correspondiente, sin borrar el historial. La recuperación de código no restaura los discos: exportar primero un JSON completo.

| Versión de Sites             | Commit conservado                        | Identificador de versión                                                          |
| ---------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| 3 (anterior a esta revisión) | 245cee2dd191c286a5f3e2de7379e027e50d341b | appgprj_6af50e142b7c81918ff97a0ded609004~appgver_7147b77be0888191aab9646b9d84515e |
| 2                            | e8faf2e993dc4f07d0864fe1a6b234ee167a5ff1 | appgprj_6af50e142b7c81918ff97a0ded609004~appgver_53aaf5ec6e4081919ba739fcb421b874 |
| 1                            | a3e2667b1484b15a4ddcb2b8891a897fc930246a | appgprj_6af50e142b7c81918ff97a0ded609004~appgver_39e8c2c571688191823f3bf8b08cc4d3 |

La clave local title-studio-v3 se conserva para mantener compatibilidad con los datos existentes. El formato JSON incorpora schema 4. No se borran las claves v1/v2.

## Impresión y límites

Elegir papel y orientación dentro de Title Studio y pulsar Descargar PDF · 1:1. El archivo conserva milímetros exactos. El visor o controlador de impresora puede ignorar la preferencia de no escalar; usar Tamaño real o 100 % en un visor que lo permita. La aplicación no puede añadir esa opción al diálogo de Android ni imponer los márgenes de una impresora. La alternativa Imprimir con el navegador sigue dependiendo de ese diálogo.

## Validación

- npm test: importación de 1.000 discos, filtros, paginación, colección activa, copia completa y parcial, deshacer, fuente de impresión persistente, reordenación por inserción y cierre/apertura por gesto.
- Navegador: arrastre de A1 al segundo hueco desplaza A2 al primero, menú compacto, apertura móvil, creación y cambio de colección en marco de 360 × 640.
- PDF real descargado en navegador y analizado con PyMuPDF: A4 horizontal de 297 × 210 mm, seis imágenes colocadas a 76 × 38 mm, error menor a 0,001 mm. Render revisado visualmente.
- No se ha probado físicamente en una impresora ni en el dispositivo Sony del usuario.

---

# Title Studio 3.0

- Collapsible, pinnable navigation with independent mobile scrolling.
- Responsive layouts verified at 360 × 640 CSS pixels.
- Named collections, paginated editable tables, per-column filters and sorting.
- Independent named compositions containing explicitly selected records.
- Pointer-based card placement, duplicate/delete compositions and undo.
- Whole-system or scoped JSON backups and up to ten recoverable data snapshots.
- Collection/composition print sources, multiple-page preview and fixed physical card dimensions in either orientation.

## Recovery

The prior published application is Sites version 2, source commit e8faf2e993dc4f07d0864fe1a6b234ee167a5ff1. It remains in source and publication history for rollback.

Version 3 reads existing browser storage from v2/v1 when no v3 data exists. Legacy keys remain intact. Export a complete JSON backup to move data between devices. New compositions begin empty; adding records to a collection never automatically inserts them into a composition.

Use Settings → Versions to snapshot/restore browser data. A snapshot is created before loading a JSON backup or deleting a collection. Full-system loading replaces the system; scoped collection/composition loading adds a new independent copy. Changing paper geometry reflows compositions while preserving card dimensions. Printing a composition retains its saved positions until geometry changes or Reorganize is used.

Validation: `npm test` exercises import of 1,000 records, filtering/pagination, selection, printing, orientation, full/scoped restore including manual positions, collections, and undo. Browser QA additionally covered 306 records, pointer dragging and a 360 × 640 frame.
