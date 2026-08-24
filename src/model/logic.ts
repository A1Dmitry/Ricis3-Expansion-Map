import { MapState, Axiom, ProblemNode, DependencyEdge, Proof, ProofStep } from './types';
import {
  buildStructuralProofLatex,
  isErrorProofLatex,
  repairAgentLatex,
} from './latexGuard';
import { auditProofContent, buildCanonicalRicisProofLatex, transformCauchyToRicisBridge } from './ricisCoreRules';
import { recolorEdgesForTargets } from './audit';
import { postJson } from './apiClient';

import { KNOWN_SINGULARITY_PROBLEMS } from './catalog';

export async function generateProof(node: ProblemNode, allAxioms: Axiom[]): Promise<Proof> {
  const tf = node.targetFunction || 'ResolveSingularity(' + node.title + ')';
  const cleanTf = tf.replace(/[\\_${}]/g, ' ').trim();
  const shortTf = cleanTf.length > 50 ? cleanTf.slice(0, 47) + '...' : cleanTf;

  const steps: ProofStep[] = [
    { phase: -1, name: 'L1 IDENTITY', action: 'Проверка сохранения типов и онтологической сущности', expression: `T(${shortTf}) = Monad` },
    { phase: 0.5, name: 'SEMANTIC INDEXING (SP4)', action: 'Индексирование нулей/бесконечностей родительским выражением', expression: `0_{(${shortTf})}` },
    { phase: 1, name: 'SAFETY CHECK (SP2)', action: 'Алгебраическое сокращение факторов ДО вычисления сингулярностей', expression: `SP2_Reduce(${shortTf})` },
    { phase: 2, name: 'RICIS TRANSFORMS (A6)', action: 'Косое произведение ортогональных векторов det(u,v) = F * G или 0_F * \\infty_F = F^2', expression: `det((F,0),(0,G)) = F \\cdot G` },
    { phase: 6, name: 'L1 VERIFICATION', action: 'Проверка инварианта без структурной амнезии за O(1)', expression: `Invariant(${node.id}) = Const` },
  ];

  const fallback = buildCanonicalRicisProofLatex(
    node.title,
    node.targetFunction,
    node.id
  );

  let latex = fallback;
  try {
    const api = await postJson<{ proofLatex?: string; proof?: string }>('/api/generateProof', {
      id: node.id,
      title: node.title,
      targetFunction: node.targetFunction,
      description: node.description,
      singularityHint: node.singularityHint,
      axioms: allAxioms,
    });
    if (api.ok && api.data) {
      const raw = (typeof api.data.proofLatex === 'string' && api.data.proofLatex)
        ? api.data.proofLatex
        : (typeof api.data.proof === 'string' && api.data.proof)
        ? api.data.proof
        : '';
      if (raw && !isErrorProofLatex(raw)) {
        const repaired = repairAgentLatex(raw);
        const transformed = transformCauchyToRicisBridge(repaired);
        const audit = auditProofContent(transformed);
        latex = audit.isValid ? transformed : fallback;
      }
    }
  } catch {
    // A provider failure leaves only the local diagnostic document. It must not
    // call legacy proof methods or claim authoritative Core/Lean evidence.
    latex = fallback;
  }

  const finalResult = 'Axiom Extracted: ' + node.id + '_resolved';
  return {
    nodeId: node.id,
    targetFunction: node.targetFunction,
    steps,
    finalResult,
    latex,
  };
}

