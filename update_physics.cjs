const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf8');

// Replace layoutZones loop
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
          // Жесткая коллизия (чтобы сферы не пересекались)
          force = (reqDist - dist) * 0.5; 
        } else {
          // Модель Катющика (Ньютон с противоположным вектором):
          // F = G * (m1 * m2) / r^2 (Вектор направлен ОТ другого тела, то есть отталкивание)
          // Не умножаем на -1.
          const G = 150.0;
          const repulsion = G * (masses[i] * masses[j]) / (dist * dist);
          force = repulsion;
        }
        
        // Ограничитель огромных сил на малых дистанциях
        force = Math.min(10.0, force);

        // a = F / m
        let accI = force / masses[i];
        let accJ = force / masses[j];

        // Применяем вектор (dx, dy, dz - вектор от j к i, поэтому i толкает в +, j в -)
        pos[i][0] += (dx / dist) * accI;
        pos[i][1] += (dy / dist) * accI;
        pos[i][2] += (dz / dist) * accI;
        
        pos[j][0] -= (dx / dist) * accJ;
        pos[j][1] -= (dy / dist) * accJ;
        pos[j][2] -= (dz / dist) * accJ;
      }
      
      // Внешнее "приталкивание" (экранирование по Катющику от внешнего космоса)
      // Внешняя среда давит внутрь макросистемы
      const dx = pos[i][0];
      const dy = pos[i][1];
      const dz = pos[i][2];
      const distFromCenter = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-6;
      
      // Сила внешнего давления. Растет квадратично, моделируя экранирование от внешних бесконечных масс
      const extPressureAcc = 0.05 * Math.pow(distFromCenter / (GLOBAL_SPACE_RADIUS * 0.5), 2);
      
      pos[i][0] -= (dx / distFromCenter) * extPressureAcc;
      pos[i][1] -= (dy / distFromCenter) * extPressureAcc;
      pos[i][2] -= (dz / distFromCenter) * extPressureAcc;
    }
  }

  `;
code = code.replace(zonesLoopRegex, newZonesLoop + 'const out: Record<string, [number, number, number]> = {};');

// Replace layoutNodes loop
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
          // Катющик: отталкивание базового поля без умножения на -1
          const G = 25.0;
          const repulsion = G * (massI * massJ) / (dist * dist);
          force = repulsion;
        }

        force = Math.min(2.5, force);

        let accI = force / massI;
        let accJ = force / massJ;
        
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
      
      // Внешнее давление среды внутри зоны (приталкивание к центру зоны за счет внешнего экранирования)
      const extPressureAcc = 0.1 * Math.pow(distFromCenter / (zR * 0.5), 2);
      
      pos[i][0] -= (dx / distFromCenter) * extPressureAcc;
      pos[i][1] -= (dy / distFromCenter) * extPressureAcc;
      pos[i][2] -= (dz / distFromCenter) * extPressureAcc;

      // Структурные связи (логические пружины Гука для графа зависимостей)
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
code = code.replace(nodesLoopRegex, newNodesLoop + 'const out: Record<string, [number, number, number]> = {};');

fs.writeFileSync('src/model/physics.ts', code);
