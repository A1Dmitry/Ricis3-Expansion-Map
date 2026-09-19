// ============================================================================
// ELBOW-BRANCH CONTINUITY REGRESSION GUARDS
//
// Incident 2026-09-19: the elbow-over-floor guard mirrored an iterative solver's
// joint state in a SINGLE frame. The mirror is an exact IK identity (the EE does not
// move), so every Cartesian-level guard stayed green — but the shoulder joint jumped
// by 1.0–2.1 rad in one 16.7 ms frame, i.e. the arm visibly snapped. Measured:
//   max |Δq2| per frame, closed-loop pick-and-place
//     POLAR_GEOMETRIC / DLS ghost : 0.0816 rad (before) -> 1.017 rad (broken)
//     SYMBOLIC_AST    / RICIS arm : 0.0583 rad (before) -> 2.091 rad (broken)
// These guards pin the JOINT-SPACE continuity that no Cartesian assertion can see,
// and pin that the branch is still taken (the elbow still ends up above the floor).
// ============================================================================

import { describe, expect, it } from 'vitest';
import { KinematicDualDebuggerEngine, PolarRicisConstraintSolver } from './polarSolvers';
import { RicisSymbolicJacobianSolver3D } from './kinematicSolvers';
import { PickAndPlaceController } from './pickAndPlaceController';
import { forwardKinematics3D, computeElbowPosition3D, computeJacobianDeterminant3D } from './kinematicMath';
import { KinematicConstants } from './kinematicConstants';
import type { IBallEntity, IBoxContainer, IKinematicState3D, Vector3D } from '../../model/kinematicEngine.contracts';

const LINK_LENGTHS: readonly [number, number, number] = [0.4, 0.8, 0.7];
const DT = 1 / 60;

/**
 * Per-frame shoulder travel budget at 60 FPS.
 * The healthy lane measured 0.058–0.34 rad/frame (free tracking of a moving target);
 * the broken single-frame mirror measured 1.0–2.1 rad/frame. 0.40 rad separates them
 * with margin on both sides.
 */
const MAX_SHOULDER_STEP_RAD = 0.4;

