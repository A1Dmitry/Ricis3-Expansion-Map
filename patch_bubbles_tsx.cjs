const fs = require('fs');
let code = fs.readFileSync('src/ui/Bubbles.tsx', 'utf8');

const t = `export function NodeBubble({`;
const rep = `
export function NodeBubble({`;

code = code.replace(t, rep);

fs.writeFileSync('src/ui/Bubbles.tsx', code);
console.log("bubbles tsx patched");
