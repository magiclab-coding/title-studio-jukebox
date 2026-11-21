# Title Studio · Jukebox

Aplicación para organizar discos de vinilo y diseñar sus etiquetas de jukebox.

[Aplicación publicada](https://magiclab-coding.github.io/title-studio-jukebox/) ·
[Releases](https://github.com/magiclab-coding/title-studio-jukebox/releases)

## Qué permite hacer

- Organizar discos en colecciones y editar artistas, títulos, género, RPM, selección, sello y año.
- Importar y exportar listas en CSV o Excel y guardar el sistema completo en JSON.
- Crear composiciones con discos de cualquier colección, huecos, varias hojas y estilos independientes.
- Personalizar los textos de cada tarjeta conservando los originales del disco.
- Ajustar fuentes, tamaños y colores, con avisos cuando el texto se recorta.
- Descargar un PDF a escala 1:1 con las medidas físicas de las etiquetas.

## Desarrollo local

Requiere Git, Node.js 24 y npm.

```sh
git clone --branch develop https://github.com/magiclab-coding/title-studio-jukebox.git
cd title-studio-jukebox
npm ci
npm run dev
```

Abre http://127.0.0.1:5173/. El servidor se detiene con Ctrl+C y reconstruye al
editar el código. En Windows también puede utilizarse `INICIAR-DESARROLLO.cmd`.

[Instalación y actualización local](docs/DESARROLLO_LOCAL.md).

## Comprobaciones

```sh
npm run format
npm run format:check
npm test
node --test tests/release-version.mjs
npm run build
npm run test:build
```

`src/` contiene código legible y comentado. `dist/` es la distribución
minificada que genera el build; no se guarda en Git. Las fuentes y sus licencias
se incluyen en la distribución para que pantalla y PDF utilicen el mismo diseño.

## Ramas y publicación

Cada cambio empieza en una rama `feature/*` desde `develop`. Tras pasar las
pruebas se integra en `develop` e incrementa el parche, sin publicar.

Solo una petición de publicación autoriza el paso de `develop` a `main`.
La publicación incrementa el número menor y reinicia el parche. GitHub Actions
crea el tag y la Release del commit publicado y despliega su artefacto en Pages.
Después se sincroniza `develop` con `main`.

[Flujo completo](docs/FLUJO_GITHUB.md) · [Reglas del proyecto](AGENTS.md).

## Datos y copias de seguridad

Los discos y composiciones se guardan en el navegador. GitHub conserva el código,
no los datos personales. Localhost y GitHub Pages tienen almacenes separados.

Usa **Guardar todo** para descargar una copia JSON y **Importar y exportar**
para cargarla. Deshacer conserva los cambios de la sesión; no sustituye una copia
descargada. Borrar los datos del navegador elimina su contenido local.

[Copias de seguridad](docs/COPIAS_DE_SEGURIDAD.md) ·
[Modelo de datos](docs/MODELO_DE_DATOS.md) · [Cambios](CHANGELOG.md).

## Estructura

- `src/`: aplicación Vue 3, componentes, estilos y generación de PDF.
- `scripts/`: desarrollo local, build y publicación.
- `tests/`: comportamiento, distribución y numeración de Releases.
- `docs/`: funcionamiento, desarrollo y copias de datos.
- `.github/workflows/`: CI y publicación de `main`.

## Plantillas propias

La cabecera de **Diseños y plantillas** permite abrir el editor visual. Incluye
capas con campos del disco, texto libre, formas y recursos SVG/PNG/JPG/WebP,
arrastre, alineación, tipografía y colores. Los diseños se guardan con las copias
JSON y se pueden aplicar a las composiciones sin alterar los discos originales.
Consulta [el editor de plantillas](docs/EDITOR_DE_PLANTILLAS.md).

La CI comprueba el editor real en Chromium a 360, 720 y 1280 px. Para repetirlo:

```sh
npx playwright install --with-deps chromium
npm run build
npm run test:browser
```

## Fuentes de máquina de escribir

Courier Prime, Cutive Mono, Special Elite e IBM Plex Mono están disponibles en
los selectores de canciones, artista y capas de plantillas propias, con muestra
de cada tipografía. Se distribuyen localmente y se incrustan en los SVG utilizados
por impresión y PDF. Las licencias se incluyen en la distribución.
