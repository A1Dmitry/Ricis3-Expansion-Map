// ============================================================================
// BALL PHYSICS WORLD REGRESSION GUARDS
// ----------------------------------------------------------------------------
// Proves the integrator applies LAWS rather than tuned numbers:
//   - free fall matches the analytic parabola z = z0 - 1/2 g t^2,
//   - the equivalence principle: in vacuum mass does not change the fall,
//   - mass DOES change aerodynamic deceleration (that is what inertia is for),
//   - the rebound apex follows e^2 * h, not a hardcoded fraction,
//   - wall confinement, floor rest and determinism.
// Gravity and air density come from the ENVIRONMENT; mass, radius, restitution
// and drag come from the MATERIAL. Nothing here re-declares those numbers.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { BallPhysicsWorld } from './ballPhysics';
import { EARTH_SURFACE, MOON_SURFACE, type IPhysicalEnvironment } from './physicalEnvironment';
import { TENNIS_BALL, type IProjectileMaterial } from './projectileMaterial';

/** Vacuum on a chosen body: isolates gravity from aerodynamics. */
function vacuumOn(environment: IPhysicalEnvironment): IPhysicalEnvironment {
  return { ...environment, airDensityKgpsm3: 0 };
}

/** A heavier body of identical size and surface — the inertia contrast case. */
const LEAD_CORED_BALL: IProjectileMaterial = { ...TENNIS_BALL, massKg: TENNIS_BALL.massKg * 10 };

const DT = 1 / 120;

describe('BallPhysicsWorld — free fall is the environment’s gravity', () => {
  it('matches the analytic parabola z = z0 - 1/2 g t^2 in vacuum', () => {
    const physics = new BallPhysicsWorld({ environment: vacuumOn(EARTH_SURFACE) });
    let body = physics.createBody({ x: 0, y: 0, z: 2.0 });

    let t = 0;
    while (t < 0.4) {
      body = physics.integrate(body, DT, { floorZ: -100 });
      t += DT;
    }

    const analyticZ = 2.0 - 0.5 * physics.gravity * t * t;
    // Semi-implicit Euler is first-order accurate; the residual is O(g dt t).
    expect(Math.abs(body.position.z - analyticZ)).toBeLessThan(0.5 * physics.gravity * DT * t);
    expect(body.position.z).toBeLessThan(2.0);
  });

  it('applies Earth gravity by default — no invented 3.2 anywhere', () => {
    expect(new BallPhysicsWorld().gravity).toBe(EARTH_SURFACE.gravityMps2);
    expect(new BallPhysicsWorld().gravity).toBeCloseTo(9.80665, 6);
  });

  it('falls slower on the Moon, exactly in the ratio of the two gravities', () => {
    const fall = (environment: IPhysicalEnvironment) => {
      const physics = new BallPhysicsWorld({ environment: vacuumOn(environment) });
      let body = physics.createBody({ x: 0, y: 0, z: 2.0 });
      for (let i = 0; i < 60; i++) body = physics.integrate(body, DT, { floorZ: -100 });
      return 2.0 - body.position.z;
    };

    const earthDrop = fall(EARTH_SURFACE);
    const moonDrop = fall(MOON_SURFACE);
    const ratio = earthDrop / moonDrop;

    expect(ratio).toBeCloseTo(EARTH_SURFACE.gravityMps2 / MOON_SURFACE.gravityMps2, 4);
  });
});

describe('BallPhysicsWorld — mass is inertia, not decoration', () => {
  it('equivalence principle: in vacuum a 10x heavier ball falls identically', () => {
    const drop = (material: IProjectileMaterial) => {
      const physics = new BallPhysicsWorld({
        environment: vacuumOn(EARTH_SURFACE),
        material,
      });
      let body = physics.createBody({ x: 0, y: 0, z: 2.0 });
      for (let i = 0; i < 60; i++) body = physics.integrate(body, DT, { floorZ: -100 });
      return body.position.z;
    };

    expect(drop(LEAD_CORED_BALL)).toBe(drop(TENNIS_BALL));
  });

  it('in air the heavier ball is decelerated LESS — drag divides by mass', () => {
    const drop = (material: IProjectileMaterial) => {
      const physics = new BallPhysicsWorld({ environment: EARTH_SURFACE, material });
      let body = physics.createBody({ x: 0, y: 0, z: 40.0 }, { x: 8, y: 0, z: 0 });
      for (let i = 0; i < 120; i++) body = physics.integrate(body, DT, { floorZ: -100 });
      return body.position.x;
    };

    // Same size, same shape, ten times the inertia: the light ball loses more
    // horizontal speed to drag, so the heavy one travels further.
    expect(drop(LEAD_CORED_BALL)).toBeGreaterThan(drop(TENNIS_BALL));
  });

  it('carries the material’s mass on every body it creates', () => {
    const physics = new BallPhysicsWorld();
    expect(physics.createBody({ x: 0, y: 0, z: 1 }).massKg).toBe(TENNIS_BALL.massKg);
    expect(physics.createBody({ x: 0, y: 0, z: 1 }).radius).toBe(TENNIS_BALL.radiusM);
  });
});

