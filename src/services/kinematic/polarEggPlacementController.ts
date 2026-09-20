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
import {
  PLACEMENT_ARRIVAL_TOLERANCES_M as TOL,
  PLACEMENT_AZIMUTH_ALIGNED_DEG,
  PLACEMENT_DWELL_BUDGETS_SEC as DWELL,
  PLACEMENT_HEIGHTS_M as HEIGHT,
  PLACEMENT_IDLE_HOLD_POSE_M,
  settleScatterOffsetM,
} from './placementProtocol';

export class PolarEggPlacementController {
  private phase: FragileEggPlacementPhase = 'APPROACH_BALL_HOVER';
  private targetBallId: string | null = null;
  private phaseTimer: number = 0;
  private isGripperClosed: boolean = false;
  private balls: IBallEntity[];
  private readonly box: IBoxContainer;

  /** Payloads already released into the box — drives the deterministic scatter. */
  private placedCount = 0;

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
    let targetCartesian: Vector3D = { ...PLACEMENT_IDLE_HOLD_POSE_M };

    if (!targetBall) {
      // Все шарики уложены, зависаем над коробкой
      targetCartesian = {
        x: boxCenter.x,
        y: boxCenter.y,
        z: boxCenter.z + HEIGHT.safeHoverM,
      };
      this.phase = 'VERTICAL_RETRACT';
      this.isGripperClosed = false;
    } else {
      const ballPos = targetBall.currentPosition;

      switch (this.phase) {
        case 'APPROACH_BALL_HOVER': {
          targetCartesian = { x: ballPos.x, y: ballPos.y, z: ballPos.z + HEIGHT.safeHoverM };
          this.isGripperClosed = false;

          const distXY = Math.hypot(currentEE.x - targetCartesian.x, currentEE.y - targetCartesian.y);
          const distZ = Math.abs(currentEE.z - targetCartesian.z);

          // Переход только когда реально подлетели над шариком
          if ((distXY < TOL.hoverPlanarM && distZ < TOL.hoverVerticalM) || this.phaseTimer > DWELL.approachS) {
            this.phase = 'GENTLE_DESCENT_BALL';
            this.phaseTimer = 0;
          }
          break;
        }

        case 'GENTLE_DESCENT_BALL': {
          targetCartesian = { x: ballPos.x, y: ballPos.y, z: HEIGHT.pickM };
          this.isGripperClosed = false;

          const dist = Math.hypot(
            currentEE.x - targetCartesian.x,
            currentEE.y - targetCartesian.y,
            currentEE.z - targetCartesian.z
          );

          if (dist < TOL.descentM || this.phaseTimer > DWELL.descentS) {
            this.phase = 'SECURE_GRASP';
            this.phaseTimer = 0;
            this.isGripperClosed = true;
          }
          break;
        }

        case 'SECURE_GRASP': {
          targetCartesian = { x: ballPos.x, y: ballPos.y, z: HEIGHT.pickM };
          this.isGripperClosed = true;
          this.updateTargetBallPosition(targetBall.id, currentEE, 'GRASPED');

          // Пауза для смыкания клещей схвата
          if (this.phaseTimer > DWELL.gripCloseS) {
            this.phase = 'SAFE_LIFT';
            this.phaseTimer = 0;
          }
          break;
        }

        case 'SAFE_LIFT': {
          targetCartesian = { x: ballPos.x, y: ballPos.y, z: ballPos.z + HEIGHT.safeHoverM };
          this.isGripperClosed = true;
          this.updateTargetBallPosition(targetBall.id, currentEE, 'GRASPED');

          const distZ = Math.abs(currentEE.z - targetCartesian.z);
          if (distZ < TOL.liftVerticalM || this.phaseTimer > DWELL.liftS) {
            this.phase = 'POLAR_TRANSIT_TO_BOX';
            this.phaseTimer = 0;
          }
          break;
        }

        case 'POLAR_TRANSIT_TO_BOX': {
          // Транзит строго на безопасной высоте пролёта к коробке
          targetCartesian = {
            x: boxCenter.x,
            y: boxCenter.y,
            z: boxCenter.z + HEIGHT.safeHoverM,
          };
          this.isGripperClosed = true;
          this.updateTargetBallPosition(targetBall.id, currentEE, 'GRASPED');

          const distXY = Math.hypot(currentEE.x - targetCartesian.x, currentEE.y - targetCartesian.y);
          if (distXY < TOL.transitPlanarM || this.phaseTimer > DWELL.transitS) {
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
            z: boxCenter.z + HEIGHT.safeHoverM,
          };
          this.isGripperClosed = true;
          this.updateTargetBallPosition(targetBall.id, currentEE, 'GRASPED');

          const dist = Math.hypot(
            currentEE.x - targetCartesian.x,
            currentEE.y - targetCartesian.y,
            currentEE.z - targetCartesian.z
          );

          if (dist < TOL.boxAlignM || this.phaseTimer > DWELL.boxAlignS) {
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
            z: boxCenter.z - this.box.dimensions.z / 2 + HEIGHT.softReleaseStandoffM,
          };
          this.isGripperClosed = true;
          this.updateTargetBallPosition(targetBall.id, currentEE, 'GRASPED');

          const distZ = Math.abs(currentEE.z - targetCartesian.z);
          const distXY = Math.hypot(currentEE.x - targetCartesian.x, currentEE.y - targetCartesian.y);

          // Только когда коснулись дна коробки!
          if ((distZ < TOL.releaseVerticalM && distXY < TOL.releasePlanarM) || this.phaseTimer > DWELL.releaseS) {
            this.phase = 'SOFT_RELEASE';
            this.phaseTimer = 0;
            this.isGripperClosed = false;
            // Фиксируем шарик на дне коробки.
            //
            // Смещение ДЕТЕРМИНИРОВАНО — выводится из числа уже уложенных
            // шариков. Прежде его давал несеяный генератор случайных чисел,
            // из-за чего исход укладки был невоспроизводим и нарушал контракт
            // детерминизма проекта (только seeded PRNG, без wall-clock и без
            // несеяной случайности); заодно собственный тест контроллера не мог
            // проверить, куда лёг шарик. Спираль Фогеля гарантирует, что точки
            // не совпадают.
            const scatter = settleScatterOffsetM(this.placedCount);
            this.placedCount++;
            this.updateTargetBallPosition(targetBall.id, {
              x: boxCenter.x + scatter.x,
              y: boxCenter.y + scatter.y,
              z: boxCenter.z - this.box.dimensions.z / 2 + HEIGHT.settleRestM,
            }, 'IN_BOX');
          }
          break;
        }

        case 'SOFT_RELEASE': {
          // Разжатие клещей
          targetCartesian = {
            x: boxCenter.x,
            y: boxCenter.y,
            z: boxCenter.z - this.box.dimensions.z / 2 + HEIGHT.softReleaseStandoffM,
          };
          this.isGripperClosed = false;

          if (this.phaseTimer > DWELL.gripOpenS) {
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
            z: boxCenter.z + HEIGHT.safeHoverM,
          };
          this.isGripperClosed = false;

          const distZ = Math.abs(currentEE.z - targetCartesian.z);
          if (distZ < TOL.liftVerticalM || this.phaseTimer > DWELL.liftS) {
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
    const isAzimuthAligned = azimuthDiff < PLACEMENT_AZIMUTH_ALIGNED_DEG;

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
