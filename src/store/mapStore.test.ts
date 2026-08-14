import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMapStore } from './mapStore';
import { ProblemNode, DependencyEdge } from '../model/types';

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
});
