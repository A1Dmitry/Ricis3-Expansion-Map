import type {
  Vector3D,
  IKinematicState3D,
  ISolverResult3D,
  IKinematicSolver3D,
} from '../../model/kinematicEngine.contracts';
import { KinematicConstants } from './kinematicConstants';
import { wrapToPi, forwardKinematics3D, computeJacobianDeterminant3D, computeSolverMetrics3D } from './kinematicMath';

/**
 * Abstract Base Class for 3D Kinematic Solvers (SOLID, DRY, OOP).
 * Implements Template Method pattern and encapsulates common mathematical geometry,
 * planar projections, and metric calculations across all concrete solvers.
 */
export abstract class BaseKinematicSolver3D implements IKinematicSolver3D {
  public abstract readonly solverId: IKinematicSolver3D['solverId'];

  public abstract solve(
    currentState: IKinematicState3D,
    targetPosition: Vector3D,
    linkLengths: readonly [number, number, number],
    dt?: number
  ): ISolverResult3D;

  /**
   * Computes desired 3D vector and planar vertical/radial target geometry.
   */
  protected computePlanarTargetGeometry(
    targetPosition: Vector3D,
    currentState: IKinematicState3D,
    linkLengths: readonly [number, number, number]
  ): {
    desiredVector: Vector3D;
    targetAzimuth: number;
    diffQ1: number;
    targetRadial: number;
    targetZRel: number;
    distFromShoulder: number;
    maxReach: number;
    minReach: number;
  } {
    const [L0, L1, L2] = linkLengths;
    const dx = targetPosition.x - currentState.endEffector.x;
    const dy = targetPosition.y - currentState.endEffector.y;
    const dz = targetPosition.z - currentState.endEffector.z;
    const desiredVector: Vector3D = { x: dx, y: dy, z: dz };

    const targetAzimuth = Math.atan2(targetPosition.y, targetPosition.x);
    const diffQ1 = wrapToPi(targetAzimuth - currentState.joints.q1);

    const targetRadial = Math.sqrt(targetPosition.x * targetPosition.x + targetPosition.y * targetPosition.y);
    const targetZRel = targetPosition.z - L0;
    const distFromShoulder = Math.sqrt(targetRadial * targetRadial + targetZRel * targetZRel);

    const maxReach = L1 + L2;
    const minReach = Math.abs(L1 - L2) + KinematicConstants.MIN_REACH_BUFFER_METERS;

    return {
      desiredVector,
      targetAzimuth,
      diffQ1,
      targetRadial,
      targetZRel,
      distFromShoulder,
      maxReach,
      minReach,
    };
  }

  /**
   * Helper to build standard ISolverResult3D using centralized pure metric evaluator.
   */
  protected buildSolverResult(params: {
    currentState: IKinematicState3D;
    nextJoints: import('../../model/kinematicEngine.contracts').JointState3D;
    targetPosition: Vector3D;
    desiredVector: Vector3D;
    linkLengths: readonly [number, number, number];
    dt: number;
    isBoundarySingular?: boolean;
    forcedDirectionDeviation?: number;
    nearSingularityBehavior?: 'stable' | 'degraded' | 'recovered';
    recoverySuccess?: boolean;
    isWorkspaceExceeded?: boolean;
  }): ISolverResult3D {
    const {
      currentState,
      nextJoints,
      targetPosition,
      desiredVector,
      linkLengths,
      dt,
      isBoundarySingular = false,
      forcedDirectionDeviation,
      nearSingularityBehavior,
      recoverySuccess,
      isWorkspaceExceeded = false,
    } = params;

    const [, L1, L2] = linkLengths;
    const nextEE = forwardKinematics3D(nextJoints, linkLengths);
    const actualStepVector: Vector3D = {
      x: nextEE.x - currentState.endEffector.x,
      y: nextEE.y - currentState.endEffector.y,
      z: nextEE.z - currentState.endEffector.z,
    };

    const detJ = computeJacobianDeterminant3D(nextJoints, linkLengths);
    const absDet = Math.abs(detJ);

    const { metrics } = computeSolverMetrics3D({
      desiredVector,
      actualStepVector,
      nextEE,
      targetPosition,
      currentEE: currentState.endEffector,
      absDet,
      maxReach: L1 * L2,
      dt,
      isBoundarySingular,
      forcedDirectionDeviation,
      nearSingularityBehavior,
      recoverySuccess,
    });

    return {
      nextState: {
        timestamp: currentState.timestamp + dt * 1000,
        joints: nextJoints,
        endEffector: nextEE,
        jacobianDeterminant: detJ,
        isSingularZone: absDet < KinematicConstants.SINGULARITY_DETERMINANT_THRESHOLD || isBoundarySingular,
        isWorkspaceBoundaryExceeded: isWorkspaceExceeded,
        gripperClosed: currentState.gripperClosed,
      },
      metrics,
    };
  }
}
