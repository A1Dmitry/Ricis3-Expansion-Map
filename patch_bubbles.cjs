const fs = require('fs');
let code = fs.readFileSync('src/ui/Bubbles.tsx', 'utf-8');

// 1. Add value parameter to NodeLabel
const oldNodeLabelSig = `export function NodeLabel({
  position,
  text,
  subtitle,
  offsetY = 0.55,
}: {
  position: [number, number, number];
  text: string;
  subtitle?: string;
  offsetY?: number;
}) {`;

const newNodeLabelSig = `export function NodeLabel({
  position,
  text,
  subtitle,
  valueText,
  offsetY = 0.55,
}: {
  position: [number, number, number];
  text: string;
  subtitle?: string;
  valueText?: string;
  offsetY?: number;
}) {`;
code = code.replace(oldNodeLabelSig, newNodeLabelSig);

// 2. Change canvas logic in NodeLabel
const oldCanvasLogic = `  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const w = 1024;
    const h = subtitle ? 256 : 192;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);
    ctx.clearRect(0, 0, w, h);
    
    ctx.font = 'bold 52px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const label = text.length > 42 ? text.slice(0, 40) + '…' : text;
    const sub = subtitle ? (subtitle.length > 50 ? subtitle.slice(0, 48) + '…' : subtitle) : '';
    
    const metrics1 = ctx.measureText(label);
    
    ctx.font = 'normal 36px Inter, system-ui, sans-serif';
    const metrics2 = sub ? ctx.measureText(sub) : { width: 0 };
    
    const padX = 48;
    const boxW = Math.min(w - 8, Math.max(metrics1.width, metrics2.width) + padX * 2);
    const boxH = subtitle ? 144 : 88;
    const bx = (w - boxW) / 2;
    const by = (h - boxH) / 2;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
    ctx.lineWidth = 4;
    const r = 16;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.arcTo(bx + boxW, by, bx + boxW, by + boxH, r);
    ctx.arcTo(bx + boxW, by + boxH, bx, by + boxH, r);
    ctx.arcTo(bx, by + boxH, bx, by, r);
    ctx.arcTo(bx, by, bx + boxW, by, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    if (subtitle) {
      ctx.font = 'bold 48px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#e0f2fe';
      ctx.fillText(label, w / 2, by + boxH / 2 - 24);
      ctx.font = 'normal 36px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8'; // text-slate-400
      ctx.fillText(sub, w / 2, by + boxH / 2 + 28);
    } else {
      ctx.font = 'bold 48px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#e0f2fe';
      ctx.fillText(label, w / 2, h / 2 + 2);
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [text, subtitle]);`;

const newCanvasLogic = `  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    // Increase canvas size to accommodate 3x larger text
    const w = 2048;
    const h = subtitle || valueText ? 512 : 384;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);
    ctx.clearRect(0, 0, w, h);
    
    // 3x larger text (from 52px to 156px)
    ctx.font = 'bold 156px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const label = text.length > 42 ? text.slice(0, 40) + '…' : text;
    const sub = subtitle ? (subtitle.length > 50 ? subtitle.slice(0, 48) + '…' : subtitle) : '';
    const val = valueText ? valueText : '';
    
    const metrics1 = ctx.measureText(label);
    
    ctx.font = 'normal 72px Inter, system-ui, sans-serif';
    const metrics2 = sub ? ctx.measureText(sub) : { width: 0 };
    
    ctx.font = 'bold 84px Inter, system-ui, sans-serif';
    const metrics3 = val ? ctx.measureText(val) : { width: 0 };
    
    const padX = 96;
    const boxW = Math.min(w - 16, Math.max(metrics1.width, metrics2.width, metrics3.width) + padX * 2);
    let boxH = 200;
    if (sub) boxH += 80;
    if (val) boxH += 100;
    
    const bx = (w - boxW) / 2;
    const by = (h - boxH) / 2;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
    ctx.lineWidth = 8;
    const r = 32;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.arcTo(bx + boxW, by, bx + boxW, by + boxH, r);
    ctx.arcTo(bx + boxW, by + boxH, bx, by + boxH, r);
    ctx.arcTo(bx, by + boxH, bx, by, r);
    ctx.arcTo(bx, by, bx + boxW, by, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    let currentY = by + 100;
    
    ctx.font = 'bold 144px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#e0f2fe';
    ctx.fillText(label, w / 2, currentY);
    
    if (sub) {
      currentY += 100;
      ctx.font = 'normal 72px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8'; // text-slate-400
      ctx.fillText(sub, w / 2, currentY);
    }
    
    if (val) {
      currentY += 100;
      ctx.font = 'bold 84px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#4ade80'; // green-400 for value
      ctx.fillText(val, w / 2, currentY);
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [text, subtitle, valueText]);`;

code = code.replace(oldCanvasLogic, newCanvasLogic);

// Scale sprite down maybe or keep same scale since canvas is bigger, we should probably increase sprite scale or it will look higher res.
// Sprite scale was [5.2, subtitle ? 1.3 : 0.975, 1] for 1024x256
// For 2048x512, it's twice as big in pixels, if we want it to be 3x bigger in the 3D world we scale it up.
// I will just scale up the sprite by 3.
const oldSpriteRet = `<sprite position={[position[0], position[1] + offsetY, position[2]]} scale={[5.2, subtitle ? 1.3 : 0.975, 1]}>`;
const newSpriteRet = `<sprite position={[position[0], position[1] + offsetY, position[2]]} scale={[15.6, (subtitle || valueText) ? 3.9 : 2.925, 1]}>`;
code = code.replace(oldSpriteRet, newSpriteRet);

fs.writeFileSync('src/ui/Bubbles.tsx', code);
console.log('Bubbles patched');
