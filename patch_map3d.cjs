const fs = require('fs');

const path = 'src/ui/Map3D.tsx';
let code = fs.readFileSync(path, 'utf8');

// The block to replace: searchMatchCount is just visibleNodeIds.size
const searchMatchStart = `  const searchMatchCount = useMemo(() => {
    if (!searchQuery.trim()) return map.nodes.length;
    const q = searchQuery.toLowerCase().trim();
    return map.nodes.filter(n => {
      if (n.zoneIds.every(zid => hiddenZones.has(zid))) return false;
      if (showOnlyDerivatives && !isDerivativeNode(n)) return false;
      return (
        n.title?.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q) ||
        n.targetFunction?.toLowerCase().includes(q)
      );
    }).length;
  }, [map.nodes, searchQuery, hiddenZones, showOnlyDerivatives]);`;

const searchMatchReplacement = `  const searchMatchCount = useMemo(() => {
    if (!searchQuery.trim()) return map.nodes.length;
    return visibleNodeIds.size;
  }, [map.nodes.length, searchQuery, visibleNodeIds]);`;

if (code.includes(searchMatchStart)) {
  code = code.replace(searchMatchStart, searchMatchReplacement);
  fs.writeFileSync(path, code);
  console.log("Map3D patched");
} else {
  console.log("Could not find searchMatchCount block in Map3D");
}
