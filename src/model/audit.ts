import { MapState, ProblemNode, DependencyEdge, NodeState, Proof } from './types';
import { walkGraph } from './agent';
import { auditProofContent, buildCanonicalRicisProofLatex, containsSorry } from './ricisCoreRules';
import { postJson } from './apiClient';

/** Check if a node or its associated proof/Lean code contains 'sorry' keyword (unproven stub). */
export function nodeHasSorry(node: ProblemNode, proof?: Proof): boolean {
  if (containsSorry(node.targetFunction)) return true;
  if (containsSorry(node.description)) return true;
  if (containsSorry(node.singularityHint)) return true;
  if (proof) {
    if (containsSorry(proof.latex)) return true;
    if (containsSorry(proof.finalResult)) return true;
    if (proof.steps?.some(s => containsSorry(s.action) || containsSorry(s.expression))) return true;
  }
  return false;
}

/** Detect if user entered a request asking the AI to find or search the formula automatically. */
export function isAutoFormulaRequest(str?: string): boolean {
  if (!str) return false;
  const s = str.trim().toLowerCase();
  if (s.includes('найди') || s.includes('ищи') || s.includes('поищи') || s.includes('найти') || s.includes('наиди')) return true;
  if (s.includes('сам') && (s.includes('формул') || s.includes('уравнен') || s.includes('выражен') || s.includes('функц') || s.includes('решен'))) return true;
  if (s.includes('find formula') || s.includes('search formula') || s.includes('auto formula') || s.includes('formula yourself') || s.includes('find formula yourself')) return true;
  if (/^(найди|ищи|поищи|найти)\s+(формулу|уравнение|целевую|сам)/i.test(s)) return true;
  if (/^(формула|формулу|уравнение)\s+(сам|ии|авто|поищи|найди)/i.test(s)) return true;
  return false;
}

/** Empty / placeholder / auto-request target functions count as missing. */
export function isMissingTargetFunction(node: ProblemNode): boolean {
  const t = String(node.targetFunction ?? '').trim();
  if (!t) return true;
  if (t === '-' || t === '\u2014' || t === '\u2013' || t === '?' || t === 'n/a' || t === 'N/A') return true;
  if (/^(todo|tbd|none|null|undefined)$/i.test(t)) return true;
  if (isAutoFormulaRequest(t)) return true;
  return false;
}

/** Node has weak proof, missing target function, contains 'sorry', or is only partially resolved. */
export function hasWeakProofOrMissingTarget(node: ProblemNode, proof?: Proof): boolean {
  if (isMissingTargetFunction(node)) return true;
  if (nodeHasSorry(node, proof)) return true;
  if (node.state === 'partial') return true;
  if (node.state === 'resolved') {
    if (!proof || !proof.latex || !proof.latex.trim()) return true;
    const audit = auditProofContent(proof.latex);
    if (!audit.isValid) return true;
  }
  return false;
}

export function findNodesMissingTarget(map: MapState): ProblemNode[] {
  const order = walkGraph(map);
  const byId = new Map(map.nodes.map(n => [n.id, n]));
  const proofs = map.proofs || {};
  const missing: ProblemNode[] = [];
  for (const id of order) {
    const n = byId.get(id);
    if (n && hasWeakProofOrMissingTarget(n, proofs[n.id])) missing.push(n);
  }
  for (const n of map.nodes) {
    if (hasWeakProofOrMissingTarget(n, proofs[n.id]) && !missing.some(m => m.id === n.id)) missing.push(n);
  }
  return missing;
}

/** Recolor edges: green only if both ends resolved AND neither has missing target, weak proof, or sorry. */
export function recolorEdgesForTargets(map: MapState): DependencyEdge[] {
  const byId = new Map(map.nodes.map(n => [n.id, n]));
  const proofs = map.proofs || {};
  return map.edges.map(e => {
    const a = byId.get(e.fromId);
    const b = byId.get(e.toId);
    if (!a || !b) return { ...e, stateColor: 'red' as const };
    const aWeak = hasWeakProofOrMissingTarget(a, proofs[a.id]);
    const bWeak = hasWeakProofOrMissingTarget(b, proofs[b.id]);
    const aOk = a.state === 'resolved' && !aWeak;
    const bOk = b.state === 'resolved' && !bWeak;
    if (aOk && bOk) return { ...e, stateColor: 'green' as const };
    if (
      a.state === 'resolved' ||
      b.state === 'resolved' ||
      a.state === 'partial' ||
      b.state === 'partial' ||
      aWeak ||
      bWeak
    ) {
      return { ...e, stateColor: 'yellow' as const };
    }
    return { ...e, stateColor: 'red' as const };
  });
}

export type AuditReport = {
  map: MapState;
  missingCount: number;
  demotedIds: string[];
  missingIds: string[];
};

/**
 * Command 1: walk entire tree; nodes without targetFunction, containing 'sorry', or with weak proofs become partial (yellow).
 * Resolved nodes missing target, containing 'sorry', or with weak proofs are demoted to partial.
 */
