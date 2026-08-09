const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf-8');

const oldStart = "export function layoutNodes(";
const oldEnd = "  return out;\n}";

const startIndex = code.indexOf(oldStart);
const endIndex = code.indexOf(oldEnd, startIndex) + oldEnd.length;

const newCode = `export function layoutNodes(
  map: MapState,
  zonePositions: Record<string, [number, number, number]>,
  params: Partial<PressureLayoutParams> = {}
): Record<string, [number, number, number]> {
  const nodes = map.nodes;
  const n = nodes.length;
  if (n === 0) return {};

  const p = { ...DEFAULT_NODE, ...params };
  const S = nodes.map(nodeShielding);

  // Global orbits
  const ORBIT_STEP = 25;

  const pos: [number, number, number][] = nodes.map((node, i) => {
    // Bias angle by zone to group them
    const zid = node.zoneIds[0] || 'math';
    const zc = zonePositions[zid] || [0, 0, 0];
    const baseAngle = Math.atan2(zc[1], zc[0]);
    const angle = baseAngle + (i * Math.PI * (3 - Math.sqrt(5))) * 0.5; // jitter around zone angle
    
    // Orbit radius based on fractalDepth
    const targetR = (node.fractalDepth || 0) * ORBIT_STEP;
    return [
      Math.cos(angle) * targetR,
      Math.sin(angle) * targetR,
      ((i * 0.618) % 1) * 2 - 1, // slight Z jitter
    ];
  });

  const vel = pos.map(() => [0, 0, 0] as [number, number, number]);
  const { kRep, steps, dt, damping, soft } = p;

  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < n; i++) {
      const Si = S[i];
      let fx = 0;
      let fy = 0;
      let fz = 0;

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const dz = pos[i][2] - pos[j][2];
        const r2 = dx * dx + dy * dy + dz * dz + soft * soft;
        const invR = 1 / Math.sqrt(r2);
        const mag = (kRep * (Si * S[j])) / r2;
        fx += dx * invR * mag;
        fy += dy * invR * mag;
        fz += dz * invR * mag;
      }
      
      vel[i][0] = (vel[i][0] + fx * dt) * damping;
      vel[i][1] = (vel[i][1] + fy * dt) * damping;
      vel[i][2] = (vel[i][2] + fz * dt) * damping;
    }

    for (let i = 0; i < n; i++) {
      const node = nodes[i];
      pos[i][0] += vel[i][0] * dt;
      pos[i][1] += vel[i][1] * dt;
      pos[i][2] += vel[i][2] * dt;
      
      // Project back to exact global orbit
      const targetR = (node.fractalDepth || 0) * ORBIT_STEP;
      const dx = pos[i][0];
      const dy = pos[i][1];
      
      pos[i][2] *= 0.5; // flatten Z
      
      if (targetR === 0) {
        // Keep core singularities at or very near center
        // If there are multiple, let them repel slightly but stay near center
        const dist2D = Math.sqrt(dx*dx + dy*dy) + 1e-9;
        if (dist2D > 5) {
          pos[i][0] = (dx / dist2D) * 5;
          pos[i][1] = (dy / dist2D) * 5;
        }
      } else {
        const dist2D = Math.sqrt(dx*dx + dy*dy) + 1e-9;
        pos[i][0] = (dx / dist2D) * targetR;
        pos[i][1] = (dy / dist2D) * targetR;
      }
    }
  }

  const out: Record<string, [number, number, number]> = {};
  nodes.forEach((node, i) => {
    out[node.id] = pos[i];
  });
  return out;
}`;

code = code.substring(0, startIndex) + newCode + code.substring(endIndex);
fs.writeFileSync('src/model/physics.ts', code);
console.log('patched 2');
