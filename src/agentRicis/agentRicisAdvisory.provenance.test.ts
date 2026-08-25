const CONTRACT_PATH = './agentRicisAdvisory.domain';

type AgentRicisContract = {
  normalizeStructuralAdvisory: (input: unknown) => unknown;
  projectCompetenceConflict: (input: unknown) => unknown;
};
const loadContract = () => import(CONTRACT_PATH) as Promise<AgentRicisContract>;
const fingerprint = (character: string) => `sha256:v1:${character.repeat(64)}`;
const trace = () => [
  'L0', 'L1', 'SP2', 'LOCAL_STRUCTURAL_REDUCTION', 'A1_OR_A4',
  'SP3', 'SP4', 'A5_OR_A6_OR_A7', 'TYPE_AND_FRACTAL_CLOSURE',
].map((rule) => ({ rule, outcome: 'APPLIED' }));
const advisoryInput = () => ({
  witness: {
    sourceFingerprint: fingerprint('e'),
    witnessFingerprint: fingerprint('f'),
    semanticType: 'RICIS_EXPRESSION',
    sourceKind: 'ricis_node',
    certifiedSingularityKeys: ['indexed_zero'],
    premises: { l0: true, l1: true, sp2: true, sp4: true },
  },
  advisory: { kind: 'RICIS_ASSESSMENT', authority: 'NON_AUTHORITATIVE', trace: trace() },
});

describe('AGENT-RICIS-01 red baseline: provenance, authority and training quarantine', () => {
  it('AR-QA-25 preserves caller-supplied canonical fingerprints without SHA capture, idempotency or ledger behavior', async () => {
    const contract = await loadContract();
    expect(contract.normalizeStructuralAdvisory(advisoryInput())).toMatchObject({ kind: 'ADVISORY_READY', advisory: { sourceFingerprint: fingerprint('e'), witnessFingerprint: fingerprint('f') } });
  });

  it('AR-QA-26 rejects a conflict whose canonical source, kernel or advisory references do not match exactly', async () => {
    const contract = await loadContract();
    expect(contract.projectCompetenceConflict({ advisoryFingerprint: fingerprint('e'), kernelFingerprint: fingerprint('f'), sourceFingerprint: fingerprint('0'), competenceState: 'TRAINING_REQUIRED', effective: false })).toMatchObject({ kind: 'ADVISORY_REJECTED', reason: 'CONFLICT_VIEW_UNTRUSTED' });
  });

  it('AR-QA-27 projects only immutable training-required and ineffective canonical conflict', async () => {
    const contract = await loadContract();
    expect(contract.projectCompetenceConflict({ advisoryFingerprint: fingerprint('e'), kernelFingerprint: fingerprint('f'), competenceState: 'TRAINING_REQUIRED', effective: false })).toMatchObject({ kind: 'COMPETENCE_QUARANTINE_VIEW', conflict: { competenceState: 'TRAINING_REQUIRED', effective: false } });
  });

  it('AR-QA-28 exposes no conflict create, acknowledge, train, score or memory method', async () => {
    const contract = await loadContract();
    expect(Object.keys(contract)).not.toEqual(expect.arrayContaining(['createConflict', 'acknowledgeConflict', 'train', 'updateScore', 'writeMemory']));
  });

  it('AR-QA-29 returns no trainingAccuracy, count, summary or qualification-upgrade data', async () => {
    const contract = await loadContract();
    const result = contract.normalizeStructuralAdvisory(advisoryInput());
    expect(JSON.stringify(result)).not.toMatch(/trainingAccuracy|resolvedNodesCount|proofsCount|summary|qualification/i);
  });

  it('AR-QA-30 keeps RICIS III solved, owner P=NP, kernel and human bases distinct from advisory basis', async () => {
    const contract = await loadContract();
    const result = contract.normalizeStructuralAdvisory(advisoryInput()) as Record<string, unknown>;
    expect(JSON.stringify(result)).not.toMatch(/RICIS_III_SOLVED|P=NP|LEAN_KERNEL_VERIFIED|HUMAN_CONFIRMED_NON_KERNEL/i);
  });

  it('AR-QA-31 has no Proof, latex, externalLean, axiom or user-source mutation surface', async () => {
    const contract = await loadContract();
    expect(Object.keys(contract)).not.toEqual(expect.arrayContaining(['writeProof', 'updateLatex', 'setExternalLean', 'addAxiom', 'replaceUserSource']));
  });

  it('AR-QA-32 rejects human-decision or state-proposal data as agent state authority', async () => {
    const contract = await loadContract();
    expect(contract.normalizeStructuralAdvisory({ ...advisoryInput(), stateProposal: { proposedState: 'resolved', decision: 'accept' } })).toMatchObject({ kind: 'ADVISORY_REJECTED' });
  });

  it('AR-QA-33 rejects hosted, manual or local diagnostic/provider data as an agent/Core/Lean authority label', async () => {
    const contract = await loadContract();
    expect(contract.normalizeStructuralAdvisory({ ...advisoryInput(), verification: { authority: 'HOSTED', status: 'LEAN_KERNEL_VERIFIED' } })).toMatchObject({ kind: 'ADVISORY_REJECTED' });
  });

  it('AR-QA-34 never returns canonical proof text or generated recommendation for blocked, unavailable or invalid advisory', async () => {
    const contract = await loadContract();
    const result = contract.normalizeStructuralAdvisory({ ...advisoryInput(), template: 'sorry' });
    expect(JSON.stringify(result)).not.toMatch(/canonical|proofLatex|buildCanonicalRicisProofLatex|recommendation/i);
  });
});
