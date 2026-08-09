const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf-8');

// We will replace both layoutZones and layoutNodes.
const lzStart = "export function layoutZones(";
const lnStart = "export function layoutNodes(";

const lzIndex = code.indexOf(lzStart);
const lnIndex = code.indexOf(lnStart);

if (lzIndex === -1 || lnIndex === -1) {
  console.log("Could not find functions");
  process.exit(1);
}

// Since layoutNodes is after layoutZones, we'll just substring until the end.
const codeBefore = code.substring(0, lzIndex);

const newCode = `export function layoutZones(
  zones: ScienceZone[],
  nodes: ProblemNode[],
  params: Partial<PressureLayoutParams> = {}
): Record<string, [number, number, number]> {
  const p = { ...DEFAULT_ZONE, ...params };
  const S = zones.map(z => zoneShielding(z, nodes));
  const pos = relaxPressureRepulsion(zones.length, S, p);
  
  const zoneMaxDepth: Record<string, number> = {};
  zones.forEach(z => { zoneMaxDepth[z.id] = 0; });
  nodes.forEach(n => {
     const zid = n.zoneIds[0];
     if (zid && zoneMaxDepth[zid] !== undefined) {
         zoneMaxDepth[zid] = Math.max(zoneMaxDepth[zid], n.fractalDepth || 0);
     }
  });

  const zoneR = zones.map(z => {
      const maxD = zoneMaxDepth[z.id] || 0;
      const baseR = Math.max(20, zoneVisualRadius(z, nodes) * 2.0);
      const orbitStep = Math.max(20, baseR / Math.max(1, maxD));
      return Math.max(baseR, orbitStep * maxD) + 30; // +30 to give plenty of outer padding
  });
  
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
          const pushFactor = 0.5;
          
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
}

export function layoutNodes(
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
  
  const zoneMaxDepth: Record<string, number> = {};
  const zoneBaseR: Record<string, number> = {};
  
  map.zones.forEach(z => {
    zoneMaxDepth[z.id] = 0;
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
  const nodeRadii: Record<string, number> = {};
  nodes.forEach(node => {
    nodeRadii[node.id] = nodeVisualRadius(node, nodes);
  });

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
      
      const orbitStep = Math.max(20, R / Math.max(1, maxD));
      const targetR = d * orbitStep;
      
      if (parentNode && rawPos[parentId]) {
        const pp = rawPos[parentId];
        const dx = pp[0] - zc[0];
        const dy = pp[1] - zc[1];
        const dz = pp[2] - zc[2];
        const len = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-9;
        if (len < 1) { 
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
      
      // Calculate min spacing based on node radius
      let totalCircumferenceNeeded = 0;
      siblings.forEach(node => {
         totalCircumferenceNeeded += 4 * nodeRadii[node.id];
      });
      
      let requiredSin = totalCircumferenceNeeded / (2 * Math.PI * targetR);
      
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
      const radI = nodeRadii[nodeI.id];
      
      let fx = 0;
      let fy = 0;
      let fz = 0;

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const nodeJ = nodes[j];
        if (nodeJ.zoneIds[0] !== zidI) continue;
        if (nodeJ.fractalDepth !== nodeI.fractalDepth) continue;

        const radJ = nodeRadii[nodeJ.id];
        
        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const dz = pos[i][2] - pos[j][2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-9;
        
        const requiredDist = 4 * Math.max(radI, radJ);
        if (dist < requiredDist) {
          const overlap = requiredDist - dist;
          const mag = (overlap / requiredDist) * 50.0; // Strong push
          fx += (dx / dist) * mag;
          fy += (dy / dist) * mag;
          fz += (dz / dist) * mag;
        }
      }
      
      const origPos = rawPos[nodeI.id];
      if (origPos) {
         fx += (origPos[0] - pos[i][0]) * 0.5; // Restorative force to stay in cone
         fy += (origPos[1] - pos[i][1]) * 0.5;
         fz += (origPos[2] - pos[i][2]) * 0.5;
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
      const orbitStep = Math.max(20, R / Math.max(1, maxD));
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
}

/** 
 * Радиус сферы зоны 
 */
export function zoneVisualRadius(zone: ScienceZone, nodes: ProblemNode[]): number {
  const members = nodes.filter(
    n => zone.nodeIds.includes(n.id) || n.zoneIds.includes(zone.id)
  );
  const count = members.length;
  const S = zoneShielding(zone, nodes);
  const byCount = Math.sqrt(Math.max(1, count)) * 2.8;
  const byShield = Math.sqrt(S) * 1.1;
  return Math.min(28, 4.2 + byCount + byShield);
}

export function nodeVisualRadius(node: ProblemNode, allNodes: ProblemNode[]): number {
  const S = nodeShielding(node);
  const dependentBoost = 0.12 * (node.dependentIds?.length || 0);
  const depGraphBoost = 0.04 * (node.dependencyIds?.length || 0);
  const significance = Math.min(1, (S / 3.2 + dependentBoost + depGraphBoost) / 1.6);
  const coreBoost = node.type === 'core_singularity' ? 1.25 : 1.0;
  const base = 1.55 + significance * 1.15;
  return base * coreBoost;
}
`;

fs.writeFileSync('src/model/physics.ts', codeBefore + newCode);
console.log('patched both layout algorithms');
