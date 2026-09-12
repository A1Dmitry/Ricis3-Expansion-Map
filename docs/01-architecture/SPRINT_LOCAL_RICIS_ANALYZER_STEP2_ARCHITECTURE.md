# Local RICIS Analyzer — Шаг 2: Architecture / TypeScript contracts

**Статус:** `APPROVED — владелец проекта явно подтвердил Step 2 после утверждённого Step 1. Документ определяет только architecture, DI ports, DTO и immutable types. Step 3 QA и любая production-реализация требуют отдельных явных «ОК».`

## 1. Architectural decision

Local RICIS Analyzer является отдельным **opt-in диагностическим bounded context**, а не реализацией `IRicisCoreEngine`, не TypeScript fallback для `RicisWasmBridge.evaluate()` и не producer сущностей `Proof`. Он принимает только исходный текст выражения и минимальный безопасный recovery context, строит ограниченную структурную модель, распознаёт candidate-паттерны и возвращает статус `REQUIRES_CORE_VERIFICATION` либо иной typed non-success state.

> **Нормативная граница:** только C# `Ricis.Core` вправе вернуть `CoreExecutionResult.success: true`, invariant, Core trace или `executionEngine`. Local Analyzer не содержит таких полей и не принимает `CoreExecutionResult` как входной параметр. Его результат не изменяет `ProblemNode.state`, `MapState.proofs`, Lean evidence или academic proof path. [1] [2]

Архитектура реализует паттерны **P-01, P-02 и P-06**: текущее состояние документировано, каждое локальное утверждение имеет явный статус доверия, а строгий Core-first путь сохраняется отдельно. Local analysis — это самостоятельный результат с provenance, а не скрытый этап Core recovery. [3]

| Архитектурное решение | Обоснование | Запрещённая альтернатива |
|---|---|---|
| Отдельный `ILocalRicisAnalyzer` | Исключает смешение локальной диагностики с authoritative execution. | Добавить local fallback в `IRicisCoreEngine.evaluate()`. |
| Immutable AST и semantic index | Даёт position-safe parsing, exact structural identity и воспроизводимый trace. | Regex-only result либо динамическое исполнение expression. |
| Результат без `invariant`, `proof`, `lean` и `executionEngine` | Типовой контракт делает ложное повышение trust status невозможным в штатном потоке. | Переиспользовать DTO `RicisEvaluationResult`, `Proof` или `RicisFormalProof`. |
| Composition-root DI | Каждый порт получает зависимости через конструктор; нет singleton/service-locator состояния. | Вызов `getRicisCoreEngine()`, `RicisFallbackEngine` или provider SDK из analyzer domain. |
| AI как envelope suggestion | Schema-validated внешняя подсказка сохраняет provenance, но не меняет deterministic classification/trust. | Использовать ответ модели как rule-engine input либо математический результат. |

## 2. Module ownership and dependency direction

Будущий модуль располагается в `src/services/localRicisAnalyzer/`. Это размещение отражает инфраструктурную изоляцию от `src/services/ricisCore/`: оба модуля могут читать общие immutable primitives, но Local Analyzer не импортирует runtime Core bridge, legacy fallback engine, map store, proof model или DOM/provider SDK.

```text
Explicit user action / future recovery view-model
    -> LocalAnalysisApplicationService
        -> ILocalRicisAnalyzer
            -> ILocalExpressionParser
            -> ILocalExpressionNormalizer
            -> ILocalStructuralIdentityComparator
            -> ILocalSemanticIndexer (SP4)
            -> ILocalPatternClassifier
            -> ILocalAnalysisTraceFactory
        -> optional ILocalSuggestionWorkflow
            -> IServerStructuralSuggestionGateway
            OR IUserMediatedSuggestionValidator

RicisWasmBridge.evaluate() -> C# Core only -> CoreExecutionResult | CoreExecutionFailure
MapStore / Proof / node.state <- no Local Analyzer write path
```

