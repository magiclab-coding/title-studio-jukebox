# Modelo de datos · versión 7

## Colecciones

Cada colección tiene identificador, nombre y una lista de discos. Un disco conserva artista, títulos de ambas caras, artista B, selección, categoría, sello y año. Ejemplos de colecciones: «Discos de mi madre», «Discos de punk» y «Discos de Alejandro».

## Composiciones

Cada composición tiene identificador, nombre, número de hojas opcional y tarjetas. Cada tarjeta tiene su propio identificador y referencia `cardId` al disco original; `appearance` guarda diseño, tinta, papel, tipografía y tamaño de texto. `page`, `x` e `y` guardan su posición.

Un mismo disco puede aparecer en distintas composiciones y repetirse dentro de una composición. Cada posición puede tener un estilo diferente. Los textos corresponden al disco de la colección; editar el contenido del disco se refleja donde se utiliza. Cambiar el estilo de una posición no modifica otras posiciones ni composiciones.

Eliminar una tarjeta de una composición deja el hueco y conserva el disco de la colección. Eliminar un disco de su colección elimina también sus referencias en las composiciones.

## Persistencia

El sistema utiliza localStorage bajo la clave histórica `title-studio-v3`; la versión 7 exporta el esquema JSON 5. Se conserva la lectura de claves antiguas para migración. Las copias JSON completas incluyen colecciones, composiciones, ajustes y preferencias. No hay sincronización de datos entre dispositivos ni copia automática de los datos del navegador en GitHub.
