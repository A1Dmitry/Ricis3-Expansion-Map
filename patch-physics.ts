import fs from 'fs';

let content = fs.readFileSync('src/model/physics.ts', 'utf8');

// We will fix layoutZones and layoutNodes carefully.

// First, fix layoutZones loop
const zonesLoopRegex = /for \(let iter = 0; iter < 600; iter\+\+\) \{([\s\S]*?)const out: Record<string, \[number, number, number\]> = \{\};/m;
const newZonesLoop = `for (let iter = 0; iter < 600; iter++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const dz = pos[i][2] - pos[j][2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-9;

        const reqDist = zoneR[i] + zoneR[j] + ZONE_SURFACE_GAP;
        
        let force = 0;
        if (dist < reqDist) {
          force = (reqDist - dist) * 0.5; // Смягчили пружину коллизий
        } else {
          const repulsion = 20.0 * (masses[i] * masses[j]) / (dist * dist);
          force = Math.min(10.0, repulsion);
        }

        const moveScale = 0.2;
        let accI = (force / masses[i]) * moveScale;
        let accJ = (force / masses[j]) * moveScale;
        
        // Ограничитель скорости (защита от взрыва симуляции)
        accI = Math.min(2.0, Math.max(-2.0, accI));
        accJ = Math.min(2.0, Math.max(-2.0, accJ));

        pos[i][0] += (dx / dist) * accI;
        pos[i][1] += (dy / dist) * accI;
        pos[i][2] += (dz / dist) * accI;
        
        pos[j][0] -= (dx / dist) * accJ;
        pos[j][1] -= (dy / dist) * accJ;
        pos[j][2] -= (dz / dist) * accJ;
      }
      
      const dx = pos[i][0];
      const dy = pos[i][1];
      const dz = pos[i][2];
      const distFromCenter = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-6;
      
      const pressureRatio = Math.pow(distFromCenter / GLOBAL_SPACE_RADIUS, 2); // Квадратичное вместо кубического для плавности
      let extPressureAcc = 0.5 * pressureRatio; 
      extPressureAcc = Math.min(1.5, Math.max(-1.5, extPressureAcc)); // Ограничитель

      pos[i][0] -= (dx / distFromCenter) * extPressureAcc;
      pos[i][1] -= (dy / distFromCenter) * extPressureAcc;
      pos[i][2] -= (dz / distFromCenter) * extPressureAcc;
    }
  }

  `;
content = content.replace(zonesLoopRegex, newZonesLoop + 'const out: Record<string, [number, number, number]> = {};');


// Now fix layoutNodes loop
const nodesLoopRegex = /for \(let s = 0; s < 500; s\+\+\) \{([\s\S]*?)const out: Record<string, \[number, number, number\]> = \{\};/m;
const newNodesLoop = `for (let s = 0; s < 500; s++) {
    for (let i = 0; i < n; i++) {
      const nodeI = nodes[i];
      const radI = nodeRadii[nodeI.id];
      const massI = (radI * radI * radI) / 1000.0 + 0.1; 

      for (let j = i + 1; j < n; j++) {
        if (getZid(nodes[i]) !== getZid(nodes[j])) continue;

        const nodeJ = nodes[j];
        const radJ = nodeRadii[nodeJ.id];
        const massJ = (radJ * radJ * radJ) / 1000.0 + 0.1;

        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const dz = pos[i][2] - pos[j][2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-6;

        const reqDist = radI + radJ + minSurfaceGap;

        let force = 0;
        if (dist < reqDist) {
          force = (reqDist - dist) * 0.8;
        } else {
          const repulsion = 5.0 * (massI * massJ) / (dist * dist);
          force = Math.min(2.5, repulsion);
        }

        const moveScale = 0.2;
        let accI = (force / massI) * moveScale;
        let accJ = (force / massJ) * moveScale;
        
        accI = Math.min(2.0, Math.max(-2.0, accI));
        accJ = Math.min(2.0, Math.max(-2.0, accJ));

        pos[i][0] += (dx / dist) * accI;
        pos[i][1] += (dy / dist) * accI;
        pos[i][2] += (dz / dist) * accI;
        
        pos[j][0] -= (dx / dist) * accJ;
        pos[j][1] -= (dy / dist) * accJ;
        pos[j][2] -= (dz / dist) * accJ;
      }
      
      const zidI = getZid(nodeI);
      const zcI = zonePositions[zidI] || [0, 0, 0];
      const zR = zoneBaseR[zidI] || 15;
      
      const dx = pos[i][0] - zcI[0];
      const dy = pos[i][1] - zcI[1];
      const dz = pos[i][2] - zcI[2];
      const distFromCenter = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-6;
      
      // Внешнее давление среды нарастает кубически при попытке покинуть зону
      const pressureRatio = Math.pow(distFromCenter / zR, 3);
      let extPressureAcc = 0.5 * pressureRatio;
      extPressureAcc = Math.min(1.5, Math.max(-1.5, extPressureAcc));
      
      pos[i][0] -= (dx / distFromCenter) * extPressureAcc;
      pos[i][1] -= (dy / distFromCenter) * extPressureAcc;
      pos[i][2] -= (dz / distFromCenter) * extPressureAcc;

      // Структурные связи (логические пружины)
      const deps = nodeI.dependencyIds || [];
      for (const depId of deps) {
        const j = nodes.findIndex(x => x.id === depId);
        if (j !== -1 && getZid(nodeI) === getZid(nodes[j])) {
          const ddx = pos[j][0] - pos[i][0];
          const ddy = pos[j][1] - pos[i][1];
          const ddz = pos[j][2] - pos[i][2];
          const ddist = Math.sqrt(ddx*ddx + ddy*ddy + ddz*ddz) + 1e-6;
          
          const idealDist = radI + nodeRadii[nodes[j].id] + minSurfaceGap * 1.0;
          if (ddist > idealDist) {
            let pull = (ddist - idealDist) * 0.05;
            pull = Math.min(1.0, pull);
            pos[i][0] += (ddx / ddist) * pull;
            pos[i][1] += (ddy / ddist) * pull;
            pos[i][2] += (ddz / ddist) * pull;
          }
        }
      }

      // Строгое удержание в границах зоны (Непроницаемая граница макропространства)
      const maxAllowedDist = Math.max(1.0, zR - radI - 1.0);
      if (distFromCenter > maxAllowedDist) {
        pos[i][0] = zcI[0] + (dx / distFromCenter) * maxAllowedDist;
        pos[i][1] = zcI[1] + (dy / distFromCenter) * maxAllowedDist;
        pos[i][2] = zcI[2] + (dz / distFromCenter) * maxAllowedDist;
      }
    }
  }

  `;
content = content.replace(nodesLoopRegex, newNodesLoop + 'const out: Record<string, [number, number, number]> = {};');

fs.writeFileSync('src/model/physics.ts', content, 'utf8');
