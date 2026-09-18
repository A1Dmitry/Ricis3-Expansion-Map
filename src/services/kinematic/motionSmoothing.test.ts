// ============================================================================
// CARTESIAN MOTION SMOOTHER REGRESSION GUARDS
// Proves the S-curve smoother delivers the user-visible smoothness contract:
// C1 continuity (acceleration-limited), exact settle on the anchor, no overshoot,
// graceful mid-flight anchor retargeting and full determinism.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { CartesianMotionSmoother, DEFAULT_MOTION_PROFILE } from './motionSmoothing';

function stepDistance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

describe('CartesianMotionSmoother', () => {
  it('reaches the anchor and settles exactly (continuous, no jump at arrival)', () => {
    const smoother = new CartesianMotionSmoother({ x: 0.5, y: 0.2, z: 1.0 });
    smoother.setAnchor({ x: -0.6, y: 0.4, z: 0.6 });

    const dt = 1 / 60;
    let position = smoother.getPosition();
    for (let i = 0; i < 60 * 6; i++) {
      position = smoother.step(dt);
      if (smoother.isSettled()) break;
    }

    expect(smoother.isSettled()).toBe(true);
    expect(stepDistance(position, { x: -0.6, y: 0.4, z: 0.6 })).toBeLessThanOrEqual(DEFAULT_MOTION_PROFILE.settleEps);
  });

  it('produces a continuous path: every per-step displacement <= maxSpeed * dt * 1.0001', () => {
    const smoother = new CartesianMotionSmoother({ x: 0.2, y: 0.6, z: 1.5 });
    smoother.setAnchor({ x: 0.9, y: -0.5, z: 0.4 });

    const dt = 1 / 60;
    let previous = smoother.getPosition();
    const maxStep = DEFAULT_MOTION_PROFILE.maxSpeed * dt * 1.0001;
    for (let i = 0; i < 60 * 8; i++) {
      const position = smoother.step(dt);
      expect(
        stepDistance(position, previous),
        `discontinuity at step ${i}: jumped ${stepDistance(position, previous).toFixed(4)}m in ${dt}s`
      ).toBeLessThanOrEqual(maxStep);
      previous = position;
    }
  });

  it('never overshoots the anchor along the reach axis', () => {
    const start = { x: 0.5, y: 0.5, z: 1.0 };
    const anchor = { x: -0.3, y: 0.1, z: 0.9 };
    const smoother = new CartesianMotionSmoother(start);
    smoother.setAnchor(anchor);

    const dir = {
      x: anchor.x - start.x,
      y: anchor.y - start.y,
      z: anchor.z - start.z,
    };
    const dirLen = Math.hypot(dir.x, dir.y, dir.z);
    const ux = dir.x / dirLen;
    const uy = dir.y / dirLen;
    const uz = dir.z / dirLen;

    const dt = 1 / 120;
    for (let i = 0; i < 120 * 8; i++) {
      const position = smoother.step(dt);
      const alongAxis = (position.x - start.x) * ux + (position.y - start.y) * uy + (position.z - start.z) * uz;
      expect(alongAxis).toBeLessThanOrEqual(dirLen + 1e-9);
      if (smoother.isSettled()) break;
    }
    expect(smoother.isSettled()).toBe(true);
  });

  it('handles mid-flight anchor changes smoothly (no teleport, converges to new anchor)', () => {
    const smoother = new CartesianMotionSmoother({ x: 0.5, y: 0.2, z: 1.0 });
    smoother.setAnchor({ x: -0.6, y: 0.4, z: 0.6 });
    const dt = 1 / 60;

    // Fly for 0.5s, then retarget (like a planned intercept being revised).
    for (let i = 0; i < 30; i++) smoother.step(dt);
    smoother.setAnchor({ x: 0.1, y: -0.55, z: 1.1 });

    let previous = smoother.getPosition();
    const maxStep = DEFAULT_MOTION_PROFILE.maxSpeed * dt * 1.0001;
    let position = previous;
    for (let i = 0; i < 60 * 6; i++) {
      position = smoother.step(dt);
      expect(stepDistance(position, previous)).toBeLessThanOrEqual(maxStep);
      previous = position;
      if (smoother.isSettled()) break;
    }

    expect(smoother.isSettled()).toBe(true);
    expect(stepDistance(position, { x: 0.1, y: -0.55, z: 1.1 })).toBeLessThan(DEFAULT_MOTION_PROFILE.settleEps);
  });

  it('stays exactly stationary when the anchor equals the current position', () => {
    const start = { x: 0.5, y: 0.2, z: 1.0 };
    const smoother = new CartesianMotionSmoother(start);
    smoother.setAnchor(start);
    for (let i = 0; i < 60; i++) {
      const position = smoother.step(1 / 60);
      expect(stepDistance(position, start)).toBeLessThan(1e-12);
      expect(smoother.isSettled()).toBe(true);
    }
  });

  it('is deterministic: two identical runs produce identical trajectories', () => {
    const run = () => {
      const smoother = new CartesianMotionSmoother({ x: 0.5, y: 0.2, z: 1.0 });
      smoother.setAnchor({ x: -0.4, y: -0.4, z: 0.55 });
      const path: Array<readonly [number, number, number]> = [];
      for (let i = 0; i < 240; i++) {
        const position = smoother.step(1 / 60);
        path.push([position.x, position.y, position.z]);
      }
      return path;
    };
    const runA = run();
    const runB = run();
    expect(runA).toEqual(runB);
  });
});
