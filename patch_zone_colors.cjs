const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const getColorHash = `
function getZoneColor(id: string) {
  if (zoneColors[id]) return zoneColors[id];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}
`;

if (!code.includes('getZoneColor')) {
  code = code.replace(
    `const zoneColors: Record<string, string> = {`,
    getColorHash + `\nconst zoneColors: Record<string, string> = {`
  );

  code = code.replace(
    `zoneColors[zone.id] || '#fff'`,
    `getZoneColor(zone.id)`
  );

  code = code.replace(
    `zoneColors[node.zoneIds[0]] || '#ffffff'`,
    `getZoneColor(node.zoneIds[0] || 'math')`
  );

  code = code.replace(
    `zoneColors[node.zoneIds[0]]`,
    `getZoneColor(node.zoneIds[0] || 'math')`
  );
  
  code = code.replace(
    `zoneColors[zone.id] || '#ffffff'`,
    `getZoneColor(zone.id)`
  );

  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('Patched Map3D.tsx to use getZoneColor');
}