| Owner | Owns | Does not own |
|---|---|---|
| `localRicisAnalyzer` domain | AST, parser result, structural identity, SP4 index, candidate classification, local trace and status taxonomy. | C# evaluation, invariant reduction, Lean, proof rendering, node state. |
| Recovery application layer | Explicit user command and safe adaptation of a prior Core failure into `LocalAnalysisRecoveryContext`. | Automatic analyzer invocation, Core retry replacement or result promotion. |
| Future same-origin server adapter | Bounded consented enrichment request and strict response decoding. | Core proof endpoint, arbitrary provider prompt, client token handling. |
| Future user-mediated adapter | Prompt payload construction and pasted JSON validation. | Reading another site, hidden browser window, iframe, WebSocket scraping or automatic collection. |
| Map/proof application layer | Existing proof status and node-state policy. | Writing analyzer output into `Proof` or `resolved`. |

## 3. Non-negotiable type segregation

The contracts are intentionally additive. Existing `IRicisCoreEngine`, `CoreExecutionResult`, `Proof`, `RicisFormalProof`, `RicisAcademicProofResult` and `MapState` retain their public shape during this increment. The architecture does not authorize deletion, rename or behavioural change of any public member.

### 3.1 Forbidden imports and fields

The future `src/services/localRicisAnalyzer/**` production module must not import `RicisWasmBridge`, `RicisFallbackEngine`, `getRicisCoreEngine`, `mapStore`, `logic.ts`, `Proof`, `RicisFormalProof`, `RicisAcademicProofResult` or browser/provider SDKs. An adapter at the application composition boundary may import the **type-only** `CoreExecutionFailure` solely to create the reduced `LocalAnalysisRecoveryContext` below.

The following fields are prohibited in every analyzer request, AST, trace, result, suggestion and UI DTO: `success`, `invariant`, `executionEngine`, `proof`, `lean`, `lean4CodeSnippet`, `isVerified`, `goalMatched`, `academicStatus`, `QED_VERIFIED`, `LEAN_VERIFIED`, `TRUSTED_AXIOM`, raw provider token, raw OAuth token, cookie, page HTML, URL from model output and executable code.

## 4. Core contracts

All domain values are readonly. Concrete implementations may use private constructors or factory validation, but external consumers receive no mutable arrays, `Map`, `Set`, AST child arrays or provenance records.

```ts
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

export interface SourceExpression {
  readonly rawText: string;
  /** `sha256-base64url-v1:` plus SHA-256 of UTF-8 rawText. */
  readonly sourceHash: string;
  readonly length: number;
}

export interface LocalAnalysisRecoveryContext {
  readonly code:
    | 'CORE_UNAVAILABLE'
    | 'CORE_INPUT_REJECTED'
    | 'CORE_INFRASTRUCTURE_ERROR'
    | 'CORE_INVALID_RESPONSE';
  readonly runtime: 'csharp_api' | 'csharp_wasm' | 'not_ready';
  readonly retryable: boolean;
  readonly origin: 'terminal' | 'node_trace' | 'proof_console' | 'unknown';
  readonly occurredAt: number;
  readonly safeDetail?: string;
}

export interface LocalAnalysisRequest {
  readonly source: SourceExpression;
  readonly origin: LocalAnalysisOrigin;
  readonly recoveryContext?: LocalAnalysisRecoveryContext;
  readonly requestedLocale: string;
  readonly correlationId: string;
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
}
```

`sourceHash` имеет фиксированный формат `sha256-base64url-v1:<digest>`: digest является SHA-256 от UTF-8 `rawText`. Он служит только content identifier для связки source/result, но не trust evidence, не proof hash и не может быть использован для повышения статуса. Raw source не попадает в `LocalAnalysisTraceEntry`, AI provenance, URL, telemetry или persistence. `correlationId` принадлежит текущему user action; он не является Core `proofRunId` и не должен интерпретироваться как server-issued proof identity.

### 4.1 Narrow recovery adapter

```ts
export interface ICoreFailureToLocalAnalysisContext {
  toContext(failure: CoreExecutionFailure): LocalAnalysisRecoveryContext;
}
```

Adapter копирует только closed recovery code, runtime, retryability, origin, timestamp и уже sanitised `safeDetail`. Он никогда не переносит `userMessage` без ресурсного ключа, не создаёт invariant/trace и не запускает analyzer. Вызов `ILocalRicisAnalyzer.analyze()` разрешён только отдельной командой UI/application service после явного выбора пользователя.

## 5. Immutable expression model and structural identity

### 5.1 AST

