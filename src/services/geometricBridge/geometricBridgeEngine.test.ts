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

  describe('A6 Product (0_F x inf_G)', () => {
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

  describe('A4 Zero Ratio (0_F / 0_G) in R^2_RICIS', () => {
    it('QA-GB-05: Отношение нулей 0_6 / 0_2 = 3 за O(1)', () => {
      const res = engine.resolveZeroRatioGeometric(6, 2);
      expect(res.operation).toBe('A4_RATIO_0_0');
      expect(res.invariantKind).toBe('SCALE_INVARIANT');
      expect(res.invariantValue).toBe(3);
      expect(res.axiomApplied).toBe('A4_ZERO_RATIO');
      expect(res.computationalComplexity).toBe('O(1)');
    });

    it('QA-GB-06: L1_IDENTITY: 0_F / 0_F = 1 (включая 0_0 / 0_0 = 1)', () => {
      const resIdent = engine.resolveZeroRatioGeometric(5, 5);
      expect(resIdent.invariantValue).toBe(1);
      expect(resIdent.isIdentitySatisfied).toBe(true);

      const res0 = engine.resolveZeroRatioGeometric(0, 0);
      expect(res0.invariantValue).toBe(1);
      expect(res0.isIdentitySatisfied).toBe(true);
    });
  });

  describe('A5 Infinity Ratio (inf_F / inf_G) in R^2_RICIS', () => {
    it('QA-GB-07: Отношение бесконечностей inf_12 / inf_3 = 4 за O(1)', () => {
      const res = engine.resolveInfinityRatioGeometric(12, 3);
      expect(res.operation).toBe('A5_RATIO_INF_INF');
      expect(res.invariantKind).toBe('SCALE_INVARIANT');
      expect(res.invariantValue).toBe(4);
      expect(res.axiomApplied).toBe('A5_INFINITY_RATIO');
    });

    it('QA-GB-08: L1_IDENTITY: inf_F / inf_F = 1', () => {
      const res = engine.resolveInfinityRatioGeometric(8, 8);
      expect(res.invariantValue).toBe(1);
      expect(res.isIdentitySatisfied).toBe(true);
    });
  });

  describe('A7/A8 Subtractions in R^2_RICIS', () => {
    it('QA-GB-09: Вычитание бесконечностей: inf_10 - inf_3 = inf_7', () => {
      const res = engine.resolveInfinitySubtractionGeometric(10, 3);
      expect(res.operation).toBe('A7_SUBTRACTION_INF_INF');
      expect(res.invariantKind).toBe('VECTOR_SHIFT_INVARIANT');
      expect(res.invariantValue).toBe(7);
      expect(res.axiomApplied).toBe('A7_INFINITY_SUBTRACTION');
    });

    it('QA-GB-10: Вычитание нулей: 0_9 - 0_4 = 0_5', () => {
      const res = engine.resolveZeroSubtractionGeometric(9, 4);
      expect(res.operation).toBe('A8_SUBTRACTION_0_0');
      expect(res.invariantKind).toBe('VECTOR_SHIFT_INVARIANT');
      expect(res.invariantValue).toBe(5);
      expect(res.axiomApplied).toBe('A8_ZERO_SUBTRACTION');
    });
  });

  describe('Universal Operation Dispatcher', () => {
    it('QA-GB-11: resolveOperation диспетчеризирует все типы операций', () => {
      const p = engine.resolveOperation('A6_PRODUCT_0_INF', 4, 3);
      expect(p.invariantValue).toBe(12);

      const r0 = engine.resolveOperation('A4_RATIO_0_0', 10, 2);
      expect(r0.invariantValue).toBe(5);

      const rInf = engine.resolveOperation('A5_RATIO_INF_INF', 20, 5);
      expect(rInf.invariantValue).toBe(4);

      const sInf = engine.resolveOperation('A7_SUBTRACTION_INF_INF', 15, 5);
      expect(sInf.invariantValue).toBe(10);

      const s0 = engine.resolveOperation('A8_SUBTRACTION_0_0', 8, 3);
      expect(s0.invariantValue).toBe(5);
    });
  });
});
