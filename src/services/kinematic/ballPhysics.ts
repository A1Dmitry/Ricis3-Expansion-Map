// ============================================================================
// BALL PHYSICS WORLD — INTEGRATOR (application service)
// ----------------------------------------------------------------------------
// A deterministic rigid-body integrator for the kinematic scenarios:
//   - free fall under the ENVIRONMENT's gravity (semi-implicit Euler),
//   - quadratic aerodynamic drag F = 1/2 rho Cd A |v| v,
//   - floor/wall contact with restitution and Coulomb friction,
//   - ballistic forward prediction for the interception planner.
//
// DDD: this file holds NO physical constants. Gravity and air density come from
// the environment (physicalEnvironment.ts); mass, radius, restitution, drag and
// friction come from the material (projectileMaterial.ts). The integrator only
// applies laws. Changing planet or ball is a different injected value object,
// never an edit here.
//
// Pure domain service: no globals, no randomness, fully deterministic.
// ============================================================================

import type { Vector3D } from '../../model/kinematicEngine.contracts';
import {
  EARTH_SURFACE,
  resolveEnvironment,
  type IPhysicalEnvironment,
} from './physicalEnvironment';
import {
  BOX_WALL_RESTITUTION,
  TENNIS_BALL,
  type IProjectileMaterial,
} from './projectileMaterial';

export interface IPhysicsBallBody {
  readonly position: Vector3D;
  readonly velocity: Vector3D;
  /** Inertial mass (kg). Gravity is mass-independent; drag is not. */
  readonly massKg: number;
  readonly radius: number;
  readonly resting: boolean;
}

export interface IBoxBounceBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly floorZ: number;
}

export interface IPhysicsIntegrateOptions {
  /** Floor height (default 0 — the room floor). Wins over boxBounds.floorZ when both given. */
  readonly floorZ?: number;
  /**
   * When present, the ball is confined inside an open-top box (inner bounds, already
   * radius-inset). The box floor becomes the contact plane unless floorZ overrides it.
   */
  readonly boxBounds?: IBoxBounceBounds;
}

export interface IBallPhysicsWorldParams {
  /** The world the simulation runs in. Defaults to Earth, sea level. */
  readonly environment?: IPhysicalEnvironment;
  /** The body being simulated. Defaults to an ITF tennis ball. */
  readonly material?: IProjectileMaterial;
  /** Restitution of the confining box walls (defaults to the wooden box value). */
  readonly wallRestitution?: number;
}

export class BallPhysicsWorld {
  /** The environment: gravity and air density. External, injected, Earth by default. */
  public readonly environment: IPhysicalEnvironment;
  /** The body: mass, radius, restitution, drag, friction. */
  public readonly material: IProjectileMaterial;
  /** Restitution against the confining box walls. */
  public readonly wallRestitution: number;

  /**
   * Inverse ballistic length k = rho Cd A / (2 m)  [1/m].
   *
   * Drag acceleration is a = k |v| v, so k is the single quantity that combines
   * the atmosphere (rho), the shape (Cd, A) and the INERTIA (m). This is why
   * mass matters: a heavier body of the same size decelerates less.
   */
  private readonly inverseBallisticLength: number;

  constructor(params?: IBallPhysicsWorldParams) {
    this.environment = resolveEnvironment(params?.environment);
    this.material = params?.material ?? TENNIS_BALL;
    this.wallRestitution = params?.wallRestitution ?? BOX_WALL_RESTITUTION;
    this.inverseBallisticLength =
      (this.environment.airDensityKgpsm3 *
        this.material.dragCoefficient *
        this.material.crossSectionM2) /
      (2 * this.material.massKg);
  }

  /** Gravity magnitude actually applied (m/s^2). Read from the environment. */
  public get gravity(): number {
    return this.environment.gravityMps2;
  }

  /** Coefficient of restitution actually applied. Read from the material. */
  public get restitution(): number {
    return this.material.restitution;
  }

  public createBody(position: Vector3D, velocity?: Vector3D, resting = false): IPhysicsBallBody {
    return {
      position: { ...position },
      velocity: velocity ? { ...velocity } : { x: 0, y: 0, z: 0 },
      massKg: this.material.massKg,
      radius: this.material.radiusM,
      resting,
    };
  }

