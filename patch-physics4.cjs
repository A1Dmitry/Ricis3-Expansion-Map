const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf8');

const regex = /const masses = zoneR.map.*?GLOBAL_SPACE_RADIUS.*?;/s;
const replacement = `const masses = zoneR.map(R => (R * R * R) / 1000.0 + 1.0);
  
  // Умножаем массу обратно на 1000 чтобы получить реальный кубический объем
  const actualVolume = masses.reduce((sum, m) => sum + (m * 1000.0), 0);
  
  // Радиус сферы, которая вместит все зоны (x2 для запаса)
  const GLOBAL_SPACE_RADIUS = Math.max(300, Math.cbrt(actualVolume * 0.75 / Math.PI) * 2.5);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/model/physics.ts', code);
