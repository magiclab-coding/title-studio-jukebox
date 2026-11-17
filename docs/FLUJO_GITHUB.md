# Ramas, versiones y publicación

`feature/* → Pull Request → develop → Pull Request de publicación → main`

## Desarrollo

Cada interacción crea una rama `feature/YYYYMMDD-HHMMSS-descripcion` desde la
última revisión de `develop`. Puede utilizarse:

```sh
bash scripts/new-interaction.sh descripcion-corta
```

La implementación incrementa el parche de `package.json` y su lockfile. Una vez
validados los cambios se integra mediante PR en `develop`. La CI comprueba las
ramas, instala con `npm ci`, valida el formato, ejecuta las pruebas y compila.
Los pushes a `develop` y a `feature/*` no publican el sitio.

## Publicación

La publicación requiere petición explícita del usuario. Se incrementa el número
menor de versión y se pone el parche a cero; por ejemplo, 7.4.2 → 7.5.0.
Solo `develop` puede ser origen de una PR hacia `main`.

`release-pages.yml` se ejecuta en cada push a `main`. Valida el código, resuelve
la versión, compila una distribución minificada, crea una Release del commit
exacto y publica ese mismo artefacto en GitHub Pages. Repetir el flujo sobre el
mismo commit reutiliza la versión. Los tags publicados no se desplazan.

La distribución incluye `version.json` con la versión y el SHA. Las rutas de
recursos son relativas y utilizan hashes para evitar mezclar revisiones.

Dirección: https://magiclab-coding.github.io/title-studio-jukebox/

Tras comprobar el despliegue, se sincroniza `develop` con `main`. Si Pages falla
o se omite, se informa del resultado real: crear una Release no significa que
el sitio esté desplegado.

## Trazabilidad

Cada cambio queda en su PR y commit; las salidas de las comprobaciones están en
Actions. Las Releases representan las publicaciones de este repositorio.
El historial normal de Git permite revisar y revertir cambios mediante una
nueva rama y PR, siguiendo el mismo flujo de validación.

El código publicado y los datos del navegador son independientes. Actualizar
el programa no recupera discos ni composiciones: para eso se utilizan copias JSON.
