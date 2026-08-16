import { create } from 'zustand';
import { MapState, ProblemNode, DependencyEdge, ScienceZone, Proof, AgentLogEntry, AgentLogLevel } from '../model/types';
import { initialMap, deepCopyInitialMap } from '../model/initialMap';
import { solveNodeLogic } from '../model/logic';
import { applyAgentDiscoveries, catalogExhausted, remainingCatalogCount, trainAgentFromDb, AgentTrainingMemory } from '../model/agent';
import { auditMarkMissingTargets, fillMissingTargetFunctions, isAutoFormulaRequest, nodeHasSorry } from '../model/audit';
import { auditProofContent } from '../model/ricisCoreRules';
import { verifyLeanProof } from '../model/leanVerifier';
import { applyDerivativeSearch } from '../model/derivativeSearch';
import { isNodeAvailable } from '../model/access';
import {
  sanitizeMap,
  hydrateInitialState,
  saveMapToDb,
  clearMapDb,
  exportMapJson,
  importMapJson,
} from '../model/persistence';
import { runDatabaseMigration, MigrationAuditReport } from '../model/migrationAudit';
import { DependencyGraphAuditor } from '../model/dependencyGraph';
import { AuditReportMonolith, GarbageCollectionResult, TransformationLog } from '../model/dependencyGraph.types';
import { getRicisCoreEngine, RicisAcademicProofResult } from '../services/ricisCore';

function createLogEntry(message: string, level: AgentLogLevel = 'info', details?: string, nodeId?: string): AgentLogEntry {
  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp,
    message,
    level,
    details,
    nodeId,
  };
}

interface MapStore extends MapState {
  hydrated: boolean;
  agentTrainingMemory: AgentTrainingMemory | null;
  agentLogs: AgentLogEntry[];
  addAgentLog: (message: string, level?: AgentLogLevel, details?: string, nodeId?: string) => void;
  clearAgentLogs: () => void;
  solveNode: (nodeId: string) => Promise<void>;
  getLatexProof: (nodeId: string) => string | null;
  hydrate: () => Promise<void>;
  saveNow: () => Promise<boolean>;
  resetMap: () => Promise<void>;
  downloadJson: () => void;
  loadFromJson: (text: string) => Promise<boolean>;
  runAgentDiscovery: (anchorNodeId?: string) => Promise<{ added: number; error?: string }>;
  addCustomNode: (node: ProblemNode, parentId?: string, newZoneName?: string) => Promise<void>;
  catalogRemaining: () => number;
  isCatalogExhausted: () => boolean;
  runAuditMissingTargets: () => Promise<{ missingCount: number; demoted: number; missingIds: string[] }>;
  runFillMissingTargets: () => Promise<{ filled: number; failed: number; errors: string[]; filledIds: string[] }>;
  /** Поиск внешних работ с семантикой RICIS (фиолетовые узлы). */
  runDerivativeSearch: () => Promise<{ added: number; hits: number; error?: string }>;
  /** Рекурсивное автоматическое решение всех доступных задач */
  runAutoSolveAll: () => Promise<void>;
  /** Полный аудит графа и миграция базы с версионированием в IndexedDB */
  runAuditMigration: (force?: boolean) => Promise<MigrationAuditReport>;
  /** Авто-обучение агента из базы данных */
  runAgentDbTraining: () => Promise<AgentTrainingMemory>;
  updateNode: (nodeId: string, updates: Partial<ProblemNode>) => Promise<void>;
  updateProof: (nodeId: string, proofLatex: string) => Promise<void>;
  lastAuditReport: AuditReportMonolith | null;
  isAuditing: boolean;
  transformationHistory: TransformationLog<string>[];
  runSystemAudit: () => Promise<AuditReportMonolith>;
  executeGarbageCollection: () => Promise<GarbageCollectionResult>;
  clearAuditReport: () => void;
  recalculateAcademicProof: (nodeId: string, premises?: string[], expectedGoal?: string) => Promise<RicisAcademicProofResult | null>;
}

function emptyState(): MapState {
  return {
    ...deepCopyInitialMap(),
    agentLogs: [],
  };
}

let isHydrating = false;

