import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMapStore } from './mapStore';
import { ProblemNode, DependencyEdge } from '../model/types';
import { auditProofContent } from '../model/ricisCoreRules';

// Мокаем зависимости бэка, если необходимо (например, apiClient или db.ts)
vi.mock('../model/apiClient', () => ({
  apiClient: {
    saveMapState: vi.fn().mockResolvedValue({ success: true }),
    getMapState: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
  }
}));

vi.mock('../model/db', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    dbSaveMap: vi.fn().mockResolvedValue(undefined),
    dbLoadMap: vi.fn().mockResolvedValue(null),
  };
});

describe('Zustand mapStore.ts Integration Tests (RICIS-III v7.7 Diagnostics & GC)', () => {
  beforeEach(() => {
    // Сбрасываем Zustand-стор перед каждым тестом
    const store = useMapStore.getState();
    if (store && 'clearAuditReport' in store) {
      (store as any).clearAuditReport();
    }
    // Восстанавливаем дефолтное состояние стора
    useMapStore.setState({
      nodes: [],
      edges: [],
      zones: [],
      axioms: [],
      proofs: {},
      agentLogs: [],
      lastAuditReport: null,
      isAuditing: false,
      transformationHistory: []
    } as any);
  });

  it('должен инициализировать стор с дефолтными диагностическими полями', () => {
    const state = useMapStore.getState() as any;
    expect(state.lastAuditReport).toBeNull();
    expect(state.isAuditing).toBe(false);
    expect(state.transformationHistory).toEqual([]);
  });

  it('должен запускать runSystemAudit и корректно обновлятьlastAuditReport', async () => {
    const store = useMapStore.getState() as any;
    
    // Добавим узел для проверки
    useMapStore.setState({
      nodes: [
        {
          id: 'math-singularity',
          title: 'Теория Сингулярности',
          targetFunction: '0/0 = 1',
          description: 'Основа RICIS-III',
          state: 'resolved',
          type: 'core_singularity',
          economic: { costToSolve: 0, costUnresolved: 0, marketGain: 100, riskLoss: 0 },
          dependencyIds: [],
          dependentIds: [],
          zoneIds: [],
          fractalDepth: 0,
        }
      ]
    });

    expect(store.runSystemAudit).toBeDefined();
    
    const report = await store.runSystemAudit();
    
    expect(report).toBeDefined();
    expect(report.totalInspected).toBe(1);
    
    const updatedState = useMapStore.getState() as any;
    expect(updatedState.lastAuditReport).not.toBeNull();
    expect(updatedState.lastAuditReport?.totalInspected).toBe(1);
  });

  it('должен проводить каскадный сбор мусора (executeGarbageCollection) и обновлять граф', async () => {
    const coreNode: ProblemNode = {
      id: 'math-singularity',
      title: 'Теория Сингулярности',
      targetFunction: '0/0 = 1',
      description: 'Основа RICIS-III',
      state: 'resolved',
      type: 'core_singularity',
      economic: { costToSolve: 0, costUnresolved: 0, marketGain: 100, riskLoss: 0 },
      dependencyIds: [],
      dependentIds: [],
      zoneIds: [],
      fractalDepth: 0,
    };

    const orphanNode: ProblemNode = {
      id: 'orphan-node',
      title: 'Сирота',
      targetFunction: 'Y = Y',
      description: 'Изолированный узел',
      state: 'unresolved',
      type: 'scientific_task',
      economic: { costToSolve: 100, costUnresolved: 200, marketGain: 50, riskLoss: 10 },
      dependencyIds: [],
      dependentIds: [],
      zoneIds: [],
      fractalDepth: 1,
    };

    useMapStore.setState({
      nodes: [coreNode, orphanNode],
      edges: []
    });

    const store = useMapStore.getState() as any;
    expect(store.executeGarbageCollection).toBeDefined();

    // Запускаем аудит, чтобы заполнить lastAuditReport
    await store.runSystemAudit();
    
    // Запускаем сборщик мусора
    const result = await store.executeGarbageCollection();
    
    expect(result.removedNodeIds).toContain('orphan-node');
    expect(result.removedFiles).toBeDefined();

    // Проверяем, что сирота удален из стора
    const finalState = useMapStore.getState();
    expect(finalState.nodes).toHaveLength(1);
    expect(finalState.nodes[0]?.id).toBe('math-singularity');

    // Проверяем, что в истории трансформаций сохранились записи (сирота + логика очистки кода)
    const finalStateWithAudit = finalState as any;
    expect(finalStateWithAudit.transformationHistory).toHaveLength(3);
    expect(finalStateWithAudit.transformationHistory[0].operation).toBe('purge_orphan');
  });

  it('должен корректно управлять журналом логов (addAgentLog & clearAgentLogs)', () => {
    const store = useMapStore.getState();
    store.addAgentLog('Тестовое сообщение RICIS', 'ricis', 'Детали вычисления', 'test-node-1');

    let state = useMapStore.getState();
    expect(state.agentLogs.length).toBeGreaterThan(0);
    expect(state.agentLogs[0]?.message).toBe('Тестовое сообщение RICIS');
    expect(state.agentLogs[0]?.level).toBe('ricis');
    expect(state.agentLogs[0]?.nodeId).toBe('test-node-1');

    store.clearAgentLogs();
    state = useMapStore.getState();
    expect(state.agentLogs[0]?.message).toContain('очищен');
  });

  it('должен обновлять параметры узла (updateNode)', async () => {
    const node: ProblemNode = {
      id: 'target-node',
      title: 'Начальный заголовок',
      targetFunction: '0/0',
      description: 'Описание',
      state: 'unresolved',
      type: 'scientific_task',
      economic: { costToSolve: 10, costUnresolved: 20, marketGain: 50, riskLoss: 5 },
      dependencyIds: [],
      dependentIds: [],
      zoneIds: ['math'],
      fractalDepth: 0,
    };

    useMapStore.setState({ nodes: [node] } as any);
    const store = useMapStore.getState();

    await store.updateNode('target-node', {
      title: 'Обновленный заголовок RICIS',
      state: 'resolved',
    });

    const updated = useMapStore.getState().nodes.find(n => n.id === 'target-node');
    expect(updated?.title).toBe('Обновленный заголовок RICIS');
    expect(updated?.state).toBe('resolved');
  });

  it('должен обновлять доказательство (updateProof) и возвращать через getLatexProof', async () => {
    const node: ProblemNode = {
      id: 'proof-node',
      title: 'Узел с доказательством',
      targetFunction: '0_5 * inf_3',
      description: 'Доказательство A6',
      state: 'unresolved',
      type: 'core_singularity',
      economic: { costToSolve: 0, costUnresolved: 0, marketGain: 100, riskLoss: 0 },
      dependencyIds: [],
      dependentIds: [],
      zoneIds: ['math'],
      fractalDepth: 0,
    };

    useMapStore.setState({ nodes: [node], proofs: {} } as any);
    const store = useMapStore.getState();

    await store.updateProof('proof-node', '\\text{det}(u,v) = 15');

    const latex = store.getLatexProof('proof-node');
    expect(latex).toBe('\\text{det}(u,v) = 15');
  });

  it('preserves the existing workflow state when locally audit-valid proof text is edited', async () => {
    const node: ProblemNode = {
      id: 'local-audit-proof-node',
      title: 'Локальное audit-valid доказательство',
      targetFunction: '0_F * inf_G = F * G',
      description: 'PEP-01 local audit non-authority regression',
      state: 'unresolved',
      type: 'core_singularity',
      economic: { costToSolve: 0, costUnresolved: 0, marketGain: 0, riskLoss: 0 },
      dependencyIds: [],
      dependentIds: [],
      zoneIds: ['math'],
      fractalDepth: 0,
    };
    const locallyValidProof = [
      'RICIS proof artifact.',
      'RICIS A6 rule: 0_F * \\infty_G = F * G.',
      'Lean software record: https://doi.org/10.5281/zenodo.21529989.',
    ].join('\n');

    expect(auditProofContent(locallyValidProof).isValid).toBe(true);
    useMapStore.setState({ nodes: [node], proofs: {} } as any);

    await useMapStore.getState().updateProof(node.id, locallyValidProof);

    const state = useMapStore.getState();
    expect(state.proofs[node.id]?.latex).toBe(locallyValidProof);
    expect(state.nodes.find(item => item.id === node.id)?.state).toBe('unresolved');
  });

  it('preserves submitted Lean source without browser-side trust acceptance or state mutation', async () => {
    const node: ProblemNode = {
      id: 'external-lean-node',
      title: 'Внешнее Lean доказательство',
      targetFunction: 'X = X',
      description: 'Проверка immutable source',
      state: 'unresolved',
      type: 'core_singularity',
      economic: { costToSolve: 0, costUnresolved: 0, marketGain: 0, riskLoss: 0 },
      dependencyIds: [],
      dependentIds: [],
      zoneIds: ['math'],
      fractalDepth: 0,
    };
    const source = `import Mathlib\ntheorem external_identity (X : Prop) : X → X := by\n  intro h\n  exact h\n`;
    useMapStore.setState({ nodes: [node], proofs: {}, axioms: [] } as any);
    const store = useMapStore.getState();

    await store.submitExternalLeanProof(node.id, source);
    let state = useMapStore.getState();
    expect(state.proofs[node.id]?.latex).toBe(source);
    expect(state.proofs[node.id]?.externalLean?.sourceLocked).toBe(true);
    expect(state.proofs[node.id]?.externalLean?.trustStatus).toBe('REQUIRES_CORE_LEAN');
    expect(state.nodes[0]?.state).toBe('unresolved');
    await expect(store.updateProof(node.id, 'replacement by agent')).rejects.toThrow('immutable');

    await expect(store.acceptVerifiedExternalLeanProof(node.id, {
      toolchain: 'Lean 4.33.0',
      command: 'lake env lean External.lean && #print axioms external_identity',
      compilerOutput: 'External.lean: compiled successfully',
      axiomReport: 'external_identity does not depend on any axioms',
      verifiedAt: '2026-08-18T00:00:00.000Z',
    })).rejects.toThrow('disabled');
    state = useMapStore.getState();
    expect(state.proofs[node.id]?.latex).toBe(source);
    expect(state.proofs[node.id]?.externalLean?.trustStatus).toBe('REQUIRES_CORE_LEAN');
    expect(state.proofs[node.id]?.externalLean?.kernelEvidence).toBeUndefined();
    expect(state.nodes[0]?.state).toBe('unresolved');
    expect(state.axioms.some(axiom => axiom.sourceNodeId === node.id)).toBe(false);
  });

  it('должен сохранять legacy academic goal match как partial до authoritative Lean evidence', async () => {
    const node: ProblemNode = {
      id: 'acad-node',
      title: 'Академическая сингулярность',
      targetFunction: '0_5 * inf_3 = 15',
      description: 'Проверка академического протокола',
      state: 'unresolved',
      type: 'core_singularity',
      economic: { costToSolve: 0, costUnresolved: 0, marketGain: 100, riskLoss: 0 },
      dependencyIds: [],
      dependentIds: [],
      zoneIds: ['math'],
      fractalDepth: 0,
    };

    useMapStore.setState({ nodes: [node], proofs: {} } as any);
    const store = useMapStore.getState();

    const result = await store.recalculateAcademicProof('acad-node', ['0_5 * inf_3'], '15');

    expect(result).not.toBeNull();
    expect(result?.academicStatus).toBe('QED_VERIFIED');
    expect(result?.reducedInvariant).toBe('15');
    expect(result?.goalMatched).toBe(true);

    const updatedNode = useMapStore.getState().nodes.find(n => n.id === 'acad-node');
    expect(updatedNode?.state).toBe('partial');

    const proof = useMapStore.getState().proofs['acad-node'];
    expect(proof).toBeDefined();
    expect(proof?.finalResult).toBe('15');
    expect(proof?.steps.length).toBeGreaterThanOrEqual(4);
  });

  it('должен добавлять пользовательский узел (addCustomNode)', async () => {
    const parentNode: ProblemNode = {
      id: 'math-singularity',
      title: 'Root',
      targetFunction: 'X = X',
      description: 'Root Node',
      state: 'resolved',
      type: 'core_singularity',
      economic: { costToSolve: 0, costUnresolved: 0, marketGain: 100, riskLoss: 0 },
      dependencyIds: [],
      dependentIds: [],
      zoneIds: ['math'],
      fractalDepth: 0,
    };

    useMapStore.setState({
      nodes: [parentNode],
      edges: [],
      zones: [{ id: 'math', name: 'Mathematics', description: '', nodeIds: ['math-singularity'], economicProfile: {} as any }]
    } as any);

    const newNode: ProblemNode = {
      id: 'custom-child',
      title: 'Custom Child',
      targetFunction: '0_7 / 0_7 = 1',
      description: 'Child Description',
      state: 'unresolved',
      type: 'scientific_task',
      economic: { costToSolve: 10, costUnresolved: 20, marketGain: 30, riskLoss: 5 },
      dependencyIds: [],
      dependentIds: [],
      zoneIds: ['math'],
      fractalDepth: 0,
    };

    const store = useMapStore.getState();
    const createdNodeId = await store.addCustomNode(newNode, 'math-singularity');

    const state = useMapStore.getState();
    expect(state.nodes.some(n => n.id === createdNodeId && /^[0-9a-f]{32}$/.test(n.id))).toBe(true);
    expect(state.edges.some(e => e.fromId === 'math-singularity' && e.toId === createdNodeId)).toBe(true);
  });
});
