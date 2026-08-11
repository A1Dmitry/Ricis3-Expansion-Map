const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf8');

// Fix Map3D declaration
const map3dMatch = code.match(/export function Map3D\(\{ map, onUpdate, onExpand \}: Map3DProps\) \{/);
if (map3dMatch) {
  code = code.replace(
    /export function Map3D\(\{ map, onUpdate, onExpand \}: Map3DProps\) \{/,
    `export function Map3D({ map, onUpdate, onExpand }: Map3DProps) {\n  const [physicsParams, setPhysicsParams] = React.useState<PhysicsParams>(DEFAULT_PHYSICS_PARAMS);`
  );
} else {
  console.log("Could not find Map3D declaration");
}

// Add PhysicsControlPanel rendering
// Let's place it right before <TelegramBotPanel />
code = code.replace(
  /<TelegramBotPanel \/>/g,
  `<PhysicsControlPanel params={physicsParams} onChange={setPhysicsParams} />\n        <TelegramBotPanel />`
);

fs.writeFileSync('src/ui/Map3D.tsx', code);
