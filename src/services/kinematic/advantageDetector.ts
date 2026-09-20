import type {
  IAdvantageEvent,
  ISolverMetrics3D,
} from '../../model/kinematicEngine.contracts';
import { QA_ADVANTAGE_THRESHOLDS as T } from './qaMetricConstants';

/**
 * Advantage Detector for RICIS-III vs Classical DLS Solver (DDD & SOLID).
 * Triggers when DLS suffers from singularity damping, direction drift, or velocity spikes,
 * while RICIS maintains invariant projection and stability.
 */
export function detectAdvantageEvent(
  jacobianDet: number,
  dlsMetrics: ISolverMetrics3D,
  ricisMetrics: ISolverMetrics3D,
  timestamp: number
): IAdvantageEvent | null {
  const absDet = Math.abs(jacobianDet);
  const isNearSingularity = absDet < T.nearSingularityAbsDet;

  // Condition 1: Direction Loss in DLS
  if (isNearSingularity && dlsMetrics.directionPreservedDeg > T.dlsDirectionLostDeg && ricisMetrics.directionPreservedDeg < T.ricisDirectionHeldDeg) {
    return {
      id: `adv-dir-${timestamp}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      kind: 'DIRECTION_LOSS_PREVENTED',
      description: `DLS lost vector by ${dlsMetrics.directionPreservedDeg.toFixed(1)}° near det(J)=${absDet.toFixed(3)}, RICIS retained direction within ${ricisMetrics.directionPreservedDeg.toFixed(1)}°`,
      jacobianDet: absDet,
      dlsDirectionLoss: dlsMetrics.directionPreservedDeg,
      ricisDirectionLoss: ricisMetrics.directionPreservedDeg,
      dlsVelocityError: dlsMetrics.velocityError,
      ricisVelocityError: ricisMetrics.velocityError,
    };
  }

  // Condition 2: Velocity Spike Avoided
  if (isNearSingularity && dlsMetrics.velocityError > T.dlsVelocityExplosionMps && ricisMetrics.velocityError < T.ricisVelocitySmoothMps) {
    return {
      id: `adv-vel-${timestamp}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      kind: 'VELOCITY_SPIKE_AVOIDED',
      description: `DLS damping caused velocity explosion (${dlsMetrics.velocityError.toFixed(2)} m/s), RICIS smooth O(1) step (${ricisMetrics.velocityError.toFixed(2)} m/s)`,
      jacobianDet: absDet,
      dlsDirectionLoss: dlsMetrics.directionPreservedDeg,
      ricisDirectionLoss: ricisMetrics.directionPreservedDeg,
      dlsVelocityError: dlsMetrics.velocityError,
      ricisVelocityError: ricisMetrics.velocityError,
    };
  }

  // Condition 3: Invariant Preserved in Singular Zone
  if (absDet < T.criticalSingularityAbsDet && ricisMetrics.invariantPreserved && dlsMetrics.nearSingularityBehavior === 'degraded') {
    return {
      id: `adv-inv-${timestamp}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      kind: 'INVARIANT_PRESERVED',
      description: `Critical singularity det(J)=${absDet.toFixed(4)}. RICIS solved exact O(1) manifold projection, DLS stalled`,
      jacobianDet: absDet,
      dlsDirectionLoss: dlsMetrics.directionPreservedDeg,
      ricisDirectionLoss: ricisMetrics.directionPreservedDeg,
      dlsVelocityError: dlsMetrics.velocityError,
      ricisVelocityError: ricisMetrics.velocityError,
    };
  }

  return null;
}
