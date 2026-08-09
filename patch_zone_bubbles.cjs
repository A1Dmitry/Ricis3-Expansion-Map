const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

// Hide ZoneBubbles, just render the text maybe? Or completely hide them because the user just wants the orbit layout.
// Actually, I can just skip rendering ZoneBubble and render the zone name using HTML overlays.
// Or I can keep ZoneBubble but fix the radius so it's small, and place it at the edge.

code = code.replace(
  /return <ZoneBubble key=\{zone\.id\} position=\{pos\} color=\{color\} radius=\{radius\} \/>;/,
  `// return <ZoneBubble key={zone.id} position={pos} color={color} radius={radius} />;
              return null; // Hid ZoneBubbles in favor of global orbit layout`
);

fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('ZoneBubbles hidden');
