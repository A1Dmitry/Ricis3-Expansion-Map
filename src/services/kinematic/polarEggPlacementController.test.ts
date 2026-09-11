// ============================================================================
// File: src/services/kinematic/polarEggPlacementController.test.ts
// Unit Tests for Polar-Centric Gentle Egg Placement and Azimuth Invariance
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { PolarEggPlacementController } from './polarEggPlacementController';
import type { IBoxContainer, IBallEntity, Vector3D, JointState3D } from '../../model/kinematicEngine.contracts';

describe('PolarEggPlacementController - Gentle Egg Delivery in Polar Coordinates', () => {
  const box: IBoxContainer = {
    position: { x: -0.55, y: -0.55, z: 0.12 },
    dimensions: { x: 0.45, y: 0.45, z: 0.24 },
    collectedBallIds: [],
  };

  const balls: IBallEntity[] = [
    {
      id: 'egg-1',
      initialPosition: { x: 0.5, y: 0.5, z: 0.03 },
      currentPosition: { x: 0.5, y: 0.5, z: 0.03 },
      color: '#fbbf24',
      status: 'ON_SPAWN',
      radius: 0.03,
      isSingularZone: false,
    },
  ];

  let controller: PolarEggPlacementController;

  beforeEach(() => {
    controller = new PolarEggPlacementController(balls, box);
  });

  it('initializes in APPROACH_BALL_HOVER with polar coordinates calculated from center', () => {
    // Initial EE position away from hover target (e.g. at rest/pedestal)
    const ee: Vector3D = { x: 0.1, y: 0.1, z: 0.5 };
    const joints: JointState3D = { q1: Math.PI / 4, q2: 0.5, q3: 0.8 };

    const state = controller.update(ee, joints, 0.1);
    expect(state.phase).toBe('APPROACH_BALL_HOVER');
    expect(state.isGripperClosed).toBe(false);

    // Целевой азимут для шарика (0.5, 0.5) должен быть atan2(0.5, 0.5) = 45 градусов
    expect(state.targetPolar.thetaRad).toBeCloseTo(Math.PI / 4, 3);
  });

  it('keeps ball attached to gripper during transit and descends to bottom of box', () => {
    const eggPos = { x: 0.5, y: 0.5, z: 0.03 };
    const joints: JointState3D = { q1: Math.PI / 4, q2: 0.5, q3: 0.8 };

    // 1. Опускание к яйцу
    controller.update(eggPos, joints, 3.1); // переходит в GENTLE_DESCENT_BALL
    controller.update(eggPos, joints, 2.6); // переходит в SECURE_GRASP
    controller.update(eggPos, joints, 0.5); // переходит в SAFE_LIFT

    const stateLift = controller.update(eggPos, joints, 0.1);
    expect(stateLift.phase).toBe('SAFE_LIFT');
    expect(stateLift.isGripperClosed).toBe(true);

    // 2. Транзит к коробке
    controller.update({ x: 0.5, y: 0.5, z: 0.38 }, joints, 2.1); // в POLAR_TRANSIT_TO_BOX
    const stateTransit = controller.update({ x: box.position.x, y: box.position.y, z: 0.47 }, joints, 3.6);
    expect(stateTransit.phase).toBe('BOX_HOVER_ALIGN');

    // 3. Мягкое опускание яйца
    const stateDescent = controller.update({ x: box.position.x, y: box.position.y, z: 0.47 }, joints, 1.3);
    expect(stateDescent.phase).toBe('EGG_GENTLE_DESCENT');

    // 4. Достижение дна коробки и релиз
    const boxBottomTarget = {
      x: box.position.x,
      y: box.position.y,
      z: box.position.z - box.dimensions.z / 2 + 0.05,
    };
    const stateRelease = controller.update(boxBottomTarget, joints, 2.6);
    expect(stateRelease.phase).toBe('SOFT_RELEASE');
    expect(stateRelease.isGripperClosed).toBe(false);

    // Проверяем что яйцо помечено как IN_BOX
    const currentBalls = controller.getBalls();
    expect(currentBalls[0]?.status).toBe('IN_BOX');
  });
});
