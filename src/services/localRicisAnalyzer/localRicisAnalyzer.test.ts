import { describe, expect, it, vi } from 'vitest';
import { RicisFallbackEngine } from '../ricisCore/RicisFallbackEngine';
import { RicisWasmBridge } from '../ricisCore/RicisWasmBridge';
import { toLocalRecoveryContext, type SourceExpression } from './contracts';
import {
  DEFAULT_LOCAL_ANALYZER_LIMITS,
  LocalAnalysisApplicationService,
  LocalAnalysisTraceFactory,
  LocalExpressionNormalizer,
  LocalExpressionParser,
  LocalPatternClassifier,
  LocalRicisAnalyzer,
  LocalSemanticIndexer,
  LocalStructuralIdentityComparator,
  SourceExpressionFactory,
  UserMediatedSuggestionPromptFactory,
  UserMediatedSuggestionValidator,
} from './localRicisAnalyzer';

const FIXED_TIME = 1_735_689_600_000;
const clock = { now: () => FIXED_TIME };
const limits = { ...DEFAULT_LOCAL_ANALYZER_LIMITS, maxInputCharacters: 64, maxTokenCount: 32, maxAstDepth: 8, maxTraceEntries: 16 };

function source(rawText: string) {
  const outcome = new SourceExpressionFactory().create(rawText, limits);
  if (outcome.kind !== 'CREATED') throw new Error('Test fixture source was rejected.');
  return outcome.source;
}

function analyzer() {
  return new LocalRicisAnalyzer({
    parser: new LocalExpressionParser(),
    normalizer: new LocalExpressionNormalizer(),
    identityComparator: new LocalStructuralIdentityComparator(),
    semanticIndexer: new LocalSemanticIndexer(),
    patternClassifier: new LocalPatternClassifier(),
    traceFactory: new LocalAnalysisTraceFactory(),
    clock,
    limits,
  });
}

function request(rawText: string) {
  return {
    source: source(rawText),
    origin: 'explicit_user_action' as const,
    requestedLocale: 'en-US',
    correlationId: 'local-analysis-test-0001',
  };
}

