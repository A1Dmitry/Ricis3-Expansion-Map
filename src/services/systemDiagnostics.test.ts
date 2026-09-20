import { describe, it, expect } from 'vitest';
import { auditGeometricBridgeInvariants, runSystemDiagnostics } from './systemDiagnostics';
import type { MapState } from '../model/types';

describe('System Diagnostics Domain Service (RICIS-III v7.7)', () => {
  it('verifies core mathematical Geometric Bridge invariants (A6, A4, A5, A7, L0, L1)', () => {
    const audit = auditGeometricBridgeInvariants();

    expect(audit.isPassed).toBe(true);
    expect(audit.checkedInvariantsCount).toBeGreaterThanOrEqual(7);
    expect(audit.details.length).toBeGreaterThanOrEqual(7);

    // Assert specific RICIS laws verified
    expect(audit.details.some(d => d.includes('A6 Skew Product'))).toBe(true);
    expect(audit.details.some(d => d.includes('Diagonal Telescope'))).toBe(true);
    expect(audit.details.some(d => d.includes('L1_IDENTITY'))).toBe(true);
    expect(audit.details.some(d => d.includes('L0 Absolute Continuity'))).toBe(true);
  });

  it('runs full system diagnostics on a valid MapState without throwing', async () => {
    const mockMapState: MapState = {
      nodes: [
        {
          id: 'test_node_1',
          title: '0/0 Resolution',
          description: 'L1 test',
          state: 'resolved',
          type: 'core_singularity',
          zoneIds: ['zone_algebra'],
          dependencyIds: [],
          dependentIds: [],
          fractalDepth: 0,
          economic: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 },
          targetFunction: '0/0 = 1',
        },
      ],
      edges: [],
      zones: [],
      axioms: [],
      proofs: {},
      agentLogs: [],
    };

    const report = await runSystemDiagnostics(mockMapState);

    expect(report).toBeDefined();
    expect(report.geometricBridge.isPassed).toBe(true);
    expect(report.seedInvariants.isValid).toBe(true);
    expect(report.graphAudit.cyclesDetected).toBe(false);
    expect(report.summaryMessage).toContain('Самодиагностика');
    expect(report.summaryMessage).toMatch(/Мост(: OK| инвариантов O\(1\))/);
  });
});
