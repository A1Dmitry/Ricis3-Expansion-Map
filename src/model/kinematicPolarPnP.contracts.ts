// ============================================================================
// File: src/model/kinematicPolarPnP.contracts.ts
// Polar-Centric Gentle "Fragile Egg" Placement Contracts
// ============================================================================

import type { Vector3D, CylindricalVector3D, JointState3D } from './kinematicEngine.contracts';

export type FragileEggPlacementPhase =
  | 'APPROACH_BALL_HOVER'   // Подлет сверху к предмету
  | 'GENTLE_DESCENT_BALL'   // Деликатное опускание к яйцу
  | 'SECURE_GRASP'          // Смыкание захвата
  | 'SAFE_LIFT'             // Вертикальный подъем
  | 'POLAR_TRANSIT_TO_BOX'  // Плавный перелет в полярных координатах к коробке
  | 'BOX_HOVER_ALIGN'       // Зависание строго над центром коробки
  | 'EGG_GENTLE_DESCENT'    // Плавное опускание яйца на самое дно коробки
  | 'SOFT_RELEASE'          // Мягкое разжатие клещей
  | 'VERTICAL_RETRACT';     // Вертикальный отвод пустого схвата

export interface IPolarEggPlacementState {
  readonly phase: FragileEggPlacementPhase;
  readonly targetPolar: CylindricalVector3D;
  readonly targetCartesian: Vector3D;
  readonly isGripperClosed: boolean;
  readonly eggDistanceToBoxBottom: number;
  readonly currentAzimuthDeg: number;
  readonly targetAzimuthDeg: number;
  readonly isAzimuthAligned: boolean;
}

export interface IPolarKinematicPlacementSolver {
  /**
   * Аналитическое решение в полярных координатах от центра робота O(1)
   */
  solvePolarInverse(
    polarTarget: CylindricalVector3D,
    currentJoints: JointState3D,
    linkLengths: readonly [number, number, number],
    dt: number
  ): JointState3D;
}
