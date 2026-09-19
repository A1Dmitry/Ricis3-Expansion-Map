// ============================================================================
// INTERCEPTION BENCHMARK HARNESS (LLM-benchmark specification, Variant 2 lane)
// Runs the RICIS/geometric pipeline (trajectory prediction -> reachable intercept
// point+time -> analytical IK -> synchronized S-curve motion -> FK verification ->
// execution) against the standardized scenario battery and a seeded
// UNKNOWN SCENARIO batch, measuring the objective score table:
//   IK error, catch rate, prediction error, timing error, joint-limit violations,
//   collision violations, motion smoothness, replanning, unreachable detection,
//   determinism. Same inputs, same physics, same manipulator, same time for every
//   lane — that is the benchmark contract.
// Pure domain service: seeded PRNG, fixed 60 FPS clock, no randomness leaks.
// ============================================================================

import type {
  IBoxContainer,
  IKinematicState3D,
  Vector3D,
} from '../../model/kinematicEngine.contracts';
import { BallPhysicsWorld } from './ballPhysics';
import { CartesianMotionSmoother } from './motionSmoothing';
import {
  CatchBallController,
  ROOM_HALF_EXTENT_M,
  type ICatchDropPlanEntry,
} from './catchBallController';
import { KinematicDualDebuggerEngine } from './polarSolvers';
import {
  forwardKinematics3D,
  computeElbowPosition3D,
  computeJacobianDeterminant3D,
  distance3D,
} from './kinematicMath';
import { KinematicConstants } from './kinematicConstants';

// --------------------------------------------------------------------------
// Scenario specification (the benchmark's frozen input format)
// --------------------------------------------------------------------------

export interface IInterceptionScenarioSpec {
  readonly id: string;
  readonly name: string;
  readonly ballPosition: Vector3D;
  readonly ballVelocity: Vector3D;
  readonly restitution: number;
  readonly gravity?: number;
  /** Specification expectation: 'CATCH' (mid-air or floor pickup), 'UNREACHABLE'. */
  readonly expected: 'CATCH' | 'UNREACHABLE';
}

export const BENCHMARK_LINK_LENGTHS: readonly [number, number, number] = [0.4, 0.8, 0.7];
export const BENCHMARK_BOX: IBoxContainer = {
  position: { x: -0.6, y: -0.6, z: 0.15 },
  dimensions: { x: 0.45, y: 0.45, z: 0.3 },
  collectedBallIds: [],
};

/** The standardized 10-case battery from the benchmark specification (Tests C–E). */
export const INTERCEPTION_SCENARIO_BATTERY: readonly IInterceptionScenarioSpec[] = [
  {
    id: 'T01-slow', name: 'медленный шар',
    ballPosition: { x: 1.6, y: 0.4, z: 1.35 }, ballVelocity: { x: -0.85, y: -0.25, z: 0.55 },
    restitution: 0.5, expected: 'CATCH',
  },
  {
    id: 'T02-fast', name: 'быстрый шар',
    ballPosition: { x: 1.9, y: 0.3, z: 1.3 }, ballVelocity: { x: -1.85, y: -0.28, z: 1.28 },
    restitution: 0.5, expected: 'CATCH',
  },
  {
    id: 'T03-high-lob', name: 'высокий бросок',
    ballPosition: { x: 1.5, y: -0.5, z: 1.7 }, ballVelocity: { x: -0.6, y: 0.25, z: 1.9 },
    restitution: 0.5, expected: 'CATCH',
  },
  {
    id: 'T04-low-throw', name: 'низкий бросок',
    ballPosition: { x: 1.7, y: 0.2, z: 0.6 }, ballVelocity: { x: -1.35, y: -0.35, z: 0.22 },
    restitution: 0.5, expected: 'CATCH',
  },
  {
    id: 'T05-bounce', name: 'ранний отскок',
    ballPosition: { x: -1.8, y: 1.1, z: 0.9 }, ballVelocity: { x: 1.35, y: -0.65, z: -1.15 },
    restitution: 0.55, expected: 'CATCH',
  },
  {
    id: 'T06-lateral', name: 'боковая скорость',
    ballPosition: { x: 0.9, y: -1.9, z: 1.15 }, ballVelocity: { x: -0.35, y: 1.62, z: 0.72 },
    restitution: 0.5, expected: 'CATCH',
  },
  {
    id: 'T07-multi-bounce', name: 'несколько отскоков',
    ballPosition: { x: 2.0, y: -0.8, z: 1.05 }, ballVelocity: { x: -1.45, y: 0.55, z: 0.38 },
    restitution: 0.68, expected: 'CATCH',
  },
  {
    id: 'T08-unreachable', name: 'недостижимый шар',
    ballPosition: { x: -0.3, y: -1.2, z: 1.3 }, ballVelocity: { x: -0.9, y: -1.35, z: 0.4 },
    restitution: 0.5, expected: 'UNREACHABLE',
  },
  {
    id: 'T09-too-fast', name: 'слишком быстрый шар',
    ballPosition: { x: -1.6, y: 1.4, z: 0.75 }, ballVelocity: { x: 3.6, y: -3.4, z: -0.5 },
    restitution: 0.55, expected: 'UNREACHABLE',
  },
  {
    id: 'T10-free-form', name: 'свободный замес',
    ballPosition: { x: -1.2, y: -1.6, z: 1.55 }, ballVelocity: { x: 1.05, y: 1.28, z: 0.65 },
    restitution: 0.6, expected: 'CATCH',
  },
];