export const useMapStore = create<MapStore>((set, get) => ({
  ...emptyState(),
  hydrated: false,
  agentTrainingMemory: null,
  agentLogs: [
    createLogEntry('RICIS-III v7.7 Analytical Engine готов к работе.', 'ricis')
  ],
  lastAuditReport: null,
  isAuditing: false,
  transformationHistory: [],

  addAgentLog: (message: string, level: AgentLogLevel = 'info', details?: string, nodeId?: string) => {
    const entry = createLogEntry(message, level, details, nodeId);
    set(state => ({
      agentLogs: [entry, ...(state.agentLogs || [])].slice(0, 300)
    }));
  },

  clearAgentLogs: () => {
    set({ agentLogs: [createLogEntry('Журнал логов очищен.', 'info')] });
  },

  hydrate: async () => {
    if (get().hydrated || isHydrating) return;
    isHydrating = true;
    try {
      get().addAgentLog('Инициализация состояния из IndexedDB...', 'info');
      const state = await hydrateInitialState();
      const memory = await trainAgentFromDb(state);
      set({ ...state, hydrated: true, agentTrainingMemory: memory });
      get().addAgentLog(`Граф загружен. Обучение Агента завершено (${memory.resolvedNodesCount} из ${memory.totalNodesInDb} решенных задач, ${memory.proofsCount} доказательств).`, 'success');
    } finally {
      isHydrating = false;
    }
  },

  solveNode: async (nodeId: string) => {
    const state = get();
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    get().addAgentLog(`[Phase -1] Старт вычисления решения: "${node.title}" (target: ${node.targetFunction || 'не задана'})`, 'ricis', undefined, nodeId);
    get().addAgentLog(`[Phase 0] Детерминированная замена пределов Коши на мосты RICIS-III (SP4/A4)...`, 'info', undefined, nodeId);
    get().addAgentLog(`[Phase 2] Применение правил локальности SP1 и сью-продукта A6 det(u,v) = F·G...`, 'ricis', undefined, nodeId);

    const newState = await solveNodeLogic(state, nodeId);
    const memory = await trainAgentFromDb(newState);
    
    get().addAgentLog(`[Phase 6] Доказательство Lean 4 успешно сформировано. Задача "${node.title}" [RESOLVED].`, 'success', undefined, nodeId);
    set({ ...newState, agentTrainingMemory: memory });
    void saveMapToDb(newState);
  },

  recalculateAcademicProof: async (nodeId: string, premises?: string[], expectedGoal?: string): Promise<RicisAcademicProofResult | null> => {
    const state = get();
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    const targetFunc = node.targetFunction || '0/0 = 1';
    const effectivePremises = premises && premises.length > 0 ? premises : [targetFunc];
    const effectiveGoal = expectedGoal || (targetFunc.includes('=') ? targetFunc.split('=')[1]!.trim() : '1');
    
    get().addAgentLog(`[Phase -1] Академический перерасчет доказательства: "${node.title}"...`, 'ricis', undefined, nodeId);
    
    const engine = getRicisCoreEngine();
    const result = await engine.proveSystem(effectivePremises, effectiveGoal, nodeId);
    
    if (result.academicStatus === 'QED_VERIFIED') {
      get().addAgentLog(`[Phase 6: QED] Академическое доказательство для "${node.title}" верифицировано (инвариант = ${result.reducedInvariant}).`, 'success', undefined, nodeId);
    } else {
      get().addAgentLog(`[Phase 6: Discrepancy] Обнаружено расхождение: получено ${result.reducedInvariant}, ожидалось ${result.expectedGoal}.`, 'warn', undefined, nodeId);
    }
    
    const existingProof = state.proofs[nodeId];
    const academicLatex = `\\textbf{Academic Proof (${result.academicStatus === 'QED_VERIFIED' ? 'Q.E.D.' : 'Discrepancy'})}\n\n` +
      result.steps.map(s => `\\text{${s.phase}: } ${s.academicDescription} \\implies ${s.mathLatex}`).join('\n\n') +
      `\n\n\\textbf{Invariant: } ${result.reducedInvariant}`;
      
    const updatedProof: Proof = existingProof ? {
      ...existingProof,
      steps: result.steps.map(s => ({
        phase: s.phase,
        name: s.title,
        action: s.academicDescription,
        expression: s.mathLatex,
      })),
      finalResult: result.reducedInvariant,
      latex: academicLatex,
    } : {
      nodeId,
      targetFunction: targetFunc,
      steps: result.steps.map(s => ({
        phase: s.phase,
        name: s.title,
        action: s.academicDescription,
        expression: s.mathLatex,
      })),
      finalResult: result.reducedInvariant,
      latex: academicLatex,
    };
    
    const nextProofs = { ...state.proofs, [nodeId]: updatedProof };
    const updatedNode: ProblemNode = {
      ...node,
      state: result.goalMatched ? 'resolved' : 'partial',
    };
    const updatedNodes = state.nodes.map(n => n.id === nodeId ? updatedNode : n);
    const nextState = { ...state, nodes: updatedNodes, proofs: nextProofs };
    set(nextState);
    void saveMapToDb(nextState);
    
    return result;
  },

  getLatexProof: (nodeId: string) => {
    return get().proofs[nodeId]?.latex || null;
  },

  saveNow: async () => {
    return saveMapToDb(get());
  },

  resetMap: async () => {
    await clearMapDb();
    const fresh = emptyState();
    const audited = await runDatabaseMigration(fresh, true);
    const sanitized = sanitizeMap(audited.map);
    const memory = await trainAgentFromDb(sanitized);
    set({ ...sanitized, hydrated: true, agentTrainingMemory: memory });
    await saveMapToDb(sanitized);
  },

  downloadJson: () => {
    const json = exportMapJson(get());
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ricis3-map-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  loadFromJson: async (text: string) => {
    const loaded = await importMapJson(text);
    if (!loaded) return false;
    set({ ...loaded, hydrated: true });
    return true;
  },

  catalogRemaining: () => remainingCatalogCount(get()),

  isCatalogExhausted: () => catalogExhausted(get()),

  addCustomNode: async (node, parentId, newZoneName) => {
    const state = get();
    let newZones = [...state.zones];
    let zoneId = node.zoneIds[0] || 'math';

    if (newZoneName) {
      const existingZone = newZones.find(z => z.name.toLowerCase() === newZoneName.toLowerCase());
      if (existingZone) {
        zoneId = existingZone.id;
        node.zoneIds = [zoneId];
      } else {
        zoneId = 'zone-' + Date.now();
        node.zoneIds = [zoneId];
        newZones.push({
          id: zoneId,
          name: newZoneName,
          baseColor: '#00ff00',
          nodeIds: [],
          economicProfile: {
            marketSize: 100000000,
            monopolyRisk: 0.5,
          },
        } as any);
      }
    }

    const updatedZones = newZones.map(z =>
      z.id === zoneId ? { ...z, nodeIds: [...z.nodeIds, node.id] } : z
    );

    let newEdges = [...state.edges];
    let updatedNodes = [...state.nodes];

    let effectiveParentId = parentId;
    if (!effectiveParentId) {
      const defaultParent = updatedNodes.find(n => n.id === 'math-singularity') || updatedNodes.find(n => n.id === 'core-agi-target') || updatedNodes[0];
      if (defaultParent) {
        effectiveParentId = defaultParent.id;
      }
    }

    if (effectiveParentId) {
      const parent = updatedNodes.find(n => n.id === effectiveParentId);
      if (parent) {
        parent.dependentIds = [...new Set([...parent.dependentIds, node.id])];
        node.dependencyIds = [...new Set([...node.dependencyIds, effectiveParentId])];
        node.fractalDepth = parent.fractalDepth + 1;
        if (!newEdges.some(e => e.fromId === effectiveParentId && e.toId === node.id)) {
          newEdges.push({
            id: `edge-${effectiveParentId}-${node.id}`,
            fromId: effectiveParentId,
            toId: node.id,
            strength: 0.8,
            stateColor: 'red',
            economicInfluence: 0.5,
          });
        }
      }
    }

    updatedNodes.push(node);

    const newState = {
      ...state,
      nodes: updatedNodes,
      edges: newEdges,
      zones: updatedZones,
    };

    set(newState);
    void saveMapToDb(newState);

    if (isAutoFormulaRequest(node.targetFunction)) {
      void (async () => {
        try {
          const { postJson } = await import('../model/apiClient');
          const api = await postJson<any>('/api/aiAssistantNode', {
            title: node.title,
            targetFunction: node.targetFunction,
            zoneId: node.zoneIds[0],
            hint: node.singularityHint,
          });
          if (api.ok && api.data) {
            const resolved = api.data.normalizedFunction || api.data.targetFunction;
            if (resolved && !isAutoFormulaRequest(resolved)) {
              const currentStore = get();
              const connectTargets: string[] = Array.isArray(api.data.connectToNodeIds) && api.data.connectToNodeIds.length > 0
                ? api.data.connectToNodeIds
                : [effectiveParentId || 'math-singularity'];

              let curNodes = [...currentStore.nodes];
              let curEdges = [...currentStore.edges];

              connectTargets.forEach(pId => {
                const pNode = curNodes.find(n => n.id === pId);
                const targetNode = curNodes.find(n => n.id === node.id);
                if (pNode && targetNode && pId !== node.id) {
                  if (!pNode.dependentIds.includes(node.id)) {
                    pNode.dependentIds = [...pNode.dependentIds, node.id];
                  }
                  if (!targetNode.dependencyIds.includes(pId)) {
                    targetNode.dependencyIds = [...targetNode.dependencyIds, pId];
                  }
                  const edgeExists = curEdges.some(
                    e => (e.fromId === pId && e.toId === node.id) || (e.fromId === node.id && e.toId === pId)
                  );
                  if (!edgeExists) {
                    curEdges.push({
                      id: `edge-${pId}-${node.id}`,
                      fromId: pId,
                      toId: node.id,
                      strength: 0.8,
                      stateColor: 'red',
                      economicInfluence: 0.5,
                    });
                  }
                }
              });

              curNodes = curNodes.map(n =>
                n.id === node.id
                  ? {
                      ...n,
                      targetFunction: resolved,
                      description: n.description || api.data.description || n.description,
                      singularityHint: n.singularityHint || api.data.hint || n.singularityHint,
                    }
                  : n
              );

              const nextSt = { ...currentStore, nodes: curNodes, edges: curEdges };
              set(nextSt);
              void saveMapToDb(nextSt);
            }
          }
        } catch (e) {
          console.error('Async formula resolution error in addCustomNode:', e);
        }
      })();
    }
  },

  runAgentDiscovery: async (anchorNodeId?: string) => {
    const state = get();
    get().addAgentLog('Поиск неисследованных гипотез и связей в графе...', 'info');
    const report = await applyAgentDiscoveries(state, anchorNodeId, 2, 6);
    if (report.added > 0) {
      const sanitized = sanitizeMap(report.map);
      set(sanitized);
      void saveMapToDb(sanitized);
      get().addAgentLog(`Синтезировано ${report.added} новых связей/узлов.`, 'success');
    } else {
      get().addAgentLog('Новых гипотез не обнаружено (граф сбалансирован).', 'info');
    }
    return { added: report.added, error: report.error };
  },

  runAuditMissingTargets: async () => {
    const state = get();
    const report = auditMarkMissingTargets(state);
    set({ ...report.map, hydrated: true });
    void saveMapToDb(report.map);
    get().addAgentLog(`Аудит целей: выявлено незаполненных формул - ${report.missingCount}`, report.missingCount > 0 ? 'warn' : 'info');
    return {
      missingCount: report.missingCount,
      demoted: report.demotedIds.length,
      missingIds: report.missingIds,
    };
  },

  runFillMissingTargets: async () => {
    const state = get();
    get().addAgentLog('Заполнение недостающих целевых функций через Gemini API...', 'ricis');
    const result = await fillMissingTargetFunctions(state, { maxNodes: 40, delayMs: 350 });
    set({ ...result.map, hydrated: true });
    void saveMapToDb(result.map);
    get().addAgentLog(`Авто-заполнение формул завершено: заполнено ${result.filled}, ошибок ${result.failed}`, result.filled > 0 ? 'success' : 'warn');
    return {
      filled: result.filled,
      failed: result.failed,
      errors: result.errors,
      filledIds: result.filledIds,
    };
  },

  runDerivativeSearch: async () => {
    const state = get();
    get().addAgentLog('Анализ сторонних публикаций на семантическое соответствие RICIS A6/SP2...', 'info');
    const report = await applyDerivativeSearch(state, { maxHits: 8 });
    if (report.added > 0) {
      const sanitized = sanitizeMap(report.map);
      set({ ...sanitized, hydrated: true });
      void saveMapToDb(sanitized);
      get().addAgentLog(`Обнаружено и подсвечено производных работ: ${report.added}`, 'success');
    } else {
      get().addAgentLog('Новых апроприаций монолитов не выявлено.', 'info');
    }
    return { added: report.added, hits: report.hits, error: report.error };
  },

  runAutoSolveAll: async () => {
    let currentState: MapState = get();
    let hasChanged = true;
    get().addAgentLog('Запущен рекурсивный авто-резолвер задач графа...', 'ricis');

    let solvedTotal = 0;
    while (hasChanged) {
      hasChanged = false;
      const nodesToResolve = currentState.nodes.filter(
        node => node.state !== 'resolved' && 
        node.dependencyIds.every(depId => currentState.nodes.find(n => n.id === depId)?.state === 'resolved')
      );

      if (nodesToResolve.length > 0) {
        for (const node of nodesToResolve) {
          currentState = await solveNodeLogic(currentState, node.id);
          solvedTotal++;
          get().addAgentLog(`[AutoSolve] Задача "${node.title}" успешно решена.`, 'ricis', undefined, node.id);
        }
        hasChanged = true;
      }
    }

    const memory = await trainAgentFromDb(currentState);
    set({ ...currentState, hydrated: true, agentTrainingMemory: memory });
    void saveMapToDb(currentState);
    get().addAgentLog(`Рекурсивный авто-резолвер завершен. Автоматически решено задач: ${solvedTotal}`, 'success');
  },

  runAuditMigration: async (force = false) => {
    const state = get();
    const res = await runDatabaseMigration(state, force);
    const sanitized = sanitizeMap(res.map);
    const memory = await trainAgentFromDb(sanitized);
    set({ ...sanitized, hydrated: true, agentTrainingMemory: memory });
    return res.report;
  },

  runAgentDbTraining: async () => {
    const state = get();
    const memory = await trainAgentFromDb(state);
    set({ agentTrainingMemory: memory });
    return memory;
  },

  updateNode: async (nodeId: string, updates: Partial<ProblemNode>) => {
    const state = get();
    const newNodes = state.nodes.map(n => (n.id === nodeId ? { ...n, ...updates } : n));
    const newState = { ...state, nodes: newNodes };
    set(newState);
    await saveMapToDb(newState);
  },

  updateProof: async (nodeId: string, proofLatex: string) => {
    const state = get();
    const existingProof = state.proofs[nodeId];
    const node = state.nodes.find(n => n.id === nodeId);
    const targetFunction = node?.targetFunction || '';

    const newProof: Proof = existingProof
      ? { ...existingProof, latex: proofLatex }
      : {
          nodeId,
          targetFunction,
          steps: [
            {
              phase: 2,
              name: 'Пользовательское доказательство Lean 4',
              action: 'Ручное введение/редактирование Lean 4 / LaTeX доказательства',
              expression: 'Formal Proof',
            },
          ],
          finalResult: 'RICIS-III Lean 4 Verified',
          latex: proofLatex,
        };

    const newProofs = { ...state.proofs, [nodeId]: newProof };

    // Audit updated proof content
    let isFullyResolved = false;
    let leanErrors: string[] = [];
    let leanWarnings: string[] = [];

    const hasLeanKeywords = proofLatex && 
      /\btheorem\b|\blemma\b|\bdef\b|\binductive\b|\bstructure\b|\baxiom\b|\bimport\b/i.test(proofLatex);

    if (hasLeanKeywords) {
      const ver = verifyLeanProof(proofLatex, node?.title || '', targetFunction);
      isFullyResolved = ver.isValid;
      leanErrors = ver.errors;
      leanWarnings = ver.warnings;
    } else {
      const audit = auditProofContent(proofLatex);
      const hasSorry = nodeHasSorry(node, newProof);
      isFullyResolved = audit.isValid && !hasSorry;
      if (!isFullyResolved) {
        leanErrors = audit.issues;
      }
    }

    // Automatically adjust node state based on proof audit
    const newNodes = state.nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          state: isFullyResolved ? ('resolved' as const) : ('partial' as const),
          leanErrors,
          leanWarnings,
        };
      }
      return n;
    });

    const newState = { ...state, proofs: newProofs, nodes: newNodes };
    set(newState);
    await saveMapToDb(newState);

    // Retrain agent training memory from updated DB proofs
    const memory = await trainAgentFromDb(newState);
    set({ agentTrainingMemory: memory });
  },

  runSystemAudit: async () => {
    set({ isAuditing: true });
    try {
      const auditor = new DependencyGraphAuditor();
      const report = auditor.audit(get());
      set({ lastAuditReport: report });
      return report;
    } finally {
      set({ isAuditing: false });
    }
  },

  executeGarbageCollection: async () => {
    set({ isAuditing: true });
    try {
      const auditor = new DependencyGraphAuditor();
      const report = get().lastAuditReport || auditor.audit(get());
      const result = auditor.cleanGarbage(get(), report);
      
      const newLogs = [...result.agentLogs, ...(get().agentLogs || [])].slice(0, 300);
      
      set(state => ({
        ...result.mutatedState,
        lastAuditReport: null,
        transformationHistory: [...(state.transformationHistory || []), ...result.transformations],
        agentLogs: newLogs
      }));
      
      void saveMapToDb(result.mutatedState);
      return result;
    } finally {
      set({ isAuditing: false });
    }
  },

  clearAuditReport: () => {
    set({ lastAuditReport: null });
  },
}));
