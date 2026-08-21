import {
  type ILocalAnalysisApplicationService,
  type ILocalAnalysisClock,
  type ILocalAnalysisTraceFactory,
  type ILocalExpressionNormalizer,
  type ILocalExpressionParser,
  type ILocalPatternClassifier,
  type ILocalRicisAnalyzer,
  type ILocalSemanticIndexer,
  type ILocalStructuralIdentityComparator,
  type ISourceExpressionFactory,
  type IUserMediatedSuggestionPromptFactory,
  type IUserMediatedSuggestionValidator,
  type LocalAnalysisCommand,
  type LocalAnalysisRequest,
  type LocalAnalysisResult,
  type LocalAnalyzerDependencies,
  type LocalAnalyzerLimits,
  type LocalCandidatePattern,
  type LocalExpressionNode,
  type LocalInputDiagnostic,
  type LocalParseOutcome,
  type LocalPatternCandidate,
  type LocalSemanticIndexEntry,
  type LocalSuggestionEnvelope,
  type LocalSuggestionProvenance,
  type LocalStructuralIdentity,
  type NormalizedExpression,
  type SourceExpression,
  type SourceExpressionCreationOutcome,
  type SourceSpan,
  type StructuralSuggestionRequest,
  type UserMediatedSuggestionPrompt,
} from './contracts';

const HASH_PREFIX = 'sha256-base64url-v1:';
const SUGGESTION_TTL_MILLISECONDS = 300_000;
const MAX_SUGGESTION_TEXT_LENGTH = 240;
const MAX_SUGGESTION_ARRAY_LENGTH = 16;
const FACTORY_ISSUED_SOURCES = new WeakSet<object>();

export const DEFAULT_LOCAL_ANALYZER_LIMITS: Readonly<LocalAnalyzerLimits> = Object.freeze({
  maxInputCharacters: 4_096,
  maxTokenCount: 1_024,
  maxAstDepth: 64,
  maxTraceEntries: 128,
  maxSafeDetailCharacters: 240,
});

function isFactoryIssuedSourceExpression(value: unknown): value is SourceExpression {
  if (!value || typeof value !== 'object') return false;
  const source = value as Partial<SourceExpression>;
  return FACTORY_ISSUED_SOURCES.has(value)
    && source.factoryIssued === true
    && typeof source.rawText === 'string'
    && typeof source.sourceHash === 'string'
    && source.sourceHash.startsWith(HASH_PREFIX)
    && typeof source.length === 'number'
    && source.length === source.rawText.length;
}

const SHA256_CONSTANTS = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function freeze<T>(value: T): T {
  return Object.freeze(value);
}

function frozenArray<T>(values: readonly T[]): readonly T[] {
  return freeze(values.map(value => value));
}

function diagnostic(
  code: LocalInputDiagnostic['code'],
  messageResourceKey: string,
  safeParameters: Readonly<Record<string, string>> = {},
  position?: number,
): LocalInputDiagnostic {
  return freeze({
    code,
    messageResourceKey,
    safeParameters: freeze({ ...safeParameters }),
    ...(position === undefined ? {} : { position }),
  });
}