function createState(q1: number, q2: number, q3: number): IKinematicState3D {
  const joints = { q1, q2, q3 };
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

function engineFor(mode: 'POLAR_GEOMETRIC' | 'SYMBOLIC_AST'): KinematicDualDebuggerEngine {
  const engine = new KinematicDualDebuggerEngine();
  engine.setRicisSolver(
    mode === 'SYMBOLIC_AST' ? new RicisSymbolicJacobianSolver3D() : new PolarRicisConstraintSolver(),
    mode
  );
  return engine;
}

const INITIAL_BALLS: readonly IBallEntity[] = [
  { id: 'ball-1', initialPosition: { x: 1.45, y: 0.2, z: 0.1 }, currentPosition: { x: 1.45, y: 0.2, z: 0.1 }, radius: 0.06, color: '#ef4444', status: 'ON_SPAWN', isSingularZone: true },
  { id: 'ball-2', initialPosition: { x: 0.15, y: 0.1, z: 1.85 }, currentPosition: { x: 0.15, y: 0.1, z: 1.85 }, radius: 0.06, color: '#f59e0b', status: 'ON_SPAWN', isSingularZone: true },
  { id: 'ball-3', initialPosition: { x: 0.8, y: -0.6, z: 0.1 }, currentPosition: { x: 0.8, y: -0.6, z: 0.1 }, radius: 0.06, color: '#06b6d4', status: 'ON_SPAWN', isSingularZone: false },
  { id: 'ball-4', initialPosition: { x: -0.2, y: 1.42, z: 0.2 }, currentPosition: { x: -0.2, y: 1.42, z: 0.2 }, radius: 0.06, color: '#a855f7', status: 'ON_SPAWN', isSingularZone: true },
];

const BOX: IBoxContainer = {
  position: { x: -0.6, y: -0.6, z: 0.15 },
  dimensions: { x: 0.45, y: 0.45, z: 0.3 },
  collectedBallIds: [],
};

function measureClosedLoop(mode: 'POLAR_GEOMETRIC' | 'SYMBOLIC_AST') {
  const engine = engineFor(mode);
  const controller = new PickAndPlaceController(INITIAL_BALLS, BOX);
  let ricis = createState(0.35, 0.6, 1.2);
  let dls = createState(0.35, 0.6, 1.2);

  let maxRicisStep = 0;
  let maxDlsStep = 0;
  let minElbowZ = Infinity;
  let stepsUsed = 0;

  for (let i = 0; i < 60 * 90; i++) {
    stepsUsed++;
    const command = controller.stepTarget(DT, ricis.endEffector);
    const out = engine.step(ricis, dls, command.target, LINK_LENGTHS, DT);
    maxRicisStep = Math.max(maxRicisStep, Math.abs(out.ricisResult.nextState.joints.q2 - ricis.joints.q2));
    maxDlsStep = Math.max(maxDlsStep, Math.abs(out.dlsResult.nextState.joints.q2 - dls.joints.q2));
    minElbowZ = Math.min(
      minElbowZ,
      computeElbowPosition3D(out.ricisResult.nextState.joints, LINK_LENGTHS).z,
      computeElbowPosition3D(out.dlsResult.nextState.joints, LINK_LENGTHS).z
    );
    ricis = out.ricisResult.nextState;
    dls = out.dlsResult.nextState;
    if (controller.getState().phase === 'COMPLETED') break;
  }
  return { maxRicisStep, maxDlsStep, minElbowZ, stepsUsed, controller };
}

describe('elbow-branch reconfiguration stays continuous in joint space', () => {
  it('POLAR_GEOMETRIC: no arm teleports its shoulder while picking from the floor', () => {
    const { maxRicisStep, maxDlsStep, minElbowZ, controller } = measureClosedLoop('POLAR_GEOMETRIC');
    expect(controller.getState().ballsPlacedCount).toBe(4);
    expect(maxRicisStep).toBeLessThanOrEqual(MAX_SHOULDER_STEP_RAD);
    expect(maxDlsStep).toBeLessThanOrEqual(MAX_SHOULDER_STEP_RAD);
    // ...and the guard still did its job: the elbow never pierced the room floor.
    expect(minElbowZ).toBeGreaterThanOrEqual(0 - 1e-9);
  });

  it('SYMBOLIC_AST: no arm teleports its shoulder while picking from the floor', () => {
    const { maxRicisStep, maxDlsStep, minElbowZ, controller } = measureClosedLoop('SYMBOLIC_AST');
    expect(controller.getState().ballsPlacedCount).toBe(4);
    expect(maxRicisStep).toBeLessThanOrEqual(MAX_SHOULDER_STEP_RAD);
    expect(maxDlsStep).toBeLessThanOrEqual(MAX_SHOULDER_STEP_RAD);
    expect(minElbowZ).toBeGreaterThanOrEqual(0 - 1e-9);
  });
});

describe('a single engine step never swaps the IK branch instantaneously', () => {
  const LOW_TARGET: Vector3D = { x: 0.95, y: 0.0, z: 0.06 };

  it('slews q2/q3 towards the mirrored branch instead of jumping onto it', () => {
    const engine = engineFor('SYMBOLIC_AST');
    let ricis = createState(0.0, 0.6, 1.2);
    let dls = createState(0.0, 0.6, 1.2);

    // Drive both arms down until the elbow-over-floor guard has to fire.
    let firstSwitchStep = 0;
    for (let i = 0; i < 120; i++) {
      const out = engine.step(ricis, dls, LOW_TARGET, LINK_LENGTHS, DT);
      const step = Math.abs(out.ricisResult.nextState.joints.q2 - ricis.joints.q2);
      if (step > 0.05 && firstSwitchStep === 0) firstSwitchStep = step;
      expect(step, `frame ${i}: shoulder teleported ${step.toFixed(4)} rad`).toBeLessThanOrEqual(
        MAX_SHOULDER_STEP_RAD
      );
      ricis = out.ricisResult.nextState;
      dls = out.dlsResult.nextState;
    }
    expect(firstSwitchStep).toBeGreaterThan(0); // the reconfiguration really happened
  });

  it('completes the reconfiguration: elbow ends above the floor and the target is re-acquired', () => {
    const engine = engineFor('SYMBOLIC_AST');
    let ricis = createState(0.0, 0.6, 1.2);
    let dls = createState(0.0, 0.6, 1.2);
    for (let i = 0; i < 60 * 30; i++) {
      const out = engine.step(ricis, dls, LOW_TARGET, LINK_LENGTHS, DT);
      ricis = out.ricisResult.nextState;
      dls = out.dlsResult.nextState;
    }
    const elbowZ = computeElbowPosition3D(ricis.joints, LINK_LENGTHS).z;
    expect(elbowZ).toBeGreaterThanOrEqual(KinematicConstants.ELBOW_FLOOR_CLEARANCE_METERS - 1e-9);
    const ee = forwardKinematics3D(ricis.joints, LINK_LENGTHS);
    const err = Math.hypot(ee.x - LOW_TARGET.x, ee.y - LOW_TARGET.y, ee.z - LOW_TARGET.z);
    expect(err).toBeLessThan(0.02);
  });

  it('reports the end-effector honestly while the branch is being reconfigured', () => {
    const engine = engineFor('SYMBOLIC_AST');
    let ricis = createState(0.0, 0.6, 1.2);
    let dls = createState(0.0, 0.6, 1.2);
    for (let i = 0; i < 120; i++) {
      const out = engine.step(ricis, dls, LOW_TARGET, LINK_LENGTHS, DT);
      ricis = out.ricisResult.nextState;
      dls = out.dlsResult.nextState;
      // FK reported by the state must match FK recomputed from the joints it reports.
      const recomputed = forwardKinematics3D(ricis.joints, LINK_LENGTHS);
      expect(Math.abs(recomputed.x - ricis.endEffector.x)).toBeLessThan(1e-12);
      expect(Math.abs(recomputed.y - ricis.endEffector.y)).toBeLessThan(1e-12);
      expect(Math.abs(recomputed.z - ricis.endEffector.z)).toBeLessThan(1e-12);
      expect(Number.isFinite(ricis.jacobianDeterminant)).toBe(true);
    }
  });
});
