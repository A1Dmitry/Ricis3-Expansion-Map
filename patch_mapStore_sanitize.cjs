const fs = require('fs');
let code = fs.readFileSync('src/store/mapStore.ts', 'utf-8');

code = code.replace(
  "import {\n  hydrateInitialState",
  "import {\n  sanitizeMap,\n  hydrateInitialState"
);

code = code.replace(
  "    const report = await applyAgentDiscoveries(state, anchorNodeId, 2, 6);\n    if (report.added > 0) {\n      set(report.map);\n      void saveMapToDb(report.map);\n    }",
  "    const report = await applyAgentDiscoveries(state, anchorNodeId, 2, 6);\n    if (report.added > 0) {\n      const sanitized = sanitizeMap(report.map);\n      set(sanitized);\n      void saveMapToDb(sanitized);\n    }"
);

code = code.replace(
  "    const report = await applyDerivativeSearch(state, { maxHits: 8 });\n    if (report.added > 0) {\n      set({ ...report.map, hydrated: true });\n      void saveMapToDb(report.map);\n    }",
  "    const report = await applyDerivativeSearch(state, { maxHits: 8 });\n    if (report.added > 0) {\n      const sanitized = sanitizeMap(report.map);\n      set({ ...sanitized, hydrated: true });\n      void saveMapToDb(sanitized);\n    }"
);

// We should also patch addCustomNode just in case
code = code.replace(
  "    const newState = {\n      ...state,\n      nodes: updatedNodes,\n      edges: newEdges,\n      zones: updatedZones,\n    };\n    set(newState);\n    void saveMapToDb(newState);",
  "    const newState = sanitizeMap({\n      ...state,\n      nodes: updatedNodes,\n      edges: newEdges,\n      zones: updatedZones,\n    });\n    set(newState);\n    void saveMapToDb(newState);"
);


fs.writeFileSync('src/store/mapStore.ts', code);
console.log('patched mapStore for sanitize');
