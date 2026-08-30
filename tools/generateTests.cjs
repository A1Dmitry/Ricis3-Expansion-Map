const fs = require('fs');
const content = fs.readFileSync('/app/applet/temp-ricis-core-2/Ricis.Console/ExampleCatalog.cs', 'utf8');
const regex = /new\("([^"]+)",[^,]+,\s*"([^"]+)"\)/g;

let testCases = [];
let match;
while ((match = regex.exec(content)) !== null) {
  testCases.push({ id: match[1], input: match[2] });
}

const existingStr = fs.readFileSync('/app/applet/packages/ricis-core-ts/test/ConsoleRegression.test.ts', 'utf8');

const oldArrayMatch = existingStr.match(/const examples = \[([\s\S]*?)\];/);
let oldExamples = [];
if (oldArrayMatch) {
   // hacky eval
   eval(`oldExamples = [${oldArrayMatch[1]}]`);
}

// merge
for (let i = 0; i < testCases.length; i++) {
   let existing = oldExamples.find(e => e.id === testCases[i].id);
   if (existing) {
       testCases[i] = existing;
   }
}

let newArrStr = 'const examples = [\n' + testCases.map(t => '  ' + JSON.stringify(t)).join(',\n') + '\n];';
let newStr = existingStr.replace(/const examples = \[([\s\S]*?)\];/, newArrStr);

fs.writeFileSync('/app/applet/packages/ricis-core-ts/test/ConsoleRegression.test.ts', newStr);
