const fs = require('fs');
let code = fs.readFileSync('src/model/agent.ts', 'utf-8');

code = code.replace(
  "{ parentNode: anchor, existingTitles }",
  "{ parentNode: anchor, existingTitles, existingZones: map.zones.map(z => z.id) }"
);

fs.writeFileSync('src/model/agent.ts', code);
console.log('patched agent.ts for existingZones');
