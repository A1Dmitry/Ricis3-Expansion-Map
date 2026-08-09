const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const oldWheel = `    const handleWheel = (e: WheelEvent) => {
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

const newWheel = `    const handleWheel = (e: WheelEvent) => {
      const factor = Math.min(0.8, Math.abs(e.deltaY) * 0.005);
      
      if (e.deltaY < 0 && hoveredNodePos) {
        // Zoom in: shift the orbit target towards the hovered node
        // so that the native OrbitControls zoom (which zooms towards target) goes there
        controls.target.lerp(hoveredNodePos, factor);
      } else if (e.deltaY > 0) {
        // Zoom out: shift orbit target back to center (0,0,0)
        // Ensure maxDistance is respected (already set to 5000, maybe we should stop zooming out when everything is visible)
        controls.target.lerp(new THREE.Vector3(0, 0, 0), factor);
      }
    };`;

code = code.replace(oldWheel, newWheel);
fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('Patched handleWheel again');
