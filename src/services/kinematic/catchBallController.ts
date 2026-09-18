// ============================================================================
// CATCH-THE-FALLING-BALL CONTROLLER (Ballistic Prediction & Interception)
// Scenario state machine (DDD, deterministic, no wall-clock / randomness):
//   IDLE_WAIT -> INTERCEPTING -> CARRYING_TO_BOX -> RELEASING -> next drop / COMPLETED
// A ball is dropped from height, falls under gravity and bounces off the floor.
// The arm is driven to a ballistic intercept point predicted by forward
// simulation; a valid catch happens mid-air (or as a floor pickup fallback).
// Released balls drop into the box with real bounce physics before resting.
// ============================================================================

import type {
  IBallEntity,
  IBoxContainer,
  Vector3D,
} from '../../model/kinematicEngine.contracts';
import { distance3D } from './kinematicMath';
import { BallPhysicsWorld, type IBoxBounceBounds, type IPhysicsBallBody } from './ballPhysics';

export interface ICatchDropPlanEntry {
  readonly spawnPosition: Vector3D;
  readonly spawnDelaySec: number;
  readonly color: string;
  readonly isSingularZone?: boolean;
  /** Initial launch velocity (cannon shot); zero/absent means a pure gravity drop. */
  readonly initialVelocity?: Vector3D;
  /** Which tennis automaton fired this ball ('A' | 'B'); informational. */
  readonly cannonId?: string;
  /** Muzzle speed of the shot (m/s, informational — power varies per shot). */
  readonly muzzleSpeedMps?: number;
}

/** A tennis-ball automaton prop in the room (used by the 3D canvas and the shot plan). */
export interface ITennisCannonProp {
  readonly id: string;
  /** Base (breech) position of the cannon, metres. */
  readonly basePosition: Vector3D;
  /** Muzzle (ball exit) position, metres. */
  readonly muzzlePosition: Vector3D;
  /** Unit aiming direction of the barrel. */
  readonly aimDirection: Vector3D;
}

// ----------------------------------------------------------------------------
// ROOM & TENNIS AUTOMATONS (shared between the scenario controller and the canvas)
// ----------------------------------------------------------------------------

/** Room half-extent in X/Y (m): interior walls live at ±ROOM_HALF_EXTENT_M. */
export const ROOM_HALF_EXTENT_M = 2.4;
/** Room ceiling height (m). */
export const ROOM_HEIGHT_M = 2.8;

export const TENNIS_CANNONS: readonly ITennisCannonProp[] = [
  {
    id: 'A',
    basePosition: { x: 2.28, y: 0.55, z: 1.35 },
    muzzlePosition: { x: 2.28, y: 0.55, z: 1.35 },
    aimDirection: { x: -0.8419, y: -0.3547, z: 0.4067 },
  },
  {
    id: 'B',
    basePosition: { x: 0.75, y: 2.28, z: 0.62 },
    muzzlePosition: { x: 0.75, y: 2.28, z: 0.62 },
    aimDirection: { x: -0.1333, y: -0.8889, z: 0.4384 },
  },
];

/**
 * Deterministic 6-shot scenario for two weak pneumatic tennis automatons.
 * Shot power VARIES per shot (1.45–2.05 m/s muzzle) and the two cannons have very
 * different muzzle heights (1.35 m vs 0.62 m), so balls rebound with visibly
 * different energies (first-bounce apex ~0.2 m for the low unit vs ~0.4 m for the
 * high unit — measured by the closed-loop guard). Every shot settles inside the
 * room and inside the arm's reach (validated headlessly).
 */
