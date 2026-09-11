// ============================================================================
// QA AUTOMATION SUITE: RATIONAL SINGULARITY ENGINE & LEAN A1_div_zero
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { RationalSingularityEngine } from './rationalSingularityEngine';
import type { IRationalFunctionInput } from './rationalSingularityEngine.contracts';

describe('RICIS-III Rational Singularity Engine & Lean A1_div_zero Tests', () => {
  let engine: RationalSingularityEngine;

  beforeEach(() => {
    engine = new RationalSingularityEngine();
  });

  it('QA-RAT-01: D(x)=0 находит корни, при отсутствии нуля в числителе дает inf_{F} (A1/A10, Lean A1_div_zero)', () => {
    // f(x) = (x + 3) / (x - 2)
    // D(x) = 0 => x = 2
    // Подстановка в числитель: 2 + 3 = 5 != 0
    // Результат деления на ноль: inf_{5}
    const input: IRationalFunctionInput = {
      variable: 'x',
      numeratorFactors: [{ factorText: 'x + 3', root: -3, power: 1 }],
      denominatorFactors: [{ factorText: 'x - 2', root: 2, power: 1 }],
    };

    const result = engine.resolveRationalSingularity(input);

    expect(result.denominatorRoots).toEqual([2]);
    expect(result.singularPointsAnalysis.length).toBe(1);

    const pt = result.singularPointsAnalysis[0]!;
    expect(pt.root).toBe(2);
    expect(pt.denominatorMultiplicity).toBe(1);
    expect(pt.numeratorMultiplicity).toBe(0);
    expect(pt.residualNumeratorValue).toBe(5);
    expect(pt.outcomeType).toBe('INDEXED_INFINITY');
    expect(pt.formattedRicisResult).toBe('∞_{5}');
    expect(pt.leanTheoremCitation).toBe('A1_div_zero');
  });

  it('QA-RAT-02: SP1/SP2 сокращение тождественных нулей: (x-5)(x+5)/(x-5) при x=5 дает 10', () => {
    // f(x) = (x - 5)(x + 5) / (x - 5)
    // D(x) = 0 => x = 5
    // Числитель имеет корень x = 5 (кратность 1)
    // Тождественные нули сокращаются: (x - 5) / (x - 5) -> 1
    // Остаточный хвост: (x + 5) при x = 5 => 10
    const input: IRationalFunctionInput = {
      variable: 'x',
      numeratorFactors: [
        { factorText: 'x - 5', root: 5, power: 1 },
        { factorText: 'x + 5', root: -5, power: 1 },
      ],
      denominatorFactors: [{ factorText: 'x - 5', root: 5, power: 1 }],
    };

    const result = engine.resolveRationalSingularity(input);

    expect(result.denominatorRoots).toEqual([5]);
    const pt = result.singularPointsAnalysis[0]!;
    expect(pt.root).toBe(5);
    expect(pt.canceledMultiplicity).toBe(1);
    expect(pt.denominatorMultiplicity).toBe(1);
    expect(pt.numeratorMultiplicity).toBe(1);
    expect(pt.outcomeType).toBe('REMOVABLE_SCALAR');
    expect(pt.formattedRicisResult).toBe('10');
    expect(pt.leanTheoremCitation).toBe('divSelf_one');
  });

  it('QA-RAT-03: Частичное сокращение: (x^2 - 1)/(x - 1)^2 = (x - 1)(x + 1)/(x - 1)^2 при x=1 дает inf_{2}', () => {
    // D(x) = 0 => x = 1 (кратность 2)
    // N(x) имеет корень x = 1 (кратность 1) и корень x = -1
    // Сокращается 1 степень (x - 1)
    // В знаменателе остаётся (x - 1)^1, то есть 0 при x = 1
    // Остаточный числитель: (x + 1) при x = 1 => 2
    // Результат: inf_{2}
    const input: IRationalFunctionInput = {
      variable: 'x',
      numeratorFactors: [
        { factorText: 'x - 1', root: 1, power: 1 },
        { factorText: 'x + 1', root: -1, power: 1 },
      ],
      denominatorFactors: [{ factorText: 'x - 1', root: 1, power: 2 }],
    };

    const result = engine.resolveRationalSingularity(input);

    expect(result.denominatorRoots).toEqual([1]);
    const pt = result.singularPointsAnalysis[0]!;
    expect(pt.root).toBe(1);
    expect(pt.denominatorMultiplicity).toBe(2);
    expect(pt.numeratorMultiplicity).toBe(1);
    expect(pt.canceledMultiplicity).toBe(1);
    expect(pt.residualNumeratorValue).toBe(2);
    expect(pt.outcomeType).toBe('INDEXED_INFINITY');
    expect(pt.formattedRicisResult).toBe('∞_{2}');
    expect(pt.leanTheoremCitation).toBe('A1_div_zero');
  });

  it('QA-RAT-04: Множественные корни знаменателя: f(x) = (x - 3) / ((x - 2)(x - 3))', () => {
    // D(x) = 0 => x = 2, x = 3
    // В точке x = 3: корень сокращается, остаётся 1 / (3 - 2) = 1
    // В точке x = 2: в числителе 2 - 3 = -1, в знам остаётся (2 - 3) = -1 => F = -1 / -1 = 1 => inf_{1}
    const input: IRationalFunctionInput = {
      variable: 'x',
      numeratorFactors: [{ factorText: 'x - 3', root: 3, power: 1 }],
      denominatorFactors: [
        { factorText: 'x - 2', root: 2, power: 1 },
        { factorText: 'x - 3', root: 3, power: 1 },
      ],
    };

    const result = engine.resolveRationalSingularity(input);

    expect(result.denominatorRoots).toEqual([2, 3]);
    expect(result.singularPointsAnalysis.length).toBe(2);

    // Точка x = 2 (полюс / inf)
    const pt2 = result.singularPointsAnalysis.find((p) => p.root === 2)!;
    expect(pt2.outcomeType).toBe('INDEXED_INFINITY');
    expect(pt2.residualNumeratorValue).toBe(1);
    expect(pt2.formattedRicisResult).toBe('∞_{1}');

    // Точка x = 3 (устранимая сингулярность)
    const pt3 = result.singularPointsAnalysis.find((p) => p.root === 3)!;
    expect(pt3.outcomeType).toBe('REMOVABLE_SCALAR');
    expect(pt3.residualNumeratorValue).toBe(1); // 1 / (3 - 2) = 1
    expect(pt3.formattedRicisResult).toBe('1');
  });

  it('QA-RAT-05: Пример L3 из каталога: 1 / (x^2 - 4) = 1 / ((x - 2)(x + 2)) при x=2 и x=-2', () => {
    // D(x) = (x - 2)(x + 2) = 0 => x1 = 2, x2 = -2
    // При x = 2: D_rem(2) = (2 + 2) = 4 => F = 1/4 = 0.25 => inf_{0.25}
    // При x = -2: D_rem(-2) = (-2 - 2) = -4 => F = 1/(-4) = -0.25 => inf_{-0.25}
    const input: IRationalFunctionInput = {
      variable: 'x',
      numeratorFactors: [],
      numeratorConstant: 1,
      denominatorFactors: [
        { factorText: 'x - 2', root: 2, power: 1 },
        { factorText: 'x + 2', root: -2, power: 1 },
      ],
    };

    const result = engine.resolveRationalSingularity(input);

    expect(result.denominatorRoots).toEqual([-2, 2]);

    const ptPos = result.singularPointsAnalysis.find((p) => p.root === 2)!;
    expect(ptPos.outcomeType).toBe('INDEXED_INFINITY');
    expect(ptPos.residualNumeratorValue).toBe(0.25);
    expect(ptPos.formattedRicisResult).toBe('∞_{0.25}');

    const ptNeg = result.singularPointsAnalysis.find((p) => p.root === -2)!;
    expect(ptNeg.outcomeType).toBe('INDEXED_INFINITY');
    expect(ptNeg.residualNumeratorValue).toBe(-0.25);
    expect(ptNeg.formattedRicisResult).toBe('∞_{-0.25}');
  });

  it('QA-RAT-06: Пример L2 из каталога: 1 / (2x - 6) = 1 / (2*(x - 3)) при x=3 дает inf_{0.5}', () => {
    // D(x) = 2*(x - 3) = 0 => x = 3
    // Дробь: 1 / (2 * (x - 3))
    // При x = 3: D_rem(3) = 2 => F = 1/2 = 0.5 => inf_{0.5}
    const input: IRationalFunctionInput = {
      variable: 'x',
      numeratorFactors: [],
      numeratorConstant: 1,
      denominatorFactors: [{ factorText: 'x - 3', root: 3, power: 1 }],
      denominatorConstant: 2,
    };

    const result = engine.resolveRationalSingularity(input);

    expect(result.denominatorRoots).toEqual([3]);
    const pt = result.singularPointsAnalysis[0]!;
    expect(pt.root).toBe(3);
    expect(pt.outcomeType).toBe('INDEXED_INFINITY');
    expect(pt.residualNumeratorValue).toBe(0.5);
    expect(pt.formattedRicisResult).toBe('∞_{0.5}');
  });
});
