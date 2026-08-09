const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const oldRadii = `  const zoneRadii = useMemo(() => {
    const r: Record<string, number> = {};
    map.zones.forEach(z => {
      r[z.id] = zoneVisualRadius(z, map.nodes);
    });
    return r;
  }, [map.zones, map.nodes]);`;

const newRadii = `  const zoneRadii = useMemo(() => {
    const r: Record<string, number> = {};
    map.zones.forEach(z => {
      const members = map.nodes.filter(n => z.nodeIds.includes(n.id) || n.zoneIds.includes(z.id));
      const zPos = zonePositions[z.id];
      if (zPos && members.length > 0) {
        let maxDist = 0;
        members.forEach(m => {
          const mPos = nodePositions[m.id];
          if (mPos) {
            const dx = mPos[0] - zPos[0];
            const dy = mPos[1] - zPos[1];
            const dz = mPos[2] - zPos[2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            maxDist = Math.max(maxDist, dist + 15);
          }
        });
        r[z.id] = Math.max(zoneVisualRadius(z, map.nodes), maxDist);
      } else {
        r[z.id] = zoneVisualRadius(z, map.nodes);
      }
    });
    return r;
  }, [map.zones, map.nodes, zonePositions, nodePositions]);`;

code = code.replace(oldRadii, newRadii);
fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('zoneRadii patched to enclose nodes');