// --------------------------------------------------------------------------
// UNKNOWN SCENARIO generator (seeded, deterministic — reproducible CI runs)
// --------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded UNKNOWN SCENARIO batch: ball position, launch velocity, elevation,
 * restitution — the system knows NOTHING about them beforehand and must run the
 * full observe -> predict -> select -> IK -> trajectory -> catch pipeline.
 */
export function generateUnknownScenarioBatch(seed: number, count: number): readonly IInterceptionScenarioSpec[] {
  const rand = mulberry32(seed);
  const specs: IInterceptionScenarioSpec[] = [];
  for (let i = 0; i < count; i++) {
    // Spawn on the wall band (near room walls), muzzle-style, at varied heights.
    const wallSide = Math.floor(rand() * 4);
    const along = -1.9 + rand() * 3.4;
    const wallInset = ROOM_HALF_EXTENT_M - 0.15;
    const position: Vector3D =
      wallSide === 0 ? { x: wallInset, y: along, z: 0.7 + rand() * 1.1 }
      : wallSide === 1 ? { x: -wallInset, y: along, z: 0.7 + rand() * 1.1 }
      : wallSide === 2 ? { x: along, y: wallInset, z: 0.7 + rand() * 1.1 }
      : { x: along, y: -wallInset, z: 0.7 + rand() * 1.1 };

    // Aim roughly into the workspace with jitter, elevation 8–40 deg, power 1.3–3.2 m/s.
    const aimX = -0.3 + rand() * 0.9;
    const aimY = -0.3 + rand() * 0.9;
    const speed = 1.3 + rand() * 1.9;
    const elev = (8 + rand() * 32) * Math.PI / 180;
    const dx = aimX - position.x;
    const dy = aimY - position.y;
    const dxy = Math.hypot(dx, dy);
    const velocity: Vector3D = {
      x: (dx / dxy) * speed * Math.cos(elev),
      y: (dy / dxy) * speed * Math.cos(elev),
      z: speed * Math.sin(elev),
    };
    const restitution = 0.3 + rand() * 0.4;
    specs.push({
      id: `U${String(i + 1).padStart(2, '0')}-seed${seed}`,
      name: `UNKNOWN #${i + 1} (seed ${seed})`,
      ballPosition: position,
      ballVelocity: velocity,
      restitution,
      expected: 'CATCH', // graded passively: either outcome is honest, catch-rate is the metric
    });
  }
  return specs;
}

// --------------------------------------------------------------------------
// Metrics
// --------------------------------------------------------------------------

export type InterceptionOutcome = 'MID_AIR' | 'FLOOR_PICKUP' | 'UNREACHABLE' | 'TIMEOUT';

export interface IInterceptionScenarioResult {
  readonly spec: IInterceptionScenarioSpec;
  readonly outcome: InterceptionOutcome;
  /** Expectation satisfied (UNREACHABLE-detected counts as correct for UNREACHABLE specs). */
  readonly expectationMet: boolean;
  readonly graspTimeSec: number | null;
  /** |EE − ball| at the grasp instant (combined IK+timing precision). */
  readonly ikErrorM: number | null;
  /** |first feasible predicted intercept point − actual grasp point|. */
  readonly predictionErrorM: number | null;
  /** |predicted intercept epoch (absolute scenario clock) − actual grasp epoch|. */
  readonly timingErrorSec: number | null;
  readonly jointLimitViolations: number;
  readonly collisionViolations: number;
  /** Max |angular acceleration| of any joint over the run (rad/s^2). */
  readonly maxJointAccelRadS2: number;
  /** Planner re-selected a materially different intercept point. */
  readonly replanCount: number;
  /** FK self-consistency: max |FK(joints) − reported EE| drift over the run. */
  readonly maxFkDriftM: number;
  readonly stepsSimulated: number;
}

