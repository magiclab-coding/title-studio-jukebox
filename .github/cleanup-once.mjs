// Ejecución única, limitada a las siete publicaciones importadas comprobadas.
import { execFileSync } from 'node:child_process';
const repository = process.env.GITHUB_REPOSITORY;
if (repository !== 'magiclab-coding/title-studio-jukebox') throw Error('Repositorio inesperado');
const targets = [
  {
    "tag": "v1.0.0",
    "sha": "4b95206a2b4e267531f9b9d489a9180bef882000"
  },
  {
    "tag": "v2.0.0",
    "sha": "83d30d4d9d1353a4c5c55cb7982b7b7dd80f5685"
  },
  {
    "tag": "v3.0.0",
    "sha": "c8b062f17c56d6f400e947b18d8cf42197dd3f94"
  },
  {
    "tag": "v4.0.0",
    "sha": "89961d05e31f2126a7acff47844157683b4a8b4e"
  },
  {
    "tag": "v5.0.0",
    "sha": "afb53c702f36d02547606d05e09f5e397e710fff"
  },
  {
    "tag": "v6.0.0",
    "sha": "1d7f119c8d970c036cb2dafd4a7fd7378a94761f"
  },
  {
    "tag": "v7.0.0",
    "sha": "2324f32115ec6917c78746e19ca4800f14d66991"
  }
];
function api(path, method = 'GET') {
  try {
    const result = execFileSync('gh', ['api', '--method', method, 'repos/' + repository + '/' + path], {encoding:'utf8', stdio:['ignore','pipe','pipe']});
    return result.trim() ? JSON.parse(result) : null;
  } catch (error) {
    if (String(error.stderr).includes('HTTP 404')) return null;
    throw error;
  }
}
// Comprueba todos los destinos antes de borrar ninguno.
const verified = targets.map(target => {
  const ref = api('git/ref/tags/' + target.tag);
  const release = api('releases/tags/' + target.tag);
  if (ref && ref.object.sha !== target.sha) throw Error('Tag distinto: ' + target.tag);
  if (release && (release.tag_name !== target.tag || release.target_commitish !== target.sha))
    throw Error('Release distinta: ' + target.tag);
  return {...target, ref, release};
});
const branch = api('git/ref/heads/archive/legacy-versions');
if (branch && branch.object.sha !== targets.at(-1).sha) throw Error('Archivo modificado');
// No toca otras publicaciones, ramas ni tags.
for (const target of verified) {
  if (target.release) api('releases/' + target.release.id, 'DELETE');
  if (target.ref) api('git/refs/tags/' + target.tag, 'DELETE');
  console.log(target.tag + ': retirado');
}
if (branch) api('git/refs/heads/archive/legacy-versions', 'DELETE');
console.log('Archivo retirado');
