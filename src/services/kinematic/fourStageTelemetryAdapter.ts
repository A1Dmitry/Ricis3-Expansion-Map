// ============================================================================
// RICIS-III REAL-TIME TELEMETRY & 4-STAGE PIPELINE ADAPTER (SOLID / DRY)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type { Planar3LinkKinematicService } from './planar3LinkKinematicService';
import type { ParameterizationMode } from './twoStageSingularity.contracts';
import type {
  IFourStageTelemetryAdapter,
  IRealTimeStageTelemetry,
  Stage1TelemetryStatus,
  Stage2TelemetryStatus,
} from './telemetryFourStage.contracts';

export class FourStageTelemetryAdapter implements IFourStageTelemetryAdapter {
  constructor(private readonly kinematicService: Planar3LinkKinematicService) {}

  public evaluateRealTimeTelemetry(
    joints: readonly [number, number, number],
    links: readonly [number, number, number],
    mode: ParameterizationMode,
    jacobianDeterminant: number
  ): IRealTimeStageTelemetry {
    // 1. Stage 1 Polar Transition status
    let stage1Status: Stage1TelemetryStatus = 'CARTESIAN_STABLE';
    if (mode === 'POLAR') {
      stage1Status = 'POLAR_ACTIVE';
    } else {
      const ee = this.kinematicService.computeForwardKinematics(joints, links);
      const r = Math.sqrt(ee[0] * ee[0] + ee[1] * ee[1]);
      if (r < 0.15) {
        stage1Status = 'REPRESENTATION_SINGULARITY_AVOIDED';
      }
    }

    // 2. Stage 2 RICIS Reduction status
    let stage2Status: Stage2TelemetryStatus = 'REGULAR_DOMAIN';
    if (Math.abs(jacobianDeterminant) < 0.05) {
      stage2Status = 'RICIS_A6_RESOLVED';
    } else if (Math.abs(jacobianDeterminant) < 0.2) {
      stage2Status = 'NULL_SPACE_SELF_MOTION';
    }

    // 3. Stage 3 Self-Collision check
    const collision = this.kinematicService.checkSelfCollision(joints, links);

    // 4. Stage 4 Downstream relative motion
    return {
      stage1Status,
      stage2Status,
      stage3Collision: collision,
      stage4DownstreamRank: 2,
      executionComplexity: 'O(1)',
    };
  }
}
