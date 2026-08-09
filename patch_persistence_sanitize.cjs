const fs = require('fs');
let code = fs.readFileSync('src/model/persistence.ts', 'utf-8');

const sanitizeCode = `
export function sanitizeMap(map: MapState): MapState {
  const validZones = new Set(map.zones.map(z => z.id));
  
  const nodes = map.nodes.map(n => {
    let zids = (n.zoneIds || []).filter(zid => validZones.has(zid));
    if (zids.length === 0) {
      const parent = map.nodes.find(p => p.id === (n.dependencyIds && n.dependencyIds[0]));
      if (parent && parent.zoneIds && parent.zoneIds.some(zid => validZones.has(zid))) {
        zids = parent.zoneIds.filter(zid => validZones.has(zid));
      } else {
        zids = ['math'];
      }
    }
    return { ...n, zoneIds: zids };
  });

  const zones = map.zones.map(z => {
    const members = nodes.filter(n => n.zoneIds.includes(z.id)).map(n => n.id);
    return { ...z, nodeIds: Array.from(new Set([...(z.nodeIds || []), ...members])) };
  });

  return { ...map, nodes, zones };
}
`;

// Insert the sanitize function before fromSnapshot
code = code.replace("export function fromSnapshot", sanitizeCode + "\nexport function fromSnapshot");

// Now update fromSnapshot to call sanitizeMap
code = code.replace(
  "  return {\n    nodes: s.nodes,",
  "  return sanitizeMap({\n    nodes: s.nodes,"
);
// Make sure it closes properly
code = code.replace(
  "proofs: s.proofs && typeof s.proofs === 'object' ? s.proofs : {},\n  };",
  "proofs: s.proofs && typeof s.proofs === 'object' ? s.proofs : {},\n  });"
);

// We should also patch hydrateInitialState to call sanitizeMap on loadedDb, because it might not use fromSnapshot if it directly loads from DB.
const hydrateStr = "export async function hydrateInitialState(): Promise<MapState> {";
const hydrateIndex = code.indexOf(hydrateStr);
if (hydrateIndex !== -1) {
    code = code.replace(
        "const loadedDb = await dbLoadMap();",
        "let loadedDb = await dbLoadMap();\n  if (loadedDb) loadedDb = sanitizeMap(loadedDb);"
    );
}

fs.writeFileSync('src/model/persistence.ts', code);
console.log('patched persistence.ts');
