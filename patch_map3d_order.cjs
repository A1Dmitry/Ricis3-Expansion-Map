const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf8');

const target = `  const searchMatchCount = useMemo(() => {
    if (!searchQuery.trim()) return map.nodes.length;
    return visibleNodeIds.size;
  }, [map.nodes.length, searchQuery, visibleNodeIds]);`;

const replacement = `  const searchMatchCount = useMemo(() => {
    if (!searchQuery.trim()) return map.nodes.length;
    const q = searchQuery.toLowerCase().trim();
    return map.nodes.filter(n => nodeMatchesQuery(n, q, hiddenZones, showOnlyDerivatives)).length;
  }, [map.nodes, searchQuery, hiddenZones, showOnlyDerivatives]);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log("Order fixed");
