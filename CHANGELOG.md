# 7.5.0

- Icono de restauración dentro del campo, con espacio reservado para el texto.
- Un campo por fila en pantallas pequeñas.
- Publicación de la limpieza de código y documentación integrada en develop.

# 7.4.1

- Limpieza de código sin uso, estilos y documentación desactualizada.
- Simplificación de copias de datos y del flujo de publicación.
- README actualizado con desarrollo local, datos y operación actuales.

# 7.4.0

- Publicación de avisos y acciones completos en móvil y restauración sin superponer caracteres.

# 7.3.1

- Avisos de recorte tipográfico también en los campos de la lista móvil.
- Acciones móviles de editar, cambiar de colección y eliminar iguales a escritorio.
- Restablecer ocupa su propio espacio, separado de los caracteres del campo.

# 7.3.0

- Publicación de edición integrada, avisos tipográficos reales y adaptación móvil de Colecciones.

# 7.2.1

- Personalización de textos integrada en los cuatro campos habituales; se retiran el icono T y el modal separado.
- Avisos en vivo y recorte basados en la anchura de glifos, fuente, tamaño y espacio del diseño.
- Botones de Colecciones adaptados al ancho móvil, con alineación y tamaños comunes.
- Compatibilidad con los textos particulares guardados en versiones anteriores.

# 7.2.0

- Publicación de textos personalizados por tarjeta, alineación de Tabla y limpieza de Ajustes.

# 7.1.1

- Textos propios de cada tarjeta sin modificar el vinilo original.
- Alineación exacta del icono de columnas y limpieza de Ajustes.
- Regla permanente de consistencia visual documentada.

# 7.1.0

- Publicación de los cambios validados en develop (7.0.16–7.0.19).
- Entorno local, muestras de plantillas, formularios y controles visuales consistentes.

# 7.0.19

- Selector de columnas como icono en las acciones de Tabla.
- Colores de papel y elementos con el mismo formato que los de fuentes.

# 7.0.18

- Campos nuevos vacíos con marcadores de posición.
- Muestras completas y separadas de los datos del disco.
- Metadatos con controles uniformes.

# 7.0.17

- Controles de fuente, tamaño y color con altura común y cuadros de tamaño/color iguales.
- Etiquetas Papel y Elementos colocadas sobre sus controles.
- Título del editor sin separador sobrante.
- La muestra abre un modal de plantillas con indicación de selección en hover y foco; elegir una plantilla cierra la selección.

# 7.0.16

- Desarrollo local con reconstrucción y recarga automática, escuchando solo en localhost.
- Arranque Windows y guía de instalación, actualización y traslado de datos.
- Nuevo flujo: funciones a develop con incremento de parche; publicación explícita a main con incremento menor y parche cero.

# 7.0.15

- Shuffle asigna un diseño disponible a cada posición de composición conservando textos y huecos.
- Insertar discos es la primera acción.
- Pulsar la muestra abre o cierra el catálogo; parámetros siempre visibles sin iconos redundantes.
- Color independiente para elementos gráficos y fuentes más legibles.
- Muestra de creación: Título de la cara A.

# 7.0.14

- Alinea títulos de Colecciones, Composiciones y Edición con los restantes bloques.
- Extiende el selector de composiciones y lleva sus acciones al extremo derecho; papelera consistente.
- Estilo global agrupado como icono con las acciones de edición.
- Selector y editor de estilo mediante iconos junto a la muestra, debajo en pantallas estrechas; catálogo solo bajo selección explícita.
- Muestra de nueva tarjeta con Canción A/B y Artista A sin guardar textos de ejemplo; campo Título cara A.

# 7.0.13

- Traslado individual y múltiple entre colecciones conservando referencias de composición.
- Gestión de composiciones mediante iconos y acciones de inserción, compactación e impresión en su barra de edición.
- Editor de estilo con filas compactas de fuente, tamaño y color; papel centrado bajo la tarjeta.
- Retirada de la plantilla de flechas del catálogo, manteniendo lectura de datos anteriores; seis diseños nuevos independientes.

# 7.0.12

- Barras de Colecciones, Añadir discos y Tabla con iconos uniformes y controles alineados.
- Selección múltiple, eliminación de seleccionados y vaciado de la colección con confirmación y deshacer.
- Textos largos truncados en las etiquetas sin reducir el cuerpo; datos completos conservados y celdas avisadas en color.
- Metadatos opcionales desactivados por defecto para tarjetas nuevas.
- Navegación por los extremos del conjunto de hojas visibles durante un arrastre.
- Opciones y estilo de composición con modales compactos y sin pie explicativo.

# 7.0.11

- Corrige el arrastre entre hojas contiguas: el destino se calcula con ambas coordenadas del puntero.
- Prueba de regresión con dos hojas a la misma altura y movimiento en ambos sentidos.

# 7.0.10

- Datos de discos separados del diseño; confirmación de duplicados por artistas y canciones dentro de cada lista.
- Catálogo editable con valores predeterminados persistentes; selección y edición de estilo en pasos separados.
- Hasta tres hojas contiguas según espacio y zoom; arrastre directo entre las hojas visibles.
- Filas sin color de selección en Discos.

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

## 7.0.2 · Código fuente legible

- Formato del código activo JavaScript, HTML y CSS con sangrado y saltos de línea.
- Prettier fijado en dependencias, comandos format y format:check y comprobación en CI.
- Regla persistente de código legible en AGENTS.md; builds y dependencias fuera del repositorio.

## 7.0.1 · Flujo nativo de GitHub

- Ramas feature por interacción desde develop y publicación al integrar en main.
- CI de pruebas y build, tags/Releases reales y despliegue del mismo artefacto en Pages.
- Pages pendiente de habilitación según visibilidad y plan de la cuenta.
