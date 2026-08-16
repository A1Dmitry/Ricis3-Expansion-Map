import { describe, it, expect } from 'vitest';
import {
  isRicisCore,
  isNodeAvailable,
  countAvailable,
  getDirectBlockers,
  getUnlockRequirements,
  findPathToRicis
} from './access';
import { MapState, ProblemNode } from './types';

function createMockMap(): MapState {
  const rootNode: ProblemNode = {
    id: 'math-singularity',
    title: 'Math Singularity',
    targetFunction: '0/0 = 1',
    description: 'Root core',
    state: 'resolved',
    type: 'core_singularity',
    economic: { costToSolve: 0, costUnresolved: 0, marketGain: 100, riskLoss: 0 },
    dependencyIds: [],
    dependentIds: ['child-1'],
    zoneIds: ['math'],
    fractalDepth: 0,
  };

  const child1: ProblemNode = {
    id: 'child-1',
    title: 'Child 1',
    targetFunction: 'X = X',
    description: 'Direct child',
    state: 'unresolved',
    type: 'derived_problem',
    economic: { costToSolve: 10, costUnresolved: 20, marketGain: 30, riskLoss: 5 },
    dependencyIds: ['math-singularity'],
    dependentIds: ['grandchild-1'],
    zoneIds: ['math'],
    fractalDepth: 1,
  };

  const grandchild1: ProblemNode = {
    id: 'grandchild-1',
    title: 'Grandchild 1',
    targetFunction: 'Y = Y',
    description: 'Deep child',
    state: 'unresolved',
    type: 'scientific_task',
    economic: { costToSolve: 5, costUnresolved: 10, marketGain: 15, riskLoss: 2 },
    dependencyIds: ['child-1'],
    dependentIds: [],
    zoneIds: ['math'],
    fractalDepth: 2,
  };

  return {
    nodes: [rootNode, child1, grandchild1],
    edges: [],
    zones: [],
    axioms: [],
    proofs: {},
    agentLogs: [],
  };
}

describe('access Unit Tests', () => {
  it('should identify RICIS Core nodes', () => {
    const map = createMockMap();
    expect(isRicisCore(map.nodes[0]!)).toBe(true);
    expect(isRicisCore(map.nodes[1]!)).toBe(false);
  });

  it('should determine node availability based on dependency state', () => {
    const map = createMockMap();
    expect(isNodeAvailable(map.nodes[0]!, map)).toBe(true); // root is resolved
    expect(isNodeAvailable(map.nodes[1]!, map)).toBe(true); // parent math-singularity is resolved
    expect(isNodeAvailable(map.nodes[2]!, map)).toBe(false); // parent child-1 is NOT resolved
  });

  it('should count available nodes accurately', () => {
    const map = createMockMap();
    const count = countAvailable(map);
    // root is resolved, child-1 is available unresolved, grandchild-1 is locked
    expect(count.available).toBe(1);
    expect(count.resolved).toBe(1);
    expect(count.locked).toBe(1);
  });

  it('should retrieve direct blockers for locked nodes', () => {
    const map = createMockMap();
    const blockers = getDirectBlockers(map.nodes[2]!, map);
    expect(blockers).toHaveLength(1);
    expect(blockers[0]?.id).toBe('child-1');
  });

  it('should retrieve unlock requirements recursively', () => {
    const map = createMockMap();
    const reqs = getUnlockRequirements(map.nodes[2]!, map);
    expect(reqs.map(r => r.id)).toContain('child-1');
  });

  it('should find path to RICIS root', () => {
    const map = createMockMap();
    const path = findPathToRicis('grandchild-1', map);
    expect(path).toContain('grandchild-1');
    expect(path).toContain('child-1');
    expect(path).toContain('math-singularity');
  });
});
