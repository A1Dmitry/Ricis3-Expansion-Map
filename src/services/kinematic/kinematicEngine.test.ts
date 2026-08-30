import { describe, it, expect, beforeEach } from 'vitest';
import {
  forwardKinematics3D,
  computeJacobianDeterminant3D,
  distance3D,
  vectorLength3D,
  calculateAngleDeviationDeg,
} from './kinematicMath';
import { DlsSolver3D, RicisConstraintSolver3D } from './kinematicSolvers';
import { detectAdvantageEvent } from './advantageDetector';
import { PickAndPlaceController } from './pickAndPlaceController';
import { KinematicTelemetryLogger } from './kinematicLogger';
import type { IKinematicState3D, IBoxContainer, IBallEntity, IKinematicLogEntry } from '../../model/kinematicEngine.contracts';

describe('3D Kinematic Engine - Math & Forward Kinematics', () => {
  const linkLengths: readonly [number, number, number] = [0.2, 0.45, 0.4];

  it('computes forward kinematics for zero angles correctly', () => {
    const ee = forwardKinematics3D({ q1: 0, q2: 0, q3: 0 }, linkLengths);
    // At zero angles (straight horizontal along X), x = 0.45 + 0.4 = 0.85, y = 0, z = 0.2 (L0 base height)
    expect(ee.x).toBeCloseTo(0.85, 2);
    expect(ee.y).toBeCloseTo(0, 2);
    expect(ee.z).toBeCloseTo(0.2, 2);
  });

  it('detects boundary singularity when arm is fully extended', () => {
    const det = computeJacobianDeterminant3D({ q1: 0, q2: 0, q3: 0 }, linkLengths);
    // When q3 = 0, sin(q3) = 0 => det = 0 (boundary singularity)
    expect(Math.abs(det)).toBeLessThan(0.001);
  });

  it('calculates Euclidean distance and vector length accurately', () => {
    const d = distance3D({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 });
    expect(d).toBeCloseTo(5, 5);

    const len = vectorLength3D({ x: 0, y: 3, z: 4 });
    expect(len).toBeCloseTo(5, 5);
  });

  it('computes angle deviation between perpendicular vectors as 90 degrees', () => {
    const dev = calculateAngleDeviationDeg({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
    expect(dev).toBeCloseTo(90, 2);
  });
});

describe('3D Kinematic Engine - RICIS Invariant vs DLS Baseline Solvers', () => {
  const linkLengths: readonly [number, number, number] = [0.2, 0.45, 0.4];
  const ricisSolver = new RicisConstraintSolver3D();
  const dlsSolver = new DlsSolver3D(0.15);

  const nearSingularState: IKinematicState3D = {
    timestamp: 1000,
    joints: { q1: 0, q2: 0.02, q3: 0.005 }, // Near boundary singularity
    endEffector: { x: 0.84, y: 0.01, z: 0.2 },
    jacobianDeterminant: 0.002,
    isSingularZone: true,
    isWorkspaceBoundaryExceeded: false,
    gripperClosed: false,
  };

  const target = { x: 0.85, y: 0.02, z: 0.25 };

  it('DLS solver dampens motion causing direction degradation in singular zone', () => {
    const dlsResult = dlsSolver.solve(nearSingularState, target, linkLengths, 0.016);
    expect(dlsResult.metrics.nearSingularityBehavior).toBe('degraded');
  });

  it('RICIS solver preserves L1 structural invariant and recovers trajectory', () => {
    const ricisResult = ricisSolver.solve(nearSingularState, target, linkLengths, 0.016);
    expect(ricisResult.metrics.nearSingularityBehavior).toBe('recovered');
    expect(ricisResult.metrics.invariantPreserved).toBe(true);
    expect(ricisResult.metrics.recoverySuccess).toBe(true);
  });

  it('Advantage detector triggers DIRECTION_LOSS_PREVENTED event', () => {
    const dlsResult = dlsSolver.solve(nearSingularState, target, linkLengths, 0.016);
    const ricisResult = ricisSolver.solve(nearSingularState, target, linkLengths, 0.016);

    const adv = detectAdvantageEvent(
      ricisResult.nextState.jacobianDeterminant,
      dlsResult.metrics,
      ricisResult.metrics,
      Date.now()
    );

    expect(adv).not.toBeNull();
    expect(adv?.kind).toBe('DIRECTION_LOSS_PREVENTED');
  });
});

describe('Pick and Place Controller & Telemetry Logger', () => {
  const box: IBoxContainer = {
    position: { x: -0.6, y: -0.6, z: 0.15 },
    dimensions: { x: 0.45, y: 0.45, z: 0.3 },
    collectedBallIds: [],
  };

  const testBalls: IBallEntity[] = [
    {
      id: 'ball-1',
      initialPosition: { x: 0.8, y: 0.4, z: 0.1 },
      currentPosition: { x: 0.8, y: 0.4, z: 0.1 },
      radius: 0.06,
      color: '#3b82f6',
      status: 'ON_SPAWN',
      isSingularZone: false,
    },
  ];

  let controller: PickAndPlaceController;

  beforeEach(() => {
    controller = new PickAndPlaceController(testBalls, box);
  });

  it('initializes in NAVIGATING_TO_BALL phase', () => {
    const state = controller.getState();
    expect(state.phase).toBe('NAVIGATING_TO_BALL');
    expect(state.currentTargetBallId).toBe('ball-1');
  });

  it('telemetry logger records entries and updates score ledger', () => {
    const logger = new KinematicTelemetryLogger(50);
    const mockEntry: IKinematicLogEntry = {
      id: 'log-1',
      stepIndex: 1,
      timestamp: Date.now(),
      mode: 'PICK_AND_PLACE_BOX',
      jacobianDet: 0.001,
      target: { x: 0.8, y: 0.4, z: 0.1 },
      dlsEE: { x: 0.7, y: 0.3, z: 0.1 },
      ricisEE: { x: 0.8, y: 0.4, z: 0.1 },
      dlsMetrics: {
        positionError: 0.12,
        velocityError: 0.8,
        directionPreservedDeg: 42,
        singularityIndex: 0.9,
        nearSingularityBehavior: 'degraded',
        recoverySuccess: false,
        invariantPreserved: false,
      },
      ricisMetrics: {
        positionError: 0.01,
        velocityError: 0.05,
        directionPreservedDeg: 2.1,
        singularityIndex: 0.9,
        nearSingularityBehavior: 'recovered',
        recoverySuccess: true,
        invariantPreserved: true,
      },
      advantageEvent: {
        id: 'adv-1',
        timestamp: Date.now(),
        kind: 'DIRECTION_LOSS_PREVENTED',
        description: 'RICIS prevented loss of direction',
        jacobianDet: 0.001,
        dlsDirectionLoss: 42,
        ricisDirectionLoss: 2.1,
        dlsVelocityError: 0.8,
        ricisVelocityError: 0.05,
      },
    };

    logger.pushEntry(mockEntry);
    const ledger = logger.getLedger();

    expect(ledger.logs.length).toBe(1);
    expect(ledger.totalAdvantageCount).toBe(1);
    expect(ledger.advantageEvents[0]?.kind).toBe('DIRECTION_LOSS_PREVENTED');
  });
});
