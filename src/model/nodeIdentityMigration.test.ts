import { describe, expect, it } from 'vitest';
import {
  base64FromSha128Hex,
  migrateMapNodeIdentity,
  normalizeCanonicalPath,
  sha256Truncated128Hex,
} from './nodeIdentityMigration';
import type { MapState } from './types';

const legacyRoot = 'legacy-root';
const legacyChild = 'legacy-child';
const legacyCycleA = 'legacy-cycle-a';
const legacyCycleB = 'legacy-cycle-b';

function fixture(): MapState {
  return {
    nodes: [
      {
        id: legacyRoot,
        title: ' Root  Node ',
        description: 'root description',
        state: 'partial',
        type: 'core_singularity',
        targetFunction: 'X = X',
        zoneIds: ['zone-a'],
        dependencyIds: [],
        dependentIds: [legacyChild],
        fractalDepth: 0,
        economic: { costUnresolved: 1, costToSolve: 1, marketGain: 1, riskLoss: 1 },
      },
      {
        id: legacyChild,
        title: 'Child Node',
        description: 'child description',
        state: 'unresolved',
        type: 'scientific_task',
        targetFunction: 'f(x)',
        zoneIds: ['zone-a'],
        dependencyIds: [legacyRoot],
        dependentIds: [],
        fractalDepth: 1,
        economic: { costUnresolved: 2, costToSolve: 2, marketGain: 2, riskLoss: 2 },
      },
      {
        id: legacyCycleA,
        title: 'Cycle A',
        description: 'cycle A',
        state: 'resolved',
        type: 'derived_problem',
        targetFunction: 'a',
        zoneIds: ['zone-b'],
        dependencyIds: [legacyCycleB],
        dependentIds: [legacyCycleB],
        fractalDepth: 2,
        economic: { costUnresolved: 3, costToSolve: 3, marketGain: 3, riskLoss: 3 },
      },
      {
        id: legacyCycleB,
        title: 'Cycle B',
        description: 'cycle B',
        state: 'resolved',
        type: 'derived_problem',
        targetFunction: 'b',
        zoneIds: ['zone-b'],
        dependencyIds: [legacyCycleA],
        dependentIds: [legacyCycleA],
        fractalDepth: 2,
        economic: { costUnresolved: 4, costToSolve: 4, marketGain: 4, riskLoss: 4 },
      },
    ],
    edges: [
      { id: 'edge-root-child', fromId: legacyRoot, toId: legacyChild, strength: 1, stateColor: 'green', economicInfluence: 1 },
      { id: 'edge-cycle-a-b', fromId: legacyCycleA, toId: legacyCycleB, strength: 1, stateColor: 'yellow', economicInfluence: 1 },
      { id: 'edge-cycle-b-a', fromId: legacyCycleB, toId: legacyCycleA, strength: 1, stateColor: 'yellow', economicInfluence: 1 },
    ],
    zones: [
      { id: 'zone-a', name: 'Zone A', description: 'A', nodeIds: [legacyRoot, legacyChild], economicProfile: { costUnresolved: 1, costToSolve: 1, marketGain: 1, riskLoss: 1 } },
      { id: 'zone-b', name: 'Zone B', description: 'B', nodeIds: [legacyCycleA, legacyCycleB], economicProfile: { costUnresolved: 1, costToSolve: 1, marketGain: 1, riskLoss: 1 } },
    ],
    axioms: [{ id: 'axiom-1', sourceNodeId: legacyRoot, formalStatement: 'X = X', usedByNodeIds: [legacyChild] }],
    proofs: {
      [legacyRoot]: {
        nodeId: legacyRoot,
        targetFunction: 'X = X',
        steps: [],
        finalResult: 'identity',
        latex: 'X = X',
      },
    },
    agentLogs: [{ id: 'log-1', timestamp: '2026-08-27T00:00:00.000Z', message: 'node event', level: 'info', nodeId: legacyChild }],
  };
}

describe('SHA-128 node identity migration — red baseline', () => {
  it('normalizes filesystem-like paths deterministically', () => {
    expect(normalizeCanonicalPath('/ Informatics /  Root  Node / ')).toBe('/informatics/root-node');
    expect(normalizeCanonicalPath('informatics/./Root Node')).toBe('/informatics/root-node');
  });

  it('produces a 32-character lowercase SHA-256-truncated-128 hex ID and Base64 display value', async () => {
    const id = await sha256Truncated128Hex('/informatics/root-node');
    expect(id).toMatch(/^[0-9a-f]{32}$/);
    expect(base64FromSha128Hex(id)).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });

  it('rewrites every node-reference field without changing graph cardinality or content', async () => {
    const source = fixture();
    const result = await migrateMapNodeIdentity(source);

    expect(result.map.nodes).toHaveLength(source.nodes.length);
    expect(result.map.edges).toHaveLength(source.edges.length);
    expect(result.map.zones).toHaveLength(source.zones.length);
    expect(Object.keys(result.map.proofs)).toHaveLength(Object.keys(source.proofs).length);
    expect(result.map.nodes.every((node) => /^[0-9a-f]{32}$/.test(node.id))).toBe(true);
    expect(result.map.nodes.every((node) => node.canonicalPath?.startsWith('/') === true)).toBe(true);
    expect(result.map.edges.every((edge) => result.map.nodes.some((node) => node.id === edge.fromId))).toBe(true);
    expect(result.map.edges.every((edge) => result.map.nodes.some((node) => node.id === edge.toId))).toBe(true);
    expect(result.aliases[legacyRoot]).toBeDefined();
    expect(result.map.nodes.find((node) => node.id === result.aliases[legacyRoot])?.targetFunction).toBe('X = X');
  });

  it('preserves cycles and is idempotent', async () => {
    const first = await migrateMapNodeIdentity(fixture());
    const second = await migrateMapNodeIdentity(first.map);
    expect(second.map).toEqual(first.map);
    expect(second.aliases).toEqual(first.aliases);
  });

  it('rejects digest/path collisions before returning a rewritten map', async () => {
    const source = fixture();
    source.nodes[1] = { ...source.nodes[1]!, title: source.nodes[0]!.title, dependencyIds: [] };
    await expect(migrateMapNodeIdentity(source)).rejects.toMatchObject({ kind: 'identity_collision' });
  });
});
