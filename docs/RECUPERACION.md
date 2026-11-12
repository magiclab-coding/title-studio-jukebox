# Recuperación y versiones anteriores

## Recuperar el programa

1. Elegir una revisión en `versions/vN`.
2. Para la versión 1, servir directamente `dist/index.html`.
3. Para las versiones con package.json, trabajar en una copia separada de esa carpeta y ejecutar `npm install` y `npm run build`; `npm test` cuando exista.
4. Revisar el resultado antes de desplegarlo.

El repositorio de GitHub es un archivo de código. No se ha conectado automáticamente al alojamiento actual de Sites. Para restaurar el sitio ya publicado, pedir en su conversación: «Restaura Title Studio a la versión N». Sites conserva sus propias versiones publicadas.

Antes de usar un programa anterior, descargar una copia JSON completa y trabajar preferiblemente en otro perfil o navegador: las versiones antiguas pueden no interpretar campos introducidos después. Restaurar el código no restaura los datos personales.

## Recuperar los datos

En la aplicación: Guardar todo descarga la copia JSON. Para cargarla: Importar y exportar → seleccionar el JSON → revisar → Cargar copia. Ajustes → Versiones recuperables permite guardar y recuperar hasta diez copias locales.

Las copias locales desaparecen al borrar los datos del navegador. Las colecciones personales y las copias JSON del usuario no se incluyen en este repositorio.

## Verificación de la versión 7

Las pruebas automatizadas cubren selección de discos, posiciones y huecos, estilos independientes entre composiciones, referencias a discos de distintas colecciones, duplicación sin duplicar vinilos, restauración, impresión, zoom persistente y movimiento por destino. También se revisaron las interfaces de escritorio y de 360 píxeles de ancho. No se ha realizado una prueba física en la impresora ni en el teléfono del usuario.
