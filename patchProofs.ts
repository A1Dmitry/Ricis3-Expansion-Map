import fs from 'fs';
import { floodFillProofs } from './src/model/floodFillProofs';

let content = fs.readFileSync('./src/model/initialMap.ts', 'utf8');
let lines = content.split('\n');

let insertIdx = -1;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('export function deepCopyInitialMap')) {
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j].trim() === '};') {
        for (let k = j - 1; k >= 0; k--) {
          if (lines[k].trim() === '}') {
            insertIdx = k;
            break;
          }
        }
        break;
      }
    }
    break;
  }
}

if (insertIdx !== -1) {
  let newProofsStr = JSON.stringify(floodFillProofs, null, 4);
  newProofsStr = newProofsStr.substring(2, newProofsStr.length - 2); 
  
  if (!lines[insertIdx - 1].trim().endsWith(',')) {
    lines[insertIdx - 1] += ',';
  }
  lines.splice(insertIdx, 0, newProofsStr + ',');
  fs.writeFileSync('./src/model/initialMap.ts', lines.join('\n'));
  console.log('Successfully patched initialMap.ts proofs');
} else {
  console.error('Could not find insert index');
}
