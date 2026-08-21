import type { CoreExecutionFailure, CoreRecoveryCode, CoreRecoveryDiagnostic } from '../ricisCore/IRicisCoreEngine';

export type LocalAnalyzerStatus =
  | 'STRUCTURAL_CHECKED'
  | 'L1_IDENTITY_CHECKED'
  | 'REQUIRES_CORE_VERIFICATION'
  | 'UNSUPPORTED_EXPRESSION'
  | 'INPUT_REJECTED'
  | 'RESOURCE_LIMITED';

export type LocalSuggestionStatus =
  | 'NOT_REQUESTED'
  | 'AI_SUGGESTION_UNVALIDATED'
  | 'AI_SUGGESTION_VALIDATED'
  | 'AI_SUGGESTION_REJECTED'
  | 'AI_SUGGESTION_UNAVAILABLE';

export type LocalAnalysisPhase =
  | 'INGESTION'
  | 'PARSE'
  | 'NORMALIZATION'
  | 'L1_IDENTITY'
  | 'SP4_INDEX'
  | 'PATTERN_CANDIDATE'
  | 'NON_DECISION';

export type LocalCandidatePattern =
  | 'ZERO_OVER_ZERO'
  | 'ZERO_TIMES_INFINITY'
  | 'INFINITY_OVER_INFINITY'
  | 'INFINITY_MINUS_INFINITY'
  | 'SCALAR_OVER_ZERO'
  | 'SCALAR_TIMES_ZERO'
  | 'FACTOR_CANCELLATION';

export type LocalAnalysisOrigin = 'explicit_user_action';

export interface SourceSpan {
  readonly start: number;
  readonly endExclusive: number;
}

/** Immutable input produced only through ISourceExpressionFactory at the app boundary. */
export interface SourceExpression {
  readonly rawText: string;
  readonly sourceHash: string;
  readonly length: number;
  readonly factoryIssued: true;
}

export interface NormalizedExpression {
  readonly text: string;
  readonly sourcePreserved: true;
}

export interface LocalAnalysisRecoveryContext {
  readonly code: CoreRecoveryCode;
  readonly runtime: 'csharp_api' | 'csharp_wasm' | 'not_ready';
  readonly retryable: boolean;
  readonly origin: 'terminal' | 'node_trace' | 'proof_console' | 'unknown';
  readonly occurredAt: number;
  readonly safeDetail?: string;
}

export interface LocalAnalysisCommand {
  readonly rawText: string;
  readonly origin: LocalAnalysisOrigin;
  readonly requestedLocale: string;
  readonly correlationId: string;
  readonly recoveryContext?: LocalAnalysisRecoveryContext;
}

export interface LocalAnalysisRequest {
  readonly source: SourceExpression;
  readonly origin: LocalAnalysisOrigin;
  readonly requestedLocale: string;
  readonly correlationId: string;
  readonly recoveryContext?: LocalAnalysisRecoveryContext;
}

interface LocalNodeBase {
  readonly kind: string;
  readonly span: SourceSpan;
  readonly canonical: string;
}

export interface LocalIdentifierNode extends LocalNodeBase {
  readonly kind: 'IDENTIFIER';
  readonly name: string;
}

export interface LocalFiniteLiteralNode extends LocalNodeBase {
  readonly kind: 'FINITE_LITERAL';
  readonly lexeme: string;
}

export interface LocalSingularitySymbolNode extends LocalNodeBase {
  readonly kind: 'SINGULARITY_SYMBOL';
  readonly symbol: '0_F' | 'inf_F';
  readonly originLabel: string;
}

export interface LocalUnaryNode extends LocalNodeBase {
  readonly kind: 'UNARY';
  readonly operator: '+' | '-';
  readonly operand: LocalExpressionNode;
}

export interface LocalBinaryNode extends LocalNodeBase {
  readonly kind: 'BINARY';
  readonly operator: '+' | '-' | '*' | '/';
  readonly left: LocalExpressionNode;
  readonly right: LocalExpressionNode;
}

export interface LocalParenthesizedNode extends LocalNodeBase {
  readonly kind: 'PARENTHESIZED';
  readonly expression: LocalExpressionNode;
}

export type LocalExpressionNode =
  | LocalIdentifierNode
  | LocalFiniteLiteralNode
  | LocalSingularitySymbolNode
  | LocalUnaryNode
  | LocalBinaryNode
  | LocalParenthesizedNode;

