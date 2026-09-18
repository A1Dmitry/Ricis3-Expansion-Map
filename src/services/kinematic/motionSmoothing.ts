// ============================================================================
// CARTESIAN MOTION SMOOTHER (S-Curve Velocity Profile / Trapezoidal Speed Law)
// Converts discrete waypoint anchors (phase machine jumps, slider drags, orbit
// targets) into a C1-continuous, acceleration-limited target stream. The arm
// then flies to the goal along a near-straight path, rotating every joint
// simultaneously and uniformly — no teleporting targets, no corner cutting.
// Pure domain service: O(1) per step, no side effects, fully deterministic.
// ============================================================================

import type { Vector3D } from '../../model/kinematicEngine.contracts';

export interface IMotionProfileConfig {
  /** Maximum Cartesian speed of the smoothed target point (m/s). */
  readonly maxSpeed: number;
  /** Maximum Cartesian acceleration of the smoothed target point (m/s^2). */
  readonly maxAccel: number;
  /** Position/velocity epsilon below which the point is considered settled (m, m/s). */
  readonly settleEps: number;
}

export const DEFAULT_MOTION_PROFILE: IMotionProfileConfig = {
  maxSpeed: 1.6,
  maxAccel: 6.0,
  settleEps: 0.004,
};

export class CartesianMotionSmoother {
  private pos: Vector3D;
  private vel: Vector3D;
  private anchor: Vector3D;
  private readonly config: IMotionProfileConfig;

  constructor(initialPosition: Vector3D, config: IMotionProfileConfig = DEFAULT_MOTION_PROFILE) {
    this.config = config;
    this.pos = { ...initialPosition };
    this.vel = { x: 0, y: 0, z: 0 };
    this.anchor = { ...initialPosition };
  }

  /** Hard-reset the smoothed point (simulation reset): zero velocity, anchor at the pose. */
  public reset(position: Vector3D): void {
    this.pos = { ...position };
    this.vel = { x: 0, y: 0, z: 0 };
    this.anchor = { ...position };
  }

  /** Update the goal the smoothed point is travelling towards (continuity is preserved). */
  public setAnchor(target: Vector3D): void {
    this.anchor = { ...target };
  }

  public getPosition(): Vector3D {
    return { ...this.pos };
  }

  public getVelocity(): Vector3D {
    return { ...this.vel };
  }

  public isSettled(): boolean {
    return (
      this.distance(this.pos, this.anchor) < this.config.settleEps &&
      this.length(this.vel) < this.config.settleEps
    );
  }

  /**
   * Advance the smoothed point by dt.
   * Speed law: v_des = min(v_max, sqrt(2 * a_max * remaining_dist)) — the classical
   * trapezoidal/braking profile, applied to the velocity VECTOR with an acceleration
   * clamp, so direction changes (anchor jumps) are rounded rather than instantaneous.
   */
  public step(dt: number): Vector3D {
    if (dt <= 0) return { ...this.pos };
    const { maxSpeed, maxAccel, settleEps } = this.config;

    const toGoal = {
      x: this.anchor.x - this.pos.x,
      y: this.anchor.y - this.pos.y,
      z: this.anchor.z - this.pos.z,
    };
    const dist = this.length(toGoal);

    if (dist < settleEps && this.length(this.vel) < settleEps) {
      // Settled: snap the residual micrometres to kill numerical drift.
      this.pos = { ...this.anchor };
      this.vel = { x: 0, y: 0, z: 0 };
      return { ...this.pos };
    }

    // Desired velocity magnitude: braking curve to arrive exactly at the anchor.
    const brakeLimitedSpeed = Math.sqrt(2 * maxAccel * Math.max(0, dist - settleEps));
    const desiredSpeed = Math.min(maxSpeed, brakeLimitedSpeed);

    const invDist = dist > 1e-9 ? 1 / dist : 0;
    const desiredVel = {
      x: toGoal.x * invDist * desiredSpeed,
      y: toGoal.y * invDist * desiredSpeed,
      z: toGoal.z * invDist * desiredSpeed,
    };

    // Acceleration clamp on the velocity vector.
    const dv = {
      x: desiredVel.x - this.vel.x,
      y: desiredVel.y - this.vel.y,
      z: desiredVel.z - this.vel.z,
    };
    const dvLen = this.length(dv);
    const maxDv = maxAccel * dt;
    const scale = dvLen > maxDv && dvLen > 0 ? maxDv / dvLen : 1;

    this.vel = {
      x: this.vel.x + dv.x * scale,
      y: this.vel.y + dv.y * scale,
      z: this.vel.z + dv.z * scale,
    };

    this.pos = {
      x: this.pos.x + this.vel.x * dt,
      y: this.pos.y + this.vel.y * dt,
      z: this.pos.z + this.vel.z * dt,
    };

    // Hard anti-overshoot guard: if this step CROSSED the anchor plane along the
    // travel direction (discrete braking-law overshoot), land exactly and stop.
    if (dist > 1e-9) {
      const signedAfter =
        (this.anchor.x - this.pos.x) * toGoal.x * invDist +
        (this.anchor.y - this.pos.y) * toGoal.y * invDist +
        (this.anchor.z - this.pos.z) * toGoal.z * invDist;
      if (signedAfter <= 0) {
        this.pos = { ...this.anchor };
        this.vel = { x: 0, y: 0, z: 0 };
      }
    }

    return { ...this.pos };
  }

  private length(v: Vector3D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  private distance(a: Vector3D, b: Vector3D): number {
    return this.length({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
  }
}
