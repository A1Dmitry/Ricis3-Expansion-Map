// ============================================================================
// QA AUTOMATION SUITE: RATIONAL SINGULARITY INSPECTOR CARD
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RationalSingularityInspectorCard } from './RationalSingularityInspectorCard';
import type { IRationalFunctionInput } from '../../../services/rationalSingularity/rationalSingularityEngine.contracts';

describe('RationalSingularityInspectorCard UI Tests', () => {
  it('QA-UI-RAT-01: рендерит решение уравнения знаменателя D(x) = 0 и инвариант inf_{F}', () => {
    // Пример L0: 10 / (x - 2)
    const rationalInput: IRationalFunctionInput = {
      variable: 'x',
      numeratorFactors: [],
      numeratorConstant: 10,
      denominatorFactors: [{ factorText: 'x - 2', root: 2, power: 1 }],
    };

    const html = renderToStaticMarkup(
      <RationalSingularityInspectorCard
        exampleId="L0"
        title="Hyperbolic Pole"
        rationalInput={rationalInput}
      />
    );

    expect(html).toContain('D(x) = 0');
    expect(html).toContain('x = 2');
    expect(html).toContain('∞_{10}');
    expect(html).toContain('A1_div_zero');
  });

  it('QA-UI-RAT-02: рендерит сокращение нулей по SP1 для устранимой сингулярности', () => {
    // Пример L1: (x - 5)(x + 5) / (x - 5)
    const rationalInput: IRationalFunctionInput = {
      variable: 'x',
      numeratorFactors: [
        { factorText: 'x - 5', root: 5, power: 1 },
        { factorText: 'x + 5', root: -5, power: 1 },
      ],
      denominatorFactors: [{ factorText: 'x - 5', root: 5, power: 1 }],
    };

    const html = renderToStaticMarkup(
      <RationalSingularityInspectorCard
        exampleId="L1"
        title="Difference of Squares"
        rationalInput={rationalInput}
      />
    );

    expect(html).toContain('x = 5');
    expect(html).toContain('10');
    expect(html).toContain('divSelf_one');
  });

  it('QA-UI-RAT-03: рендерит множественные корни D(x) = 0 для L3 (1 / (x^2 - 4))', () => {
    const rationalInput: IRationalFunctionInput = {
      variable: 'x',
      numeratorFactors: [],
      numeratorConstant: 1,
      denominatorFactors: [
        { factorText: 'x - 2', root: 2, power: 1 },
        { factorText: 'x + 2', root: -2, power: 1 },
      ],
    };

    const html = renderToStaticMarkup(
      <RationalSingularityInspectorCard
        exampleId="L3"
        title="Quadratic Symmetric Singularity"
        rationalInput={rationalInput}
      />
    );

    expect(html).toContain('x = -2');
    expect(html).toContain('x = 2');
    expect(html).toContain('∞_{0.25}');
    expect(html).toContain('∞_{-0.25}');
  });
});
