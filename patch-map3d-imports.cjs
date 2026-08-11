const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf8');

code = code.replace(
  "import { layoutZones, layoutNodes, zoneVisualRadius, nodeVisualRadius } from '../model/physics';",
  "import { layoutZones, layoutNodes, zoneVisualRadius, nodeVisualRadius, type PhysicsParams, DEFAULT_PHYSICS_PARAMS } from '../model/physics';"
);

code = code.replace(
  "import { EditNodeModal } from './EditNodeModal';",
  "import { EditNodeModal } from './EditNodeModal';\nimport { PhysicsControlPanel } from './PhysicsControlPanel';"
);

// find Map3D component
const map3dMatch = code.match(/export function Map3D\(\{ map, onUpdate, onExpand \}: Map3DProps\) \{/);
if (map3dMatch) {
  code = code.replace(
    /export function Map3D\(\{ map, onUpdate, onExpand \}: Map3DProps\) \{/,
    `export function Map3D({ map, onUpdate, onExpand }: Map3DProps) {\n  const [physicsParams, setPhysicsParams] = useState<PhysicsParams>(DEFAULT_PHYSICS_PARAMS);`
  );
}

// update layoutZones
code = code.replace(
  /const zonePositions = useMemo\(\n\s*\(\) => layoutZones\(map.zones, map.nodes\),\n\s*\[map.zones, map.nodes\]\n\s*\);/,
  `const zonePositions = useMemo(\n    () => layoutZones(map.zones, map.nodes, physicsParams),\n    [map.zones, map.nodes, physicsParams]\n  );`
);

// update layoutNodes
code = code.replace(
  /const nodePositions = useMemo\(\n\s*\(\) => layoutNodes\(map, zonePositions\),\n\s*\[map.nodes, map.edges, zonePositions\]\n\s*\);/,
  `const nodePositions = useMemo(\n    () => layoutNodes(map, zonePositions, physicsParams),\n    [map.nodes, map.edges, zonePositions, physicsParams]\n  );`
);

// add PhysicsControlPanel
code = code.replace(
  /<\/Canvas>\s*<AuditPanel/m,
  `</Canvas>\n\n      <PhysicsControlPanel params={physicsParams} onChange={setPhysicsParams} />\n\n      <AuditPanel`
);

fs.writeFileSync('src/ui/Map3D.tsx', code);
