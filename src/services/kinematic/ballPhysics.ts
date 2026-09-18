// ============================================================================
// BALL PHYSICS WORLD (Gravity / Bounce / Box Confinement)
// Minimal deterministic rigid-particle integrator for the kinematic scenarios:
// - free fall under gravity (semi-implicit Euler, stable at 60 FPS),
// - floor bounce with restitution and tangential damping,
// - optional inner-box wall confinement (delivered balls bounce inside the box
//   and come to rest there instead of teleporting),
// - ballistic forward prediction used by the catch-interception planner.
// Pure domain service: no globals, no randomness, fully deterministic.
// ============================================================================

import type { Vector3D } from '../../model/kinematicEngine.contracts';

export interface IPhysicsBallBody {
  readonly position: Vector3D;
  readonly velocity: Vector3D;
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

export class BallPhysicsWorld {
  /** Gravity magnitude (m/s^2). Tuned for a readable, catchable on-screen fall. */
  public readonly gravity: number;
  /** Vertical restitution on bounce (0 = dead, 1 = perfectly elastic). */
  public readonly restitution: number;
  /** Horizontal restitution against box walls. */
  public readonly wallRestitution: number;
  /** Linear air drag coefficient (1/s). */
  public readonly airDrag: number;
  /** Speed below which a floor contact settles to rest (m/s). */
  public readonly settleSpeed: number;

  constructor(params?: {
    gravity?: number;
    restitution?: number;
    wallRestitution?: number;
    airDrag?: number;
    settleSpeed?: number;
  }) {
    this.gravity = params?.gravity ?? 3.2;
    this.restitution = params?.restitution ?? 0.5;
    this.wallRestitution = params?.wallRestitution ?? 0.35;
    this.airDrag = params?.airDrag ?? 0.03;
    this.settleSpeed = params?.settleSpeed ?? 0.12;
  }

  public createBody(position: Vector3D, radius: number, velocity?: Vector3D, resting = false): IPhysicsBallBody {
    return {
      position: { ...position },
      velocity: velocity ? { ...velocity } : { x: 0, y: 0, z: 0 },
      radius,
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
    const drag = Math.max(0, 1 - this.airDrag * dt);

    let vx = body.velocity.x * drag;
    let vy = body.velocity.y * drag;
    let vz = body.velocity.z * drag - this.gravity * dt;

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
      if (impactSpeed > this.settleSpeed) {
        vz = impactSpeed * this.restitution; // bounce upward
        // Tangential impact damping: an indoor court floor kills a good part of the
        // skid speed per bounce, otherwise weak shots roll metres past their mark.
        vx *= 0.6;
        vy *= 0.6;
      } else {
        vz = 0;
        // Rolling/settling: bleed off residual horizontal speed quickly.
        vx *= 0.6;
        vy *= 0.6;
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed < this.settleSpeed) {
          vx = 0;
          vy = 0;
          resting = true;
        }
      }
    }

    return {
      position: { x: px, y: py, z: pz },
      velocity: { x: vx, y: vy, z: vz },
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