export function expandFractal(map: MapState, solvedNodeId: string): MapState {
  const solved = map.nodes.find(n => n.id === solvedNodeId);
  if (!solved) return map;

  const existingIds = new Set(map.nodes.map(n => n.id));
  const alreadyDependent = new Set(solved.dependentIds);

  const catalogDependents = KNOWN_SINGULARITY_PROBLEMS.filter(
    p =>
      p.dependencyIds.includes(solvedNodeId) &&
      !existingIds.has(p.id) &&
      !alreadyDependent.has(p.id)
  );

  const sameZoneCandidates = KNOWN_SINGULARITY_PROBLEMS.filter(
    p =>
      !existingIds.has(p.id) &&
      !catalogDependents.some(c => c.id === p.id) &&
      p.zoneIds.some(z => solved.zoneIds.includes(z)) &&
      p.id !== solvedNodeId
  );

  const MAX_NEW = 2;
  const pickedFromCatalog: ProblemNode[] = [];

  for (const p of catalogDependents) {
    if (pickedFromCatalog.length >= MAX_NEW) break;
    pickedFromCatalog.push(p);
  }
  for (const p of sameZoneCandidates) {
    if (pickedFromCatalog.length >= MAX_NEW) break;
    pickedFromCatalog.push(p);
  }

  const newNodes: ProblemNode[] = [];

  for (let i = 0; i < pickedFromCatalog.length; i++) {
    const src = pickedFromCatalog[i];
    newNodes.push({
      ...src,
      economic: { ...src.economic },
      zoneIds: [...src.zoneIds],
      dependencyIds: Array.from(new Set([...(src.dependencyIds || []), solvedNodeId])),
      dependentIds: [],
      fractalDepth: solved.fractalDepth + 1,
      state: 'unresolved',
      type: src.type === 'core_singularity' ? 'scientific_task' : src.type,
    });
  }

  if (newNodes.length === 0) {
    return map;
  }

  const newEdges: DependencyEdge[] = newNodes.map(n => ({
    id: 'edge-' + solvedNodeId + '-' + n.id,
    fromId: solvedNodeId,
    toId: n.id,
    strength: 0.7,
    stateColor: 'red' as const,
    economicInfluence: 0.5,
  }));

  const childIds = newNodes.map(n => n.id);
  const nodesWithParent = map.nodes.map(n =>
    n.id === solvedNodeId
      ? { ...n, dependentIds: [...n.dependentIds, ...childIds] }
      : n
  );

  return {
    ...map,
    nodes: [...nodesWithParent, ...newNodes],
    edges: [...map.edges, ...newEdges],
  };
}

export async function solveNodeLogic(map: MapState, nodeId: string): Promise<MapState> {
  const node = map.nodes.find(n => n.id === nodeId);
  if (!node) return map;

  const existingProof = map.proofs[nodeId];
  let proof: Proof;
  let leanErrors: string[] = [];
  let leanWarnings: string[] = ['proof.core.state.localDiagnosticOnly'];

  if (existingProof && existingProof.latex) {
    proof = existingProof;
    const audit = auditProofContent(existingProof.latex);
    leanErrors = audit.isValid ? [] : audit.issues;
  } else {
    proof = await generateProof(node, map.axioms);
    const audit = auditProofContent(proof.latex);
    leanErrors = audit.isValid ? [] : audit.issues;
  }

  const updatedNode: ProblemNode = {
    ...node,
    // Only an AuthoritativeProofStatePolicy decision over a Core proof snapshot
    // can create `resolved`. This legacy/local route preserves prior resolution
    // but otherwise records diagnostics as partial evidence.
    state: node.state === 'resolved' ? 'resolved' : 'partial',
    leanErrors,
    leanWarnings,
  };

  const updatedNodes = map.nodes.map(n => {
    if (n.id === nodeId) return updatedNode;
    if (node.dependentIds.includes(n.id)) {
      return {
        ...n,
        economic: {
          ...n.economic,
          costUnresolved: n.economic.costUnresolved * 0.8,
          riskLoss: n.economic.riskLoss * 0.8,
        },
      };
    }
    return n;
  });

  const axiom: Axiom = {
    id: 'ax-' + node.id + '-' + Date.now(),
    sourceNodeId: node.id,
    formalStatement: 'Axiom(' + node.targetFunction + ')',
    usedByNodeIds: [],
  };

  const newProofs = { ...map.proofs, [nodeId]: proof };

  const tempMap: MapState = {
    ...map,
    nodes: updatedNodes,
    axioms: [...map.axioms, axiom],
    proofs: newProofs,
  };

  const updatedEdges = recolorEdgesForTargets(tempMap);

  const newMap: MapState = {
    ...tempMap,
    edges: updatedEdges,
  };

  return expandFractal(newMap, node.id);
}
