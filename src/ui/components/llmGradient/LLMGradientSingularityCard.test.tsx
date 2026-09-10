// ============================================================================
// QA AUTOMATION SUITE: LLM GRADIENT SINGULARITY CARD UI
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LLMGradientSingularityCard } from './LLMGradientSingularityCard';

describe('LLMGradientSingularityCard UI Component', () => {
  it('должен корректно рендерить заголовок, DOI и A6 Skew-Bridge бейдж', () => {
    const html = renderToStaticMarkup(
      <LLMGradientSingularityCard
        initialLearningRate={0.001}
        initialGradientNorm={25}
        layerName="transformer.h.0.attn"
      />
    );

    expect(html).toContain('Стабилизация градиента LLM по Аксиоме A6');
    expect(html).toContain('10.5281/zenodo.21491712');
    expect(html).toContain('A6 SKEW-BRIDGE O(1)');
    expect(html).toContain('ИНВАРИАНТ СТАБИЛЕН');
    expect(html).toContain('transformer.h.0.attn');
  });

  it('должен корректно рендерить выявление Loss Spike при градиентном взрыве', () => {
    const html = renderToStaticMarkup(
      <LLMGradientSingularityCard
        initialLearningRate={0.01}
        initialGradientNorm={1000000}
      />
    );

    expect(html).toContain('СРЫВ СХОДИМОСТИ');
    expect(html).toContain('ИНВАРИАНТ СТАБИЛЕН');
    expect(html).toContain('det(u, v)');
    expect(html).toContain('u = (0.01, 0)');
  });

  it('должен рендерить сингулярный шаг (0_eta x inf_nabla_L) без NaN', () => {
    const html = renderToStaticMarkup(
      <LLMGradientSingularityCard
        initialLearningRate={0.0}
        initialGradientNorm={1e18}
      />
    );

    expect(html).toContain('ИНВАРИАНТ СТАБИЛЕН');
    expect(html).toContain('det(u, v)');
    expect(html).not.toContain('NaN');
  });
});

