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
      <GeometricBridgeVisualizerCard initialF={5} initialG={3} />
    );

    expect(html).toContain('Geometric Bridge');
    expect(html).toContain('A6 GENERAL PRODUCT');
    expect(html).toContain('det(u, v)');
  });

  it('QA-UI-GB-02: отображает вычисление площади за O(1)', () => {
    const html = renderToStaticMarkup(
      <GeometricBridgeVisualizerCard initialF={4} initialG={6} />
    );

    expect(html).toContain('24');
    expect(html).toContain('Exact Invariant in O(1)');
  });

  it('QA-UI-GB-03: отображает сопоставление с классическим анализом (NaN)', () => {
    const html = renderToStaticMarkup(
      <GeometricBridgeVisualizerCard initialF={2} initialG={8} />
    );

    expect(html).toContain('0 × ∞ → NaN / Undefined');
    expect(html).toContain('RICIS-III Geometric Bridge');
  });
});