describe('BallPhysicsWorld — bounce obeys the restitution law', () => {
  it('rebound apex is e^2 * drop height, and converges to that law as dt -> 0', () => {
    // Semi-implicit Euler samples the apex, so a coarse step UNDER-reads it by
    // O(g dt^2). The law is therefore proven by convergence, not by a fitted
    // tolerance: the same e must land on e^2 * h ever more closely as dt shrinks.
    const dropHeight = 1.0;

    const apexRatio = (restitution: number, dt: number) => {
      const physics = new BallPhysicsWorld({
        environment: vacuumOn(EARTH_SURFACE),
        material: { ...TENNIS_BALL, restitution },
      });
      let body = physics.createBody({ x: 0, y: 0, z: dropHeight + physics.material.radiusM });

      let contactZ = 0;
      let apex = 0;
      let bounced = false;
      let previousVz = 0;
      for (let i = 0; i < Math.ceil(4 / dt); i++) {
        body = physics.integrate(body, dt, { floorZ: 0 });
        if (!bounced && previousVz < 0 && body.velocity.z > 0) {
          bounced = true;
          contactZ = body.position.z;
          apex = body.position.z;
        } else if (bounced) {
          if (body.velocity.z <= 0) break;
          apex = Math.max(apex, body.position.z);
        }
        previousVz = body.velocity.z;
      }
      expect(bounced).toBe(true);
      return (apex - contactZ) / dropHeight;
    };

    for (const restitution of [0.4, 0.6, TENNIS_BALL.restitution]) {
      const law = restitution * restitution;
      const coarse = apexRatio(restitution, 1 / 120);
      const fine = apexRatio(restitution, 1 / 1920);

      // Convergence: the finer step is strictly closer to the analytic law.
      expect(Math.abs(fine - law)).toBeLessThan(Math.abs(coarse - law));
      // And at a step fine enough that sampling is negligible, the law holds.
      expect(Math.abs(fine - law) / law).toBeLessThan(0.005);
    }
  });

  it('comes to rest on the floor instead of micro-bouncing forever', () => {
    const physics = new BallPhysicsWorld({ environment: EARTH_SURFACE });
    let body = physics.createBody({ x: 0, y: 0, z: 1.2 }, { x: 0.4, y: 0, z: 0 });

    for (let i = 0; i < 120 * 40 && !body.resting; i++) {
      body = physics.integrate(body, DT, { floorZ: 0 });
    }

    expect(body.resting).toBe(true);
    expect(body.position.z).toBeCloseTo(physics.material.radiusM, 6);
    expect(Math.hypot(body.velocity.x, body.velocity.y, body.velocity.z)).toBeLessThan(1e-12);
  });

  it('stays confined inside box wall bounds, then rests inside', () => {
    const physics = new BallPhysicsWorld({ environment: EARTH_SURFACE });
    const radius = physics.material.radiusM;
    let body = physics.createBody({ x: -0.6, y: -0.5, z: 1.0 }, { x: 0.8, y: -0.9, z: 0 });
    const box = { minX: -0.825, maxX: -0.375, minY: -0.825, maxY: -0.375, floorZ: 0.15 };

    for (let i = 0; i < 120 * 40 && !body.resting; i++) {
      body = physics.integrate(body, DT, { boxBounds: box });
      expect(body.position.x).toBeGreaterThanOrEqual(box.minX - 1e-12);
      expect(body.position.x).toBeLessThanOrEqual(box.maxX + 1e-12);
      expect(body.position.y).toBeGreaterThanOrEqual(box.minY - 1e-12);
      expect(body.position.y).toBeLessThanOrEqual(box.maxY + 1e-12);
      expect(body.position.z).toBeGreaterThanOrEqual(box.floorZ + radius - 1e-12);
      expect(Number.isFinite(body.position.x + body.position.y + body.position.z)).toBe(true);
    }

    expect(body.resting).toBe(true);
    expect(body.position.z).toBeCloseTo(box.floorZ + radius, 6);
  });
});

describe('BallPhysicsWorld — prediction and determinism', () => {
  it('predictTrajectory returns a bounce-inclusive sample series', () => {
    const physics = new BallPhysicsWorld();
    const falling = physics.createBody({ x: 0.3, y: 0.0, z: 1.8 });
    const samples = physics.predictTrajectory(falling, 2.0, 1 / 30, { floorZ: -100 });

    expect(samples.length).toBeGreaterThan(10);
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].position.z).toBeLessThanOrEqual(samples[i - 1].position.z + 1e-12);
    }

    const bouncing = physics.predictTrajectory(
      physics.createBody({ x: 0.3, y: 0.0, z: 2.2 }),
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
      let body = physics.createBody({ x: 0.42, y: 0.2, z: 1.75 }, { x: 0.1, y: -0.05, z: 0 });
      const path: Array<readonly [number, number, number]> = [];
      for (let i = 0; i < 360; i++) {
        body = physics.integrate(body, DT, { floorZ: 0 });
        path.push([body.position.x, body.position.y, body.position.z]);
      }
      return path;
    };
    expect(run()).toEqual(run());
  });
});
