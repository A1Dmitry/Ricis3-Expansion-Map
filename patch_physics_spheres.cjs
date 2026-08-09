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

  const ORBIT_STEP = 25;

  // Initialize positions on a 3D sphere
  const pos: [number, number, number][] = nodes.map((node, i) => {
    const zid = node.zoneIds[0] || 'math';
    const zc = zonePositions[zid] || [0, 0, 0];
    
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const targetR = (node.fractalDepth || 0) * ORBIT_STEP;
    
    const zLen = Math.sqrt(zc[0]*zc[0] + zc[1]*zc[1] + zc[2]*zc[2]) + 1e-9;
    const zDir = [zc[0]/zLen, zc[1]/zLen, zc[2]/zLen];
    
    const jitter = [
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    ];

    // blend zone direction and jitter
    let dx = zDir[0] * 2 + jitter[0];
    let dy = zDir[1] * 2 + jitter[1];
    let dz = zDir[2] * 2 + jitter[2];
    
    const dLen = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-9;
    
    if (targetR === 0) {
      return [(jitter[0]*2), (jitter[1]*2), (jitter[2]*2)];
    }
    
    return [
      (dx / dLen) * targetR,
      (dy / dLen) * targetR,
      (dz / dLen) * targetR
    ];
  });

  const vel = pos.map(() => [0, 0, 0] as [number, number, number]);
  const { kRep, steps, dt, damping, soft } = p;

  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < n; i++) {
      const Si = S[i];
      const targetR = (nodes[i].fractalDepth || 0) * ORBIT_STEP;
      
      let fx = 0;
      let fy = 0;
      let fz = 0;

      // Attract to zone center direction
      const zid = nodes[i].zoneIds[0] || 'math';
      const zc = zonePositions[zid] || [0, 0, 0];
      const zLen = Math.sqrt(zc[0]*zc[0] + zc[1]*zc[1] + zc[2]*zc[2]) + 1e-9;
      const idealX = (zc[0] / zLen) * targetR;
      const idealY = (zc[1] / zLen) * targetR;
      const idealZ = (zc[2] / zLen) * targetR;
      
      if (targetR > 0) {
        fx += (idealX - pos[i][0]) * 0.05 * Si;
        fy += (idealY - pos[i][1]) * 0.05 * Si;
        fz += (idealZ - pos[i][2]) * 0.05 * Si;
      }

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
      
      // Project back to exact global 3D sphere
      const targetR = (node.fractalDepth || 0) * ORBIT_STEP;
      const dx = pos[i][0];
      const dy = pos[i][1];
      const dz = pos[i][2];
      
      const dist3D = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-9;
      
      if (targetR === 0) {
        if (dist3D > 5) {
          pos[i][0] = (dx / dist3D) * 5;
          pos[i][1] = (dy / dist3D) * 5;
          pos[i][2] = (dz / dist3D) * 5;
        }
      } else {
        pos[i][0] = (dx / dist3D) * targetR;
        pos[i][1] = (dy / dist3D) * targetR;
        pos[i][2] = (dz / dist3D) * targetR;
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
console.log('patched physics');
