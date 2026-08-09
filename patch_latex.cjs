const fs = require('fs');
let code = fs.readFileSync('src/model/latexGuard.ts', 'utf-8');

// Replace the stripping with replacing opening tag with \textbf{
code = code.replace(/t = t\.replace\(\/\\\\section\\\*\?\\\{\[\^\\\}\]\*\\\}\\/g, "''\)/g", "// removed");
code = code.replace(/t = t\.replace\(\/\\\\subsection\\\*\?\\\{\[\^\\\}\]\*\\\}\\/g, "''\)/g", "// removed");

const replaceStr = `  t = t.replace(/\\\\section\\*?(?:\\[[^\\]]*\\])?\\s*\\{/g, '\\\\textbf{');
  t = t.replace(/\\\\subsection\\*?(?:\\[[^\\]]*\\])?\\s*\\{/g, '\\\\textbf{');
  t = t.replace(/\\\\subsubsection\\*?(?:\\[[^\\]]*\\])?\\s*\\{/g, '\\\\textbf{');
  t = t.replace(/\\\\chapter\\*?(?:\\[[^\\]]*\\])?\\s*\\{/g, '\\\\textbf{');`;

code = code.replace("let out = '';", replaceStr + "\n  let out = '';");

fs.writeFileSync('src/model/latexGuard.ts', code);
console.log('Patched latexGuard.ts');
