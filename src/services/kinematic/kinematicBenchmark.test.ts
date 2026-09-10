// ============================================================================
// RICIS-III HEADLESS KINEMATIC BENCHMARK UNIT TESTS (P7: DLS VS RICIS BENCHMARK)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect } from 'vitest';
import { KinematicHeadlessBenchmark } from './kinematicBenchmark';

describe('RICIS-III v7.7 Headless Kinematic Benchmark (DLS vs RICIS)', () => {
  const benchmark = new KinematicHeadlessBenchmark();

  it('runs the full benchmark suite across 3 singular scenarios successfully', () => {
    const reports = benchmark.runFullBenchmarkSuite();

    expect(reports.length).toBe(3);

    // Verify all scenarios have metrics for each solver
    for (const r of reports) {
      expect(r.scenarioName).toBeDefined();
      expect(r.description).toBeDefined();
      expect(r.metrics.DLS_BASELINE).toBeDefined();
      expect(r.metrics.RICIS_INVARIANT_ENGINE).toBeDefined();
      expect(r.metrics.RICIS_SYMBOLIC_JACOBIAN).toBeDefined();

      // Verify DLS_BASELINE metrics are valid numbers
      const dls = r.metrics.DLS_BASELINE!;
      expect(Number.isFinite(dls.avgPositionError)).toBe(true);
      expect(Number.isFinite(dls.avgDirectionDeviationDeg)).toBe(true);
      expect(Number.isFinite(dls.successRate)).toBe(true);

      // Verify RICIS_INVARIANT_ENGINE metrics are valid numbers
      const ricis = r.metrics.RICIS_INVARIANT_ENGINE!;
      expect(Number.isFinite(ricis.avgPositionError)).toBe(true);
      expect(Number.isFinite(ricis.avgDirectionDeviationDeg)).toBe(true);
      expect(Number.isFinite(ricis.successRate)).toBe(true);

      // Verify RICIS_SYMBOLIC_JACOBIAN metrics are valid numbers
      const symJ = r.metrics.RICIS_SYMBOLIC_JACOBIAN!;
      expect(Number.isFinite(symJ.avgPositionError)).toBe(true);
      expect(Number.isFinite(symJ.avgDirectionDeviationDeg)).toBe(true);
      expect(Number.isFinite(symJ.successRate)).toBe(true);
    }
  });

  it('demonstrates that RICIS solvers preserve direction better than the DLS baseline', () => {
    const reports = benchmark.runFullBenchmarkSuite();

    // In Scenario 1 (Boundary Outer Reach / Full Extension), classical DLS gets "frozen" or drifts
    // leading to high direction deviation, whereas RICIS preserves the direction vector.
    const scenario1 = reports.find(r => r.scenarioName.includes('Boundary Outer Reach'));
    expect(scenario1).toBeDefined();

    const dlsDirErr = scenario1!.metrics.DLS_BASELINE!.avgDirectionDeviationDeg;
    const ricisDirErr = scenario1!.metrics.RICIS_INVARIANT_ENGINE!.avgDirectionDeviationDeg;
    const symJDirErr = scenario1!.metrics.RICIS_SYMBOLIC_JACOBIAN!.avgDirectionDeviationDeg;

    // RICIS solvers should have tighter direction deviation compared to the Damped Least Squares fallback
    expect(ricisDirErr).toBeLessThan(dlsDirErr);
    expect(symJDirErr).toBeLessThan(dlsDirErr);
  });

  it('demonstrates that RICIS solvers have higher success rates near folded singularities', () => {
    const reports = benchmark.runFullBenchmarkSuite();

    // In Scenario 2 (Singular Inner Fold), DLS gets highly degraded and loses tracking,
    // whereas RICIS recovers tracking quickly.
    const scenario2 = reports.find(r => r.scenarioName.includes('Singular Inner Fold'));
    expect(scenario2).toBeDefined();

    const dlsSuccess = scenario2!.metrics.DLS_BASELINE!.successRate;
    const ricisSuccess = scenario2!.metrics.RICIS_INVARIANT_ENGINE!.successRate;
    const symJSuccess = scenario2!.metrics.RICIS_SYMBOLIC_JACOBIAN!.successRate;

    // RICIS solvers should achieve equal or higher success rate in trajectory tracking
    expect(ricisSuccess).toBeGreaterThanOrEqual(dlsSuccess);
    expect(symJSuccess).toBeGreaterThanOrEqual(dlsSuccess);
  });
});
