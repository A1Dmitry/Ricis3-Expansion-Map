const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

code = code.replace(/function OrbitRings/g, 'function OrbitSpheres');
code = code.replace(/<OrbitRings/g, '<OrbitSpheres');

fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('patched Map3D.tsx OrbitSpheres');
