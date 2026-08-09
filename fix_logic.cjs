const fs = require('fs');

let logic = fs.readFileSync('src/model/logic.ts', 'utf-8');
const lines = logic.split('\n');
lines[19] = "  latexSteps.push('\\\\textbf{Target Function:} $' + node.targetFunction + '$');";
fs.writeFileSync('src/model/logic.ts', lines.join('\n'));
