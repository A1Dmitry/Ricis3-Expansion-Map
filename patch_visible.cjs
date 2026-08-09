const fs = require('fs');
const file = 'src/ui/Map3D.tsx';
let code = fs.readFileSync(file, 'utf-8');

const oldCode = `  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const n of map.nodes) {
      if (n.zoneIds.every(zid => hiddenZones.has(zid))) continue;
      if (showOnlyDerivatives && !isDerivativeNode(n)) continue;
      ids.add(n.id);
    }
    // When filtering derivatives, also keep direct anchor parents so edges make sense
    if (showOnlyDerivatives) {
      for (const n of map.nodes) {
        if (!isDerivativeNode(n)) continue;
        for (const dep of n.dependencyIds || []) ids.add(dep);
      }
    }
    return ids;
  }, [map.nodes, hiddenZones, showOnlyDerivatives]);`;

const newCode = `  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    const q = searchQuery.toLowerCase().trim();
    for (const n of map.nodes) {
      if (n.zoneIds.every(zid => hiddenZones.has(zid))) continue;
      if (showOnlyDerivatives && !isDerivativeNode(n)) continue;
      if (q) {
        const titleMatch = n.title?.toLowerCase().includes(q);
        const descMatch = n.description?.toLowerCase().includes(q);
        const tfMatch = n.targetFunction?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !tfMatch) continue;
      }
      ids.add(n.id);
    }
    // When filtering derivatives, also keep direct anchor parents so edges make sense
    if (showOnlyDerivatives) {
      for (const n of map.nodes) {
        if (!isDerivativeNode(n)) continue;
        for (const dep of n.dependencyIds || []) ids.add(dep);
      }
    }
    return ids;
  }, [map.nodes, hiddenZones, showOnlyDerivatives, searchQuery]);`;

code = code.replace(oldCode, newCode);
fs.writeFileSync(file, code);
console.log('visible patched');
