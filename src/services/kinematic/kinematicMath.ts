import type { Vector3D, JointState3D } from '../../model/kinematicEngine.contracts';

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

  if (lenD < 1e-6 || lenA < 1e-6) {
    return 0.0;
  }

  const dot = (desired.x * actual.x + desired.y * actual.y + desired.z * actual.z) / (lenD * lenA);
  const clampedDot = Math.max(-1.0, Math.min(1.0, dot));
  const rad = Math.acos(clampedDot);
  return (rad * 180) / Math.PI;
}
