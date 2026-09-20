// ============================================================================
// ELBOW-OVER-FLOOR GUARD REGRESSION GUARDS
// The user observed the elbow diving under the base ("локоть уходит ниже
// основания"). A planar 2R arm has two EXACT inverse solutions per end-effector
// pose; the guard selects the mirrored elbow-up branch (with hysteresis) whenever
// the active branch would pierce the room floor. These tests pin the algebra:
// mirror must preserve the end-effector pose bit-for-bit, flip only when strictly
// better, and never flip degenerate pole poses.
// ============================================================================

import { describe, expect, it } from 'vitest';
import {
  forwardKinematics3D,
  computeElbowPosition3D,
  enforceElbowFloorClearance,
  distance3D,
} from './kinematicMath';
import { PolarRicisConstraintSolver, KinematicDualDebuggerEngine } from './polarSolvers';
import { RicisSymbolicJacobianSolver3D } from './kinematicSolvers';
import { computeJacobianDeterminant3D } from './kinematicMath';
import type { IKinematicState3D } from '../../model/kinematicEngine.contracts';
import { ELBOW_FLOOR_CLEARANCE_M, MANIPULATOR_LINK_LENGTHS_M } from './manipulatorConstants';

const LINK_LENGTHS = MANIPULATOR_LINK_LENGTHS_M;

describe('enforceElbowFloorClearance', () => {
  it('returns the same object when the elbow is already above the floor', () => {
    const joints = { q1: 0.3, q2: 0.6, q3: 1.2 };
    const result = enforceElbowFloorClearance(joints, LINK_LENGTHS);
    expect(result).toBe(joints);
  });

  it('flips to the mirrored branch and preserves the end-effector pose EXACTLY', () => {
    // Elbow-down configuration with the elbow clearly under the floor.
    const joints = { q1: 0.9, q2: -0.8, q3: 1.1 };
    const elbowBefore = computeElbowPosition3D(joints, LINK_LENGTHS).z;
    expect(elbowBefore).toBeLessThan(0);

    const mirrored = enforceElbowFloorClearance(joints, LINK_LENGTHS);
    expect(mirrored).not.toBe(joints);

    const eeBefore = forwardKinematics3D(joints, LINK_LENGTHS);
    const eeAfter = forwardKinematics3D(mirrored, LINK_LENGTHS);
    // The mirror is a geometric identity: the EE must not move at all.
    expect(distance3D(eeBefore, eeAfter)).toBeLessThan(1e-12);

    // The mirrored elbow is above the floor clearance and matches q3 -> -q3.
    expect(mirrored.q3).toBeCloseTo(-1.1, 12);
    expect(computeElbowPosition3D(mirrored, LINK_LENGTHS).z).toBeGreaterThan(
      ELBOW_FLOOR_CLEARANCE_M
    );
  });

  it('does NOT flip when the mirror is not strictly better (hysteresis)', () => {
    // Craft a pose where both branches are equally deep (elbow-down vs elbow-up
    // within the hysteresis margin): a near-straight downward arm.
    const joints = { q1: 0.2, q2: -1.35, q3: 0.05 };
    const elbow = computeElbowPosition3D(joints, LINK_LENGTHS).z;
    expect(elbow).toBeLessThan(ELBOW_FLOOR_CLEARANCE_M);
    const result = enforceElbowFloorClearance(joints, LINK_LENGTHS);
    expect(result).toBe(joints); // kept the highest available branch, no dithering
  });

  it('does NOT flip a degenerate over-the-pole pose (radial ≈ 0)', () => {
    // EE EXACTLY on the pole line: q2 = -pi/2 (upper arm straight down) and
    // q2+q3 = +pi/2 (forearm straight up) -> radial reach is zero, elbow is at
    // z = L0 - L1 < 0, but the mirror is undefined; the guard must return the
    // joints untouched rather than fabricating NaNs.
    const joints = { q1: 1.1, q2: -Math.PI / 2, q3: Math.PI };
    const ee = forwardKinematics3D(joints, LINK_LENGTHS);
    expect(Math.hypot(ee.x, ee.y)).toBeLessThan(1e-9);
    const result = enforceElbowFloorClearance(joints, LINK_LENGTHS);
    expect(result).toBe(joints);
    expect(Number.isFinite(result.q1 + result.q2 + result.q3)).toBe(true);
  });
});

