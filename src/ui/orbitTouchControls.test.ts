import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { configureGraphTouchControls, type GraphTouchControlTarget } from './orbitTouchControls';

describe('graph touch controls', () => {
  it('keeps one-finger rotation and enables two-finger pinch zoom with pan', () => {
    const controls: GraphTouchControlTarget = {
      enablePan: false,
      enableRotate: false,
      enableZoom: false,
      touches: { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.ROTATE },
    };

    configureGraphTouchControls(controls);

    expect(controls.enableZoom).toBe(true);
    expect(controls.enablePan).toBe(true);
    expect(controls.enableRotate).toBe(true);
    expect(controls.touches.ONE).toBe(THREE.TOUCH.ROTATE);
    expect(controls.touches.TWO).toBe(THREE.TOUCH.DOLLY_PAN);
  });
});
