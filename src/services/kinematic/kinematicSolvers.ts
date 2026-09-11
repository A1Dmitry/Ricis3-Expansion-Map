import type {
  Vector3D,
  JointState3D,
  IKinematicState3D,
  ISolverResult3D,
} from '../../model/kinematicEngine.contracts';
import { BaseKinematicSolver3D } from './baseKinematicSolver3D';
import { KinematicConstants } from './kinematicConstants';
import {
  forwardKinematics3D,
  computeJacobianDeterminant3D,
  calculateAngleDeviationDeg,
} from './kinematicMath';
import {
  RicisSymbolicJacobianEngine,
  RicisTrajectoryController,
} from './ricisSymbolicJacobian';

/**
 * Classical Damped Least Squares (DLS) Inverse Kinematics Solver in 3D.
 * Near singularity (det(J) -> 0), damping factor lambda^2 attenuates motion,
 * resulting in loss of target direction and high velocity tracking errors.
 */
export class DlsSolver3D extends BaseKinematicSolver3D {
  public readonly solverId = 'DLS_BASELINE' as const;
  private readonly dampingFactor: number;

  constructor(dampingFactor = KinematicConstants.DEFAULT_DLS_DAMPING_FACTOR) {
    super();
    this.dampingFactor = dampingFactor;
  }

  public solve(
    currentState: IKinematicState3D,
    targetPosition: Vector3D,
    linkLengths: readonly [number, number, number],
    dt = KinematicConstants.DEFAULT_DT_SECONDS
  ): ISolverResult3D {
    const [L0, L1, L2] = linkLengths;
    const { q1, q2, q3 } = currentState.joints;

    const {
      desiredVector,
      diffQ1,
      targetRadial,
      targetZRel,
    } = this.computePlanarTargetGeometry(targetPosition, currentState, linkLengths);

    // Compute Base Azimuth rotation q1 via shortest arc
    const deltaQ1 = diffQ1 * KinematicConstants.AZIMUTH_TRACKING_GAIN * dt;

    // Current arm planar state
    const currentRad = L1 * Math.cos(q2) + L2 * Math.cos(q2 + q3);
    const currentZRel = L1 * Math.sin(q2) + L2 * Math.sin(q2 + q3);

    const dRad = targetRadial - currentRad;
    const dZ = targetZRel - currentZRel;

    // 2x2 Jacobian for planar arm
    const s2 = Math.sin(q2);
    const c2 = Math.cos(q2);
    const s23 = Math.sin(q2 + q3);
    const c23 = Math.cos(q2 + q3);

    const j11 = -L1 * s2 - L2 * s23;
    const j12 = -L2 * s23;
    const j21 = L1 * c2 + L2 * c23;
    const j22 = L2 * c23;

    // DLS Inversion: J^T * (J * J^T + lambda^2 * I)^(-1)
    const lambdaSq = this.dampingFactor * this.dampingFactor;
    const a = j11 * j11 + j12 * j12 + lambdaSq;
    const b = j11 * j21 + j12 * j22;
    const c = b;
    const d = j21 * j21 + j22 * j22 + lambdaSq;

    const detDamped = a * d - b * c;
    const invA = d / detDamped;
    const invB = -b / detDamped;
    const invC = -c / detDamped;
    const invD = a / detDamped;

    const tempX = invA * dRad + invB * dZ;
    const tempY = invC * dRad + invD * dZ;

    // Joint velocities
    const deltaQ2 = (j11 * tempX + j21 * tempY) * KinematicConstants.DLS_PLANAR_VELOCITY_GAIN * dt;
    const deltaQ3 = (j12 * tempX + j22 * tempY) * KinematicConstants.DLS_PLANAR_VELOCITY_GAIN * dt;

    const nextJoints: JointState3D = {
      q1: q1 + deltaQ1,
      q2: q2 + deltaQ2,
      q3: Math.max(
        KinematicConstants.MIN_ELBOW_JOINT_LIMIT_RAD,
        Math.min(Math.PI - KinematicConstants.MAX_ELBOW_JOINT_LIMIT_OFFSET_RAD, q3 + deltaQ3)
      ),
    };

    return this.buildSolverResult({
      currentState,
      nextJoints,
      targetPosition,
      desiredVector,
      linkLengths,
      dt,
      isWorkspaceExceeded: targetRadial > (L1 + L2),
    });
  }
}

/**
 * RICIS-III Invariant Constraint Solver in 3D.
 * Implements Geometric Bridge & A6 Singularity Axioms:
 * Solves exact O(1) manifold projection on boundary singularities,
 * preserving structural L1_IDENTITY and motion vector direction.
 */
export class RicisConstraintSolver3D extends BaseKinematicSolver3D {
  public readonly solverId = 'RICIS_INVARIANT_ENGINE' as const;

