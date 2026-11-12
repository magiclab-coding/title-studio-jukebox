import {writeFileSync} from 'node:fs';
writeFileSync('dist/version.json',JSON.stringify({version:process.env.RELEASE_VERSION,commit:process.env.GITHUB_SHA,builtAt:new Date().toISOString()},null,2)+'\n');
writeFileSync('dist/.nojekyll','');
