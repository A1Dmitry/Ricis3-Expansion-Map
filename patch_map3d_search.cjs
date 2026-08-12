const fs = require('fs');
const path = 'src/ui/Map3D.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetHelper = `export function Map3D({`;
const helperReplacement = `
function nodeMatchesQuery(n: ProblemNode, q: string, hiddenZones: Set<string>, showOnlyDerivatives: boolean): boolean {
  if (n.zoneIds.every(zid => hiddenZones.has(zid))) return false;
  if (showOnlyDerivatives && !isDerivativeNode(n)) return false;
  if (!q) return true;
  return (
    (n.title?.toLowerCase().includes(q) || false) ||
    (n.description?.toLowerCase().includes(q) || false) ||
    (n.targetFunction?.toLowerCase().includes(q) || false)
  );
}

export function Map3D({`;

if (!code.includes('function nodeMatchesQuery')) {
  code = code.replace(targetHelper, helperReplacement);
}

// Now replace in saveToHistory
const targetSaveFilter = `    const matchesCount = map.nodes.filter(n => {
      if (n.zoneIds.every(zid => hiddenZones.has(zid))) return false;
      if (showOnlyDerivatives && !isDerivativeNode(n)) return false;
      return (
        n.title?.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q) ||
        n.targetFunction?.toLowerCase().includes(q)
      );
    }).length;`;
const saveFilterReplacement = `    const matchesCount = map.nodes.filter(n => nodeMatchesQuery(n, q, hiddenZones, showOnlyDerivatives)).length;`;
code = code.replace(targetSaveFilter, saveFilterReplacement);

// Now replace in visibleNodeIds
const targetVisibleFilter = `    for (const n of map.nodes) {
      if (n.zoneIds.every(zid => hiddenZones.has(zid))) continue;
      if (showOnlyDerivatives && !isDerivativeNode(n)) continue;
      if (q) {
        const titleMatch = n.title?.toLowerCase().includes(q);
        const descMatch = n.description?.toLowerCase().includes(q);
        const tfMatch = n.targetFunction?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !tfMatch) continue;
      }
      ids.add(n.id);
    }`;
const visibleFilterReplacement = `    for (const n of map.nodes) {
      if (nodeMatchesQuery(n, q, hiddenZones, showOnlyDerivatives)) {
        ids.add(n.id);
      }
    }`;
code = code.replace(targetVisibleFilter, visibleFilterReplacement);

fs.writeFileSync(path, code);
console.log("Map3D filtering patched");
