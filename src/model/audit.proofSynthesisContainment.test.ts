import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { auditMapRicisProofIntegrity, auditMarkMissingTargets } from './audit';
import type { MapState, Proof, ProblemNode } from './types';

const BASELINE = '9afd3ff097e05e25f8c7b219300daa9bbe1cbf29';
const protectedPaths = [
  'src/model/logic.ts',
  'src/model/legacyProofDiagnostic.ts',
  'src/model/authoritativeProofStatePolicy.ts',
  'src/services/ricisCore/RicisWasmBridge.ts',
  'src/model/apiClient.ts',
  'src/model/ricisCoreRules.ts',
] as const;

function node(overrides: Partial<ProblemNode> = {}): ProblemNode {
  return {
    id: 'oir03-node',
    title: 'Owner-authorized P = NP source identity',
    description: 'Existing user/source-bound proof payload.',
    state: 'partial',
    type: 'scientific_task',
    targetFunction: 'ResolveComplexity(PNP)',
    zoneIds: ['math'],
    dependencyIds: [],
    dependentIds: [],
    fractalDepth: 0,
    economic: { costUnresolved: 1, costToSolve: 1, marketGain: 1, riskLoss: 1 },
    ...overrides,
  };
}

function proof(overrides: Partial<Proof> = {}): Proof {
  return {
    nodeId: 'oir03-node',
    targetFunction: 'ResolveComplexity(PNP)',
    steps: [{ phase: 1, name: 'source-step', action: 'preserve', expression: 'X = X' }],
    finalResult: 'source-final-result',
    latex: 'user-source without a local template',
    externalLean: {
      sourceHash: 'sha256:user-source',
      submittedAt: '2026-08-25T00:00:00.000Z',
      sourceLocked: true,
      trustStatus: 'REQUIRES_CORE_LEAN',
    },
    ...overrides,
  };
}

function mapWith(entries: Record<string, Proof>, nodeOverrides: Partial<ProblemNode> = {}): MapState {
  return {
    nodes: [node(nodeOverrides)],
    edges: [],
    zones: [],
    axioms: [{ id: 'ax-source', sourceNodeId: 'oir03-node', formalStatement: 'X = X', usedByNodeIds: [] }],
    proofs: entries,
    agentLogs: [],
  };
}

function auditSource(): string {
  return readFileSync('src/model/audit.ts', 'utf8');
}

function integrityBody(): string {
  const source = auditSource();
  const offset = source.indexOf('export function auditMapRicisProofIntegrity');
  expect(offset).toBeGreaterThanOrEqual(0);
  return source.slice(offset);
}

function runInvalid(options?: { proofRepairMode?: 'legacy_repair' | 'preserve' }) {
  const source = proof();
  const map = mapWith({ [source.nodeId]: source });
  return { source, map, result: auditMapRicisProofIntegrity(map, options) };
}

