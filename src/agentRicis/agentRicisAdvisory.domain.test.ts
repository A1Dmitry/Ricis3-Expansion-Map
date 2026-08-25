const CONTRACT_PATH = './agentRicisAdvisory.domain';

type AgentRicisContract = {
  normalizeStructuralAdvisory: (input: unknown) => unknown;
  createUnavailableAdvisory: (input: unknown) => unknown;
  inspectAgentRicisTopology: () => unknown;
};

const loadContract = () => import(CONTRACT_PATH) as Promise<AgentRicisContract>;
const fingerprint = (character: string) => `sha256:v1:${character.repeat(64)}`;
const rules = [
  'L0', 'L1', 'SP2', 'LOCAL_STRUCTURAL_REDUCTION', 'A1_OR_A4',
  'SP3', 'SP4', 'A5_OR_A6_OR_A7', 'TYPE_AND_FRACTAL_CLOSURE',
] as const;

const trace = () => rules.map((rule) => ({ rule, outcome: 'APPLIED' }));
const readyInput = () => ({
  witness: {
    sourceFingerprint: fingerprint('a'),
    witnessFingerprint: fingerprint('b'),
    semanticType: 'RICIS_EXPRESSION',
    sourceKind: 'ricis_node',
    certifiedSingularityKeys: ['indexed_zero'],
    premises: { l0: true, l1: true, sp2: true, sp4: true },
  },
  advisory: {
    kind: 'RICIS_ASSESSMENT',
    authority: 'NON_AUTHORITATIVE',
    trace: trace(),
  },
});

describe('AGENT-RICIS-01 red baseline: closed witness and result algebra', () => {
  it('AR-QA-01 accepts a shape-valid canonical typed advisory as an immutable ready record', async () => {
    const contract = await loadContract();
    expect(contract.normalizeStructuralAdvisory(readyInput())).toMatchObject({ kind: 'ADVISORY_READY' });
  });

  it('AR-QA-02 rejects a malformed source fingerprint without generating a replacement hash', async () => {
    const contract = await loadContract();
    const input = readyInput();
    input.witness.sourceFingerprint = 'not-a-fingerprint';
    expect(contract.normalizeStructuralAdvisory(input)).toMatchObject({ kind: 'ADVISORY_REJECTED', reason: 'INVALID_SOURCE_BOUND_WITNESS' });
  });

  it('AR-QA-03 rejects a malformed witness fingerprint without fallback source binding', async () => {
    const contract = await loadContract();
    const input = readyInput();
    input.witness.witnessFingerprint = 'sha256:v1:short';
    expect(contract.normalizeStructuralAdvisory(input)).toMatchObject({ kind: 'ADVISORY_REJECTED', reason: 'INVALID_SOURCE_BOUND_WITNESS' });
  });

  it('AR-QA-04 rejects missing semantic type, source kind or certified singularity keys', async () => {
    const contract = await loadContract();
    const input = readyInput();
    input.witness = { sourceFingerprint: fingerprint('a'), witnessFingerprint: fingerprint('b') } as typeof input.witness;
    expect(contract.normalizeStructuralAdvisory(input)).toMatchObject({ kind: 'ADVISORY_REJECTED', reason: 'INVALID_SOURCE_BOUND_WITNESS' });
  });

  it('AR-QA-05 rejects raw proof, Lean, TeX, title, prompt, URL, credential and command transport fields', async () => {
    const contract = await loadContract();
    expect(contract.normalizeStructuralAdvisory({ ...readyInput(), prompt: 'prove this', latex: 'x', url: 'https://invalid.example', credential: 'secret' })).toMatchObject({ kind: 'ADVISORY_REJECTED' });
  });

  it('AR-QA-06 permits only the three closed advisory kinds', async () => {
    const contract = await loadContract();
    const input = readyInput();
    input.advisory.kind = 'RESOLVED' as typeof input.advisory.kind;
    expect(contract.normalizeStructuralAdvisory(input)).toMatchObject({ kind: 'ADVISORY_REJECTED' });
  });

  it('AR-QA-07 requires every ready advisory to be explicitly non-authoritative', async () => {
    const contract = await loadContract();
    const input = readyInput();
    input.advisory.authority = 'LEAN_KERNEL_VERIFIED' as typeof input.advisory.authority;
    expect(contract.normalizeStructuralAdvisory(input)).toMatchObject({ kind: 'ADVISORY_REJECTED' });
  });

  it('AR-QA-08 returns immutable ready data and trace steps', async () => {
    const contract = await loadContract();
    const result = contract.normalizeStructuralAdvisory(readyInput()) as { readonly kind: string; readonly advisory?: { readonly trace?: readonly unknown[] } };
    expect(result.kind).toBe('ADVISORY_READY');
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.advisory)).toBe(true);
    expect(Object.isFrozen(result.advisory?.trace)).toBe(true);
  });

  it('AR-QA-09 preserves source and witness identities in deterministic unavailable outcome without fallback proof', async () => {
    const contract = await loadContract();
    expect(contract.createUnavailableAdvisory({ sourceFingerprint: fingerprint('a'), witnessFingerprint: fingerprint('b'), reason: 'UNAVAILABLE_READ_PORT' })).toMatchObject({ kind: 'ADVISORY_UNAVAILABLE', sourceFingerprint: fingerprint('a'), witnessFingerprint: fingerprint('b') });
  });

  it('AR-QA-10 converts a malformed injected read outcome into a closed unavailable reason instead of throwing', async () => {
    const contract = await loadContract();
    expect(contract.createUnavailableAdvisory({ sourceFingerprint: fingerprint('a'), witnessFingerprint: fingerprint('b'), read: { kind: 'FOUND' } })).toMatchObject({ kind: 'ADVISORY_UNAVAILABLE' });
  });

  it('AR-QA-11 permits honest requires-core-or-Lean result with no structural-result payload', async () => {
    const contract = await loadContract();
    const input = readyInput();
    input.advisory.kind = 'REQUIRES_CORE_OR_LEAN' as typeof input.advisory.kind;
    input.advisory.trace = trace().map((step, index) => index === 2 ? { ...step, outcome: 'BLOCKED' } : step);
    expect(contract.normalizeStructuralAdvisory(input)).toMatchObject({ kind: 'ADVISORY_READY', advisory: { kind: 'REQUIRES_CORE_OR_LEAN' } });
  });

  it('AR-QA-12 exposes no state, proof, externalLean, axiom or trust writer surface', async () => {
    const contract = await loadContract();
    const result = contract.normalizeStructuralAdvisory(readyInput()) as Record<string, unknown>;
    expect(JSON.stringify(result)).not.toMatch(/state|proof|latex|externalLean|axiom|trust/i);
  });

  it('AR-QA-13 discloses only minimal source descriptor fields and never bytes, idempotency or ledger data', async () => {
    const contract = await loadContract();
    const result = contract.normalizeStructuralAdvisory(readyInput()) as Record<string, unknown>;
    expect(JSON.stringify(result)).not.toMatch(/sourceBytes|idempotency|ledger/i);
  });
});
