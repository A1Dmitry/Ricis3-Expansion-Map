const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

// 1. Add hiddenZones state
const stateHookPos = code.indexOf('const [isNodeExpanded, setIsNodeExpanded] = useState(false);');
code = code.slice(0, stateHookPos) + 'const [hiddenZones, setHiddenZones] = useState<Set<string>>(new Set());\n  const [isMenuOpen, setIsMenuOpen] = useState(false);\n  ' + code.slice(stateHookPos);

// 2. Hide zones and nodes in 3D
code = code.replace(
  '{map.zones.map(zone => {',
  '{map.zones.filter(z => !hiddenZones.has(z.id)).map(zone => {'
);

code = code.replace(
  '{map.nodes.map(node => {',
  '{map.nodes.filter(n => !n.zoneIds.every(zid => hiddenZones.has(zid))).map(node => {'
);

// Hide from edges
// Wait, edges should also be hidden if their nodes are hidden.
// Let's filter edges.
const edgesLinesRegex = /map\.edges\.map\(edge => \{/;
code = code.replace(edgesLinesRegex, `map.edges.filter(e => {
      const fromNode = map.nodes.find(n => n.id === e.fromId);
      const toNode = map.nodes.find(n => n.id === e.toId);
      if (!fromNode || !toNode) return false;
      const fromHidden = fromNode.zoneIds.every(zid => hiddenZones.has(zid));
      const toHidden = toNode.zoneIds.every(zid => hiddenZones.has(zid));
      return !fromHidden && !toHidden;
    }).map(edge => {`);


// Update availableNodes
const availableNodesRegex = /map\.nodes\.filter\(\s*n => n\.state !== 'resolved' && isNodeAvailable\(n, map\)\s*\)/;
code = code.replace(availableNodesRegex, `map.nodes.filter(
        n => n.state !== 'resolved' && isNodeAvailable(n, map) && !n.zoneIds.every(zid => hiddenZones.has(zid))
      )`);

// Add hiddenZones to dependency arrays
code = code.replace('[map.nodes, map.edges]', '[map.nodes, map.edges, hiddenZones]');
code = code.replace('[map.edges, nodePositions, pathEdgeKeys, nodeStateById]', '[map.edges, nodePositions, pathEdgeKeys, nodeStateById, hiddenZones]');

// 3. Update the left sidebar Zone checkboxes
const oldZoneSidebar = `{map.zones.map(zone => (
                <div key={zone.id} className="flex items-center justify-between p-2 bg-neutral-900/40 border border-neutral-800/50 rounded">
                  <span className="text-xs text-gray-300">{zone.name}</span>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getZoneColor(zone.id) }} />
                </div>
              ))}`;

const newZoneSidebar = `{map.zones.map(zone => {
                const isHidden = hiddenZones.has(zone.id);
                return (
                  <div key={zone.id} className="flex items-center justify-between p-2 bg-neutral-900/40 border border-neutral-800/50 rounded">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input 
                        type="checkbox" 
                        checked={!isHidden} 
                        onChange={() => {
                          setHiddenZones(prev => {
                            const next = new Set(prev);
                            if (next.has(zone.id)) next.delete(zone.id);
                            else next.add(zone.id);
                            return next;
                          });
                        }}
                        className="accent-cyan-500 rounded border-cyan-800"
                      />
                      <span className={\`text-[11px] \${isHidden ? 'text-gray-600 line-through' : 'text-gray-300'}\`}>{zone.name}</span>
                    </label>
                    <span className={\`w-2 h-2 rounded-full \${isHidden ? 'opacity-30' : 'opacity-100'}\`} style={{ backgroundColor: getZoneColor(zone.id) }} />
                  </div>
                );
              })}`;
code = code.replace(oldZoneSidebar, newZoneSidebar);

fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('Patched hidden zones');
