const fs = require('fs');

let storeCode = fs.readFileSync('src/store/mapStore.ts', 'utf-8');
storeCode = storeCode.replace(
  'runAgentDiscovery: (anchorNodeId?: string) => number;',
  'runAgentDiscovery: (anchorNodeId?: string) => Promise<number>;'
);
storeCode = storeCode.replace(
  'runAgentDiscovery: (anchorNodeId?: string) => {',
  'runAgentDiscovery: async (anchorNodeId?: string) => {'
);
storeCode = storeCode.replace(
  'const next = applyAgentDiscoveries(state, anchor, 2);',
  'const next = await applyAgentDiscoveries(state, anchor, 2);'
);
fs.writeFileSync('src/store/mapStore.ts', storeCode);

let uiCode = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');
uiCode = uiCode.replace(
  'const handleAgentDiscovery = () => {',
  'const handleAgentDiscovery = async () => {'
);
uiCode = uiCode.replace(
  'const added = map.runAgentDiscovery(selectedNodeId || undefined);',
  'const added = await map.runAgentDiscovery(selectedNodeId || undefined);'
);
fs.writeFileSync('src/ui/Map3D.tsx', uiCode);

console.log('PATCHED store and UI');
