// ============================================================================
// QA AUTOMATION SUITE: RICIS-III SAFETY PROTOCOLS (SP1 - SP4)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { SafetyProtocolsVerifier } from './safetyProtocolsVerifier';
import type { IRationalZeroFactorExpression } from './safetyProtocols.contracts';

describe('RICIS-III Safety Protocols (SP1 - SP4) Tests', () => {
  let verifier: SafetyProtocolsVerifier;

  beforeEach(() => {
    verifier = new SafetyProtocolsVerifier();
  });

  it('QA-SP-01: SP1 Locality Rule: в (x-5)(x+5)/(x-5) при x=5 хвост (x+5) остается активным и равен 10', () => {
    const expr: IRationalZeroFactorExpression = {
      numeratorFactors: ['x - 5', 'x + 5'],
      denominatorFactors: ['x - 5'],
      pointVariable: 'x',
      pointValue: 5,
    };

    const res = verifier.verifyRationalSingularity(expr);

    expect(res.sp1LocalityReport.isCompliant).toBe(true);
    expect(res.paradoxPrevented).toBe(true); // Предотвращен ложный вывод "1 = 10"
    expect(res.activeTailExpression).toBe('(x + 5)');
    expect(res.resolvedInvariant).toBe('10');
  });

  it('QA-SP-02: SP2 Reduction Priority: одинаковые множители сокращаются ДО аксиом сингулярности', () => {
    const expr: IRationalZeroFactorExpression = {
      numeratorFactors: ['x - 2', 'x^2 + 1'],
      denominatorFactors: ['x - 2'],
      pointVariable: 'x',
      pointValue: 2,
    };

    const res = verifier.verifyRationalSingularity(expr);

    expect(res.sp2ReductionPriorityReport.isCompliant).toBe(true);
    expect(res.resolvedInvariant).toBe('5'); // 2^2 + 1 = 5
  });

  it('QA-SP-03: SP3 Index Law: если сокращение невозможно, 0_F / 0_G определяется соотношением индексов F / G', () => {
    const expr: IRationalZeroFactorExpression = {
      numeratorFactors: ['3*(x - 1)'],
      denominatorFactors: ['2*(x - 1)'],
      pointVariable: 'x',
      pointValue: 1,
    };

    const res = verifier.verifyRationalSingularity(expr);

    expect(res.sp3IndexLawReport.isCompliant).toBe(true);
    expect(res.resolvedInvariant).toBe('1.5'); // 3/2
  });

  it('QA-SP-04: SP4 Semantic Priority: индексация только по выражению E(x)|x=a, никогда не по 0_0 или 0_(4-4)', () => {
    const statusGood = verifier.verifySemanticIndexing('x^2 - 4', 0);
    expect(statusGood.isCompliant).toBe(true);
    expect(statusGood.details).toContain('0_(x^2 - 4)');

    const statusBad = verifier.verifySemanticIndexing('4 - 4', 0);
    expect(statusBad.isCompliant).toBe(false);
  });
});
