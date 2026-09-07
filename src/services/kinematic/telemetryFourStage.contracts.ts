// ============================================================================
// RICIS-III REAL-TIME TELEMETRY & 4-STAGE PIPELINE ADAPTER CONTRACTS
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type { ISelfCollisionReport } from './fourStagePipeline.contracts';
import type { ParameterizationMode } from './twoStageSingularity.contracts';

export type Stage1TelemetryStatus =
  | 'POLAR_ACTIVE'
  | 'CARTESIAN_STABLE'
  | 'REPRESENTATION_SINGULARITY_AVOIDED';

export type Stage2TelemetryStatus =
  | 'REGULAR_DOMAIN'
  | 'RICIS_A6_RESOLVED'
  | 'NULL_SPACE_SELF_MOTION';

export interface IRealTimeStageTelemetry {
  readonly stage1Status: Stage1TelemetryStatus;
  readonly stage2Status: Stage2TelemetryStatus;
  readonly stage3Collision: ISelfCollisionReport;
  readonly stage4DownstreamRank: number;
  readonly executionComplexity: 'O(1)';
}

export interface IRicisAdvantageClearanceEvent {
  readonly id: string;
  readonly timestamp: number;
  readonly kind: 'PHYSICAL_CLEARANCE_PRESERVED' | 'A6_SINGULAR_TRANSITION' | 'POLAR_REPARAMETRIZATION';
  readonly minDistanceCm: number;
  readonly safeClearanceMarginCm: number;
  readonly description: string;
}

export interface IFourStageTelemetryAdapter {
  evaluateRealTimeTelemetry(
    joints: readonly [number, number, number],
    links: readonly [number, number, number],
    mode: ParameterizationMode,
    jacobianDeterminant: number
  ): IRealTimeStageTelemetry;
}
