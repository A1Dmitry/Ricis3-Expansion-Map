// ============================================================================
// File: src/services/kinematic/polarEggPlacementController.ts
// Polar-Centric Fragile Object ("Egg") Gentle Delivery & Placement Controller
// ============================================================================

import type {
  Vector3D,
  CylindricalVector3D,
  IBoxContainer,
  IBallEntity,
  JointState3D,
} from '../../model/kinematicEngine.contracts';
import type {
  FragileEggPlacementPhase,
  IPolarEggPlacementState,
} from '../../model/kinematicPolarPnP.contracts';
import { PolarCoordinateService } from './polarCoordinateService';

export class PolarEggPlacementController {
  private phase: FragileEggPlacementPhase = 'APPROACH_BALL_HOVER';
  private targetBallId: string | null = null;
  private phaseTimer: number = 0;
  private isGripperClosed: boolean = false;
  private balls: IBallEntity[];
  private readonly box: IBoxContainer;

  // Safe parameters
  private readonly HOVER_HEIGHT = 0.35; // безопасная высота пролета
  private readonly EGG_SAFE_DROP_HEIGHT = 0.05; // высота мягкого опускания на дно коробки
  private readonly BALL_PICK_HEIGHT = 0.03;

  constructor(initialBalls: readonly IBallEntity[], box: IBoxContainer) {
    this.balls = initialBalls.map((b) => ({ ...b }));
    this.box = box;
    this.selectNextTargetBall();
  }

  private selectNextTargetBall(): void {
    const unplaced = this.balls.filter((b) => b.status !== 'IN_BOX');
    if (unplaced.length > 0 && unplaced[0]) {
      this.targetBallId = unplaced[0].id;
    } else {
      this.targetBallId = null;
    }
  }