describe('Polar solver branch selection (elbow-over-floor inside the closed form)', () => {
  it('low floor targets converge with the elbow ABOVE the room floor', () => {
    const solver = new PolarRicisConstraintSolver();
    const joints0 = { q1: 0.3, q2: 0.6, q3: 1.2 };
    const initialEE = forwardKinematics3D(joints0, LINK_LENGTHS);
    let state: IKinematicState3D = {
      timestamp: 0,
      joints: { ...joints0 },
      endEffector: initialEE,
      jacobianDeterminant: computeJacobianDeterminant3D(joints0, LINK_LENGTHS),
      isSingularZone: false,
      isWorkspaceBoundaryExceeded: false,
      gripperClosed: false,
    };
    const lowTarget = { x: 1.15, y: 0.35, z: 0.08 };

    const dt = 1 / 60;
    for (let i = 0; i < 60 * 25; i++) {
      const result = solver.solve(state, lowTarget, LINK_LENGTHS, dt, 'POLAR');
      state = result.nextState;
      if (distance3D(state.endEffector, lowTarget) < 0.005) break;
    }

    // The arm arrives at the low ball-pick pose...
    expect(distance3D(state.endEffector, lowTarget)).toBeLessThan(0.02);
    // ...with the elbow above the floor clearance (branch was flipped internally).
    const elbowZ = computeElbowPosition3D(state.joints, LINK_LENGTHS).z;
    expect(elbowZ).toBeGreaterThanOrEqual(ELBOW_FLOOR_CLEARANCE_M - 1e-9);
    // ...and it chose the elbow-up branch (q3 < 0), the human-like "pick from above".
    expect(state.joints.q3).toBeLessThan(0);
  });
});

describe('branch reconfiguration travels the NEAREST turn of the shoulder', () => {
  // Measured pose (search over q2 x q3): the mirror 2*phi - q2 lands 12.509 rad away from
  // the current shoulder angle, while the nearest physically identical turn is 0.057 rad
  // away. q2 and q2 + 2*pi are the same revolute pose, and forwardKinematics3D reads only
  // sin/cos of q2 and q2+q3, so the two are indistinguishable to the end-effector.
  const joints = { q1: 0.4, q2: 5.749114556069321, q3: 0.06126105674500071 };

  it('the raw mirror really is more than a half turn away, and preserves the pose', () => {
    const mirrored = enforceElbowFloorClearance(joints, LINK_LENGTHS);
    expect(mirrored).not.toBe(joints);
    expect(Math.abs(mirrored.q2 - joints.q2)).toBeGreaterThan(Math.PI);
    expect(computeElbowPosition3D(joints, LINK_LENGTHS).z).toBeLessThan(0);
    expect(computeElbowPosition3D(mirrored, LINK_LENGTHS).z).toBeGreaterThan(
      ELBOW_FLOOR_CLEARANCE_M
    );
    expect(
      distance3D(forwardKinematics3D(joints, LINK_LENGTHS), forwardKinematics3D(mirrored, LINK_LENGTHS))
    ).toBeLessThan(1e-12);
  });

  it('slews the short way, so the shoulder never teleports during the reconfiguration', () => {
    const MAX_SHOULDER_STEP_RAD = 0.4;
    const engine = new KinematicDualDebuggerEngine();
    engine.setRicisSolver(new RicisSymbolicJacobianSolver3D(), 'SYMBOLIC_AST');

    const makeState = (): IKinematicState3D => ({
      timestamp: 0,
      joints: { ...joints },
      endEffector: forwardKinematics3D(joints, LINK_LENGTHS),
      jacobianDeterminant: computeJacobianDeterminant3D(joints, LINK_LENGTHS),
      isSingularZone: false,
      isWorkspaceBoundaryExceeded: false,
      gripperClosed: false,
    });

    // Hold the current pose: the reconfiguration is the only thing that may move q2.
    const target = forwardKinematics3D(joints, LINK_LENGTHS);
    let ricis = makeState();
    let dls = makeState();
    let previousQ2 = joints.q2;
    let maxStep = 0;
    let finalElbowZ = 0;

    for (let frame = 0; frame < 60; frame++) {
      const result = engine.step(ricis, dls, target, LINK_LENGTHS, 1 / 60, 'POLAR');
      ricis = result.ricisResult.nextState;
      dls = result.dlsResult.nextState;
      const step = Math.abs(ricis.joints.q2 - previousQ2);
      maxStep = Math.max(maxStep, step);
      expect(step, `frame ${frame}: shoulder teleported ${step.toFixed(4)} rad`).toBeLessThanOrEqual(
        MAX_SHOULDER_STEP_RAD
      );
      previousQ2 = ricis.joints.q2;
      finalElbowZ = computeElbowPosition3D(ricis.joints, LINK_LENGTHS).z;
    }

    // The raw (unwrapped) mirror travels 12.509 rad in 0.35 s: peak 0.894 rad/frame.
    expect(maxStep).toBeLessThan(0.05);
    // ...and it lands on the elbow-up branch, above the floor.
    expect(finalElbowZ).toBeGreaterThanOrEqual(ELBOW_FLOOR_CLEARANCE_M - 1e-9);
  });
});
