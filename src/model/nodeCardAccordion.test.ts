import { describe, it, expect } from 'vitest';
import { getUnlockedTargets } from './access';
import { getRicisCoreEngine } from '../services/ricisCore';
import type { ProblemNode, MapState } from './types';

describe('Node Card Accordion, Navigation & Ricis.Core Audit Tests', () => {
  const sampleMap: Pick<MapState, 'zones' | 'nodes' | 'edges' | 'proofs'> & { auditLogs: any[] } = {
    zones: [
      { id: 'math', name: 'Математика', description: '', nodeIds: [], economicProfile: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 } },
      { id: 'cs', name: 'Computer Science', description: '', nodeIds: [], economicProfile: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 } },
    ],
    nodes: [
      {
        id: 'ricis-root',
        title: 'RICIS-III Singularity Core',
        zoneIds: ['math'],
        state: 'resolved',
        type: 'core_singularity',
        description: 'Root Singularity Node',
        targetFunction: 'F/0 = \\infty_F',
        fractalDepth: 0,
      } as ProblemNode,
      {
        id: 'geom-bridge',
        title: 'Geometric Bridge 0_F * inf_G',
        zoneIds: ['math'],
        state: 'unresolved',
        type: 'derived_problem',
        description: 'Resolving product indeterminacy',
        targetFunction: '0_F \\times \\infty_G = F \\cdot G',
        dependencyIds: ['ricis-root'],
        fractalDepth: 1,
      } as ProblemNode,
      {
        id: 'quantum-collapse',
        title: 'Quantum Wave Singularity',
        zoneIds: ['cs'],
        state: 'unresolved',
        type: 'scientific_task',
        description: 'Application to quantum collapse',
        targetFunction: '\\psi / 0',
        dependencyIds: ['geom-bridge'],
        fractalDepth: 2,
      } as ProblemNode,
      {
        id: 'deep-learning-gradient',
        title: 'LLM Gradient Explosion Fix',
        zoneIds: ['cs'],
        state: 'unresolved',
        type: 'derived_problem',
        description: 'Preventing NaN in backprop',
        targetFunction: '\\nabla L / 0',
        dependencyIds: ['geom-bridge'],
        fractalDepth: 2,
      } as ProblemNode,
    ],
    edges: [
      { id: '1', fromId: 'ricis-root', toId: 'geom-bridge', strength: 1, stateColor: 'red', economicInfluence: 0 },
      { id: '2', fromId: 'geom-bridge', toId: 'quantum-collapse', strength: 1, stateColor: 'red', economicInfluence: 0 },
      { id: '3', fromId: 'geom-bridge', toId: 'deep-learning-gradient', strength: 1, stateColor: 'red', economicInfluence: 0 },
    ],
    proofs: {},
    auditLogs: [],
  };

  describe('1. Граф обратных связей (getUnlockedTargets)', () => {
    it('должен корректно находить все узлы, которые зависят от решения текущей задачи', () => {
      const rootNode = sampleMap.nodes.find(n => n.id === 'ricis-root')!;
      const targetsForRoot = getUnlockedTargets(rootNode, sampleMap);

      expect(targetsForRoot.allDependentTargets.length).toBe(1);
      expect(targetsForRoot.allDependentTargets[0]?.id).toBe('geom-bridge');

      const geomNode = sampleMap.nodes.find(n => n.id === 'geom-bridge')!;
      const targetsForGeom = getUnlockedTargets(geomNode, sampleMap);

      expect(targetsForGeom.allDependentTargets.length).toBe(2);
      const dependentIds = targetsForGeom.allDependentTargets.map(n => n.id);
      expect(dependentIds).toContain('quantum-collapse');
      expect(dependentIds).toContain('deep-learning-gradient');
    });

    it('должен возвращать пустой список, если узел является концевым (листовым)', () => {
      const leafNode = sampleMap.nodes.find(n => n.id === 'quantum-collapse')!;
      const targets = getUnlockedTargets(leafNode, sampleMap);
      expect(targets.allDependentTargets.length).toBe(0);
    });
  });

  describe('2. Аудит и прямое доказательство через Ricis.Core Engine', () => {
    it('Ricis.Core Engine должен генерировать полное Lean 4 доказательство без sorry за O(1)', async () => {
      const engine = getRicisCoreEngine();
      const nodeToSolve = sampleMap.nodes.find(n => n.id === 'geom-bridge')!;

      const proofDoc = await engine.generateFormalProof(
        nodeToSolve.title,
        'geometric_bridge',
        { problemId: nodeToSolve.id }
      );

      expect(proofDoc).toBeDefined();
      expect(proofDoc.theoremTitle).toBeDefined();
      expect(proofDoc.lean4CodeSnippet).toContain('geometric_bridge');
      expect(proofDoc.lean4CodeSnippet).not.toContain('sorry');
      expect(proofDoc.complexity).toBe('O(1)');
    });

    it('Ricis.Core должен успешно вычислять геометрический мост 0_F * inf_G = F * G', async () => {
      const engine = getRicisCoreEngine();
      const result = await engine.evaluate({ expression: '0_4 * \\infty_5', contextProblemId: 'geom-bridge' });

      expect(result.invariant).toBeDefined();
      expect(result.trace.length).toBeGreaterThan(0);
    });
  });
});
