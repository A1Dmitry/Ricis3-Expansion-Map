const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf8');

// The clones reported: 
// model/physics.ts [164:30 - 170:18] (7 lines, 91 tokens) => model/physics.ts [403:55 - 410:49]
// model/physics.ts [244:62 - 260:12] (17 lines, 97 tokens) => model/physics.ts [416:59 - 433:12]
// model/physics.ts [270:68 - 279:36] (10 lines, 62 tokens) => model/physics.ts [447:54 - 456:36]

const target2_1 = `          const dx = Math.max(-MAX_DIST, Math.min(MAX_DIST, pos[j][0] - pos[i][0]));
          const dy = Math.max(-MAX_DIST, Math.min(MAX_DIST, pos[j][1] - pos[i][1]));
          const dz = Math.max(-MAX_DIST, Math.min(MAX_DIST, pos[j][2] - pos[i][2]));
          const distSq = dx*dx + dy*dy + dz*dz;
          const dist = Math.sqrt(distSq) + 1e-6;`;

const replacement2_1 = `          const ddx = pos[j][0] - pos[i][0];
          const ddy = pos[j][1] - pos[i][1];
          const ddz = pos[j][2] - pos[i][2];
          const dx = Math.max(-MAX_DIST, Math.min(MAX_DIST, ddx));
          const dy = Math.max(-MAX_DIST, Math.min(MAX_DIST, ddy));
          const dz = Math.max(-MAX_DIST, Math.min(MAX_DIST, ddz));
          const distSq = dx*dx + dy*dy + dz*dz;
          const dist = Math.sqrt(distSq) + 1e-6;`;

if (code.includes(target2_1)) {
  code = code.replace(target2_1, replacement2_1);
}

const target2_2 = `        const dx = Math.max(-MAX_DIST, Math.min(MAX_DIST, center[0] - pos[i][0]));
        const dy = Math.max(-MAX_DIST, Math.min(MAX_DIST, center[1] - pos[i][1]));
        const dz = Math.max(-MAX_DIST, Math.min(MAX_DIST, center[2] - pos[i][2]));
        const distFromCenterSq = dx*dx + dy*dy + dz*dz;
        const distFromCenter = Math.sqrt(distFromCenterSq) + 1e-6;`;

const replacement2_2 = `        const dcx = center[0] - pos[i][0];
        const dcy = center[1] - pos[i][1];
        const dcz = center[2] - pos[i][2];
        const dx = Math.max(-MAX_DIST, Math.min(MAX_DIST, dcx));
        const dy = Math.max(-MAX_DIST, Math.min(MAX_DIST, dcy));
        const dz = Math.max(-MAX_DIST, Math.min(MAX_DIST, dcz));
        const distFromCenterSq = dx*dx + dy*dy + dz*dz;
        const distFromCenter = Math.sqrt(distFromCenterSq) + 1e-6;`;

if (code.includes(target2_2)) {
  code = code.replace(target2_2, replacement2_2);
}

fs.writeFileSync('src/model/physics.ts', code);
console.log("physics 2 patched");
