const fs = require('fs');
let code = fs.readFileSync('src/model/persistence.ts', 'utf8');

const importHelper = `import { initialMap } from './initialMap';
import { deepCopyInitialMap } from './initialMap';
`;
code = code.replace(`import { initialMap } from './initialMap';`, importHelper);

const target1 = `      nodes: initialMap.nodes.map(n => ({ ...n, economic: { ...n.economic } })),
      edges: initialMap.edges.map(e => ({ ...e })),
      zones: initialMap.zones.map(z => ({
        ...z,
        nodeIds: [...z.nodeIds],
        economicProfile: { ...z.economicProfile },
      })),
      axioms: [...initialMap.axioms],
      proofs: { ...initialMap.proofs },`;

code = code.replace(target1, `      ...deepCopyInitialMap(),`);
fs.writeFileSync('src/model/persistence.ts', code);

let storeCode = fs.readFileSync('src/store/mapStore.ts', 'utf8');
const storeImportHelper = `import { initialMap, deepCopyInitialMap } from '../model/initialMap';`;
storeCode = storeCode.replace(`import { initialMap } from '../model/initialMap';`, storeImportHelper);

const target2 = `    nodes: initialMap.nodes.map(n => ({ ...n, economic: { ...n.economic } })),
    edges: initialMap.edges.map(e => ({ ...e })),
    zones: initialMap.zones.map(z => ({
      ...z,
      nodeIds: [...z.nodeIds],
      economicProfile: { ...z.economicProfile },
    })),
    axioms: [...initialMap.axioms],
    proofs: { ...initialMap.proofs },`;
    
storeCode = storeCode.replace(target2, `    ...deepCopyInitialMap(),`);
fs.writeFileSync('src/store/mapStore.ts', storeCode);

let initialCode = fs.readFileSync('src/model/initialMap.ts', 'utf8');
const deepCopyFunc = `
export function deepCopyInitialMap(): Pick<MapState, 'nodes' | 'edges' | 'zones' | 'axioms' | 'proofs'> {
  return {
    nodes: initialMap.nodes.map(n => ({ ...n, economic: { ...n.economic } })),
    edges: initialMap.edges.map(e => ({ ...e })),
    zones: initialMap.zones.map(z => ({
      ...z,
      nodeIds: [...z.nodeIds],
      economicProfile: { ...z.economicProfile },
    })),
    axioms: [...initialMap.axioms],
    proofs: { ...initialMap.proofs },
  };
}
`;
initialCode = initialCode + deepCopyFunc;
fs.writeFileSync('src/model/initialMap.ts', initialCode);

console.log("persistence and mapStore patched");
