// ============================================================================
// QA AUTOMATION SUITE: WIDGET CAPABILITY BOUNDARY & RESILIENCE TESTS
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WidgetCapabilityBoundary } from './WidgetCapabilityBoundary';

describe('RICIS-III Universal Widget Capability Boundary & Resilience', () => {
  it('QA-RES-01: корректно рендерит дочерний компонент при отсутствии ошибок', () => {
    const html = renderToStaticMarkup(
      <WidgetCapabilityBoundary componentName="TelemetryWidget">
        <div id="test-child">Active Subsystem Rendered OK</div>
      </WidgetCapabilityBoundary>
    );

    expect(html).toContain('Active Subsystem Rendered OK');
    expect(html).toContain('id="test-child"');
  });

  it('QA-RES-02: безопасно перехватывает сбой и отображает состояние ошибки через getDerivedStateFromError', () => {
    const boundary = new WidgetCapabilityBoundary({
      componentName: 'SingularHeatmapRenderer',
      title: 'Тепловая карта сингулярностей',
      children: <div>Child</div>,
    });

    const errorState = WidgetCapabilityBoundary.getDerivedStateFromError(new Error('Simulated runtime error'));
    expect(errorState.hasError).toBe(true);
    expect(errorState.error?.message).toBe('Simulated runtime error');

    // Simulate boundary with error state
    boundary.state = errorState;
    const rendered = boundary.render();
    const html = renderToStaticMarkup(rendered as React.ReactElement);

    expect(html).toContain('Тепловая карта сингулярностей: Модуль временно недоступен');
    expect(html).toContain('Повторить попытку');
  });

  it('QA-RES-03: отображает заглушку возможностей, если isCapabilitySupported === false', () => {
    const html = renderToStaticMarkup(
      <WidgetCapabilityBoundary
        componentName="3DSpatialSolver"
        title="3D Spatial Solver"
        requiredCapability="SPATIAL_3D_SOLVER"
        isCapabilitySupported={false}
      >
        <div>Should not be rendered</div>
      </WidgetCapabilityBoundary>
    );

    expect(html).not.toContain('Should not be rendered');
    expect(html).toContain('3D Spatial Solver: В процессе разработки');
    expect(html).toContain('SPATIAL_3D_SOLVER');
  });

  it('QA-RES-04: сбрасывает состояние ошибки при вызове handleReset', () => {
    const onResetMock = vi.fn();
    const boundary = new WidgetCapabilityBoundary({
      componentName: 'TraceVisualizerWidget',
      title: 'Трассировщик',
      onReset: onResetMock,
      children: <div>Child</div>,
    });

    boundary.state = { hasError: true, error: new Error('Crash') };
    boundary.setState = vi.fn((newState) => {
      Object.assign(boundary.state, newState);
    }) as any;

    boundary.handleReset();

    expect(boundary.state.hasError).toBe(false);
    expect(onResetMock).toHaveBeenCalledTimes(1);
  });
});