export const TENNIS_CANNON_SHOT_PLAN: readonly ICatchDropPlanEntry[] = [
  {
    spawnPosition: { x: 2.28, y: 0.55, z: 1.35 },
    spawnDelaySec: 1.2,
    color: '#ef4444',
    initialVelocity: { x: -1.3333, y: -0.5229, z: 0.2268 },
    cannonId: 'A',
    muzzleSpeedMps: 1.45,
  },
  {
    spawnPosition: { x: 0.75, y: 2.28, z: 0.62 },
    spawnDelaySec: 1.6,
    color: '#f59e0b',
    initialVelocity: { x: -0.4298, y: -1.6647, z: 1.1165 },
    cannonId: 'B',
    muzzleSpeedMps: 2.05,
    isSingularZone: true,
  },
  {
    spawnPosition: { x: 2.28, y: 0.55, z: 1.35 },
    spawnDelaySec: 1.6,
    color: '#06b6d4',
    initialVelocity: { x: -1.4474, y: -0.6214, z: 1.0625 },
    cannonId: 'A',
    muzzleSpeedMps: 1.9,
  },
  {
    spawnPosition: { x: 0.75, y: 2.28, z: 0.62 },
    spawnDelaySec: 1.6,
    color: '#a855f7',
    initialVelocity: { x: -0.1190, y: -1.4517, z: 0.5301 },
    cannonId: 'B',
    muzzleSpeedMps: 1.55,
    isSingularZone: true,
  },
  {
    spawnPosition: { x: 2.28, y: 0.55, z: 1.35 },
    spawnDelaySec: 1.6,
    color: '#22c55e',
    initialVelocity: { x: -1.3648, y: -0.5522, z: 0.8500 },
    cannonId: 'A',
    muzzleSpeedMps: 1.7,
  },
  {
    spawnPosition: { x: 0.75, y: 2.28, z: 0.62 },
    spawnDelaySec: 1.6,
    color: '#eab308',
    initialVelocity: { x: -0.3204, y: -1.5858, z: 0.7891 },
    cannonId: 'B',
    muzzleSpeedMps: 1.8,
  },
];

export type CatchPhase =
  | 'IDLE_WAIT'
  | 'INTERCEPTING'
  | 'CARRYING_TO_BOX'
  | 'RELEASING'
  | 'COMPLETED';

export interface ICatchBallSimulationState {
  readonly phase: CatchPhase;
  readonly balls: readonly IBallEntity[];
  readonly box: IBoxContainer;
  readonly activeBallId: string | null;
  readonly totalPlannedDrops: number;
  readonly droppedCount: number;
  readonly midAirCatchCount: number;
  readonly floorPickupCount: number;
  /** Balls that came to rest OUTSIDE the arm's reachable space (declared, never chased forever). */
  readonly unreachableCount: number;
  readonly deliveredCount: number;
}

/** Latest intercept plan chosen by the ballistic planner (benchmark/metrics readout). */
export interface IInterceptPlan {
  readonly point: Vector3D;
  /** Predicted seconds from the planning instant until the ball arrives at the point. */
  readonly timeSec: number;
  /** Planning instant (scenario clock, seconds). */
  readonly plannedAtSec: number;
}

const CATCH_MIN_Z = 0.3;
const CATCH_MAX_Z = 1.15;
const GRASP_RADIUS = 0.12;
const FLOOR_PICK_RADIUS = 0.07;
/** Effective closed-loop arm speed used for feasibility (servo + smoothing, m/s). */
const ARM_SPEED_ESTIMATE = 1.05;
/** Prediction horizon and resolution for the ballistic intercept search. */
const PREDICTION_HORIZON_SEC = 4.0;
const PREDICTION_SAMPLE_DT = 1 / 120;

export class CatchBallController {
  private state: ICatchBallSimulationState;
  private readonly bodies = new Map<string, IPhysicsBallBody>();
  private readonly physics: BallPhysicsWorld;
  private readonly dropPlan: readonly ICatchDropPlanEntry[];
  private readonly linkLengths: readonly [number, number, number];
  private phaseTimer = 0;
  private dropIndex = 0;
  private releasedBody: IPhysicsBallBody | null = null;
  private scenarioTimeSec = 0;
  private lastInterceptPlan: IInterceptPlan | null = null;

  constructor(
    dropPlan: readonly ICatchDropPlanEntry[],
    box: IBoxContainer,
    linkLengths: readonly [number, number, number] = [0.4, 0.8, 0.7],
    physics: BallPhysicsWorld = new BallPhysicsWorld()
  ) {
    this.dropPlan = dropPlan;
    this.linkLengths = linkLengths;
    this.physics = physics;
    this.state = {
      phase: 'IDLE_WAIT',
      balls: [],
      box: { ...box },
      activeBallId: null,
      totalPlannedDrops: dropPlan.length,
      droppedCount: 0,
      midAirCatchCount: 0,
      floorPickupCount: 0,
      unreachableCount: 0,
      deliveredCount: 0,
    };
  }

