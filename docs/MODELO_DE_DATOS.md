# Modelo de datos · versión 7

## Colecciones

Cada colección tiene identificador, nombre y una lista de discos. Un disco conserva artista, títulos de ambas caras, artista B, selección, categoría, sello y año. Ejemplos de colecciones: «Discos de mi madre», «Discos de punk» y «Discos de Alejandro».

## Composiciones

Cada composición tiene identificador, nombre, número de hojas opcional y tarjetas. Cada tarjeta tiene su propio identificador y referencia `cardId` al disco original; `appearance` guarda diseño, color de canciones (`ink`), color de artista (`artistInk`), papel, fuente de canciones (`font`), fuente del artista (`artistFont`), tamaños (`size`, `artistSize`) y visibilidad de metadatos (`showMeta`). `page`, `x` e `y` guardan su posición.

Un mismo disco puede aparecer en distintas composiciones y repetirse dentro de una composición. Cada posición puede tener un estilo diferente. Los textos corresponden al disco de la colección; editar el contenido del disco se refleja donde se utiliza. Cambiar el estilo de una posición no modifica otras posiciones ni composiciones.

Eliminar una tarjeta de una composición deja el hueco y conserva el disco de la colección. Eliminar un disco de su colección elimina también sus referencias en las composiciones.

## Persistencia

El sistema utiliza localStorage bajo la clave histórica `title-studio-v3`; la versión 7 exporta el esquema JSON 5. Se conserva la lectura de claves antiguas para migración. Las copias JSON completas incluyen colecciones, composiciones, ajustes y preferencias. No hay sincronización de datos entre dispositivos ni copia automática de los datos del navegador en GitHub.

## Diseño y tipografías

La plantilla **Pincel · El Río** dispone canción A arriba, artista centrado y canción B abajo. Las canciones comparten color; el artista tiene un color independiente. Ninguna plantilla dibuja marco exterior. Las guías de corte de impresión siguen siendo opcionales y no forman parte del diseño.

Dos intérpretes se escriben `Artista A / Artista B` en el campo Artista. La importación conserva compatibilidad con la antigua columna Artista B: se incorpora al campo unificado al normalizar el disco.

Trade Winds es una aproximación libre al trazo irregular de la referencia, no una identificación exacta. Se incluyen también Permanent Marker, DM Sans, Space Grotesk, Oswald y Playfair Display. Los paquetes Fontsource están fijados en package-lock.json; el build incrusta fuentes WOFF2 en los SVG y publica sus licencias en `dist/licenses`. Así pantalla y PDF comparten el mismo dibujo, sin peticiones a Google Fonts.

Los selectores nativos muestran una flecha consistente. En la creación, Género utiliza un select real y la opción Otro género permite texto libre.
