// ============================================================================
// RENDER-LAYER TRACE GUARDS
//
// Every other kinematic guard reads the SOLVER. The 2026-09-19 elbow-branch
// teleport passed all of them because the mirror is an exact IK identity: the
// end-effector did not move, only the drawn joints did. These guards read the
// RENDER TRACE — the world-space joint positions downstream of the
// joint -> geometry mapping, i.e. what the viewport actually draws.
// ============================================================================

import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createRobotArmRig,
  applyRobotArmPose,
  readRobotArmWorldPose,
  disposeRobotArmRig,
  domainToRender,
} from './robotArmScene';
import { ManipulatorRenderTrace, manipulatorRenderTrace } from '../../../services/kinematic/renderTrace';
import { KinematicDualDebuggerEngine, PolarRicisConstraintSolver } from '../../../services/kinematic/polarSolvers';
import { RicisSymbolicJacobianSolver3D } from '../../../services/kinematic/kinematicSolvers';
import { PickAndPlaceController } from '../../../services/kinematic/pickAndPlaceController';
import { forwardKinematics3D, computeJacobianDeterminant3D } from '../../../services/kinematic/kinematicMath';
import type { IBallEntity, IBoxContainer, IKinematicState3D, Vector3D } from '../../../model/kinematicEngine.contracts';
import { MANIPULATOR_LINK_LENGTHS_M } from '../../../services/kinematic/manipulatorConstants';

const L = MANIPULATOR_LINK_LENGTHS_M;
const DT = 1 / 60;

/**
 * Per-frame budget for the DRAWN elbow, in metres.
 * Healthy lane: the shoulder moves <= 0.4 rad/frame, so the elbow (radius L1 = 0.8 m)
 * travels <= ~0.32 m; measured healthy maximum is 0.08 m. A branch teleport moves q2
 * by 1.78 rad, i.e. a 1.24 m chord in a single frame. 0.40 m separates them.
 */
const MAX_DRAWN_ELBOW_STEP_M = 0.4;

function createState(q1: number, q2: number, q3: number): IKinematicState3D {
  const joints = { q1, q2, q3 };
  return {
    timestamp: 0,
    joints,
    endEffector: forwardKinematics3D(joints, L),
    jacobianDeterminant: computeJacobianDeterminant3D(joints, L),
    isSingularZone: false,
    isWorkspaceBoundaryExceeded: false,
    gripperClosed: false,
  };
}

const BALLS: readonly IBallEntity[] = [
  { id: 'b1', initialPosition: { x: 1.45, y: 0.2, z: 0.1 }, currentPosition: { x: 1.45, y: 0.2, z: 0.1 }, radius: 0.06, color: '#ef4444', status: 'ON_SPAWN', isSingularZone: true },
  { id: 'b2', initialPosition: { x: 0.15, y: 0.1, z: 1.85 }, currentPosition: { x: 0.15, y: 0.1, z: 1.85 }, radius: 0.06, color: '#f59e0b', status: 'ON_SPAWN', isSingularZone: true },
  { id: 'b3', initialPosition: { x: 0.8, y: -0.6, z: 0.1 }, currentPosition: { x: 0.8, y: -0.6, z: 0.1 }, radius: 0.06, color: '#06b6d4', status: 'ON_SPAWN', isSingularZone: false },
  { id: 'b4', initialPosition: { x: -0.2, y: 1.42, z: 0.2 }, currentPosition: { x: -0.2, y: 1.42, z: 0.2 }, radius: 0.06, color: '#a855f7', status: 'ON_SPAWN', isSingularZone: true },
];
const BOX: IBoxContainer = { position: { x: -0.6, y: -0.6, z: 0.15 }, dimensions: { x: 0.45, y: 0.45, z: 0.3 }, collectedBallIds: [] };

/**
 * Run the real closed loop and record the real render trace for BOTH drawn arms —
 * exactly the calls RobotArm3DCanvas makes each frame.
 */
