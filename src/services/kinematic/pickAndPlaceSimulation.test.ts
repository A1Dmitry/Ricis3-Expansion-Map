// ============================================================================
// CLOSED-LOOP KINEMATIC SIMULATION REGRESSION GUARDS
// Drives the real pick-and-place state machine + dual-solver engine exactly the
// way KinematicEnginePage does (60 FPS integration), and asserts the scenario
// actually completes with finite, in-workspace states for BOTH RICIS solver
// implementations. Guards the "kinematics silently dead/simulation never
// finishes" class of regressions that rendering-only tests cannot catch.
// ============================================================================

import { describe, expect, it } from 'vitest';
import {
  KinematicDualDebuggerEngine,
  PolarRicisConstraintSolver,
} from './polarSolvers';
import { RicisSymbolicJacobianSolver3D } from './kinematicSolvers';
import { PickAndPlaceController } from './pickAndPlaceController';
import {
  forwardKinematics3D,
  computeElbowPosition3D,
  computeJacobianDeterminant3D,
} from './kinematicMath';
import type {
  IBallEntity,
  IBoxContainer,
  IKinematicState3D,
  Vector3D,
} from '../../model/kinematicEngine.contracts';

const LINK_LENGTHS: [number, number, number] = [0.4, 0.8, 0.7];
const MAX_REACH = LINK_LENGTHS[1] + LINK_LENGTHS[2]; // 1.5 m by design

// Mirror of the scenario configured in KinematicEnginePage (INITIAL_BALLS / BOX_CONTAINER).
const INITIAL_BALLS: readonly IBallEntity[] = [
  {
    id: 'ball-1-boundary',
    initialPosition: { x: 1.45, y: 0.2, z: 0.1 },
    currentPosition: { x: 1.45, y: 0.2, z: 0.1 },
    radius: 0.06,
    color: '#ef4444',
    status: 'ON_SPAWN',
    isSingularZone: true,
  },
  {
    id: 'ball-2-overhead',
    initialPosition: { x: 0.15, y: 0.1, z: 1.85 },
    currentPosition: { x: 0.15, y: 0.1, z: 1.85 },
    radius: 0.06,
    color: '#f59e0b',
    status: 'ON_SPAWN',
    isSingularZone: true,
  },
  {
    id: 'ball-3-normal',
    initialPosition: { x: 0.8, y: -0.6, z: 0.1 },
    currentPosition: { x: 0.8, y: -0.6, z: 0.1 },
    radius: 0.06,
    color: '#06b6d4',
    status: 'ON_SPAWN',
    isSingularZone: false,
  },
  {
    id: 'ball-4-boundary-2',
    initialPosition: { x: -0.2, y: 1.42, z: 0.2 },
    currentPosition: { x: -0.2, y: 1.42, z: 0.2 },
    radius: 0.06,
    color: '#a855f7',
    status: 'ON_SPAWN',
    isSingularZone: true,
  },
];

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

function assertFiniteState(state: IKinematicState3D, context: string): void {
  const values = [
    state.joints.q1,
    state.joints.q2,
    state.joints.q3,
    state.endEffector.x,
    state.endEffector.y,
    state.endEffector.z,
    state.jacobianDeterminant,
  ];
  for (const value of values) {
    expect(Number.isFinite(value), `${context}: non-finite kinematic state value`).toBe(true);
  }
}

function assertWithinWorkspace(state: IKinematicState3D, context: string): void {
  const radial = Math.hypot(state.endEffector.x, state.endEffector.y);
  const planar = Math.hypot(radial, state.endEffector.z - LINK_LENGTHS[0]);
  // Geometric invariant: |L1·cos + L2·cos| ≤ L1+L2, so the EE can never leave the
  // workspace ball regardless of solver. A violation means corrupted joint state.
  expect(
    planar <= MAX_REACH + 1e-9,
    `${context}: end-effector escaped workspace (planar reach ${planar.toFixed(4)} > ${MAX_REACH})`
  ).toBe(true);
}

function runPickAndPlaceClosedLoop(mode: 'POLAR_GEOMETRIC' | 'SYMBOLIC_AST'): {
  controller: PickAndPlaceController;
  stepsUsed: number;
  maxSteps: number;
  minElbowZ: number;
} {
  const engine = new KinematicDualDebuggerEngine();
  if (mode === 'SYMBOLIC_AST') {
    engine.setRicisSolver(new RicisSymbolicJacobianSolver3D(), 'SYMBOLIC_AST');
  } else {
    engine.setRicisSolver(new PolarRicisConstraintSolver(), 'POLAR_GEOMETRIC');
  }

  const controller = new PickAndPlaceController(INITIAL_BALLS, BOX_CONTAINER);
  let ricisState = createInitialState();
  let dlsState = createInitialState();

  const dt = 1 / 60; // identical to the page loop
  const maxSteps = 90 * 60; // 90 virtual seconds budget (measured: 12s / 23s)

  let step = 0;
  let minElbowZ = Infinity;
  for (; step < maxSteps; step++) {
    const { target } = controller.stepTarget(dt, ricisState.endEffector);
    const result = engine.step(ricisState, dlsState, target, LINK_LENGTHS, dt, 'POLAR');
    ricisState = result.ricisResult.nextState;
    dlsState = result.dlsResult.nextState;

    assertFiniteState(ricisState, `${mode} step ${step} (RICIS)`);
    assertFiniteState(dlsState, `${mode} step ${step} (DLS ghost)`);
    assertWithinWorkspace(ricisState, `${mode} step ${step} (RICIS)`);
    assertWithinWorkspace(dlsState, `${mode} step ${step} (DLS ghost)`);

    // Elbow-over-floor invariant (both arms, user-reported "локоть под пол").
    minElbowZ = Math.min(
      minElbowZ,
      computeElbowPosition3D(ricisState.joints, LINK_LENGTHS).z,
      computeElbowPosition3D(dlsState.joints, LINK_LENGTHS).z
    );

    if (controller.getState().phase === 'COMPLETED') break;
  }

  return { controller, stepsUsed: step, maxSteps, minElbowZ };
}

