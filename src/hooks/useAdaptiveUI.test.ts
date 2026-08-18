import { describe, expect, it } from 'vitest';
import type { UIElement } from '../domain/ui/uiElement.types';
import { calculateNewOrder } from './useAdaptiveUI';

const panels: UIElement[] = [
  { id: 'actions', label: 'Actions' },
  { id: 'zones', label: 'Zones' },
  { id: 'available', label: 'Available' },
  { id: 'agent', label: 'Agent' },
  { id: 'persistence', label: 'Persistence' },
];

describe('useAdaptiveUI existing ranking contract', () => {
  it('keeps the configured cold-start order when no panel has recorded openings', () => {
    expect(calculateNewOrder({}, panels.map(panel => panel.id), panels, 3, 0.03))
      .toEqual(['actions', 'zones', 'available', 'agent', 'persistence']);
  });

  it('promotes a frequently opened hidden panel using existing relative weights', () => {
    const order = calculateNewOrder(
      { actions: 2, zones: 1, available: 1, agent: 8, persistence: 0 },
      panels.map(panel => panel.id),
      panels,
      3,
      0.03,
    );

    expect(order.slice(0, 3)).toContain('agent');
    expect(order.indexOf('agent')).toBeLessThan(order.indexOf('persistence'));
  });

  it('does not promote a panel whose weight has not exceeded hysteresis', () => {
    const order = calculateNewOrder(
      { actions: 1, zones: 1, available: 1, agent: 1.02, persistence: 0 },
      panels.map(panel => panel.id),
      panels,
      3,
      0.03,
    );

    expect(order.slice(0, 3)).toEqual(['actions', 'zones', 'available']);
  });
});