function rotateRight(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/** Synchronous SHA-256 keeps the approved SourceExpressionFactory DI contract deterministic. */
function sha256Base64Url(rawText: string): string {
  const input = new TextEncoder().encode(rawText);
  const bitLength = input.length * 8;
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const data = new Uint8Array(paddedLength);
  data.set(input);
  data[input.length] = 0x80;
  data[paddedLength - 4] = (bitLength >>> 24) & 0xff;
  data[paddedLength - 3] = (bitLength >>> 16) & 0xff;
  data[paddedLength - 2] = (bitLength >>> 8) & 0xff;
  data[paddedLength - 1] = bitLength & 0xff;

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const words = new Uint32Array(64);

  for (let offset = 0; offset < data.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const start = offset + index * 4;
      words[index] = ((data[start]! << 24) | (data[start + 1]! << 16) | (data[start + 2]! << 8) | data[start + 3]!) >>> 0;
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotateRight(words[index - 15]!, 7) ^ rotateRight(words[index - 15]!, 18) ^ (words[index - 15]! >>> 3);
      const s1 = rotateRight(words[index - 2]!, 17) ^ rotateRight(words[index - 2]!, 19) ^ (words[index - 2]! >>> 10);
      words[index] = (words[index - 16]! + s0 + words[index - 7]! + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;
    for (let index = 0; index < 64; index += 1) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choose = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + choose + SHA256_CONSTANTS[index]! + words[index]!) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const output = new Uint8Array(32);
  const hash = [h0, h1, h2, h3, h4, h5, h6, h7];
  hash.forEach((word, wordIndex) => {
    output[wordIndex * 4] = word >>> 24;
    output[wordIndex * 4 + 1] = (word >>> 16) & 0xff;
    output[wordIndex * 4 + 2] = (word >>> 8) & 0xff;
    output[wordIndex * 4 + 3] = word & 0xff;
  });
  return `${HASH_PREFIX}${base64Url(output)}`;
}

export class SourceExpressionFactory implements ISourceExpressionFactory {
  public create(rawText: string, limit: Pick<LocalAnalyzerLimits, 'maxInputCharacters'>): SourceExpressionCreationOutcome {
    if (rawText.trim().length === 0) {
      return freeze({ kind: 'REJECTED', diagnostic: diagnostic('INPUT_EMPTY', 'localAnalyzer.input.empty') });
    }
    if (rawText.length > limit.maxInputCharacters) {
      return freeze({ kind: 'REJECTED', diagnostic: diagnostic('INPUT_LIMIT_EXCEEDED', 'localAnalyzer.input.limit', { limit: String(limit.maxInputCharacters) }) });
    }
    const source: SourceExpression = freeze({
      rawText,
      sourceHash: sha256Base64Url(rawText),
      length: rawText.length,
      factoryIssued: true,
    });
    FACTORY_ISSUED_SOURCES.add(source);
    return freeze({ kind: 'CREATED', source });
  }
}

type TokenKind = 'IDENTIFIER' | 'FINITE_LITERAL' | 'SINGULARITY_SYMBOL' | 'OPERATOR' | 'PARENTHESIS' | 'EOF';
interface Token {
  readonly kind: TokenKind;
  readonly lexeme: string;
  readonly span: SourceSpan;
}

class ParseFailure extends Error {
  public constructor(
    readonly status: 'INPUT_REJECTED' | 'UNSUPPORTED_EXPRESSION' | 'RESOURCE_LIMITED',
    readonly value: LocalInputDiagnostic,
  ) {
    super(value.code);
  }
}

export class LocalExpressionParser implements ILocalExpressionParser {
  public parse(source: SourceExpression, limits: LocalAnalyzerLimits): LocalParseOutcome {
    if (!isFactoryIssuedSourceExpression(source)) {
      return freeze({ kind: 'REJECTED', status: 'INPUT_REJECTED', diagnostic: diagnostic('INPUT_FORGED_SOURCE', 'localAnalyzer.input.forgedSource') });
    }
    if (source.rawText.length > limits.maxInputCharacters) {
      return freeze({ kind: 'REJECTED', status: 'RESOURCE_LIMITED', diagnostic: diagnostic('INPUT_LIMIT_EXCEEDED', 'localAnalyzer.input.limit', { limit: String(limits.maxInputCharacters) }) });
    }
    try {
      const tokens = this.tokenize(source.rawText, limits);
      let cursor = 0;
      const current = (): Token => tokens[cursor]!;
      const consume = (): Token => tokens[cursor++]!;
      const acceptOperator = (operator: '+' | '-' | '*' | '/'): Token | undefined => {
        const token = current();
        if (token.kind === 'OPERATOR' && token.lexeme === operator) return consume();
        return undefined;
      };
      const parseExpression = (depth: number): LocalExpressionNode => {
        let left = parseTerm(depth);
        while (true) {
          const token = acceptOperator('+') ?? acceptOperator('-');
          if (!token) return left;
          const right = parseTerm(depth);
          left = freeze({ kind: 'BINARY', operator: token.lexeme as '+' | '-', left, right, span: freeze({ start: left.span.start, endExclusive: right.span.endExclusive }), canonical: `${left.canonical} ${token.lexeme} ${right.canonical}` });
        }
      };
      const parseTerm = (depth: number): LocalExpressionNode => {
        let left = parsePrimary(depth);
        while (true) {
          const token = acceptOperator('*') ?? acceptOperator('/');
          if (!token) return left;
          const right = parsePrimary(depth);
          left = freeze({ kind: 'BINARY', operator: token.lexeme as '*' | '/', left, right, span: freeze({ start: left.span.start, endExclusive: right.span.endExclusive }), canonical: `${left.canonical} ${token.lexeme} ${right.canonical}` });
        }
      };
      const parsePrimary = (depth: number): LocalExpressionNode => {
        if (depth > limits.maxAstDepth) throw this.failure('RESOURCE_LIMITED', 'INPUT_LIMIT_EXCEEDED', 'localAnalyzer.input.depthLimit', current().span.start);
        const unary = acceptOperator('+') ?? acceptOperator('-');
        if (unary) {
          const operand = parsePrimary(depth + 1);
          return freeze({ kind: 'UNARY', operator: unary.lexeme as '+' | '-', operand, span: freeze({ start: unary.span.start, endExclusive: operand.span.endExclusive }), canonical: `${unary.lexeme}${operand.canonical}` });
        }
        const token = consume();
        if (token.kind === 'PARENTHESIS' && token.lexeme === '(') {
          const expression = parseExpression(depth + 1);
          const closing = consume();
          if (closing.kind !== 'PARENTHESIS' || closing.lexeme !== ')') throw this.failure('INPUT_REJECTED', 'INPUT_INVALID_ENCODING', 'localAnalyzer.input.unbalancedParenthesis', closing.span.start);
          return freeze({ kind: 'PARENTHESIZED', expression, span: freeze({ start: token.span.start, endExclusive: closing.span.endExclusive }), canonical: `(${expression.canonical})` });
        }
        if (token.kind === 'IDENTIFIER') return freeze({ kind: 'IDENTIFIER', name: token.lexeme, span: token.span, canonical: token.lexeme });
        if (token.kind === 'FINITE_LITERAL') return freeze({ kind: 'FINITE_LITERAL', lexeme: token.lexeme, span: token.span, canonical: token.lexeme });
        if (token.kind === 'SINGULARITY_SYMBOL') return freeze({ kind: 'SINGULARITY_SYMBOL', symbol: token.lexeme.startsWith('0_') ? '0_F' : 'inf_F', originLabel: token.lexeme, span: token.span, canonical: token.lexeme });
        throw this.failure('INPUT_REJECTED', 'INPUT_INVALID_ENCODING', 'localAnalyzer.input.unexpectedToken', token.span.start);
      };

      const ast = parseExpression(0);
      if (current().kind !== 'EOF') throw this.failure('UNSUPPORTED_EXPRESSION', 'INPUT_INVALID_ENCODING', 'localAnalyzer.input.unsupportedSyntax', current().span.start);
      return freeze({ kind: 'PARSED', ast });
    } catch (error) {
      if (error instanceof ParseFailure) return freeze({ kind: 'REJECTED', status: error.status, diagnostic: error.value });
      return freeze({ kind: 'REJECTED', status: 'INPUT_REJECTED', diagnostic: diagnostic('INPUT_INVALID_ENCODING', 'localAnalyzer.input.invalidEncoding') });
    }
  }

  private tokenize(rawText: string, limits: LocalAnalyzerLimits): readonly Token[] {
    const tokens: Token[] = [];
    let cursor = 0;
    const add = (kind: TokenKind, lexeme: string, start: number, endExclusive: number): void => {
      if (tokens.length >= limits.maxTokenCount) throw this.failure('RESOURCE_LIMITED', 'INPUT_LIMIT_EXCEEDED', 'localAnalyzer.input.tokenLimit', start);
      tokens.push(freeze({ kind, lexeme, span: freeze({ start, endExclusive }) }));
    };
    while (cursor < rawText.length) {
      const character = rawText[cursor]!;
      if (/\s/u.test(character)) { cursor += 1; continue; }
      const start = cursor;
      if ('+-*/'.includes(character)) { add('OPERATOR', character, start, ++cursor); continue; }
      if ('()'.includes(character)) { add('PARENTHESIS', character, start, ++cursor); continue; }
      const singular = /^(?:0|inf)_[A-Za-z][A-Za-z0-9_]*/u.exec(rawText.slice(cursor));
      if (singular) { cursor += singular[0].length; add('SINGULARITY_SYMBOL', singular[0], start, cursor); continue; }
      const literal = /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?/u.exec(rawText.slice(cursor));
      if (literal) { cursor += literal[0].length; add('FINITE_LITERAL', literal[0], start, cursor); continue; }
      const identifier = /^[A-Za-z][A-Za-z0-9_]*/u.exec(rawText.slice(cursor));
      if (identifier) {
        cursor += identifier[0].length;
        if (identifier[0] === 'NaN' || identifier[0] === 'Infinity' || identifier[0] === 'eval' || identifier[0] === 'Function') throw this.failure('INPUT_REJECTED', 'INPUT_INVALID_ENCODING', 'localAnalyzer.input.unsupportedSyntax', start);
        add('IDENTIFIER', identifier[0], start, cursor);
        continue;
      }
      throw this.failure('UNSUPPORTED_EXPRESSION', 'INPUT_INVALID_ENCODING', 'localAnalyzer.input.unsupportedSyntax', start);
    }
    add('EOF', '', rawText.length, rawText.length);
    return frozenArray(tokens);
  }

  private failure(
    status: 'INPUT_REJECTED' | 'UNSUPPORTED_EXPRESSION' | 'RESOURCE_LIMITED',
    code: LocalInputDiagnostic['code'],
    resourceKey: string,
    position: number,
  ): ParseFailure {
    return new ParseFailure(status, diagnostic(code, resourceKey, {}, position));
  }
}

export class LocalExpressionNormalizer implements ILocalExpressionNormalizer {
  public normalize(ast: LocalExpressionNode): NormalizedExpression {
    return freeze({ text: ast.canonical, sourcePreserved: true });
  }
}

export class LocalStructuralIdentityComparator implements ILocalStructuralIdentityComparator {
  public compare(left: LocalExpressionNode, right: LocalExpressionNode): LocalStructuralIdentity {
    return freeze({
      status: left.canonical === right.canonical ? 'L1_IDENTITY_CHECKED' : 'NOT_IDENTICAL',
      leftCanonical: left.canonical,
      rightCanonical: right.canonical,
      basis: 'EXACT_CANONICAL_AST',
    });
  }
}

function visit(node: LocalExpressionNode, callback: (value: LocalExpressionNode) => void): void {
  callback(node);
  if (node.kind === 'UNARY') visit(node.operand, callback);
  if (node.kind === 'PARENTHESIZED') visit(node.expression, callback);
  if (node.kind === 'BINARY') { visit(node.left, callback); visit(node.right, callback); }
}

export class LocalSemanticIndexer implements ILocalSemanticIndexer {
  public index(ast: LocalExpressionNode): readonly LocalSemanticIndexEntry[] {
    const entries: LocalSemanticIndexEntry[] = [];
    visit(ast, node => {
      if (node.kind === 'SINGULARITY_SYMBOL') {
        const kind = node.symbol === '0_F' ? 'ZERO_ORIGIN' : 'INFINITY_ORIGIN';
        const prefix = node.symbol === '0_F' ? 'zero' : 'infinity';
        entries.push(freeze({ key: `${prefix}:${node.originLabel}`, kind, span: node.span, canonicalFragment: node.canonical }));
      }
      if (node.kind === 'BINARY' && node.operator === '*') entries.push(freeze({ key: `factor:${node.canonical}`, kind: 'FACTOR', span: node.span, canonicalFragment: node.canonical }));
      if (node.kind === 'BINARY' && node.operator === '/') entries.push(freeze({ key: `ratio:${node.canonical}`, kind: 'RATIO', span: node.span, canonicalFragment: node.canonical }));
    });
    return frozenArray(entries);
  }
}

function unwrap(node: LocalExpressionNode): LocalExpressionNode {
  return node.kind === 'PARENTHESIZED' ? unwrap(node.expression) : node;
}

function singularKind(node: LocalExpressionNode): 'zero' | 'infinity' | undefined {
  const value = unwrap(node);
  if (value.kind !== 'SINGULARITY_SYMBOL') return undefined;
  return value.symbol === '0_F' ? 'zero' : 'infinity';
}

function candidate(pattern: LocalCandidatePattern, node: LocalExpressionNode, preconditions: readonly string[]): LocalPatternCandidate {
  return freeze({
    pattern,
    subjectSpan: node.span,
    preconditions: frozenArray(preconditions),
    requiresCoreVerification: true,
    status: 'REQUIRES_CORE_VERIFICATION',
    rationaleResourceKey: `localAnalyzer.candidate.${pattern}`,
  });
}

export class LocalPatternClassifier implements ILocalPatternClassifier {
  public classify(ast: LocalExpressionNode, _semanticIndex: readonly LocalSemanticIndexEntry[]): readonly LocalPatternCandidate[] {
    const node = unwrap(ast);
    if (node.kind !== 'BINARY') return frozenArray([]);
    const left = singularKind(node.left);
    const right = singularKind(node.right);
    if (node.operator === '/' && left === 'zero' && right === 'zero') return frozenArray([candidate('ZERO_OVER_ZERO', node, ['bothOperandsAreIndexedZeroOrigins'])]);
    if (node.operator === '*' && left === 'zero' && right === 'infinity') return frozenArray([candidate('ZERO_TIMES_INFINITY', node, ['leftIsIndexedZeroOrigin', 'rightIsIndexedInfinityOrigin'])]);
    if (node.operator === '/' && left === 'infinity' && right === 'infinity') return frozenArray([candidate('INFINITY_OVER_INFINITY', node, ['bothOperandsAreIndexedInfinityOrigins'])]);
    if (node.operator === '-' && left === 'infinity' && right === 'infinity') return frozenArray([candidate('INFINITY_MINUS_INFINITY', node, ['bothOperandsAreIndexedInfinityOrigins'])]);
    if (node.operator === '/' && right === undefined && unwrap(node.right).kind === 'FINITE_LITERAL' && unwrap(node.right).canonical === '0') return frozenArray([candidate('SCALAR_OVER_ZERO', node, ['rightOperandIsFiniteZero'])]);
    if (node.operator === '*' && right === undefined && unwrap(node.right).kind === 'FINITE_LITERAL' && unwrap(node.right).canonical === '0') return frozenArray([candidate('SCALAR_TIMES_ZERO', node, ['rightOperandIsFiniteZero'])]);
    const numerator = unwrap(node.left);
    if (node.operator === '/' && numerator.kind === 'BINARY' && numerator.operator === '*') {
      const denominator = unwrap(node.right);
      if (numerator.left.canonical === denominator.canonical || numerator.right.canonical === denominator.canonical) return frozenArray([candidate('FACTOR_CANCELLATION', node, ['denominatorMatchesOneProductFactor'])]);
    }
    return frozenArray([]);
  }
}

export class LocalAnalysisTraceFactory implements ILocalAnalysisTraceFactory {
  public create(entries: readonly Omit<import('./contracts').LocalAnalysisTraceEntry, 'sequence'>[], limits: LocalAnalyzerLimits) {
    return frozenArray(entries.slice(0, limits.maxTraceEntries).map((entry, index) => freeze({ ...entry, sequence: index + 1, safeParameters: freeze({ ...entry.safeParameters }) })));
  }
}

function defaultSuggestion(): LocalSuggestionEnvelope {
  return freeze({ status: 'NOT_REQUESTED', diagnostics: frozenArray([]) });
}

function baseTrace(phase: import('./contracts').LocalAnalysisPhase, eventCode: string, messageResourceKey: string, inputCanonical?: string, outputCanonical?: string) {
  return freeze({ phase, eventCode, messageResourceKey, safeParameters: freeze({}), ...(inputCanonical ? { inputCanonical } : {}), ...(outputCanonical ? { outputCanonical } : {}) });
}

function resultFor(
  request: LocalAnalysisRequest,
  dependencies: LocalAnalyzerDependencies,
  status: import('./contracts').LocalAnalyzerStatus,
  options: {
    readonly ast?: LocalExpressionNode;
    readonly normalized?: NormalizedExpression;
    readonly index?: readonly LocalSemanticIndexEntry[];
    readonly candidates?: readonly LocalPatternCandidate[];
    readonly diagnostic?: LocalInputDiagnostic;
    readonly traceEntries: readonly Omit<import('./contracts').LocalAnalysisTraceEntry, 'sequence'>[];
  },
): LocalAnalysisResult {
  const index = options.index ?? frozenArray([]);
  const candidates = options.candidates ?? frozenArray([]);
  return freeze({
    correlationId: request.correlationId,
    source: request.source,
    ...(options.normalized ? { normalizedSource: options.normalized } : {}),
    status,
    ...(options.ast ? { ast: options.ast } : {}),
    semanticIndex: index,
    candidates,
    trace: dependencies.traceFactory.create(options.traceEntries, dependencies.limits),
    provenance: freeze({ producer: 'LOCAL_DETERMINISTIC_ANALYZER', origin: 'explicit_user_action', analyzedAt: dependencies.clock.now(), analyzerContractVersion: 'v1', coreResultCreated: false, leanEvidenceCreated: false }),
    recovery: freeze({
      status: 'OPERATIONAL_DIAGNOSTIC',
      requiredCapability: 'RICIS_CORE_EVALUATION',
      actionResourceKey: 'localAnalyzer.recovery.retryCore',
      safeHandoff: freeze({ sourceHash: request.source.sourceHash, ...(options.normalized ? { normalizedText: options.normalized.text } : {}), candidatePatterns: frozenArray(candidates.map(item => item.pattern)), semanticIndexKeys: frozenArray(index.map(entry => entry.key)) }),
    }),
    suggestion: defaultSuggestion(),
    ...(options.diagnostic ? { diagnostic: options.diagnostic } : {}),
  });
}

export class LocalRicisAnalyzer implements ILocalRicisAnalyzer {
  public constructor(private readonly dependencies: LocalAnalyzerDependencies) {}

  public async analyze(request: LocalAnalysisRequest, cancellation: AbortSignal): Promise<LocalAnalysisResult> {
    if (cancellation.aborted) return resultFor(request, this.dependencies, 'RESOURCE_LIMITED', { diagnostic: diagnostic('INPUT_CANCELLED', 'localAnalyzer.input.cancelled'), traceEntries: [baseTrace('INGESTION', 'LOCAL_CANCELLED', 'localAnalyzer.trace.cancelled')] });
    const parsed = this.dependencies.parser.parse(request.source, this.dependencies.limits);
    if (parsed.kind === 'REJECTED') return resultFor(request, this.dependencies, parsed.status, { diagnostic: parsed.diagnostic, traceEntries: [baseTrace('INGESTION', 'LOCAL_INPUT', 'localAnalyzer.trace.ingestion'), baseTrace('PARSE', 'LOCAL_PARSE_REJECTED', 'localAnalyzer.trace.parseRejected'), baseTrace('NON_DECISION', 'LOCAL_NON_DECISION', 'localAnalyzer.trace.nonDecision')] });
    if (cancellation.aborted) return resultFor(request, this.dependencies, 'RESOURCE_LIMITED', { ast: parsed.ast, diagnostic: diagnostic('INPUT_CANCELLED', 'localAnalyzer.input.cancelled'), traceEntries: [baseTrace('INGESTION', 'LOCAL_INPUT', 'localAnalyzer.trace.ingestion')] });
    const normalized = this.dependencies.normalizer.normalize(parsed.ast);
    const index = this.dependencies.semanticIndexer.index(parsed.ast);
    const candidates = this.dependencies.patternClassifier.classify(parsed.ast, index);
    const status = candidates.length > 0 ? 'REQUIRES_CORE_VERIFICATION' : 'STRUCTURAL_CHECKED';
    return resultFor(request, this.dependencies, status, {
      ast: parsed.ast,
      normalized,
      index,
      candidates,
      traceEntries: [
        baseTrace('INGESTION', 'LOCAL_INPUT', 'localAnalyzer.trace.ingestion'),
        baseTrace('PARSE', 'LOCAL_PARSE_COMPLETE', 'localAnalyzer.trace.parse'),
        baseTrace('NORMALIZATION', 'LOCAL_NORMALIZE_COMPLETE', 'localAnalyzer.trace.normalization'),
        baseTrace('SP4_INDEX', 'LOCAL_SP4_INDEX_COMPLETE', 'localAnalyzer.trace.sp4'),
        ...(candidates.length > 0 ? [baseTrace('PATTERN_CANDIDATE', 'LOCAL_CANDIDATE_FOUND', 'localAnalyzer.trace.candidate')] : []),
        baseTrace('NON_DECISION', 'LOCAL_NON_DECISION', 'localAnalyzer.trace.nonDecision'),
      ],
    });
  }
}

export class LocalAnalysisApplicationService implements ILocalAnalysisApplicationService {
  public constructor(
    private readonly sourceFactory: ISourceExpressionFactory,
    private readonly localAnalyzer: ILocalRicisAnalyzer,
    private readonly limits: LocalAnalyzerLimits,
  ) {}

  public async analyzeExplicitly(command: LocalAnalysisCommand, cancellation: AbortSignal): Promise<LocalAnalysisResult> {
    const created = this.sourceFactory.create(command.rawText, this.limits);
    if (created.kind !== 'CREATED') {
      const fallbackSource = freeze({ rawText: command.rawText, sourceHash: `${HASH_PREFIX}rejected-input`, length: command.rawText.length, factoryIssued: true as const });
      return resultFor({ ...command, source: fallbackSource }, this.dependenciesForRejected(), 'INPUT_REJECTED', { diagnostic: created.diagnostic, traceEntries: [baseTrace('INGESTION', 'LOCAL_INPUT_REJECTED', 'localAnalyzer.trace.inputRejected')] });
    }
    const request: LocalAnalysisRequest = { ...command, source: created.source };
    if (command.origin !== 'explicit_user_action') return resultFor(request, this.dependenciesForRejected(), 'INPUT_REJECTED', { diagnostic: diagnostic('INPUT_FORGED_SOURCE', 'localAnalyzer.input.explicitActionRequired'), traceEntries: [baseTrace('INGESTION', 'LOCAL_ACTION_REJECTED', 'localAnalyzer.trace.actionRejected')] });
    return this.localAnalyzer.analyze(request, cancellation);
  }

  private dependenciesForRejected(): LocalAnalyzerDependencies {
    return {
      parser: new LocalExpressionParser(),
      normalizer: new LocalExpressionNormalizer(),
      identityComparator: new LocalStructuralIdentityComparator(),
      semanticIndexer: new LocalSemanticIndexer(),
      patternClassifier: new LocalPatternClassifier(),
      traceFactory: new LocalAnalysisTraceFactory(),
      clock: { now: () => 0 },
      limits: this.limits,
    };
  }
}

function suggestionDiagnostic(code: string, messageResourceKey: string): LocalSuggestionEnvelope {
  return freeze({ status: 'AI_SUGGESTION_REJECTED', diagnostics: frozenArray([freeze({ code, messageResourceKey, safeParameters: freeze({}) })]) });
}

function suggestionUnavailable(): LocalSuggestionEnvelope {
  return freeze({ status: 'AI_SUGGESTION_UNAVAILABLE', diagnostics: frozenArray([freeze({ code: 'SUGGESTION_UNAVAILABLE', messageResourceKey: 'localAnalyzer.suggestion.unavailable', safeParameters: freeze({}) })]) });
}

function isSafeSuggestionString(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_SUGGESTION_TEXT_LENGTH;
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.length <= MAX_SUGGESTION_ARRAY_LENGTH && value.every(isSafeSuggestionString);
}

export class UserMediatedSuggestionPromptFactory implements IUserMediatedSuggestionPromptFactory {
  public constructor(private readonly clock: ILocalAnalysisClock, _limits: LocalAnalyzerLimits) {}

  public create(_request: StructuralSuggestionRequest): UserMediatedSuggestionPrompt {
    return freeze({
      text: '{"schemaVersion":"1","classification":"string","candidatePatterns":["string"],"questionsForCore":["string"],"explanation":"string"}',
      schemaVersion: '1',
      expiresAt: this.clock.now() + SUGGESTION_TTL_MILLISECONDS,
    });
  }
}

export class UserMediatedSuggestionValidator implements IUserMediatedSuggestionValidator {
  public constructor(private readonly clock: ILocalAnalysisClock, private readonly limits: LocalAnalyzerLimits) {}

  public async validate(pastedText: string, expectedSourceHash: string, cancellation: AbortSignal): Promise<LocalSuggestionEnvelope> {
    if (cancellation.aborted) return suggestionDiagnostic('SUGGESTION_CANCELLED', 'localAnalyzer.suggestion.cancelled');
    if (pastedText.length > MAX_SUGGESTION_TEXT_LENGTH * 4) return suggestionDiagnostic('SUGGESTION_LIMIT', 'localAnalyzer.suggestion.limit');
    let candidate: unknown;
    try { candidate = JSON.parse(pastedText); } catch { return suggestionDiagnostic('SUGGESTION_JSON_INVALID', 'localAnalyzer.suggestion.invalidJson'); }
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return suggestionDiagnostic('SUGGESTION_SCHEMA_INVALID', 'localAnalyzer.suggestion.invalidSchema');
    const record = candidate as Record<string, unknown>;
    const allowed = new Set(['schemaVersion', 'classification', 'candidatePatterns', 'questionsForCore', 'explanation']);
    if (Object.keys(record).some(key => !allowed.has(key))) return suggestionDiagnostic('SUGGESTION_SCHEMA_INVALID', 'localAnalyzer.suggestion.invalidSchema');
    if (record.schemaVersion !== '1' || !isSafeSuggestionString(record.classification) || !isStringArray(record.candidatePatterns) || !isStringArray(record.questionsForCore) || !isSafeSuggestionString(record.explanation)) return suggestionDiagnostic('SUGGESTION_SCHEMA_INVALID', 'localAnalyzer.suggestion.invalidSchema');
    const provenance: LocalSuggestionProvenance = freeze({ channel: 'USER_SUPPLIED_AI_STRUCTURAL_SUGGESTION', sourceHash: expectedSourceHash, receivedAt: this.clock.now(), schemaVersion: '1' });
    return freeze({
      status: 'AI_SUGGESTION_VALIDATED',
      provenance,
      content: freeze({ schemaVersion: '1', classification: record.classification, candidatePatterns: frozenArray(record.candidatePatterns), questionsForCore: frozenArray(record.questionsForCore), explanation: record.explanation }),
      diagnostics: frozenArray([]),
    });
  }
}
