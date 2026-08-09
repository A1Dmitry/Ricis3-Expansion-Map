const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

// Remove OrbitSpheres component
const spheresRegex = /function OrbitSpheres[\s\S]*?return <group>\{spheres\}<\/group>;\n\}/;
code = code.replace(spheresRegex, '');

// Remove <OrbitSpheres ... /> usage
code = code.replace(/<OrbitSpheres maxDepth=\{maxFractalDepth\} \/>/g, '');

fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('Removed OrbitSpheres');