  public update(
    currentEE: Vector3D,
    currentJoints: JointState3D,
    dt: number
  ): IPolarEggPlacementState {
    this.phaseTimer += dt;

    const targetBall = this.balls.find((b) => b.id === this.targetBallId);
    const boxCenter = { ...this.box.position };

    // Вычисляем целевую точку в зависимости от фазы
    let targetCartesian: Vector3D = { x: 0.5, y: 0, z: 0.3 };

    if (!targetBall) {
      // Все шарики уложены, зависаем над коробкой
      targetCartesian = {
        x: boxCenter.x,
        y: boxCenter.y,
        z: boxCenter.z + this.HOVER_HEIGHT,
      };
      this.phase = 'VERTICAL_RETRACT';
      this.isGripperClosed = false;
    } else {
      const ballPos = targetBall.currentPosition;

      switch (this.phase) {
        case 'APPROACH_BALL_HOVER': {
          targetCartesian = { x: ballPos.x, y: ballPos.y, z: ballPos.z + this.HOVER_HEIGHT };
          this.isGripperClosed = false;

          const distXY = Math.hypot(currentEE.x - targetCartesian.x, currentEE.y - targetCartesian.y);
          const distZ = Math.abs(currentEE.z - targetCartesian.z);

          // Переход только когда реально подлетели над шариком
          if ((distXY < 0.05 && distZ < 0.08) || this.phaseTimer > 3.0) {
            this.phase = 'GENTLE_DESCENT_BALL';
            this.phaseTimer = 0;
          }
          break;
        }

        case 'GENTLE_DESCENT_BALL': {
          targetCartesian = { x: ballPos.x, y: ballPos.y, z: this.BALL_PICK_HEIGHT };
          this.isGripperClosed = false;

          const dist = Math.hypot(
            currentEE.x - targetCartesian.x,
            currentEE.y - targetCartesian.y,
            currentEE.z - targetCartesian.z
          );

          if (dist < 0.04 || this.phaseTimer > 2.5) {
            this.phase = 'SECURE_GRASP';
            this.phaseTimer = 0;
            this.isGripperClosed = true;
          }
          break;
        }

        case 'SECURE_GRASP': {
          targetCartesian = { x: ballPos.x, y: ballPos.y, z: this.BALL_PICK_HEIGHT };
          this.isGripperClosed = true;
          this.updateTargetBallPosition(targetBall.id, currentEE, 'GRASPED');

          // Пауза для смыкания клещей схвата
          if (this.phaseTimer > 0.4) {
            this.phase = 'SAFE_LIFT';
            this.phaseTimer = 0;
          }
          break;
        }

        case 'SAFE_LIFT': {
          targetCartesian = { x: ballPos.x, y: ballPos.y, z: ballPos.z + this.HOVER_HEIGHT };
          this.isGripperClosed = true;
          this.updateTargetBallPosition(targetBall.id, currentEE, 'GRASPED');

          const distZ = Math.abs(currentEE.z - targetCartesian.z);
          if (distZ < 0.06 || this.phaseTimer > 2.0) {
            this.phase = 'POLAR_TRANSIT_TO_BOX';
            this.phaseTimer = 0;
          }
          break;
        }

        case 'POLAR_TRANSIT_TO_BOX': {
          // Транзит строго на высоте HOVER_HEIGHT к коробке
          targetCartesian = {
            x: boxCenter.x,
            y: boxCenter.y,
            z: boxCenter.z + this.HOVER_HEIGHT,
          };
          this.isGripperClosed = true;
          this.updateTargetBallPosition(targetBall.id, currentEE, 'GRASPED');

          const distXY = Math.hypot(currentEE.x - targetCartesian.x, currentEE.y - targetCartesian.y);
          if (distXY < 0.08 || this.phaseTimer > 3.5) {
            this.phase = 'BOX_HOVER_ALIGN';
            this.phaseTimer = 0;
          }
          break;
        }

        case 'BOX_HOVER_ALIGN': {
          // Точное выравнивание над центром коробки
          targetCartesian = {
            x: boxCenter.x,
            y: boxCenter.y,
            z: boxCenter.z + this.HOVER_HEIGHT,
          };
          this.isGripperClosed = true;
          this.updateTargetBallPosition(targetBall.id, currentEE, 'GRASPED');

          const dist = Math.hypot(
            currentEE.x - targetCartesian.x,
            currentEE.y - targetCartesian.y,
            currentEE.z - targetCartesian.z
          );

          if (dist < 0.05 || this.phaseTimer > 1.2) {
            this.phase = 'EGG_GENTLE_DESCENT';
            this.phaseTimer = 0;
          }
          break;
        }

        case 'EGG_GENTLE_DESCENT': {
          // Деликатный спуск прямо на дно коробки (протокол хрупкого яйца)
          targetCartesian = {
            x: boxCenter.x,
            y: boxCenter.y,
            z: boxCenter.z - this.box.dimensions.z / 2 + this.EGG_SAFE_DROP_HEIGHT,
          };
          this.isGripperClosed = true;
          this.updateTargetBallPosition(targetBall.id, currentEE, 'GRASPED');

          const distZ = Math.abs(currentEE.z - targetCartesian.z);
          const distXY = Math.hypot(currentEE.x - targetCartesian.x, currentEE.y - targetCartesian.y);

          // Только когда коснулись дна коробки!
          if ((distZ < 0.04 && distXY < 0.08) || this.phaseTimer > 2.5) {
            this.phase = 'SOFT_RELEASE';
            this.phaseTimer = 0;
            this.isGripperClosed = false;
            // Фиксируем шарик на дне коробки
            this.updateTargetBallPosition(targetBall.id, {
              x: boxCenter.x + (Math.random() * 0.1 - 0.05),
              y: boxCenter.y + (Math.random() * 0.1 - 0.05),
              z: boxCenter.z - this.box.dimensions.z / 2 + 0.03,
            }, 'IN_BOX');
          }
          break;
        }

        case 'SOFT_RELEASE': {
          // Разжатие клещей
          targetCartesian = {
            x: boxCenter.x,
            y: boxCenter.y,
            z: boxCenter.z - this.box.dimensions.z / 2 + this.EGG_SAFE_DROP_HEIGHT,
          };
          this.isGripperClosed = false;

          if (this.phaseTimer > 0.5) {
            this.phase = 'VERTICAL_RETRACT';
            this.phaseTimer = 0;
          }
          break;
        }

        case 'VERTICAL_RETRACT': {
          // Вертикальный подъем пустого схвата
          targetCartesian = {
            x: boxCenter.x,
            y: boxCenter.y,
            z: boxCenter.z + this.HOVER_HEIGHT,
          };
          this.isGripperClosed = false;

          const distZ = Math.abs(currentEE.z - targetCartesian.z);
          if (distZ < 0.06 || this.phaseTimer > 2.0) {
            this.selectNextTargetBall();
            this.phase = 'APPROACH_BALL_HOVER';
            this.phaseTimer = 0;
          }
          break;
        }
      }
    }

    // Перевод координат строго в полярную систему от центра базы
    const targetPolar = PolarCoordinateService.cartesianToCylindrical(targetCartesian, currentJoints.q1);

    const currentAzimuthDeg = (currentJoints.q1 * 180) / Math.PI;
    const targetAzimuthDeg = (targetPolar.thetaRad * 180) / Math.PI;
    const azimuthDiff = Math.abs(currentAzimuthDeg - targetAzimuthDeg);
    const isAzimuthAligned = azimuthDiff < 5.0;

    const eggDistanceToBoxBottom = Math.hypot(
      currentEE.x - boxCenter.x,
      currentEE.y - boxCenter.y,
      currentEE.z - (boxCenter.z - this.box.dimensions.z / 2)
    );

    return {
      phase: this.phase,
      targetPolar,
      targetCartesian,
      isGripperClosed: this.isGripperClosed,
      eggDistanceToBoxBottom,
      currentAzimuthDeg,
      targetAzimuthDeg,
      isAzimuthAligned,
    };
  }

  private updateTargetBallPosition(
    ballId: string,
    pos: Vector3D,
    status: 'ON_SPAWN' | 'GRASPED' | 'IN_BOX'
  ): void {
    this.balls = this.balls.map((b) =>
      b.id === ballId ? { ...b, currentPosition: { ...pos }, status } : b
    );
  }

  public getBalls(): readonly IBallEntity[] {
    return this.balls;
  }

  public reset(balls: readonly IBallEntity[]): void {
    this.balls = balls.map((b) => ({ ...b }));
    this.phase = 'APPROACH_BALL_HOVER';
    this.phaseTimer = 0;
    this.isGripperClosed = false;
    this.selectNextTargetBall();
  }
}
