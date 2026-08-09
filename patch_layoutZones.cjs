const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf-8');

const targetFunctionStr = `export function layoutZones(
  zones: ScienceZone[],
  nodes: ProblemNode[],
  params: Partial<PressureLayoutParams> = {}
): Record<string, [number, number, number]> {
  const p = { ...DEFAULT_ZONE, ...params };
  const S = zones.map(z => zoneShielding(z, nodes));
  const pos = relaxPressureRepulsion(zones.length, S, p);
  const out: Record<string, [number, number, number]> = {};
  zones.forEach((z, i) => {
    out[z.id] = pos[i];
  });
  return out;
}`;

const newFunctionStr = `export function layoutZones(
  zones: ScienceZone[],
  nodes: ProblemNode[],
  params: Partial<PressureLayoutParams> = {}
): Record<string, [number, number, number]> {
  const p = { ...DEFAULT_ZONE, ...params };
  const S = zones.map(z => zoneShielding(z, nodes));
  const pos = relaxPressureRepulsion(zones.length, S, p);
  
  // Calculate radii in the exact same way Map3D and layoutNodes will bound them
  const zoneR = zones.map(z => Math.max(20, zoneVisualRadius(z, nodes) * 2.0) + 15);
  
  const n = zones.length;
  // Force distance L = (D1 + D2) * 1.1
  for (let iter = 0; iter < 400; iter++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const dz = pos[i][2] - pos[j][2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-9;
        
        const D1 = 2 * zoneR[i];
        const D2 = 2 * zoneR[j];
        const requiredDist = (D1 + D2) * 1.1;
        
        if (dist < requiredDist) {
          moved = true;
          const overlap = requiredDist - dist;
          const pushFactor = 0.5; // Equal weight push
          
          const px = (dx / dist) * overlap * pushFactor;
          const py = (dy / dist) * overlap * pushFactor;
          const pz = (dz / dist) * overlap * pushFactor;
          
          pos[i][0] += px;
          pos[i][1] += py;
          pos[i][2] += pz;
          
          pos[j][0] -= px;
          pos[j][1] -= py;
          pos[j][2] -= pz;
        }
      }
    }
    // Very gentle restorative force to keep them from drifting infinitely if highly connected, but only tiny
    for (let i = 0; i < n; i++) {
       pos[i][0] *= 0.999;
       pos[i][1] *= 0.999;
       pos[i][2] *= 0.999;
    }
  }

  const out: Record<string, [number, number, number]> = {};
  zones.forEach((z, i) => {
    out[z.id] = pos[i];
  });
  return out;
}`;

code = code.replace(targetFunctionStr, newFunctionStr);
fs.writeFileSync('src/model/physics.ts', code);
console.log('patched layoutZones');
