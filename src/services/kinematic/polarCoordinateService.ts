import type { Vector3D, CylindricalVector3D, PolarVector2D } from '../../model/kinematicEngine.contracts';

/**
 * Service for working with Polar / Cylindrical coordinates relative to the robot's base origin.
 * Strictly adheres to RICIS-III L1_IDENTITY:
 * When r -> 0 (shoulder singularity x=0, y=0), the angular azimuth theta is preserved
 * from the previous state without limit approximations or indeterminate jump to 0.
 */
export class PolarCoordinateService {
  /**
   * Converts 3D Cartesian coordinates to Cylindrical (r, theta, z) relative to robot origin.
   * If r is near zero, preserves prevThetaRad to satisfy L1_IDENTITY continuity.
   */
  public static cartesianToCylindrical(
    v: Vector3D,
    prevThetaRad = 0
  ): CylindricalVector3D {
    const r = Math.sqrt(v.x * v.x + v.y * v.y);
    
    // RICIS L1_IDENTITY: If r -> 0 (shoulder singularity), preserve orientation
    let thetaRad: number;
    if (r < 1e-6) {
      thetaRad = prevThetaRad;
    } else {
      thetaRad = Math.atan2(v.y, v.x);
    }

    return {
      r,
      thetaRad,
      z: v.z,
    };
  }

  /**
   * Converts Cylindrical coordinates (r, theta, z) to Cartesian (x, y, z).
   */
  public static cylindricalToCartesian(c: CylindricalVector3D): Vector3D {
    const x = c.r * Math.cos(c.thetaRad);
    const y = c.r * Math.sin(c.thetaRad);
    return {
      x,
      y,
      z: c.z,
    };
  }

  /**
   * Computes vertical planar reach from shoulder link origin (L0 height).
   * rho = sqrt(r^2 + (z - L0)^2)
   */
  public static computePlanarReach(r: number, z: number, L0: number): number {
    const dz = z - L0;
    return Math.sqrt(r * r + dz * dz);
  }

  /**
   * Normalizes an angle in radians into the canonical [-PI, PI] range.
   */
  public static normalizeAngle(angleRad: number): number {
    let a = angleRad % (2 * Math.PI);
    if (a > Math.PI) a -= 2 * Math.PI;
    if (a < -Math.PI) a += 2 * Math.PI;
    return a;
  }

  public static radToDeg(rad: number): number {
    return (rad * 180) / Math.PI;
  }

  public static degToRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
