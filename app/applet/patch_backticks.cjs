const fs = require('fs');
let code = fs.readFileSync('src/model/ricisCoreRules.ts', 'utf8');

// Replace markdown triple backticks with escaped backticks inside the template strings
code = code.replace(/\n```lean4/g, '\n\\`\\`\\`lean4');
code = code.replace(/\n```/g, '\n\\`\\`\\`');

fs.writeFileSync('src/model/ricisCoreRules.ts', code, 'utf8');
console.log('Successfully escaped backticks in ricisCoreRules.ts');
