import {gh,repo} from './github.mjs';
const tag=process.env.RELEASE_VERSION,sha=process.env.GITHUB_SHA;
if(!repo||!sha||!/^v\d+\.\d+\.\d+$/.test(tag))throw Error('Missing release metadata');
const ref=gh(['api',`repos/${repo}/git/ref/tags/${tag}`],{allow404:true});
if(ref&&JSON.parse(ref).object.sha!==sha)throw Error(`Refusing to change existing tag ${tag}`);
const release=gh(['api',`repos/${repo}/releases/tags/${tag}`],{allow404:true});
if(!release)gh(['release','create',tag,'--repo',repo,'--target',sha,'--title',`Title Studio ${tag}`,'--generate-notes','--latest','title-studio-site.tar.gz']);
else gh(['release','upload',tag,'title-studio-site.tar.gz','--repo',repo,'--clobber']);
console.log(`${tag}: ${sha}`);
