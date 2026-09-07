// ============================================================================
// QA AUTOMATION SUITE: TCP & FRACTAL INSPECTOR UI COMPONENT
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TcpFractalInspectorCard } from './TcpFractalInspectorCard';

describe('TcpFractalInspectorCard Component Tests', () => {
  it('QA-UI-TCP-01: рендерит онтологический тип сингулярности и заголовок', () => {
    const html = renderToStaticMarkup(
      <TcpFractalInspectorCard
        nodeId="NS-01"
        nodeTitle="Navier-Stokes Blowup Singularity"
        formula="u * grad(u) = 0"
        defaultKind="PHYSICAL_VELOCITY"
      />
    );

    expect(html).toContain('Navier-Stokes Blowup Singularity');
    expect(html).toContain('PHYSICAL_VELOCITY');
    expect(html).toContain('Type Consistency Protocol &amp; Fractal Law');
  });

  it('QA-UI-TCP-02: отображает узлы фрактального закона R(Q)', () => {
    const html = renderToStaticMarkup(
      <TcpFractalInspectorCard
        nodeId="RH-01"
        nodeTitle="Riemann Zeta Critical Line"
        formula="zeta(s) = 0"
        defaultKind="POLYNOMIAL_SYMBOL"
      />
    );

    expect(html).toContain('Fractal Law R(Q)');
    expect(html).toContain('0_RH-01');
    expect(html).toContain('∞_RH-01');
  });

  it('QA-UI-TCP-03: корректно отображает статус совместимости типов TCP', () => {
    const html = renderToStaticMarkup(
      <TcpFractalInspectorCard
        nodeId="TEST-03"
        nodeTitle="Scalar Singularity"
        formula="x / 0 = inf"
        defaultKind="SCALAR_NUMERIC"
      />
    );

    expect(html).toContain('Совместимость TCP:');
    expect(html).toContain('COMPATIBLE');
  });
});
