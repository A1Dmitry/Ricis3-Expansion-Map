import * as THREE from 'three';

export interface GraphTouchControlTarget {
  enablePan: boolean;
  enableRotate: boolean;
  enableZoom: boolean;
  touches: {
    ONE?: THREE.TOUCH | null;
    TWO?: THREE.TOUCH | null;
  };
}

/**
 * Keeps the mobile graph gesture contract explicit and stable:
 * one finger rotates/selects the graph; two fingers pinch to zoom while
 * preserving pan, rather than delegating the gesture to browser page zoom.
 */
export function configureGraphTouchControls(controls: GraphTouchControlTarget): void {
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.enableRotate = true;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
}