```ts
export type LocalExpressionNode =
  | LocalIdentifierNode
  | LocalFiniteLiteralNode
  | LocalSingularitySymbolNode
  | LocalUnaryNode
  | LocalBinaryNode
  | LocalParenthesizedNode;

export interface LocalNodeBase {
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

export interface NormalizedExpression {
  readonly text: string;
  readonly sourcePreserved: true;
}
```

AST представляет только P0 grammar: identifiers, finite literals, `0_F`, `inf_F`, unary `+/-`, binary `+ - * /` and parentheses. Its parser must reject callbacks, lambda text, member access, property access, brackets other than parentheses, template syntax, assignment, semicolon, JavaScript keywords, `eval`, `Function`, `NaN`, non-finite literal and unsupported Unicode confusables with typed diagnostics. It must never execute source text.

```ts
export interface ILocalExpressionParser {
  parse(source: SourceExpression, limits: LocalAnalyzerLimits): LocalParseOutcome;
}

export interface ILocalExpressionNormalizer {
  normalize(ast: LocalExpressionNode): NormalizedExpression;
}

export interface ILocalStructuralIdentityComparator {
  compare(left: LocalExpressionNode, right: LocalExpressionNode): LocalStructuralIdentity;
}

export interface LocalStructuralIdentity {
  readonly status: 'L1_IDENTITY_CHECKED' | 'NOT_IDENTICAL';
  readonly leftCanonical: string;
  readonly rightCanonical: string;
  readonly basis: 'EXACT_CANONICAL_AST';
}
```

`L1_IDENTITY_CHECKED` exists only when two canonical immutable AST forms are byte-for-byte equivalent under the specified canonicalisation rules. It is not a numeric equality, a simplification, a candidate factor cancellation or a Core invariant.

## 6. SP4 semantic index and candidate classifier

```ts
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

export interface ILocalSemanticIndexer {
  index(ast: LocalExpressionNode): readonly LocalSemanticIndexEntry[];
}

export interface ILocalPatternClassifier {
  classify(
    ast: LocalExpressionNode,
    semanticIndex: readonly LocalSemanticIndexEntry[],
  ): readonly LocalPatternCandidate[];
}
```

A classifier can report that the structure matches `0_F / 0_F`, `0_F * inf_G`, `inf_F / inf_G`, `inf_F - inf_G`, scalar `/ 0`, scalar `* 0` or a candidate factor cancellation. It cannot calculate a reduction, assert an A1/A4/A6 invariant, create a proof step or replace a request to Core.

Parsing, normalisation and indexing are `O(n)` in input length under injected resource limits. Only a specified local predicate over an already-built finite AST may document a bounded `O(1)` candidate check; the result must state its preconditions and must not describe the entire analysis as `O(1)`.

## 7. Local trace, provenance and recovery contract

```ts
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

export interface LocalAnalysisRecoveryRecommendation {
  readonly status: 'OPERATIONAL_DIAGNOSTIC';
  readonly requiredCapability: 'RICIS_CORE_EVALUATION';
  readonly actionResourceKey: string;
  readonly safeHandoff: LocalAnalysisHandoff;
}

export interface LocalAnalysisHandoff {
  readonly sourceHash: string;
  readonly normalizedText?: string;
  readonly candidatePatterns: readonly LocalCandidatePattern[];
  readonly semanticIndexKeys: readonly string[];
}

export interface ILocalAnalysisTraceFactory {
  create(entries: readonly LocalAnalysisTraceEntry[]): readonly LocalAnalysisTraceEntry[];
}
```

Local trace never uses `RicisPhaseTraceStep`, Core phase numbering, Lean log or `ProofStep`. It reports only what this module did: source ingestion, parsing, canonicalisation, structural L1 comparison, SP4 index creation, candidate classification and non-decision. `messageResourceKey` and `actionResourceKey` are external resource identifiers; user-facing Russian, English, French, German, Hindi and Malay text is not hardcoded in module logic.

## 8. Application service and DI composition