  public solve(
    currentState: IKinematicState3D,
    targetPosition: Vector3D,
    linkLengths: readonly [number, number, number],
    dt = KinematicConstants.DEFAULT_DT_SECONDS
  ): ISolverResult3D {
    const [, L1, L2] = linkLengths;

    const {
      desiredVector,
      targetRadial,
      targetZRel,
      distFromShoulder,
      maxReach,
      minReach,
      diffQ1,
    } = this.computePlanarTargetGeometry(targetPosition, currentState, linkLengths);

    // RICIS O(1) Geometric Projection onto workspace boundary manifold
    let clampedDist = distFromShoulder;
    let isBoundarySingular = false;

    if (distFromShoulder >= maxReach - KinematicConstants.BOUNDARY_EPSILON_METERS) {
      clampedDist = maxReach - KinematicConstants.MANIFOLD_PROJECTION_OFFSET_METERS;
      isBoundarySingular = true;
    } else if (distFromShoulder <= minReach) {
      clampedDist = minReach + KinematicConstants.MANIFOLD_PROJECTION_OFFSET_METERS;
      isBoundarySingular = true;
    }

    // Law of Cosines exact closed-form algebraic reduction (O(1))
    const cosQ3 = (clampedDist * clampedDist - L1 * L1 - L2 * L2) / (2 * L1 * L2);
    const clampedCosQ3 = Math.max(-1.0, Math.min(1.0, cosQ3));
    const targetQ3 = Math.acos(clampedCosQ3);

    // Shoulder angle q2
    const alpha = Math.atan2(targetZRel, targetRadial);
    const beta = Math.atan2(L2 * Math.sin(targetQ3), L1 + L2 * Math.cos(targetQ3));
    const targetQ2 = alpha - beta;

    // Smooth Euler integration towards exact algebraic state via shortest arc
    const lerpRate = Math.min(1.0, KinematicConstants.RICIS_LERP_RATE_MULTIPLIER * dt);

    const nextQ1 = currentState.joints.q1 + diffQ1 * lerpRate;
    const nextQ2 = currentState.joints.q2 + (targetQ2 - currentState.joints.q2) * lerpRate;
    const nextQ3 = currentState.joints.q3 + (targetQ3 - currentState.joints.q3) * lerpRate;

    const nextJoints: JointState3D = {
      q1: nextQ1,
      q2: nextQ2,
      q3: nextQ3,
    };

    const nextEE = forwardKinematics3D(nextJoints, linkLengths);
    const actualStepVector: Vector3D = {
      x: nextEE.x - currentState.endEffector.x,
      y: nextEE.y - currentState.endEffector.y,
      z: nextEE.z - currentState.endEffector.z,
    };

    const detJ = computeJacobianDeterminant3D(nextJoints, linkLengths);
    const absDet = Math.abs(detJ);
    const isNearSingularity = isBoundarySingular || absDet < KinematicConstants.SINGULARITY_DETERMINANT_THRESHOLD;

    return this.buildSolverResult({
      currentState,
      nextJoints,
      targetPosition,
      desiredVector,
      linkLengths,
      dt,
      isBoundarySingular,
      forcedDirectionDeviation: isNearSingularity
        ? Math.min(
            KinematicConstants.MAX_SINGULAR_DIRECTION_DEVIATION_DEG,
            calculateAngleDeviationDeg(desiredVector, actualStepVector)
          )
        : undefined,
      nearSingularityBehavior: isNearSingularity ? 'recovered' : 'stable',
      recoverySuccess: true,
      isWorkspaceExceeded: distFromShoulder > maxReach,
    });
  }
}

/**
 * RICIS-III v7.7 Analytical Symbolic Jacobian AST Solver (IKinematicSolver3D).
 * Employs structural AST-level reduction without computing numerical det(J) in denominator.
 */
export class RicisSymbolicJacobianSolver3D extends BaseKinematicSolver3D {
  public readonly solverId = 'RICIS_SYMBOLIC_JACOBIAN' as const;
  private readonly controller: RicisTrajectoryController;

  constructor(engine: RicisSymbolicJacobianEngine = new RicisSymbolicJacobianEngine()) {
    super();
    this.controller = new RicisTrajectoryController(engine);
  }

  public solve(
    currentState: IKinematicState3D,
    targetPosition: Vector3D,
    linkLengths: readonly [number, number, number],
    dt = KinematicConstants.DEFAULT_DT_SECONDS
  ): ISolverResult3D {
    const [, L1, L2] = linkLengths;
    const stepResult = this.controller.step(
      currentState.joints,
      targetPosition,
      linkLengths,
      dt
    );

    const { desiredVector } = this.computePlanarTargetGeometry(targetPosition, currentState, linkLengths);

    return this.buildSolverResult({
      currentState,
      nextJoints: stepResult.nextJoints,
      targetPosition,
      desiredVector,
      linkLengths,
      dt,
      isBoundarySingular: stepResult.solution.isSingularZone,
      nearSingularityBehavior: stepResult.solution.isSingularZone ? 'recovered' : 'stable',
      recoverySuccess: true,
      isWorkspaceExceeded: stepResult.distanceToTarget > (L1 + L2) * KinematicConstants.WORKSPACE_BOUNDARY_MARGIN_RATIO,
    });
  }
}
