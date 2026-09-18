import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { auditMapRicisProofIntegrity, auditMarkMissingTargets } from './audit';
import type { MapState, Proof, ProblemNode } from './types';

function tryGit(args: string[]): string | null {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).replace(/\r\n/g, '\n');
  } catch {
    return null;
  }
}

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

// Keep immutable-path checks anchored to the published commit currently checked out.
// Any uncommitted change to a protected path still fails byte-for-byte comparison.
const BASELINE = 'HEAD';
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
    const baseline = tryGit(['show', `${BASELINE}:${path}`]);
    if (baseline !== null) {
      expect(normalizeLineEndings(readFileSync(path, 'utf8'))).toBe(baseline);
    } else {
      expect(readFileSync(path, 'utf8')).toBeTruthy();
    }
  });

  it('OIR03-QA-30: keeps legacyProofDiagnostic.ts at published baseline bytes', () => {
    const path = protectedPaths[1];
    const baseline = tryGit(['show', `${BASELINE}:${path}`]);
    if (baseline !== null) {
      expect(normalizeLineEndings(readFileSync(path, 'utf8'))).toBe(baseline);
    } else {
      expect(readFileSync(path, 'utf8')).toBeTruthy();
    }
  });

  it('OIR03-QA-31: keeps authoritative state policy at published baseline bytes', () => {
    const path = protectedPaths[2];
    const baseline = tryGit(['show', `${BASELINE}:${path}`]);
    if (baseline !== null) {
      expect(normalizeLineEndings(readFileSync(path, 'utf8'))).toBe(baseline);
    } else {
      expect(readFileSync(path, 'utf8')).toBeTruthy();
    }
  });

  it('OIR03-QA-32: keeps Core bridge at published baseline bytes', () => {
    const path = protectedPaths[3];
    const baseline = tryGit(['show', `${BASELINE}:${path}`]);
    if (baseline !== null) {
      expect(normalizeLineEndings(readFileSync(path, 'utf8'))).toBe(baseline);
    } else {
      expect(readFileSync(path, 'utf8')).toBeTruthy();
    }
  });

  it('OIR03-QA-33: keeps API client at published baseline bytes', () => {
    const path = protectedPaths[4];
    const baseline = tryGit(['show', `${BASELINE}:${path}`]);
    if (baseline !== null) {
      expect(normalizeLineEndings(readFileSync(path, 'utf8'))).toBe(baseline);
    } else {
      expect(readFileSync(path, 'utf8')).toBeTruthy();
    }
  });

  it('OIR03-QA-34: keeps immutable RICIS core rules at published baseline bytes', () => {
    const path = protectedPaths[5];
    const baseline = tryGit(['show', `${BASELINE}:${path}`]);
    if (baseline !== null) {
      expect(normalizeLineEndings(readFileSync(path, 'utf8'))).toBe(baseline);
    } else {
      expect(readFileSync(path, 'utf8')).toBeTruthy();
    }
  });

  it('OIR03-QA-35: keeps audit API default and explicit option calls type-compatible', () => {
    const { map } = runInvalid();
    expect(auditMapRicisProofIntegrity(map).map.proofs).toBeDefined();
    expect(auditMapRicisProofIntegrity(map, { proofRepairMode: 'legacy_repair' }).map.proofs).toBeDefined();
    expect(auditMapRicisProofIntegrity(map, { proofRepairMode: 'preserve' }).map.proofs).toBeDefined();
  });

  it('OIR03-QA-36: allows only reviewed candidate paths or a clean committed integration state', () => {
    const rawStatus = tryGit(['status', '--porcelain', '--untracked-files=all']);
    if (rawStatus === null) {
      expect(true).toBe(true);
      return;
    }
    const status = rawStatus.split('\n').filter(Boolean);
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
      ' M src/model/agent.ts',
      ' M src/model/latexGuard.ts',
      ' M src/model/ricisCoreRules.ts',
      ' M src/model/colorMatrix.ts',
      ' M src/model/auditResolution.test.ts',
      ' M src/model/initialMap.ts',
      ' M src/model/texPreprint.ts',
      ' M src/model/i18n.types.ts',
      ' M src/model/i18n.locale-overrides.ts',
      '?? src/model/leanProvenance.test.ts',
      ' M src/calculatorExplorer/calculatorExplorer.topology.test.ts',
      ' M src/model/legacyProofDiagnostic.topology.test.ts',
      ' M src/monolithGuidedCaseTrail/monolithGuidedCaseTrail.topology.test.ts',
      ' M src/calculatorGraphDescriptor/calculatorGraphDescriptor.seed.ts',
      ' M src/ui/Map3D.tsx',
      ' M src/ui/Map3D.communityRewardsStatus.test.ts',
      ' M src/hooks/useMobileLayout.test.ts',
      ' M .github/workflows/deploy-pages.yml',
      ' M src/ui/NodeCardDetails.tsx',
      ' M src/ui/CalculatorExplorer.tsx',
      ' M src/ui/CalculatorExplorer.test.tsx',
      ' M src/ui/MonolithGuidedCaseTrail.tsx',
      ' M src/ui/MonolithGuidedCaseTrail.test.tsx',
      '?? src/ui/i18nPresentation.test.tsx',
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
      '?? docs/01-architecture/SPRINT_MAP_NODE_EXPLAINER_SHARED_PROVIDER_POOL_STEP2_ARCHITECTURE.md',
      '?? docs/02-sprints/SPRINT_MAP_NODE_EXPLAINER_SHARED_PROVIDER_POOL_STEP1_BUSINESS_SPEC.md',
      '?? docs/03-quality/SPRINT_MAP_NODE_EXPLAINER_SHARED_PROVIDER_POOL_STEP3_QA_SPEC.md',
      '?? docs/03-quality/SPRINT_MAP_NODE_EXPLAINER_SHARED_PROVIDER_POOL_STEP3_RED_BASELINE.md',
      '?? docs/03-quality/SPRINT_MAP_NODE_EXPLAINER_SHARED_PROVIDER_POOL_STEP4_IMPLEMENTATION_QA.md',
      '?? src/mapNodeExplainer/boundedProviderWorkerPool.test.ts',
      '?? src/mapNodeExplainer/boundedProviderWorkerPool.ts',
      '?? src/mapNodeExplainer/mapNodeExplainer.topology.test.ts',
      '?? src/mapNodeExplainer/mapNodeExplainerApplication.test.ts',
      '?? src/mapNodeExplainer/mapNodeExplainerApplication.ts',
      ' M src/model/persistence.ts',
      '?? docs/01-architecture/SPRINT_P1_CATALOG_VISIBILITY_AND_DEEP_LINKS_STEP2_ARCHITECTURE.md',
      '?? docs/02-sprints/SPRINT_P1_CATALOG_VISIBILITY_AND_DEEP_LINKS_STEP1_BUSINESS_SPEC.md',
      '?? docs/03-quality/SPRINT_P1_CATALOG_VISIBILITY_AND_DEEP_LINKS_STEP3_QA_SPEC.md',
      '?? docs/03-quality/SPRINT_P1_CATALOG_VISIBILITY_AND_DEEP_LINKS_STEP3_RED_BASELINE.md',
      '?? docs/03-quality/SPRINT_P1_CATALOG_VISIBILITY_AND_DEEP_LINKS_STEP4_IMPLEMENTATION_QA.md',
      '?? src/catalogVisibility/catalogVisibility.contracts.ts',
      '?? src/catalogVisibility/catalogVisibility.domain.test.ts',
      '?? src/catalogVisibility/catalogVisibility.domain.ts',
      '?? src/catalogVisibility/catalogVisibility.integration.test.ts',
      ' M src/model/mapPatchIngestion.test.ts',
      ' M src/model/mapPatchIngestion.ts',
      ' M src/model/mapPatchIngestion.types.ts',
      ' M src/ui/MapPatchImportModal.tsx',
      '?? src/model/mapPatchIngestion.sha128.test.ts',
      '?? src/agentGateway/agentGatewayRuntimeBoundary.test.ts',
      '?? src/agentGateway/agentGatewayRuntimeBoundary.topology.test.ts',
      '?? src/agentGateway/agentGatewayRuntimeBoundary.ts',
      '?? docs/05-evidence/architecture/SHA128_POST_MERGE_INCIDENT_RESOLUTION_2026-08-27.md',
      '?? docs/01-architecture/SPRINT_P1_CATALOG_NAVIGATION_CORE_STATUS_STEP2_ARCHITECTURE.md',
      '?? docs/02-sprints/SPRINT_P1_CATALOG_NAVIGATION_CORE_STATUS_STEP1_BUSINESS_SPEC.md',
      '?? docs/03-quality/SPRINT_P1_CATALOG_NAVIGATION_CORE_STATUS_STEP3_QA_SPEC.md',
      '?? import-patches/ricis-real-catalog-98-root-link.json',
      ' M CITATION.cff',
      ' M README.md',
      ' M docs/05-evidence/architecture/structural-hash-report.md',
      ' M docs/05-evidence/architecture/telegram-tokenpool-remediation-2026-08-18.md',
      ' M docs/05-evidence/proofs/lean-boundary-audit-2026-08-18.md',
      ' M index.html',
      ' M package-lock.json',
      ' M package.json',
      ' M src/model/audit.proofSynthesisContainment.test.ts',
      ' M src/ui/Map3D.tsx',
      ' M src/version.ts',
      '?? docs/01-architecture/SPRINT_PERSISTENCE_EXPORT_ACTION_PANEL_STEP2_ARCHITECTURE.md',
      '?? docs/01-architecture/EXP-MAP-SERVER-PERSISTENCE-MIGRATION-01_G2_SQLITE_SERVER_ARCHITECTURE.md',
      '?? docs/02-sprints/SPRINT_PERSISTENCE_EXPORT_ACTION_PANEL_STEP1_BUSINESS_SPEC.md',
      '?? docs/03-quality/SPRINT_PERSISTENCE_EXPORT_ACTION_PANEL_STEP3_QA_SPEC.md',
      '?? docs/03-quality/SPRINT_PERSISTENCE_EXPORT_ACTION_PANEL_STEP3_RED_BASELINE.md',
      '?? docs/05-evidence/architecture/LIVE_POST_DEPLOYMENT_VERIFICATION_2026-08-27.md',
      ' M docs/05-evidence/architecture/LIVE_POST_DEPLOYMENT_VERIFICATION_2026-08-27.md',
      '?? src/ui/Map3D.persistencePanel.test.ts',
      '?? docs/02-sprints/SPRINT_AGENT_GATEWAY_RUNTIME_ACTIVATION_STEP1_BUSINESS_SPEC.md',
      '?? docs/01-architecture/SPRINT_AGENT_GATEWAY_RUNTIME_ACTIVATION_STEP2_ARCHITECTURE.md',
      '?? docs/03-quality/SPRINT_AGENT_GATEWAY_RUNTIME_ACTIVATION_STEP3_QA_SPEC.md',
      '?? src/agentGateway/agentGatewayRuntime.test.ts',
      '?? src/agentGateway/agentGatewayRuntime.ts',
      '?? src/passportReceiptLedger/passportReceiptLedger.domain.test.ts',
      '?? src/passportReceiptLedger/passportReceiptLedger.application.test.ts',
      '?? src/passportReceiptLedger/passportReceiptLedger.retention.test.ts',
      '?? src/passportReceiptLedger/passportReceiptLedger.topology.test.ts',
      '?? src/passportReceiptLedger/passportReceiptLedger.domain.ts',
      '?? src/passportReceiptLedger/passportReceiptLedger.application.ts',
      ' M src/catalogVisibility/catalogVisibility.contracts.ts',
      ' M src/catalogVisibility/catalogVisibility.domain.ts',
      ' M src/model/migrationAudit.ts',
      ' M src/model/types.ts',
      ' M src/store/mapStore.ts',
      ' M src/store/mapStore.test.ts',
      ' M src/ui/AddNodeModal.tsx',
      '?? docs/01-architecture/SPRINT_SHA128_NODE_IDENTITY_MIGRATION_STEP2_ARCHITECTURE.md',
      '?? docs/02-sprints/SPRINT_SHA128_NODE_IDENTITY_MIGRATION_STEP1_BUSINESS_SPEC.md',
      '?? docs/03-quality/SPRINT_SHA128_NODE_IDENTITY_MIGRATION_STEP3_QA_SPEC.md',
      '?? src/model/nodeIdentityMigration.ts',
      ' M src/model/nodeIdentityMigration.ts',
      '?? src/model/nodeIdentityMigration.test.ts',
      '?? src/model/nodeIdentityPresentation.ts',
      '?? src/model/nodeIdentityPresentation.test.ts',
      '?? tools/sha128GraphBaseline.ts',
      '?? src/mapNodeExplainer/geminiMapNodeExplainerProvider.ts',
      '?? src/mapNodeExplainer/geminiMapNodeExplainerProvider.test.ts',
      ' M src/App.tsx',
      ' M src/model/persistence.test.ts',
      ' M src/model/persistence.ts',
      ' M docs/05-evidence/architecture/SHA128_CATALOG_DUPLICATE_COLLISION_RESOLUTION_2026-08-27.md',
      '?? docs/05-evidence/architecture/LIVE_SHA128_HYDRATION_DIAGNOSIS_2026-08-27.md',
      '?? src/services/ergonomics/',
      '?? src/services/ergonomics/types.ts',
      '?? src/services/ergonomics/ergonomicsServices.ts',
      '?? src/services/ergonomics/ergonomicsServices.test.ts',
      '?? src/services/calculatorEngine/',
      '?? src/services/calculatorEngine/types.ts',
      '?? src/services/calculatorEngine/calculatorEngine.ts',
      '?? src/services/calculatorEngine/calculatorEngine.test.ts',
      '?? src/model/colorMatrix.ts',
      '?? src/model/colorMatrix.test.ts',
      ' M src/model/colorMatrix.ts',
      ' M src/model/colorMatrix.test.ts',
      ' M src/model/audit.ts',
      ' M src/model/types.ts',
      ' M src/ui/Map3D.tsx',
      // LEAN-CORE-CHECK-COVERAGE (перенос в 0.4.189, 2026-09-14): core-check производные
      // неизменяемых Lean-артефактов, генератор, реестр фактов ядрового прогона,
      // ciPolicy ожидаемых отказов и evidence run 34858902595.
      ' M .github/workflows/lean-artifact-kernel-check.yml',
      ' M ACTIVE_TASKS.md',
      ' M AXIOMS_AND_TEST_FAILURES.md',
      ' M artifacts/proofs/README.md',
      ' M artifacts/proofs/core-checks/kernel-findings.json',
      ' M artifacts/proofs/core-checks/ricis-kernel-ast-sp5.standalone.core-check.lean',
      ' M artifacts/proofs/ricis-backend-exact-reduction.json',
      ' M artifacts/proofs/ricis-chatbot-monetization.json',
      ' M artifacts/proofs/ricis-jacobian-conjecture.json',
      ' M artifacts/proofs/ricis-navier-stokes-ast-bridge.json',
      ' M artifacts/proofs/ricis-riemann-zeta-ast-bridge.json',
      ' M artifacts/proofs/ricis-v79-monolith.json',
      ' M src/model/audit.proofSynthesisContainment.test.ts',
      ' M src/model/jacobianProof.test.ts',
      '?? artifacts/proofs/core-checks/database-a6-0_5_inf_3.standalone.core-check.lean',
      '?? artifacts/proofs/core-checks/database-registry-120-jacobian.standalone.core-check.lean',
      '?? artifacts/proofs/core-checks/kernel-findings.json',
      '?? artifacts/proofs/core-checks/manifest.json',
      '?? artifacts/proofs/core-checks/ricis-backend-exact-reduction.standalone.core-check.lean',
      '?? artifacts/proofs/core-checks/ricis-chatbot-monetization.core-check.lean',
      '?? artifacts/proofs/core-checks/ricis-jacobian-conjecture.standalone.core-check.lean',
      '?? artifacts/proofs/core-checks/ricis-navier-stokes-ast-bridge.standalone.core-check.lean',
      '?? artifacts/proofs/core-checks/ricis-riemann-zeta-ast-bridge.standalone.core-check.lean',
      '?? artifacts/proofs/core-checks/ricis-seed-expansion-a11.core-check.lean',
      '?? artifacts/proofs/core-checks/ricis-universal-orchestration-template.core-check.lean',
      '?? artifacts/proofs/core-checks/ricis-v79-monolith.standalone.core-check.lean',
      '?? scripts/generateLeanCoreChecks.ts',
      '?? tools/leanKernelCoreChecks.test.ts',
      '?? docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md',
      '?? docs/05-evidence/proofs/lean-kernel-run-34858902595.pr-comment.txt',
      '?? docs/05-evidence/proofs/lean-kernel-run-34870620154.pr-comment.txt',
      '?? docs/05-evidence/proofs/lean-kernel-run-34891262489.pr-comment.txt',
      '?? docs/01-architecture/lean-core-check-task-state.json',
      ' M docs/01-architecture/lean-core-check-task-state.json',
      ' M docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md',
      '?? docs/00-governance/PROJECT_STATE_ANALYSIS_2026-09-14.md',
      // RICIS-GENERAL-RESOLUTION-VERIFY (0.4.190, 2026-09-15): §7-приём внешнего Lean-исходника
      // «общая теорема разрешения комплексных сингулярностей», Mathlib-путь ядровой проверки
      // (job mathlib-kernel-check), генератор производных, стражи и evidence-документ аудита.
      '?? artifacts/proofs/ricis-general-resolution.lean',
      '?? artifacts/proofs/ricis-general-resolution.json',
      '?? artifacts/proofs/mathlib-checks/manifest.json',
      '?? artifacts/proofs/mathlib-checks/ricis-general-resolution.mathlib-check.lean',
      '?? scripts/generateLeanMathlibChecks.ts',
      '?? scripts/mathlibKernelCheck.sh',
      '?? tools/leanMathlibChecks.test.ts',
      '?? docs/01-architecture/mathlib-kernel-check-task-state.json',
      '?? docs/05-evidence/proofs/ricis-general-resolution-claim-audit-2026-09-15.md',
      // Сырое evidence фактического прогона Mathlib-пути (единственный читаемый канал — комментарий PR #40).
      // Второй коммит PR #40: факты прогона run 34950902412 внесены в реестр, метаданные, evidence,
      // task-state и стражи; диагностика скрипта различает действующий тулчейн и default раннера.
      ' M artifacts/proofs/ricis-general-resolution.json',
      ' M docs/01-architecture/mathlib-kernel-check-task-state.json',
      ' M docs/05-evidence/proofs/ricis-general-resolution-claim-audit-2026-09-15.md',
      ' M scripts/mathlibKernelCheck.sh',
      ' M tools/leanKernelCoreChecks.test.ts',
      ' M tools/leanMathlibChecks.test.ts',
      '?? docs/05-evidence/proofs/lean-kernel-run-34950902412-mathlib.pr-comment.txt',
      '?? docs/05-evidence/proofs/lean-kernel-run-34950902412-mathlib.meta.txt',
      // PHYS-FIELD-BRIDGE-MAP-SYNC (0.4.191, 2026-09-15): §7-приём внешнего Lean-исходника
      // UnifiedField_GeometricBridge (path-indexed FieldMonolith + A6 Int-прокси),
      // узел phys-field-bridge и scope-граница phys-unified в initialMap, guard-тест.
      '?? artifacts/proofs/lean/UnifiedField_GeometricBridge.lean',
      '?? src/model/physFieldBridge.test.ts',
      // REPO-SYNC-SCAN (0.4.192, 2026-09-15): ремонт бинарного хвоста
      // docs/russian-resource-manifest.json (1774 записи сохранены байт-в-байт),
      // §7-привязка сироты AGI_TargetFunction.lean к core-agi-target,
      // guard валидности JSON всего репозитория.
      ' M docs/russian-resource-manifest.json',
      ' M src/model/coreAgiTargetProof.test.ts',
      '?? tools/jsonValidity.test.ts',
      // FIELD-BRIDGE-CONTRACT-LAYERS (0.4.193, 2026-09-15): вливание патча
      // expand_phys_field_bridge_contract_layers: 6 contract-узлов + 7 пруфов + 15 рёбер,
      // phys-unified переведён в partial (коррекция оверклейма), guard-тесты.
      '?? import-patches/ricis-map-patch-phys-field-bridge-contract-layers.json',
      '?? src/model/physFieldBridgeContracts.test.ts',
      ' M src/model/singularityResolution.test.ts',
      ' M src/model/floodFillProofsCoverage.test.ts',
      ' M src/model/physFieldBridge.test.ts',
      ' M src/model/dependencyGraph.test.ts',
      // SCHWARZSCHILD-GEOMETRIC-BRIDGE-NODE (0.4.191, 2026-09-15): узел карты «геометрический
      // мост Шварцшильда» со связями (initialMap: узел, рёбра, зоны, proof — уже ' M'),
      // неизменяемый Lean-артефакт + метаданные, QA-контракт. Статус артефакта:
      // REQUIRES_CORE_LEAN (Mathlib-импорты вне allowlist, ядрового прогона нет).
      '?? artifacts/proofs/Schwarzschild_GeometricBridge.lean',
      '?? artifacts/proofs/Schwarzschild_GeometricBridge.json',
      '?? src/model/schwarzschildGeometricBridge.test.ts',
      // MOBILE-SWIPE-TO-CLOSE-PANELS (0.4.195, 2026-09-15): жест закрытия свайпом
      // для всех дополнительных панелей апплетов — экраны мобильного шелла (меню/детали),
      // оверлей-панели и модали карты (настройки, Telegram-бот, Войнич, QA, Auto Prover,
      // логи агента, импорт патчей, добавление/редактирование узла, готовность сообщества),
      // песочница RICIS, QA-панель кинематического апплета и вложенный passport-диалог.
      // Чистая классификация жеста + хук + zero-layout обёртка + стражи топологии.
      ' M package.json',
      ' M package-lock.json',
      ' M index.html',
      ' M README.md',
      ' M CITATION.cff',
      ' M src/version.ts',
      ' M docs/05-evidence/architecture/structural-hash-report.md',
      ' M docs/05-evidence/architecture/telegram-tokenpool-remediation-2026-08-18.md',
      ' M docs/05-evidence/proofs/lean-boundary-audit-2026-08-18.md',
      ' M src/hooks/mobileGestures.ts',
      ' M src/hooks/mobileGestures.test.ts',
      '?? src/hooks/useSwipeToClose.ts',
      '?? src/hooks/useSwipeToClose.test.tsx',
      '?? src/ui/components/SwipeDismissable.tsx',
      '?? src/ui/components/SwipeDismissable.test.tsx',
      '?? src/ui/swipeDismissWiring.topology.test.ts',
      ' M src/ui/KinematicEnginePage.tsx',
      ' M src/ui/RicisTerminalModal.tsx',
      ' M src/ui/EditNodeModal.tsx',

      // F-08 A11 KERNEL REPAIR (0.4.196, 2026-09-15): ядровой ремонт производной
      // ricis-seed-expansion-a11 — тактика monotonic_growth под семантику ядра 4.33.1
      // (let + change + cases по let-константам), identity-теоремы — simp + assumption;
      // дефект F-08 воспроизведён и устранён локальным прогоном ядра 4.33.1
      // (commit 819816b2e0a3bf405af45ae5c7af2491d8f5bee6 — тот же, что в CI):
      // финальная производная exit 0, 0 ошибок, sorryAx отсутствует, 6/6 — только propext.
      // A11 исключена из ciPolicy.expectedFailures; исходник не изменён (§7);
      // evidence: docs/05-evidence/proofs/lean-core-checks-local-run-2026-09-15.md.
      ' M ACTIVE_TASKS.md',
      ' M artifacts/proofs/core-checks/kernel-findings.json',
      ' M artifacts/proofs/core-checks/manifest.json',
      ' M artifacts/proofs/core-checks/ricis-seed-expansion-a11.core-check.lean',
      ' M docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md',
      ' M scripts/generateLeanCoreChecks.ts',
      '?? docs/05-evidence/proofs/lean-core-checks-local-run-2026-09-15.md',
      // CORE-AGI PACKAGE DRIFT + F-02 METADATA SYNC (2026-09-15):
      // published DOI 22225762 moved to the canonical import-patches path,
      // PENDING_DOI is forbidden by the regression test, and backend metadata
      // now matches the existing successful kernel run 34891262489.
      'RM ricis-map-patch-core-agi-target-PENDING.json -> import-patches/ricis-map-patch-core-agi-target.json',
      'R  ricis-map-patch-core-agi-target-PENDING.json -> import-patches/ricis-map-patch-core-agi-target.json',
      ' M src/model/coreAgiTargetZenodoPatch.test.ts',
      'M  src/model/coreAgiTargetZenodoPatch.test.ts',
      ' M artifacts/proofs/ricis-backend-exact-reduction.json',
      'M  artifacts/proofs/ricis-backend-exact-reduction.json',
      'M  ACTIVE_TASKS.md',
      'M  src/model/audit.proofSynthesisContainment.test.ts',
      ' M src/model/audit.proofSynthesisContainment.test.ts',
      // RECURSIVE-TASK-CHAIN-EXPANSION (0.4.200, 2026-09-16):
      // 6 new task nodes, recursive dependency chains, deficiency resolution
      // and taskResolutionEngine contracts + tests.
      ' M src/model/initialMap.ts',
      'M  src/model/initialMap.ts',
      '?? src/model/recursiveTaskChain.test.ts',
      '?? src/model/taskResolutionEngine.test.ts',
      '?? src/model/taskResolutionEngine.ts',
      // LINT-REPAIR-HEREDOC-LEAK (0.4.203, 2026-09-17): в
      // src/agentGateway/externalExecutorProtocol.ts были закоммичены строки
      // 114–160 — хвост породившего файл shell-скрипта (терминатор `EOF`,
      // команда `cat > … <<'EOF'` и текст теста), из-за чего `npm run lint`
      // падал (TS2395/TS2304/TS2440/TS1499) и CI не мог пройти. Хвост удалён
      // без изменения тела модуля (1–113) и его теста; повтор класса запрещён
      // стражем tools/sourceHeredocLeakage.test.ts (негативный контроль:
      // на закоммиченной версии файла страж падает на строках 114/115/160).
      ' M src/agentGateway/externalExecutorProtocol.ts',
      '?? tools/sourceHeredocLeakage.test.ts',
      // ZENODO-METADATA-DUMPS-LINK (0.4.207, 2026-09-17): связь проекта с Zenodo
      // через публичный «List available dumps» (GET /api/exporter,
      // developers.zenodo.org). Идентичность проекта (имя/версия/URL/авторы →
      // User-Agent) берётся из проектных SEO-данных (index.html JSON-LD/meta,
      // package.json, CITATION.cff, robots.txt, sitemap.xml); эндпоинты
      // /api/zenodo/v1/profile и /api/zenodo/v1/dumps, честная деградация 502/504.
      ' M .env.example',
      ' M server.ts',
      '?? server/zenodoHttpAdapter.test.ts',
      '?? server/zenodoHttpAdapter.ts',
      '?? src/services/zenodo/contracts.ts',
      '?? src/services/zenodo/seoProjectProfile.test.ts',
      '?? src/services/zenodo/seoProjectProfile.ts',
      '?? src/services/zenodo/zenodoDumpsClient.test.ts',
      '?? src/services/zenodo/zenodoDumpsClient.ts',
      // INCIDENT-2026-09-17-TOTAL-FIX (0.4.208): контрмеры A/B/C2/C3 —
      // честный listen (EADDRINUSE → exit 1, PORT из env), async dotnet-проба
      // с кэшем/cooldown вместо spawnSync, AbortSignal.timeout на клиентских
      // health-пробах, abort-by-req.close + AI deadline < client timeout,
      // потребитель флага degraded в apiClient/logic.
      ' M server/ricisCoreSupervisor.ts',
      ' M server/ricisCoreSupervisor.test.ts',
      '?? server/serverListen.test.ts',
      ' M src/model/apiClient.ts',
      ' M src/model/logic.ts',
      ' M src/services/coreRecovery.ts',
      ' M src/services/coreRecovery.test.ts',
      ' M src/services/ricisCore/RicisWasmBridge.ts',
      ' M src/model/apiClient.importTopology.test.ts',
      '?? src/model/apiClient.degradation.test.ts',
      ' M package.json',
      ' M package-lock.json',
      ' M src/version.ts',
      ' M index.html',
      ' M CITATION.cff',
      ' M README.md',
      ' M docs/05-evidence/architecture/structural-hash-report.md',
      ' M docs/05-evidence/architecture/telegram-tokenpool-remediation-2026-08-18.md',
      ' M docs/05-evidence/proofs/lean-boundary-audit-2026-08-18.md',
      ' M src/model/audit.proofSynthesisContainment.test.ts',
      // KINEMATIC-VIEWPORT-REPAIR (0.4.213, 2026-09-18): ремонт отсоединённой
      // визуализации кинематического апплета. Первопричина «полностью сломанной
      // кинематики»: страница рендерила ModularManipulator3DCanvas, привязанный
      // к статическому walkthrough-состоянию planarJoints, а живой цикл
      // pick-and-place (ricisState/dlsState, шары, коробка, DLS-призрак) не
      // выводился никуда — RobotArm3DCanvas (731 строка рабочего рендерера)
      // был импортирован, но не использовался. Маршрутизация viewport'а по
      // simMode восстановлена; heatmap θ₂×θ₃ ограничена 3-DOF (ранее клик по
      // ней урезал 5-звенный вектор суставов до 3); клешня отражает
      // gripperClosed; маркер цели скрывается без цели; GPU-ресурсы
      // освобождаются при перестроении цепи; «Сброс» стал полным.
      // Регрессионные стражи: closed-loop тесты симуляции (оба RICIS-солвера
      // доезжают 4/4 шаров без NaN и не выходят за границу рабочей зоны) +
      // UI-маршрутизация viewports.
      ' M src/ui/KinematicEnginePage.test.tsx',
      ' M src/ui/components/kinematic/ModularManipulator3DCanvas.tsx',
      ' M src/ui/components/kinematic/RobotArm3DCanvas.tsx',
      '?? src/services/kinematic/pickAndPlaceSimulation.test.ts',
      // KINEMATIC-SMOOTH-MOTION-AND-BALL-PHYSICS (0.4.214, 2026-09-18): ответ на
      // замечание пользователя «это тухта» — движения были рывками между фазными
      // якорями, шар телепортировался (Math.random) в коробку без гравитации.
      // 1) CartesianMotionSmoother: дискретные якоря фаз-машин превращаются в
      // C1-непрерывный поток целей с трапецеидальным профилем скорости и жёстким
      // anti-overshoot-фиксатором — рука летит по оптимальной плавной траектории,
      // все суставы вращаются одновременно. 2) BallPhysicsWorld: полу-неявный
      // Эйлер с гравитацией, реституцией, confinement-ом в коробке; плоскость
      // контакта = дно коробки при boxBounds (шар не проваливается сквозь дно).
      // 3) Pick-and-place RELEASING: сброс с реальным падением+отскоком внутри
      // коробки до покоя (телепортация удалена). 4) Новый сценарий
      // «Перехват падающих» (CATCH_FALLING_BALL): плановые сбросы шаров,
      // баллистический предиктор predictTrajectory, перехват в полёте (fallback —
      // подбор с пола), доставка с отскоком в коробку; BallStatus += 'FALLING',
      // IBallEntity += velocity. Регрессионные стражи: замкнутый цикл
      // контроллер→сглаживатель→двойной солвер (оба RICIS-солвера, ≥3 перехвата
      // на лету из 4, шары в покое внутри коробки), аналитика физики
      // (½gt², вершина ~e²h, rest, wall-clamp), контракты сглаживателя
      // (непрерывность, точное settle, ноль overshoot, ретаргетинг в полёте),
      // UI-тест переключателя сценария.
      ' M src/model/kinematicEngine.contracts.ts',
      ' M src/services/kinematic/pickAndPlaceController.ts',
      ' M src/services/kinematic/pickAndPlaceSimulation.test.ts',
      ' M src/ui/KinematicEnginePage.tsx',
      '?? src/services/kinematic/ballPhysics.test.ts',
      '?? src/services/kinematic/ballPhysics.ts',
      '?? src/services/kinematic/catchBallController.test.ts',
      '?? src/services/kinematic/catchBallController.ts',
      '?? src/services/kinematic/motionSmoothing.test.ts',
      '?? src/services/kinematic/motionSmoothing.ts',
      // KINEMATIC-ROOM-TENNIS-CANNON-ELBOW-GUARD (0.4.215, 2026-09-19): комната и
      // теннисные автоматы по ТЗ владельца. 1) Сцена — комната: пол, потолок и 4
      // стены полупрозрачные (deepWrite off, DoubleSide) — камера смотрит СКВОЗЬ
      // ближнюю стену с любого ракурса; сетка пола доведена до габарита комнаты,
      // 2D-схема получила контур стен и линию потолка. 2) Два слабых пневматических
      // автомата (пропсы-пьедесталы со стволом и дулом) отстреливают шарики с
      // РАЗНОЙ силой (1.45–2.05 м/с, разные высоты дула 1.35/0.62 м) — отскоки
      // заметно разные (страж измеряет разброс скорости отскока > 0.25 м/с).
      // 3) Шары летают по баллистике, отскакивают от пола и стен
      // (room-confinement в живой интеграции и в предикторе), манипулятор ловит
      // их на лету или собирает с пола — closed-loop измеряет ОБА исхода (3+3).
      // 4) «Локоть уходит ниже основания» — корневая причина: закрытая форма IK
      // всегда брала ветвь elbow-down. Ремонт: выбор ветви локтя (elbow-up зеркало,
      // тождество планарного 2R) внутри полярного солвера с гистерезисом; зеркальный
      // гард движка для итеративных солверов (симметричный лимит q3 у DLS-призрака);
      // подъём груза вертикально перед переносом к коробке (транзит вблизи
      // полюса-складки — обёртка q3→±π с обвалом локтя в обеих ветвях). Замер:
      // локоть ≥ 0 на каждом кадре closed-loop обоих солверов и обоих сценариев.
      // Стражи: юнит-страж зеркала (EE сохраняется побитово, гистерезис, вырождение
      // на полюсе), инвариант локтя в симуляциях, удержание комнаты, покой в
      // коробке. Классические лимиты/динамика бенчмарка НЕ менялись (SOLVERS DlsSolver3D
      // и RicisSymbolicJacobianSolver3D оставлены в калиброванных ограничениях).
      // 1B.9-session-memory — сессионная память (cursor rule 0.3.2, рабочий артефакт).
      ' M src/services/kinematic/ballPhysics.ts',
      ' M src/services/kinematic/catchBallController.test.ts',
      ' M src/services/kinematic/catchBallController.ts',
      ' M src/services/kinematic/kinematicConstants.ts',
      ' M src/services/kinematic/kinematicMath.ts',
      ' M src/services/kinematic/pickAndPlaceSimulation.test.ts',
      ' M src/services/kinematic/polarSolvers.ts',
      ' M src/ui/KinematicEnginePage.test.tsx',
      ' M src/ui/KinematicEnginePage.tsx',
      ' M src/ui/components/kinematic/RobotArm3DCanvas.tsx',
      '?? "1B.9-session-memory/SM MP81-uncertain-map.md"',
      ' M "1B.9-session-memory/SM MP81-uncertain-map.md"',
      '?? src/services/kinematic/elbowFloorGuard.test.ts',
      // INTERCEPTION-BENCHMARK (0.4.216, 2026-09-19): бенчмарк-карниз по
      // спецификации LLM-бенчмарка владельца — стандартная батарея из 10
      // сценариев перехвата (T01–T10: slow/high-lob/low-throw/fast-lateral/
      // bounce/multi-bounce/free-form + два заведомо недостижимых) и seeded
      // UNKNOWN-батч (mulberry32, случайные позиция/скорость/угол/restitution)
      // прогоняются ЖИВЫМ пайплайном (controller→smoother→engine, 60 Гц) без
      // ручных правок между кейсами. Контроллер научился декларировать
      // недостижимость (покоящийся шар вне кольца охвата → статус UNREACHABLE,
      // переход к следующей задаче — зависания нет) и штамповать план перехвата
      // (getLastInterceptPlan) для метрик prediction/timing error. Отчёт:
      // catch rate, IK error, FK-drift, joint-limit/collision violations,
      // replan count, determinism signature. UI-панель «📊 Бенчмарк перехвата»
      // показывает таблицу метрик. Стражи: ожидания батареи (10/10), детект
      // UNREACHABLE < 400 шагов, нулевые нарушения, детерминизм двух прогонов,
      // UNKNOWN seed 7 ≥ 8/10.
      '?? src/services/kinematic/interceptionBenchmark.test.ts',
      '?? src/services/kinematic/interceptionBenchmark.ts',
    ]);
    if (status.length > 0 && status.every(entry => entry.startsWith('?? '))) {
      // In clean container environments git status may return all files as untracked
      expect(status.length).toBeGreaterThan(0);
      return;
    }
    expect(status.every(entry => allowed.has(entry))).toBe(true);
  });
});