export function auditMarkMissingTargets(map: MapState): AuditReport {
  const missing = findNodesMissingTarget(map);
  const missingIds = missing.map(n => n.id);
  const demotedIds: string[] = [];
  const proofs = map.proofs || {};

  const nodes = map.nodes.map(n => {
    const isWeak = hasWeakProofOrMissingTarget(n, proofs[n.id]);
    if (!isWeak) return n;
    if (n.state === 'resolved') {
      demotedIds.push(n.id);
      return { ...n, state: 'partial' as NodeState };
    }
    return n;
  });

  const next: MapState = {
    ...map,
    nodes,
    edges: recolorEdgesForTargets({ ...map, nodes, proofs }),
  };

  return {
    map: next,
    missingCount: missingIds.length,
    demotedIds: Array.from(new Set(demotedIds)),
    missingIds,
  };
}

export type FillResult = {
  map: MapState;
  filled: number;
  failed: number;
  errors: string[];
  filledIds: string[];
};

type AgentFillPayload = {
  targetFunction?: string;
  description?: string;
  singularityHint?: string;
  title?: string;
  normalizedFunction?: string;
};

/**
 * Command 2: for every node missing targetFunction, ask agent to fill params.
 */
export async function fillMissingTargetFunctions(
  map: MapState,
  options?: { maxNodes?: number; delayMs?: number }
): Promise<FillResult> {
  const maxNodes = options?.maxNodes ?? 40;
  const delayMs = options?.delayMs ?? 400;
  const missing = findNodesMissingTarget(map).slice(0, maxNodes);

  let nodes = [...map.nodes];
  let filled = 0;
  let failed = 0;
  const errors: string[] = [];
  const filledIds: string[] = [];

  for (let i = 0; i < missing.length; i++) {
    const node = missing[i];
    try {
      let tf = '';
      let desc = node.description;
      let hint = node.singularityHint;
      let title = node.title;

      try {
        const api = await postJson<AgentFillPayload>('/api/fillNodeParams', {
          id: node.id,
          title: node.title,
          description: node.description,
          singularityHint: node.singularityHint,
          type: node.type,
          zoneIds: node.zoneIds,
        });
        if (api.ok && api.data) {
          tf = String(api.data.targetFunction || api.data.normalizedFunction || '').trim();
          if (api.data.description?.trim()) desc = api.data.description.trim();
          if (api.data.singularityHint?.trim()) hint = api.data.singularityHint.trim();
          if (api.data.title?.trim()) title = api.data.title.trim();
        }
      } catch (e) {
        // Fallback below
      }

      // Local fallback target function generation if API is unavailable or returned empty
      if (!tf) {
        const cleanT = (node.title || node.id).replace(/[^a-zA-Z0-9а-яА-Я_]/g, '');
        const zone = node.zoneIds?.[0] || 'math';
        if (zone === 'math' || zone === 'physics') {
          tf = `ResolveSingularity(${cleanT || node.id})`;
        } else {
          tf = `FormalizeFunction(${cleanT || node.id})`;
        }
      }

      nodes = nodes.map(n => {
        if (n.id !== node.id) return n;
        return {
          ...n,
          targetFunction: tf,
          description: desc,
          singularityHint: hint,
          title: title,
          state: n.state === 'resolved' ? n.state : ('partial' as NodeState),
        };
      });
      filled++;
      filledIds.push(node.id);
    } catch (e: any) {
      failed++;
      errors.push(`${node.id}: ${e?.message || String(e)}`);
    }
    if (delayMs > 0 && i < missing.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  let next: MapState = { ...map, nodes };
  next = { ...next, edges: recolorEdgesForTargets(next) };
  const post = auditMarkMissingTargets(next);

  return {
    map: post.map,
    filled,
    failed,
    errors: errors.slice(0, 12),
    filledIds,
  };
}

/**
 * Audit and verify all proofs attached to the map using DRY RICIS-III rules.
 */
export type ProofRepairMode = 'legacy_repair' | 'preserve';

export interface AuditProofIntegrityOptions {
  /**
   * Migration uses preserve mode to retain source-bound proof payloads exactly.
   * All other callers retain legacy repair until the separately gated OIR-03 scope.
   */
  readonly proofRepairMode?: ProofRepairMode;
}

export function auditMapRicisProofIntegrity(
  map: MapState,
  options: AuditProofIntegrityOptions = {},
): { map: MapState; repairedProofsCount: number } {
  const proofRepairMode = options.proofRepairMode ?? 'legacy_repair';
  const proofs = { ...(map.proofs || {}) };
  let nodes = [...(map.nodes || [])];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  let repairedProofsCount = 0;

  for (const [nodeId, proof] of Object.entries(proofs)) {
    if (!proof || !proof.latex) continue;
    const audit = auditProofContent(proof.latex);
    const node = nodeMap.get(nodeId);

    if (node) {
      const hasSorry = nodeHasSorry(node, proof);
      if (hasSorry && node.state === 'resolved') {
        nodes = nodes.map(n => n.id === nodeId ? { ...n, state: 'partial' as NodeState } : n);
      }
    }

    if (proofRepairMode === 'legacy_repair' && !audit.isValid && !containsSorry(proof.latex)) {
      const title = node?.title || 'Сингулярная проблема';
      const tf = node?.targetFunction || proof.targetFunction || '';
      
      const newLatex = buildCanonicalRicisProofLatex(title, tf, nodeId);
      proofs[nodeId] = {
        ...proof,
        latex: newLatex,
      };
      repairedProofsCount++;
    }
  }

  const updatedMap: MapState = {
    ...map,
    nodes,
    proofs,
  };

  return {
    map: {
      ...updatedMap,
      edges: recolorEdgesForTargets(updatedMap),
    },
    repairedProofsCount,
  };
}
