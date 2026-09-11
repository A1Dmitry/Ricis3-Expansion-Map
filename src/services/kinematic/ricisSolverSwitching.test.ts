import { describe, it, expect } from 'vitest';
import {
  KinematicDualDebuggerEngine,
  PolarRicisConstraintSolver,
  ClassicDlsGhostSolver,
} from './polarSolvers';
import { RicisSymbolicJacobianSolver3D } from './kinematicSolvers';
import type { IKinematicState3D, Vector3D } from '../../model/kinematicEngine.contracts';

describe('KinematicDualDebuggerEngine Solver Switching & DI (QA Suite)', () => {
  const linkLengths: readonly [number, number, number] = [0.4, 0.8, 0.7];
  const target: Vector3D = { x: 1.1, y: 0.4, z: 0.5 };
  const dt = 0.05;

  const initialState: IKinematicState3D = {
    timestamp: Date.now(),
    joints: { q1: 0.35, q2: 0.6, q3: 1.2 },
    endEffector: { x: 0.9, y: 0.35, z: 0.6 },
    jacobianDeterminant: 0.5,
    isSingularZone: false,
    isWorkspaceBoundaryExceeded: false,
    gripperClosed: false,
  };

  it('initializes with POLAR_GEOMETRIC by default and executes stepDual', () => {
    const engine = new KinematicDualDebuggerEngine();
    expect(engine.ricisMode).toBe('POLAR_GEOMETRIC');

    const result = engine.stepDual(
      initialState,
      initialState,
      target,
      linkLengths,
      dt
    );

    expect(result.ricisResult).toBeDefined();
    expect(result.dlsResult).toBeDefined();
    expect(
      result.ricisResult.metrics.solverId === 'RICIS_POLAR_MONOLITH' ||
      result.ricisResult.metrics.solverId === 'RICIS_INVARIANT_ENGINE'
    ).toBe(true);
    expect(result.dlsResult.metrics.solverId).toBe('DLS_BASELINE');
  });

  it('switches to SYMBOLIC_AST on the fly using setRicisSolver', () => {
    const engine = new KinematicDualDebuggerEngine();
    const astSolver = new RicisSymbolicJacobianSolver3D();

    engine.setRicisSolver(astSolver, 'SYMBOLIC_AST');
    expect(engine.ricisMode).toBe('SYMBOLIC_AST');

    const result = engine.stepDual(
      initialState,
      initialState,
      target,
      linkLengths,
      dt
    );

    expect(result.ricisResult.metrics.solverId).toBe('RICIS_SYMBOLIC_JACOBIAN');
    expect(Number.isNaN(result.ricisResult.nextState.joints.q1)).toBe(false);
    expect(Number.isNaN(result.ricisResult.nextState.joints.q2)).toBe(false);
    expect(Number.isNaN(result.ricisResult.nextState.joints.q3)).toBe(false);
  });

  it('preserves continuity and invariants during solver switching while navigating through boundary singularity', () => {
    const engine = new KinematicDualDebuggerEngine();
    const singularTarget: Vector3D = { x: 1.48, y: 0.05, z: 0.2 }; // Near reach limit (1.5)

    // Step 1: Polar solver
    const step1 = engine.stepDual(
      initialState,
      initialState,
      singularTarget,
      linkLengths,
      dt
    );

    // Switch to AST solver directly on the resulting state
    engine.setRicisSolver(new RicisSymbolicJacobianSolver3D(), 'SYMBOLIC_AST');
    expect(engine.ricisMode).toBe('SYMBOLIC_AST');

    const step2 = engine.stepDual(
      step1.ricisResult.nextState,
      step1.dlsResult.nextState,
      singularTarget,
      linkLengths,
      dt
    );

    // Verify step2 has reasonable joint delta from step1 (no teleportation / NaN)
    const dq1 = Math.abs(step2.ricisResult.nextState.joints.q1 - step1.ricisResult.nextState.joints.q1);
    const dq2 = Math.abs(step2.ricisResult.nextState.joints.q2 - step1.ricisResult.nextState.joints.q2);
    const dq3 = Math.abs(step2.ricisResult.nextState.joints.q3 - step1.ricisResult.nextState.joints.q3);

    expect(dq1).toBeLessThan(0.5);
    expect(dq2).toBeLessThan(0.5);
    expect(dq3).toBeLessThan(0.5);
    expect(step2.ricisResult.metrics.solverId).toBe('RICIS_SYMBOLIC_JACOBIAN');
  });
});
