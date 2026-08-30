import type {
  IAdvantageEvent,
  ISolverMetrics3D,
} from '../../model/kinematicEngine.contracts';

/**
 * Advantage Detector for RICIS-III vs Classical DLS Solver.
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
  const isNearSingularity = absDet < 0.18;

  // Condition 1: Direction Loss in DLS
  if (isNearSingularity && dlsMetrics.directionPreservedDeg > 12.0 && ricisMetrics.directionPreservedDeg < 6.0) {
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
  if (isNearSingularity && dlsMetrics.velocityError > 1.8 && ricisMetrics.velocityError < 0.8) {
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
  if (absDet < 0.05 && ricisMetrics.invariantPreserved && dlsMetrics.nearSingularityBehavior === 'degraded') {
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