  public getState(): ICatchBallSimulationState {
    return this.state;
  }

  /** Latest feasible airborne intercept the planner is steering towards (null while none). */
  public getLastInterceptPlan(): IInterceptPlan | null {
    return this.lastInterceptPlan;
  }

  public reset(box: IBoxContainer): void {
    this.bodies.clear();
    this.phaseTimer = 0;
    this.dropIndex = 0;
    this.releasedBody = null;
    this.scenarioTimeSec = 0;
    this.lastInterceptPlan = null;
    this.state = {
      phase: 'IDLE_WAIT',
      balls: [],
      box: { ...box },
      activeBallId: null,
      totalPlannedDrops: this.dropPlan.length,
      droppedCount: 0,
      midAirCatchCount: 0,
      floorPickupCount: 0,
      unreachableCount: 0,
      deliveredCount: 0,
    };
  }

  /**
   * Step the scenario by dt given the current end-effector position.
   * Returns the anchor target for the arm (to be smoothed upstream) and the gripper intent.
   */
  public stepTarget(
    dt: number,
    endEffector: Vector3D
  ): { target: Vector3D; shouldGrip: boolean; eventTriggered?: string } {
    this.phaseTimer += dt;
    this.scenarioTimeSec += dt;

    switch (this.state.phase) {
      case 'IDLE_WAIT':
        return this.stepIdleWait();

      case 'INTERCEPTING':
        return this.stepIntercepting(dt, endEffector);

      case 'CARRYING_TO_BOX':
        return this.stepCarrying(endEffector);

      case 'RELEASING':
        return this.stepReleasing(dt, endEffector);

      case 'COMPLETED':
      default:
        // Park the arm away from the workspace edge once the scenario is done.
        return { target: { x: 0.45, y: 0.0, z: 0.9 }, shouldGrip: false };
    }
  }

  // --------------------------------------------------------------------------
  // Phases
  // --------------------------------------------------------------------------

  private boxHoverTarget(): Vector3D {
    return {
      x: this.state.box.position.x,
      y: this.state.box.position.y,
      z: this.state.box.position.z + 0.35,
    };
  }

  private stepIdleWait(): { target: Vector3D; shouldGrip: boolean; eventTriggered?: string } {
    if (this.dropIndex >= this.dropPlan.length) {
      this.state = { ...this.state, phase: 'COMPLETED' };
      return { target: { x: 0.45, y: 0.0, z: 0.9 }, shouldGrip: false };
    }
    const nextDrop = this.dropPlan[this.dropIndex]!;
    if (this.phaseTimer < nextDrop.spawnDelaySec) {
      // Stage the arm near the box between drops (short travel to the next intercept).
      return { target: this.boxHoverTarget(), shouldGrip: false };
    }

    // Fire/drop the ball.
    const ballId = `shot-ball-${this.dropIndex + 1}`;
    const launchVelocity = nextDrop.initialVelocity ?? { x: 0, y: 0, z: 0 };
    const newBall: IBallEntity = {
      id: ballId,
      initialPosition: { ...nextDrop.spawnPosition },
      currentPosition: { ...nextDrop.spawnPosition },
      radius: 0.06,
      color: nextDrop.color,
      status: 'FALLING',
      isSingularZone: nextDrop.isSingularZone ?? false,
      velocity: { ...launchVelocity },
    };
    this.bodies.set(
      ballId,
      this.physics.createBody(nextDrop.spawnPosition, newBall.radius, launchVelocity)
    );
    this.state = {
      ...this.state,
      phase: 'INTERCEPTING',
      balls: [...this.state.balls, newBall],
      activeBallId: ballId,
      droppedCount: this.state.droppedCount + 1,
    };
    this.phaseTimer = 0;
    return {
      target: this.boxHoverTarget(),
      shouldGrip: false,
      eventTriggered: nextDrop.cannonId
        ? `Tennis automaton [${nextDrop.cannonId}] fired ball [${ballId}] at ${(nextDrop.muzzleSpeedMps ?? 0).toFixed(2)} m/s — ballistic interception engaged`
        : `Ball [${ballId}] dropped from z=${nextDrop.spawnPosition.z.toFixed(2)}m — ballistic interception engaged`,
    };
  }