export interface LocalInputDiagnostic {
  readonly code:
    | 'INPUT_EMPTY'
    | 'INPUT_LIMIT_EXCEEDED'
    | 'INPUT_INVALID_ENCODING'
    | 'INPUT_FORGED_SOURCE'
    | 'INPUT_CANCELLED';
  readonly messageResourceKey: string;
  readonly safeParameters: Readonly<Record<string, string>>;
  readonly position?: number;
}

export type SourceExpressionCreationOutcome =
  | { readonly kind: 'CREATED'; readonly source: SourceExpression }
  | { readonly kind: 'REJECTED'; readonly diagnostic: LocalInputDiagnostic };

export type LocalParseOutcome =
  | { readonly kind: 'PARSED'; readonly ast: LocalExpressionNode }
  | {
    readonly kind: 'REJECTED';
    readonly status: 'INPUT_REJECTED' | 'UNSUPPORTED_EXPRESSION' | 'RESOURCE_LIMITED';
    readonly diagnostic: LocalInputDiagnostic;
  };

export interface LocalStructuralIdentity {
  readonly status: 'L1_IDENTITY_CHECKED' | 'NOT_IDENTICAL';
  readonly leftCanonical: string;
  readonly rightCanonical: string;
  readonly basis: 'EXACT_CANONICAL_AST';
}

export interface LocalSemanticIndexEntry {
  readonly key: string;
  readonly kind: 'ZERO_ORIGIN' | 'INFINITY_ORIGIN' | 'FACTOR' | 'RATIO';
  readonly span: SourceSpan;
  readonly canonicalFragment: string;
}

export interface LocalPatternCandidate {
  readonly pattern: LocalCandidatePattern;
  readonly subjectSpan: SourceSpan;
  readonly preconditions: readonly string[];
  readonly requiresCoreVerification: true;
  readonly status: 'REQUIRES_CORE_VERIFICATION';
  readonly rationaleResourceKey: string;
}

export interface LocalAnalysisTraceEntry {
  readonly sequence: number;
  readonly phase: LocalAnalysisPhase;
  readonly eventCode: string;
  readonly messageResourceKey: string;
  readonly safeParameters: Readonly<Record<string, string>>;
  readonly inputCanonical?: string;
  readonly outputCanonical?: string;
}

export interface LocalAnalyzerProvenance {
  readonly producer: 'LOCAL_DETERMINISTIC_ANALYZER';
  readonly origin: 'explicit_user_action';
  readonly analyzedAt: number;
  readonly analyzerContractVersion: 'v1';
  readonly coreResultCreated: false;
  readonly leanEvidenceCreated: false;
}

export interface LocalAnalysisHandoff {
  readonly sourceHash: string;
  readonly normalizedText?: string;
  readonly candidatePatterns: readonly LocalCandidatePattern[];
  readonly semanticIndexKeys: readonly string[];
}

export interface LocalAnalysisRecoveryRecommendation {
  readonly status: 'OPERATIONAL_DIAGNOSTIC';
  readonly requiredCapability: 'RICIS_CORE_EVALUATION';
  readonly actionResourceKey: string;
  readonly safeHandoff: LocalAnalysisHandoff;
}

export interface StructuralSuggestionContent {
  readonly schemaVersion: '1';
  readonly classification: string;
  readonly candidatePatterns: readonly string[];
  readonly questionsForCore: readonly string[];
  readonly explanation: string;
}

export interface LocalSuggestionProvenance {
  readonly channel:
    | 'SERVER_AI_STRUCTURAL_SUGGESTION'
    | 'USER_SUPPLIED_AI_STRUCTURAL_SUGGESTION'
    | 'USER_DELEGATED_GOOGLE_AI_SUGGESTION';
  readonly sourceHash: string;
  readonly receivedAt: number;
  readonly schemaVersion: '1';
  readonly modelLabel?: string;
}

export interface LocalSuggestionDiagnostic {
  readonly code: string;
  readonly messageResourceKey: string;
  readonly safeParameters: Readonly<Record<string, string>>;
}

export interface LocalSuggestionEnvelope {
  readonly status: LocalSuggestionStatus;
  readonly provenance?: LocalSuggestionProvenance;
  readonly content?: StructuralSuggestionContent;
  readonly diagnostics: readonly LocalSuggestionDiagnostic[];
}

export interface LocalAnalysisResult {
  readonly correlationId: string;
  readonly source: SourceExpression;
  readonly normalizedSource?: NormalizedExpression;
  readonly status: LocalAnalyzerStatus;
  readonly ast?: LocalExpressionNode;
  readonly semanticIndex: readonly LocalSemanticIndexEntry[];
  readonly identity?: LocalStructuralIdentity;
  readonly candidates: readonly LocalPatternCandidate[];
  readonly trace: readonly LocalAnalysisTraceEntry[];
  readonly provenance: LocalAnalyzerProvenance;
  readonly recovery: LocalAnalysisRecoveryRecommendation;
  readonly suggestion: LocalSuggestionEnvelope;
  readonly diagnostic?: LocalInputDiagnostic;
}

