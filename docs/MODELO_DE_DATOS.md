# Modelo de datos

## Colecciones y discos

Cada entrada de `collections` tiene identificador, nombre y una lista `cards`.
El disco guarda `artist`, `artistB`, `a`, `b`, `number`, `category`,
`rpm`, `label` y `year`. Artista A/B y títulos de ambas caras se editan por
separado. La línea central de la etiqueta une los artistas con `/`.

Editar en **Discos** modifica los datos originales. Mover un disco entre
colecciones conserva su identificador y las referencias de las composiciones.

## Composiciones y posiciones

Cada composición tiene identificador, nombre, hojas y `items`. Cada posición
conserva su identificador, `cardId`, `page`, `x`, `y` y `appearance`.
Un disco puede aparecer varias veces o en distintas composiciones.

`appearance` contiene diseño, fuentes, tamaños en píxeles, colores de canciones,
artista, papel y elementos gráficos, y visibilidad de género, RPM y selección.
Los valores predeterminados de diseños se guardan en `settings.templateDefaults`;
cambiarlos no altera posiciones existentes.

La edición de Composición usa los cuatro campos habituales para personalizar
solo esa tarjeta. `items[].text` guarda las diferencias mediante `artistA`,
`artistB`, `a` y `b`. Restablecer el valor original elimina la diferencia.
Se mantiene la lectura del campo central `text.artist` de copias de usuario.

Eliminar una posición deja el hueco y conserva el disco. Eliminar un disco
retira sus referencias. Duplicar una tarjeta reutiliza el disco, pero copia
su aspecto y textos a una posición independiente.

## Persistencia y copias

El estado usa el esquema JSON 5 y la clave de navegador `title-studio-v3`.
El nombre de esa clave se conserva para mantener los datos instalados.
Las claves `collections` y `collection` siguen siendo parte del formato de
copias de usuario. Guardar todo exporta el estado actual; las copias parciales
remapean identificadores cuando es necesario para evitar colisiones.

No hay sincronización con GitHub ni entre dispositivos. El historial de Deshacer
solo cubre cambios de la sesión. Las copias JSON son la copia transportable.

## Tipografía y recorte

Los avisos y el SVG comparten la medición Canvas de glifos con la fuente y tamaño
reales, y el ancho interior disponible de cada diseño. Cargar las fuentes
invalida la caché y actualiza los resultados. El recorte añade puntos suspensivos,
mantiene el tamaño de letra y no modifica los textos guardados.

Tabla evalúa las tarjetas de la composición activa; si el disco no está
insertado, utiliza su apariencia predeterminada. La lista móvil y el formulario
utilizan el mismo cálculo. Las fuentes locales y sus licencias se incluyen en
la distribución y se incrustan también en los SVG.

## Geometría e impresión

Las medidas de etiqueta, papel, márgenes y separación se expresan en milímetros.
Las posiciones se acoplan a huecos de una cuadrícula. La composición puede
mostrar varias hojas según anchura y zoom, y mover tarjetas entre ellas.

El centrado de etiquetas afecta solo al eje horizontal; se respeta el margen
superior y la escala física. La vista previa y el PDF comparten el dibujo SVG.
El PDF conserva la configuración seleccionada; la impresora o el visor pueden
requerir **Tamaño real** o **100 %** para evitar reescalado.

## Plantillas propias

`settings.customTemplates` contiene los diseños del catálogo, identificados por
`custom-…`. Cada entrada tiene nombre, colores y `design`, con versión 1 y una
lista ordenada de elementos: texto, rectángulo, elipse, línea, SVG o imagen.
Cada capa conserva geometría en el lienzo 300 × 150, color, tipografía,
visibilidad y vínculo opcional con un campo del disco.

Aplicar una plantilla copia su diseño a `appearance.customDesign`. Los diseños
aplicados son autónomos respecto al catálogo; las copias parciales de composición
no necesitan resolver un identificador externo. Cambiar a un diseño integrado
retira esa copia de apariencia. El renderizado y los avisos tipográficos usan
las medidas de cada capa de texto.

Los SVG pasan por una lista de elementos y atributos permitidos tanto al importar
como al dibujar. Las imágenes admiten únicamente datos PNG/JPG/WebP incrustados.
La importación JSON valida y normaliza los diseños antes de sustituir el estado.
