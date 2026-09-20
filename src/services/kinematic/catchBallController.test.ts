// ============================================================================
// CLOSED-LOOP TENNIS-CANNON INTERCEPTION REGRESSION GUARDS
// Two weak pneumatic automatons fire balls with VARYING power into the room;
// balls fly ballistic arcs, bounce off the floor (and walls, if reached);
// the RICIS arm intercepts them mid-air or picks them off the floor.
// Mirrors the live page wiring 1:1 (CatchBallController -> CartesianMotionSmoother
// -> KinematicDualDebuggerEngine at 60 FPS) and proves:
//   - every shot is delivered to the box (6/6),
//   - BOTH user-described outcomes occur: mid-air catches AND floor pickups,
//   - shot power really varies: first-bounce rebound energy spread is wide,
//   - the ball never leaves the room and never tunnels under the floor,
//   - the ELBOW never pierces the floor (branch-aware IK guard),
//   - states stay finite and inside the workspace ball at every step.
// Deterministic: fixed shot plan, no wall-clock, no randomness.
// ============================================================================

import { describe, expect, it } from 'vitest';
import {
  CatchBallController,
  ROOM_HALF_EXTENT_M,
  TENNIS_CANNON_SHOT_PLAN,
} from './catchBallController';
import { CartesianMotionSmoother } from './motionSmoothing';
import { KinematicDualDebuggerEngine } from './polarSolvers';
import { RicisSymbolicJacobianSolver3D } from './kinematicSolvers';
import {
  forwardKinematics3D,
  computeJacobianDeterminant3D,
  computeElbowPosition3D,
} from './kinematicMath';
import type {
  IBoxContainer,
  IKinematicState3D,
} from '../../model/kinematicEngine.contracts';
import { MANIPULATOR_LINK_LENGTHS_M } from './manipulatorConstants';

const LINK_LENGTHS = MANIPULATOR_LINK_LENGTHS_M;
const MAX_REACH = LINK_LENGTHS[1] + LINK_LENGTHS[2];

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

function assertFiniteAndInWorkspace(state: IKinematicState3D, context: string): void {
  const values = [
    state.joints.q1,
    state.joints.q2,
    state.joints.q3,
    state.endEffector.x,
    state.endEffector.y,
    state.endEffector.z,
  ];
  for (const value of values) {
    expect(Number.isFinite(value), `${context}: non-finite state value`).toBe(true);
  }
  const radial = Math.hypot(state.endEffector.x, state.endEffector.y);
  const planar = Math.hypot(radial, state.endEffector.z - LINK_LENGTHS[0]);
  expect(
    planar <= MAX_REACH + 1e-9,
    `${context}: end-effector escaped workspace (${planar.toFixed(4)} > ${MAX_REACH})`
  ).toBe(true);
}

function runCatchClosedLoop(solverMode: 'POLAR_GEOMETRIC' | 'SYMBOLIC_AST') {
  const engine = new KinematicDualDebuggerEngine();
  if (solverMode === 'SYMBOLIC_AST') {
    engine.setRicisSolver(new RicisSymbolicJacobianSolver3D(), 'SYMBOLIC_AST');
  }
  const controller = new CatchBallController(TENNIS_CANNON_SHOT_PLAN, BOX_CONTAINER, LINK_LENGTHS);
  let ricisState = createInitialState();
  let dlsState = createInitialState();
  const smoother = new CartesianMotionSmoother(ricisState.endEffector);

  const dt = 1 / 60;
  const maxSeconds = 300;
  let step = 0;

  let minElbowZ = Infinity;
  let minBallZ = Infinity;
  let maxAbsXY = 0;
  // Per-ball rebound energy proxy: max upward velocity after a floor impact.
  const reboundVzByBall = new Map<string, number>();

  for (; step < maxSeconds * 60; step++) {
    // Exactly the page order: controller anchor -> smoother -> dual engine.
    const catchStep = controller.stepTarget(dt, ricisState.endEffector);
    smoother.setAnchor(catchStep.target);
    const smoothedTarget = smoother.step(dt);

    const result = engine.step(ricisState, dlsState, smoothedTarget, LINK_LENGTHS, dt, 'POLAR');
    ricisState = {
      ...result.ricisResult.nextState,
      gripperClosed: catchStep.shouldGrip,
    };
    dlsState = result.dlsResult.nextState;
    // Rigid grasp: pin the carried ball to the gripper pose the solver actually produced.
    controller.syncCarriedBall(ricisState.endEffector, dt);

    assertFiniteAndInWorkspace(ricisState, `${solverMode} step ${step} (RICIS)`);
    assertFiniteAndInWorkspace(dlsState, `${solverMode} step ${step} (DLS ghost)`);

    // Elbow-over-floor invariant (both arms).
    minElbowZ = Math.min(
      minElbowZ,
      computeElbowPosition3D(ricisState.joints, LINK_LENGTHS).z,
      computeElbowPosition3D(dlsState.joints, LINK_LENGTHS).z
    );

    // Room containment + rebound energy observations for free-flying balls.
    for (const ball of controller.getState().balls) {
      if (ball.status !== 'FALLING') continue;
      minBallZ = Math.min(minBallZ, ball.currentPosition.z);
      maxAbsXY = Math.max(maxAbsXY, Math.abs(ball.currentPosition.x), Math.abs(ball.currentPosition.y));
      const vz = ball.velocity?.z ?? 0;
      if (vz > 0 && ball.currentPosition.z < 0.6) {
        reboundVzByBall.set(ball.id, Math.max(reboundVzByBall.get(ball.id) ?? 0, vz));
      }
    }

    if (controller.getState().phase === 'COMPLETED') break;
  }

  return {
    controller,
    stepsUsed: step,
    maxSteps: maxSeconds * 60,
    minElbowZ,
    minBallZ,
    maxAbsXY,
    reboundVzByBall,
  };
}

