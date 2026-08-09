const fs = require('fs');
let code = fs.readFileSync('src/ui/Bubbles.tsx', 'utf-8');

const zoneLabelStr = `
export function ZoneLabel({
  position,
  text,
  radius,
  color,
}: {
  position: [number, number, number];
  text: string;
  radius: number;
  color: string;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const w = 2048;
    const h = 512;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);
    ctx.clearRect(0, 0, w, h);
    
    ctx.font = 'bold 160px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const metrics = ctx.measureText(text);
    const boxW = Math.min(w - 32, metrics.width + 160);
    const boxH = 260;
    
    const bx = (w - boxW) / 2;
    const by = (h - boxH) / 2;
    
    // Convert hex color to rgba for stroke
    let strokeRgba = 'rgba(255, 255, 255, 0.4)';
    if (color.startsWith('#')) {
       const r = parseInt(color.slice(1, 3), 16);
       const g = parseInt(color.slice(3, 5), 16);
       const b = parseInt(color.slice(5, 7), 16);
       strokeRgba = \`rgba(\${r}, \${g}, \${b}, 0.8)\`;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.strokeStyle = strokeRgba;
    ctx.lineWidth = 12;
    const r = 40;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.arcTo(bx + boxW, by, bx + boxW, by + boxH, r);
    ctx.arcTo(bx + boxW, by + boxH, bx, by + boxH, r);
    ctx.arcTo(bx, by + boxH, bx, by, r);
    ctx.arcTo(bx, by, bx + boxW, by, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, h / 2 + 10);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [text, color]);

  // Place it near the top boundary of the zone bubble
  return (
    <sprite position={[position[0], position[1] + radius + 15, position[2]]} scale={[40, 10, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} />
    </sprite>
  );
}
`;

// Insert the component before NodeLabel
code = code.replace("export function NodeLabel", zoneLabelStr + "\nexport function NodeLabel");

fs.writeFileSync('src/ui/Bubbles.tsx', code);
console.log('Added ZoneLabel to Bubbles.tsx');
