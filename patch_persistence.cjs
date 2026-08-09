const fs = require('fs');
let code = fs.readFileSync('src/model/persistence.ts', 'utf-8');

if (!code.includes("const missingZones")) {
  const replacement = `
  const fromDb = await dbLoadMap();
  let loadedState = null;
  
  if (fromDb && fromDb.nodes.length > 0) {
    loadedState = fromDb;
  } else {
    const legacy = loadLegacyLocalStorage();
    if (legacy && legacy.nodes.length > 0) {
      await dbSaveMap(legacy);
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {
        /* ignore */
      }
      loadedState = legacy;
    }
  }

  if (loadedState) {
    // Merge any zones from initialMap that are missing in the loaded state
    const existingZoneIds = new Set(loadedState.zones.map(z => z.id));
    const missingZones = initialMap.zones.filter(z => !existingZoneIds.has(z.id));
    if (missingZones.length > 0) {
      loadedState.zones = [...loadedState.zones, ...missingZones.map(z => ({
        ...z,
        nodeIds: [...z.nodeIds],
        economicProfile: { ...z.economicProfile }
      }))];
      await dbSaveMap(loadedState);
    }
    return loadedState;
  }
`;

  code = code.replace(
    /const fromDb = await dbLoadMap\(\);[\s\S]*?return legacy;\n  \}/,
    replacement
  );
  
  fs.writeFileSync('src/model/persistence.ts', code);
  console.log('Patched persistence.ts');
} else {
  console.log('Already patched');
}
