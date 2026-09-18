// ============================================================================
// CLOSED-LOOP CATCH-THE-FALLING-BALL REGRESSION GUARDS
// Mirrors the live page wiring 1:1 (CatchBallController -> CartesianMotionSmoother
// -> KinematicDualDebuggerEngine at 60 FPS) and proves that:
//   - balls really fall under gravity and bounce (physics, not scripted motion),
//   - the RICIS arm intercepts them mid-air via ballistic prediction,
//   - every dropped ball is delivered and settles inside the box,
//   - states stay finite and inside the workspace ball at every step.
// Deterministic: fixed drop plan, no wall-clock, no randomness.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { CatchBallController, DEFAULT_CATCH_DROP_PLAN } from './catchBallController';
import { CartesianMotionSmoother } from './motionSmoothing';
import { KinematicDualDebuggerEngine } from './polarSolvers';
import { RicisSymbolicJacobianSolver3D } from './kinematicSolvers';
import { forwardKinematics3D, computeJacobianDeterminant3D } from './kinematicMath';
import type {
  IBoxContainer,
  IKinematicState3D,
} from '../../model/kinematicEngine.contracts';

const LINK_LENGTHS: [number, number, number] = [0.4, 0.8, 0.7];
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
  const controller = new CatchBallController(DEFAULT_CATCH_DROP_PLAN, BOX_CONTAINER, LINK_LENGTHS);
  let ricisState = createInitialState();
  let dlsState = createInitialState();
  const smoother = new CartesianMotionSmoother(ricisState.endEffector);

  const dt = 1 / 60;
  const maxSeconds = 240;
  let maxBallBounceObserved = 0;
  let step = 0;

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

    assertFiniteAndInWorkspace(ricisState, `${solverMode} step ${step} (RICIS)`);
    assertFiniteAndInWorkspace(dlsState, `${solverMode} step ${step} (DLS ghost)`);

    // Observe actual free-fall physics: track maximum bounce height a ball regains.
    for (const ball of controller.getState().balls) {
      if (ball.status === 'FALLING' && (ball.velocity?.z ?? 0) > 0) {
        maxBallBounceObserved = Math.max(maxBallBounceObserved, ball.velocity?.z ?? 0);
      }
    }

    if (controller.getState().phase === 'COMPLETED') break;
  }

  return { controller, stepsUsed: step, maxSteps: maxSeconds * 60, maxBallBounceObserved };
}

describe('Catch-the-falling-ball scenario (closed loop, page-equivalent)', () => {
  it('POLAR_GEOMETRIC: drops, intercepts mid-air and delivers every ball', () => {
    const { controller, stepsUsed, maxSteps, maxBallBounceObserved } = runCatchClosedLoop('POLAR_GEOMETRIC');
    const state = controller.getState();

    expect(stepsUsed, `scenario did not finish within ${maxSteps / 60}s`).toBeLessThan(maxSteps);
    expect(state.phase).toBe('COMPLETED');
    expect(state.droppedCount).toBe(DEFAULT_CATCH_DROP_PLAN.length);
    expect(state.deliveredCount).toBe(DEFAULT_CATCH_DROP_PLAN.length);

    // The headline behavior: mid-air ballistic catches, at most one floor pickup.
    expect(state.midAirCatchCount).toBeGreaterThanOrEqual(3);
    expect(state.floorPickupCount).toBeLessThanOrEqual(1);

    // Physics evidence: at least one ball was seen moving UP after a release/bounce.
    expect(maxBallBounceObserved).toBeGreaterThan(0.05);

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
    const { controller, stepsUsed, maxSteps } = runCatchClosedLoop('SYMBOLIC_AST');
    const state = controller.getState();

    expect(stepsUsed, `scenario did not finish within ${maxSteps / 60}s`).toBeLessThan(maxSteps);
    expect(state.phase).toBe('COMPLETED');
    expect(state.deliveredCount).toBe(DEFAULT_CATCH_DROP_PLAN.length);
    expect(state.midAirCatchCount + state.floorPickupCount).toBe(DEFAULT_CATCH_DROP_PLAN.length);
  });
});
