const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf8');

code = code.replace(/const ZONE_SURFACE_GAP = 5.0;/, 'const ZONE_SURFACE_GAP = 30.0;');
fs.writeFileSync('src/model/physics.ts', code);