/**
 * Physics integrity guard: a delivered ball must have come to rest INSIDE the box
 * (free fall + bounce into the box floor, never through it) with near-zero velocity.
 */
function assertDeliveredBallsRestInsideBox(state: {
  balls: ReadonlyArray<{
    status: string;
    currentPosition: { x: number; y: number; z: number };
    velocity?: { x: number; y: number; z: number };
    radius: number;
  }>;
  box: {
    position: { x: number; y: number; z: number };
    dimensions: { x: number; y: number; z: number };
  };
}): void {
  const halfX = state.box.dimensions.x / 2;
  const halfY = state.box.dimensions.y / 2;
  const boxFloorZ = state.box.position.z - state.box.dimensions.z / 2;
  for (const ball of state.balls) {
    expect(Math.abs(ball.currentPosition.x - state.box.position.x)).toBeLessThanOrEqual(halfX + 1e-9);
    expect(Math.abs(ball.currentPosition.y - state.box.position.y)).toBeLessThanOrEqual(halfY + 1e-9);
    // Resting ON the box floor (physics contact plane = boxFloorZ + radius).
    expect(ball.currentPosition.z).toBeGreaterThanOrEqual(boxFloorZ + ball.radius - 1e-9);
    const speed = Math.hypot(ball.velocity?.x ?? 0, ball.velocity?.y ?? 0, ball.velocity?.z ?? 0);
    expect(speed, `delivered ball still moving (|v| = ${speed.toFixed(3)} m/s)`).toBeLessThan(0.15);
  }
}

describe('Closed-loop pick-and-place simulation (solver ↔ controller integration)', () => {
  it('POLAR_GEOMETRIC RICIS solver sorts all 4 balls into the box within the time budget', () => {
    const { controller, stepsUsed, maxSteps, minElbowZ } = runPickAndPlaceClosedLoop('POLAR_GEOMETRIC');

    const state = controller.getState();
    expect(stepsUsed, `scenario did not finish within ${maxSteps} steps`).toBeLessThan(maxSteps);
    expect(state.phase).toBe('COMPLETED');
    expect(state.ballsPlacedCount).toBe(INITIAL_BALLS.length);
    expect(state.box.collectedBallIds).toHaveLength(INITIAL_BALLS.length);
    expect(state.balls.every(b => b.status === 'IN_BOX')).toBe(true);
    assertDeliveredBallsRestInsideBox(state);
    // The elbow never pierces the room floor (mirrored-branch guard).
    expect(minElbowZ).toBeGreaterThanOrEqual(0 - 1e-9);
  });

  it('SYMBOLIC_AST RICIS solver sorts all 4 balls into the box within the time budget', () => {
    const { controller, stepsUsed, maxSteps, minElbowZ } = runPickAndPlaceClosedLoop('SYMBOLIC_AST');

    const state = controller.getState();
    expect(stepsUsed, `scenario did not finish within ${maxSteps} steps`).toBeLessThan(maxSteps);
    expect(state.phase).toBe('COMPLETED');
    expect(state.ballsPlacedCount).toBe(INITIAL_BALLS.length);
    expect(state.box.collectedBallIds).toHaveLength(INITIAL_BALLS.length);
    expect(state.balls.every(b => b.status === 'IN_BOX')).toBe(true);
    assertDeliveredBallsRestInsideBox(state);
    expect(minElbowZ).toBeGreaterThanOrEqual(0 - 1e-9);
  });
});

describe('Singularity boundary orbit scenario (SINGULAR_ORBIT mode)', () => {
  it('tracks the det(J)→0 boundary orbit with finite, in-workspace states and bounded lag', () => {
    const engine = new KinematicDualDebuggerEngine();
    let ricisState = createInitialState();
    let dlsState = createInitialState();

    const dt = 1 / 60;
    let orbitAngle = 0;
    const tailErrors: number[] = [];

    for (let i = 0; i < 40 * 60; i++) {
      orbitAngle += dt * 0.8; // same angular speed as the page scenario
      const orbitRadius = LINK_LENGTHS[1] + LINK_LENGTHS[2] - 0.01;
      const target: Vector3D = {
        x: orbitRadius * Math.cos(orbitAngle),
        y: orbitRadius * Math.sin(orbitAngle),
        z: 0.4 + 0.3 * Math.sin(orbitAngle * 2),
      };

      const result = engine.step(ricisState, dlsState, target, LINK_LENGTHS, dt, 'POLAR');
      ricisState = result.ricisResult.nextState;
      dlsState = result.dlsResult.nextState;

      assertFiniteState(ricisState, `orbit step ${i} (RICIS)`);
      assertFiniteState(dlsState, `orbit step ${i} (DLS ghost)`);
      assertWithinWorkspace(ricisState, `orbit step ${i} (RICIS)`);
      assertWithinWorkspace(dlsState, `orbit step ${i} (DLS ghost)`);

      if (i > 35 * 60) {
        tailErrors.push(result.ricisResult.metrics.positionError);
      }
    }

    // After convergence the RICIS arm rides the boundary with a small constant
    // phase lag (measured ≈0.14 m at 0.8 rad/s); a broken solver diverges or stalls.
    const avgTailError = tailErrors.reduce((sum, e) => sum + e, 0) / tailErrors.length;
    expect(avgTailError).toBeLessThan(0.3);
    expect(Math.max(...tailErrors)).toBeLessThan(0.35);
  });
});
