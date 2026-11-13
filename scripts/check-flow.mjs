const { PR_BASE: base, PR_HEAD: head } = process.env;
if (base === 'main' && head !== 'develop') throw Error('Only develop may be merged into main.');
if (base === 'develop' && !(head?.startsWith('feature/') || head === 'main'))
  throw Error('Start each interaction in a new feature/* branch from develop.');
console.log(base ? `${head} -> ${base}: valid` : 'Push validation');
