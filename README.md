# Title Studio · Jukebox

Editor de tarjetas para jukebox. Repositorio principal de desarrollo con ramas feature, develop y main, Releases y publicación automática en GitHub Pages.

Aplicación: https://jukebox-title-studio-ruben.martint-rubens.chatgpt.site

## Organización

- La raíz contiene el código activo; cada versión publicada se identifica por su tag y Release.
- [Flujo de GitHub](docs/FLUJO_GITHUB.md): ramas, CI, Releases y publicación.
- Las reglas para cada interacción están en AGENTS.md.
- Las versiones reales se conservan como tags y Releases; las carpetas históricas se mantienen como material de procedencia.
- `versions/v1` a `versions/v7` conservan instantáneas del código original.
- [Historial de versiones](docs/VERSIONES.md): fechas, cambios y commits de origen.
- [Modelo de datos](docs/MODELO_DE_DATOS.md): listas de discos, discos y composiciones.
- [Recuperación](docs/RECUPERACION.md): volver a un código anterior y recuperar los datos.
- `CHANGELOG.md`: notas históricas acumuladas del proyecto.

## Desarrollo

Se utiliza Vue 3, Vuetify y SheetJS. Requiere Node.js y npm.

```sh
npm install
npm test
npm run build
```

El resultado está en `dist/`. Se puede servir con cualquier servidor estático. Las instantáneas no incluyen node_modules ni las copias compiladas de las dependencias; se generan con la instalación y el build.

## Listas de discos y composiciones

Una lista de discos agrupa vinilos según preferencias del usuario. Una composición selecciona discos de cualquier lista de discos y conserva sus posiciones, huecos y estilos propios. Duplicar una tarjeta en la composición no duplica el vinilo en la lista de discos.

## Alcance del archivo

Este repositorio conserva el programa y su documentación. No incluye las listas de discos personales guardadas en los navegadores, contraseñas, credenciales de despliegue ni configuración interna de Sites. GitHub Actions crea una Release por integración en main y publica en Pages cuando está habilitado. No hay sincronización automática con Sites. Este GitHub es la fuente principal para el trabajo futuro.

La documentación de versiones se reconstruye a partir del historial Git y los registros del proyecto. Los cambios se describen según la revisión en la que fueron introducidos; las notas antiguas no representan necesariamente el comportamiento actual.

## Código legible

El código activo se conserva sin minificar, con sangrado de dos espacios y formato automático mediante Prettier. Los archivos compilados y dependencias no se suben como código fuente. Las instantáneas históricas conservan su formato original.

```sh
npm run format
npm run format:check
```

La CI comprueba el formato antes de ejecutar las pruebas y publicar.

## Comentarios y secciones

Las áreas importantes del código se organizan con cabeceras de sección y comentarios breves que explican la intención, las unidades y los casos menos evidentes. La versión 7.0.3 aplica esta convención al código activo; las versiones históricas conservan sus originales. La regla queda documentada en AGENTS.md para las siguientes revisiones.

La distribución de GitHub Pages se genera minificada en `dist`; el código de `src` permanece legible y comentado. `npm run build && npm run test:build` comprueba también que las plantillas Vue pueden compilarse antes de publicar.
