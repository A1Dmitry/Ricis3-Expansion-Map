const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const oldWheel2 = `    const handleWheel = (e: WheelEvent) => {
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

const newWheel2 = `    const handleWheel = (e: WheelEvent) => {
      const factor = Math.min(1.0, Math.abs(e.deltaY) * 0.005);
      
      if (e.deltaY < 0 && hoveredNodePos) {
        // Shift target towards hovered node so it centers on screen
        controls.target.lerp(hoveredNodePos, factor);
        
        // Also move camera position slightly in the same direction to keep the relative angle stable
        const panVec = hoveredNodePos.clone().sub(controls.target).multiplyScalar(factor * 0.5);
        camera.position.add(panVec);
      } else if (e.deltaY > 0) {
        // Zoom out: shift orbit target back to center
        controls.target.lerp(new THREE.Vector3(0, 0, 0), factor);
      }
    };`;

code = code.replace(oldWheel2, newWheel2);
fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('Patched handleWheel again with pan adjustments');
