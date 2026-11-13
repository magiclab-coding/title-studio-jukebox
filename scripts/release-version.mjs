// --- Numeración de versiones e idempotencia por commit ---
import { execFileSync } from 'node:child_process';
import { readFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
export function nextVersion(base, tags, atCommit = []) {
  const parse = (s) => /^v?(\d+)\.(\d+)\.(\d+)$/.exec(s)?.slice(1).map(Number);
  const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  // Reejecutar el mismo commit reutiliza su versión en lugar de crear otra.
  const existing = atCommit
    .filter((t) => parse(t))
    .sort((a, b) => compare(parse(a), parse(b)))
    .at(-1);
  if (existing) return existing.startsWith('v') ? existing : 'v' + existing;
  let candidate = parse(base);
  if (!candidate) throw Error('Invalid package version');
  // Respeta un incremento explícito; si la versión ya existe, avanza un parche.
  const latest = tags.map(parse).filter(Boolean).sort(compare).at(-1);
  if (latest && compare(latest, candidate) >= 0) candidate = [latest[0], latest[1], latest[2] + 1];
  return 'v' + candidate.join('.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const git = (...args) =>
    execFileSync('git', args, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const version = nextVersion(
    JSON.parse(readFileSync('package.json', 'utf8')).version,
    git('tag', '--list'),
    git('tag', '--points-at', process.env.GITHUB_SHA || 'HEAD'),
  );
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
  console.log(version);
}
