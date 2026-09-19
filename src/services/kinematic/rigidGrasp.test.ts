// ============================================================================
// RIGID GRASP + RELEASE PHYSICS REGRESSION GUARDS
//
// The user-reported defect: "ты эмулируешь движения шара в руке — шар летит
// отдельно от руки, с другой скоростью".
//
// Two independent causes, both measured on the tennis scenario before the fix:
//   1. The carried ball was pinned INSIDE `stepTarget`, i.e. to the PRE-solve
//      end-effector. The arm then moved away from it, so the ball trailed the
//      hand by a frame: 0.0412 m mean / 0.1096 m peak lag, 0.0946 m of it
//      horizontal — the ball visibly flew on its own.
//   2. On release the velocity was hardcoded to {x:0, y:0, z:-0.2}, discarding
//      the hand's own motion (measured mismatch 0.245 m/s). A body let go from a
//      moving gripper must keep the gripper's velocity and only then accelerate
//      under gravity.
//
// These tests pin the corrected contract: while GRASPED the ball is rigidly at
// the gripper pose and carries the gripper velocity; on release it inherits that
// velocity; afterwards the physics integrator alone governs it (gravity, then
// the first obstacle).
// ============================================================================

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CatchBallController,
  TENNIS_CANNON_SHOT_PLAN,
} from './catchBallController';
import { CartesianMotionSmoother } from './motionSmoothing';
import { KinematicDualDebuggerEngine } from './polarSolvers';
import {
  forwardKinematics3D,
  computeJacobianDeterminant3D,
} from './kinematicMath';
import { BallPhysicsWorld } from './ballPhysics';
import type { IBoxContainer, IKinematicState3D } from '../../model/kinematicEngine.contracts';

const LINK_LENGTHS: [number, number, number] = [0.4, 0.8, 0.7];
/** Must match GRASP_CARRY_DROP_Z in catchBallController. */
const GRASP_CARRY_DROP_Z = 0.04;

const BOX_CONTAINER: IBoxContainer = {
  position: { x: -0.6, y: -0.6, z: 0.15 },
  dimensions: { x: 0.45, y: 0.45, z: 0.3 },
  collectedBallIds: [],
};

function createInitialState(): IKinematicState3D {
  const joints = { q1: 0.35, q2: 0.6, q3: 1.2 };
  return {
    timestamp: 0,
    joints,
    endEffector: forwardKinematics3D(joints, LINK_LENGTHS),
    jacobianDeterminant: computeJacobianDeterminant3D(joints, LINK_LENGTHS),
    isSingularZone: false,
    isWorkspaceBoundaryExceeded: false,
    gripperClosed: false,
  };
}

interface CarryObservation {
  /** Frames the active ball spent GRASPED. */
  readonly carriedFrames: number;
  /** Worst horizontal separation between the ball and the actual gripper. */
  readonly maxHorizontalGap: number;
  /** Worst vertical separation minus the rigid carry offset. */
  readonly maxVerticalGapExcess: number;
  /** Worst mismatch between the carried ball velocity and the gripper velocity. */
  readonly maxCarryVelocityMismatch: number;
  /** Ball velocity sampled on the GRASPED -> FALLING transition, per release. */
  readonly releases: readonly { ballVz: number; gripperVz: number; gripperVx: number; ballVx: number }[];
  /** Consecutive airborne vz deltas after a release (m/s per frame). */
  readonly airborneVzDeltas: readonly number[];
  /** Free-fall frames observed between release and the first obstacle, per release. */
  readonly freeFallFrames: readonly number[];
  /** Ball centre height above the box floor at the instant of release, per release. */
  readonly releaseHeights: readonly number[];
}

