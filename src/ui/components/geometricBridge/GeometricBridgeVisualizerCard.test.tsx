// ============================================================================
// QA AUTOMATION SUITE: GEOMETRIC BRIDGE VISUALIZER CARD COMPONENT
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GeometricBridgeVisualizerCard } from './GeometricBridgeVisualizerCard';

describe('GeometricBridgeVisualizerCard Tests', () => {
  it('QA-UI-GB-01: рендерит заголовок и аксиому A6', () => {
    const html = renderToStaticMarkup(
      <GeometricBridgeVisualizerCard initialF={5} initialG={3} initialOp="A6_PRODUCT_0_INF" />
    );

    expect(html).toContain('Geometric Bridge');
    expect(html).toContain('A6_GENERAL_PRODUCT');
    expect(html).toContain('15');
  });

  it('QA-UI-GB-02: отображает вычисление площади за O(1)', () => {
    const html = renderToStaticMarkup(
      <GeometricBridgeVisualizerCard initialF={4} initialG={6} initialOp="A6_PRODUCT_0_INF" />
    );

    expect(html).toContain('24');
    expect(html).toContain('Exact Invariant in O(1)');
  });

  it('QA-UI-GB-03: отображает сопоставление с классическим анализом (NaN)', () => {
    const html = renderToStaticMarkup(
      <GeometricBridgeVisualizerCard initialF={2} initialG={8} initialOp="A6_PRODUCT_0_INF" />
    );

    expect(html).toContain('NaN');
    expect(html).toContain('RICIS-III R² Invariant');
  });

  it('QA-UI-GB-04: рендерит операцию отношения нулей A4 (0/0)', () => {
    const html = renderToStaticMarkup(
      <GeometricBridgeVisualizerCard initialF={10} initialG={2} initialOp="A4_RATIO_0_0" />
    );

    expect(html).toContain('A4_ZERO_RATIO');
    expect(html).toContain('5');
    expect(html).toContain('INDETERMINATE_FORM');
  });

  it('QA-UI-GB-05: рендерит операцию отношения бесконечностей A5 (inf/inf)', () => {
    const html = renderToStaticMarkup(
      <GeometricBridgeVisualizerCard initialF={12} initialG={4} initialOp="A5_RATIO_INF_INF" />
    );

    expect(html).toContain('A5_INFINITY_RATIO');
    expect(html).toContain('3');
  });
});
