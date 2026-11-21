# Mandatory repository workflow

These rules apply to every future interaction that changes this project.

1. Treat this GitHub repository as the source of truth. Read its current develop branch and this file before editing.
2. Start a unique `feature/YYYYMMDD-HHMMSS-description` branch from the latest `origin/develop`. Use `bash scripts/new-interaction.sh description` in a clean checkout, or the equivalent GitHub connector operations.
3. Never reuse the previous interaction branch or commit work directly to develop/main.
4. Update documentation and tests appropriate to the change. Run `npm ci`, `npm test`, `node --test tests/release-version.mjs`, and `npm run build`.
5. Open and merge a feature -> develop pull request after checks pass. Stop after integrating into develop. Do not merge to main or publish unless the user explicitly requests publication.
6. Each main commit runs Release and GitHub Pages. Wait for the run and report the actual release and deployment result. Never claim deployment when Pages was skipped or failed.
7. After a release merge, fast-forward develop to main if possible, otherwise merge main back through a PR. The next interaction starts from this updated develop.
8. Keep tags created by the normal publication workflow immutable. Do not store program snapshots or import external revisions as Releases.
9. Do not change repository visibility or purchase a plan without the user's decision. GitHub Pages has a plan restriction for private repositories.

This GitHub repository is the source of truth. Publish only through the agreed branch workflow.

## Plan and confirmation

Before changing this project, analyze the request, summarize a concrete plan and ask the user to confirm it. Wait for explicit confirmation before making changes. Read-only investigation may be used to prepare the plan. Once confirmed, carry out the agreed plan without asking again unless its scope changes materially. Publish only when explicitly requested.

## Human-readable source

All authored code committed to GitHub must be readable: use indentation, line breaks and descriptive structure. Never minify authored JavaScript, HTML, CSS or workflow files before committing. Keep generated builds in ignored dist/ and dependencies in ignored node_modules/.

Run `npm run format` before committing and `npm run format:check` during validation. Prettier is pinned in package-lock.json. Add useful comments for complex behavior, without narrating obvious statements.

## Short comments and section headings

Use short section comments to organize significant areas of authored code. Add concise comments where intent, data ownership, units, compatibility, resource cleanup or publication guarantees are not obvious. Avoid narrating simple statements. Apply this to application code, styles, templates, scripts and workflows when useful.

## Producción minificada

- Mantener src legible y comentado. Minificar únicamente dist durante npm run build.
- Ejecutar npm run test:build después de compilar: valida las plantillas Vue y los archivos publicados.
- No dividir cadenas dentro de interpolaciones Vue; usar el parser Vue del formateador para src/index.html.

## Plantillas HTML y controles compartidos

- En src/index.html y las plantillas minificadas, cerrar explícitamente los componentes propios (genre-select, record-fields, font-picker). HTML no reconoce el cierre abreviado de elementos personalizados.
- Mantener el formulario de datos en src/components.js para que Artista A/B y Canción A/B sean iguales en todos los contextos.
- Conservar las claves JSON históricas collections/collection para compatibilidad; la interfaz usa Discos.
- Centrar las etiquetas solo en horizontal. La posición vertical y las medidas físicas no cambian.

## Local development and release policy

- Each feature starts from latest develop, increments the patch number and merges only into develop.
- develop runs validation only; it must never publish Pages.
- Start the user-local server with npm run dev when the user computer terminal is available. A remote preview is not the user computer.
- Only an explicit publication request authorizes develop -> main. Prepare the version as major.(minor+1).0 before merging; then synchronize develop with main.
- See docs/DESARROLLO_LOCAL.md for installation and testing. Never claim a server runs on the user computer without observing it there.

## Consistencia visual permanente

Los elementos adyacentes deben compartir altura, eje central, márgenes, bordes,
tipografía y respuesta de foco/hover. Los iconos de una sección usan el mismo
componente visual; los contenedores details no pueden desalinearlos.
Verificar las medidas reales y la alineación en pantalla antes de entregar.

## Recorte tipográfico y edición

Usar el mismo cálculo de ancho para recortar etiquetas y señalar campos.
Tener en cuenta glifos, fuente, tamaño y espacio interior del diseño, nunca
un límite fijo de caracteres. Recalcular al cargar las fuentes.
La edición de Composición personaliza los textos de la posición; la de Discos
modifica los originales. No añadir campos duplicados ni un editor de textos separado.

## Preparación y CI sin ejecuciones prematuras

- Preparar formato y lockfile antes de abrir una PR lista para revisión.
- CI valida PR listas y pushes a develop; no valida pushes de preparación a feature/*.
- No ejecutar formateadores temporales en paralelo con CI sobre revisiones sin preparar.
- Si hace falta preparación remota, completarla y retirar su workflow antes de abrir la PR.
- Conservar format:check, pruebas, compilación y pruebas de navegador como controles obligatorios.
- Mantener Ubuntu 24.04 para la versión fijada de Playwright; no usar ubuntu-latest sin comprobar compatibilidad.
- No ocultar fallos reales ni cambiar las notificaciones de la cuenta para simular una corrección.

Cuando una interacción cambie el diseño visual, ejecuta la aplicación con los
cambios y captura la interfaz real en el tamaño de pantalla relevante. Presenta
la captura al usuario y espera su aprobación estética antes de abrir cualquier PR.

## Anotaciones, issues y mensajes de commit

- Registra cada anotación o propuesta del usuario como una issue de GitHub antes
  de implementarla. Incluye el texto disponible, la fecha original y las
  capturas autorizadas. Añade las aclaraciones de la misma anotación como
  seguimiento fechado en su issue.
- Etiqueta cada issue con un tipo como `bug`, `feat`, `docs`, `test`, `ci` o
  `release`, y con el área correspondiente, por ejemplo `discos`,
  `composición`, `editor`, `modales`, `móvil` o `impresión`.
- Escribe la primera línea de todos los commits como
  `[tipo][contexto] Descripción`. Coloca primero el tipo y después uno o más
  contextos, cada uno en sus propios corchetes. Aplica el formato a los commits
  de integración y publicación.
- Incluye en el cuerpo `Refs #N` para cada issue tratada por el commit. Usa
  `Closes #N` en la integración final cuando corresponda cerrarla.
