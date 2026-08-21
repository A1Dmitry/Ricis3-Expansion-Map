import { describe, it, expect } from 'vitest';
import { generateProof, expandFractal, solveNodeLogic } from './logic';
import { MapState, ProblemNode, Axiom } from './types';

function createTestMap(): MapState {
  const node: ProblemNode = {
    id: 'math-singularity',
    title: 'Теория Сингулярности',
    targetFunction: '0/0 = 1',
    description: 'Корень',
    state: 'unresolved',
    type: 'core_singularity',
    economic: { costToSolve: 0, costUnresolved: 0, marketGain: 100, riskLoss: 0 },
    dependencyIds: [],
    dependentIds: [],
    zoneIds: ['math'],
    fractalDepth: 0,
  };

  const axiom: Axiom = {
    id: 'A6',
    sourceNodeId: 'math-singularity',
    formalStatement: '0_F * inf_G = F * G',
    usedByNodeIds: [],
  };

  return {
    nodes: [node],
    edges: [],
    zones: [{ id: 'math', name: 'Mathematics', description: '', nodeIds: ['math-singularity'], economicProfile: {} as any }],
    axioms: [axiom],
    proofs: {},
    agentLogs: [],
  };
}

describe('logic Unit Tests', () => {
  describe('generateProof', () => {
    it('should generate structured 5-phase proof for a problem node', async () => {
      const map = createTestMap();
      const proof = await generateProof(map.nodes[0]!, map.axioms);

      expect(proof.nodeId).toBe('math-singularity');
      expect(proof.steps.length).toBeGreaterThanOrEqual(5);
      expect(proof.latex).toContain('REQUIRES_CORE_LEAN');
      expect(proof.latex).not.toContain('geometric_bridge');
      expect(proof.finalResult).toContain('math-singularity_resolved');
    });
  });

  describe('expandFractal', () => {
    it('should expand fractal nodes from catalog connected to solved node', () => {
      const map = createTestMap();
      const expanded = expandFractal(map, 'math-singularity');

      expect(expanded.nodes.length).toBeGreaterThanOrEqual(map.nodes.length);
      const solved = expanded.nodes.find(n => n.id === 'math-singularity');
      expect(solved).toBeDefined();
    });

    it('should return unchanged map if node is not found', () => {
      const map = createTestMap();
      const res = expandFractal(map, 'non-existent-id');
      expect(res).toBe(map);
    });
  });

  describe('solveNodeLogic', () => {
    it('keeps locally generated proof partial without authoritative Core Lean evidence', async () => {
      const map = createTestMap();
      const solvedState = await solveNodeLogic(map, 'math-singularity');

      const resolvedNode = solvedState.nodes.find(n => n.id === 'math-singularity');
      expect(resolvedNode?.state).toBe('partial');
      expect(solvedState.proofs['math-singularity']).toBeDefined();
    });
  });
});
