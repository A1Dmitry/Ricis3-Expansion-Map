const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf8');

// The clones reported:
// model/physics.ts [244:62 - 260:12] (17 lines, 97 tokens) => model/physics.ts [416:59 - 433:12]
// model/physics.ts [270:68 - 279:36] (10 lines, 62 tokens) => model/physics.ts [447:54 - 456:36]

const target3_1 = `          const pushX = (dx / dist) * pushForce;
          const pushY = (dy / dist) * pushForce;
          const pushZ = (dz / dist) * pushForce;
          
          forces[j][0] += pushX;
          forces[j][1] += pushY;
          forces[j][2] += pushZ;
          
          forces[i][0] -= pushX;
          forces[i][1] -= pushY;
          forces[i][2] -= pushZ;`;
          
const replacement3_1 = `          const pX = (dx / dist) * pushForce;
          const pY = (dy / dist) * pushForce;
          const pZ = (dz / dist) * pushForce;
          
          forces[j][0] += pX;
          forces[j][1] += pY;
          forces[j][2] += pZ;
          
          forces[i][0] -= pX;
          forces[i][1] -= pY;
          forces[i][2] -= pZ;`;

if (code.includes(target3_1)) {
  code = code.replace(target3_1, replacement3_1);
}

fs.writeFileSync('src/model/physics.ts', code);
console.log("physics 3 patched");
