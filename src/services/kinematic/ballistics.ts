// ============================================================================
// BALLISTICS — GENERAL PHYSICS BOUNDED CONTEXT
// ----------------------------------------------------------------------------
// Closed-form projectile solutions. Everything here is derived from the
// equations of motion under uniform gravity; no fitted numbers.
//
// Dependency direction (STRICT_DEVELOPMENT_RULES §4): imports nothing but types.
// ============================================================================

import type { Vector3D } from '../../model/kinematicEngine.contracts';

/** Horizontal component length of a direction vector. */
function horizontalLength(d: Vector3D): number {
  return Math.sqrt(d.x * d.x + d.y * d.y);
}

/**
 * Muzzle speed that makes a shot land its FIRST impact at a given horizontal
 * range, DERIVED in closed form.
 *
 * Launch from P with unit aim d at speed s. With dh = |d_xy| and dz = d.z:
 *
 *     z(t) = Pz + s dz t - 1/2 g t^2 = r        (contact at ball radius r)
 *     R    = s dh t                              (horizontal range)
 *
 * Eliminating t = R / (s dh) gives a linear equation in 1/s^2:
 *
 *     s = (R / dh) * sqrt( g / ( 2 (Pz - r + R dz / dh) ) )
 *
 * The denominator must stay positive: the barrel must not be aimed so far
 * upward that the requested range is unreachable. The caller gets `null` in
 * that case rather than a NaN or a silently clamped speed.
 *
 * @param muzzle       Barrel exit position (m).
 * @param aimDirection Unit vector along the barrel (need not be normalised).
 * @param rangeM       Desired horizontal distance from muzzle to first impact.
 * @param gravityMps2  Environment gravity (m/s^2).
 * @param ballRadiusM  Ball radius; contact happens one radius above the floor.
 * @param floorZ       Floor height (m), default 0.
 */
export function solveMuzzleSpeedForRange(
  muzzle: Vector3D,
  aimDirection: Vector3D,
  rangeM: number,
  gravityMps2: number,
  ballRadiusM: number,
  floorZ = 0
): number | null {
  const aimLength = Math.sqrt(
    aimDirection.x * aimDirection.x +
      aimDirection.y * aimDirection.y +
      aimDirection.z * aimDirection.z
  );
  if (aimLength === 0 || rangeM <= 0 || gravityMps2 <= 0) return null;

  const dh = horizontalLength(aimDirection) / aimLength;
  const dz = aimDirection.z / aimLength;
  if (dh === 0) return null; // straight up/down: no horizontal range exists

  const heightAboveContact = muzzle.z - floorZ - ballRadiusM;
  const denominator = 2 * (heightAboveContact + (rangeM * dz) / dh);
  if (denominator <= 0) return null;

  return (rangeM / dh) * Math.sqrt(gravityMps2 / denominator);
}

/**
 * Horizontal range that puts the first impact at a given distance from the arm
 * base, DERIVED in closed form.
 *
 * The muzzle sits at horizontal position m and the barrel points along the unit
 * horizontal u. The impact point is m + R u, and requiring |m + R u| = rho gives
 *
 *     R^2 + 2 (m.u) R + (|m|^2 - rho^2) = 0
 *     R = -(m.u) -/+ sqrt( (m.u)^2 - (|m|^2 - rho^2) )
 *
 * The two roots are the NEAR landing (short of the base) and the FAR landing
 * (flown past it). They are different physical shots, so the caller must name
 * the branch: taking the far one by accident silently launches the ball across
 * the whole room, which is how a scenario ends up "solving" to an absurd speed.
 *
 * @returns the near-branch range, or null when the ring of radius rho does not
 *          intersect the aim ray.
 */
export function solveRangeForLandingRadius(
  muzzle: Vector3D,
  aimDirection: Vector3D,
  landingRadiusM: number,
  branch: 'near' | 'far' = 'near'
): number | null {
  const dh = horizontalLength(aimDirection);
  if (dh === 0 || landingRadiusM < 0) return null;

  const ux = aimDirection.x / dh;
  const uy = aimDirection.y / dh;
  const mDotU = muzzle.x * ux + muzzle.y * uy;
  const mSquared = muzzle.x * muzzle.x + muzzle.y * muzzle.y;

  const discriminant = mDotU * mDotU - (mSquared - landingRadiusM * landingRadiusM);
  if (discriminant < 0) return null;

  const root = Math.sqrt(discriminant);
  const range = branch === 'near' ? -mDotU - root : -mDotU + root;
  return range > 0 ? range : null;
}

/**
 * Launch velocity vector for a muzzle speed along a unit aim direction.
 * Returns the direction scaled to unit length first, so a non-normalised
 * barrel vector cannot silently change the speed.
 */
export function launchVelocity(aimDirection: Vector3D, speedMps: number): Vector3D {
  const len = Math.sqrt(
    aimDirection.x * aimDirection.x +
      aimDirection.y * aimDirection.y +
      aimDirection.z * aimDirection.z
  );
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return {
    x: (aimDirection.x / len) * speedMps,
    y: (aimDirection.y / len) * speedMps,
    z: (aimDirection.z / len) * speedMps,
  };
}
