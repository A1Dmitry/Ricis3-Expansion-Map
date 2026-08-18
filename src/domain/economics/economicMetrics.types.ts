/**
 * Shared economic metrics used by both persisted domain entities and benchmark fixtures.
 * The four values form the reusable economic invariant; reward metadata stays specialized.
 */
export interface EconomicMetrics {
  costUnresolved: number;
  costToSolve: number;
  marketGain: number;
  riskLoss: number;
}

/** Economic profile attached to a persisted map entity. */
export interface EconomicInfo extends EconomicMetrics {}

/** Benchmark economics with optional reward-specific metadata. */
export interface BenchmarkEconomicProfile extends EconomicMetrics {
  rewardClass?: 'clay' | 'nobel' | 'commercial' | 'reputation';
  prizeNote?: string;
}
