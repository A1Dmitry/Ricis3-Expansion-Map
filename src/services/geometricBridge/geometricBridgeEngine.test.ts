// ============================================================================
// QA AUTOMATION SUITE: GEOMETRIC BRIDGE (0_F x inf_G = det(u, v) = F * G)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { GeometricBridgeEngine } from './geometricBridgeEngine';

describe('RICIS-III Geometric Bridge Engine Tests', () => {
  let engine: GeometricBridgeEngine;

  beforeEach(() => {
    engine = new GeometricBridgeEngine();
  });

  it('QA-GB-01: Skew Product ортогональных векторов: u=(4, 0), v=(0, 5) => det(u,v) = 20', () => {
    const res = engine.resolveGeometricBridge(4, 5);

    expect(res.degenerateVectorU).toEqual({ x: 4, y: 0, label: '0_4 (length 4, thickness 0)' });
    expect(res.infiniteVectorV).toEqual({ x: 0, y: 5, label: '∞_5 (width 5)' });
    expect(res.skewProductDeterminant).toBe(20);
    expect(res.exactInvariantArea).toBe(20);
    expect(res.computationalComplexity).toBe('O(1)');
    expect(res.classicalComparison.classicalOutcome).toBe('NaN');
  });

  it('QA-GB-02: Диагональный телескопический случай: 0_F x inf_F = F^2', () => {
    const res = engine.resolveGeometricBridge(7, 7);

    expect(res.isDiagonalTelescope).toBe(true);
    expect(res.exactInvariantArea).toBe(49);
    expect(res.skewProductDeterminant).toBe(49);
  });

  it('QA-GB-03: Граничные условия: F = 0 или G = 0', () => {
    const resF0 = engine.resolveGeometricBridge(0, 10);
    expect(resF0.exactInvariantArea).toBe(0);

    const resG0 = engine.resolveGeometricBridge(10, 0);
    expect(resG0.exactInvariantArea).toBe(0);
  });

  it('QA-GB-04: Никаких NaN или бесконечных пределов Коши', () => {
    const res = engine.resolveGeometricBridge(3.5, 2.0);
    expect(Number.isNaN(res.exactInvariantArea)).toBe(false);
    expect(Number.isFinite(res.exactInvariantArea)).toBe(true);
    expect(res.exactInvariantArea).toBe(7.0);
  });
});
