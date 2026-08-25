const CONTRACT_PATH = './agentRicisAdvisory.domain';

type AgentRicisContract = { normalizeStructuralAdvisory: (input: unknown) => unknown };
const loadContract = () => import(CONTRACT_PATH) as Promise<AgentRicisContract>;
const fingerprint = (character: string) => `sha256:v1:${character.repeat(64)}`;
const orderedRules = [
  'L0', 'L1', 'SP2', 'LOCAL_STRUCTURAL_REDUCTION', 'A1_OR_A4',
  'SP3', 'SP4', 'A5_OR_A6_OR_A7', 'TYPE_AND_FRACTAL_CLOSURE',
] as const;

const inputFor = (trace: readonly unknown[], kind = 'RICIS_ASSESSMENT') => ({
  witness: {
    sourceFingerprint: fingerprint('c'),
    witnessFingerprint: fingerprint('d'),
    semanticType: 'RICIS_EXPRESSION',
    sourceKind: 'ricis_node',
    certifiedSingularityKeys: ['indexed_zero', 'indexed_infinity'],
    premises: { l0: true, l1: true, sp2: true, sp4: true },
  },
  advisory: { kind, authority: 'NON_AUTHORITATIVE', trace },
});

const validTrace = () => orderedRules.map((rule) => ({ rule, outcome: 'APPLIED' }));

describe('AGENT-RICIS-01 red baseline: RICIS rule trace and semantic rejection', () => {
  it('AR-QA-14 accepts each closed rule exactly once in required L0-to-type/fractal order', async () => {
    const contract = await loadContract();
    expect(contract.normalizeStructuralAdvisory(inputFor(validTrace()))).toMatchObject({ kind: 'ADVISORY_READY' });
  });

  it('AR-QA-15 rejects an L0 or L1 omission', async () => {
    const contract = await loadContract();
    expect(contract.normalizeStructuralAdvisory(inputFor(validTrace().slice(1)))).toMatchObject({ kind: 'ADVISORY_REJECTED', reason: 'RICIS_RULE_TRACE_INVALID' });
  });

  it('AR-QA-16 turns incomplete SP2 or SP4 premise into blocked requires-core-or-Lean rather than assessment', async () => {
    const contract = await loadContract();
    const input = inputFor(validTrace().map((step, index) => index === 2 ? { ...step, outcome: 'BLOCKED' } : step), 'REQUIRES_CORE_OR_LEAN');
    input.witness.premises.sp2 = false;
    expect(contract.normalizeStructuralAdvisory(input)).toMatchObject({ kind: 'ADVISORY_READY', advisory: { kind: 'REQUIRES_CORE_OR_LEAN' } });
  });

  it('AR-QA-17 rejects duplicate or reordered rules', async () => {
    const contract = await loadContract();
    const trace = validTrace();
    [trace[2], trace[3]] = [trace[3], trace[2]];
    expect(contract.normalizeStructuralAdvisory(inputFor(trace))).toMatchObject({ kind: 'ADVISORY_REJECTED', reason: 'RICIS_RULE_TRACE_INVALID' });
  });

  it('AR-QA-18 rejects an unknown rule token', async () => {
    const contract = await loadContract();
    const trace = validTrace();
    trace[4] = { rule: 'UNBOUNDED_RULE', outcome: 'APPLIED' } as unknown as typeof trace[number];
    expect(contract.normalizeStructuralAdvisory(inputFor(trace))).toMatchObject({ kind: 'ADVISORY_REJECTED', reason: 'RICIS_RULE_TRACE_INVALID' });
  });

  it('AR-QA-19 rejects an applied structural result after prerequisite has been blocked', async () => {
    const contract = await loadContract();
    const trace = validTrace().map((step, index) => index === 2 ? { ...step, outcome: 'BLOCKED' } : step);
    expect(contract.normalizeStructuralAdvisory(inputFor(trace))).toMatchObject({ kind: 'ADVISORY_REJECTED', reason: 'ASSESSMENT_PREMISE_INCOMPLETE' });
  });

  it('AR-QA-20 preserves an exact legal not-applicable step without inventing A6/A7 applicability', async () => {
    const contract = await loadContract();
    const trace = validTrace().map((step, index) => index === 7 ? { ...step, outcome: 'NOT_APPLICABLE' } : step);
    expect(contract.normalizeStructuralAdvisory(inputFor(trace))).toMatchObject({ kind: 'ADVISORY_READY' });
  });

  it('AR-QA-21 rejects limit or LHopital semantics', async () => {
    const contract = await loadContract();
    expect(contract.normalizeStructuralAdvisory({ ...inputFor(validTrace()), rationale: 'apply limit then LHopital' })).toMatchObject({ kind: 'ADVISORY_REJECTED', reason: 'FORBIDDEN_NON_RICIS_SEMANTIC' });
  });

  it('AR-QA-22 rejects bare scalar 0/0, NaN scalarization and classicalFallback', async () => {
    const contract = await loadContract();
    expect(contract.normalizeStructuralAdvisory({ ...inputFor(validTrace()), semanticNote: '0/0 NaN classicalFallback' })).toMatchObject({ kind: 'ADVISORY_REJECTED', reason: 'FORBIDDEN_NON_RICIS_SEMANTIC' });
  });

  it('AR-QA-23 rejects sorry and generic Lean, P=NP, A6 or phase templates', async () => {
    const contract = await loadContract();
    expect(contract.normalizeStructuralAdvisory({ ...inputFor(validTrace()), template: 'Phase 1: sorry exact Lean A6 P=NP' })).toMatchObject({ kind: 'ADVISORY_REJECTED', reason: 'FORBIDDEN_NON_RICIS_SEMANTIC' });
  });

  it('AR-QA-24 validates a trace only and never evaluates an expression or emits a mathematical answer', async () => {
    const contract = await loadContract();
    const result = contract.normalizeStructuralAdvisory(inputFor(validTrace())) as Record<string, unknown>;
    expect(JSON.stringify(result)).not.toMatch(/answer|value|evaluate|computed|resultExpression/i);
  });
});
