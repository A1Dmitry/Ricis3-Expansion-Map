const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

if (!code.includes("OrbitRings")) {
  const ringComponent = `
function OrbitRings({ maxDepth }: { maxDepth: number }) {
  const ORBIT_STEP = 25;
  const rings = [];
  for (let i = 1; i <= maxDepth; i++) {
    const radius = i * ORBIT_STEP;
    const points = [];
    const segments = 64;
    for (let j = 0; j <= segments; j++) {
      const theta = (j / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, -0.5));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    rings.push(
      <line key={i} geometry={geometry}>
        <lineBasicMaterial color="#ef4444" transparent opacity={0.25} />
      </line>
    );
  }
  return <group>{rings}</group>;
}
`;

  // Insert before Map3D export
  code = code.replace("export function Map3D() {", ringComponent + "\nexport function Map3D() {");
  
  // Find maxDepth
  const maxDepthCode = `
  const maxFractalDepth = useMemo(() => {
    return Math.max(0, ...map.nodes.map(n => n.fractalDepth || 0));
  }, [map.nodes]);
`;

  code = code.replace("const [searchQuery, setSearchQuery] = useState('');", "const [searchQuery, setSearchQuery] = useState('');" + maxDepthCode);
  
  // Add <OrbitRings maxDepth={maxFractalDepth} /> inside Canvas
  code = code.replace("{edgesLines}", "<OrbitRings maxDepth={maxFractalDepth} />\n            {edgesLines}");
  
  fs.writeFileSync('src/ui/Map3D.tsx', code);
  console.log('Rings added');
} else {
  console.log('Already added');
}
