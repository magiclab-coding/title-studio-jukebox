# Title Studio · Jukebox

Editor de tarjetas para jukebox. Repositorio principal de desarrollo con ramas feature, develop y main, Releases y publicación automática en GitHub Pages.

Aplicación: https://jukebox-title-studio-ruben.martint-rubens.chatgpt.site

## Organización

- El código de la raíz corresponde a la revisión 7.0.1.
- [Flujo de GitHub](docs/FLUJO_GITHUB.md): ramas, CI, Releases y publicación.
- Las reglas para cada interacción están en AGENTS.md.
- Las versiones reales se conservan como tags y Releases; las carpetas históricas se mantienen como material de procedencia.
- `versions/v1` a `versions/v7` conservan instantáneas del código original.
- [Historial de versiones](docs/VERSIONES.md): fechas, cambios y commits de origen.
- [Modelo de datos](docs/MODELO_DE_DATOS.md): colecciones, discos y composiciones.
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

## Colecciones y composiciones

Una colección agrupa vinilos según preferencias del usuario. Una composición selecciona discos de cualquier colección y conserva sus posiciones, huecos y estilos propios. Duplicar una tarjeta en la composición no duplica el vinilo en la colección.

## Alcance del archivo

Este repositorio conserva el programa y su documentación. No incluye las colecciones personales guardadas en los navegadores, contraseñas, credenciales de despliegue ni configuración interna de Sites. GitHub Actions crea una Release por integración en main y publica en Pages cuando está habilitado. No hay sincronización automática con Sites. Este GitHub es la fuente principal para el trabajo futuro.

La documentación de versiones se reconstruye a partir del historial Git y los registros del proyecto. Los cambios se describen según la revisión en la que fueron introducidos; las notas antiguas no representan necesariamente el comportamiento actual.
