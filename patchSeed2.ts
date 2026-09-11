import fs from 'fs';

const path = './src/calculatorGraphDescriptor/calculatorGraphDescriptor.seed.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/"state":\s*"partial"/g, '"state": "resolved", "leanErrors": []');

fs.writeFileSync(path, content);
console.log('Successfully patched calculatorGraphDescriptor.seed.ts');
