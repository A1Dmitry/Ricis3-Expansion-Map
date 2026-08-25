import { readFileSync } from 'node:fs';

const CONTRACT_PATH = './agentRicisAdvisory.domain';

type AgentRicisContract = {
  inspectAgentRicisTopology: () => unknown;
  normalizeStructuralAdvisory: (input: unknown) => unknown;
};
const loadContract = () => import(CONTRACT_PATH) as Promise<AgentRicisContract>;
const fingerprint = (character: string) => `sha256:v1:${character.repeat(64)}`;
const agentSource = () => readFileSync('src/agentRicis/agentRicisAdvisory.domain.ts', 'utf8');
const serverSource = () => readFileSync('server.ts', 'utf8');
const modelAgentSource = () => readFileSync('src/model/agent.ts', 'utf8');
const validInput = () => ({
  witness: {
    sourceFingerprint: fingerprint('1'), witnessFingerprint: fingerprint('2'), semanticType: 'RICIS_EXPRESSION', sourceKind: 'ricis_node',
    certifiedSingularityKeys: ['indexed_zero'], premises: { l0: true, l1: true, sp2: true, sp4: true },
  },
  advisory: {
    kind: 'RICIS_ASSESSMENT', authority: 'NON_AUTHORITATIVE', trace: [
      'L0', 'L1', 'SP2', 'LOCAL_STRUCTURAL_REDUCTION', 'A1_OR_A4', 'SP3', 'SP4', 'A5_OR_A6_OR_A7', 'TYPE_AND_FRACTAL_CLOSURE',
    ].map((rule) => ({ rule, outcome: 'APPLIED' })),
  },
});

describe('AGENT-RICIS-01 red baseline: one-way topology, legacy containment and release boundaries', () => {
  it('AR-QA-35 exposes an empty pure topology witness with no import or capability surface', async () => {
    const contract = await loadContract();
    expect(contract.inspectAgentRicisTopology()).toEqual({ imports: [], capabilities: [] });
  });

  it('AR-QA-36 contains no provider, model, network, server, browser, Core, WASM or Lean runtime dependency', async () => {
    await loadContract();
    expect(agentSource()).not.toMatch(/GoogleGenAI|fetch\(|server\.ts|window\.|WebSocket|RicisWasmBridge|import\s+.*\b(?:lean|lake|elan)\b|\b(?:lean|lake|elan)\s+--|spawn\s*\(/i);
  });

  it('AR-QA-37 contains no consent, Passport, A6 implementation, map/store/persistence, proof-builder or migration/audit writer import', async () => {
    await loadContract();
    expect(agentSource()).not.toMatch(/leanEvidenceConsent|leanPassportProjection|a6Evidence|mapStore|persistence|buildCanonicalRicisProofLatex|migrationAudit|auditProofContent/i);
  });

  it('AR-QA-38 contains no transport, popup, credential, environment, retry or fallback invocation', async () => {
    await loadContract();
    expect(agentSource()).not.toMatch(/window\.open|postMessage|URL\(|credential|process\.env|retry|fallback\s*\(|upload/i);
  });

  it('AR-QA-39 keeps published broad server AI and proof routes unlinked from the new advisory module in first increment', async () => {
    await loadContract();
    const source = serverSource();
    expect(source).toContain('/api/generateProof');
    expect(source).not.toContain('agentRicisAdvisory');
  });

  it('AR-QA-40 keeps existing training-memory path unlinked from the new advisory module in first increment', async () => {
    await loadContract();
    const source = modelAgentSource();
    expect(source).toContain('trainingAccuracy');
    expect(source).not.toContain('agentRicisAdvisory');
  });

  it('AR-QA-41 has no direct consent or Passport input and preserves published read-only topology', async () => {
    const contract = await loadContract();
    const result = contract.normalizeStructuralAdvisory(validInput()) as Record<string, unknown>;
    expect(JSON.stringify(result)).not.toMatch(/LeanSourceVersion|KernelEvidenceFact|Passport|HumanLeanEvidenceDecision/i);
  });

  it('AR-QA-42 has no OIR proof-provenance, state-policy, store or persistence mutation surface', async () => {
    const contract = await loadContract();
    expect(Object.keys(contract)).not.toEqual(expect.arrayContaining(['migrateProof', 'repairProof', 'applyState', 'updateStore', 'persist']));
  });

  it('AR-QA-43 exposes no version, release, commit, publish or metadata writer before independent release QA', async () => {
    const contract = await loadContract();
    expect(Object.keys(contract)).not.toEqual(expect.arrayContaining(['setVersion', 'release', 'commit', 'publish', 'writeMetadata']));
  });

  it('AR-QA-44 has no Lean compilation, provider/model/Core/popup/source-upload or training execution claim', async () => {
    const contract = await loadContract();
    const result = contract.normalizeStructuralAdvisory(validInput()) as Record<string, unknown>;
    expect(JSON.stringify(result)).not.toMatch(/LEAN_VERIFIED|kernelVerified|compile|provider|popup|upload|retrain|training/i);
  });
});
