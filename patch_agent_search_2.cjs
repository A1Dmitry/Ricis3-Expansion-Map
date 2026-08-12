const fs = require('fs');
let code = fs.readFileSync('src/model/agent.ts', 'utf8');

// There is a clone reported between model/agent.ts and model/derivativeSearch.ts 

const targetAgent = `    const finalZones = working.zones.map(z => {
      const addIds = nodes.filter(nn => nn.zoneIds.includes(z.id)).map(nn => nn.id);
      if (addIds.length === 0) return z;
      return { ...z, nodeIds: [...new Set([...z.nodeIds, ...addIds])] };
    });`;

if (code.includes(targetAgent)) {
  const replacementAgent = `    const finalZones = working.zones.map(z => mergeZoneNodeIds(z, nodes));`;
  
  const helper = `
export function mergeZoneNodeIds(z: { id: string, nodeIds: string[] }, nodes: { id: string, zoneIds: string[] }[]): any {
  const addIds = nodes.filter(nn => nn.zoneIds.includes(z.id)).map(nn => nn.id);
  if (addIds.length === 0) return z;
  return { ...z, nodeIds: [...new Set([...z.nodeIds, ...addIds])] };
}
`;
  code = helper + code;
  code = code.replace(targetAgent, replacementAgent);
  fs.writeFileSync('src/model/agent.ts', code);
  console.log("agent patched");
}

let code2 = fs.readFileSync('src/model/derivativeSearch.ts', 'utf8');
const targetSearch = `  const newZones = state.zones.map(z => {
    const addIds = newNodes.filter(nn => nn.zoneIds.includes(z.id)).map(nn => nn.id);
    if (addIds.length === 0) return z;
    return { ...z, nodeIds: [...new Set([...z.nodeIds, ...addIds])] };
  });`;

if (code2.includes(targetSearch)) {
  const importHelper = `import { mergeZoneNodeIds } from './agent';\n`;
  code2 = importHelper + code2;
  const replacementSearch = `  const newZones = state.zones.map(z => mergeZoneNodeIds(z, newNodes));`;
  code2 = code2.replace(targetSearch, replacementSearch);
  fs.writeFileSync('src/model/derivativeSearch.ts', code2);
  console.log("derivativeSearch patched");
}
