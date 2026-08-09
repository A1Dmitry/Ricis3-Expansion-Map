const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

if (!code.includes('let hoveredNodePos: THREE.Vector3 | null = null;')) {
  code = code.replace(
    'function getZoneColor',
    'let hoveredNodePos: THREE.Vector3 | null = null;\n\nfunction getZoneColor'
  );
}

// update OrbitControls
code = code.replace('controls.maxDistance = 160;', 'controls.maxDistance = 1000;');

const wheelLogic = `
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0 && hoveredNodePos) {
        // Zooming in towards a hovered node
        const target = controls.target;
        const factor = Math.min(0.5, Math.abs(e.deltaY) * 0.002);
        target.lerp(hoveredNodePos, factor);
      } else if (e.deltaY > 0 && hoveredNodePos) {
        // Optional: when zooming out while hovered, shift target slightly?
        // Actually, prompt just says "зоом инкрементируется по вектору от камеры к обьекту"
      }
    };
    gl.domElement.addEventListener('wheel', handleWheel, { passive: true });
`;

if (!code.includes('handleWheel')) {
  code = code.replace(
    'controlsRef.current = controls;',
    'controlsRef.current = controls;\n' + wheelLogic
  );
  code = code.replace(
    'controls.dispose();',
    "gl.domElement.removeEventListener('wheel', handleWheel);\n      controls.dispose();"
  );
}

// Add pointer events to <group> for nodes
if (!code.includes('onPointerOver={e => {')) {
  code = code.replace(
    '<group key={node.id}>',
    `<group key={node.id} 
                  onPointerOver={e => {
                    e.stopPropagation();
                    hoveredNodePos = new THREE.Vector3(pos[0], pos[1], pos[2]);
                  }}
                  onPointerOut={e => {
                    hoveredNodePos = null;
                  }}
                >`
  );
}

fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('Patched Map3D.tsx for zoom towards cursor');
