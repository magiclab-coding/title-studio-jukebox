// --- Acceso compartido a GitHub CLI ---
// Los argumentos se pasan sin shell y el token permanece en el entorno del runner.
import { spawnSync } from 'node:child_process';
export const repo = process.env.GITHUB_REPOSITORY;
export function gh(args, { allow404 = false } = {}) {
  const result = spawnSync('gh', args, { encoding: 'utf8' });
  if (result.status === 0) return result.stdout.trim();
  // Solo un 404 esperado representa ausencia; otros errores deben propagarse.
  if (allow404 && /HTTP 404/.test(result.stderr)) return null;
  throw Error(result.stderr || 'GitHub CLI failed');
}
