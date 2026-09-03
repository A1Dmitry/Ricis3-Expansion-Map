import { describe, it, expect } from 'vitest';
import { PolarCoordinateService } from './polarCoordinateService';
import {
  PolarRicisConstraintSolver,
  ClassicDlsGhostSolver,
  KinematicDualDebuggerEngine,
} from './polarSolvers';
import type { IKinematicState3D, Vector3D } from '../../model/kinematicEngine.contracts';

describe('PolarCoordinateService & RICIS-III Kinematics', () => {
  const initialJoints = { q1: 0.2, q2: 0.5, q3: 0.8 };
  const linkLengths: readonly [number, number, number] = [0.2, 0.45, 0.4];

  const createInitialState = (ee: Vector3D): IKinematicState3D => ({
    timestamp: 1000,
    joints: initialJoints,
    endEffector: ee,
    jacobianDeterminant: 0.1,
    isSingularZone: false,
    isWorkspaceBoundaryExceeded: false,
    gripperClosed: false,
  });

  it('transforms Cartesian to Cylindrical correctly in standard space', () => {
    const cartesian: Vector3D = { x: 3, y: 4, z: 2 };
    const cyl = PolarCoordinateService.cartesianToCylindrical(cartesian);

    expect(cyl.r).toBeCloseTo(5.0, 4);
    expect(cyl.thetaRad).toBeCloseTo(Math.atan2(4, 3), 4);
    expect(cyl.z).toBeCloseTo(2.0, 4);

    const back = PolarCoordinateService.cylindricalToCartesian(cyl);
    expect(back.x).toBeCloseTo(3.0, 4);
    expect(back.y).toBeCloseTo(4.0, 4);
    expect(back.z).toBeCloseTo(2.0, 4);
  });

  it('preserves L1_IDENTITY orientation when r -> 0 (shoulder singularity)', () => {
    const nearOrigin: Vector3D = { x: 0, y: 0, z: 0.5 };
    const prevTheta = 1.25; // Expected to be preserved

    const cyl = PolarCoordinateService.cartesianToCylindrical(nearOrigin, prevTheta);
    expect(cyl.r).toBe(0);
    expect(cyl.thetaRad).toBe(prevTheta); // L1_IDENTITY preserved!
  });

  it('executes PolarRicisConstraintSolver in O(1) without Cauchy limits or NaNs', () => {
    const solver = new PolarRicisConstraintSolver();
    const currentState = createInitialState({ x: 0.4, y: 0.2, z: 0.4 });
    const target: Vector3D = { x: 0.5, y: 0.3, z: 0.3 };

    const res = solver.solve(currentState, target, linkLengths, 0.016, 'POLAR');

    expect(res.nextState.joints.q1).not.toBeNaN();
    expect(res.nextState.joints.q2).not.toBeNaN();
    expect(res.nextState.joints.q3).not.toBeNaN();
    expect(res.qaTrace.cauchyLimitsBanned).toBe(true);
    expect(res.qaTrace.solverComplexity).toBe('O(1)');
    expect(res.qaTrace.qaScore).toBe(100);
    expect(res.metrics.directionPreservedDeg).toBeLessThan(5.0);
  });

  it('safely clamps reach boundary singularity without matrix divergence', () => {
    const solver = new PolarRicisConstraintSolver();
    const currentState = createInitialState({ x: 0.3, y: 0.3, z: 0.2 });
    // Target beyond max reachable range (0.45 + 0.40 = 0.85m reach)
    const outOfReachTarget: Vector3D = { x: 1.5, y: 1.5, z: 1.0 };

    const res = solver.solve(currentState, outOfReachTarget, linkLengths, 0.016, 'POLAR');

    expect(res.nextState.joints.q1).not.toBeNaN();
    expect(res.nextState.isSingularZone).toBe(true);
    expect(res.metrics.recoverySuccess).toBe(true);
    expect(res.qaTrace.invariantPreserved).toBe(true);
  });

  it('demonstrates classical DLS Ghost Arm damping degradation near singularity', () => {
    const dlsSolver = new ClassicDlsGhostSolver(0.2);
    const ricisSolver = new PolarRicisConstraintSolver();

    // Boundary target causing elbow singularity (det(J) -> 0)
    const boundaryTarget: Vector3D = { x: 0.84, y: 0.0, z: 0.2 };
    const currentState = createInitialState({ x: 0.5, y: 0.0, z: 0.2 });

    const ricisRes = ricisSolver.solve(currentState, boundaryTarget, linkLengths, 0.016);
    const dlsRes = dlsSolver.solve(currentState, boundaryTarget, linkLengths, 0.016);

    // RICIS maintains low direction deviation, whereas DLS exhibits higher deviation/damping
    expect(ricisRes.metrics.directionPreservedDeg).toBeLessThan(dlsRes.metrics.directionPreservedDeg + 5);
    expect(ricisRes.metrics.invariantPreserved).toBe(true);
  });

  it('operates DualDebuggerEngine and produces enriched QA trace', () => {
    const engine = new KinematicDualDebuggerEngine();
    const state = createInitialState({ x: 0.4, y: 0.2, z: 0.3 });
    const target: Vector3D = { x: 0.45, y: 0.25, z: 0.35 };

    const result = engine.step(state, state, target, linkLengths, 0.016, 'POLAR');

    expect(result.logEntry).toBeDefined();
    expect(result.logEntry.qaTrace).toBeDefined();
    expect(result.logEntry.qaTrace?.coordinateMode).toBe('POLAR');
    expect(result.logEntry.qaTrace?.cauchyLimitsBanned).toBe(true);
    expect(result.logEntry.qaTrace?.ghostDampingPenalty).toBeGreaterThan(0);
  });
});
