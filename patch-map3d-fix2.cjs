const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf8');

code = code.replace(
  /export const Map3D: React.FC = \(\) => \{/,
  `export const Map3D: React.FC = () => {\n  const [physicsParams, setPhysicsParams] = React.useState<PhysicsParams>(DEFAULT_PHYSICS_PARAMS);`
);

// We still need to replace <TelegramBotPanel /> correctly.
// Let's remove any existing PhysicsControlPanel instances just in case.
code = code.replace(/<PhysicsControlPanel params=\{physicsParams\} onChange=\{setPhysicsParams\} \/>\n        <TelegramBotPanel \/>/g, '<TelegramBotPanel />');

code = code.replace(
  /<TelegramBotPanel \/>/,
  `<PhysicsControlPanel params={physicsParams} onChange={setPhysicsParams} />\n        <TelegramBotPanel />`
);

fs.writeFileSync('src/ui/Map3D.tsx', code);
