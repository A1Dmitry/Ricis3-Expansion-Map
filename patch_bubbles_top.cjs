const fs = require('fs');
let code = fs.readFileSync('src/ui/Bubbles.tsx', 'utf8');

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

code = helper + code;

fs.writeFileSync('src/ui/Bubbles.tsx', code);
console.log("Bubbles fixed");