function driveAndTrace(mode: 'POLAR_GEOMETRIC' | 'SYMBOLIC_AST', trace = new ManipulatorRenderTrace(100000)) {
  const engine = new KinematicDualDebuggerEngine();
  engine.setRicisSolver(
    mode === 'SYMBOLIC_AST' ? new RicisSymbolicJacobianSolver3D() : new PolarRicisConstraintSolver(),
    mode
  );
  const controller = new PickAndPlaceController(BALLS, BOX);
  const ricisRig = createRobotArmRig(true, L);
  const dlsRig = createRobotArmRig(false, L);

  let ricis = createState(0.35, 0.6, 1.2);
  let dls = createState(0.35, 0.6, 1.2);
  let worstGripperMismatch = 0;
  let frames = 0;

  for (let i = 0; i < 60 * 90; i++) {
    frames++;
    const command = controller.stepTarget(DT, ricis.endEffector);
    const out = engine.step(ricis, dls, command.target, L, DT);
    ricis = out.ricisResult.nextState;
    dls = out.dlsResult.nextState;

    // The production render step.
    applyRobotArmPose(ricisRig, ricis.joints, ricis.gripperClosed);
    applyRobotArmPose(dlsRig, dls.joints, false);
    const ricisPose = readRobotArmWorldPose(ricisRig);
    const dlsPose = readRobotArmWorldPose(dlsRig);
    trace.record('RICIS', ricisPose);
    trace.record('DLS_GHOST', dlsPose);

    // The drawn gripper must BE the solved end-effector, mapped into the render frame.
    const expected = domainToRender(ricis.endEffector);
    worstGripperMismatch = Math.max(
      worstGripperMismatch,
      Math.hypot(
        ricisPose.gripper.x - expected.x,
        ricisPose.gripper.y - expected.y,
        ricisPose.gripper.z - expected.z
      )
    );

    if (controller.getState().phase === 'COMPLETED') break;
  }

  disposeRobotArmRig(ricisRig);
  disposeRobotArmRig(dlsRig);
  return { controller, worstGripperMismatch, frames, trace };
}

