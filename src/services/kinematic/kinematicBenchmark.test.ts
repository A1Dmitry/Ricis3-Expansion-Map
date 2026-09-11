// ============================================================================
// RICIS-III HEADLESS KINEMATIC BENCHMARK UNIT TESTS (P7: DLS VS RICIS BENCHMARK)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect } from 'vitest';
import { KinematicHeadlessBenchmark } from './kinematicBenchmark';

describe('RICIS-III v7.7 Headless Kinematic Benchmark (DLS vs RICIS)', () => {
  const benchmark = new KinematicHeadlessBenchmark();

  it('runs the full benchmark suite across 4 singular scenarios successfully', () => {
    const reports = benchmark.runFullBenchmarkSuite();

    expect(reports.length).toBe(4);

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

  it('demonstrates that RICIS solvers preserve direction better than the DLS baseline at singularities', () => {
    const reports = benchmark.runFullBenchmarkSuite();

    // In Scenario 2 (Singular Inner Fold), classical DLS gets locked/drifts due to rank deficiency,
    // whereas RICIS Symbolic Jacobian decomposes along invariants and maintains tight direction.
    const scenario2 = reports.find(r => r.scenarioName.includes('Singular Inner Fold'));
    expect(scenario2).toBeDefined();

    const dlsDirErr2 = scenario2!.metrics.DLS_BASELINE!.avgDirectionDeviationDeg;
    const symJDirErr2 = scenario2!.metrics.RICIS_SYMBOLIC_JACOBIAN!.avgDirectionDeviationDeg;
    expect(symJDirErr2).toBeLessThan(dlsDirErr2);

    // In Scenario 3 (Shoulder Exact Pole Singularity), DLS experiences azimuthal gimbal lock,
    // whereas RICIS resolves the pole singularity via A6 Geometric Bridge.
    const scenario3 = reports.find(r => r.scenarioName.includes('Shoulder Exact Pole Singularity'));
    expect(scenario3).toBeDefined();

    const dlsDirErr3 = scenario3!.metrics.DLS_BASELINE!.avgDirectionDeviationDeg;
    const symJDirErr3 = scenario3!.metrics.RICIS_SYMBOLIC_JACOBIAN!.avgDirectionDeviationDeg;
    const ricisDirErr3 = scenario3!.metrics.RICIS_INVARIANT_ENGINE!.avgDirectionDeviationDeg;
    expect(symJDirErr3).toBeLessThan(dlsDirErr3);
    expect(ricisDirErr3).toBeLessThan(dlsDirErr3);
  });

  it('demonstrates that RICIS solvers achieve lower tracking error near boundary and folded singularities', () => {
    const reports = benchmark.runFullBenchmarkSuite();

    // In Scenario 1 (Boundary Outer Reach), RICIS maintains lower average tracking error
    const scenario1 = reports.find(r => r.scenarioName.includes('Boundary Outer Reach'));
    expect(scenario1).toBeDefined();
    expect(scenario1!.metrics.RICIS_INVARIANT_ENGINE!.avgPositionError)
      .toBeLessThanOrEqual(scenario1!.metrics.DLS_BASELINE!.avgPositionError);

    // In Scenario 2 (Singular Inner Fold), RICIS solvers maintain significantly lower tracking error
    const scenario2 = reports.find(r => r.scenarioName.includes('Singular Inner Fold'));
    expect(scenario2).toBeDefined();

    const dlsPosErr2 = scenario2!.metrics.DLS_BASELINE!.avgPositionError;
    const ricisPosErr2 = scenario2!.metrics.RICIS_INVARIANT_ENGINE!.avgPositionError;
    const symJPosErr2 = scenario2!.metrics.RICIS_SYMBOLIC_JACOBIAN!.avgPositionError;

    expect(ricisPosErr2).toBeLessThan(dlsPosErr2);
    expect(symJPosErr2).toBeLessThan(dlsPosErr2);
  });
});
