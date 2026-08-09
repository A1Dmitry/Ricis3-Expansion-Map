const fs = require('fs');
let code = fs.readFileSync('src/model/persistence.ts', 'utf-8');

const targetStr = `export function sanitizeMap(map: MapState): MapState {
  const validZones = new Set(map.zones.map(z => z.id));
  
  const nodes = map.nodes.map(n => {
    let zids = (n.zoneIds || []).filter(zid => validZones.has(zid));
    if (zids.length === 0) {
      const parent = map.nodes.find(p => p.id === (n.dependencyIds && n.dependencyIds[0]));
      if (parent && parent.zoneIds && parent.zoneIds.some(zid => validZones.has(zid))) {
        zids = parent.zoneIds.filter(zid => validZones.has(zid));
      } else {
        zids = ['math'];
      }
    }
    return { ...n, zoneIds: zids };
  });

  const zones = map.zones.map(z => {
    const members = nodes.filter(n => n.zoneIds.includes(z.id)).map(n => n.id);
    return { ...z, nodeIds: Array.from(new Set([...(z.nodeIds || []), ...members])) };
  });

  return { ...map, nodes, zones };
}`;

const newStr = `export function sanitizeMap(map: MapState): MapState {
  const validZones = new Map(map.zones.map(z => [z.id, z]));
  
  const missingZoneIds = new Set<string>();
  map.nodes.forEach(n => {
    if (n.zoneIds) {
      n.zoneIds.forEach(zid => {
        if (!validZones.has(zid)) {
          missingZoneIds.add(zid);
        }
      });
    }
  });

  const newZones = [...map.zones];
  missingZoneIds.forEach(zid => {
    // Generate a determinisic-ish color from the ID
    let hash = 0;
    for (let i = 0; i < zid.length; i++) {
      hash = zid.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = '#' + (hash & 0x00FFFFFF).toString(16).padStart(6, '0');
    
    const newZone: ScienceZone = {
      id: zid,
      name: zid.charAt(0).toUpperCase() + zid.slice(1).replace(/_/g, ' '),
      description: 'Автоматически созданная область наук',
      baseColor: color,
      nodeIds: [],
      economicProfile: {
        costUnresolved: 10000,
        costToSolve: 1000,
        marketGain: 50000,
        riskLoss: 20000,
      }
    };
    newZones.push(newZone);
    validZones.set(zid, newZone);
  });
  
  const nodes = map.nodes.map(n => {
    let zids = n.zoneIds || [];
    if (zids.length === 0) {
      const parent = map.nodes.find(p => p.id === (n.dependencyIds && n.dependencyIds[0]));
      if (parent && parent.zoneIds && parent.zoneIds.length > 0) {
        zids = [...parent.zoneIds];
      } else {
        zids = ['math'];
      }
    }
    return { ...n, zoneIds: zids };
  });

  const zones = newZones.map(z => {
    const members = nodes.filter(n => n.zoneIds.includes(z.id)).map(n => n.id);
    return { ...z, nodeIds: Array.from(new Set([...(z.nodeIds || []), ...members])) };
  });

  return { ...map, nodes, zones };
}`;

if (code.includes("export function sanitizeMap")) {
  const start = code.indexOf("export function sanitizeMap");
  const end = code.indexOf("}", code.indexOf("return { ...map, nodes, zones };")) + 1;
  const oldFunc = code.substring(start, end);
  code = code.replace(oldFunc, newStr);
  fs.writeFileSync('src/model/persistence.ts', code);
  console.log('patched sanitizeMap for automatic zone creation');
} else {
  console.log('sanitizeMap not found');
}
