import type {
  Vector3D,
  IBallEntity,
  IBoxContainer,
  IPickAndPlaceSimulationState,
  PickAndPlacePhase,
} from '../../model/kinematicEngine.contracts';
import { distance3D } from './kinematicMath';

export class PickAndPlaceController {
  private state: IPickAndPlaceSimulationState;
  private currentPhaseTimer = 0;

  constructor(initialBalls: readonly IBallEntity[], box: IBoxContainer) {
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
        const boxDropTarget: Vector3D = {
          x: this.state.box.position.x,
          y: this.state.box.position.y,
          z: this.state.box.position.z + 0.4,
        };
        this.updateGraspedBallPos(endEffector);

        const dist = distance3D(endEffector, boxDropTarget);
        if (dist < 0.1 || this.currentPhaseTimer > 3.0) {
          this.state = { ...this.state, phase: 'RELEASING' };
          this.currentPhaseTimer = 0;
        }
        return { target: boxDropTarget, shouldGrip: true };
      }

      case 'RELEASING': {
        const boxDropTarget: Vector3D = {
          x: this.state.box.position.x,
          y: this.state.box.position.y,
          z: this.state.box.position.z + 0.15,
        };
        if (this.currentPhaseTimer > 0.4) {
          // Ball in box
          const updatedBalls = this.state.balls.map(b =>
            b.id === currentBall.id
              ? {
                  ...b,
                  status: 'IN_BOX' as const,
                  currentPosition: {
                    x: this.state.box.position.x + (Math.random() - 0.5) * 0.15,
                    y: this.state.box.position.y + (Math.random() - 0.5) * 0.15,
                    z: this.state.box.position.z + 0.08,
                  },
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
          eventTriggered = `Ball [${currentBall.id}] Successfully Placed into Box!`;
        }
        return { target: boxDropTarget, shouldGrip: false, eventTriggered };
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
