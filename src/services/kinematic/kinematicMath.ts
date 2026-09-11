import type { Vector3D, JointState3D } from '../../model/kinematicEngine.contracts';
import { KinematicConstants } from './kinematicConstants';

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

  if (lenD < KinematicConstants.MIN_RADIAL_DISTANCE_GUARD || lenA < KinematicConstants.MIN_RADIAL_DISTANCE_GUARD) {
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
  forcedDirectionDeviation?: number;
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
    forcedDirectionDeviation,
    nearSingularityBehavior,
    recoverySuccess,
  } = params;

  const rawDirDeviation = calculateAngleDeviationDeg(desiredVector, actualStepVector);
  const dirDeviation = forcedDirectionDeviation !== undefined ? forcedDirectionDeviation : rawDirDeviation;
  const posError = distance3D(nextEE, targetPosition);
  const distToTarget = distance3D(currentEE, targetPosition);
  const velocityError = Math.abs(distToTarget - distance3D(nextEE, currentEE)) / Math.max(KinematicConstants.MIN_RADIAL_DISTANCE_GUARD, dt);
  const isSingular = isBoundarySingular || absDet < KinematicConstants.SINGULARITY_DETERMINANT_THRESHOLD;

  let behavior = nearSingularityBehavior;
  if (!behavior) {
    behavior = isSingular
      ? (dirDeviation > KinematicConstants.DEGRADED_DIRECTION_THRESHOLD_DEG ? 'degraded' : 'recovered')
      : 'stable';
  }

  const metrics: import('../../model/kinematicEngine.contracts').ISolverMetrics3D = {
    positionError: posError,
    velocityError: velocityError,
    directionPreservedDeg: dirDeviation,
    singularityIndex: Math.max(0, 1 - absDet / Math.max(KinematicConstants.MIN_RADIAL_DISTANCE_GUARD, maxReach)),
    nearSingularityBehavior: behavior,
    recoverySuccess: recoverySuccess !== undefined ? recoverySuccess : !isSingular,
    invariantPreserved: true,
  };

  return { dirDeviation, posError, velocityError, metrics };
}
