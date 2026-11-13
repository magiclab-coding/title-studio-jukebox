// --- Identidad verificable del artefacto publicado ---
import { writeFileSync } from 'node:fs';
writeFileSync(
  'dist/version.json',
  JSON.stringify(
    {
      version: process.env.RELEASE_VERSION,
      commit: process.env.GITHUB_SHA,
      builtAt: new Date().toISOString(),
    },
    null,
    2,
  ) + '\n',
);
// Pages recibe el sitio estático terminado; no necesita una transformación de Jekyll.
writeFileSync('dist/.nojekyll', '');