  private stepIntercepting(
    dt: number,
    endEffector: Vector3D
  ): { target: Vector3D; shouldGrip: boolean; eventTriggered?: string } {
    const ballId = this.state.activeBallId;
    let body = ballId ? this.bodies.get(ballId) : undefined;
    if (!ballId || !body) {
      this.state = { ...this.state, phase: 'IDLE_WAIT' };
      this.phaseTimer = 0;
      return { target: this.boxHoverTarget(), shouldGrip: false };
    }

    // Integrate live physics of the flying ball, confined by the room
    // (floor bounce + wall rebounds — the ball can never leave the room).
    body = this.physics.integrate(body, dt, { boxBounds: this.roomBallBounds() });
    this.bodies.set(ballId, body);
    this.syncBallFromBody(ballId, body);

    const ballPos = body.position;

    // Mid-air catch: the end-effector reached the falling ball.
    if (!body.resting && distance3D(endEffector, ballPos) < GRASP_RADIUS) {
      return this.graspBall(ballId, false);
    }

    // Floor pickup fallback when the ball bounced and settled on the floor.
    if (body.resting) {
      const pickupTarget: Vector3D = { x: ballPos.x, y: ballPos.y, z: ballPos.z + 0.02 };

      // UNREACHABLE DETECTION (benchmark row): the ball rests outside the reach
      // envelope — declare it instead of chasing forever. The scenario advances.
      if (!this.isReachable(pickupTarget)) {
        return this.declareUnreachable(ballId, ballPos);
      }

      if (distance3D(endEffector, pickupTarget) < FLOOR_PICK_RADIUS + 0.03) {
        return this.graspBall(ballId, true);
      }
      return { target: pickupTarget, shouldGrip: false };
    }

    // Ballistic intercept anchor (predicted future ball position the arm can reach in time).
    const intercept = this.planIntercept(body, endEffector);
    return { target: intercept, shouldGrip: false };
  }

  private graspBall(
    ballId: string,
    fromFloor: boolean
  ): { target: Vector3D; shouldGrip: boolean; eventTriggered?: string } {
    this.lastInterceptPlan = null;
    this.state = {
      ...this.state,
      phase: 'CARRYING_TO_BOX',
      balls: this.state.balls.map(b => (b.id === ballId ? { ...b, status: 'GRASPED' as const } : b)),
      midAirCatchCount: this.state.midAirCatchCount + (fromFloor ? 0 : 1),
      floorPickupCount: this.state.floorPickupCount + (fromFloor ? 1 : 0),
    };
    this.phaseTimer = 0;
    return {
      target: this.boxHoverTarget(),
      shouldGrip: true,
      eventTriggered: fromFloor
        ? `Ball [${ballId}] picked up from the floor (interception missed)`
        : `Ball [${ballId}] CAUGHT MID-AIR by ballistic interception`,
    };
  }

  private stepCarrying(endEffector: Vector3D): {
    target: Vector3D;
    shouldGrip: boolean;
    eventTriggered?: string;
  } {
    this.followGripper(endEffector);
    const hover = this.boxHoverTarget();
    const horizontalToBox = Math.hypot(hover.x - endEffector.x, hover.y - endEffector.y);
    // CLIMB BEFORE TRAVEL: going straight from a floor pickup to the box crosses
    // near the base axis (pole region), where the arm folds onto itself (q3 → ±π)
    // and the elbow grazes the floor in both inverse branches. Lifting the load
    // straight up first keeps the transit configuration elevated and graceful —
    // exactly how a human lifts a ball before carrying it across the room.
    if (horizontalToBox > 0.25 && endEffector.z < 0.85) {
      return { target: { x: endEffector.x, y: endEffector.y, z: 0.95 }, shouldGrip: true };
    }
    if (distance3D(endEffector, hover) < 0.09 || this.phaseTimer > 4.0) {
      this.state = { ...this.state, phase: 'RELEASING' };
      this.phaseTimer = 0;
    }
    return { target: hover, shouldGrip: true };
  }

