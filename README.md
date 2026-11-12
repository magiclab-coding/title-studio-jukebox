# Title Studio · Jukebox

Editor de tarjetas para jukebox. Archivo del código y la evolución documental del proyecto, desde la versión 1 hasta la 7.

Aplicación: https://jukebox-title-studio-ruben.martint-rubens.chatgpt.site

## Organización

- El código de la raíz corresponde a la versión 7.
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

Este repositorio conserva el programa y su documentación. No incluye las colecciones personales guardadas en los navegadores, contraseñas, credenciales de despliegue ni configuración interna de Sites. Crear este archivo no activa una sincronización automática con Sites ni despliega la aplicación desde GitHub.

La documentación de versiones se reconstruye a partir del historial Git y los registros del proyecto. Los cambios se describen según la revisión en la que fueron introducidos; las notas antiguas no representan necesariamente el comportamiento actual.
