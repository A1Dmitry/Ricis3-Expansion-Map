// ============================================================================
// INTERCEPTION BENCHMARK REGRESSION GUARDS (LLM-benchmark specification)
// Locks the objective score table of the RICIS/geometric pipeline lane:
//   - battery expectations (catchable => caught in either outcome mode,
//     unreachable => DECLARED unreachable, never a chase-forever hang),
//   - UNKNOWN SCENARIO batch (seeded): system knows nothing beforehand,
//   - zero joint-limit / collision violations across the whole benchmark,
//   - IK precision and FK self-verification on every caught ball,
//   - determinism: identical inputs produce identical outcome signatures.
// ============================================================================

import { describe, expect, it } from 'vitest';
import {
  generateUnknownScenarioBatch,
  INTERCEPTION_SCENARIO_BATTERY,
  runInterceptionBenchmark,
} from './interceptionBenchmark';

describe('Interception benchmark — standardized 10-case battery (Tests C–E of the spec)', () => {
  const report = runInterceptionBenchmark(INTERCEPTION_SCENARIO_BATTERY);

  it('every scenario meets its specification expectation (catch declared vs delivered)', () => {
    expect(report.expectationViolations).toEqual([]);
    for (const row of report.scenarios) expect(row.expectationMet).toBe(true);
  });

  it('catches 100% of catchable balls, both outcome modes present (mid-air AND floor pickup)', () => {
    expect(report.catchRateExpected).toBe(1);
    expect(report.scenarios.some(r => r.outcome === 'MID_AIR')).toBe(true);
    expect(report.scenarios.some(r => r.outcome === 'FLOOR_PICKUP')).toBe(true);
  });

  it('detects unreachable balls instead of hanging (Test 8 & Test 9 of the spec)', () => {
    const unreachable = report.scenarios.filter(r => r.outcome === 'UNREACHABLE');
    expect(unreachable.map(r => r.spec.id)).toEqual(['T08-unreachable', 'T09-too-fast']);
    // Detection must be prompt — the scenario machine advanced, no chase-forever.
    for (const row of unreachable) expect(row.stepsSimulated).toBeLessThan(400);
  });

  it('zero joint-limit and collision violations across the whole battery', () => {
    expect(report.totalJointLimitViolations).toBe(0);
    expect(report.totalCollisionViolations).toBe(0);
  });

  it('IK precision: every grasp happens inside the gripper radius and FK self-verifies', () => {
    for (const row of report.scenarios) {
      if (row.ikErrorM === null) continue;
      expect(row.ikErrorM, `${row.spec.id}: grasp outside gripper radius`).toBeLessThanOrEqual(0.121);
    }
    // FK verification row of the spec: reported EE never drifts from FK(joints).
    expect(report.maxFkDriftM).toBeLessThan(1e-9);
  });

  it('is deterministic: two full battery runs produce identical signatures', () => {
    const rerun = runInterceptionBenchmark(INTERCEPTION_SCENARIO_BATTERY);
    expect(rerun.determinismSignature).toBe(report.determinismSignature);
  });
});

describe('Interception benchmark — UNKNOWN SCENARIO batch (seeded, unseen inputs)', () => {
  it('catches the strong majority of unseen shots with no expectation tuning', () => {
    const unknown = runInterceptionBenchmark(generateUnknownScenarioBatch(7, 10));
    expect(unknown.totalScenarios).toBe(10);
    // Measured 10/10 at implementation time; the guard keeps engineering margin.
    expect(unknown.catchCount).toBeGreaterThanOrEqual(8);
    expect(unknown.totalJointLimitViolations).toBe(0);
    expect(unknown.totalCollisionViolations).toBe(0);
    expect(unknown.maxFkDriftM).toBeLessThan(1e-9);
  });

  it('seeding is deterministic: same seed → same scenarios', () => {
    const batchA = generateUnknownScenarioBatch(7, 10);
    const batchB = generateUnknownScenarioBatch(7, 10);
    expect(batchA).toEqual(batchB);
    const reportA = runInterceptionBenchmark(batchA);
    const reportB = runInterceptionBenchmark(batchB);
    expect(reportA.determinismSignature).toBe(reportB.determinismSignature);
  });
});