describe('Tennis automaton interception scenario (closed loop, page-equivalent)', () => {
  it('POLAR_GEOMETRIC: fires, intercepts or floor-picks and delivers every shot', () => {
    const { controller, stepsUsed, maxSteps, minElbowZ, minBallZ, maxAbsXY, reboundVzByBall } =
      runCatchClosedLoop('POLAR_GEOMETRIC');
    const state = controller.getState();

    expect(stepsUsed, `scenario did not finish within ${maxSteps / 60}s`).toBeLessThan(maxSteps);
    expect(state.phase).toBe('COMPLETED');
    expect(state.droppedCount).toBe(TENNIS_CANNON_SHOT_PLAN.length);
    expect(state.deliveredCount).toBe(TENNIS_CANNON_SHOT_PLAN.length);

    // User's contract: "либо перехватывает на лету, либо собирает с пола" — both must happen.
    expect(state.midAirCatchCount).toBeGreaterThanOrEqual(2);
    expect(state.floorPickupCount).toBeGreaterThanOrEqual(1);

    // Room containment: no ball ever left the room or tunneled under the floor.
    expect(maxAbsXY).toBeLessThanOrEqual(ROOM_HALF_EXTENT_M + 1e-9);
    expect(minBallZ).toBeGreaterThanOrEqual(-1e-9);

    // Elbow never pierced the floor (user-reported defect "локоть уходит под пол").
    // Zero tolerance: the guard enforces the mirrored branch above the floor.
    expect(minElbowZ).toBeGreaterThanOrEqual(0 - 1e-9);

    // Shot power really varies → visibly different rebound energies.
    // (Only shots that hit the floor contribute; at least two must have bounced.)
    expect(reboundVzByBall.size).toBeGreaterThanOrEqual(2);
    const reboundSpeeds = [...reboundVzByBall.values()];
    const spread = Math.max(...reboundSpeeds) - Math.min(...reboundSpeeds);
    expect(spread, `bounce strength must visibly vary (spread ${spread.toFixed(2)} m/s)`).toBeGreaterThan(0.25);

    // Every ball rests inside the box bounds with near-zero velocity.
    for (const ball of state.balls) {
      expect(ball.status).toBe('IN_BOX');
      const halfX = BOX_CONTAINER.dimensions.x / 2;
      const halfY = BOX_CONTAINER.dimensions.y / 2;
      expect(Math.abs(ball.currentPosition.x - BOX_CONTAINER.position.x)).toBeLessThanOrEqual(halfX + 1e-9);
      expect(Math.abs(ball.currentPosition.y - BOX_CONTAINER.position.y)).toBeLessThanOrEqual(halfY + 1e-9);
      const speed = Math.hypot(ball.velocity?.x ?? 0, ball.velocity?.y ?? 0, ball.velocity?.z ?? 0);
      expect(speed).toBeLessThan(0.15);
    }
  });

  it('SYMBOLIC_AST: same scenario completes with the symbolic Jacobian solver', () => {
    const { controller, stepsUsed, maxSteps, minElbowZ, maxAbsXY, minBallZ } =
      runCatchClosedLoop('SYMBOLIC_AST');
    const state = controller.getState();

    expect(stepsUsed, `scenario did not finish within ${maxSteps / 60}s`).toBeLessThan(maxSteps);
    expect(state.phase).toBe('COMPLETED');
    expect(state.deliveredCount).toBe(TENNIS_CANNON_SHOT_PLAN.length);
    expect(state.midAirCatchCount + state.floorPickupCount).toBe(TENNIS_CANNON_SHOT_PLAN.length);
    expect(minElbowZ).toBeGreaterThanOrEqual(0 - 1e-9);
    expect(maxAbsXY).toBeLessThanOrEqual(ROOM_HALF_EXTENT_M + 1e-9);
    expect(minBallZ).toBeGreaterThanOrEqual(-1e-9);
  });
});
