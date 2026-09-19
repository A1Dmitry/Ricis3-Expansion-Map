import type {
  Vector3D,
  IBallEntity,
  IBoxContainer,
  IPickAndPlaceSimulationState,
  PickAndPlacePhase,
} from '../../model/kinematicEngine.contracts';
import { distance3D } from './kinematicMath';
import { BallPhysicsWorld, type IPhysicsBallBody } from './ballPhysics';

/** Hover point just above the settled ball inside the box (post-delivery retreat). */
function boxFloorHover(box: IBoxContainer): Vector3D {
  return {
    x: box.position.x,
    y: box.position.y,
    z: box.position.z - box.dimensions.z / 2 + 0.22,
  };
}

export class PickAndPlaceController {
  private state: IPickAndPlaceSimulationState;
  private currentPhaseTimer = 0;
  private readonly physics: BallPhysicsWorld;
  // Live body of the ball that was just released over the box (free fall + bounce).
  private releasedBody: IPhysicsBallBody | null = null;

  constructor(initialBalls: readonly IBallEntity[], box: IBoxContainer, physics?: BallPhysicsWorld) {
    this.physics = physics ?? new BallPhysicsWorld();
    this.state = {
      phase: 'NAVIGATING_TO_BALL',
      currentTargetBallId: initialBalls[0]?.id ?? null,
      balls: [...initialBalls],
      box: { ...box },
      ballsPlacedCount: 0,
      graspFailuresCount: 0,
    };
  }

  public getState(): IPickAndPlaceSimulationState {
    return this.state;
  }

  public reset(initialBalls: readonly IBallEntity[], box: IBoxContainer): void {
    this.state = {
      phase: 'NAVIGATING_TO_BALL',
      currentTargetBallId: initialBalls[0]?.id ?? null,
      balls: [...initialBalls],
      box: { ...box },
      ballsPlacedCount: 0,
      graspFailuresCount: 0,
    };
    this.currentPhaseTimer = 0;
    this.releasedBody = null;
  }

