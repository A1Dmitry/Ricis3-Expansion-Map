import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { NodeGeometryThumbnail } from './NodeGeometryThumbnail';
import type { ProblemNode } from '../../model/types';
import { NodeResolutionStatusCode } from '../../model/colorMatrix';
import type { MapNodeVisualStatus } from '../../ricisSolutionCatalog';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('NodeGeometryThumbnail component', () => {
  const baseNode: ProblemNode = {
    id: 'test-node-1',
    title: 'Test Node Title',
    description: 'Description',
    targetFunction: '0/0',
    state: 'unresolved',
    type: 'scientific_task',
    zoneIds: ['zone-1'],
    dependencyIds: [],
    dependentIds: [],
    fractalDepth: 0,
    economic: { costUnresolved: 10, costToSolve: 5, marketGain: 50, riskLoss: 2 },
  };

  const sampleVisual: MapNodeVisualStatus = {
    sphereColor: '#22c55e',
    greenBasis: 'RICIS_SOURCE_SOLVED',
    ariaLabelSuffix: 'proven resolved',
    greenByCatalog: true,
    statusCode: NodeResolutionStatusCode.PROVEN_RESOLVED,
    statusLabel: 'Зеленый: Доказано',
  };

  it('renders a 2D thumbnail container with data-testid', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<NodeGeometryThumbnail node={baseNode} visual={sampleVisual} size={32} />);
    });

    const thumb = container.querySelector('[data-testid="node-geometry-thumbnail-test-node-1"]');
    expect(thumb).not.toBeNull();
    const svg = thumb?.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 32 32');

    await act(async () => root.unmount());
    container.remove();
  });

  it('renders core singularity monolith geometry with diamond polygon for core nodes', async () => {
    const coreNode: ProblemNode = {
      ...baseNode,
      id: 'core-node',
      type: 'core_singularity',
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<NodeGeometryThumbnail node={coreNode} visual={sampleVisual} />);
    });

    const thumb = container.querySelector('[data-testid="node-geometry-thumbnail-core-node"]');
    expect(thumb).not.toBeNull();
    // Diamond polygon should be present
    const polygon = thumb?.querySelector('polygon');
    expect(polygon).not.toBeNull();

    await act(async () => root.unmount());
    container.remove();
  });

  it('renders derivative claim geometry with hexagonal facets', async () => {
    const derivNode: ProblemNode = {
      ...baseNode,
      id: 'deriv-node',
      type: 'derivative_claim',
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<NodeGeometryThumbnail node={derivNode} visual={sampleVisual} />);
    });

    const thumb = container.querySelector('[data-testid="node-geometry-thumbnail-deriv-node"]');
    expect(thumb).not.toBeNull();
    const polygons = thumb?.querySelectorAll('polygon');
    expect(polygons?.length).toBeGreaterThanOrEqual(1);

    await act(async () => root.unmount());
    container.remove();
  });

  it('renders derived problem geodesic sphere with latitude/longitude ellipses', async () => {
    const derivedNode: ProblemNode = {
      ...baseNode,
      id: 'derived-node',
      type: 'derived_problem',
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<NodeGeometryThumbnail node={derivedNode} visual={sampleVisual} />);
    });

    const thumb = container.querySelector('[data-testid="node-geometry-thumbnail-derived-node"]');
    expect(thumb).not.toBeNull();
    const ellipses = thumb?.querySelectorAll('ellipse');
    expect(ellipses?.length).toBeGreaterThanOrEqual(2);

    await act(async () => root.unmount());
    container.remove();
  });
});
