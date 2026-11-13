// --- Disponibilidad del alojamiento ---
// La Release se conserva aunque Pages todavía no esté configurado.
import { appendFileSync } from 'node:fs';
import { gh, repo } from './github.mjs';
const pages = gh(['api', `repos/${repo}/pages`], { allow404: true });
const enabled = pages !== null;
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `enabled=${enabled}\n`);
if (!enabled)
  console.log(
    '::warning::Release created. Pages is not enabled: configure GitHub Actions in Settings > Pages. A private repository requires a compatible GitHub plan.',
  );
else console.log('Pages is enabled. Deployment will follow.');