```ts
export interface ILocalRicisAnalyzer {
  analyze(
    request: LocalAnalysisRequest,
    cancellation: AbortSignal,
  ): Promise<LocalAnalysisResult>;
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

export interface ILocalAnalysisClock {
  now(): number;
}

export interface LocalAnalyzerLimits {
  readonly maxInputCharacters: number;
  readonly maxTokenCount: number;
  readonly maxAstDepth: number;
  readonly maxTraceEntries: number;
  readonly maxSafeDetailCharacters: number;
}

export interface ILocalAnalysisApplicationService {
  analyzeExplicitly(
    request: LocalAnalysisRequest,
    cancellation: AbortSignal,
  ): Promise<LocalAnalysisResult>;
}
```

The composition root constructs the application service by constructor injection. It is the only layer that can receive an explicit UI command and optional `LocalAnalysisRecoveryContext`. It must not subscribe to Core failures, call the analyzer on startup, persist result to `MapState`, attach it to a `Proof`, mutate node state or trigger provider enrichment automatically.

A cancellation signal returns a typed `RESOURCE_LIMITED` or safe cancellation diagnostic according to the future QA contract; exceptions do not become user-facing control flow. Domain ports do not read `window`, `sessionStorage`, network state or environment secrets.

## 9. Optional AI suggestion contracts

### 9.1 Shared narrow suggestion schema

```ts
export interface StructuralSuggestionContent {
  readonly schemaVersion: '1';
  readonly classification: string;
  readonly candidatePatterns: readonly string[];
  readonly questionsForCore: readonly string[];
  readonly explanation: string;
}

export interface LocalSuggestionEnvelope {
  readonly status: LocalSuggestionStatus;
  readonly provenance?: LocalSuggestionProvenance;
  readonly content?: StructuralSuggestionContent;
  readonly diagnostics: readonly LocalSuggestionDiagnostic[];
}

export interface LocalSuggestionProvenance {
  readonly channel:
    | 'SERVER_AI_STRUCTURAL_SUGGESTION'
    | 'USER_SUPPLIED_AI_STRUCTURAL_SUGGESTION'
    | 'USER_DELEGATED_GOOGLE_AI_SUGGESTION';
  /** Copied by the local workflow from its active request, never trusted from AI text. */
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
```

The schema has no `invariant`, theorem, Lean source, verification flag, trust status, URL, HTML, executable code, credential or token field. Validation must reject unexpected own-properties and reject values exceeding configured limits. A validated suggestion remains an untrusted prose/classification envelope; it does not alter `LocalAnalysisResult.status`, `candidates`, semantic index, trace or recovery action.

### 9.2 Same-origin server enrichment port

```ts
export interface StructuralSuggestionRequest {
  readonly sourceHash: string;
  readonly normalizedText: string;
  readonly localCandidates: readonly LocalCandidatePattern[];
  readonly consent: LocalSuggestionConsent;
  readonly correlationId: string;
}

export interface LocalSuggestionConsent {
  readonly granted: true;
  readonly grantedAt: number;
  readonly purpose: 'STRUCTURAL_EXPLANATION_ONLY';
}

export interface IServerStructuralSuggestionGateway {
  request(
    request: StructuralSuggestionRequest,
    cancellation: AbortSignal,
  ): Promise<LocalSuggestionEnvelope>;
}
```

This port represents a future same-origin backend contract only. It does not expose Gemini API keys, provider credentials, OAuth token, arbitrary prompt, arbitrary model, host URL or direct browser provider call. The backend adapter, consent record, rate policy, redaction and schema validation are separate implementation/QA scopes.

### 9.3 User-mediated path

```ts
export interface IUserMediatedSuggestionPromptFactory {
  create(request: StructuralSuggestionRequest): UserMediatedSuggestionPrompt;
}

export interface UserMediatedSuggestionPrompt {
  readonly text: string;
  readonly schemaVersion: '1';
  readonly expiresAt: number;
}

export interface IUserMediatedSuggestionValidator {
  validate(
    pastedText: string,
    expectedSourceHash: string,
    cancellation: AbortSignal,
  ): Promise<LocalSuggestionEnvelope>;
}
```

This port supports copy/paste only. `IUserMediatedSuggestionValidator` attaches `expectedSourceHash` to local provenance after validation; it does not accept a source hash from pasted AI text and does not claim that the external model saw the source. There is deliberately no `IExternalPageReader`, hidden-window controller, iframe bridge, DOM parser, WebSocket fetcher or automation port. User-delegated Google OAuth is deferred to its separately approved feasibility spike; no web OAuth client, token acquisition, refresh mechanism or direct browser API call is represented here.

