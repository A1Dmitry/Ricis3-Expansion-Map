import fs from 'fs';

let content = fs.readFileSync('./src/model/initialMap.ts', 'utf8');

const str = '"med-diagnostics": {';
let first = content.indexOf(str);
let second = content.indexOf(str, first + 1);

if (second !== -1) {
  // It appears the proofs are duplicated at the end? Let's check where the second occurrence is.
  // Actually, I inserted them at `insertIdx` which was the end of `initialMap`, and they have no wrapper.
  // Let's just find the `export function deepCopyInitialMap()`
  let deepCopyIdx = content.indexOf('export function deepCopyInitialMap()');
  
  // Before deepCopyIdx, there are some `}` and `};`.
  // Let me just split by line and see.
  let lines = content.split('\n');
  let duplicateStart = -1;
  let matches = 0;
  for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('"med-diagnostics": {')) {
      matches++;
      if (matches === 2) { // Or maybe even the first match is wrong if it's not inside `proofs: {`?
        duplicateStart = i;
        break;
      }
    }
  }
  console.log('Matches found:', matches);
  if (duplicateStart !== -1) {
     // I need to carefully remove the bad block.
  }
} else {
  console.log('Only 1 occurrence found!');
}
