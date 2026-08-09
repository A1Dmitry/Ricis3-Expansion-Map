const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const oldRings = `function OrbitRings({ maxDepth }: { maxDepth: number }) {
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
}`;

const newSpheres = `function OrbitRings({ maxDepth }: { maxDepth: number }) {
  const ORBIT_STEP = 25;
  const spheres = [];
  for (let i = 1; i <= maxDepth; i++) {
    const radius = i * ORBIT_STEP;
    spheres.push(
      <mesh key={i}>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.06} />
      </mesh>
    );
  }
  return <group>{spheres}</group>;
}`;

code = code.replace(oldRings, newSpheres);

// Restore ZoneBubbles
code = code.replace(
  /\/\/\s*return <ZoneBubble key=\{zone\.id\} position=\{pos\} color=\{color\} radius=\{radius\} \/>;\s*return null; \/\/ Hid ZoneBubbles in favor of global orbit layout/,
  `return <ZoneBubble key={zone.id} position={pos} color={color} radius={radius} />;`
);

fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('patched map3d');
