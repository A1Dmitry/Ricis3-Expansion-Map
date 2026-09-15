/**
 * IProofChainWalker — Walk dependency chain leaf → root; detect cycle/broken
 * 
 * Reuses/adapts BFS concept from src/model/dependencyGraph.ts (DependencyGraphAuditor#getChildren)
 * Single chain-walk implementation shared — inverted direction leaf→root via dependencyIds.
 * Avoids duplicated BFS; see audit.ts getChildren for forward walk root→children.
 */
import type { MapState, ProblemNode } from '../../model/types';
import type { ChainWalkResult } from './types';

export interface IProofChainWalker {
  walkToRoot(leafId: string, state: MapState): ChainWalkResult;
}

export class ProofChainWalker implements IProofChainWalker {
  walkToRoot(leafId: string, state: MapState): ChainWalkResult {
    if (!leafId || typeof leafId !== 'string' || !leafId.trim()) {
      return { status: 'BLOCKED', reason: 'BROKEN_LINK', missingId: String(leafId), details: 'leafId is empty' };
    }

    const nodeMap = new Map<string, ProblemNode>();
    for (const n of state.nodes) nodeMap.set(n.id, n);

    if (!nodeMap.has(leafId)) {
      return { status: 'BLOCKED', reason: 'BROKEN_LINK', missingId: leafId, details: 'leaf not found in graph' };
    }

    const visitedGlobal = new Set<string>();
    const recursionStack = new Set<string>();
    const chain: ProblemNode[] = [];
    let cycleDetected = false;
    let brokenMissingId: string | null = null;

    const dfs = (nodeId: string): boolean => {
      if (cycleDetected || brokenMissingId) return false;
      if (recursionStack.has(nodeId)) {
        cycleDetected = true;
        return false;
      }
      if (visitedGlobal.has(nodeId)) return true;

      const node = nodeMap.get(nodeId);
      if (!node) {
        brokenMissingId = nodeId;
        return false;
      }

      recursionStack.add(nodeId);
      visitedGlobal.add(nodeId);
      chain.push(node);

      const deps = node.dependencyIds ?? [];
      for (const depId of deps) {
        if (depId == null || typeof depId !== 'string' || !depId.trim()) {
          brokenMissingId = depId == null ? 'undefined_dependency' : String(depId);
          return false;
        }
        if (!nodeMap.has(depId)) {
          brokenMissingId = depId;
          return false;
        }
        const ok = dfs(depId);
        if (!ok && (cycleDetected || brokenMissingId)) return false;
      }

      recursionStack.delete(nodeId);
      return true;
    };

    dfs(leafId);

    if (cycleDetected) {
      return { status: 'BLOCKED', reason: 'CYCLE', details: `cycle detected traversing from ${leafId}` };
    }
    if (brokenMissingId) {
      return { status: 'BLOCKED', reason: 'BROKEN_LINK', missingId: brokenMissingId, details: `missing dependency ${brokenMissingId} while walking from ${leafId}` };
    }

    // chain currently DFS leaf-first; evaluationPoint is leafId per spec (any evaluation/index param must reflect actual)
    return {
      status: 'OK',
      chain: chain as readonly ProblemNode[],
      leafId,
      chainLength: chain.length,
      evaluationPoint: leafId,
    };
  }
}
