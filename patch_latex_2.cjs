const fs = require('fs');
let code = fs.readFileSync('src/model/latexGuard.ts', 'utf-8');

code = code.replace(/t = t\.replace\(\/\\\\section\\\*\?\\\{\[\^}\]\*\\\}\/g, ''\);\n/g, "");
code = code.replace(/t = t\.replace\(\/\\\\subsection\\\*\?\\\{\[\^}\]\*\\\}\/g, ''\);\n/g, "");

fs.writeFileSync('src/model/latexGuard.ts', code);
console.log('Patched latexGuard.ts');
