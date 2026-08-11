const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf8');

// Replace zones loop
const zonesLoopRegex = /for \(let iter = 0; iter < 600; iter\+\+\) \{([\s\S]*?)const out: Record<string, \[number, number, number\]> = \{\};/m;
const newZonesLoop = `for (let iter = 0; iter < 600; iter++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const dz = pos[i][2] - pos[j][2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-9;

        // Расстояние между поверхностями
        const surfaceDist = Math.max(0.1, dist - zoneR[i] - zoneR[j]);
        
        // Ускорение a = G * M / R^2
        const G = 15.0;
        let accI = G * masses[j] / (surfaceDist * surfaceDist);
        let accJ = G * masses[i] / (surfaceDist * surfaceDist);
        
        // Жесткая коллизия при касании (гарантия, что не слипнутся)
        if (surfaceDist < ZONE_SURFACE_GAP) {
           const boost = (ZONE_SURFACE_GAP - surfaceDist) * 2.0;
           accI += boost;
           accJ += boost;
        }

        // Ограничитель скачков, но он должен быть больше внешнего давления!
        accI = Math.min(10.0, accI);
        accJ = Math.min(10.0, accJ);

        const moveScale = 0.2;

        pos[i][0] += (dx / dist) * accI * moveScale;
        pos[i][1] += (dy / dist) * accI * moveScale;
        pos[i][2] += (dz / dist) * accI * moveScale;
        
        pos[j][0] -= (dx / dist) * accJ * moveScale;
        pos[j][1] -= (dy / dist) * accJ * moveScale;
        pos[j][2] -= (dz / dist) * accJ * moveScale;
      }
      
      const dx = pos[i][0];
      const dy = pos[i][1];
      const dz = pos[i][2];
      const distFromCenter = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-6;
      
      // Внешнее давление среды: отталкивание от ВНЕШНЕЙ ГРАНИЦЫ пространства
      const boundarySurfaceDist = Math.max(0.1, GLOBAL_SPACE_RADIUS - distFromCenter - zoneR[i]);
      
      // Давление тем сильнее, чем ближе к границе (экранирование извне)
      const G_ext = 20.0;
      let extPressureAcc = G_ext / (boundarySurfaceDist * boundarySurfaceDist);
      
      // Ограничитель внешнего давления (должен быть слабее коллизии, чтобы не сплющило шары)
      extPressureAcc = Math.min(4.0, extPressureAcc); 

      // Если пузырь вылетел за пределы, жестко толкаем обратно
      if (distFromCenter + zoneR[i] > GLOBAL_SPACE_RADIUS) {
         extPressureAcc += (distFromCenter + zoneR[i] - GLOBAL_SPACE_RADIUS) * 2.0;
      }

      const moveScale = 0.2;
      pos[i][0] -= (dx / distFromCenter) * extPressureAcc * moveScale;
      pos[i][1] -= (dy / distFromCenter) * extPressureAcc * moveScale;
      pos[i][2] -= (dz / distFromCenter) * extPressureAcc * moveScale;
    }
  }

  `;
code = code.replace(zonesLoopRegex, newZonesLoop + 'const out: Record<string, [number, number, number]> = {};');

// Replace nodes loop
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

        // Расстояние между поверхностями
        const surfaceDist = Math.max(0.1, dist - radI - radJ);

        // Расталкивание по Катющику (ускорение напрямую, чтобы масса не съедала эффект)
        const G = 5.0;
        let accI = G * massJ / (surfaceDist * surfaceDist);
        let accJ = G * massI / (surfaceDist * surfaceDist);

        if (surfaceDist < minSurfaceGap) {
          const boost = (minSurfaceGap - surfaceDist) * 2.0;
          accI += boost;
          accJ += boost;
        }

        accI = Math.min(8.0, accI);
        accJ = Math.min(8.0, accJ);

        const moveScale = 0.2;
        pos[i][0] += (dx / dist) * accI * moveScale;
        pos[i][1] += (dy / dist) * accI * moveScale;
        pos[i][2] += (dz / dist) * accI * moveScale;
        
        pos[j][0] -= (dx / dist) * accJ * moveScale;
        pos[j][1] -= (dy / dist) * accJ * moveScale;
        pos[j][2] -= (dz / dist) * accJ * moveScale;
      }
      
      const zidI = getZid(nodeI);
      const zcI = zonePositions[zidI] || [0, 0, 0];
      const zR = zoneBaseR[zidI] || 15;
      
      const dx = pos[i][0] - zcI[0];
      const dy = pos[i][1] - zcI[1];
      const dz = pos[i][2] - zcI[2];
      const distFromCenter = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-6;
      
      // Внешнее давление среды: отталкивание от ВНЕШНЕЙ ГРАНИЦЫ зоны
      const boundarySurfaceDist = Math.max(0.1, zR - distFromCenter - radI);
      const G_ext = 8.0;
      let extPressureAcc = G_ext / (boundarySurfaceDist * boundarySurfaceDist);
      
      extPressureAcc = Math.min(4.0, extPressureAcc);
      if (distFromCenter + radI > zR) {
        extPressureAcc += (distFromCenter + radI - zR) * 2.0;
      }
      
      const moveScale = 0.2;
      pos[i][0] -= (dx / distFromCenter) * extPressureAcc * moveScale;
      pos[i][1] -= (dy / distFromCenter) * extPressureAcc * moveScale;
      pos[i][2] -= (dz / distFromCenter) * extPressureAcc * moveScale;

      // Структурные связи (Резинка / Пружина Гука)
      const deps = nodeI.dependencyIds || [];
      for (const depId of deps) {
        const j = nodes.findIndex(x => x.id === depId);
        if (j !== -1 && getZid(nodeI) === getZid(nodes[j])) {
          const nodeJ = nodes[j];
          const radJ = nodeRadii[nodeJ.id];
          const massJ = (radJ * radJ * radJ) / 1000.0 + 0.1;
          
          const ddx = pos[j][0] - pos[i][0];
          const ddy = pos[j][1] - pos[i][1];
          const ddz = pos[j][2] - pos[i][2];
          const ddist = Math.sqrt(ddx*ddx + ddy*ddy + ddz*ddz) + 1e-6;
          
          const surfaceDist = Math.max(0.0, ddist - radI - radJ);
          const restSurfaceGap = minSurfaceGap * 1.5;
          
          // Закон Гука для поверхностей. a = k * dx / m
          const k = 2.0; 
          let springAccI = k * (surfaceDist - restSurfaceGap) / massI;
          let springAccJ = k * (surfaceDist - restSurfaceGap) / massJ;
          
          springAccI = Math.min(5.0, Math.max(-5.0, springAccI));
          springAccJ = Math.min(5.0, Math.max(-5.0, springAccJ));
          
          pos[i][0] += (ddx / ddist) * springAccI * moveScale;
          pos[i][1] += (ddy / ddist) * springAccI * moveScale;
          pos[i][2] += (ddz / ddist) * springAccI * moveScale;
          
          pos[j][0] -= (ddx / ddist) * springAccJ * moveScale;
          pos[j][1] -= (ddy / ddist) * springAccJ * moveScale;
          pos[j][2] -= (ddz / ddist) * springAccJ * moveScale;
        }
      }

      // Строгое удержание в границах зоны
      const maxAllowedDist = Math.max(0.0, zR - radI);
      if (distFromCenter > maxAllowedDist) {
        pos[i][0] = zcI[0] + (dx / distFromCenter) * maxAllowedDist;
        pos[i][1] = zcI[1] + (dy / distFromCenter) * maxAllowedDist;
        pos[i][2] = zcI[2] + (dz / distFromCenter) * maxAllowedDist;
      }
    }
  }

  `;
code = code.replace(nodesLoopRegex, newNodesLoop + 'const out: Record<string, [number, number, number]> = {};');

fs.writeFileSync('src/model/physics.ts', code);
