const fs = require('fs');
let code = fs.readFileSync('src/ui/Bubbles.tsx', 'utf8');

const t = `    drawRoundedRect(ctx, bx, by, boxW, boxH, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();`;
    
const rep = `    drawRoundedRect(ctx, bx, by, boxW, boxH, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // shape rendered`;

code = code.replace(t, rep);

fs.writeFileSync('src/ui/Bubbles.tsx', code);
console.log("bubbles 2 patched");
