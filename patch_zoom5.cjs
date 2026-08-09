const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const oldWheel3 = `    const handleWheel = (e: WheelEvent) => {
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

const newWheel3 = `    const handleWheel = (e: WheelEvent) => {
      const factor = Math.min(1.0, Math.abs(e.deltaY) * 0.002);
      
      if (e.deltaY < 0 && hoveredNodePos) {
        // Pan the entire camera rig (target and position) towards the hovered node
        const panVec = hoveredNodePos.clone().sub(controls.target).multiplyScalar(factor);
        controls.target.add(panVec);
        camera.position.add(panVec);
      } else if (e.deltaY > 0) {
        // Zoom out: pan the camera rig back towards the origin
        const center = new THREE.Vector3(0, 0, 0);
        const panVec = center.clone().sub(controls.target).multiplyScalar(factor);
        controls.target.add(panVec);
        camera.position.add(panVec);
      }
    };`;

code = code.replace(oldWheel3, newWheel3);
fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('Patched handleWheel with exact panning');