describe('render trace reflects the drawn geometry', () => {
  beforeEach(() => {
    manipulatorRenderTrace.clear();
  });

  it('the traced gripper IS the drawn end-effector (scene graph matches the solver)', () => {
    const { worstGripperMismatch, frames, trace } = driveAndTrace('POLAR_GEOMETRIC');
    expect(frames).toBeGreaterThan(100);
    // If the rig hierarchy or the (x, z, -y) mapping were wrong this would be metres off.
    expect(worstGripperMismatch).toBeLessThan(1e-9);
    expect(trace.framesFor('RICIS').length).toBe(frames);
    expect(trace.framesFor('DLS_GHOST').length).toBe(frames);
  });

  it('the drawn elbow never travels more than the budget in one frame (POLAR_GEOMETRIC)', () => {
    const { controller, trace } = driveAndTrace('POLAR_GEOMETRIC');
    expect(controller.getState().ballsPlacedCount).toBe(4);
    for (const arm of ['RICIS', 'DLS_GHOST'] as const) {
      const report = trace.analyzeContinuity(arm);
      expect(
        report.maxElbowStepM,
        `${arm}: drawn elbow jumped ${report.maxElbowStepM.toFixed(3)} m in frame ${report.maxElbowStepFrame}`
      ).toBeLessThanOrEqual(MAX_DRAWN_ELBOW_STEP_M);
      expect(report.minElbowY, `${arm}: drawn elbow sank to ${report.minElbowY.toFixed(3)} m`).toBeGreaterThanOrEqual(
        -1e-9
      );
    }
  });

  it('the drawn elbow never travels more than the budget in one frame (SYMBOLIC_AST)', () => {
    const { controller, trace } = driveAndTrace('SYMBOLIC_AST');
    expect(controller.getState().ballsPlacedCount).toBe(4);
    for (const arm of ['RICIS', 'DLS_GHOST'] as const) {
      const report = trace.analyzeContinuity(arm);
      expect(
        report.maxElbowStepM,
        `${arm}: drawn elbow jumped ${report.maxElbowStepM.toFixed(3)} m in frame ${report.maxElbowStepFrame}`
      ).toBeLessThanOrEqual(MAX_DRAWN_ELBOW_STEP_M);
      expect(report.minElbowY, `${arm}: drawn elbow sank to ${report.minElbowY.toFixed(3)} m`).toBeGreaterThanOrEqual(
        -1e-9
      );
    }
  });

  it('a branch teleport is visible in the trace even though the gripper never moves', () => {
    // The 2026-09-19 defect in miniature: same end-effector, mirrored joints. The
    // gripper trace is flat, the elbow trace jumps ~1.2 m. This is the observation
    // the Cartesian-only guards structurally cannot make.
    const rig = createRobotArmRig(true, L);
    const down = { q1: 0.0, q2: -0.4946, q3: 2.0098 };
    // Exact mirror about the shoulder -> EE line of THIS pose (the identity the guard
    // uses), so the gripper is provably unchanged and only the elbow moves.
    const ee = forwardKinematics3D(down, L);
    const phi = Math.atan2(ee.z - L[0], Math.hypot(ee.x, ee.y));
    const up = { q1: down.q1, q2: 2 * phi - down.q2, q3: -down.q3 };

    applyRobotArmPose(rig, down, false);
    const before = readRobotArmWorldPose(rig);
    applyRobotArmPose(rig, up, false);
    const after = readRobotArmWorldPose(rig);

    const gripperMoved = Math.hypot(
      after.gripper.x - before.gripper.x,
      after.gripper.y - before.gripper.y,
      after.gripper.z - before.gripper.z
    );
    const elbowMoved = Math.hypot(
      after.elbow.x - before.elbow.x,
      after.elbow.y - before.elbow.y,
      after.elbow.z - before.elbow.z
    );
    expect(gripperMoved).toBeLessThan(1e-9); // invisible to every Cartesian guard
    expect(elbowMoved).toBeGreaterThan(MAX_DRAWN_ELBOW_STEP_M); // loud in the render trace
    disposeRobotArmRig(rig);
  });
});

describe('RobotArm3DCanvas is wired to the render trace', () => {
  it('records both arms through the shared rig and pose functions', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/ui/components/kinematic/RobotArm3DCanvas.tsx'),
      'utf8'
    );
    expect(source).toContain('createRobotArmRig(true, linkLengths)');
    expect(source).toContain('createRobotArmRig(false, linkLengths)');
    expect(source).toContain('applyRobotArmPose(ricisRigRef.current, ricisState.joints');
    expect(source).toContain('applyRobotArmPose(dlsRigRef.current, dlsState.joints');
    expect(source).toContain("manipulatorRenderTrace.record('RICIS'");
    expect(source).toContain("manipulatorRenderTrace.record('DLS_GHOST'");
    // The pose must be applied BEFORE the trace is read, or the trace lags a frame.
    const applyIdx = source.indexOf('applyRobotArmPose(ricisRigRef.current');
    const recordIdx = source.indexOf("manipulatorRenderTrace.record('RICIS'");
    expect(applyIdx).toBeGreaterThan(-1);
    expect(recordIdx).toBeGreaterThan(applyIdx);
  });
});

describe('the shared render trace is bounded', () => {
  it('evicts oldest frames instead of growing without limit', () => {
    const small = new ManipulatorRenderTrace(4);
    const p = { shoulder: { x: 0, y: 0.4, z: 0 }, elbow: { x: 0.8, y: 0.4, z: 0 }, gripper: { x: 1.5, y: 0.4, z: 0 } };
    for (let i = 0; i < 10; i++) small.record('RICIS', p);
    expect(small.getSnapshot().length).toBe(4);
    expect(small.framesFor('DLS_GHOST').length).toBe(0);
    // the process-wide instance the canvas writes to is bounded too
    expect(manipulatorRenderTrace.getSnapshot().length).toBeLessThanOrEqual(900);
  });
});