  private stepReleasing(
    dt: number,
    endEffector: Vector3D
  ): { target: Vector3D; shouldGrip: boolean; eventTriggered?: string } {
    const box = this.state.box;
    const boxFloorZ = box.position.z - box.dimensions.z / 2;
    const ballId = this.state.activeBallId;
    let eventTriggered: string | undefined;

    if (!this.releasedBody) {
      // Descend towards the box floor, still holding the ball.
      const boxFloorTarget: Vector3D = { x: box.position.x, y: box.position.y, z: boxFloorZ + 0.05 };
      this.followGripper(endEffector);
      if (distance3D(endEffector, boxFloorTarget) < 0.07 || this.phaseTimer > 2.5) {
        // Physical release a few centimetres above the floor: visible drop + bounce.
        const ball = this.state.balls.find(b => b.id === ballId);
        const startPos = ball ? ball.currentPosition : { x: box.position.x, y: box.position.y, z: boxFloorZ + 0.1 };
        this.releasedBody = this.physics.createBody(startPos, ball?.radius ?? 0.06, { x: 0, y: 0, z: -0.2 });
        this.state = {
          ...this.state,
          balls: this.state.balls.map(b =>
            b.id === ballId ? { ...b, status: 'FALLING' as const, velocity: { x: 0, y: 0, z: -0.2 } } : b
          ),
        };
        this.phaseTimer = 0;
        eventTriggered = `Ball [${ballId}] released — free fall & bounce inside the box`;
      } else {
        return { target: boxFloorTarget, shouldGrip: true };
      }
    }

    // Bounce inside the box until rest.
    const r = this.releasedBody!.radius;
    this.releasedBody = this.physics.integrate(this.releasedBody!, dt, {
      boxBounds: {
        minX: box.position.x - box.dimensions.x / 2 + r,
        maxX: box.position.x + box.dimensions.x / 2 - r,
        minY: box.position.y - box.dimensions.y / 2 + r,
        maxY: box.position.y + box.dimensions.y / 2 - r,
        floorZ: boxFloorZ,
      },
    });
    this.syncBallFromBody(ballId!, this.releasedBody);

    if (this.releasedBody.resting || this.phaseTimer > 3.0) {
      const finalBody = this.releasedBody;
      this.releasedBody = null;
      this.state = {
        ...this.state,
        phase: 'IDLE_WAIT',
        activeBallId: null,
        balls: this.state.balls.map(b =>
          b.id === ballId
            ? { ...b, status: 'IN_BOX' as const, currentPosition: { ...finalBody.position }, velocity: { x: 0, y: 0, z: 0 } }
            : b
        ),
        box: { ...box, collectedBallIds: [...box.collectedBallIds, ballId!] },
        deliveredCount: this.state.deliveredCount + 1,
      };
      this.dropIndex += 1;
      this.phaseTimer = 0;
      eventTriggered = `Ball [${ballId}] settled in the box (delivered ${this.state.deliveredCount}/${this.state.totalPlannedDrops})`;
      return { target: this.boxHoverTarget(), shouldGrip: false, eventTriggered };
    }

    // Gentle retreat hover while the ball settles (keeps the claw out of the bounce zone).
    return {
      target: { x: box.position.x, y: box.position.y, z: boxFloorZ + 0.22 },
      shouldGrip: false,
      eventTriggered,
    };
  }

  // --------------------------------------------------------------------------
  // Ballistic interception planning
  // --------------------------------------------------------------------------

  /** Radius-inset room bounds for ball confinement (walls + floor, open concept: the ceiling is never reached by weak shots). */
  private roomBallBounds(): IBoxBounceBounds {
    const r = 0.06;
    return {
      minX: -ROOM_HALF_EXTENT_M + r,
      maxX: ROOM_HALF_EXTENT_M - r,
      minY: -ROOM_HALF_EXTENT_M + r,
      maxY: ROOM_HALF_EXTENT_M - r,
      floorZ: 0,
    };
  }

