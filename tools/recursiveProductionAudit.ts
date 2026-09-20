import { initialMap } from '../src/model/initialMap';
import { DependencyGraphAuditor } from '../src/model/dependencyGraph';
import { auditProofContent } from '../src/model/ricisCoreRules';
import { sanitizeMap } from '../src/model/persistence';
import type { MapState, ProblemNode, Proof } from '../src/model/types';

type FindingSeverity = 'error' | 'warning';
interface Finding {
  severity: FindingSeverity;
  code: string;
  subject: string;
  detail: string;
}

interface AuditSummary {
  nodes: number;
  reachableNodes: number;
  orphanNodes: number;
  cyclicGroups: number;
  edges: number;
  proofs: number;
  proofNodes: number;
  validProofs: number;
  leanVerifiedProofs: number;
  findings: Finding[];
}

function nodeChildren(state: MapState, nodeId: string): string[] {
  const node = state.nodes.find(candidate => candidate.id === nodeId);
  const edgeChildren = state.edges.filter(edge => edge.fromId === nodeId).map(edge => edge.toId);
  const declaredChildren = node?.dependentIds ?? [];
  const inverseDependencyChildren = state.nodes
    .filter(candidate => candidate.dependencyIds.includes(nodeId))
    .map(candidate => candidate.id);
  return [...new Set([...edgeChildren, ...declaredChildren, ...inverseDependencyChildren])];
}

function walkReachable(state: MapState): Set<string> {
  const roots = state.nodes.filter(node =>
    node.type === 'core_singularity' || node.id === 'math-singularity' || node.id === 'core-agi-target',
  );
  const visited = new Set<string>();
  const walk = (nodeId: string): void => {
    if (visited.has(nodeId) || !state.nodes.some(node => node.id === nodeId)) return;
    visited.add(nodeId);
    for (const childId of nodeChildren(state, nodeId)) walk(childId);
  };
  for (const root of roots) walk(root.id);
  return visited;
}

function checkProof(node: ProblemNode, proof: Proof | undefined, findings: Finding[]): boolean {
  if (!proof) {
    if (node.state === 'resolved') {
      findings.push({ severity: 'error', code: 'RESOLVED_WITHOUT_PROOF', subject: node.id, detail: 'Resolved node has no proof record.' });
    }
    return false;
  }

  if (proof.nodeId !== node.id) {
    findings.push({ severity: 'error', code: 'PROOF_NODE_MISMATCH', subject: node.id, detail: `Proof belongs to ${proof.nodeId}.` });
  }
  if (proof.targetFunction !== node.targetFunction) {
    findings.push({ severity: 'warning', code: 'PROOF_TARGET_MISMATCH', subject: node.id, detail: 'Proof target differs from current node target.' });
  }
  if (proof.steps.length === 0 || proof.finalResult.trim().length === 0 || proof.latex.trim().length === 0) {
    findings.push({ severity: 'error', code: 'INCOMPLETE_PROOF_RECORD', subject: node.id, detail: 'Proof has empty steps, finalResult, or LaTeX.' });
  }
  for (let index = 0; index < proof.steps.length; index++) {
    const step = proof.steps[index]!;
    if (step.name.trim().length === 0 || step.action.trim().length === 0 || step.expression.trim().length === 0) {
      findings.push({ severity: 'error', code: 'INCOMPLETE_PROOF_STEP', subject: `${node.id}#${index + 1}`, detail: 'Proof step contains an empty field.' });
    }
  }

  const content = auditProofContent(proof.latex);
  if (!content.isValid) {
    findings.push({
      severity: node.state === 'resolved' ? 'error' : 'warning',
      code: 'PROOF_CONTENT_REJECTED',
      subject: node.id,
      detail: `score=${content.score}; issues=${content.issues.join(' | ')}`,
    });
  }
  if (proof.externalLean?.trustStatus === 'LEAN_VERIFIED') {
    if (!proof.externalLean.kernelEvidence) {
      findings.push({ severity: 'error', code: 'LEAN_STATUS_WITHOUT_EVIDENCE', subject: node.id, detail: 'LEAN_VERIFIED has no kernel evidence.' });
    }
  }
  return content.isValid;
}

