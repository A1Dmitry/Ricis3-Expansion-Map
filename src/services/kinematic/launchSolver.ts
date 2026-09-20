// ============================================================================
// LAUNCH SOLVER — APPLICATION SERVICE
// ----------------------------------------------------------------------------
// Turns a scenario INTENT ("the ball must come to rest this far from the arm
// base") into the launch velocity that realises it, by solving against the real
// integrator instead of storing a tuned velocity triple.
//
// Why this module exists: the tennis shot plan and the interception benchmark
// both needed it. Keeping it private to one of them forces the other to keep a
// table of hand-fitted velocities — which is exactly how a scenario ends up
// silently calibrated to one particular gravity.
//
// Layer: application. Depends on the physics integrator and on ballistics;
// knows nothing about joints, Jacobians or QA scoring.
// ============================================================================

import type { Vector3D } from '../../model/kinematicEngine.contracts';
import type { BallPhysicsWorld } from './ballPhysics';
import { launchVelocity } from './ballistics';
import { roomFloorInset } from './roomGeometry';

/** Step used when solving a launch (60 FPS, the rate the scenarios run at). */
const SOLVE_DT_SEC = 1 / 60;

/** Longest simulated flight when measuring where a shot lands (seconds). */
const SOLVE_HORIZON_SEC = 40;

/**
 * Speed grid the search scans before bisecting, m/s.
 *
 * A scan is unavoidable rather than lazy: the landing radius is NOT a monotonic
 * function of muzzle speed. Measured on the interception battery, a shot aimed
 * back toward the arm base lands FURTHER out when fired slowly and closer in
 * when fired faster (T05: 1.95 m at 0.5 m/s falling to 1.18 m at 6 m/s), and one
 * aimed across the room has an interior minimum (T09: 0.09 m at 5 m/s, then
 * 3.12 m at 10 m/s as it overshoots and rebounds off the far wall). Any solver
 * that assumes "faster means further" — e.g. doubling a bracket until it
 * "works" — converges on garbage there. Measured symptom of that bug: a shot
 * asked to land at 1.32 m "solved" to 13.4 m/s and stopped at 12.8 m.
 */
const SPEED_SCAN_MIN_MPS = 0.25;
const SPEED_SCAN_MAX_MPS = 14;
const SPEED_SCAN_POINTS = 56;

/** Bisection refinements inside the selected bracket. */
const BISECTION_ITERATIONS = 24;

/**
 * Which crossing of the target radius to take when several exist.
 *
 * `'near'` is the gentlest shot that lands there; `'far'` is the hard shot that
 * overshoots and comes back. They are different physical shots, so the caller
 * must name the one the scenario means.
 */
export type LaunchBranch = 'near' | 'far';

/** Thrown when no launch in this environment realises the requested intent. */
export class LaunchUnsolvedError extends Error {}

/** Where a shot actually comes to rest, measured on the real integrator. */
export function measureLandingRadius(
  physics: BallPhysicsWorld,
  muzzle: Vector3D,
  aimDirection: Vector3D,
  speedMps: number
): number {
  const boxBounds = roomFloorInset(physics.material.radiusM);
  let body = physics.createBody(muzzle, launchVelocity(aimDirection, speedMps));
  const steps = Math.ceil(SOLVE_HORIZON_SEC / SOLVE_DT_SEC);
  for (let i = 0; i < steps && !body.resting; i++) {
    body = physics.integrate(body, SOLVE_DT_SEC, { floorZ: boxBounds.floorZ, boxBounds });
  }
  return Math.hypot(body.position.x, body.position.y);
}

/**
 * Launch speed that lands the ball at the requested radius, solved numerically
 * against the real integrator (drag, wall rebounds and bouncing included).
 *
 * The grid scan finds every speed whose landing radius crosses the target and
 * keeps the one the requested `branch` names; bisection then pins it down.
 *
 * @throws LaunchUnsolvedError when the intent is not realisable in this world.
 *         Reported, never papered over with a clamped speed.
 */
export function solveLaunchSpeed(
  physics: BallPhysicsWorld,
  muzzle: Vector3D,
  aimDirection: Vector3D,
  landingRadiusM: number,
  branch: LaunchBranch = 'near'
): number {
  const radiusAt = (speed: number) => measureLandingRadius(physics, muzzle, aimDirection, speed);

  // Geometric grid: resolves slow lobbing shots and hard rebounds alike.
  const ratio = SPEED_SCAN_MAX_MPS / SPEED_SCAN_MIN_MPS;
  const speeds: number[] = [];
  for (let i = 0; i < SPEED_SCAN_POINTS; i++) {
    speeds.push(SPEED_SCAN_MIN_MPS * Math.pow(ratio, i / (SPEED_SCAN_POINTS - 1)));
  }

  const crossings: Array<[number, number]> = [];
  let prevSpeed = speeds[0];
  let prevRadius = radiusAt(prevSpeed);
  for (let i = 1; i < speeds.length; i++) {
    const speed = speeds[i];
    const radius = radiusAt(speed);
    if ((prevRadius - landingRadiusM) * (radius - landingRadiusM) <= 0 && prevRadius !== radius) {
      crossings.push([prevSpeed, speed]);
    }
    prevSpeed = speed;
    prevRadius = radius;
  }
  if (crossings.length === 0) {
    throw new LaunchUnsolvedError(
      `No launch between ${SPEED_SCAN_MIN_MPS} and ${SPEED_SCAN_MAX_MPS} m/s lands at ` +
        `${landingRadiusM} m from the base in ${physics.environment.label}`
    );
  }

  const [low0, high0] = branch === 'near' ? crossings[0] : crossings[crossings.length - 1];
  let low = low0;
  let high = high0;
  for (let i = 0; i < BISECTION_ITERATIONS; i++) {
    const mid = (low + high) / 2;
    const midRadius = radiusAt(mid);
    const lowRadius = radiusAt(low);
    if ((lowRadius - landingRadiusM) * (midRadius - landingRadiusM) <= 0) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}

/** Launch velocity vector realising the requested landing radius. */
export function solveLaunchVelocity(
  physics: BallPhysicsWorld,
  muzzle: Vector3D,
  aimDirection: Vector3D,
  landingRadiusM: number,
  branch: LaunchBranch = 'near'
): { velocity: Vector3D; speedMps: number } {
  const speedMps = solveLaunchSpeed(physics, muzzle, aimDirection, landingRadiusM, branch);
  return { velocity: launchVelocity(aimDirection, speedMps), speedMps };
}
