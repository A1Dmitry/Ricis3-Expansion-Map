const fs = require('fs');
const path = 'src/ui/Bubbles.tsx';
let code = fs.readFileSync(path, 'utf8');

const helper = `
function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
}
`;

const insertPoint = `export function BubblesCanvas({`;
if (!code.includes('drawRoundedRect')) {
  code = code.replace(insertPoint, helper + '\n' + insertPoint);
}

const target1 = `    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.arcTo(bx + boxW, by, bx + boxW, by + boxH, r);
    ctx.arcTo(bx + boxW, by + boxH, bx, by + boxH, r);
    ctx.arcTo(bx, by + boxH, bx, by, r);
    ctx.arcTo(bx, by, bx + boxW, by, r);`;
const replacement1 = `    drawRoundedRect(ctx, bx, by, boxW, boxH, r);`;

code = code.replace(target1, replacement1);
code = code.replace(target1, replacement1);

fs.writeFileSync(path, code);
console.log("Bubbles patched");
