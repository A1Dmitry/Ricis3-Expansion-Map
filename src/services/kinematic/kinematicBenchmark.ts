// ============================================================================
// RICIS-III HEADLESS KINEMATIC BENCHMARK (P7: DLS VS RICIS BENCHMARK)
// Benchmarks DLS vs RICIS Constraint vs RICIS Symbolic Jacobian across:
// 1. Boundary Singularities (Full Extension)
// 2. Singular Inner Fold (Folded Elbow)
// 3. Shoulder Pole Singularity (Azimuth Vanish)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type {
  Vector3D,
  JointState3D,
  IKinematicState3D,
  ISolverMetrics3D,
} from '../../model/kinematicEngine.contracts';
import {
  DlsSolver3D,
  RicisConstraintSolver3D,
  RicisSymbolicJacobianSolver3D,
} from './kinematicSolvers';
import { forwardKinematics3D, computeJacobianDeterminant3D } from './kinematicMath';

export interface IBenchmarkMetrics {
  readonly solverId: string;
  readonly avgPositionError: number; // meters
  readonly maxPositionError: number; // meters
  readonly avgDirectionDeviationDeg: number;
  readonly maxDirectionDeviationDeg: number;
  readonly avgJointVelocityNorm: number; // rad/s
  readonly maxJointVelocityNorm: number; // rad/s
  readonly successRate: number; // % of steps with positionError < 0.05m
  readonly singularityZoneRatio: number; // % of path spent in singular region
}

export interface IBenchmarkScenarioReport {
  readonly scenarioName: string;
  readonly description: string;
  readonly metrics: Record<string, IBenchmarkMetrics>;
}

export class KinematicHeadlessBenchmark {
  private readonly linkLengths: readonly [number, number, number] = [0.8, 1.0, 0.8]; // L0, L1, L2

