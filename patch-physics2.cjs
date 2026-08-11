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

        // РАССТОЯНИЕ МЕЖДУ ПОВЕРХНОСТЯМИ (а не центрами)
        const surfaceDist = Math.max(0.1, dist - zoneR[i] - zoneR[j]);
        
        // Базовое расталкивание Катющика (поверхностное)
        const G = 200.0;
        let force = G * (masses[i] * masses[j]) / (surfaceDist * surfaceDist);
        
        // Если пересекаются - добавляем жесткую коллизию
        if (surfaceDist < ZONE_SURFACE_GAP) {
           force += (ZONE_SURFACE_GAP - surfaceDist) * 5.0;
        }

        force = Math.min(25.0, force); // Ограничитель

        const moveScale = 0.05;
        let accI = (force / masses[i]) * moveScale;
        let accJ = (force / masses[j]) * moveScale;
        
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
      
      // Внешнее давление среды: отталкивание от ВНЕШНЕЙ ГРАНИЦЫ пространства (а не притяжение к центру)
      // Расстояние от внешней поверхности пузыря до границы космоса
      const boundarySurfaceDist = Math.max(1.0, GLOBAL_SPACE_RADIUS - distFromCenter - zoneR[i]);
      
      // Давление тем сильнее, чем ближе к границе (экранирование извне)
      const extPressureForce = 250.0 * masses[i] / (boundarySurfaceDist * boundarySurfaceDist);
      let extPressureAcc = (extPressureForce / masses[i]) * 0.05; 
      extPressureAcc = Math.min(2.0, Math.max(-2.0, extPressureAcc)); 

      pos[i][0] -= (dx / distFromCenter) * extPressureAcc;
      pos[i][1] -= (dy / distFromCenter) * extPressureAcc;
      pos[i][2] -= (dz / distFromCenter) * extPressureAcc;
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

        // Расталкивание по Катющику
        const G = 30.0;
        let force = G * (massI * massJ) / (surfaceDist * surfaceDist);

        if (surfaceDist < minSurfaceGap) {
          force += (minSurfaceGap - surfaceDist) * 3.0;
        }

        force = Math.min(15.0, force);

        const moveScale = 0.05;
        let accI = (force / massI) * moveScale;
        let accJ = (force / massJ) * moveScale;
        
        accI = Math.min(2.0, accI);
        accJ = Math.min(2.0, accJ);

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
      
      // Внешнее давление среды: отталкивание от ВНЕШНЕЙ ГРАНИЦЫ зоны
      const boundarySurfaceDist = Math.max(0.5, zR - distFromCenter - radI);
      const extPressureForce = 60.0 * massI / (boundarySurfaceDist * boundarySurfaceDist);
      let extPressureAcc = (extPressureForce / massI) * 0.05;
      extPressureAcc = Math.min(2.0, extPressureAcc);
      
      pos[i][0] -= (dx / distFromCenter) * extPressureAcc;
      pos[i][1] -= (dy / distFromCenter) * extPressureAcc;
      pos[i][2] -= (dz / distFromCenter) * extPressureAcc;

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
          
          // Закон Гука для поверхностей
          const k = 10.0; 
          let springForce = k * (surfaceDist - restSurfaceGap);
          springForce = Math.min(10.0, Math.max(-10.0, springForce));
          
          const accI = springForce / massI;
          const accJ = springForce / massJ;
          const moveScale = 0.01;
          
          pos[i][0] += (ddx / ddist) * accI * moveScale;
          pos[i][1] += (ddy / ddist) * accI * moveScale;
          pos[i][2] += (ddz / ddist) * accI * moveScale;
          
          pos[j][0] -= (ddx / ddist) * accJ * moveScale;
          pos[j][1] -= (ddy / ddist) * accJ * moveScale;
          pos[j][2] -= (ddz / ddist) * accJ * moveScale;
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
code = code.replace(nodesLoopRegex, newNodesLoop + 'const out: Record<string, [number, number, number]> = {};');

fs.writeFileSync('src/model/physics.ts', code);
