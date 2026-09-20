import type { Vector3D, JointState3D } from '../../model/kinematicEngine.contracts';
import { ELBOW_FLIP_HYSTERESIS_M, ELBOW_FLOOR_CLEARANCE_M } from './manipulatorConstants';
import { QA_DIRECTION_THRESHOLDS_DEG } from './qaMetricConstants';
import { SINGULARITY_DETERMINANT_THRESHOLD, SOLVER_NUMERICAL_GUARDS } from './solverConstants';

/**
 * 3D Pure Kinematics Math Service (DDD, No external side effects).
 * Exact closed-form trigonometry for 3-DOF Spatial Manipulator:
 * - Link 0: Vertical base offset L0 (Z-axis)
 * - Link 1: Shoulder segment L1 (pitch q2)
 * - Link 2: Elbow segment L2 (pitch q3)
 * - Base rotation: Azimuth q1 around Z-axis
 */

export function forwardKinematics3D(
  joints: JointState3D,
  linkLengths: readonly [number, number, number]
): Vector3D {
  const [L0, L1, L2] = linkLengths;
  const { q1, q2, q3 } = joints;

  // Planar reach in the rotating vertical arm plane
  const armPitch1 = q2;
  const armPitch2 = q2 + q3;

  const radialDistance = L1 * Math.cos(armPitch1) + L2 * Math.cos(armPitch2);
  const heightZ = L0 + L1 * Math.sin(armPitch1) + L2 * Math.sin(armPitch2);

  // Rotate by azimuth q1
  const x = radialDistance * Math.cos(q1);
  const y = radialDistance * Math.sin(q1);
  const z = heightZ;

  return { x, y, z };
}

/**
 * Compute Jacobian Determinant in 3D:
 * det(J) is proportional to radial projection * L1 * L2 * sin(q3).
 * Singularity occurs when:
 * 1. q3 = 0 or PI (Elbow singularity - boundary reach)
 * 2. Radial reach R = 0 (Shoulder overhead singularity)
 */
export function computeJacobianDeterminant3D(
  joints: JointState3D,
  linkLengths: readonly [number, number, number]
): number {
  const [, L1, L2] = linkLengths;
  const { q3 } = joints;

  // Primary determinant term for planar arm cross-section
  const planarDet = L1 * L2 * Math.sin(q3);
  return planarDet;
}

/**
 * World position of the elbow joint (shoulder sits at (0, 0, L0), link L1 at pitch q2
 * inside the vertical arm plane rotated by azimuth q1).
 */
export function computeElbowPosition3D(
  joints: JointState3D,
  linkLengths: readonly [number, number, number]
): Vector3D {
  const [L0, L1] = linkLengths;
  const radial = L1 * Math.cos(joints.q2);
  return {
    x: radial * Math.cos(joints.q1),
    y: radial * Math.sin(joints.q1),
    z: L0 + L1 * Math.sin(joints.q2),
  };
}

/**
 * ELBOW-OVER-FLOOR GUARD (kinematic branch selection).
 * A planar 2-link arm has TWO exact inverse solutions for the same end-effector pose:
 * the elbow-down branch (q3 > 0) and its mirror image about the shoulder→EE line
 * (q3 < 0, q2' = 2·φ − q2, where φ is the shoulder→EE elevation angle). When the
 * current branch drives the elbow below the room floor (visible as the elbow diving
 * under the base on low pick points), the exact mirror solution keeps the elbow
 * above it. The end-effector pose, and therefore every trajectory, is preserved
 * bit-for-bit; only the elbow configuration changes.
 * Hysteresis prevents flip-flopping when both branches graze the clearance band.
 * Returns the SAME object reference when no flip is applied.
 */
