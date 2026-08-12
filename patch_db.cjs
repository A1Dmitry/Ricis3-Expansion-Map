const fs = require('fs');
let code = fs.readFileSync('src/model/db.ts', 'utf8');

const helper = `
function clearMemoryStores() {
  memoryStores.nodes.clear();
  memoryStores.edges.clear();
  memoryStores.zones.clear();
  memoryStores.axioms.clear();
  memoryStores.proofs.clear();
}
`;
code = helper + code;

const target = `    memoryStores.nodes.clear();
    memoryStores.edges.clear();
    memoryStores.zones.clear();
    memoryStores.axioms.clear();
    memoryStores.proofs.clear();`;

code = code.replace(target, `    clearMemoryStores();`);
code = code.replace(target, `    clearMemoryStores();`);

fs.writeFileSync('src/model/db.ts', code);
console.log("db.ts patched");
