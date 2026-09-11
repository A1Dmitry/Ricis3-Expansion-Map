import fs from 'fs';
import { floodFillProofs } from './src/model/floodFillProofs';

let content = fs.readFileSync('./src/model/initialMap.ts', 'utf8');

// Find 'export function deepCopyInitialMap()'
let exportIdx = content.indexOf('export function deepCopyInitialMap()');
let prefix = content.substring(0, exportIdx);
let suffix = content.substring(exportIdx);

// The problem is inside `prefix`, there are duplicated `med-diagnostics: { ... }` properties.
// Let's find the FIRST occurrence of "med-diagnostics": {
// But wait, the original `proofs: { ... }` might NOT have had `med-diagnostics` at all!
// Did it? No, in my first patch `node patch.js`, I only touched `nodes`. The proofs were NOT in the file for those nodes.
// Then I ran `patchProofs.ts` which inserted at the end of `initialMap`.
// So the original `initialMap.proofs` ended with `"ricis-chatbot-monetization": { ... }` (or similar).
// Let's find `"ricis-chatbot-monetization"` or whatever was the last real proof.

let proofsStart = prefix.indexOf('  proofs: {');
let proofsEnd = -1;
// we can find the end of `proofs: {` by matching braces.
let braces = 0;
let inProofs = false;
for(let i=proofsStart; i<prefix.length; i++) {
  if (prefix[i] === '{') {
    braces++;
    inProofs = true;
  } else if (prefix[i] === '}') {
    braces--;
    if (inProofs && braces === 0) {
      proofsEnd = i;
      break;
    }
  }
}

// So the original `proofs` block is prefix.substring(proofsStart, proofsEnd + 1).
// BUT wait, if I added the bad block AFTER `proofsEnd`, then it's outside `proofs: {`.
// Let's just find `proofsStart` and `proofsEnd` from the ORIGINAL structure.
// Actually, I can just parse the file to find where my bad insertions started.
// My bad insertion starts with `    "med-diagnostics": {` and ends with `    },` before `};`

let firstBad = prefix.indexOf('    "med-diagnostics": {');
if (firstBad !== -1 && firstBad > proofsStart) {
  // we just truncate `prefix` up to `firstBad`, and then put `};`
  // Wait, I need to make sure I am inside `initialMap`.
  // Let's just trim everything from `firstBad` up to `export function` and replace with `\n  }\n};\n\n`.
  // Wait, I want to insert the new proofs INTO `proofs: {`.
  
  // Let's look for the original end of `proofs: {` which was before `firstBad`.
  // In the original file, `proofs` was the LAST property of `initialMap`.
  // So it was:
  //   proofs: {
  //      ...
  //   }
  // };
  // I replaced the end of the file.
  // Let's reconstruct `prefix` manually by finding where the original `proofs` ended.
  let cleanPrefix = prefix.substring(0, firstBad);
  
  // The original `proofs` object needs to be closed, but we want to append to it!
  // So `cleanPrefix` currently has an open `proofs: {` or it's closed?
  // Let's find the last non-whitespace character in `cleanPrefix`.
  cleanPrefix = cleanPrefix.trimEnd();
  if (cleanPrefix.endsWith(',')) {
    cleanPrefix = cleanPrefix.slice(0, -1); // remove comma
  }
  // If it ends with `}`, that might be the end of the last valid proof (like riemann).
  // So we just add a comma, then our new proofs, then `\n  }\n};\n\n`.

  let newProofsStr = JSON.stringify(floodFillProofs, null, 4);
  newProofsStr = newProofsStr.substring(2, newProofsStr.length - 2); // remove { \n ... \n }

  let reconstructed = cleanPrefix + ',\n' + newProofsStr + '\n  }\n};\n\n' + suffix;

  fs.writeFileSync('./src/model/initialMap.ts', reconstructed);
  console.log('Successfully reconstructed initialMap.ts');
} else {
  console.log('No bad insertions found or structure is different.');
}
