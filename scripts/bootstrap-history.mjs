import {readFileSync} from 'node:fs';
import {gh,repo} from './github.mjs';
if(!repo)throw Error('GITHUB_REPOSITORY is required');
for(const item of JSON.parse(readFileSync('docs/versiones.json','utf8'))){
 if(!item.github_commit||!/^v\d+\.\d+\.\d+$/.test(item.tag))throw Error('Invalid historical manifest');
 const ref=gh(['api',`repos/${repo}/git/ref/tags/${item.tag}`],{allow404:true});
 if(ref&&JSON.parse(ref).object.sha!==item.github_commit)throw Error(`Refusing to move existing tag ${item.tag}`);
 const release=gh(['api',`repos/${repo}/releases/tags/${item.tag}`],{allow404:true});
 if(!release)gh(['release','create',item.tag,'--repo',repo,'--target',item.github_commit,'--title',`Title Studio ${item.tag} · historical`,'--notes',`Historical source imported from Sites commit ${item.source_commit}. Original revision date: ${item.source_date}. The GitHub import date is later. See docs/VERSIONES.md.`,'--latest=false']);
 console.log(`${item.tag}: archived`);
}
