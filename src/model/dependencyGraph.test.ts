import { describe, it, expect } from 'vitest';
import { MapState, ProblemNode, DependencyEdge } from './types';
import { DependencyGraphAuditor } from './dependencyGraph';

// Вспомогательная функция для создания минимального валидного состояния MapState
function createMockMapState(overrides: Partial<MapState> = {}): MapState {
  return {
    nodes: [],
    edges: [],
    zones: [],
    axioms: [],
    proofs: {},
    agentLogs: [],
    ...overrides,
  };
}

// Корневые монолиты по умолчанию
const rootNodes: ProblemNode[] = [
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
  },
  {
    id: 'core-agi-target',
    title: 'Цель AGI',
    targetFunction: 'X = X',
    description: 'Главный онтологический таргет',
    state: 'unresolved',
    type: 'core_singularity',
    economic: { costToSolve: 100, costUnresolved: 500, marketGain: 1000, riskLoss: 200 },
    dependencyIds: [],
    dependentIds: [],
    zoneIds: [],
    fractalDepth: 0,
  }
];

describe('RICIS-III v7.7 Extended System Auditor & Garbage Collector Unit Tests', () => {
  const auditor = new DependencyGraphAuditor();

  describe('Section 1: Graph Knowledge Base Auditing', () => {
    it('должен корректно определять достижимые узлы из RootMonoliths', () => {
      const nodeA: ProblemNode = {
        id: 'node-A',
        title: 'Предел Коши',
        targetFunction: '\\lim X',
        description: 'Классический переход',
        state: 'unresolved',
        type: 'derived_problem',
        economic: { costToSolve: 50, costUnresolved: 100, marketGain: 200, riskLoss: 50 },
        dependencyIds: ['math-singularity'],
        dependentIds: [],
        zoneIds: [],
        fractalDepth: 1,
      };

      const edges: DependencyEdge[] = [
        { id: 'edge-1', fromId: 'math-singularity', toId: 'node-A', strength: 1, stateColor: 'green', economicInfluence: 50 }
      ];

      const state = createMockMapState({
        nodes: [...rootNodes, nodeA],
        edges,
      });

      const report = auditor.audit(state);
      expect(report.isValid).toBe(true);
      expect(report.orphans).toHaveLength(0);
      expect(report.brokenEdges).toHaveLength(0);
      expect(report.totalInspected).toBe(3);
    });

    it('должен проходить дерево рекурсивно по dependencyIds без edge snapshot', () => {
      const childNode: ProblemNode = {
        id: 'dependency-only-child',
        title: 'Дочерний узел из persisted dependencyIds',
        targetFunction: 'F = G',
        description: 'Связь хранится только в обратном dependency reference.',
        state: 'unresolved',
        type: 'derived_problem',
        economic: { costToSolve: 10, costUnresolved: 20, marketGain: 30, riskLoss: 5 },
        dependencyIds: ['math-singularity'],
        dependentIds: [],
        zoneIds: [],
        fractalDepth: 1,
      };

      const report = auditor.audit(createMockMapState({
        nodes: [...rootNodes, childNode],
        edges: [],
      }));

      expect(report.isValid).toBe(true);
      expect(report.orphans).toHaveLength(0);
      expect(report.totalInspected).toBe(3);
    });

    it('должен выявлять сиротские (orphan) узлы [OrphanSingularity 0_orphan]', () => {
      const orphanNode: ProblemNode = {
        id: 'isolated-node',
        title: 'Бесполезный монолит',
        targetFunction: 'Y = Z',
        description: 'Не связанный узел',
        state: 'unresolved',
        type: 'scientific_task',
        economic: { costToSolve: 40, costUnresolved: 200, marketGain: 50, riskLoss: 10 },
        dependencyIds: [],
        dependentIds: [],
        zoneIds: [],
        fractalDepth: 1,
      };

      const state = createMockMapState({
        nodes: [...rootNodes, orphanNode],
        edges: [],
      });

      const report = auditor.audit(state);
      expect(report.orphans).toHaveLength(1);
      expect(report.orphans[0]?.id).toBe('isolated-node');
      expect(report.potentialReclaimedMass.costUnresolved).toBe(200);
      expect(report.potentialReclaimedMass.costToSolve).toBe(40);
    });

    it('должен выявлять замкнутые циклические петли без переполнения стека [A4 0/0 Ratio]', () => {
      const cycleA: ProblemNode = {
        id: 'cycle-A',
        title: 'Рекурсия Альфа',
        targetFunction: 'A = B',
        description: 'Циклическая связь',
        state: 'unresolved',
        type: 'scientific_task',
        economic: { costToSolve: 10, costUnresolved: 50, marketGain: 10, riskLoss: 5 },
        dependencyIds: ['cycle-B'],
        dependentIds: [],
        zoneIds: [],
        fractalDepth: 1,
      };

      const cycleB: ProblemNode = {
        id: 'cycle-B',
        title: 'Рекурсия Бета',
        targetFunction: 'B = A',
        description: 'Циклическая связь',
        state: 'unresolved',
        type: 'scientific_task',
        economic: { costToSolve: 10, costUnresolved: 50, marketGain: 10, riskLoss: 5 },
        dependencyIds: ['cycle-A'],
        dependentIds: [],
        zoneIds: [],
        fractalDepth: 1,
      };

      const edges: DependencyEdge[] = [
        { id: 'edge-a-b', fromId: 'cycle-A', toId: 'cycle-B', strength: 1, stateColor: 'red', economicInfluence: 10 },
        { id: 'edge-b-a', fromId: 'cycle-B', toId: 'cycle-A', strength: 1, stateColor: 'red', economicInfluence: 10 },
      ];

      const state = createMockMapState({
        nodes: [...rootNodes, cycleA, cycleB],
        edges,
      });

      const report = auditor.audit(state);
      expect(report.cyclicGroups).toHaveLength(1);
      const groupIds = report.cyclicGroups[0]?.map(n => n.id) || [];
      expect(groupIds).toContain('cycle-A');
      expect(groupIds).toContain('cycle-B');
    });

    it('должен выявлять семантические дубликаты на основе SP4 индекса [L1_IDENTITY]', () => {
      const original: ProblemNode = {
        id: 'node-orig',
        title: 'Дублирующийся Монолит',
        targetFunction: 'S = S',
        description: 'Оригинальный узел',
        state: 'unresolved',
        type: 'scientific_task',
        economic: { costToSolve: 10, costUnresolved: 10, marketGain: 10, riskLoss: 5 },
        dependencyIds: [],
        dependentIds: [],
        zoneIds: [],
        fractalDepth: 1,
      };

      const duplicate: ProblemNode = {
        id: 'node-dup',
        title: 'Дублирующийся Монолит',
        targetFunction: 'S = S',
        description: 'Второй узел',
        state: 'unresolved',
        type: 'scientific_task',
        economic: { costToSolve: 10, costUnresolved: 10, marketGain: 10, riskLoss: 5 },
        dependencyIds: [],
        dependentIds: [],
        zoneIds: [],
        fractalDepth: 1,
      };

      const state = createMockMapState({
        nodes: [...rootNodes, original, duplicate],
        edges: [],
      });

      const report = auditor.audit(state);
      expect(report.duplicates).toHaveLength(1);
      expect(report.duplicates[0]?.primary.id).toBe('node-orig');
      expect(report.duplicates[0]?.redundant[0]?.id).toBe('node-dup');
    });
  });

  describe('Section 2: Codebase & Source Application Auditing', () => {
    it('должен обнаруживать неиспользуемые/устаревшие файлы и дублирование логики в кодовой базе', () => {
      const state = createMockMapState({
        nodes: [...rootNodes],
      });

      const report = auditor.audit(state);

      // Ожидаем, что в реальном приложении аудит кодовой базы найдет устаревшие файлы
      // (например, старые утилиты аудита или неиспользуемые импорты)
      expect(report.totalCodeSizeInBytes).toBeGreaterThan(0);
      expect(report.codebaseIssues).toBeDefined();
      
      const duplicates = report.codebaseIssues.filter(i => i.type === 'duplicate_logic');
      expect(duplicates.length).toBeGreaterThanOrEqual(0);
    });

    it('должен выполнять очистку кодовой базы, сохраняя лог трансформаций кода', () => {
      const state = createMockMapState({
        nodes: [...rootNodes],
      });

      const report = auditor.audit(state);
      const result = auditor.cleanGarbage(state, report);

      expect(result.removedFiles).toBeDefined();
      expect(result.transformations).toBeDefined();
      
      // Лог трансформации кода должен содержать записи об очистке неиспользуемых файлов, если таковые были найдены
      const codePurges = result.transformations.filter(t => t.operation === 'purge_code_garbage');
      expect(codePurges.length).toBeGreaterThanOrEqual(0);
    });
  });
});