function run(state: MapState): AuditSummary {
  const findings: Finding[] = [];
  const nodeIds = new Set<string>();
  const zoneIds = new Set(state.zones.map(zone => zone.id));

  for (const node of state.nodes) {
    if (!node.id.trim() || nodeIds.has(node.id)) {
      findings.push({ severity: 'error', code: 'DUPLICATE_OR_EMPTY_NODE_ID', subject: node.id || '<empty>', detail: 'Node IDs must be unique and non-empty.' });
    }
    nodeIds.add(node.id);
    if (!node.title.trim() || !node.description.trim() || !node.targetFunction.trim()) {
      findings.push({ severity: 'error', code: 'INCOMPLETE_NODE', subject: node.id, detail: 'title, description and targetFunction are required.' });
    }
    if (!Number.isInteger(node.fractalDepth) || node.fractalDepth < 0) {
      findings.push({ severity: 'error', code: 'INVALID_FRACTAL_DEPTH', subject: node.id, detail: `fractalDepth=${node.fractalDepth}` });
    }
    for (const zoneId of node.zoneIds) {
      if (!zoneIds.has(zoneId)) findings.push({ severity: 'error', code: 'MISSING_ZONE_REFERENCE', subject: node.id, detail: `Unknown zone ${zoneId}.` });
    }
    for (const referenceId of [...node.dependencyIds, ...node.dependentIds]) {
      if (!nodeIds.has(referenceId) && !state.nodes.some(candidate => candidate.id === referenceId)) {
        findings.push({ severity: 'error', code: 'MISSING_NODE_REFERENCE', subject: node.id, detail: `Unknown node ${referenceId}.` });
      }
    }
  }

  for (const edge of state.edges) {
    if (!nodeIds.has(edge.fromId) || !nodeIds.has(edge.toId)) {
      findings.push({ severity: 'error', code: 'BROKEN_EDGE_REFERENCE', subject: edge.id, detail: `${edge.fromId} -> ${edge.toId}` });
    }
  }
  for (const zone of state.zones) {
    for (const nodeId of zone.nodeIds) {
      if (!nodeIds.has(nodeId)) findings.push({ severity: 'error', code: 'BROKEN_ZONE_NODE_REFERENCE', subject: zone.id, detail: `Unknown node ${nodeId}.` });
    }
  }
  for (const axiom of state.axioms) {
    if (!nodeIds.has(axiom.sourceNodeId)) findings.push({ severity: 'error', code: 'BROKEN_AXIOM_SOURCE', subject: axiom.id, detail: `Unknown source ${axiom.sourceNodeId}.` });
    for (const nodeId of axiom.usedByNodeIds) {
      if (!nodeIds.has(nodeId)) findings.push({ severity: 'error', code: 'BROKEN_AXIOM_USAGE', subject: axiom.id, detail: `Unknown user ${nodeId}.` });
    }
  }

  const reachable = walkReachable(state);
  const graphReport = new DependencyGraphAuditor().audit(state);
  for (const orphan of graphReport.orphans) {
    findings.push({ severity: 'warning', code: 'ORPHAN_NODE', subject: orphan.id, detail: 'Node is outside recursive root closure.' });
  }
  for (const group of graphReport.cyclicGroups) {
    findings.push({ severity: 'warning', code: 'CYCLIC_GROUP', subject: group.map(node => node.id).join(','), detail: 'Cycle detected in orphan closure.' });
  }

  const proofIds = new Set(Object.keys(state.proofs));
  for (const proofId of proofIds) {
    if (!nodeIds.has(proofId)) findings.push({ severity: 'error', code: 'ORPHAN_PROOF', subject: proofId, detail: 'Proof key has no corresponding node.' });
  }
  let validProofs = 0;
  let leanVerifiedProofs = 0;
  for (const node of state.nodes) {
    if (checkProof(node, state.proofs[node.id], findings)) validProofs++;
    if (state.proofs[node.id]?.externalLean?.trustStatus === 'LEAN_VERIFIED') leanVerifiedProofs++;
  }

  return {
    nodes: state.nodes.length,
    reachableNodes: reachable.size,
    orphanNodes: graphReport.orphans.length,
    cyclicGroups: graphReport.cyclicGroups.length,
    edges: state.edges.length,
    proofs: proofIds.size,
    proofNodes: state.nodes.filter(node => Boolean(state.proofs[node.id])).length,
    validProofs,
    leanVerifiedProofs,
    findings,
  };
}

const sourceSummary = run(initialMap);
const sanitizedSummary = run(sanitizeMap(initialMap));
const sanitizedResolved = sanitizeMap(initialMap).nodes.filter(node => node.state === 'resolved').length;
console.log(JSON.stringify({
  source: sourceSummary,
  sanitized: sanitizedSummary,
  sanitizedResolved,
}, null, 2));
if (sanitizedSummary.findings.some(finding => finding.severity === 'error')) process.exitCode = 1;
