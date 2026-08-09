const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const searchStr = "return <ZoneBubble key={zone.id} position={pos} color={color} radius={radius} />;";
const replaceStr = `return (
                <group key={zone.id}>
                  <ZoneBubble position={pos} color={color} radius={radius} />
                  <ZoneLabel position={pos} text={zone.name} radius={radius} color={color} />
                </group>
              );`;

if (code.includes(searchStr)) {
  code = code.replace(searchStr, replaceStr);
  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('patched Map3D to add ZoneLabel');
} else {
  console.log('search string not found in Map3D.tsx');
}