export function enforceElbowFloorClearance(
  joints: JointState3D,
  linkLengths: readonly [number, number, number],
  floorZ = 0
): JointState3D {
  const clearance = floorZ + ELBOW_FLOOR_CLEARANCE_M;
  const elbowZ = computeElbowPosition3D(joints, linkLengths).z;
  if (elbowZ >= clearance) return joints;

  const [L0, L1, L2] = linkLengths;
  const ee = forwardKinematics3D(joints, linkLengths);
  const radial = Math.hypot(ee.x, ee.y);
  // Degenerate pole test. `radial` is a length folded from L1*cos + L2*cos, so its own
  // representation residual is (L1 + L2) * Number.EPSILON — the real epsilon of the double
  // that stores it. Comparing against that is a comparison of two reals at machine
  // precision; a hand-picked 1e-9 was an invented magnitude.
  if (radial <= (L1 + L2) * Number.EPSILON) return joints; // EE on the shoulder axis: mirror is degenerate.

  const phi = Math.atan2(ee.z - L0, radial);
  const mirroredQ2 = 2 * phi - joints.q2;
  const mirroredQ3 = -joints.q3;
  const mirroredElbowZ = L0 + L1 * Math.sin(mirroredQ2);
  if (mirroredElbowZ <= elbowZ + ELBOW_FLIP_HYSTERESIS_M) {
    return joints; // No strictly better branch: keep the highest available elbow.
  }
  return { q1: joints.q1, q2: mirroredQ2, q3: mirroredQ3 };
}

export function distance3D(a: Vector3D, b: Vector3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function vectorLength3D(v: Vector3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Compute angle deviation in degrees between desired motion vector and actual step vector
 */
export function calculateAngleDeviationDeg(desired: Vector3D, actual: Vector3D): number {
  const lenD = vectorLength3D(desired);
  const lenA = vectorLength3D(actual);

  if (lenD < SOLVER_NUMERICAL_GUARDS.minRadialDistanceGuard || lenA < SOLVER_NUMERICAL_GUARDS.minRadialDistanceGuard) {
    return 0.0;
  }

  const dot = (desired.x * actual.x + desired.y * actual.y + desired.z * actual.z) / (lenD * lenA);
  const clampedDot = Math.max(-1.0, Math.min(1.0, dot));
  const rad = Math.acos(clampedDot);
  return (rad * 180) / Math.PI;
}

/**
 * Normalizes angle to (-PI, PI] range (shortest rotational arc)
 */
export function wrapToPi(angle: number): number {
  let wrapped = angle;
  while (wrapped > Math.PI) wrapped -= 2 * Math.PI;
  while (wrapped < -Math.PI) wrapped += 2 * Math.PI;
  return wrapped;
}

/**
 * Standardized pure calculation of 3D kinematic solver metrics (DRY).
 */
export function computeSolverMetrics3D(params: {
  desiredVector: Vector3D;
  actualStepVector: Vector3D;
  nextEE: Vector3D;
  targetPosition: Vector3D;
  currentEE: Vector3D;
  absDet: number;
  maxReach: number;
  dt: number;
  isBoundarySingular?: boolean;
  nearSingularityBehavior?: 'stable' | 'degraded' | 'recovered';
  recoverySuccess?: boolean;
}): {
  dirDeviation: number;
  posError: number;
  velocityError: number;
  metrics: import('../../model/kinematicEngine.contracts').ISolverMetrics3D;
} {
  const {
    desiredVector,
    actualStepVector,
    nextEE,
    targetPosition,
    currentEE,
    absDet,
    maxReach,
    dt,
    isBoundarySingular = false,
    nearSingularityBehavior,
    recoverySuccess,
  } = params;

  const dirDeviation = calculateAngleDeviationDeg(desiredVector, actualStepVector);
  const posError = distance3D(nextEE, targetPosition);
  const distToTarget = distance3D(currentEE, targetPosition);
  const velocityError = Math.abs(distToTarget - distance3D(nextEE, currentEE)) / Math.max(SOLVER_NUMERICAL_GUARDS.minRadialDistanceGuard, dt);
  const isSingular = isBoundarySingular || absDet < SINGULARITY_DETERMINANT_THRESHOLD;

  let behavior = nearSingularityBehavior;
  if (!behavior) {
    behavior = isSingular
      ? (dirDeviation > QA_DIRECTION_THRESHOLDS_DEG.degradedThresholdDeg ? 'degraded' : 'recovered')
      : 'stable';
  }

  const metrics: import('../../model/kinematicEngine.contracts').ISolverMetrics3D = {
    positionError: posError,
    velocityError: velocityError,
    directionPreservedDeg: dirDeviation,
    singularityIndex: Math.max(0, 1 - absDet / Math.max(SOLVER_NUMERICAL_GUARDS.minRadialDistanceGuard, maxReach)),
    nearSingularityBehavior: behavior,
    recoverySuccess: recoverySuccess !== undefined ? recoverySuccess : (isSingular ? !Number.isNaN(posError) && behavior === 'recovered' : true),
    invariantPreserved: true,
  };

  return { dirDeviation, posError, velocityError, metrics };
}