  /** Advance one body by dt (semi-implicit Euler). Resting bodies are returned unchanged. */
  public integrate(body: IPhysicsBallBody, dt: number, opts?: IPhysicsIntegrateOptions): IPhysicsBallBody {
    if (body.resting || dt <= 0) return body;

    // Floor contact plane: an explicit floorZ wins; otherwise a confining box
    // implies its own floor (a ball dropped INTO a box rests on the box floor,
    // it must never fall through onto the room floor); default is the room floor.
    const floorZ = opts?.floorZ ?? opts?.boxBounds?.floorZ ?? 0;

    const speed = Math.sqrt(
      body.velocity.x * body.velocity.x +
        body.velocity.y * body.velocity.y +
        body.velocity.z * body.velocity.z
    );
    // Quadratic drag: a_drag = -k |v| v. Applied as a velocity factor per step.
    const dragFactor = Math.max(0, 1 - this.inverseBallisticLength * speed * dt);

    let vx = body.velocity.x * dragFactor;
    let vy = body.velocity.y * dragFactor;
    // Gravity is the environment's, directed along -Z. It is NOT mass-dependent:
    // in vacuum a tennis ball and a bowling ball fall identically.
    let vz = body.velocity.z * dragFactor - this.gravity * dt;

    let px = body.position.x + vx * dt;
    let py = body.position.y + vy * dt;
    let pz = body.position.z + vz * dt;
    let resting = false;

    // Box wall confinement (radius-inset inner bounds, open top)
    if (opts?.boxBounds) {
      const b = opts.boxBounds;
      if (px < b.minX) { px = b.minX; vx = -vx * this.wallRestitution; }
      if (px > b.maxX) { px = b.maxX; vx = -vx * this.wallRestitution; }
      if (py < b.minY) { py = b.minY; vy = -vy * this.wallRestitution; }
      if (py > b.maxY) { py = b.maxY; vy = -vy * this.wallRestitution; }
    }

    // Floor contact with bounce / rest transition
    const floorContactZ = floorZ + body.radius;
    if (pz <= floorContactZ) {
      pz = floorContactZ;
      const impactSpeed = Math.abs(vz);

      // Rest criterion, DERIVED rather than tuned.
      //
      // A rebound leaves the floor at v' = e * |v_n| and reaches the apex
      //     h = v'^2 / (2 g).
      // In one integration step gravity alone covers d = g dt^2 / 2. A rebound
      // whose apex is lower than d cannot be represented at this resolution, so
      // it IS rest:
      //     h <= d  <=>  (e v)^2 / (2 g) <= g dt^2 / 2  <=>  v <= g dt / e.
      //
      // The bound is not arbitrary: a body already at rest re-enters contact
      // every step with exactly |v_n| = g dt, and g dt <= g dt / e holds for any
      // e <= 1, so rest is a stable state rather than an endless micro-bounce.
      // It also scales with the planet and the material, as it must.
      const settleSpeed = (this.gravity * dt) / this.restitution;

      if (impactSpeed > settleSpeed) {
        vz = impactSpeed * this.restitution; // bounce upward

        // Coulomb friction at impact. The normal impulse per unit mass is
        // (1 + e) |v_n|; dry friction bounds the tangential impulse by mu times
        // that, so the tangential speed may drop by at most mu (1 + e) |v_n|.
        // Friction arrests a skid, it can never reverse it — hence the clamp.
        const maxTangentialLoss =
          this.material.slidingFriction * (1 + this.restitution) * impactSpeed;
        const tangentialSpeed = Math.sqrt(vx * vx + vy * vy);
        if (tangentialSpeed <= maxTangentialLoss) {
          vx = 0;
          vy = 0;
        } else {
          const kept = (tangentialSpeed - maxTangentialLoss) / tangentialSpeed;
          vx *= kept;
          vy *= kept;
        }
      } else {
        vz = 0;
        // Rolling resistance: a = C_rr * g, the standard rolling-resistance law.
        const rollingDecel = this.material.rollingResistance * this.gravity * dt;
        const tangential = Math.sqrt(vx * vx + vy * vy);
        if (tangential <= rollingDecel) {
          vx = 0;
          vy = 0;
          resting = true;
        } else {
          const kept = (tangential - rollingDecel) / tangential;
          vx *= kept;
          vy *= kept;
        }
      }
    }

    return {
      position: { x: px, y: py, z: pz },
      velocity: { x: vx, y: vy, z: vz },
      massKg: body.massKg,
      radius: body.radius,
      resting,
    };
  }

  /**
   * Ballistic prediction samples (bounce-inclusive) for interception planning.
   * Returns position samples at `sampleDt` intervals over `horizonSec`.
   */
  public predictTrajectory(
    body: IPhysicsBallBody,
    horizonSec: number,
    sampleDt: number,
    opts?: IPhysicsIntegrateOptions
  ): readonly IPhysicsBallBody[] {
    const samples: IPhysicsBallBody[] = [];
    let current = body;
    const steps = Math.max(1, Math.ceil(horizonSec / sampleDt));
    for (let i = 0; i < steps; i++) {
      current = this.integrate(current, sampleDt, opts);
      samples.push(current);
      if (current.resting) break;
    }
    return samples;
  }
}
