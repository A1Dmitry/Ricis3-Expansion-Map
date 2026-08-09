const fs = require('fs');
let code = fs.readFileSync('src/store/mapStore.ts', 'utf-8');

code = code.replace(
  `  solveNode: (nodeId: string) => void;`,
  `  solveNode: (nodeId: string) => Promise<void>;`
);

code = code.replace(
  `  solveNode: (nodeId: string) => {
    const state = get();
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node || node.state === 'resolved' || state.proofs[nodeId]) {
      return;
    }
    if (!isNodeAvailable(node, state)) return;
    const newState = solveNodeLogic(state, nodeId);
    set(newState);
    void saveMapToDb(newState);
  },`,
  `  solveNode: async (nodeId: string) => {
    const state = get();
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node || node.state === 'resolved' || state.proofs[nodeId]) {
      return;
    }
    if (!isNodeAvailable(node, state)) return;
    const newState = await solveNodeLogic(state, nodeId);
    set(newState);
    void saveMapToDb(newState);
  },`
);

fs.writeFileSync('src/store/mapStore.ts', code);
console.log('PATCHED mapStore.ts');
