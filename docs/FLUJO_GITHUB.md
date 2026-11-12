# Ramas, versiones y publicación

Cada interacción empieza en una rama nueva desde develop:

`feature/* → Pull Request → develop → Pull Request de publicación → main`

- **feature/**: trabajo de una interacción.
- **develop**: integración y base de la siguiente interacción.
- **main**: código publicado.
- **archive/legacy-versions**: cadena de commits históricos de v1 a v7, importados para crear tags y Releases reales. No es base de trabajo.

## Integración continua y publicación

`ci.yml` verifica las ramas de los PR, instala dependencias con npm ci, ejecuta pruebas y compila. Los PR hacia main deben proceder de develop. Esta comprobación es parte de CI; no sustituye reglas de protección de ramas en GitHub.

`release-pages.yml` se ejecuta después de cada push/merge a main y también se puede repetir manualmente desde Actions. Primero valida, recupera las versiones históricas como tags/Releases, calcula la nueva versión, compila y adjunta el sitio a la Release. Después publica el mismo artefacto en GitHub Pages cuando Pages está habilitado. Si no está disponible, la Release se conserva y el flujo informa de que el despliegue se ha omitido.

Las versiones históricas son v1.0.0 a v7.0.0. La primera revisión de este flujo es v7.0.1. En cada nuevo commit de main se incrementa el parche si la versión de package.json ya existe como tag; se respetan incrementos mayores explícitos. Repetir el flujo del mismo commit no crea otra versión ni mueve su tag.

El artefacto publicado incluye version.json con la versión y el SHA exactos. Los recursos de la aplicación utilizan rutas relativas, compatibles con la subruta del proyecto en github.io.

## Configurar Pages una sola vez

En Settings → Pages, elegir GitHub Actions como origen. La dirección de proyecto prevista es https://magiclab-coding.github.io/title-studio-jukebox/. No es un despliegue en la raíz del dominio personal ni reemplaza otro sitio del usuario.

La cuenta actual muestra «Upgrade or make this repository public to enable Pages». El repositorio seguirá privado hasta que el usuario decida si hacerlo público o cambiar de plan. Tras habilitar Pages, repetir Release and GitHub Pages desde main: se desplegará sin crear una Release duplicada.

## Empezar una interacción desde terminal

```sh
bash scripts/new-interaction.sh descripcion-corta
```

El script exige un árbol limpio, descarga origin/develop y crea una rama nueva con fecha y hora UTC. El mismo flujo puede realizarse con las herramientas de GitHub. Las reglas persistentes están en AGENTS.md.

## Ver los comandos y resultados

Los ficheros de .github/workflows y scripts son el registro ejecutable. Cada ejecución real y su salida están en la pestaña Actions del repositorio. Cada cambio se revisa en su Pull Request, y cada versión está en Releases.
