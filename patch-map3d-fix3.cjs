const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf8');

code = code.replace(
  /\{showTelegramBot && \(/,
  `<PhysicsControlPanel params={physicsParams} onChange={setPhysicsParams} />\n      {showTelegramBot && (`
);

fs.writeFileSync('src/ui/Map3D.tsx', code);
