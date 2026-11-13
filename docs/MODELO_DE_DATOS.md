# Modelo de datos · versión 7

## Listas de discos

Cada lista de discos tiene identificador, nombre y una lista de discos. Un disco conserva artista, títulos de ambas caras, artista B, selección, categoría, sello y año. Ejemplos de listas de discos: «Discos de mi madre», «Discos de punk» y «Discos de Alejandro».

## Composiciones

Cada composición tiene identificador, nombre, número de hojas opcional y tarjetas. Cada tarjeta tiene su propio identificador y referencia `cardId` al disco original; `appearance` guarda diseño, color de canciones (`ink`), color de artista (`artistInk`), papel, fuente de canciones (`font`), fuente del artista (`artistFont`), tamaños en px (`titlePx`, `artistPx`) y visibilidad independiente (`showGenre`, `showRpm`, `showNumber`). `page`, `x` e `y` guardan su posición.

Un mismo disco puede aparecer en distintas composiciones y repetirse dentro de una composición. Cada posición puede tener un estilo diferente. Los textos corresponden al disco de la lista de discos; editar el contenido del disco se refleja donde se utiliza. Cambiar el estilo de una posición no modifica otras posiciones ni composiciones.

Eliminar una tarjeta de una composición deja el hueco y conserva el disco de la lista de discos. Eliminar un disco de su lista de discos elimina también sus referencias en las composiciones.

## Persistencia

El sistema utiliza localStorage bajo la clave histórica `title-studio-v3`; la versión 7 exporta el esquema JSON 5. Se conserva la lectura de claves antiguas para migración. Las copias JSON completas incluyen listas de discos, composiciones, ajustes y preferencias. No hay sincronización de datos entre dispositivos ni copia automática de los datos del navegador en GitHub.

## Diseño y tipografías

La plantilla **Pincel · El Río** dispone canción A arriba, artista centrado y canción B abajo. Las canciones comparten color; el artista tiene un color independiente. Ninguna plantilla dibuja marco exterior. Las guías de corte de impresión siguen siendo opcionales y no forman parte del diseño.

Los intérpretes se editan en Artista A y Artista B. La tarjeta muestra ambos en su campo central separados por `/`.

Trade Winds es una aproximación libre al trazo irregular de la referencia, no una identificación exacta. Se incluyen también Permanent Marker, DM Sans, Space Grotesk, Oswald y Playfair Display. Los paquetes Fontsource están fijados en package-lock.json; el build incrusta fuentes WOFF2 en los SVG y publica sus licencias en `dist/licenses`. Así pantalla y PDF comparten el mismo dibujo, sin peticiones a Google Fonts.

Los selectores nativos muestran una flecha consistente. Estilo musical utiliza el mismo selector real en la tabla y los formularios; Otro estilo permite texto libre.

## Interfaz 7.0.7

La interfaz usa **Discos** y **Mis discos**. Internamente se mantienen las claves `collections` y `collection` para leer las copias antiguas sin perder sus referencias. Los nombres de listas personalizados se conservan.

Los registros guardan `artist` (Artista A) y `artistB` (Artista B) por separado. El SVG une los dos valores con `/`; una copia anterior con ambos valores unidos se separa al normalizarla, sin dividir nombres como AC/DC. CSV y Excel admiten tanto los encabezados antiguos como Artista A/B y Canción A/B.

`titlePx` y `artistPx` expresan el tamaño en píxeles del diseño SVG (viewBox de 300 unidades de ancho). Los porcentajes antiguos se convierten automáticamente. Se mantienen el ajuste de textos largos y la escala física definida por las medidas de la etiqueta. `showGenre`, `showRpm` y `showNumber` controlan por separado los tres metadatos. `rpm` guarda la velocidad de cada disco; los valores vacíos se normalizan a 45 RPM. Se conservan las velocidades explícitas de 33 y 78 RPM.

Discos abre el formulario sin insertar la nueva ficha en una composición. Composición ofrece selección múltiple entre listas de discos y conserva los huecos libres. Solo se muestra una hoja, indicada por `ui.composePage`. Eliminar hoja retira sus posiciones, desplaza las hojas posteriores, conserva los discos originales y permite deshacer.

El centrado horizontal es una traslación de presentación y salida: no se reescriben las coordenadas originales de los huecos. La vista previa, la impresión y el PDF usan el mismo desplazamiento. No se centra verticalmente: se conserva el margen superior.

## Interfaz 7.0.8

`ui.columnKeys` conserva las columnas visibles; el valor inicial es Artista A/B y Canción A/B. Ocultar una columna limpia su filtro para evitar resultados inexplicables. Las exportaciones siguen incluyendo todos los campos.

Cada plantilla define su tipografía de previsualización. Cambiar el diseño conserva las opciones de visibilidad de estilo musical, RPM y selección. Pincel admite los mismos metadatos que el resto. Los diseños geométricos exploran familias de líneas, cintas y bloques como las documentadas en https://jukebox.tools/jukebox-title-strip-designs, sin incorporar imágenes externas.

La edición de tarjetas y la inserción usan el mismo modal en escritorio y móvil. Las acciones aparecen al seleccionar y se ocultan al pulsar fuera. Estilo para todas utiliza un borrador: solo el botón de aplicación copia el aspecto a todas las posiciones de la composición; cada posición recibe una copia independiente.

Durante un arrastre, permanecer 650 ms a 24 px del borde cambia a la hoja contigua existente. Se conserva la fila y se entra por la columna del borde opuesto. Para volver a cambiar de hoja hay que salir de la zona del borde y entrar de nuevo. La captura del puntero permanece en el canvas al sustituir la hoja; cancelar restaura el estado anterior y completar registra una única operación de deshacer.

## Interfaz 7.0.10

Los formularios de discos contienen solo datos musicales. La creación de una tarjeta en composición ofrece estilo; editar sus datos no abre controles de diseño. El diálogo de estilo separa selección y parámetros. El catálogo edita valores en `settings.templateDefaults`, incluidos en las copias completas, y cada nueva asignación recibe sus propios valores. Cambiar un predeterminado no modifica posiciones existentes.

Crear un disco compara Artista A/B y Canción A/B dentro de la lista destino, normalizando espacios y mayúsculas; si coincide solicita confirmación antes de repetirlo. Las hojas visibles se calculan según anchura disponible y zoom, hasta tres, y el arrastre calcula el destino sobre la hoja bajo el puntero. Se mantiene el centrado exclusivamente horizontal.
