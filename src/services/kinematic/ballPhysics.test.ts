// ============================================================================
// BALL PHYSICS WORLD REGRESSION GUARDS
// Proves real gravity / bounce behavior: analytic free fall, restitution-scaled
// bounce apex (~e^2 * h), wall confinement, floor rest and determinism.
// The user's requirement: a dropped ball must FALL AND BOUNCE — scripted teleport
// or linear interpolation motion is a bug, not physics.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { BallPhysicsWorld } from './ballPhysics';

const TEST_GRAVITY = 3.2;
const TEST_RESTITUTION = 0.5;

describe('BallPhysicsWorld', () => {
  it('free fall matches analytic parabola z = z0 - 1/2 g t^2 (within semi-implicit Euler tolerance)', () => {
    const physics = new BallPhysicsWorld({ gravity: TEST_GRAVITY, airDrag: 0 });
    let body = physics.createBody({ x: 0, y: 0, z: 2.0 }, 0.06);
    const dt = 1 / 120;

    let t = 0;
    while (t < 0.5) {
      body = physics.integrate(body, dt, { floorZ: -100 });
      t += dt;
    }

    // Semi-implicit Euler is first-order accurate; tolerate a small drift.
    const analyticZ = 2.0 - 0.5 * TEST_GRAVITY * t * t;
    expect(body.position.z).toBeGreaterThan(0);
    expect(body.position.z).toBeLessThan(2.0);
    expect(Math.abs(body.position.z - analyticZ)).toBeLessThan(0.05);
  });

  it('bounces on the floor with a restitution-scaled apex, then comes to rest', () => {
    const physics = new BallPhysicsWorld({ gravity: TEST_GRAVITY, airDrag: 0, restitution: TEST_RESTITUTION });
    const radius = 0.06;
    let body = physics.createBody({ x: 0, y: 0, z: 1.0 }, radius);
    const dt = 1 / 120;

    const apexes: number[] = [];
    let previousVz = 0;
    let apexCandidate = 0;
    let hasBouncedOnce = false;
    for (let i = 0; i < 120 * 25 && !body.resting; i++) {
      body = physics.integrate(body, dt, { floorZ: 0 });
      // Bounce detection: vertical velocity flips from downward to upward at contact.
      if (previousVz <= 0 && body.velocity.z > 0 && !hasBouncedOnce) {
        hasBouncedOnce = true;
      }
      if (hasBouncedOnce) {
        if (previousVz > 0 && body.velocity.z <= 0) {
          apexes.push(apexCandidate);
          apexCandidate = 0;
        }
        apexCandidate = Math.max(apexCandidate, body.position.z);
      }
      previousVz = body.velocity.z;
    }

    // At least one distinct rebound was observed (fall -> bounce -> rise).
    expect(apexes.length).toBeGreaterThanOrEqual(1);

    // First rebound apex is a clearly visible bounce and scales as ~e^2 * h above
    // the contact surface (drop 0.94m, e^2 = 0.25 -> ~0.235m; sampled, so allow slack).
    const firstApexAboveFloor = apexes[0] - radius;
    expect(firstApexAboveFloor).toBeGreaterThan(0.1);
    expect(firstApexAboveFloor).toBeLessThan(0.35);

    // The ball eventually comes to rest exactly on the floor with zero velocity.
    expect(body.resting).toBe(true);
    expect(body.position.z).toBeCloseTo(radius, 6);
    expect(Math.hypot(body.velocity.x, body.velocity.y, body.velocity.z)).toBeLessThan(1e-9);
  });

  it('stays confined inside box wall bounds (wall bounce, then rest inside)', () => {
    const physics = new BallPhysicsWorld({ gravity: TEST_GRAVITY, restitution: TEST_RESTITUTION });
    const radius = 0.06;
    let body = physics.createBody(
      { x: -0.6, y: -0.5, z: 1.0 },
      radius,
      { x: 0.8, y: -0.9, z: 0 },
    );
    // Inner bounds, already radius-inset (per BallPhysicsWorld contract).
    const box = {
      minX: -0.825,
      maxX: -0.375,
      minY: -0.825,
      maxY: -0.375,
      floorZ: 0.15,
    };

    const dt = 1 / 120;
    for (let i = 0; i < 120 * 30 && !body.resting; i++) {
      body = physics.integrate(body, dt, { boxBounds: box });
      expect(body.position.x).toBeGreaterThanOrEqual(box.minX - 1e-12);
      expect(body.position.x).toBeLessThanOrEqual(box.maxX + 1e-12);
      expect(body.position.y).toBeGreaterThanOrEqual(box.minY - 1e-12);
      expect(body.position.y).toBeLessThanOrEqual(box.maxY + 1e-12);
      expect(body.position.z).toBeGreaterThanOrEqual(box.floorZ + radius - 1e-12);
      expect(Number.isFinite(body.position.x + body.position.y + body.position.z)).toBe(true);
      expect(Number.isFinite(body.velocity.x + body.velocity.y + body.velocity.z)).toBe(true);
    }

    expect(body.resting).toBe(true);
    expect(body.position.z).toBeCloseTo(box.floorZ + radius, 6);
  });

  it('predictTrajectory returns a bounce-inclusive sample series', () => {
    const physics = new BallPhysicsWorld();
    const falling = physics.createBody({ x: 0.3, y: 0.0, z: 1.8 }, 0.06);
    const samples = physics.predictTrajectory(falling, 2.0, 1 / 30, { floorZ: -100 });

    expect(samples.length).toBeGreaterThan(10);
    // Monotonic fall when the floor is far away.
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].position.z).toBeLessThanOrEqual(samples[i - 1].position.z + 1e-12);
    }

    // With a real floor: samples include a rising segment (bounce) when dropped high.
    const bouncing = physics.predictTrajectory(
      physics.createBody({ x: 0.3, y: 0.0, z: 2.2 }, 0.06),
      3.2,
      1 / 60,
      { floorZ: 0 },
    );
    const sawRiseAfterFall = bouncing.some(
      (sample, index) =>
        index > 4 &&
        sample.position.z > bouncing[index - 1].position.z + 1e-9 &&
        bouncing[index - 2].position.z > bouncing[index - 1].position.z,
    );
    expect(sawRiseAfterFall).toBe(true);

    // The source body must not be mutated by prediction.
    expect(falling.position).toEqual({ x: 0.3, y: 0.0, z: 1.8 });
  });

  it('is deterministic: identical runs produce identical trajectories', () => {
    const run = () => {
      const physics = new BallPhysicsWorld();
      let body = physics.createBody({ x: 0.42, y: 0.2, z: 1.75 }, 0.06, { x: 0.1, y: -0.05, z: 0 });
      const path: Array<readonly [number, number, number]> = [];
      for (let i = 0; i < 360; i++) {
        body = physics.integrate(body, 1 / 120, { floorZ: 0 });
        path.push([body.position.x, body.position.y, body.position.z]);
      }
      return path;
    };
    expect(run()).toEqual(run());
  });
});
