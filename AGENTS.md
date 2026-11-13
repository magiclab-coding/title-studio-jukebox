# Mandatory repository workflow

These rules apply to every future interaction that changes this project.

1. Treat this GitHub repository as the source of truth. Read its current develop branch and this file before editing.
2. Start a unique `feature/YYYYMMDD-HHMMSS-description` branch from the latest `origin/develop`. Use `bash scripts/new-interaction.sh description` in a clean checkout, or the equivalent GitHub connector operations.
3. Never reuse the previous interaction branch or commit work directly to develop/main.
4. Update documentation and tests appropriate to the change. Run `npm ci`, `npm test`, `node --test tests/release-version.mjs`, and `npm run build`.
5. Open and merge a feature -> develop pull request after checks pass. Publish by opening and merging a develop -> main pull request. Main is the production branch.
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
