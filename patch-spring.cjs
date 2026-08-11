const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf8');

const regex = /\/\/ Структурные связи \(логические пружины Гука для графа зависимостей\)[\s\S]*?\/\/ Строгое удержание в границах зоны/m;
const replacement = `// Структурные связи (Резинка / Пружина Гука)
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
          
          // Свободная длина пружины (резинки)
          const restLength = radI + radJ + minSurfaceGap * 1.5;
          
          // Закон Гука: F = k * dx (dx = ddist - restLength)
          const k = 15.0; // Жесткость пружины
          let springForce = k * (ddist - restLength);
          
          // Ограничиваем максимальную силу упругости натяжения
          springForce = Math.min(15.0, Math.max(-15.0, springForce));
          
          // Ускорение a = F / m
          const accI = springForce / massI;
          const accJ = springForce / massJ;
          
          const moveScale = 0.01;
          
          // Вектор ddx направлен от i к j
          // Применяем симметрично к обоим телам (3-й закон Ньютона)
          pos[i][0] += (ddx / ddist) * accI * moveScale;
          pos[i][1] += (ddy / ddist) * accI * moveScale;
          pos[i][2] += (ddz / ddist) * accI * moveScale;
          
          pos[j][0] -= (ddx / ddist) * accJ * moveScale;
          pos[j][1] -= (ddy / ddist) * accJ * moveScale;
          pos[j][2] -= (ddz / ddist) * accJ * moveScale;
        }
      }

      // Строгое удержание в границах зоны`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/model/physics.ts', code);
