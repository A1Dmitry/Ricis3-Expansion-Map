import { describe, expect, it } from 'vitest';
import type {
  IKinematicState3D,
  Vector3D,
  JointState3D,
  IBallEntity,
  IBoxContainer,
  IPickAndPlaceSimulationState
} from './kinematicEngine.contracts';
import {
  forwardKinematics3D,
  computeJacobianDeterminant3D,
  calculateAngleDeviationDeg,
  distance3D
} from '../services/kinematic/kinematicMath';
import { DlsSolver3D, RicisConstraintSolver3D } from '../services/kinematic/kinematicSolvers';
import { detectAdvantageEvent } from '../services/kinematic/advantageDetector';
import { PickAndPlaceController } from '../services/kinematic/pickAndPlaceController';
import { KinematicTelemetryLogger } from '../services/kinematic/kinematicLogger';

describe('Kinematic Constraint Engine 3D (RICIS-III Powered)', () => {
  const linkLengths: readonly [number, number, number] = [0.4, 1.2, 0.9]; // base_height, shoulder, elbow -> max reach = 2.1 in xy + 0.4 in z

  it('calculates 3D forward kinematics correctly', () => {
    const joints: JointState3D = { q1: 0, q2: 0, q3: 0 };
    const ee = forwardKinematics3D(joints, linkLengths);
    // When q1=0, q2=0, q3=0, arm points forward along X axis at full extension
    expect(ee.x).toBeCloseTo(linkLengths[1] + linkLengths[2], 3);
    expect(ee.y).toBeCloseTo(0, 3);
    expect(ee.z).toBeCloseTo(linkLengths[0], 3);
  });

  it('detects boundary singularity when q3 is zero', () => {
    const singularJoints: JointState3D = { q1: 0.5, q2: 0.2, q3: 0.0 };
    const det = computeJacobianDeterminant3D(singularJoints, linkLengths);
    expect(Math.abs(det)).toBeLessThan(1e-5);
  });

  it('ensures DLS degrades on boundary singularity while RICIS preserves direction and recovers', () => {
    const target: Vector3D = { x: 2.5, y: 0.2, z: 0.4 }; // Outside max radius (2.1)
    const initialJoints: JointState3D = { q1: 0.05, q2: 0.05, q3: 0.05 };
    const currentState: IKinematicState3D = {
      timestamp: 0,
      joints: initialJoints,
      endEffector: forwardKinematics3D(initialJoints, linkLengths),
      jacobianDeterminant: computeJacobianDeterminant3D(initialJoints, linkLengths),
      isSingularZone: false,
      isWorkspaceBoundaryExceeded: false,
      gripperClosed: false
    };

    const dls = new DlsSolver3D(0.12);
    const ricis = new RicisConstraintSolver3D();

    const dlsResult = dls.solve(currentState, target, linkLengths, 0.016);
    const ricisResult = ricis.solve(currentState, target, linkLengths, 0.016);

    // RICIS maintains directional vector projection without matrix singularity explosion
    expect(ricisResult.metrics.directionPreservedDeg).toBeLessThan(5.0);
    expect(dlsResult.metrics.directionPreservedDeg).toBeGreaterThan(10.0);

    // Recovery check
    expect(ricisResult.metrics.recoverySuccess).toBe(true);
    expect(ricisResult.metrics.nearSingularityBehavior).toBe('recovered');
    expect(dlsResult.metrics.nearSingularityBehavior).toBe('degraded');
  });

  it('preserves L1_IDENTITY (geometric link constraints strictly conserved)', () => {
    const extremeTarget: Vector3D = { x: 5.0, y: 5.0, z: 5.0 };
    const initialJoints: JointState3D = { q1: 0.8, q2: 0.4, q3: 0.3 };
    const currentState: IKinematicState3D = {
      timestamp: 100,
      joints: initialJoints,
      endEffector: forwardKinematics3D(initialJoints, linkLengths),
      jacobianDeterminant: computeJacobianDeterminant3D(initialJoints, linkLengths),
      isSingularZone: false,
      isWorkspaceBoundaryExceeded: false,
      gripperClosed: false
    };

    const ricis = new RicisConstraintSolver3D();
    const result = ricis.solve(currentState, extremeTarget, linkLengths, 0.016);

    const ee = result.nextState.endEffector;
    const planarDist = Math.sqrt(ee.x * ee.x + ee.y * ee.y);
    const maxPlanarReach = linkLengths[1] + linkLengths[2];

    expect(planarDist).toBeLessThanOrEqual(maxPlanarReach + 1e-4);
    expect(result.metrics.invariantPreserved).toBe(true);
  });

  it('detects Advantage Event when DLS deviates near singularity', () => {
    const dlsMetrics = {
      positionError: 0.45,
      velocityError: 2.1,
      directionPreservedDeg: 28.5,
      singularityIndex: 0.95,
      nearSingularityBehavior: 'degraded' as const,
      recoverySuccess: false,
      invariantPreserved: false
    };
    const ricisMetrics = {
      positionError: 0.02,
      velocityError: 0.15,
      directionPreservedDeg: 1.2,
      singularityIndex: 0.95,
      nearSingularityBehavior: 'recovered' as const,
      recoverySuccess: true,
      invariantPreserved: true
    };

    const event = detectAdvantageEvent(0.02, dlsMetrics, ricisMetrics, 1000);
    expect(event).not.toBeNull();
    expect(event?.kind).toBe('DIRECTION_LOSS_PREVENTED');
    expect(event?.jacobianDet).toBe(0.02);
  });

  it('executes Pick & Place sequence and captures balls in singular zone', () => {
    const balls: IBallEntity[] = [
      {
        id: 'ball-singular-1',
        initialPosition: { x: 2.05, y: 0.0, z: 0.1 }, // near reach limit 2.1
        currentPosition: { x: 2.05, y: 0.0, z: 0.1 },
        radius: 0.08,
        color: '#ef4444',
        status: 'ON_SPAWN',
        isSingularZone: true
      },
      {
        id: 'ball-safe-2',
        initialPosition: { x: 1.2, y: 0.5, z: 0.1 },
        currentPosition: { x: 1.2, y: 0.5, z: 0.1 },
        radius: 0.08,
        color: '#3b82f6',
        status: 'ON_SPAWN',
        isSingularZone: false
      }
    ];

    const box: IBoxContainer = {
      position: { x: -0.8, y: 0.8, z: 0.2 },
      dimensions: { x: 0.5, y: 0.5, z: 0.3 },
      collectedBallIds: []
    };

    const controller = new PickAndPlaceController(balls, box);
    expect(controller.getState().phase).toBe('NAVIGATING_TO_BALL');
    expect(controller.getState().currentTargetBallId).toBe('ball-singular-1');

    // Simulate stepping towards ball
    const targetInfo = controller.stepTarget(0.1, { x: 2.04, y: 0.0, z: 0.12 });
    expect(targetInfo.target).toBeDefined();
  });

  it('records state history in Telemetry Ledger with ring buffer limit', () => {
    const logger = new KinematicTelemetryLogger(10);
    for (let i = 0; i < 25; i++) {
      logger.pushEntry({
        id: `entry-${i}`,
        stepIndex: i,
        timestamp: i * 16,
        mode: 'BOUNDARY_ORBIT',
        jacobianDet: 0.05,
        target: { x: 1, y: 0, z: 0 },
        dlsEE: { x: 0.9, y: 0, z: 0 },
        ricisEE: { x: 1.0, y: 0, z: 0 },
        dlsMetrics: {
          positionError: 0.1,
          velocityError: 1.2,
          directionPreservedDeg: 18,
          singularityIndex: 0.9,
          nearSingularityBehavior: 'degraded',
          recoverySuccess: false,
          invariantPreserved: false
        },
        ricisMetrics: {
          positionError: 0.01,
          velocityError: 0.1,
          directionPreservedDeg: 0.5,
          singularityIndex: 0.9,
          nearSingularityBehavior: 'recovered',
          recoverySuccess: true,
          invariantPreserved: true
        },
        advantageEvent: i % 5 === 0 ? {
          id: `adv-${i}`,
          timestamp: i * 16,
          kind: 'DIRECTION_LOSS_PREVENTED',
          description: 'DLS drifted by 18 deg',
          jacobianDet: 0.05,
          dlsDirectionLoss: 18,
          ricisDirectionLoss: 0.5,
          dlsVelocityError: 1.2,
          ricisVelocityError: 0.1
        } : null
      });
    }

    const ledger = logger.getLedger();
    expect(ledger.logs.length).toBe(10); // ring buffer limit
    expect(ledger.advantageEvents.length).toBe(5); // total advantage events preserved
    expect(ledger.totalAdvantageCount).toBe(5);
  });
});
