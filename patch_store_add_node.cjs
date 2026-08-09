const fs = require('fs');
let code = fs.readFileSync('src/store/mapStore.ts', 'utf-8');

if (!code.includes('addCustomNode')) {
  code = code.replace(
    `import { MapState } from '../model/types';`,
    `import { MapState, ProblemNode, DependencyEdge, Zone } from '../model/types';`
  );

  code = code.replace(
    `  runAgentDiscovery: (anchorNodeId?: string) => Promise<{ added: number; error?: string }>;`,
    `  runAgentDiscovery: (anchorNodeId?: string) => Promise<{ added: number; error?: string }>;
  addCustomNode: (node: ProblemNode, parentId?: string, newZoneName?: string) => Promise<void>;`
  );

  const addCustomNodeLogic = `
  addCustomNode: async (node, parentId, newZoneName) => {
    const state = get();
    let newZones = [...state.zones];
    let zoneId = node.zoneIds[0] || 'math';
    
    if (newZoneName) {
      const existingZone = newZones.find(z => z.name.toLowerCase() === newZoneName.toLowerCase());
      if (existingZone) {
        zoneId = existingZone.id;
        node.zoneIds = [zoneId];
      } else {
        zoneId = 'zone-' + Date.now();
        node.zoneIds = [zoneId];
        newZones.push({
          id: zoneId,
          name: newZoneName,
          baseColor: '#00ff00',
          nodeIds: [],
          economicProfile: {
            marketSize: 100000000,
            monopolyRisk: 0.5
          }
        });
      }
    }

    const updatedZones = newZones.map(z => 
      z.id === zoneId ? { ...z, nodeIds: [...z.nodeIds, node.id] } : z
    );

    let newEdges = [...state.edges];
    let updatedNodes = [...state.nodes];

    if (parentId) {
      const parent = updatedNodes.find(n => n.id === parentId);
      if (parent) {
        parent.dependentIds = [...new Set([...parent.dependentIds, node.id])];
        node.dependencyIds = [...new Set([...node.dependencyIds, parentId])];
        node.fractalDepth = parent.fractalDepth + 1;
        newEdges.push({
          id: \`edge-\${parentId}-\${node.id}\`,
          fromId: parentId,
          toId: node.id,
          strength: 0.8,
          stateColor: 'red',
          economicInfluence: 0.5,
        });
      }
    }

    updatedNodes.push(node);

    const newState = {
      ...state,
      nodes: updatedNodes,
      edges: newEdges,
      zones: updatedZones
    };
    
    set(newState);
    void saveMapToDb(newState);
  },
`;

  code = code.replace(`  runAgentDiscovery: async (anchorNodeId?: string) => {`, addCustomNodeLogic + `  runAgentDiscovery: async (anchorNodeId?: string) => {`);
  fs.writeFileSync('src/store/mapStore.ts', code);
  console.log('Added addCustomNode to mapStore');
} else {
  console.log('addCustomNode already exists');
}