export interface IInterceptionBenchmarkReport {
  readonly scenarios: readonly IInterceptionScenarioResult[];
  readonly totalScenarios: number;
  readonly catchCount: number;
  readonly unreachableDetected: number;
  readonly expectationViolations: readonly string[];
  readonly catchRateExpected: number;
  readonly meanIkErrorM: number | null;
  readonly meanPredictionErrorM: number | null;
  readonly meanTimingErrorSec: number | null;
  readonly totalJointLimitViolations: number;
  readonly totalCollisionViolations: number;
  readonly maxJointAccelRadS2: number;
  readonly totalReplans: number;
  readonly maxFkDriftM: number;
  /** Determinism: hashing the outcome vector twice yields identical strings. */
  readonly determinismSignature: string;
}

interface ICapturedGrasp {
  timeSec: number;
  ballPos: Vector3D;
  eePos: Vector3D;
}

/** Run ONE scenario through the exact live pipeline (controller -> smoother -> engine). */
export function runInterceptionScenario(spec: IInterceptionScenarioSpec): IInterceptionScenarioResult {
  const physics = new BallPhysicsWorld({ gravity: spec.gravity ?? 3.2, restitution: spec.restitution });
  const plan: readonly ICatchDropPlanEntry[] = [{
    spawnPosition: spec.ballPosition,
    spawnDelaySec: 0.5,
    color: '#38bdf8',
    initialVelocity: spec.ballVelocity,
    cannonId: 'BENCH',
    muzzleSpeedMps: Math.hypot(spec.ballVelocity.x, spec.ballVelocity.y, spec.ballVelocity.z),
  }];
  const controller = new CatchBallController(plan, BENCHMARK_BOX, BENCHMARK_LINK_LENGTHS, physics);
  const engine = new KinematicDualDebuggerEngine();

  const joints0 = { q1: 0.35, q2: 0.6, q3: 1.2 };
  const makeState = (): IKinematicState3D => ({
    timestamp: 0,
    joints: { ...joints0 },
    endEffector: forwardKinematics3D(joints0, BENCHMARK_LINK_LENGTHS),
    jacobianDeterminant: computeJacobianDeterminant3D(joints0, BENCHMARK_LINK_LENGTHS),
    isSingularZone: false,
    isWorkspaceBoundaryExceeded: false,
    gripperClosed: false,
  });
  let ricisState = makeState();
  let dlsState = makeState();
  const smoother = new CartesianMotionSmoother(ricisState.endEffector);

  const dt = 1 / 60;
  const maxSteps = 30 * 60; // 30 virtual seconds hard cap per scenario

  let outcome: InterceptionOutcome | null = null;
  let grasp: ICapturedGrasp | null = null;
  let firstPlan: { point: Vector3D; timeSec: number; plannedAtSec: number } | null = null;
  let prevPlanPoint: Vector3D | null = null;
  let replanCount = 0;
  let jointLimitViolations = 0;
  let collisionViolations = 0;
  let maxJointAccel = 0;
  let maxFkDrift = 0;
  let prevJointsVel = { q1: 0, q2: 0, q3: 0 };
  let prevJoints = joints0;
  let steps = 0;

  const baselineState = controller.getState();

  for (; steps < maxSteps; steps++) {
    const catchStep = controller.stepTarget(dt, ricisState.endEffector);
    smoother.setAnchor(catchStep.target);
    const smoothedTarget = smoother.step(dt);

    const result = engine.step(ricisState, dlsState, smoothedTarget, BENCHMARK_LINK_LENGTHS, dt, 'POLAR');
    ricisState = { ...result.ricisResult.nextState, gripperClosed: catchStep.shouldGrip };
    dlsState = result.dlsResult.nextState;

    const state = controller.getState();

    // --- grasp / outcome detection via counters deltas ---------------------
    const midAirDelta = state.midAirCatchCount - baselineState.midAirCatchCount;
    const floorDelta = state.floorPickupCount - baselineState.floorPickupCount;
    const unreachDelta = state.unreachableCount - baselineState.unreachableCount;
    if (!grasp && (midAirDelta > 0 || floorDelta > 0)) {
      const activeBall = state.balls.find(b => b.id === state.activeBallId) ?? state.balls[state.balls.length - 1];
      grasp = {
        timeSec: steps * dt,
        ballPos: activeBall ? { ...activeBall.currentPosition } : { ...ricisState.endEffector },
        eePos: { ...ricisState.endEffector },
      };
      outcome = midAirDelta > 0 ? 'MID_AIR' : 'FLOOR_PICKUP';
    }
    if (!outcome && unreachDelta > 0) {
      outcome = 'UNREACHABLE';
    }

    // --- planner observation (first feasible intercept + replans) ----------
    const planNow = controller.getLastInterceptPlan();
    if (planNow) {
      if (!firstPlan) firstPlan = { ...planNow };
      if (prevPlanPoint && distance3D(prevPlanPoint, planNow.point) > 0.02) replanCount++;
      prevPlanPoint = planNow.point;
    }

    // --- violations & quality metrics --------------------------------------
    const q3 = ricisState.joints.q3;
    if (
      q3 < KinematicConstants.MIN_ELBOW_UP_JOINT_LIMIT_RAD - 1e-9 ||
      q3 > Math.PI - KinematicConstants.MAX_ELBOW_JOINT_LIMIT_OFFSET_RAD + 1e-9
    ) {
      jointLimitViolations++;
    }
    const elbowZ = computeElbowPosition3D(ricisState.joints, BENCHMARK_LINK_LENGTHS).z;
    if (elbowZ < -1e-9 || ricisState.endEffector.z < -1e-9) collisionViolations++;

    const fkDrift = distance3D(
      forwardKinematics3D(ricisState.joints, BENCHMARK_LINK_LENGTHS),
      ricisState.endEffector
    );
    maxFkDrift = Math.max(maxFkDrift, fkDrift);

    const jVel = {
      q1: (ricisState.joints.q1 - prevJoints.q1) / dt,
      q2: (ricisState.joints.q2 - prevJoints.q2) / dt,
      q3: (ricisState.joints.q3 - prevJoints.q3) / dt,
    };
    const accel = Math.max(
      Math.abs(jVel.q1 - prevJointsVel.q1),
      Math.abs(jVel.q2 - prevJointsVel.q2),
      Math.abs(jVel.q3 - prevJointsVel.q3)
    ) / dt;
    maxJointAccel = Math.max(maxJointAccel, accel);
    prevJoints = ricisState.joints;
    prevJointsVel = jVel;

    if (state.phase === 'COMPLETED') break;
  }

  if (!outcome) outcome = 'TIMEOUT';

  const expectationMet =
    spec.expected === 'UNREACHABLE'
      ? outcome === 'UNREACHABLE'
      : outcome === 'MID_AIR' || outcome === 'FLOOR_PICKUP';

  return {
    spec,
    outcome,
    expectationMet,
    graspTimeSec: grasp?.timeSec ?? null,
    ikErrorM: grasp ? distance3D(grasp.eePos, grasp.ballPos) : null,
    predictionErrorM: grasp && firstPlan ? distance3D(firstPlan.point, grasp.ballPos) : null,
    timingErrorSec:
      grasp && firstPlan ? Math.abs(firstPlan.plannedAtSec + firstPlan.timeSec - grasp.timeSec) : null,
    jointLimitViolations,
    collisionViolations,
    maxJointAccelRadS2: maxJointAccel,
    replanCount,
    maxFkDriftM: maxFkDrift,
    stepsSimulated: steps,
  };
}

