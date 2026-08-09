const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const oldWheel = `    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0 && hoveredNodePos) {
        // Zooming in towards a hovered node
        const target = controls.target;
        const factor = Math.min(0.5, Math.abs(e.deltaY) * 0.002);
        target.lerp(hoveredNodePos, factor);
      } else if (e.deltaY > 0 && hoveredNodePos) {
        // Optional: when zooming out while hovered, shift target slightly?
        // Actually, prompt just says "зоом инкрементируется по вектору от камеры к обьекту"
      }
    };`;

const newWheel = `    const handleWheel = (e: WheelEvent) => {
      // Zoom amount factor (e.deltaY is typically 100 per tick for a standard mouse wheel)
      const factor = Math.min(0.8, Math.abs(e.deltaY) * 0.003);
      
      if (e.deltaY < 0 && hoveredNodePos) {
        // Zoom in: Pan camera towards hovered node
        const panVec = hoveredNodePos.clone().sub(controls.target).multiplyScalar(factor);
        controls.target.add(panVec);
        camera.position.add(panVec);
      } else if (e.deltaY > 0) {
        // Zoom out: Pan camera back towards the center of the universe (0,0,0)
        const center = new THREE.Vector3(0, 0, 0);
        const panVec = center.sub(controls.target).multiplyScalar(factor);
        controls.target.add(panVec);
        camera.position.add(panVec);
      }
    };`;

code = code.replace(oldWheel, newWheel);
fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('Patched handleWheel for true pan');
