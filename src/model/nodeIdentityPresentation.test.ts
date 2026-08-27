import { describe, expect, it } from 'vitest';
import { getNodeIdentityPresentation } from './nodeIdentityPresentation';
import { DeepLinkFocusResolver } from '../catalogVisibility/catalogVisibility.domain';
import type { ProblemNode } from './types';

const migratedId = '00112233445566778899aabbccddeeff';
const node: ProblemNode = {
  id: migratedId,
  title: 'Root Node',
  description: '',
  state: 'unresolved',
  type: 'scientific_task',
  targetFunction: 'f(x)',
  zoneIds: ['math'],
  dependencyIds: [],
  dependentIds: [],
  fractalDepth: 0,
  economic: { costUnresolved: 1, costToSolve: 1, marketGain: 1, riskLoss: 1 },
  canonicalPath: '/math/root-node',
};

describe('node identity presentation and legacy navigation', () => {
  it('renders Base64 from the internal hex digest and preserves canonical path', () => {
    const presentation = getNodeIdentityPresentation(node);
    expect(presentation.hexId).toBe(migratedId);
    expect(presentation.base64Key).toBe('ABEiM0RVZneImaq7zN3u/w==');
    expect(presentation.canonicalPath).toBe('/math/root-node');
  });

  it('resolves a legacy deep link to the migrated internal hex ID', () => {
    const outcome = new DeepLinkFocusResolver().resolve({
      requestedNodeId: 'legacy-root',
      hydratedNodes: [node],
      activeVisibleNodeIds: new Set([migratedId]),
      nodeIdAliases: { 'legacy-root': migratedId },
    });
    expect(outcome).toMatchObject({ kind: 'focused_catalog_node', nodeId: migratedId });
  });

  it('does not treat the Base64 presentation key as a domain ID', () => {
    const outcome = new DeepLinkFocusResolver().resolve({
      requestedNodeId: 'ABEiM0RVZneImaq7zN3u/w==',
      hydratedNodes: [node],
      activeVisibleNodeIds: new Set([migratedId]),
      nodeIdAliases: {},
    });
    expect(outcome.kind).toBe('unknown_deep_link_target');
  });
});