describe('OIR-03 — audit proof-synthesis containment', () => {
  it('OIR03-QA-01: preserves exact invalid Proof identity under the default legacy label', () => {
    const { source, result } = runInvalid();
    expect(result.map.proofs[source.nodeId]).toBe(source);
  });

  it('OIR03-QA-02: preserves invalid Proof LaTeX byte-for-byte', () => {
    const { source, result } = runInvalid();
    expect(result.map.proofs[source.nodeId]?.latex).toBe(source.latex);
  });

  it('OIR03-QA-03: preserves nested invalid Proof steps identity', () => {
    const { source, result } = runInvalid();
    expect(result.map.proofs[source.nodeId]?.steps).toBe(source.steps);
  });

  it('OIR03-QA-04: preserves nested externalLean provenance identity', () => {
    const { source, result } = runInvalid();
    expect(result.map.proofs[source.nodeId]?.externalLean).toBe(source.externalLean);
  });

  it('OIR03-QA-05: preserves a valid existing Proof identity', () => {
    const source = proof({ latex: 'RICIS A6: 0_F * \\infty_G = F*G https://doi.org/10.5281/zenodo.21836220' });
    const result = auditMapRicisProofIntegrity(mapWith({ [source.nodeId]: source }));
    expect(result.map.proofs[source.nodeId]).toBe(source);
  });

  it('OIR03-QA-06: preserves a source containing sorry without repair', () => {
    const source = proof({ latex: 'user source with sorry retained exactly' });
    const result = auditMapRicisProofIntegrity(mapWith({ [source.nodeId]: source }));
    expect(result.map.proofs[source.nodeId]).toBe(source);
  });

  it('OIR03-QA-07: preserves an empty-LaTeX source without synthesis', () => {
    const source = proof({ latex: '' });
    const result = auditMapRicisProofIntegrity(mapWith({ [source.nodeId]: source }));
    expect(result.map.proofs[source.nodeId]).toBe(source);
  });

  it('OIR03-QA-08: preserves every Proof identity when one entry is invalid', () => {
    const invalid = proof();
    const valid = proof({ nodeId: 'oir03-valid', latex: 'RICIS A6: 0_F * \\infty_G = F*G https://doi.org/10.5281/zenodo.21836220' });
    const result = auditMapRicisProofIntegrity(mapWith({ [invalid.nodeId]: invalid, [valid.nodeId]: valid }));
    expect(result.map.proofs[invalid.nodeId]).toBe(invalid);
    expect(result.map.proofs[valid.nodeId]).toBe(valid);
  });

  it('OIR03-QA-09: preserves invalid source for the legacy_repair compatibility option', () => {
    const { source, result } = runInvalid({ proofRepairMode: 'legacy_repair' });
    expect(result.map.proofs[source.nodeId]).toBe(source);
  });

  it('OIR03-QA-10: preserves invalid source for the preserve option', () => {
    const { source, result } = runInvalid({ proofRepairMode: 'preserve' });
    expect(result.map.proofs[source.nodeId]).toBe(source);
  });

  it('OIR03-QA-11: makes omitted options source-preserving', () => {
    const { source, result } = runInvalid();
    expect(result.map.proofs[source.nodeId]).toBe(source);
  });

  it('OIR03-QA-12: reports zero repaired proofs for an invalid source', () => {
    const { result } = runInvalid();
    expect(result.repairedProofsCount).toBe(0);
  });

  it('OIR03-QA-13: preserves P=NP-related source without selecting a template', () => {
    const source = proof({ latex: 'owner-authorized P = NP source bytes remain immutable' });
    const result = auditMapRicisProofIntegrity(mapWith({ [source.nodeId]: source }));
    expect(result.map.proofs[source.nodeId]).toBe(source);
    expect(result.map.proofs[source.nodeId]?.latex).not.toContain('HYPOTHESIS');
  });

  it('OIR03-QA-14: never introduces a hypothesis label or classical reframe into user source', () => {
    const source = proof({ latex: 'P = NP owner-authorized source remains exact' });
    const result = auditMapRicisProofIntegrity(mapWith({ [source.nodeId]: source }));
    expect(result.map.proofs[source.nodeId]?.latex).toBe(source.latex);
    expect(result.map.proofs[source.nodeId]?.latex).not.toMatch(/HYPOTHESIS|classical/i);
  });

  it('OIR03-QA-15: does not substitute any invalid source with another entry template', () => {
    const first = proof({ nodeId: 'oir03-first', latex: 'first source' });
    const second = proof({ nodeId: 'oir03-second', latex: 'second source' });
    const result = auditMapRicisProofIntegrity(mapWith({ [first.nodeId]: first, [second.nodeId]: second }));
    expect(result.map.proofs[first.nodeId]).toBe(first);
    expect(result.map.proofs[second.nodeId]).toBe(second);
  });

  it('OIR03-QA-16: does not change node workflow state', () => {
    const { map, result } = runInvalid();
    expect(result.map.nodes[0]?.state).toBe(map.nodes[0]?.state);
  });

  it('OIR03-QA-17: retains the exact axioms array identity', () => {
    const { map, result } = runInvalid();
    expect(result.map.axioms).toBe(map.axioms);
  });

  it('OIR03-QA-18: retains proof keys without creation or deletion', () => {
    const { map, result } = runInvalid();
    expect(Object.keys(result.map.proofs)).toEqual(Object.keys(map.proofs));
  });

  it('OIR03-QA-19: keeps stable empty-edge recoloring semantics', () => {
    const { map, result } = runInvalid();
    expect(result.map.edges).toEqual(map.edges);
  });

  it('OIR03-QA-20: leaves audit observations non-demoting', () => {
    const { map } = runInvalid();
    const observation = auditMarkMissingTargets(map);
    expect(observation.demotedIds).toEqual([]);
    expect(observation.map.nodes[0]?.state).toBe('partial');
  });

  it('OIR03-QA-21: removes canonical builder import from audit source', () => {
    expect(auditSource()).not.toMatch(/import\s*\{[^}]*\bbuildCanonicalRicisProofLatex\b[^}]*\}\s*from/);
  });

  it('OIR03-QA-22: removes canonical builder call and newLatex template writer', () => {
    const body = integrityBody();
    expect(body).not.toMatch(/\bbuildCanonicalRicisProofLatex\s*\(/);
    expect(body).not.toMatch(/\bnewLatex\b/);
  });

  it('OIR03-QA-23: avoids direct proof LaTeX assignment in the containment body', () => {
    expect(integrityBody()).not.toMatch(/proofs\s*\[\s*nodeId\s*\]\s*=\s*\{[\s\S]*?latex\s*:/);
  });

  it('OIR03-QA-24: contains no legacy generator or transport call in the containment body', () => {
    expect(integrityBody()).not.toMatch(/\b(logic|legacyProofDiagnostic|apiClient|postJson|fetch|provider|prompt)\b/i);
  });

  it('OIR03-QA-25: writes no workflow, trust, source or axiom field in the containment body', () => {
    expect(integrityBody()).not.toMatch(/\b(state|trustStatus|sourceHash|formalStatement|axioms)\s*:/);
  });

  it('OIR03-QA-26: invokes no Core, gateway or Lean toolchain in the containment body', () => {
    expect(integrityBody()).not.toMatch(/\b(RicisCore|Wasm|Gateway|lean|lake|elan)\b/i);
  });

  it('OIR03-QA-27: has no browser, storage, timer or external action in the containment body', () => {
    expect(integrityBody()).not.toMatch(/\b(window|document|localStorage|sessionStorage|indexedDB|setTimeout|XMLHttpRequest|WebSocket)\b/);
  });

  it('OIR03-QA-28: makes no Lean, Core or authoritative proof claim in the containment body', () => {
    expect(integrityBody()).not.toMatch(/LeanVerified|CoreVerified|authoritative|certified|verified proof/i);
  });

  it('OIR03-QA-29: keeps logic.ts at published baseline bytes', () => {
    const path = protectedPaths[0];
    expect(readFileSync(path, 'utf8')).toBe(execFileSync('git', ['show', `${BASELINE}:${path}`], { encoding: 'utf8' }));
  });

  it('OIR03-QA-30: keeps legacyProofDiagnostic.ts at published baseline bytes', () => {
    const path = protectedPaths[1];
    expect(readFileSync(path, 'utf8')).toBe(execFileSync('git', ['show', `${BASELINE}:${path}`], { encoding: 'utf8' }));
  });

  it('OIR03-QA-31: keeps authoritative state policy at published baseline bytes', () => {
    const path = protectedPaths[2];
    expect(readFileSync(path, 'utf8')).toBe(execFileSync('git', ['show', `${BASELINE}:${path}`], { encoding: 'utf8' }));
  });

  it('OIR03-QA-32: keeps Core bridge at published baseline bytes', () => {
    const path = protectedPaths[3];
    expect(readFileSync(path, 'utf8')).toBe(execFileSync('git', ['show', `${BASELINE}:${path}`], { encoding: 'utf8' }));
  });

  it('OIR03-QA-33: keeps API client at published baseline bytes', () => {
    const path = protectedPaths[4];
    expect(readFileSync(path, 'utf8')).toBe(execFileSync('git', ['show', `${BASELINE}:${path}`], { encoding: 'utf8' }));
  });

  it('OIR03-QA-34: keeps immutable RICIS core rules at published baseline bytes', () => {
    const path = protectedPaths[5];
    expect(readFileSync(path, 'utf8')).toBe(execFileSync('git', ['show', `${BASELINE}:${path}`], { encoding: 'utf8' }));
  });

  it('OIR03-QA-35: keeps audit API default and explicit option calls type-compatible', () => {
    const { map } = runInvalid();
    expect(auditMapRicisProofIntegrity(map).map.proofs).toBeDefined();
    expect(auditMapRicisProofIntegrity(map, { proofRepairMode: 'legacy_repair' }).map.proofs).toBeDefined();
    expect(auditMapRicisProofIntegrity(map, { proofRepairMode: 'preserve' }).map.proofs).toBeDefined();
  });

  it('OIR03-QA-36: allows only reviewed candidate paths or a clean committed integration state', () => {
    const status = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { encoding: 'utf8' }).split('\n').filter(Boolean);
    const allowed = new Set([
      ' M CITATION.cff',
      ' M README.md',
      ' M docs/04-history/TASK_LOG.md',
      ' M docs/05-evidence/architecture/structural-hash-report.md',
      ' M docs/05-evidence/architecture/telegram-tokenpool-remediation-2026-08-18.md',
      ' M docs/05-evidence/proofs/lean-boundary-audit-2026-08-18.md',
      ' M docs/05-evidence/proofs/jacobian-status-research-2026-08-17.md',
      ' M docs/05-evidence/proofs/jacobian-next-step-2026-08-17.md',
      ' M index.html',
      ' M package-lock.json',
      ' M package.json',
      ' M src/model/audit.ts',
      ' M src/model/migrationAudit.provenance.test.ts',
      ' M src/version.ts',
      ' M src/model/audit.proofSynthesisContainment.test.ts',
      ' M src/calculatorExplorer/calculatorExplorer.topology.test.ts',
      ' M src/model/legacyProofDiagnostic.topology.test.ts',
      ' M src/monolithGuidedCaseTrail/monolithGuidedCaseTrail.topology.test.ts',
      ' M src/calculatorGraphDescriptor/calculatorGraphDescriptor.seed.ts',
      ' M src/ui/Map3D.tsx',
      ' M src/ui/Map3D.communityRewardsStatus.test.ts',
      ' M src/hooks/useMobileLayout.test.ts',
      ' M .github/workflows/deploy-pages.yml',
      ' M src/ui/NodeCardDetails.tsx',
      ' M src/ui/EditNodeModal.tsx',
      '?? src/monolithGuidedCaseTrail/monolithGuidedCaseTrail.domain.ts',
      '?? src/monolithGuidedCaseTrail/monolithGuidedCaseTrail.domain.test.ts',
      '?? src/monolithGuidedCaseTrail/monolithGuidedCaseTrail.topology.test.ts',
      '?? src/ui/MonolithGuidedCaseTrail.tsx',
      '?? src/ui/MonolithGuidedCaseTrail.test.tsx',
      '?? src/calculatorExplorer/calculatorExplorer.domain.test.ts',
      '?? src/calculatorExplorer/calculatorExplorer.domain.ts',
      '?? src/calculatorExplorer/calculatorExplorer.topology.test.ts',
      '?? src/ui/CalculatorExplorer.test.tsx',
      '?? src/ui/CalculatorExplorer.tsx',
      '?? src/monolithGuidedCaseTrail/monolithGuidedCaseTrail.domain.test.ts',
      '?? src/monolithGuidedCaseTrail/monolithGuidedCaseTrail.topology.test.ts',
      '?? src/ui/MonolithGuidedCaseTrail.test.tsx',
      '?? src/model/audit.proofSynthesisContainment.test.ts',
      '?? src/communityReadiness/communityReadiness.domain.test.ts',
      '?? src/communityReadiness/communityReadiness.domain.ts',
      '?? src/ui/CommunityReadinessNotice.test.tsx',
      '?? src/ui/CommunityReadinessNotice.tsx',
      '?? src/ui/Map3D.communityReadiness.test.ts',
      '?? src/leanPassportSession/leanPassportSession.domain.test.ts',
      '?? src/ui/LeanPassportSessionDialog.test.tsx',
      '?? src/ui/EditNodeModal.passportSession.test.tsx',
      '?? src/leanPassportSession/leanPassportSession.domain.ts',
      '?? src/ui/LeanPassportSessionDialog.tsx',
      '?? docs/01-architecture/passport/RICIS-LEAN-PASSPORT-ROUTE-B1-01_STEP2_ARCHITECTURE.md',
      '?? docs/02-sprints/passport/RICIS-LEAN-PASSPORT-01_STEP1_CURRENT_BUSINESS_SPEC.md',
      '?? docs/02-sprints/passport/RICIS-LEAN-PASSPORT-ROUTE-B-01_STEP1_BUSINESS_SPEC.md',
      '?? docs/02-sprints/passport/RICIS-LEAN-PASSPORT-ROUTE-B1-01_STEP3_QA_SPEC.md',
      '?? docs/02-sprints/passport/RICIS-LEAN-PASSPORT-ROUTE-B2-DATA-LIFECYCLE-01_STEP1_BUSINESS_SPEC.md',
      '?? docs/02-sprints/passport/RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01_STEP1_BUSINESS_SPEC.md',
      '?? docs/05-evidence/architecture/passport-governance/GIT_BRANCH_AUDIT_2026-08-26.md',
      '?? docs/05-evidence/architecture/passport-governance/RICIS-LEAN-PASSPORT-ROUTE-B1-01_G4_RELEASE_REVIEW.md',
      '?? docs/05-evidence/architecture/passport-governance/RICIS_QA_SCORECARD.md',
      '?? docs/05-evidence/architecture/passport-governance/RICIS_TASK_REGISTER.md',
      ' M docs/05-evidence/architecture/passport-governance/RICIS_TASK_REGISTER.md',
      '?? docs/01-architecture/passport/RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01_STEP2_ARCHITECTURE.md',
      '?? src/ui/LeanPassportSessionDialog.nestedModal.test.tsx',
      '?? src/leanPassportProjection/leanPassportProjection.sourceRedaction.test.ts',
      ' M src/ui/LeanPassportSessionDialog.tsx',
      ' M src/leanPassportProjection/leanPassportProjection.domain.ts',
      '?? src/model/ricisMdLeanCorrection.documentation.test.ts',
      '?? src/passportAccountOwnership/passportAccountOwnership.domain.ts',
      '?? src/passportAccountOwnership/passportAccountOwnership.application.ts',
      '?? src/passportAccountOwnership/passportAccountOwnership.domain.test.ts',
      '?? src/passportAccountOwnership/passportAccountOwnership.application.test.ts',
      '?? src/passportAccountOwnership/passportAccountOwnership.topology.test.ts',
      '?? src/passportAccountOwnership/passportAccountOwnership.tenantIsolation.test.ts',
      '?? docs/01-architecture/passport/RICIS-LEAN-PASSPORT-ROUTE-B2-DATA-LIFECYCLE-01_STEP2_ARCHITECTURE.md',
      ' M src/model/mapPatchIngestion.test.ts',
      ' M src/model/mapPatchIngestion.ts',
      ' M src/model/mapPatchIngestion.types.ts',
      ' M src/ui/MapPatchImportModal.tsx',
      ' M src/model/audit.proofSynthesisContainment.test.ts',
      '?? docs/01-architecture/SPRINT_P1_CATALOG_NAVIGATION_CORE_STATUS_STEP2_ARCHITECTURE.md',
      '?? docs/02-sprints/SPRINT_P1_CATALOG_NAVIGATION_CORE_STATUS_STEP1_BUSINESS_SPEC.md',
      '?? docs/03-quality/SPRINT_P1_CATALOG_NAVIGATION_CORE_STATUS_STEP3_QA_SPEC.md',
      '?? import-patches/ricis-real-catalog-98-root-link.json',
      ' M docs/01-architecture/SPRINT_P1_CATALOG_NAVIGATION_CORE_STATUS_STEP2_ARCHITECTURE.md',
      ' M docs/02-sprints/SPRINT_P1_CATALOG_NAVIGATION_CORE_STATUS_STEP1_BUSINESS_SPEC.md',
      ' M docs/03-quality/SPRINT_P1_CATALOG_NAVIGATION_CORE_STATUS_STEP3_QA_SPEC.md',
      ' M import-patches/ricis-real-catalog-98-root-link.json',
    ]);
    expect(status.every(entry => allowed.has(entry))).toBe(true);
  });
});
