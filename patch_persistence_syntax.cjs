const fs = require('fs');
let code = fs.readFileSync('src/model/persistence.ts', 'utf-8');

code = code.replace("  return { ...map, nodes, zones };\n};\n}", "  return { ...map, nodes, zones };\n}");

fs.writeFileSync('src/model/persistence.ts', code);