  /** Reach-envelope check for a ball pickup point (annulus about the arm's shoulder). */
  private isReachable(point: Vector3D): boolean {
    const [L0, L1, L2] = this.linkLengths;
    const radial = Math.hypot(point.x, point.y);
    const reach = Math.hypot(radial, point.z - L0);
    const maxReach = L1 + L2 - 0.06;
    const minReach = 0.25;
    return reach <= maxReach && reach >= minReach;
  }

  /** Declare the resting ball unreachable: count it, mark it, advance the scenario. */
  private declareUnreachable(
    ballId: string,
    ballPos: Vector3D
  ): { target: Vector3D; shouldGrip: boolean; eventTriggered?: string } {
    this.lastInterceptPlan = null;
    this.state = {
      ...this.state,
      phase: 'IDLE_WAIT',
      activeBallId: null,
      unreachableCount: this.state.unreachableCount + 1,
      balls: this.state.balls.map(b =>
        b.id === ballId ? { ...b, status: 'UNREACHABLE' as const } : b
      ),
    };
    this.dropIndex += 1;
    this.phaseTimer = 0;
    return {
      target: this.boxHoverTarget(),
      shouldGrip: false,
      eventTriggered: `Ball [${ballId}] declared UNREACHABLE (rest at (${ballPos.x.toFixed(2)}, ${ballPos.y.toFixed(2)}) is outside the reach envelope) — scenario continues`,
    };
  }

  private planIntercept(body: IPhysicsBallBody, endEffector: Vector3D): Vector3D {
    const [L0, L1, L2] = this.linkLengths;
    const maxReach = L1 + L2 - 0.06;
    const minReach = 0.25;

    // Prediction must use the SAME room confinement as the live integration
    // (wall rebounds change the post-bounce path the arm tries to meet).
    const samples = this.physics.predictTrajectory(body, PREDICTION_HORIZON_SEC, PREDICTION_SAMPLE_DT, {
      boxBounds: this.roomBallBounds(),
    });

    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i]!;
      const t = (i + 1) * PREDICTION_SAMPLE_DT;
      const p = sample.position;
      if (p.z < CATCH_MIN_Z || p.z > CATCH_MAX_Z) continue;

      const radial = Math.hypot(p.x, p.y);
      const reach = Math.hypot(radial, p.z - L0);
      if (reach > maxReach || reach < minReach) continue;

      const armTime = distance3D(endEffector, p) / ARM_SPEED_ESTIMATE;
      if (armTime <= t * 0.94) {
        this.lastInterceptPlan = { point: { x: p.x, y: p.y, z: p.z }, timeSec: t, plannedAtSec: this.scenarioTimeSec };
        return { x: p.x, y: p.y, z: p.z };
      }
    }

    // No feasible airborne intercept: pre-position above the predicted floor contact point.
    this.lastInterceptPlan = null;
    const last = samples[samples.length - 1];
    const px = last ? last.position.x : body.position.x;
    const py = last ? last.position.y : body.position.y;
    return { x: px, y: py, z: CATCH_MIN_Z + 0.05 };
  }

  // --------------------------------------------------------------------------
  // Ball state synchronization
  // --------------------------------------------------------------------------

  private followGripper(endEffector: Vector3D): void {
    const ballId = this.state.activeBallId;
    if (!ballId) return;
    const carryPos: Vector3D = { x: endEffector.x, y: endEffector.y, z: endEffector.z - 0.04 };
    this.state = {
      ...this.state,
      balls: this.state.balls.map(b =>
        b.id === ballId && b.status === 'GRASPED'
          ? { ...b, currentPosition: carryPos, velocity: { x: 0, y: 0, z: 0 } }
          : b
      ),
    };
  }

  private syncBallFromBody(ballId: string, body: IPhysicsBallBody): void {
    this.state = {
      ...this.state,
      balls: this.state.balls.map(b =>
        b.id === ballId ? { ...b, currentPosition: { ...body.position }, velocity: { ...body.velocity } } : b
      ),
    };
  }
}