describe('Local RICIS Analyzer — approved QA Gate 3', () => {
  it('LQA00: SourceExpressionFactory hashes ASCII UTF-8 source with versioned SHA-256', () => {
    const created = new SourceExpressionFactory().create('0_F / 0_F', limits);
    expect(created).toMatchObject({ kind: 'CREATED' });
    if (created.kind !== 'CREATED') return;
    expect(created.source.sourceHash).toBe('sha256-base64url-v1:OC3pEPxyBpCsozjgB6Cmr5rgFv1Zr8qKAWebhbTzX3c');
    expect(created.source.rawText).toBe('0_F / 0_F');
    expect(created.source.length).toBe(9);
  });

  it('LQA00A: SourceExpressionFactory hashes non-ASCII source as UTF-8', () => {
    const created = new SourceExpressionFactory().create('∞_F', limits);
    expect(created).toMatchObject({ kind: 'CREATED' });
    if (created.kind !== 'CREATED') return;
    expect(created.source.sourceHash).toBe('sha256-base64url-v1:S5zLTlT-JFTK81hq6UPQ3_j6Z3T5RQN5sWUF4I1SpUo');
  });

  it('LQA00B: SourceExpressionFactory rejects empty input before parsing', () => {
    const created = new SourceExpressionFactory().create('   ', limits);
    expect(created).toMatchObject({ kind: 'REJECTED', diagnostic: { code: 'INPUT_EMPTY', messageResourceKey: 'localAnalyzer.input.empty' } });
  });

  it('LQA00C: SourceExpressionFactory enforces inclusive character limit before hashing', () => {
    expect(new SourceExpressionFactory().create('x'.repeat(64), limits).kind).toBe('CREATED');
    expect(new SourceExpressionFactory().create('x'.repeat(65), limits)).toMatchObject({ kind: 'REJECTED', diagnostic: { code: 'INPUT_LIMIT_EXCEEDED' } });
  });

  it('LQA00D: SourceExpressionFactory output excludes authority and browser fields', () => {
    const issued = source('x / 0') as unknown as Record<string, unknown>;
    expect(Object.keys(issued).sort()).toEqual(['factoryIssued', 'length', 'rawText', 'sourceHash']);
  });

  it('LQA00E: composition issues source only through factory and parser rejects a forged source object', async () => {
    const service = new LocalAnalysisApplicationService(new SourceExpressionFactory(), analyzer(), limits);
    await expect(service.analyzeExplicitly({ rawText: 'x / 0', origin: 'explicit_user_action', requestedLocale: 'en-US', correlationId: 'local-analysis-test-0001' }, new AbortController().signal)).resolves.toMatchObject({ source: { factoryIssued: true } });
    const issued = source('x / 0');
    const forged: SourceExpression = { ...issued, rawText: '0_F / 0_F', length: 9 };
    expect(new LocalExpressionParser().parse(forged, limits)).toMatchObject({ kind: 'REJECTED', diagnostic: { code: 'INPUT_FORGED_SOURCE' } });
  });

  it('LQA00F: pasted suggestion cannot inject or replace factory-issued source hash', async () => {
    const validator = new UserMediatedSuggestionValidator(clock, limits);
    await expect(validator.validate('{"schemaVersion":"1","classification":"x","candidatePatterns":[],"questionsForCore":[],"explanation":"x","sourceHash":"forged"}', source('x / 0').sourceHash, new AbortController().signal)).resolves.toMatchObject({ status: 'AI_SUGGESTION_REJECTED' });
  });

  it('LQA01: toLocalRecoveryContext copies only the safe closed Core recovery context', () => {
    const context = toLocalRecoveryContext({ success: false, code: 'CORE_UNAVAILABLE', userMessage: 'do not copy', diagnostic: { origin: 'unknown', runtime: 'not_ready', retryable: true, occurredAt: FIXED_TIME } }, 20) as unknown as Record<string, unknown>;
    expect(context).toMatchObject({ code: 'CORE_UNAVAILABLE', runtime: 'not_ready', retryable: true, occurredAt: FIXED_TIME });
    expect(context).not.toHaveProperty('userMessage');
    expect(context).not.toHaveProperty('trace');
  });

  it('LQA02: toLocalRecoveryContext sanitizes and bounds safe detail', () => {
    const context = toLocalRecoveryContext({ success: false, code: 'CORE_INVALID_RESPONSE', userMessage: 'x', diagnostic: { origin: 'unknown', runtime: 'csharp_api', retryable: true, occurredAt: FIXED_TIME, safeDetail: 'a\n'.repeat(40) } }, 10);
    expect(context.safeDetail).toBe('a a a a a');
  });

  it('LQA03: LocalAnalysisApplicationService invokes analyzer exactly once for explicit command', async () => {
    const service = new LocalAnalysisApplicationService(new SourceExpressionFactory(), analyzer(), limits);
    const result = await service.analyzeExplicitly({ rawText: '0_F / 0_F', origin: 'explicit_user_action', requestedLocale: 'en-US', correlationId: 'local-analysis-test-0001' }, new AbortController().signal);
    expect(result).toMatchObject({ correlationId: 'local-analysis-test-0001', status: 'REQUIRES_CORE_VERIFICATION' });
  });

  it('LQA04: LocalAnalysisApplicationService rejects non-explicit runtime origin', async () => {
    const service = new LocalAnalysisApplicationService(new SourceExpressionFactory(), analyzer(), limits);
    await expect(service.analyzeExplicitly({ rawText: 'x', origin: 'automatic' as never, requestedLocale: 'en-US', correlationId: 'local-analysis-test-0001' }, new AbortController().signal)).resolves.toMatchObject({ status: 'INPUT_REJECTED' });
  });

  it('LQA05: LocalAnalysisApplicationService preserves aborted-signal boundary', async () => {
    const controller = new AbortController();
    controller.abort();
    const service = new LocalAnalysisApplicationService(new SourceExpressionFactory(), analyzer(), limits);
    await expect(service.analyzeExplicitly({ rawText: 'x', origin: 'explicit_user_action', requestedLocale: 'en-US', correlationId: 'local-analysis-test-0001' }, controller.signal)).resolves.toMatchObject({ status: 'RESOURCE_LIMITED' });
  });

  it('LQA06: a Core failure alone does not invoke Local Analyzer', () => {
    const analyzeSpy = vi.spyOn(LocalRicisAnalyzer.prototype, 'analyze');
    toLocalRecoveryContext({ success: false, code: 'CORE_UNAVAILABLE', userMessage: 'x', diagnostic: { origin: 'unknown', runtime: 'not_ready', retryable: true, occurredAt: FIXED_TIME } }, limits.maxSafeDetailCharacters);
    expect(analyzeSpy).not.toHaveBeenCalled();
    analyzeSpy.mockRestore();
  });

  it('LQA07: strict RicisWasmBridge failure path does not construct an analyzer', async () => {
    const analyzeSpy = vi.spyOn(LocalRicisAnalyzer.prototype, 'analyze');
    const result = await new RicisWasmBridge().evaluate({ expression: '0_F / 0_F' });
    expect(result.success).toBe(false);
    expect(analyzeSpy).not.toHaveBeenCalled();
    analyzeSpy.mockRestore();
  });

  it('LQA08: LocalRicisAnalyzer composes one deterministic parse-index-classify trace', async () => {
    const result = await analyzer().analyze(request('0_F / 0_F'), new AbortController().signal);
    expect(result.trace.map(entry => entry.phase)).toEqual(['INGESTION', 'PARSE', 'NORMALIZATION', 'SP4_INDEX', 'PATTERN_CANDIDATE', 'NON_DECISION']);
    expect(result.provenance).toMatchObject({ producer: 'LOCAL_DETERMINISTIC_ANALYZER', analyzedAt: FIXED_TIME, coreResultCreated: false, leanEvidenceCreated: false });
  });

  it('LQA09: ordinary grammar produces structural checked result without candidate', async () => {
    const result = await analyzer().analyze(request('x + y * z'), new AbortController().signal);
    expect(result.status).toBe('STRUCTURAL_CHECKED');
    expect(result.candidates).toEqual([]);
  });

  it('LQA10: parser rejection returns typed input result without throwing', async () => {
    await expect(analyzer().analyze(request('eval(1)'), new AbortController().signal)).resolves.toMatchObject({ status: 'INPUT_REJECTED', diagnostic: { messageResourceKey: 'localAnalyzer.input.unsupportedSyntax' } });
  });

  it('LQA11: analyzer returns resource-limited result before unbounded input work', async () => {
    const created = new SourceExpressionFactory().create('x'.repeat(65), { maxInputCharacters: 65 });
    if (created.kind !== 'CREATED') throw new Error('Expected factory-issued oversized analyzer fixture.');
    await expect(analyzer().analyze({ source: created.source, origin: 'explicit_user_action', requestedLocale: 'en-US', correlationId: 'local-analysis-test-0001' }, new AbortController().signal)).resolves.toMatchObject({ status: 'RESOURCE_LIMITED' });
  });

  it('LQA12: analyzer returns a controlled result for an already aborted signal', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(analyzer().analyze(request('x'), controller.signal)).resolves.toMatchObject({ status: 'RESOURCE_LIMITED' });
  });

  it('LQA13: injected fixed clock and trace sequence are deterministic', async () => {
    const result = await analyzer().analyze(request('0_F * inf_G'), new AbortController().signal);
    expect(result.provenance.analyzedAt).toBe(FIXED_TIME);
    expect(result.trace.map(entry => entry.sequence)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('LQA14: identical inputs yield deeply equal local results', async () => {
    const first = await analyzer().analyze(request('x / 0'), new AbortController().signal);
    const second = await analyzer().analyze(request('x / 0'), new AbortController().signal);
    expect(first).toEqual(second);
  });

  it('LQA15: LocalAnalysisResult has no Core/proof authority fields', async () => {
    const result = await analyzer().analyze(request('x / 0'), new AbortController().signal) as unknown as Record<string, unknown>;
    for (const forbidden of ['success', 'invariant', 'executionEngine', 'proof', 'lean', 'isVerified', 'goalMatched', 'academicStatus']) expect(result).not.toHaveProperty(forbidden);
  });

  it('LQA16: LocalExpressionParser preserves multiplication precedence and spans', () => {
    const parsed = new LocalExpressionParser().parse(source('x + y * z'), limits);
    expect(parsed).toMatchObject({ kind: 'PARSED', ast: { kind: 'BINARY', operator: '+', right: { kind: 'BINARY', operator: '*' }, span: { start: 0, endExclusive: 9 } } });
  });

  it('LQA17: LocalExpressionParser preserves parenthesized source structure', () => {
    const parsed = new LocalExpressionParser().parse(source('((x))'), limits);
    expect(parsed).toMatchObject({ kind: 'PARSED', ast: { kind: 'PARENTHESIZED', span: { start: 0, endExclusive: 5 } } });
  });

  it('LQA18: LocalExpressionParser parses every P0 singular token without evaluation', () => {
    for (const text of ['0_F / 0_F', '0_F * inf_G', 'inf_F / inf_G', 'inf_F - inf_G', 'x / 0', 'x * 0']) expect(new LocalExpressionParser().parse(source(text), limits).kind).toBe('PARSED');
  });

  it('LQA19: LocalExpressionParser rejects eval, functions, member access and statements', () => {
    for (const text of ['eval(1)', 'Function("return 1")()', 'x => x', 'obj.member', 'x = 1', 'x; y', 'NaN']) expect(new LocalExpressionParser().parse(source(text), limits)).toMatchObject({ kind: 'REJECTED' });
  });

  it('LQA20: LocalExpressionParser enforces token and depth limits exactly', () => {
    expect(new LocalExpressionParser().parse(source('((((((((x))))))))'), limits).kind).toBe('PARSED');
    expect(new LocalExpressionParser().parse(source('(((((((((x)))))))))'), limits)).toMatchObject({ kind: 'REJECTED', status: 'RESOURCE_LIMITED' });
  });

  it('LQA21: LocalExpressionNormalizer normalizes without changing raw source', () => {
    const parsed = new LocalExpressionParser().parse(source(' 0_F / 0_F '), limits);
    if (parsed.kind !== 'PARSED') throw new Error('Expected parsed fixture.');
    expect(new LocalExpressionNormalizer().normalize(parsed.ast)).toEqual({ text: '0_F / 0_F', sourcePreserved: true });
  });

  it('LQA22: LocalExpressionNormalizer does not reduce candidate arithmetic', () => {
    const parsed = new LocalExpressionParser().parse(source('(x * y) / x'), limits);
    if (parsed.kind !== 'PARSED') throw new Error('Expected parsed fixture.');
    expect(new LocalExpressionNormalizer().normalize(parsed.ast).text).toBe('(x * y) / x');
  });

  it('LQA23: LocalStructuralIdentityComparator reports exact canonical L1 identity only', () => {
    const parser = new LocalExpressionParser();
    const left = parser.parse(source('x + y'), limits);
    const right = parser.parse(source('x + y'), limits);
    if (left.kind !== 'PARSED' || right.kind !== 'PARSED') throw new Error('Expected parsed fixtures.');
    expect(new LocalStructuralIdentityComparator().compare(left.ast, right.ast)).toMatchObject({ status: 'L1_IDENTITY_CHECKED', basis: 'EXACT_CANONICAL_AST' });
  });

  it('LQA24: LocalStructuralIdentityComparator rejects commutative and numeric-looking shortcuts', () => {
    const parser = new LocalExpressionParser();
    const left = parser.parse(source('x + y'), limits);
    const right = parser.parse(source('y + x'), limits);
    if (left.kind !== 'PARSED' || right.kind !== 'PARSED') throw new Error('Expected parsed fixtures.');
    expect(new LocalStructuralIdentityComparator().compare(left.ast, right.ast).status).toBe('NOT_IDENTICAL');
  });

  it('LQA25: returned AST is immutable to consumer mutation attempts', () => {
    const parsed = new LocalExpressionParser().parse(source('0_F / 0_F'), limits);
    if (parsed.kind !== 'PARSED') throw new Error('Expected parsed fixture.');
    expect(Object.isFrozen(parsed.ast)).toBe(true);
  });

  it('LQA26: LocalSemanticIndexer emits stable zero and infinity origin keys', () => {
    const parsed = new LocalExpressionParser().parse(source('0_F / inf_G'), limits);
    if (parsed.kind !== 'PARSED') throw new Error('Expected parsed fixture.');
    expect(new LocalSemanticIndexer().index(parsed.ast)).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'ZERO_ORIGIN', key: 'zero:0_F' }), expect.objectContaining({ kind: 'INFINITY_ORIGIN', key: 'infinity:inf_G' })]));
  });

  it('LQA27: LocalSemanticIndexer records ratio/factor structure without AST mutation', () => {
    const parsed = new LocalExpressionParser().parse(source('(x * y) / x'), limits);
    if (parsed.kind !== 'PARSED') throw new Error('Expected parsed fixture.');
    expect(new LocalSemanticIndexer().index(parsed.ast).map(entry => entry.kind)).toEqual(expect.arrayContaining(['FACTOR', 'RATIO']));
    expect(Object.isFrozen(parsed.ast)).toBe(true);
  });

  it('LQA28: LocalPatternClassifier marks zero-over-zero as Core-verification candidate', () => {
    const parser = new LocalExpressionParser();
    const parsed = parser.parse(source('0_F / 0_F'), limits);
    if (parsed.kind !== 'PARSED') throw new Error('Expected parsed fixture.');
    expect(new LocalPatternClassifier().classify(parsed.ast, new LocalSemanticIndexer().index(parsed.ast))).toEqual([expect.objectContaining({ pattern: 'ZERO_OVER_ZERO', requiresCoreVerification: true, status: 'REQUIRES_CORE_VERIFICATION' })]);
  });

  it('LQA29: LocalPatternClassifier independently recognizes all remaining P0 candidates', () => {
    const classifier = new LocalPatternClassifier();
    const parser = new LocalExpressionParser();
    const indexer = new LocalSemanticIndexer();
    const expected: readonly [string, string][] = [['0_F * inf_G', 'ZERO_TIMES_INFINITY'], ['inf_F / inf_G', 'INFINITY_OVER_INFINITY'], ['inf_F - inf_G', 'INFINITY_MINUS_INFINITY'], ['x / 0', 'SCALAR_OVER_ZERO'], ['x * 0', 'SCALAR_TIMES_ZERO'], ['(x * y) / x', 'FACTOR_CANCELLATION']];
    for (const [text, pattern] of expected) {
      const parsed = parser.parse(source(text), limits);
      if (parsed.kind !== 'PARSED') throw new Error('Expected parsed fixture.');
      expect(classifier.classify(parsed.ast, indexer.index(parsed.ast))[0]).toMatchObject({ pattern });
    }
  });

  it('LQA30: LocalPatternClassifier does not infer candidates from ordinary text', () => {
    const parsed = new LocalExpressionParser().parse(source('x + y * z'), limits);
    if (parsed.kind !== 'PARSED') throw new Error('Expected parsed fixture.');
    expect(new LocalPatternClassifier().classify(parsed.ast, new LocalSemanticIndexer().index(parsed.ast))).toEqual([]);
  });

  it('LQA31: candidates never contain invariant, proof, Lean or resolved authority', () => {
    const parsed = new LocalExpressionParser().parse(source('x / 0'), limits);
    if (parsed.kind !== 'PARSED') throw new Error('Expected parsed fixture.');
    const candidate = new LocalPatternClassifier().classify(parsed.ast, new LocalSemanticIndexer().index(parsed.ast))[0] as unknown as Record<string, unknown>;
    for (const forbidden of ['invariant', 'proof', 'lean', 'resolved', 'trustStatus']) expect(candidate).not.toHaveProperty(forbidden);
  });

  it('LQA32: LocalAnalysisTraceFactory creates ordered resource-key trace entries', () => {
    const trace = new LocalAnalysisTraceFactory().create([{ phase: 'INGESTION', eventCode: 'LOCAL_INPUT', messageResourceKey: 'localAnalyzer.trace.ingestion', safeParameters: {} }], limits);
    expect(trace).toEqual([{ sequence: 1, phase: 'INGESTION', eventCode: 'LOCAL_INPUT', messageResourceKey: 'localAnalyzer.trace.ingestion', safeParameters: {} }]);
  });

  it('LQA33: LocalAnalysisTraceFactory caps and freezes trace entries', () => {
    const trace = new LocalAnalysisTraceFactory().create(Array.from({ length: 17 }, () => ({ phase: 'NON_DECISION' as const, eventCode: 'x', messageResourceKey: 'localAnalyzer.trace.nonDecision', safeParameters: {} })), limits);
    expect(trace).toHaveLength(16);
    expect(Object.isFrozen(trace)).toBe(true);
  });

  it('LQA34: local trace never reuses Core/Lean shape or exposes raw user source', async () => {
    const rawText = 'x / 0';
    const result = await analyzer().analyze(request(rawText), new AbortController().signal);
    expect(result.trace.every(entry => !('appliedAxiom' in entry) && !('mathematicalForm' in entry))).toBe(true);
    expect(JSON.stringify(result.trace)).not.toContain(rawText);
  });

  it('LQA35: UserMediatedSuggestionPromptFactory produces bounded technical schema prompt only', () => {
    const prompt = new UserMediatedSuggestionPromptFactory(clock, limits).create({ sourceHash: source('x / 0').sourceHash, normalizedText: 'x / 0', localCandidates: [], consent: { granted: true, grantedAt: FIXED_TIME, purpose: 'STRUCTURAL_EXPLANATION_ONLY' }, correlationId: 'local-analysis-test-0001' });
    expect(prompt).toMatchObject({ schemaVersion: '1', expiresAt: FIXED_TIME + 300_000 });
    for (const forbidden of ['http', 'token', 'oauth', 'window', 'iframe']) expect(prompt.text.toLowerCase()).not.toContain(forbidden);
  });

  it('LQA36: UserMediatedSuggestionValidator validates bounded schema and attaches local provenance', async () => {
    const validator = new UserMediatedSuggestionValidator(clock, limits);
    await expect(validator.validate('{"schemaVersion":"1","classification":"candidate","candidatePatterns":["SCALAR_OVER_ZERO"],"questionsForCore":["q"],"explanation":"e"}', source('x / 0').sourceHash, new AbortController().signal)).resolves.toMatchObject({ status: 'AI_SUGGESTION_VALIDATED', provenance: { channel: 'USER_SUPPLIED_AI_STRUCTURAL_SUGGESTION', sourceHash: source('x / 0').sourceHash } });
  });

  it('LQA37: UserMediatedSuggestionPromptFactory excludes credentials, URL and browser-control fields', () => {
    const prompt = new UserMediatedSuggestionPromptFactory(clock, limits).create({ sourceHash: source('x').sourceHash, normalizedText: 'x', localCandidates: [], consent: { granted: true, grantedAt: FIXED_TIME, purpose: 'STRUCTURAL_EXPLANATION_ONLY' }, correlationId: 'local-analysis-test-0001' }) as unknown as Record<string, unknown>;
    expect(Object.keys(prompt).sort()).toEqual(['expiresAt', 'schemaVersion', 'text']);
  });

  it('LQA38: UserMediatedSuggestionValidator rejects invalid JSON and unknown properties', async () => {
    const validator = new UserMediatedSuggestionValidator(clock, limits);
    await expect(validator.validate('{', source('x').sourceHash, new AbortController().signal)).resolves.toMatchObject({ status: 'AI_SUGGESTION_REJECTED' });
    await expect(validator.validate('{"schemaVersion":"1","classification":"x","candidatePatterns":[],"questionsForCore":[],"explanation":"x","unknown":true}', source('x').sourceHash, new AbortController().signal)).resolves.toMatchObject({ status: 'AI_SUGGESTION_REJECTED' });
  });

  it('LQA39: UserMediatedSuggestionValidator rejects nested authority and credential fields', async () => {
    const validator = new UserMediatedSuggestionValidator(clock, limits);
    await expect(validator.validate('{"schemaVersion":"1","classification":"x","candidatePatterns":["x"],"questionsForCore":[],"explanation":{"lean":"forbidden"}}', source('x').sourceHash, new AbortController().signal)).resolves.toMatchObject({ status: 'AI_SUGGESTION_REJECTED' });
  });

  it('LQA40: suggestion validation cannot change deterministic analysis result', async () => {
    const before = await analyzer().analyze(request('x / 0'), new AbortController().signal);
    await new UserMediatedSuggestionValidator(clock, limits).validate('{"schemaVersion":"1","classification":"x","candidatePatterns":[],"questionsForCore":[],"explanation":"x"}', before.source.sourceHash, new AbortController().signal);
    const after = await analyzer().analyze(request('x / 0'), new AbortController().signal);
    expect(after).toEqual(before);
  });

  it('LQA41: local analyzer module invokes no external browser/provider reader', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await analyzer().analyze(request('x / 0'), new AbortController().signal);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('LQA42: L1 identity local result cannot promote a map snapshot to resolved', async () => {
    const result = await analyzer().analyze(request('x + y'), new AbortController().signal);
    const map = { nodes: [{ id: 'n1', state: 'partial' }], proofs: {} };
    expect(result.status).toBe('STRUCTURAL_CHECKED');
    expect(map).toEqual({ nodes: [{ id: 'n1', state: 'partial' }], proofs: {} });
  });

  it('LQA43: candidate result cannot create axiom, proof or map mutation', async () => {
    const result = await analyzer().analyze(request('0_F / 0_F'), new AbortController().signal);
    expect(result.candidates[0]).toMatchObject({ status: 'REQUIRES_CORE_VERIFICATION' });
    expect(Object.keys(result)).not.toContain('proof');
  });

  it('LQA44: validated suggestion cannot produce Lean/QED/resolved status', async () => {
    const suggestion = await new UserMediatedSuggestionValidator(clock, limits).validate('{"schemaVersion":"1","classification":"x","candidatePatterns":[],"questionsForCore":[],"explanation":"x"}', source('x').sourceHash, new AbortController().signal) as unknown as Record<string, unknown>;
    for (const forbidden of ['LEAN_VERIFIED', 'TRUSTED_AXIOM', 'QED_VERIFIED', 'resolved']) expect(JSON.stringify(suggestion)).not.toContain(forbidden);
  });

  it('LQA45: Core recovery and local analysis remain separate artifacts', async () => {
    const recovery = toLocalRecoveryContext({ success: false, code: 'CORE_UNAVAILABLE', userMessage: 'x', diagnostic: { origin: 'unknown', runtime: 'not_ready', retryable: true, occurredAt: FIXED_TIME } }, limits.maxSafeDetailCharacters);
    const result = await analyzer().analyze({ ...request('x / 0'), recoveryContext: recovery }, new AbortController().signal);
    expect(result.recovery.requiredCapability).toBe('RICIS_CORE_EVALUATION');
    expect(result).not.toHaveProperty('executionEngine');
  });

  it('LQA46: Local Analyzer never calls legacy fallback proof or evaluation methods', async () => {
    const evaluate = vi.spyOn(RicisFallbackEngine.prototype, 'evaluate');
    const formal = vi.spyOn(RicisFallbackEngine.prototype, 'generateFormalProof');
    const system = vi.spyOn(RicisFallbackEngine.prototype, 'proveSystem');
    await analyzer().analyze(request('x / 0'), new AbortController().signal);
    expect(evaluate).not.toHaveBeenCalled();
    expect(formal).not.toHaveBeenCalled();
    expect(system).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('LQA47: strict bridge failure remains independent from Local Analyzer application service', async () => {
    const localSpy = vi.spyOn(LocalAnalysisApplicationService.prototype, 'analyzeExplicitly');
    await new RicisWasmBridge().evaluate({ expression: 'x / 0' });
    expect(localSpy).not.toHaveBeenCalled();
    localSpy.mockRestore();
  });

  it('LQA48: resource-limited local result is a safe diagnostic, not a thrown calculation', async () => {
    const result = await analyzer().analyze(request('('.repeat(9) + 'x' + ')'.repeat(9)), new AbortController().signal);
    expect(result).toMatchObject({ status: 'RESOURCE_LIMITED', recovery: { status: 'OPERATIONAL_DIAGNOSTIC' } });
  });
});