/** Runs the page-equivalent closed loop and observes the carry + release coupling. */
function observeCarry(): CarryObservation {
  const physics = new BallPhysicsWorld();
  const engine = new KinematicDualDebuggerEngine();
  const controller = new CatchBallController(TENNIS_CANNON_SHOT_PLAN, BOX_CONTAINER, LINK_LENGTHS, physics);
  let ricis = createInitialState();
  let dls = createInitialState();
  const smoother = new CartesianMotionSmoother(ricis.endEffector);
  const dt = 1 / 60;

  let carriedFrames = 0;
  let maxHorizontalGap = 0;
  let maxVerticalGapExcess = 0;
  let maxCarryVelocityMismatch = 0;
  const releases: { ballVz: number; gripperVz: number; gripperVx: number; ballVx: number }[] = [];
  const airborneVzDeltas: number[] = [];
  const freeFallFrames: number[] = [];
  const releaseHeights: number[] = [];
  const boxFloorZ = BOX_CONTAINER.position.z - BOX_CONTAINER.dimensions.z / 2;

  let previousGripper: { x: number; y: number; z: number } | null = null;
  let previousStatus: string | null = null;
  let previousAirborneVz: number | null = null;
  let trackingRelease = false;

  for (let step = 0; step < 300 * 60; step++) {
    const catchStep = controller.stepTarget(dt, ricis.endEffector);
    smoother.setAnchor(catchStep.target);
    const smoothed = smoother.step(dt);
    const result = engine.step(ricis, dls, smoothed, LINK_LENGTHS, dt, 'POLAR');
    ricis = { ...result.ricisResult.nextState, gripperClosed: catchStep.shouldGrip };
    dls = result.dlsResult.nextState;

    // Exactly the page wiring: pin AFTER the solve, with the pose actually produced.
    controller.syncCarriedBall(ricis.endEffector, dt);

    const gripperV = previousGripper
      ? {
          x: (ricis.endEffector.x - previousGripper.x) / dt,
          y: (ricis.endEffector.y - previousGripper.y) / dt,
          z: (ricis.endEffector.z - previousGripper.z) / dt,
        }
      : null;
    previousGripper = { ...ricis.endEffector };

    const activeId = controller.getState().activeBallId;
    const ball = controller.getState().balls.find(b => b.id === activeId);
    const status = ball?.status ?? null;

    if (ball && status === 'GRASPED') {
      carriedFrames++;
      maxHorizontalGap = Math.max(
        maxHorizontalGap,
        Math.hypot(ball.currentPosition.x - ricis.endEffector.x, ball.currentPosition.y - ricis.endEffector.y)
      );
      maxVerticalGapExcess = Math.max(
        maxVerticalGapExcess,
        Math.abs(ricis.endEffector.z - GRASP_CARRY_DROP_Z - ball.currentPosition.z)
      );
      if (gripperV && ball.velocity) {
        maxCarryVelocityMismatch = Math.max(
          maxCarryVelocityMismatch,
          Math.hypot(
            ball.velocity.x - gripperV.x,
            ball.velocity.y - gripperV.y,
            ball.velocity.z - gripperV.z
          )
        );
      }
    }

    // Release = GRASPED -> FALLING on the ACTIVE ball (not a cannon shot).
    if (previousStatus === 'GRASPED' && status === 'FALLING' && ball?.velocity && gripperV) {
      releases.push({
        ballVz: ball.velocity.z,
        gripperVz: gripperV.z,
        gripperVx: gripperV.x,
        ballVx: ball.velocity.x,
      });
      trackingRelease = true;
      previousAirborneVz = ball.velocity.z;
      freeFallFrames.push(0);
      releaseHeights.push(ball.currentPosition.z - boxFloorZ);
    } else if (trackingRelease && status === 'FALLING' && ball?.velocity) {
      // Collect ONLY the free-fall stretch: up to the first obstacle. A floor/box
      // contact reverses vz, so the first non-negative delta ends the sample.
      const delta = ball.velocity.z - (previousAirborneVz ?? ball.velocity.z);
      const idx = freeFallFrames.length - 1;
      if (delta < 0) {
        // Cap the vz sample per release; the frame counter is never capped.
        if ((freeFallFrames[idx] ?? 0) < 12) airborneVzDeltas.push(delta);
        freeFallFrames[idx] = (freeFallFrames[idx] ?? 0) + 1;
        previousAirborneVz = ball.velocity.z;
      } else {
        trackingRelease = false;
        previousAirborneVz = null;
      }
    } else if (trackingRelease && status !== 'FALLING') {
      trackingRelease = false;
      previousAirborneVz = null;
    }

    previousStatus = status;
    if (controller.getState().phase === 'COMPLETED') break;
  }

  return {
    carriedFrames,
    maxHorizontalGap,
    maxVerticalGapExcess,
    maxCarryVelocityMismatch,
    releases,
    airborneVzDeltas,
    freeFallFrames,
    releaseHeights,
  };
}

describe('rigid grasp: the carried ball is welded to the gripper', () => {
  const observed = observeCarry();

  it('the scenario really carries balls (the observation is not vacuous)', () => {
    expect(observed.carriedFrames).toBeGreaterThan(500);
    expect(observed.releases.length).toBeGreaterThan(0);
  });

  it('the ball sits exactly under the gripper — no horizontal lag at all', () => {
    // Before the fix this measured 0.0946 m: the ball trailed a frame behind the hand.
    expect(observed.maxHorizontalGap).toBe(0);
  });

  it('the vertical offset is exactly the rigid carry drop, frame after frame', () => {
    expect(observed.maxVerticalGapExcess).toBeLessThan(1e-12);
  });

  it('while held, the ball carries the gripper velocity (not zero)', () => {
    expect(observed.maxCarryVelocityMismatch).toBeLessThan(1e-12);
  });
});