  /**
   * Generates a linear trajectory from point A to point B with N steps.
   */
  private generateTrajectory(start: Vector3D, end: Vector3D, steps: number): Vector3D[] {
    const trajectory: Vector3D[] = [];
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      trajectory.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        z: start.z + (end.z - start.z) * t,
      });
    }
    return trajectory;
  }

  /**
   * Run the benchmark for a single solver on a given trajectory.
   */
  public benchmarkSolverOnTrajectory(
    solverId: 'DLS_BASELINE' | 'RICIS_INVARIANT_ENGINE' | 'RICIS_SYMBOLIC_JACOBIAN',
    initialJoints: JointState3D,
    trajectory: Vector3D[],
    dt = 0.016
  ): IBenchmarkMetrics {
    const solver =
      solverId === 'DLS_BASELINE'
        ? new DlsSolver3D(0.15)
        : solverId === 'RICIS_INVARIANT_ENGINE'
        ? new RicisConstraintSolver3D()
        : new RicisSymbolicJacobianSolver3D();

    let currentState: IKinematicState3D = {
      timestamp: 0,
      joints: { ...initialJoints },
      endEffector: forwardKinematics3D(initialJoints, this.linkLengths),
      jacobianDeterminant: computeJacobianDeterminant3D(initialJoints, this.linkLengths),
      isSingularZone: false,
      isWorkspaceBoundaryExceeded: false,
      gripperClosed: false,
    };

    const posErrors: number[] = [];
    const dirDeviations: number[] = [];
    const jointVels: number[] = [];
    let successfulSteps = 0;
    let singularZoneSteps = 0;

    for (let i = 0; i < trajectory.length; i++) {
      const target = trajectory[i]!;
      const result = solver.solve(currentState, target, this.linkLengths, dt);

      const posErr = result.metrics.positionError;
      const dirDev = result.metrics.directionPreservedDeg;

      // Compute joint velocity norm
      const dq1 = (result.nextState.joints.q1 - currentState.joints.q1) / dt;
      const dq2 = (result.nextState.joints.q2 - currentState.joints.q2) / dt;
      const dq3 = (result.nextState.joints.q3 - currentState.joints.q3) / dt;
      const velNorm = Math.sqrt(dq1 * dq1 + dq2 * dq2 + dq3 * dq3);

      posErrors.push(posErr);
      dirDeviations.push(dirDev);
      jointVels.push(velNorm);

      if (posErr < 0.05) {
        successfulSteps++;
      }
      if (result.nextState.isSingularZone) {
        singularZoneSteps++;
      }

      currentState = result.nextState;
    }

    const avgPosError = posErrors.reduce((a, b) => a + b, 0) / posErrors.length;
    const maxPosError = Math.max(...posErrors);
    const avgDirDev = dirDeviations.reduce((a, b) => a + b, 0) / dirDeviations.length;
    const maxDirDev = Math.max(...dirDeviations);
    const avgJointVel = jointVels.reduce((a, b) => a + b, 0) / jointVels.length;
    const maxJointVel = Math.max(...jointVels);

    return {
      solverId,
      avgPositionError: avgPosError,
      maxPositionError: maxPosError,
      avgDirectionDeviationDeg: avgDirDev,
      maxDirectionDeviationDeg: maxDirDev,
      avgJointVelocityNorm: avgJointVel,
      maxJointVelocityNorm: maxJointVel,
      successRate: (successfulSteps / trajectory.length) * 100,
      singularityZoneRatio: (singularZoneSteps / trajectory.length) * 100,
    };
  }

  /**
   * Run complete suite of benchmarks across all scenarios.
   */
  public runFullBenchmarkSuite(): IBenchmarkScenarioReport[] {
    const reports: IBenchmarkScenarioReport[] = [];
    const steps = 60;

    // SCENARIO 1: Boundary Outer Reach (Full Extension)
    // Target moves outward past max reach (1.8m), forcing the arm to fully stretch
    const start1: Vector3D = { x: 1.2, y: 0.5, z: 1.0 };
    const end1: Vector3D = { x: 1.85, y: 0.7, z: 1.0 }; // Exceeds L1+L2 (1.8m)
    const initialJoints1: JointState3D = { q1: 0.38, q2: 0.15, q3: 0.3 };
    const traj1 = this.generateTrajectory(start1, end1, steps);

    // SCENARIO 2: Singular Inner Fold (Folded Elbow)
    // Trajectory moves through the inner shoulder space where L1 folds completely against L2
    const start2: Vector3D = { x: 0.6, y: 0.0, z: 0.8 };
    const end2: Vector3D = { x: 0.15, y: 0.0, z: 0.8 }; // Very close to base axis
    const initialJoints2: JointState3D = { q1: 0, q2: Math.PI / 3, q3: -Math.PI / 2 };
    const traj2 = this.generateTrajectory(start2, end2, steps);

    // SCENARIO 3: Shoulder Pole Singularity (Azimuth Vanish)
    // Path crosses the exact center z-axis (x=0, y=0), forcing azimuth flips
    const start3: Vector3D = { x: -0.5, y: 0.1, z: 1.2 };
    const end3: Vector3D = { x: 0.5, y: 0.1, z: 1.2 };
    const initialJoints3: JointState3D = { q1: Math.PI, q2: Math.PI / 4, q3: -Math.PI / 4 };
    const traj3 = this.generateTrajectory(start3, end3, steps);

    const solvers: ('DLS_BASELINE' | 'RICIS_INVARIANT_ENGINE' | 'RICIS_SYMBOLIC_JACOBIAN')[] = [
      'DLS_BASELINE',
      'RICIS_INVARIANT_ENGINE',
      'RICIS_SYMBOLIC_JACOBIAN',
    ];

    // Evaluate Scenario 1
    const metrics1: Record<string, IBenchmarkMetrics> = {};
    for (const s of solvers) {
      metrics1[s] = this.benchmarkSolverOnTrajectory(s, initialJoints1, traj1);
    }
    reports.push({
      scenarioName: 'Boundary Outer Reach (Full Extension)',
      description: 'Tests tracking behavior and recovery when the target moves to or beyond the absolute outer physical boundary (L1 + L2 = 1.8m).',
      metrics: metrics1,
    });

    // Evaluate Scenario 2
    const metrics2: Record<string, IBenchmarkMetrics> = {};
    for (const s of solvers) {
      metrics2[s] = this.benchmarkSolverOnTrajectory(s, initialJoints2, traj2);
    }
    reports.push({
      scenarioName: 'Singular Inner Fold (Folded Elbow)',
      description: 'Tests elbow-folding configuration where the relative angle q3 approaches 0 or pi, causing traditional rank loss.',
      metrics: metrics2,
    });

    // Evaluate Scenario 3
    const metrics3: Record<string, IBenchmarkMetrics> = {};
    for (const s of solvers) {
      metrics3[s] = this.benchmarkSolverOnTrajectory(s, initialJoints3, traj3);
    }
    reports.push({
      scenarioName: 'Shoulder Pole Singularity (Azimuth Vanish)',
      description: 'Tests the coordinate pole singularity when passing directly through or extremely close to the base z-axis (x=0, y=0).',
      metrics: metrics3,
    });

    return reports;
  }
}