## 10. Map-state and proof non-promotion policy

| Input/result | Permitted effect | Explicitly forbidden effect |
|---|---|---|
| `CoreExecutionFailure` | Recovery screen may offer an explicit local-analysis command. | Automatic analyzer call or substitution of `CoreExecutionResult`. |
| `LocalAnalysisResult.status = L1_IDENTITY_CHECKED` | Display structural identity with provenance. | Set `ProblemNode.state = resolved` or write a `Proof`. |
| `LocalPatternCandidate` | Display candidate and safe handoff for Core. | Reduce expression, assert invariant or add an axiom. |
| `LocalSuggestionEnvelope` validated | Render clearly labelled suggestion and questions for Core. | Influence deterministic classifier, proof, Lean status or map state. |
| `RESOURCE_LIMITED` / rejected input | Display resource-key recovery diagnostic. | Throw raw exception, attempt fallback evaluation or retry external provider. |
| Later authoritative Core response | May be displayed alongside local artifact by a separately approved application policy. | Mutate/relabel local artifact as Core result. |

The future UI may keep a local analysis artifact in **ephemeral feature state** keyed by `correlationId`. Step 2 specifically does not add it to `MapState`, IndexedDB persistence, snapshots, `Proof`, `ProblemNode`, agent memory, exports or route parameters.

## 11. Resource-key contract

No analyzer implementation may hardcode user-facing text. Step 3 must reserve resource keys, and Step 4 implementation must source localized values from external resources for at least the project coverage cultures: `en-US`, `fr-CA`, `de-DE`, `hi-IN` and `ms-MY`.

| Resource-key family | Intended use |
|---|---|
| `localAnalyzer.input.*` | Input rejected, unsupported grammar, resource limits and position-safe diagnostics. |
| `localAnalyzer.trace.*` | Ingestion, parse, normalisation, L1, SP4, candidate and non-decision trace entries. |
| `localAnalyzer.candidate.*` | Candidate rationale and Core-verification boundary. |
| `localAnalyzer.recovery.*` | Explicit action and safe handoff guidance. |
| `localAnalyzer.suggestion.*` | Consent, unavailable provider, pasted JSON validation and provenance labels. |

## 12. Mandatory Step 3 QA matrix

Every future public method receives direct deterministic regression coverage before implementation. QA will use fake injected ports and fixed clock/limits; it will not use live Gemini, browser automation, OAuth token, external DOM or C# code execution.

| Surface | Mandatory direct tests |
|---|---|
| `ICoreFailureToLocalAnalysisContext.toContext` | Each closed Core recovery code; redaction/length bound; no user message, invariant, trace or engine is copied. |
| `ILocalRicisAnalyzer.analyze` | Explicit request only; immutable source/result; parse acceptance/rejection; cancellation; all resource limits; no thrown user flow. |
| `ILocalExpressionParser.parse` | Grammar precedence/spans, unsupported syntax, `eval`/`Function`/lambda/member access rejection, non-finite literal rejection and no source execution. |
| `ILocalExpressionNormalizer.normalize` | Source preservation, deterministic canonical text and no numerical calculation. |
| `ILocalStructuralIdentityComparator.compare` | Equal canonical AST only; lexical/numerical coincidence and equivalent-looking different trees remain non-identical. |
| `ILocalSemanticIndexer.index` | Stable SP4 key/origin spans and no mutation of AST. |
| `ILocalPatternClassifier.classify` | Every P0 candidate; no invariant, proof or non-`REQUIRES_CORE_VERIFICATION` output. |
| `ILocalAnalysisTraceFactory.create` | Ordered phases, resource keys only, immutable trace and capped entries. |
| `ILocalAnalysisApplicationService.analyzeExplicitly` | No invocation from Core failure/startup; no Core bridge/fallback/map-store/proof access; no node transition. |
| Server suggestion gateway contract | Consent required, bounded schema, unknown-field rejection, provider failure mapping and provenance-only result. |
| User-mediated validator | Strict JSON, schema/size rejection, no external-page/URL/HTML/code field, delete/discard path and labelled provenance. |
| Trust policy integration | Local L1/candidate/AI/unavailable statuses never produce `resolved`, `LEAN_VERIFIED`, `TRUSTED_AXIOM`, `QED_VERIFIED`, Core invariant or `Proof`. |