describe('release: the ball inherits the hand, then falls under gravity alone', () => {
  const observed = observeCarry();

  it('horizontal velocity at release equals the gripper’s (the old code zeroed it)', () => {
    expect(observed.releases.length).toBeGreaterThan(0);
    for (const release of observed.releases) {
      // Air drag acts for the one integration step of the release frame: factor (1 - 0.03*dt).
      expect(Math.abs(release.ballVx - release.gripperVx)).toBeLessThan(0.01);
    }
  });

  it('vertical velocity at release is the gripper’s minus one gravity step', () => {
    const physics = new BallPhysicsWorld();
    const dt = 1 / 60;
    expect(observed.releases.length).toBeGreaterThan(0);
    for (const release of observed.releases) {
      const expected = release.gripperVz - physics.gravity * dt;
      // The gripper velocity itself is a frame stale at the pre-solve release instant,
      // so allow one frame of hand deceleration on top of the gravity step.
      expect(Math.abs(release.ballVz - expected)).toBeLessThan(0.2);
      // ...and it must be falling, not the hardcoded -0.2 stub.
      expect(release.ballVz).toBeLessThan(0);
    }
  });

  it('after release only the integrator governs it: vz drops by gravity*dt every airborne frame', () => {
    const physics = new BallPhysicsWorld();
    const dt = 1 / 60;
    const drag = 1 - physics.airDrag * dt;
    expect(observed.airborneVzDeltas.length).toBeGreaterThan(5);
    for (const delta of observed.airborneVzDeltas) {
      // dz(vz) = vz*(drag-1) - g*dt, so the step is slightly larger than -g*dt in magnitude.
      expect(delta).toBeLessThan(-physics.gravity * dt * 0.9);
      expect(delta).toBeGreaterThan(-physics.gravity * dt * 1.6);
    }
  });
});

describe('release happens high enough for a real gravitational fall', () => {
  const observed = observeCarry();

  it('lets go well above the box floor, not 3 mm above the contact plane', () => {
    // Measured before the fix: 0.0031 m of clearance, so the integrator never ran a
    // single free-fall frame — the ball "bounced" on the frame after release.
    expect(observed.releaseHeights.length).toBeGreaterThan(0);
    for (const height of observed.releaseHeights) {
      expect(height).toBeGreaterThan(0.15);
    }
  });

  it('the ball is airborne under gravity for many frames before the first obstacle', () => {
    expect(observed.freeFallFrames.length).toBeGreaterThan(0);
    for (const frames of observed.freeFallFrames) {
      expect(frames).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('wiring contract: the pin happens after the solve, in every caller', () => {
  // The behaviour tests above drive their own loop, so they cannot catch a caller that
  // forgets the pin or calls it with the pre-solve pose. These source contracts can.
  const callers: readonly (readonly [string, string])[] = [
    ['live page', 'src/ui/KinematicEnginePage.tsx'],
    ['regression loop', 'src/services/kinematic/catchBallController.test.ts'],
    ['interception benchmark', 'src/services/kinematic/interceptionBenchmark.ts'],
  ];

  it.each(callers)('%s pins the carried ball to the post-solve gripper pose', (_label, path) => {
    const source = readFileSync(resolve(process.cwd(), path), 'utf8');
    expect(source).toContain('syncCarriedBall(');
    // The pin must come AFTER the solver step in the frame, not before it.
    const solveAt = source.indexOf('engine.step(') >= 0 ? source.indexOf('engine.step(') : source.indexOf('dualEngine.step(');
    const pinAt = source.indexOf('syncCarriedBall(');
    expect(solveAt).toBeGreaterThanOrEqual(0);
    expect(pinAt).toBeGreaterThan(solveAt);
  });

  it('the controller no longer pins the ball from inside stepTarget (pre-solve pose)', () => {
    const raw = readFileSync(
      resolve(process.cwd(), 'src/services/kinematic/catchBallController.ts'),
      'utf8'
    );
    // Strip comments: the docstring legitimately names the removed `followGripper`.
    const code = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
    expect(code).not.toContain('followGripper');
    // ...and the release no longer fabricates a velocity.
    expect(code).not.toMatch(/velocity: \{ x: 0, y: 0, z: -0\.2 \}/);
    expect(code).not.toMatch(/z: -0\.2 \}/);
  });
});