/** Run a whole batch and aggregate the objective score table. */
export function runInterceptionBenchmark(specs: readonly IInterceptionScenarioSpec[]): IInterceptionBenchmarkReport {
  const results = specs.map(runInterceptionScenario);

  const catchCount = results.filter(r => r.outcome === 'MID_AIR' || r.outcome === 'FLOOR_PICKUP').length;
  const unreachableDetected = results.filter(r => r.outcome === 'UNREACHABLE').length;
  const expectationViolations = results.filter(r => !r.expectationMet).map(r => r.spec.id);
  const expectedCatchable = results.filter(r => r.spec.expected === 'CATCH');
  const catchRateExpected =
    expectedCatchable.length === 0
      ? 1
      : expectedCatchable.filter(r => r.outcome === 'MID_AIR' || r.outcome === 'FLOOR_PICKUP').length /
        expectedCatchable.length;

  const mean = (values: Array<number | null>): number | null => {
    const present = values.filter((v): v is number => v !== null);
    return present.length === 0 ? null : present.reduce((a, b) => a + b, 0) / present.length;
  };

  return {
    scenarios: results,
    totalScenarios: results.length,
    catchCount,
    unreachableDetected,
    expectationViolations,
    catchRateExpected,
    meanIkErrorM: mean(results.map(r => r.ikErrorM)),
    meanPredictionErrorM: mean(results.map(r => r.predictionErrorM)),
    meanTimingErrorSec: mean(results.map(r => r.timingErrorSec)),
    totalJointLimitViolations: results.reduce((a, r) => a + r.jointLimitViolations, 0),
    totalCollisionViolations: results.reduce((a, r) => a + r.collisionViolations, 0),
    maxJointAccelRadS2: Math.max(...results.map(r => r.maxJointAccelRadS2)),
    totalReplans: results.reduce((a, r) => a + r.replanCount, 0),
    maxFkDriftM: Math.max(...results.map(r => r.maxFkDriftM)),
    determinismSignature: results
      .map(r => `${r.spec.id}:${r.outcome}:${r.graspTimeSec === null ? '-' : r.graspTimeSec.toFixed(2)}`)
      .join('|'),
  };
}