## 13. Gate 2 acceptance criteria

Step 2 may be approved only if the owner accepts all statements below.

1. `ILocalRicisAnalyzer` is a separate DI port and does not extend or implement `IRicisCoreEngine`.
2. Local analysis is available only after an explicit user action; Core failure remains a `CoreExecutionFailure`.
3. Immutable AST, source span, canonical structural equality and SP4 index are the only basis for deterministic P0 classification.
4. All singularity matches are candidates with `REQUIRES_CORE_VERIFICATION`; no local status claims a Core invariant, Lean verification or resolved node.
5. The analyzer result cannot enter `Proof`, `MapState.proofs`, `ProblemNode.state`, Lean evidence, exports or persistence under this design.
6. AI output is schema-bounded, provenance-labelled, consented where applicable and cannot change deterministic result/trust state.
7. No browser cross-origin workaround, hidden page, iframe/DOM scraping, WebSocket workaround, provider key or direct OAuth flow is designed or authorized.
8. User-facing content uses resource keys, and every public method will receive a direct deterministic test in Step 3.
9. Step 3 will add only QA tests/specification after a separate **«ОК»**; parser, classifier, UI, server and provider implementation remain unauthorized.

## 14. Adversarial architecture review

The review treats every path that could relabel local output as authoritative, mix untrusted input into deterministic classification, or expand the browser trust surface as a reject-by-default attack path. It does not replace the independently approved Step 3 test suite.

| Adversarial question | Resulting control | Residual boundary |
|---|---|---|
| Can a Core failure silently become a local calculation? | `ILocalRicisAnalyzer` accepts explicit action only; it cannot implement `IRicisCoreEngine` or produce its result type. | UI command wiring remains for Step 4 after dedicated Step 3 tests. |
| Can a local candidate or L1 check resolve a node? | Analyzer types exclude proof/status fields; integration table prohibits writes to `Proof`, `MapState` and `ProblemNode.state`. | Existing legacy `goalMatched → resolved` debt is a separately approved PEP migration and is not widened by this design. |
| Can user source be substituted, reattached or leaked to an AI envelope? | `sourceHash` is a versioned SHA-256 UTF-8 digest; raw source is excluded from trace, provenance, URLs, telemetry and persistence. | Same-origin server transport/redaction requires its own Step 3/4 contracts. |
| Can pasted AI JSON pretend it belongs to a different expression? | Validator applies the active request’s `expectedSourceHash` locally to provenance; pasted JSON cannot set it. The envelope stays non-authoritative even on mismatch/misuse. | This is UI correlation, not a proof that an external model processed that source. |
| Can a model add proof/credential/browser-control data through extra JSON fields? | Strict unknown-property rejection; schema excludes invariant, Lean, verification, URL, HTML, executable code and secrets. | Renderer implementation must use escaping and bounded lengths in Step 4. |
| Can architecture sneak in cross-origin page reading or direct Google OAuth? | No such port exists; user-mediated flow is copy/paste only and OAuth stays behind a separate feasibility gate. | A future approved OAuth spike must validate PKCE, CORS, scopes, quota attribution and non-persistence. |
| Can resource exhaustion turn into an unbounded parse or thrown user flow? | Injected input/token/depth/trace limits and typed `RESOURCE_LIMITED` state are mandatory. | Limit values and cancellation timing require Step 3 tests. |

## References

[1]: [Current `IRicisCoreEngine` contract](../../src/services/ricisCore/IRicisCoreEngine.ts)
[2]: [Current strict Core-first bridge](../../src/services/ricisCore/RicisWasmBridge.ts)
[3]: [RICIS-III work patterns](../00-governance/WORK_PATTERNS.md)
[4]: [Approved Local Analyzer Step 1 business specification](../02-sprints/SPRINT_LOCAL_RICIS_ANALYZER_STEP1_BUSINESS_SPEC.md)
[5]: [Current Core recovery boundary](../../src/services/coreRecovery.ts)
[6]: [Current map trust transitions](../../src/store/mapStore.ts)
[7]: [Canonical map and proof types](../../src/model/types.ts)
