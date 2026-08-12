import { create } from 'zustand';
import { MapState, ProblemNode, DependencyEdge, ScienceZone, Proof } from '../model/types';
import { initialMap, deepCopyInitialMap } from '../model/initialMap';
import { solveNodeLogic } from '../model/logic';
import { applyAgentDiscoveries, catalogExhausted, remainingCatalogCount, trainAgentFromDb, AgentTrainingMemory } from '../model/agent';
import { auditMarkMissingTargets, fillMissingTargetFunctions, isAutoFormulaRequest, nodeHasSorry } from '../model/audit';
import { auditProofContent } from '../model/ricisCoreRules';
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

interface MapStore extends MapState {
  hydrated: boolean;
  agentTrainingMemory: AgentTrainingMemory | null;
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
  /** Полный аудит графа и миграция базы с версионированием в IndexedDB */
  runAuditMigration: (force?: boolean) => Promise<MigrationAuditReport>;
  /** Авто-обучение агента из базы данных */
  runAgentDbTraining: () => Promise<AgentTrainingMemory>;
  updateNode: (nodeId: string, updates: Partial<ProblemNode>) => Promise<void>;
  updateProof: (nodeId: string, proofLatex: string) => Promise<void>;
}

function emptyState(): MapState {
  return {
    ...deepCopyInitialMap(),
  };
}

export const useMapStore = create<MapStore>((set, get) => ({
  ...emptyState(),
  hydrated: false,
  agentTrainingMemory: null,

  hydrate: async () => {
    if (get().hydrated) return;
    const state = await hydrateInitialState();
    const memory = await trainAgentFromDb(state);
    set({ ...state, hydrated: true, agentTrainingMemory: memory });
  },

  solveNode: async (nodeId: string) => {
    const state = get();
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const newState = await solveNodeLogic(state, nodeId);
    const memory = await trainAgentFromDb(newState);
    set({ ...newState, agentTrainingMemory: memory });
    void saveMapToDb(newState);
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
    const report = await applyAgentDiscoveries(state, anchorNodeId, 2, 6);
    if (report.added > 0) {
      const sanitized = sanitizeMap(report.map);
      set(sanitized);
      void saveMapToDb(sanitized);
    }
    return { added: report.added, error: report.error };
  },

  runAuditMissingTargets: async () => {
    const state = get();
    const report = auditMarkMissingTargets(state);
    set({ ...report.map, hydrated: true });
    void saveMapToDb(report.map);
    return {
      missingCount: report.missingCount,
      demoted: report.demotedIds.length,
      missingIds: report.missingIds,
    };
  },

  runFillMissingTargets: async () => {
    const state = get();
    const result = await fillMissingTargetFunctions(state, { maxNodes: 40, delayMs: 350 });
    set({ ...result.map, hydrated: true });
    void saveMapToDb(result.map);
    return {
      filled: result.filled,
      failed: result.failed,
      errors: result.errors,
      filledIds: result.filledIds,
    };
  },

  runDerivativeSearch: async () => {
    const state = get();
    const report = await applyDerivativeSearch(state, { maxHits: 8 });
    if (report.added > 0) {
      const sanitized = sanitizeMap(report.map);
      set({ ...sanitized, hydrated: true });
      void saveMapToDb(sanitized);
    }
    return { added: report.added, hits: report.hits, error: report.error };
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
    const audit = auditProofContent(proofLatex);
    const hasSorry = nodeHasSorry(node, newProof);
    const isFullyResolved = audit.isValid && !hasSorry;

    // Automatically adjust node state based on proof audit
    const newNodes = state.nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          state: isFullyResolved ? ('resolved' as const) : ('partial' as const),
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
}));
