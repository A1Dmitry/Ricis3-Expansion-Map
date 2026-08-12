const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf8');

// There's a 7 line clone reported: model/physics.ts [71:5 - 77:7] => model/physics.ts [181:7 - 187:9]
const target = `    if (zone) {
      if (zone.economicProfile?.supply) {
        forceSum += zone.economicProfile.supply;
      }
      if (zone.economicProfile?.demand) {
        forceSum += zone.economicProfile.demand;
      }
    }`;

console.log(code.includes(target));
