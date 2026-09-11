// ============================================================================
// RICIS-III v7.7 TWO-STAGE SINGULARITY ARCHITECTURAL CONTRACTS
// Base Extensible Types for 3-Link & N-Link Manipulators (Polymorphic DDD)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

export type ParameterizationMode = 'CARTESIAN' | 'POLAR';

export type SingularityClass =
  | 'NONE'
  | 'ELBOW_FOLDED'
  | 'ALIGNED_LINKS'
  | 'FULL_EXTENSION'
  | 'OVERHEAD_SHOULDER'
  | 'MULTI_JOINT_ALIGNMENT';

export interface ISingularValues2D {
  readonly sigma1: number;
  readonly sigma2: number;
  readonly sigmaMin: number;
  readonly conditionNumber: number;
  readonly isSingular: boolean;
  readonly singularityType: SingularityClass;
}

export interface IJacobianMatrix2xN {
  readonly dof: number;
  readonly rows: readonly (readonly number[])[];
  readonly determinantMeasure: number;
  readonly mode: ParameterizationMode;
}

export interface IJacobianMatrix2x3 extends IJacobianMatrix2xN {
  readonly dof: 3;
  readonly rows: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
  ];
}

export interface IRicisReductionOverlayState {
  readonly isActive: boolean;
  readonly typedZeroNotation: string; // e.g. "0_{det J(q_s)}"
  readonly originatingExpression: string; // Algebraic originating formula
  readonly kernelBasis: readonly (readonly number[])[]; // Null-space vectors
  readonly preservedDirections: readonly {
    readonly joint: number;
    readonly vector: readonly [number, number];
    readonly label: string;
  }[];
  readonly lostDirections: readonly {
    readonly joint: number;
    readonly vector: readonly [number, number];
    readonly label: string;
  }[];
  readonly adaptiveLambda: number;
  readonly escapeDirectionJointSpace: readonly number[]; // Delta q in null space
  readonly escapeVectorTaskSpace: readonly [number, number]; // Cartesian vector at end-effector
  readonly explanationText: string;
}

export interface ISingularityHeatmapGrid {
  readonly resolution: number;
  readonly theta2Range: readonly [number, number]; // [min, max]
  readonly theta3Range: readonly [number, number]; // [min, max]
  readonly cartesianSigmaMinGrid: readonly (readonly number[])[];
  readonly polarSigmaMinGrid: readonly (readonly number[])[];
}

export interface IWalkthroughStep {
  readonly id: number;
  readonly title: string;
  readonly engineeringAnnotation: string;
  readonly mathDetail: string;
  readonly targetJoints: readonly [number, number, number];
  readonly forcedMode?: ParameterizationMode;
  readonly durationMs: number;
  readonly stage: 'STAGE_1_POLAR' | 'STAGE_2_RICIS' | 'NORMAL' | 'RECOVERY';
}

export interface IAsyncNodeCriticalLogEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly eventType:
    | 'POLAR_TRANSITION_TRIGGER'
    | 'SINGULARITY_DETECTED'
    | 'RICIS_REDUCTION_APPLIED'
    | 'NULLSPACE_ESCAPE_EXECUTED'
    | 'PARAMETERIZATION_SWITCH';
  readonly message: string;
  readonly jointAnglesDeg: readonly number[];
  readonly sigmaMin: number;
  readonly mode: ParameterizationMode;
  readonly typedZero?: string;
  readonly adaptiveLambda?: number;
}

/**
 * Base Polymorphic Kinematic Service Contract for N-Link Manipulators.
 * Enables 3-Link, 5-Link, and generic N-DOF implementations.
 */
export interface IGenericKinematicManipulatorService<TJoints extends readonly number[], TLinks extends readonly number[]> {
  readonly dof: number;
  readonly taskDimension: number;

  computeForwardKinematics(joints: TJoints, links: TLinks): readonly [number, number];
  computeJacobian(joints: TJoints, links: TLinks, mode: ParameterizationMode): IJacobianMatrix2xN;
  computeSingularValues(J: IJacobianMatrix2xN): ISingularValues2D;
  evaluateRicisReduction(joints: TJoints, links: TLinks, mode: ParameterizationMode): IRicisReductionOverlayState;
  calculateSelfMotionEscape(joints: TJoints, links: TLinks): readonly number[];
}

export interface ITwoStageKinematicService extends IGenericKinematicManipulatorService<readonly [number, number, number], readonly [number, number, number]> {
  computeJacobian(joints: readonly [number, number, number], links: readonly [number, number, number], mode: ParameterizationMode): IJacobianMatrix2x3;
  generateHeatmapGrid(fixedTheta1: number, links: readonly [number, number, number], resolution: number): ISingularityHeatmapGrid;
}