export interface LocalAnalyzerLimits {
  readonly maxInputCharacters: number;
  readonly maxTokenCount: number;
  readonly maxAstDepth: number;
  readonly maxTraceEntries: number;
  readonly maxSafeDetailCharacters: number;
}

export interface ILocalAnalysisClock {
  now(): number;
}

export interface ISourceExpressionFactory {
  create(rawText: string, limits: Pick<LocalAnalyzerLimits, 'maxInputCharacters'>): SourceExpressionCreationOutcome;
}

export interface ICoreFailureToLocalAnalysisContext {
  toContext(failure: CoreExecutionFailure): LocalAnalysisRecoveryContext;
}

export interface ILocalExpressionParser {
  parse(source: SourceExpression, limits: LocalAnalyzerLimits): LocalParseOutcome;
}

export interface ILocalExpressionNormalizer {
  normalize(ast: LocalExpressionNode): NormalizedExpression;
}

export interface ILocalStructuralIdentityComparator {
  compare(left: LocalExpressionNode, right: LocalExpressionNode): LocalStructuralIdentity;
}

export interface ILocalSemanticIndexer {
  index(ast: LocalExpressionNode): readonly LocalSemanticIndexEntry[];
}

export interface ILocalPatternClassifier {
  classify(ast: LocalExpressionNode, semanticIndex: readonly LocalSemanticIndexEntry[]): readonly LocalPatternCandidate[];
}

export interface ILocalAnalysisTraceFactory {
  create(entries: readonly Omit<LocalAnalysisTraceEntry, 'sequence'>[], limits: LocalAnalyzerLimits): readonly LocalAnalysisTraceEntry[];
}

export interface ILocalRicisAnalyzer {
  analyze(request: LocalAnalysisRequest, cancellation: AbortSignal): Promise<LocalAnalysisResult>;
}

export interface ILocalAnalysisApplicationService {
  analyzeExplicitly(command: LocalAnalysisCommand, cancellation: AbortSignal): Promise<LocalAnalysisResult>;
}

export interface LocalAnalyzerDependencies {
  readonly parser: ILocalExpressionParser;
  readonly normalizer: ILocalExpressionNormalizer;
  readonly identityComparator: ILocalStructuralIdentityComparator;
  readonly semanticIndexer: ILocalSemanticIndexer;
  readonly patternClassifier: ILocalPatternClassifier;
  readonly traceFactory: ILocalAnalysisTraceFactory;
  readonly clock: ILocalAnalysisClock;
  readonly limits: LocalAnalyzerLimits;
}

export interface StructuralSuggestionRequest {
  readonly sourceHash: string;
  readonly normalizedText: string;
  readonly localCandidates: readonly LocalPatternCandidate[];
  readonly consent: { readonly granted: true; readonly grantedAt: number; readonly purpose: 'STRUCTURAL_EXPLANATION_ONLY' };
  readonly correlationId: string;
}

export interface IServerStructuralSuggestionGateway {
  request(request: StructuralSuggestionRequest, cancellation: AbortSignal): Promise<LocalSuggestionEnvelope>;
}

export interface UserMediatedSuggestionPrompt {
  readonly text: string;
  readonly schemaVersion: '1';
  readonly expiresAt: number;
}

export interface IUserMediatedSuggestionPromptFactory {
  create(request: StructuralSuggestionRequest): UserMediatedSuggestionPrompt;
}

export interface IUserMediatedSuggestionValidator {
  validate(pastedText: string, expectedSourceHash: string, cancellation: AbortSignal): Promise<LocalSuggestionEnvelope>;
}

export function toLocalRecoveryContext(
  failure: CoreExecutionFailure,
  maxSafeDetailCharacters: number,
): LocalAnalysisRecoveryContext {
  const diagnostic: CoreRecoveryDiagnostic = failure.diagnostic;
  const detail = typeof diagnostic.safeDetail === 'string'
    ? diagnostic.safeDetail.replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxSafeDetailCharacters).trim()
    : undefined;

  return Object.freeze({
    code: failure.code,
    runtime: diagnostic.runtime,
    retryable: diagnostic.retryable,
    origin: diagnostic.origin,
    occurredAt: diagnostic.occurredAt,
    ...(detail ? { safeDetail: detail } : {}),
  });
}
