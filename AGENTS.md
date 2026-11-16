# Mandatory repository workflow

These rules apply to every future interaction that changes this project.

1. Treat this GitHub repository as the source of truth. Read its current develop branch and this file before editing.
2. Start a unique `feature/YYYYMMDD-HHMMSS-description` branch from the latest `origin/develop`. Use `bash scripts/new-interaction.sh description` in a clean checkout, or the equivalent GitHub connector operations.
3. Never reuse the previous interaction branch or commit work directly to develop/main.
4. Update documentation and tests appropriate to the change. Run `npm ci`, `npm test`, `node --test tests/release-version.mjs`, and `npm run build`.
5. Open and merge a feature -> develop pull request after checks pass. Stop after integrating into develop. Do not merge to main or publish unless the user explicitly requests publication.
6. Each main commit runs Release and GitHub Pages. Wait for the run and report the actual release and deployment result. Never claim deployment when Pages was skipped or failed.
7. After a release merge, fast-forward develop to main if possible, otherwise merge main back through a PR. The next interaction starts from this updated develop.
8. Keep historical release tags immutable. The `archive/legacy-versions` branch exists only to migrate the original v1-v7 revisions into real tags/Releases; it is not a development base.
9. Do not change repository visibility or purchase a plan without the user's decision. GitHub Pages has a plan restriction for private repositories.

The old Sites source repository is a separate deployment. Do not silently switch back to Sites as the primary code source or create folder snapshots as substitutes for future GitHub Releases.

## Human-readable source

All authored code committed to GitHub must be readable: use indentation, line breaks and descriptive structure. Never minify authored JavaScript, HTML, CSS or workflow files before committing. Keep generated builds in ignored dist/ and dependencies in ignored node_modules/.

Run `npm run format` before committing and `npm run format:check` during validation. Prettier is pinned in package-lock.json. Preserve historical snapshots in versions/ and immutable release tags exactly as imported; do not reformat them retrospectively. Add useful comments for complex behavior, without narrating obvious statements.

## Short comments and section headings

Use short section comments to organize significant areas of authored code. Add concise comments where intent, data ownership, units, compatibility, resource cleanup or publication guarantees are not obvious. Avoid narrating simple statements. Apply this to application code, styles, templates, scripts and workflows when useful; preserve historical snapshots unchanged.

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
