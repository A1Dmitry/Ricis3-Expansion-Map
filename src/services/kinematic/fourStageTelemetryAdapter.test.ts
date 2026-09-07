// ============================================================================
// QA AUTOMATION SUITE: 4-STAGE TELEMETRY ADAPTER TESTS
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { Planar3LinkKinematicService } from './planar3LinkKinematicService';
import { FourStageTelemetryAdapter } from './fourStageTelemetryAdapter';

describe('RICIS-III 4-Stage Real-Time Telemetry Adapter Tests', () => {
  let kinematicService: Planar3LinkKinematicService;
  let adapter: FourStageTelemetryAdapter;
  const standardLinks: [number, number, number] = [0.55, 0.45, 0.25];

  beforeEach(() => {
    kinematicService = new Planar3LinkKinematicService();
    adapter = new FourStageTelemetryAdapter(kinematicService);
  });

  it('QA-TEL-01: в полярном режиме выставляет статус POLAR_ACTIVE для Stage 1', () => {
    const telemetry = adapter.evaluateRealTimeTelemetry(
      [0.2, 0.5, 0.3],
      standardLinks,
      'POLAR',
      0.15
    );
    expect(telemetry.stage1Status).toBe('POLAR_ACTIVE');
    expect(telemetry.executionComplexity).toBe('O(1)');
  });

  it('QA-TEL-02: детектирует резолв сингулярности Stage 2 (RICIS_A6_RESOLVED) при det(J) -> 0', () => {
    const telemetry = adapter.evaluateRealTimeTelemetry(
      [0.0, 0.0, 0.0],
      standardLinks,
      'CARTESIAN',
      0.00001
    );
    expect(telemetry.stage2Status).toBe('RICIS_A6_RESOLVED');
  });

  it('QA-TEL-03: вычисляет статус физического зазора звеньев Stage 3', () => {
    const telemetry = adapter.evaluateRealTimeTelemetry(
      [0.4, 0.6, 0.2],
      standardLinks,
      'CARTESIAN',
      0.22
    );
    expect(telemetry.stage3Collision).toBeDefined();
    expect(telemetry.stage3Collision.isColliding).toBe(false);
    expect(telemetry.stage3Collision.minDistance).toBeGreaterThan(0.04);
  });

  it('QA-TEL-04: фиксирует ранг Stage 4 (Downstream) = 2 для плоского относительного движения', () => {
    const telemetry = adapter.evaluateRealTimeTelemetry(
      [0.1, 0.2, 0.3],
      standardLinks,
      'POLAR',
      0.18
    );
    expect(telemetry.stage4DownstreamRank).toBe(2);
  });
});
