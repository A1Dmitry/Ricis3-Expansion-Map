const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf-8');

const oldStart = "export function layoutNodes(";
const oldEnd = "  return out;\n}";

const startIndex = code.indexOf(oldStart);
if (startIndex === -1) throw new Error("Could not find layoutNodes");
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

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  // Calculate max depth per zone
  const zoneMaxDepth: Record<string, number> = {};
  // Calculate base R per zone based on node count and shielding, matching visual scale
  const zoneBaseR: Record<string, number> = {};
  
  map.zones.forEach(z => {
    zoneMaxDepth[z.id] = 0;
    // Base radius scales with zone visual radius. Multiplied by 2 for spread space.
    zoneBaseR[z.id] = Math.max(20, zoneVisualRadius(z, map.nodes) * 2.0);
  });
  
  nodes.forEach(node => {
    const zid = node.zoneIds[0] || 'math';
    if (zoneMaxDepth[zid] === undefined) {
       zoneMaxDepth[zid] = 0;
       zoneBaseR[zid] = 20;
    }
    if (node.fractalDepth && node.fractalDepth > zoneMaxDepth[zid]) {
      zoneMaxDepth[zid] = node.fractalDepth;
    }
  });

  const rawPos: Record<string, [number, number, number]> = {};

  // Depth 0: Place at zone center with tiny offset
  nodes.filter(n => (n.fractalDepth || 0) === 0).forEach((node, i, arr) => {
    const zid = node.zoneIds[0] || 'math';
    const zc = zonePositions[zid] || [0, 0, 0];
    
    const phi = Math.acos(1 - (2 * (i + 0.5)) / (arr.length || 1));
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    
    const offsetR = 0.5; 
    rawPos[node.id] = [
      zc[0] + Math.sin(phi) * Math.cos(theta) * offsetR,
      zc[1] + Math.sin(phi) * Math.sin(theta) * offsetR,
      zc[2] + Math.cos(phi) * offsetR
    ];
  });

  const globalMaxDepth = Math.max(0, ...Object.values(zoneMaxDepth));

  // For depths > 0, project outwards from parent
  for (let d = 1; d <= globalMaxDepth; d++) {
    const layerNodes = nodes.filter(n => (n.fractalDepth || 0) === d);
    
    const parentGroups: Record<string, typeof layerNodes> = {};
    layerNodes.forEach(node => {
      let primaryParentId = node.dependencyIds?.find(depId => {
         const dep = nodeMap.get(depId);
         return dep && (dep.fractalDepth || 0) === d - 1;
      }) || 'none';
      
      if (!parentGroups[primaryParentId]) parentGroups[primaryParentId] = [];
      parentGroups[primaryParentId].push(node);
    });
    
    for (const [parentId, siblings] of Object.entries(parentGroups)) {
      const parentNode = nodeMap.get(parentId);
      let baseDir = [0, 1, 0];
      
      const zid = siblings[0].zoneIds[0] || 'math';
      const zc = zonePositions[zid] || [0, 0, 0];
      const maxD = zoneMaxDepth[zid] || 1;
      let R = zoneBaseR[zid] || 20;
      
      const orbitStep = R / Math.max(1, maxD);
      const targetR = d * orbitStep;
      
      if (parentNode && rawPos[parentId]) {
        const pp = rawPos[parentId];
        const dx = pp[0] - zc[0];
        const dy = pp[1] - zc[1];
        const dz = pp[2] - zc[2];
        const len = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-9;
        if (len < 1) { // Parent is exactly at center, give random direction
           baseDir = [Math.random()-0.5, Math.random()-0.5, Math.random()-0.5];
           const blen = Math.sqrt(baseDir[0]*baseDir[0] + baseDir[1]*baseDir[1] + baseDir[2]*baseDir[2]) + 1e-9;
           baseDir = [baseDir[0]/blen, baseDir[1]/blen, baseDir[2]/blen];
        } else {
           baseDir = [dx/len, dy/len, dz/len];
        }
      } else {
        baseDir = [Math.random()-0.5, Math.random()-0.5, Math.random()-0.5];
        const len = Math.sqrt(baseDir[0]*baseDir[0] + baseDir[1]*baseDir[1] + baseDir[2]*baseDir[2]) + 1e-9;
        baseDir = [baseDir[0]/len, baseDir[1]/len, baseDir[2]/len];
      }
      
      let vUp = [0, 1, 0];
      if (Math.abs(baseDir[1]) > 0.9) vUp = [1, 0, 0];
      
      let cx = baseDir[1]*vUp[2] - baseDir[2]*vUp[1];
      let cy = baseDir[2]*vUp[0] - baseDir[0]*vUp[2];
      let cz = baseDir[0]*vUp[1] - baseDir[1]*vUp[0];
      let cLen = Math.sqrt(cx*cx + cy*cy + cz*cz) + 1e-9;
      const u1 = [cx/cLen, cy/cLen, cz/cLen];
      
      const u2 = [
        baseDir[1]*u1[2] - baseDir[2]*u1[1],
        baseDir[2]*u1[0] - baseDir[0]*u1[2],
        baseDir[0]*u1[1] - baseDir[1]*u1[0]
      ];
      
      const minNodeDist = 5.0; // Distance between spheres
      let requiredSin = (siblings.length * minNodeDist) / (2 * Math.PI * targetR);
      
      // If required spread is too big, cone grows naturally up to max spread
      if (requiredSin > 0.95) {
         requiredSin = 0.95;
      }
      const coneAngle = Math.max(Math.PI / 15, Math.asin(requiredSin)); 
      
      siblings.forEach((node, i) => {
        let dir = [...baseDir];
        if (siblings.length > 1) {
          const angle = (i / siblings.length) * Math.PI * 2;
          const rCone = Math.sin(coneAngle);
          const zCone = Math.cos(coneAngle);
          
          dir = [
            baseDir[0] * zCone + (u1[0] * Math.cos(angle) + u2[0] * Math.sin(angle)) * rCone,
            baseDir[1] * zCone + (u1[1] * Math.cos(angle) + u2[1] * Math.sin(angle)) * rCone,
            baseDir[2] * zCone + (u1[2] * Math.cos(angle) + u2[2] * Math.sin(angle)) * rCone
          ];
          const dLen = Math.sqrt(dir[0]*dir[0] + dir[1]*dir[1] + dir[2]*dir[2]) + 1e-9;
          dir = [dir[0]/dLen, dir[1]/dLen, dir[2]/dLen];
        }
        
        rawPos[node.id] = [
          zc[0] + dir[0] * targetR,
          zc[1] + dir[1] * targetR,
          zc[2] + dir[2] * targetR
        ];
      });
    }
  }

  const pos: [number, number, number][] = nodes.map(n => rawPos[n.id] || [0,0,0]);
  const vel = pos.map(() => [0, 0, 0] as [number, number, number]);
  const { kRep, steps, dt, damping, soft } = p;

  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < n; i++) {
      const nodeI = nodes[i];
      const zidI = nodeI.zoneIds[0] || 'math';
      const Si = S[i];
      
      let fx = 0;
      let fy = 0;
      let fz = 0;

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const nodeJ = nodes[j];
        if (nodeJ.zoneIds[0] !== zidI) continue;
        if (nodeJ.fractalDepth !== nodeI.fractalDepth) continue;

        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const dz = pos[i][2] - pos[j][2];
        const r2 = dx * dx + dy * dy + dz * dz + soft * soft;
        const invR = 1 / Math.sqrt(r2);
        
        const mag = (kRep * 1.5 * (Si * S[j])) / r2;
        fx += dx * invR * mag;
        fy += dy * invR * mag;
        fz += dz * invR * mag;
      }
      
      const origPos = rawPos[nodeI.id];
      if (origPos) {
         fx += (origPos[0] - pos[i][0]) * 1.2; // Keep them closely packed in their cone
         fy += (origPos[1] - pos[i][1]) * 1.2;
         fz += (origPos[2] - pos[i][2]) * 1.2;
      }
      
      vel[i][0] = (vel[i][0] + fx * dt) * damping;
      vel[i][1] = (vel[i][1] + fy * dt) * damping;
      vel[i][2] = (vel[i][2] + fz * dt) * damping;
    }

    for (let i = 0; i < n; i++) {
      const nodeI = nodes[i];
      const zidI = nodeI.zoneIds[0] || 'math';
      const zcI = zonePositions[zidI] || [0, 0, 0];
      const maxD = zoneMaxDepth[zidI] || 1;
      const R = zoneBaseR[zidI] || 20;
      const orbitStep = R / Math.max(1, maxD);
      const targetR = (nodeI.fractalDepth || 0) * orbitStep;

      pos[i][0] += vel[i][0] * dt;
      pos[i][1] += vel[i][1] * dt;
      pos[i][2] += vel[i][2] * dt;
      
      const dx = pos[i][0] - zcI[0];
      const dy = pos[i][1] - zcI[1];
      const dz = pos[i][2] - zcI[2];
      
      const dist3D = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-9;
      
      if (targetR === 0) {
        if (dist3D > 1) {
          pos[i][0] = zcI[0] + (dx / dist3D) * 1;
          pos[i][1] = zcI[1] + (dy / dist3D) * 1;
          pos[i][2] = zcI[2] + (dz / dist3D) * 1;
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
console.log('patched physics for cone logic maxDepth proportional');
