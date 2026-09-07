// ============================================================================
// RICIS-III 4-STAGE KINEMATIC PIPELINE CONTRACTS (DDD / SOLID)
// 1. Polar Transition (Representation singularities)
// 2. RICIS Reduction (Residual singularities)
// 3. Self-Collision Check (Physical geometric constraints)
// 4. Downstream Relative Motion (Relative frame invariance)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type { ParameterizationMode } from './twoStageSingularity.contracts';

export interface ISelfCollisionReport {
  readonly isColliding: boolean;
  readonly minDistance: number;
  readonly safeClearanceMargin: number;
  readonly collidingLinkPair?: readonly [number, number];
}

export interface IDownstreamRelativeChainReport {
  readonly isRelativeMotionPreserved: boolean;
  readonly relativeTransformRank: number; // e.g. 2 for planar position
  readonly cumulativeEndEffectorFrame: readonly [number, number];
}

export interface IFourStageKinematicReport {
  readonly stage1PolarTransition: {
    readonly isRepresentationSingularityEliminated: boolean;
    readonly parameterizationMode: ParameterizationMode;
    readonly clusterRadius: number;
  };
  readonly stage2RicisReduction: {
    readonly isResidualSingularityResolved: boolean;
    readonly sigmaMin: number;
    readonly kernelRank: number;
    readonly adaptiveLambda: number;
    readonly typedZero: string;
  };
  readonly stage3SelfCollision: ISelfCollisionReport;
  readonly stage4DownstreamMotion: IDownstreamRelativeChainReport;
}

export interface IFourStageKinematicService {
  evaluateFourStagePipeline(
    joints: readonly [number, number, number],
    links: readonly [number, number, number],
    mode: ParameterizationMode
  ): IFourStageKinematicReport;

  checkSelfCollision(
    joints: readonly [number, number, number],
    links: readonly [number, number, number],
    linkRadius?: number
  ): ISelfCollisionReport;
}
