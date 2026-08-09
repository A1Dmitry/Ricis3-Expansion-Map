const fs = require('fs');
let code = fs.readFileSync('src/model/logic.ts', 'utf-8');

code = code.replace(
  `/** Catalog of real problems for fractal expansion (no fake names). */\nconst KNOWN_SINGULARITY_PROBLEMS: ProblemNode[] = [];`,
  `import { KNOWN_SINGULARITY_PROBLEMS } from './catalog';`
);

fs.writeFileSync('src/model/logic.ts', code);
console.log('Patched logic.ts');
