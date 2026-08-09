const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/gemini-3\.1-pro-preview/g, 'gemini-3.5-flash');
fs.writeFileSync('server.ts', code);
console.log('Patched models in server.ts to gemini-3.5-flash');
