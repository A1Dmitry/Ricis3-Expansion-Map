// ============================================================================
// File: src/services/kinematic/polarEggPlacementController.test.ts
// Unit Tests for Polar-Centric Gentle Egg Placement and Azimuth Invariance
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

describe('PolarEggPlacementController - determinism of the settle placement', () => {
  const box: IBoxContainer = {
    position: { x: -0.55, y: -0.55, z: 0.12 },
    dimensions: { x: 0.45, y: 0.45, z: 0.24 },
    collectedBallIds: [],
  };

  /** Drive one payload all the way to IN_BOX, mirroring the happy-path sequence. */
  function placeOne(controller: PolarEggPlacementController): Vector3D {
    const joints: JointState3D = { q1: Math.PI / 4, q2: 0.5, q3: 0.8 };
    const eggPos = { x: 0.5, y: 0.5, z: 0.03 };
    controller.update(eggPos, joints, 3.1);
    controller.update(eggPos, joints, 2.6);
    controller.update(eggPos, joints, 0.5);
    controller.update(eggPos, joints, 2.1);
    controller.update({ x: box.position.x, y: box.position.y, z: 0.47 }, joints, 3.6);
    controller.update({ x: box.position.x, y: box.position.y, z: 0.47 }, joints, 1.3);
    controller.update(
      { x: box.position.x, y: box.position.y, z: box.position.z - box.dimensions.z / 2 + 0.05 },
      joints,
      2.6
    );
    const placed = controller.getBalls().find((b) => b.status === 'IN_BOX');
    if (!placed) throw new Error('payload never reached IN_BOX');
    return placed.currentPosition;
  }

  it('places the payload at the SAME point on every run (no unseeded randomness)', () => {
    // The settle offset used to come from Math.random(), which made the outcome
    // unreproducible and violated the project's determinism contract. Two
    // independent controllers fed the identical sequence must agree exactly.
    const a = placeOne(new PolarEggPlacementController(
      [{ id: 'egg-1', initialPosition: { x: 0.5, y: 0.5, z: 0.03 }, currentPosition: { x: 0.5, y: 0.5, z: 0.03 }, color: '#fbbf24', status: 'ON_SPAWN', radius: 0.03, isSingularZone: false }],
      box
    ));
    const b = placeOne(new PolarEggPlacementController(
      [{ id: 'egg-1', initialPosition: { x: 0.5, y: 0.5, z: 0.03 }, currentPosition: { x: 0.5, y: 0.5, z: 0.03 }, color: '#fbbf24', status: 'ON_SPAWN', radius: 0.03, isSingularZone: false }],
      box
    ));
    expect(a).toEqual(b);
  });

  it('source contains no unseeded randomness', () => {
    // Guard the contract at the source level: the controller must not reach for
    // Math.random or the wall clock, or the placement stops being reproducible.
    const src = readFileSync(
      resolve(process.cwd(), 'src/services/kinematic/polarEggPlacementController.ts'),
      'utf8'
    );
    expect(src).not.toContain('Math.random');
    expect(src).not.toContain('Date.now');
  });
});