  /**
   * Step the Pick & Place state machine given the current End-Effector position
   */
  public stepTarget(
    dt: number,
    endEffector: Vector3D
  ): { target: Vector3D; shouldGrip: boolean; eventTriggered?: string } {
    const currentBall = this.state.balls.find(b => b.id === this.state.currentTargetBallId);
    let eventTriggered: string | undefined;

    if (!currentBall || this.state.phase === 'COMPLETED') {
      return {
        target: { x: 0.8, y: 0.0, z: 0.8 },
        shouldGrip: false,
      };
    }

    this.currentPhaseTimer += dt;

    switch (this.state.phase) {
      case 'NAVIGATING_TO_BALL': {
        const hoverTarget: Vector3D = {
          x: currentBall.currentPosition.x,
          y: currentBall.currentPosition.y,
          z: currentBall.currentPosition.z + 0.15,
        };
        const dist = distance3D(endEffector, hoverTarget);
        if (dist < 0.08 || this.currentPhaseTimer > 2.5) {
          this.state = { ...this.state, phase: 'ALIGNING_GRIPPER' };
          this.currentPhaseTimer = 0;
        }
        return { target: hoverTarget, shouldGrip: false };
      }

      case 'ALIGNING_GRIPPER': {
        const graspTarget: Vector3D = {
          x: currentBall.currentPosition.x,
          y: currentBall.currentPosition.y,
          z: currentBall.currentPosition.z + 0.02,
        };
        const dist = distance3D(endEffector, graspTarget);
        if (dist < 0.05 || this.currentPhaseTimer > 1.2) {
          this.state = { ...this.state, phase: 'GRASPING' };
          this.currentPhaseTimer = 0;
        }
        return { target: graspTarget, shouldGrip: false };
      }

      case 'GRASPING': {
        const graspTarget: Vector3D = {
          x: currentBall.currentPosition.x,
          y: currentBall.currentPosition.y,
          z: currentBall.currentPosition.z + 0.02,
        };
        if (this.currentPhaseTimer > 0.4) {
          // Attach ball to end-effector
          const updatedBalls = this.state.balls.map(b =>
            b.id === currentBall.id ? { ...b, status: 'GRASPED' as const } : b
          );
          this.state = { ...this.state, phase: 'LIFTING', balls: updatedBalls };
          this.currentPhaseTimer = 0;
          eventTriggered = `Grasped Ball [${currentBall.id}] ${currentBall.isSingularZone ? '(SINGULARITY BOUNDARY)' : ''}`;
        }
        return { target: graspTarget, shouldGrip: true, eventTriggered };
      }

      case 'LIFTING': {
        const liftTarget: Vector3D = {
          x: endEffector.x,
          y: endEffector.y,
          z: 0.85,
        };
        // Update grasped ball pos
        this.updateGraspedBallPos(endEffector);

        if (this.currentPhaseTimer > 0.8) {
          this.state = { ...this.state, phase: 'TRANSFERRING_TO_BOX' };
          this.currentPhaseTimer = 0;
        }
        return { target: liftTarget, shouldGrip: true };
      }

      case 'TRANSFERRING_TO_BOX': {
        // Safe hover target strictly above the box center
        const boxHoverTarget: Vector3D = {
          x: this.state.box.position.x,
          y: this.state.box.position.y,
          z: this.state.box.position.z + 0.35,
        };
        this.updateGraspedBallPos(endEffector);

        const dist = distance3D(endEffector, boxHoverTarget);
        // Only advance when the arm has genuinely arrived above the box
        if (dist < 0.08 || this.currentPhaseTimer > 4.0) {
          this.state = { ...this.state, phase: 'RELEASING' };
          this.currentPhaseTimer = 0;
        }
        return { target: boxHoverTarget, shouldGrip: true };
      }

      case 'RELEASING': {
        // "Fragile Egg" Protocol: descend to just above the box floor, physically
        // release the ball and let gravity + bounce physics settle it inside the box
        // (no random teleportation — the ball visibly drops and bounces).
        const box = this.state.box;
        const boxFloorZ = box.position.z - box.dimensions.z / 2;

        if (!this.releasedBody) {
          const boxFloorTarget: Vector3D = {
            x: box.position.x,
            y: box.position.y,
            z: boxFloorZ + 0.05,
          };

          // Continually hold ball in gripper during descent
          this.updateGraspedBallPos(endEffector);

          const distToFloor = distance3D(endEffector, boxFloorTarget);

          // Release slightly above the floor so the last centimetres are real physics.
          if (distToFloor < 0.06 || this.currentPhaseTimer > 2.5) {
            const graspedBall = this.state.balls.find(b => b.id === currentBall.id);
            const startPos = graspedBall
              ? graspedBall.currentPosition
              : { x: box.position.x, y: box.position.y, z: boxFloorZ + 0.1 };
            this.releasedBody = this.physics.createBody(startPos, graspedBall?.radius ?? 0.06, {
              x: 0,
              y: 0,
              z: -0.2,
            });
            this.state = {
              ...this.state,
              balls: this.state.balls.map(b =>
                b.id === currentBall.id
                  ? { ...b, status: 'FALLING' as const, velocity: { x: 0, y: 0, z: -0.2 } }
                  : b
              ),
            };
            this.currentPhaseTimer = 0;
            eventTriggered = `Ball [${currentBall.id}] released — free fall & bounce inside the box`;
          } else {
            return { target: boxFloorTarget, shouldGrip: true, eventTriggered };
          }
        }

        // Bounce inside the box until the ball comes to rest.
        const r = this.releasedBody.radius;
        this.releasedBody = this.physics.integrate(this.releasedBody, dt, {
          boxBounds: {
            minX: box.position.x - box.dimensions.x / 2 + r,
            maxX: box.position.x + box.dimensions.x / 2 - r,
            minY: box.position.y - box.dimensions.y / 2 + r,
            maxY: box.position.y + box.dimensions.y / 2 - r,
            floorZ: boxFloorZ,
          },
        });
        this.state = {
          ...this.state,
          balls: this.state.balls.map(b =>
            b.id === currentBall.id
              ? { ...b, currentPosition: { ...this.releasedBody!.position }, velocity: { ...this.releasedBody!.velocity } }
              : b
          ),
        };

        if (this.releasedBody.resting || this.currentPhaseTimer > 3.0) {
          // Ball safely deposited on the bottom of the box (real rest position)
          const finalBody = this.releasedBody;
          this.releasedBody = null;

          const updatedBalls = this.state.balls.map(b =>
            b.id === currentBall.id
              ? {
                  ...b,
                  status: 'IN_BOX' as const,
                  currentPosition: { ...finalBody.position },
                  velocity: { x: 0, y: 0, z: 0 },
                }
              : b
          );

          const nextBall = updatedBalls.find(b => b.status === 'ON_SPAWN');
          const nextPhase: PickAndPlacePhase = nextBall ? 'NAVIGATING_TO_BALL' : 'COMPLETED';

          this.state = {
            ...this.state,
            phase: nextPhase,
            currentTargetBallId: nextBall ? nextBall.id : null,
            balls: updatedBalls,
            ballsPlacedCount: this.state.ballsPlacedCount + 1,
            box: {
              ...this.state.box,
              collectedBallIds: [...this.state.box.collectedBallIds, currentBall.id],
            },
          };
          this.currentPhaseTimer = 0;
          eventTriggered = `Fragile Egg [${currentBall.id}] Settled on the Box Floor after Bounce (RICIS L0 Continuity)`;
          return { target: boxFloorHover(box), shouldGrip: false, eventTriggered };
        }

        // Gentle retreat hover while the ball settles (claw out of the bounce zone).
        return {
          target: { x: box.position.x, y: box.position.y, z: boxFloorZ + 0.22 },
          shouldGrip: false,
          eventTriggered,
        };
      }

      default:
        return { target: { x: 0.8, y: 0.0, z: 0.8 }, shouldGrip: false };
    }
  }

  private updateGraspedBallPos(endEffector: Vector3D): void {
    const ballId = this.state.currentTargetBallId;
    if (!ballId) return;

    this.state = {
      ...this.state,
      balls: this.state.balls.map(b =>
        b.id === ballId && b.status === 'GRASPED'
          ? { ...b, currentPosition: { ...endEffector, z: endEffector.z - 0.04 } }
          : b
      ),
    };
  }
}
