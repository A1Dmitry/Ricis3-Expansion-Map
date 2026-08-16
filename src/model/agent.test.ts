import { describe, it, expect } from 'vitest';
import {
  extractDbKnowledge,
  normalizeProblemKey,
  existingProblemKeys,
  walkGraph,
  nodesWithoutLeaves,
  buildOfflineDiscoveries,
  applyAgentDiscoveries
} from './agent';
import { MapState, ProblemNode } from './types';

function createMockMap(): MapState {
  const rootNode: ProblemNode = {
    id: 'math-singularity',
    title: 'Теория Сингулярности',
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
    title: 'Вторичная задача',
    targetFunction: 'X = X',
    description: 'Direct child',
    state: 'unresolved',
    type: 'derived_problem',
    economic: { costToSolve: 10, costUnresolved: 20, marketGain: 30, riskLoss: 5 },
    dependencyIds: ['math-singularity'],
    dependentIds: [],
    zoneIds: ['math'],
    fractalDepth: 1,
  };

  return {
    nodes: [rootNode, child1],
    edges: [
      { id: 'e1', fromId: 'math-singularity', toId: 'child-1', strength: 1, stateColor: 'green', economicInfluence: 10 }
    ],
    zones: [{ id: 'math', name: 'Mathematics', description: '', nodeIds: ['math-singularity', 'child-1'], economicProfile: {} as any }],
    axioms: [{ id: 'A6', sourceNodeId: 'math-singularity', formalStatement: '0_F * inf_G = F * G', usedByNodeIds: [] }],
    proofs: { 'math-singularity': { nodeId: 'math-singularity', targetFunction: '0/0=1', steps: [], finalResult: '1', latex: '' } },
    agentLogs: [],
  };
}

describe('agent Unit Tests', () => {
  it('should extract comprehensive database knowledge for agent training', () => {
    const map = createMockMap();
    const memory = extractDbKnowledge(map);

    expect(memory.totalNodesInDb).toBe(2);
    expect(memory.resolvedNodesCount).toBe(1);
    expect(memory.proofsCount).toBe(1);
    expect(memory.axiomsCount).toBe(1);
    expect(memory.graphEdgesCount).toBe(1);
    expect(memory.trainingAccuracy).toBeGreaterThan(90);
    expect(memory.domainCoverage['Mathematics']).toBe(2);
  });

  it('should normalize problem keys consistently', () => {
    expect(normalizeProblemKey('  Сингулярность 0/0  ')).toBe('сингулярность 0/0|');
    expect(normalizeProblemKey('Node Title!', 'f(x)')).toBe('node title!|f(x)');
  });

  it('should collect existing problem keys', () => {
    const map = createMockMap();
    const keys = existingProblemKeys(map);
    expect(keys.has('теория сингулярности|0/0=1')).toBe(true);
    expect(keys.has('теория сингулярности|')).toBe(true);
  });

  it('should traverse graph nodes via walkGraph', () => {
    const map = createMockMap();
    const visited = walkGraph(map, ['math-singularity']);
    expect(visited).toContain('math-singularity');
    expect(visited).toContain('child-1');
  });

  it('should find nodes without leaves', () => {
    const map = createMockMap();
    const leaves = nodesWithoutLeaves(map);
    expect(leaves.map(n => n.id)).toContain('child-1');
  });

  it('should generate offline fallback discoveries without duplicating existing nodes', () => {
    const map = createMockMap();
    const keys = existingProblemKeys(map);
    const discoveries = buildOfflineDiscoveries(map.nodes[0]!, keys, 2);

    expect(discoveries.nodes.length).toBeGreaterThan(0);
    expect(discoveries.edges.length).toBe(discoveries.nodes.length);
    expect(discoveries.nodes[0]?.dependencyIds).toContain('math-singularity');
  });
});
