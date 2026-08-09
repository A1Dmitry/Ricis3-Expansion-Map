const fs = require('fs');
const file = 'src/ui/Map3D.tsx';
let code = fs.readFileSync(file, 'utf-8');

if (!code.includes("const [searchQuery, setSearchQuery] = useState('')")) {
  code = code.replace(
    /const \[showOnlyDerivatives, setShowOnlyDerivatives\] = useState\(false\);/,
    "const [showOnlyDerivatives, setShowOnlyDerivatives] = useState(false);\n  const [searchQuery, setSearchQuery] = useState('');"
  );
  
  code = code.replace(
    /const visibleNodeIds = useMemo\(\(\) => \{[\s\S]*?ids\.add\(n\.id\);\n    \}\n    return ids;\n  \}, \[map\.nodes, hiddenZones, showOnlyDerivatives\]\);/,
    `const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    const q = searchQuery.toLowerCase().trim();
    for (const n of map.nodes) {
      if (n.zoneIds.every(zid => hiddenZones.has(zid))) continue;
      if (showOnlyDerivatives && !isDerivativeNode(n)) continue;
      if (q) {
        const titleMatch = n.title?.toLowerCase().includes(q);
        const descMatch = n.description?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch) continue;
      }
      ids.add(n.id);
    }
    return ids;
  }, [map.nodes, hiddenZones, showOnlyDerivatives, searchQuery]);`
  );
  
  // Add input in sidebar. Before <div className="space-y-1"> (zones)
  // Let's find where to place it.
  
  fs.writeFileSync(file, code);
  console.log('Search logic added');
} else {
  console.log('Already added');
}
