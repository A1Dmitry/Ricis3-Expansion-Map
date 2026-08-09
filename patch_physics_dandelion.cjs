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

  const ORBIT_STEP = 12; // Distance between concentric shells inside a zone

  // Initialize positions around their respective zone centers
  const pos: [number, number, number][] = nodes.map((node, i) => {
    const zid = node.zoneIds[0] || 'math';
    const zc = zonePositions[zid] || [0, 0, 0];
    
    const targetR = (node.fractalDepth || 0) * ORBIT_STEP;
    
    // Distribute evenly-ish on a sphere
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    
    if (targetR === 0) {
      // Root nodes close to center with tiny jitter
      return [
        zc[0] + (Math.random() - 0.5),
        zc[1] + (Math.random() - 0.5),
        zc[2] + (Math.random() - 0.5)
      ];
    }
    
    return [
      zc[0] + Math.sin(phi) * Math.cos(theta) * targetR,
      zc[1] + Math.sin(phi) * Math.sin(theta) * targetR,
      zc[2] + Math.cos(phi) * targetR
    ];
  });

  const vel = pos.map(() => [0, 0, 0] as [number, number, number]);
  const { kRep, steps, dt, damping, soft } = p;

  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < n; i++) {
      const nodeI = nodes[i];
      const zidI = nodeI.zoneIds[0] || 'math';
      const zcI = zonePositions[zidI] || [0, 0, 0];
      const targetR = (nodeI.fractalDepth || 0) * ORBIT_STEP;
      const Si = S[i];
      
      let fx = 0;
      let fy = 0;
      let fz = 0;

      // Only repel nodes within the same zone or close by
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const nodeJ = nodes[j];
        if (nodeJ.zoneIds[0] !== zidI) continue; // Only intra-zone repulsion

        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const dz = pos[i][2] - pos[j][2];
        const r2 = dx * dx + dy * dy + dz * dz + soft * soft;
        const invR = 1 / Math.sqrt(r2);
        // amplify repulsion on the same shell
        const shellFactor = (nodeI.fractalDepth === nodeJ.fractalDepth) ? 2.0 : 0.5;
        const mag = (kRep * shellFactor * (Si * S[j])) / r2;
        fx += dx * invR * mag;
        fy += dy * invR * mag;
        fz += dz * invR * mag;
      }
      
      vel[i][0] = (vel[i][0] + fx * dt) * damping;
      vel[i][1] = (vel[i][1] + fy * dt) * damping;
      vel[i][2] = (vel[i][2] + fz * dt) * damping;
    }

    for (let i = 0; i < n; i++) {
      const nodeI = nodes[i];
      const zidI = nodeI.zoneIds[0] || 'math';
      const zcI = zonePositions[zidI] || [0, 0, 0];
      const targetR = (nodeI.fractalDepth || 0) * ORBIT_STEP;

      pos[i][0] += vel[i][0] * dt;
      pos[i][1] += vel[i][1] * dt;
      pos[i][2] += vel[i][2] * dt;
      
      // Project back to exact shell relative to zone center
      const dx = pos[i][0] - zcI[0];
      const dy = pos[i][1] - zcI[1];
      const dz = pos[i][2] - zcI[2];
      
      const dist3D = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-9;
      
      if (targetR === 0) {
        if (dist3D > 2) {
          pos[i][0] = zcI[0] + (dx / dist3D) * 2;
          pos[i][1] = zcI[1] + (dy / dist3D) * 2;
          pos[i][2] = zcI[2] + (dz / dist3D) * 2;
        }
      } else {
        pos[i][0] = zcI[0] + (dx / dist3D) * targetR;
        pos[i][1] = zcI[1] + (dy / dist3D) * targetR;
        pos[i][2] = zcI[2] + (dz / dist3D) * targetR;
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
console.log('patched physics for dandelion layout');
