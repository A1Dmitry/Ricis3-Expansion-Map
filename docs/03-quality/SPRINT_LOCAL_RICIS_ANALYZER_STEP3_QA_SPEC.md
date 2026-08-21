# Local RICIS Analyzer — Шаг 3: QA specification и red test contracts

**Статус:** `APPROVED — владелец проекта явно утвердил Step 3 QA вместе с QA-HA-01 source-hash-origin amendment. Документ задаёт детерминированный QA contract и red-test inventory; implementation выполняется только по обязательному red-first порядку Step 4.`

## 1. QA objective

QA gate проверяет не математическое решение и не доступность внешней модели, а **границу доверия и детерминированный contract** Local RICIS Analyzer. Тесты обязаны доказать, что local analysis остаётся явной структурной диагностикой: он не запускается автоматически, не исполняет исходный текст, не создаёт Core result/proof/Lean evidence, не меняет карту и не использует данные внешней модели как rule-engine truth.

> **Primary oracle:** только `Ricis.Core` может создать `CoreExecutionResult.success: true`, invariant или Core trace. Local Analyzer и любой AI suggestion могут иметь лишь собственные typed structural statuses и provenance. Совпадение строк, L1 identity, candidate pattern, JSON validity, provider answer или UI rendering никогда сами по себе не означают `resolved`, `LEAN_VERIFIED`, `TRUSTED_AXIOM`, `QED_VERIFIED` либо Core execution. [1] [2]

| QA objective | Mandatory observable outcome | Prohibited shortcut |
|---|---|---|
| Explicit opt-in | Core failure/bridge construction/startup do not invoke analyzer. | Silently converting `CoreExecutionFailure` into local analysis. |
| Safe parsing | Allowed grammar produces immutable AST or typed rejection. | `eval`, `Function`, lambda/user callback or source execution. |
| Honest structure | L1 and SP4 outputs have exact bounded meaning. | Numeric equality, simplification or claim of invariant. |
| Non-promotion | Analyzer/suggestion cannot write `Proof`, map state or Lean status. | Treating candidate, AI prose or trace as proof. |
| AI confinement | Strict schema/provenance is rendered as untrusted suggestion only. | Provider/model output changes deterministic classification. |
| Resource safety | Limits/cancellation produce typed result and no raw throw flow. | Unbounded recursion, giant trace or exception text in UI DTO. |

## 2. Test location and execution rules

The future test suite is `src/services/localRicisAnalyzer/localRicisAnalyzer.test.ts`, with focused composition/integration checks located beside the affected boundary only when Step 4 introduces that boundary. It uses Vitest, strict TypeScript, fake injected ports and no network/browser provider. Existing `ricisCoreEngine.test.ts` remains the regression oracle for strict Core-first `RicisWasmBridge.evaluate()` behaviour and must gain only narrowly related no-auto-invocation coverage when actual UI composition is introduced.

| Rule | Requirement |
|---|---|
| Public API policy | Every public method introduced by Step 4 must have at least one direct test named by public surface and behaviour. |
| Isolation | No test reads real environment secrets, sends HTTP request, invokes Google/Gemini, opens a window, reads an external DOM, runs Core, evaluates user source or persists browser state. |
| Time | `ILocalAnalysisClock` fake returns fixed `1735689600000`; no assertion uses wall clock. |
| IDs | Fixtures use fixed correlation ID `local-analysis-test-0001`; test code never calls random UUID APIs. |
| Hash | Fixture source hashes use `sha256-base64url-v1:` plus a fixed literal digest fixture; hash algorithm itself has independent positive/negative vectors. |
| Cancellation | Use an already-aborted `AbortController` or deterministic fake cancellation checkpoint; no timing race/sleep. |
| Localization | Assert resource keys and safe parameters, never a hardcoded user-facing translated string. |
| Mutation | Assert result/AST/trace inputs are deeply immutable from consumer perspective by attempting mutation only against a cloned/reference probe and verifying the original contract did not change. |
| Regression command | `npm test -- --run src/services/localRicisAnalyzer/localRicisAnalyzer.test.ts`; full `npm test`, `npm run lint` and `npm run build` are required at Step 4 release. |

## 3. Deterministic fixture catalog

### 3.1 Source fixtures

| Fixture ID | Source text | Expected parse/classification purpose |
|---|---|---|
| `SRC01` | `0_F / 0_F` | `ZERO_OVER_ZERO` candidate; no invariant. |
| `SRC02` | `0_F * inf_G` | `ZERO_TIMES_INFINITY` candidate; distinct origin labels. |
| `SRC03` | `inf_F / inf_G` | `INFINITY_OVER_INFINITY` candidate. |
| `SRC04` | `inf_F - inf_G` | `INFINITY_MINUS_INFINITY` candidate. |
| `SRC05` | `x / 0` | `SCALAR_OVER_ZERO` candidate. |
| `SRC06` | `x * 0` | `SCALAR_TIMES_ZERO` candidate. |
| `SRC07` | `(x * y) / x` | `FACTOR_CANCELLATION` candidate only. |
| `SRC08` | `((x))` | Parenthesized canonical form and position preservation. |
| `SRC09` | `x + y * z` | Operator precedence; no candidate required. |
| `SRC10` | `x + y` compared with `x + y` | Exact L1 canonical equality positive. |
| `SRC11` | `x + y` compared with `y + x` | L1 negative: no commutative/numeric shortcut. |
| `SRC12` | `1` compared with `1.0` | L1 negative unless canonicalisation contract explicitly preserves exact lexical canonical rule; never numeric equality. |
| `SRC13` | ` 0_F / 0_F ` | Raw source preserved; normalized text controlled separately. |
| `SRC14` | nested parentheses at exactly configured max depth | Resource boundary acceptance. |
| `SRC15` | source exactly configured max character count | Resource boundary acceptance. |

All source fixtures are produced by `ISourceExpressionFactory` in public-contract tests: `rawText`, corresponding `length`, unique versioned SHA-256 fixture digest and no locale-specific transformation. A named fixture builder may provide the same known vector only for downstream-port tests. Tests must verify source text is preserved verbatim even when the normalised representation removes insignificant whitespace.

### 3.2 Rejection fixtures

| Fixture ID | Payload | Required status/diagnostic category |
|---|---|---|
| `REJ01` | Empty/whitespace-only input | `INPUT_REJECTED`. |
| `REJ02` | `NaN`, `Infinity`, `-Infinity` | `INPUT_REJECTED`; no JavaScript numeric value. |
| `REJ03` | `eval(1)`, `Function('return 1')()` | `INPUT_REJECTED`; prove source was not invoked. |
| `REJ04` | `x => x`, `function x(){}`, callback marker | `UNSUPPORTED_EXPRESSION` or `INPUT_REJECTED`; no lambda execution. |
| `REJ05` | `obj.member`, `obj['member']`, `a?.b` | `UNSUPPORTED_EXPRESSION`; no property access grammar. |
| `REJ06` | `x = 1`, `x; y`, `{x: 1}` | `UNSUPPORTED_EXPRESSION`; no assignment/statement/object grammar. |
| `REJ07` | unsupported brackets/template/Unicode confusable | Typed rejection with position-safe resource key. |
| `REJ08` | source one character above `maxInputCharacters` | `RESOURCE_LIMITED`; parser not invoked. |
| `REJ09` | token sequence above `maxTokenCount` | `RESOURCE_LIMITED`; no partial trace beyond configured cap. |
| `REJ10` | nesting one level above `maxAstDepth` | `RESOURCE_LIMITED`; no stack-overflow/throw. |
| `REJ11` | trace-producing fixture above `maxTraceEntries` | Typed capped result; no unbounded allocation. |
| `REJ12` | already-aborted cancellation signal | Typed cancellation/resource diagnostic; no downstream classifier call. |

### 3.3 Core recovery fixtures

| Fixture ID | `CoreExecutionFailure` input | Required reduced context |
|---|---|---|
| `REC01` | `CORE_UNAVAILABLE`, `not_ready`, retryable | Exact code/runtime/retryable/origin/timestamp copied; no user message. |
| `REC02` | `CORE_INPUT_REJECTED`, parser position and long safe detail | parser position is intentionally absent from reduced context; safe detail is bounded/sanitised. |
| `REC03` | `CORE_INFRASTRUCTURE_ERROR`, API runtime | Same closed value mapping; no invariant/trace/proof fields. |
| `REC04` | `CORE_INVALID_RESPONSE`, WASM runtime | Same closed value mapping and deterministic timestamp. |
| `REC05` | hostile newline/control-character safe detail | Sanitised bounded detail only. |

### 3.4 AI suggestion fixtures

| Fixture ID | Envelope | Required result |
|---|---|---|
| `AI01` | Exact schema v1, bounded strings/lists | `AI_SUGGESTION_VALIDATED`, provenance channel and locally attached expected source hash. |
| `AI02` | JSON syntactically invalid | `AI_SUGGESTION_REJECTED`, resource key only. |
| `AI03` | Unknown own property | Rejected; no permissive stripping. |
| `AI04` | `invariant`, `proof`, `lean`, `verified`, `trustStatus`, `url`, `html`, `code`, `token` field | Rejected, including nested occurrence. |
| `AI05` | Oversized explanation/list/string | Rejected or `RESOURCE_LIMITED`, no raw payload echo. |
| `AI06` | Wrong schema version | Rejected. |
| `AI07` | Valid content but fake/mismatched source hash in pasted text | Pasted source-hash field is an unknown field and rejected; validated envelope obtains only local expected source hash. |
| `AI08` | Server gateway returns unavailable/timeout typed fake | `AI_SUGGESTION_UNAVAILABLE`; deterministic analysis unchanged. |
| `AI09` | User refuses consent | Gateway not called; `NOT_REQUESTED`/resource-key diagnostic. |
| `AI10` | User-mediated prompt output | Contains bounded prompt/schema only; no provider key, URL, hidden-window or OAuth token fields. |

## 4. Direct public-port test inventory

The IDs below are mandatory test names or test-name prefixes. A later implementation cannot merge several public methods into one generic assertion: each public member has a direct positive/negative contract test.

### 4.1 Source factory, recovery adapter and application service

| ID | Direct surface | Fixture | Assertions |
|---|---|---|---|
| `LQA00` | `ISourceExpressionFactory.create` | ASCII fixed vector | Exact `sha256-base64url-v1:` UTF-8 SHA-256 vector; raw text/length preserved; immutable source. |
| `LQA00A` | `ISourceExpressionFactory.create` | Non-ASCII UTF-8 fixed vector | Exact UTF-8—not locale/browser encoding—digest. |
| `LQA00B` | `ISourceExpressionFactory.create` | Empty/whitespace | Typed resource-key rejection before parser invocation. |
| `LQA00C` | `ISourceExpressionFactory.create` | At/above character limit | At limit accepted; one character above rejected before hash/parser; no throw. |
| `LQA00D` | `ISourceExpressionFactory.create` | Valid source | No correlation/Core/proof/Lean/AI field and no browser side effect. |
| `LQA00E` | application composition | Raw user source/forged object probe | Parser receives only factory-created `SourceExpression`; forged literal fails typed boundary. |
| `LQA00F` | `IUserMediatedSuggestionValidator.validate` | Valid/mismatched pasted JSON | Local provenance uses active factory-created hash; pasted JSON cannot add or replace it. |
| `LQA01` | `ICoreFailureToLocalAnalysisContext.toContext` | `REC01` | Closed fields copy exactly; no `userMessage`, invariant, trace, proof or engine field exists. |
| `LQA02` | `ICoreFailureToLocalAnalysisContext.toContext` | `REC02`–`REC05` | Safe detail sanitised/capped; no parser position; all recovery codes covered. |
| `LQA03` | `ILocalAnalysisApplicationService.analyzeExplicitly` | `SRC01`, explicit origin | Calls injected analyzer exactly once with same source/correlation; returns its typed result unchanged. |
| `LQA04` | `ILocalAnalysisApplicationService.analyzeExplicitly` | origin other than explicit | Rejects/returns typed invalid request; analyzer never called. |
| `LQA05` | `ILocalAnalysisApplicationService.analyzeExplicitly` | aborted signal | No parser/indexer/classifier invocation after cancellation checkpoint. |
| `LQA06` | composition boundary | `CoreExecutionFailure` only | Merely constructing/recovering failure does not invoke application service/analyzer. |
| `LQA07` | composition boundary | app startup / bridge health check | No analyzer registration side effect, no runtime Core fallback interception. |

### 4.2 Analyzer orchestration and limits

| ID | Direct surface | Fixture | Assertions |
|---|---|---|---|
| `LQA08` | `ILocalRicisAnalyzer.analyze` | `SRC01` | One ordered parse → normalise → index → classify → trace flow; result has local provenance and no Core fields. |
| `LQA09` | `ILocalRicisAnalyzer.analyze` | `SRC09` | Valid ordinary grammar yields `STRUCTURAL_CHECKED`, no candidate and no implicit computation. |
| `LQA10` | `ILocalRicisAnalyzer.analyze` | `REJ01`–`REJ07` | Typed rejected/unsupported result; no throw and no downstream port after parser rejection. |
| `LQA11` | `ILocalRicisAnalyzer.analyze` | `REJ08`–`REJ11` | Limits applied deterministically and before unsafe/unbounded work. |
| `LQA12` | `ILocalRicisAnalyzer.analyze` | `REJ12` | Abort propagates typed controlled result and no side effect. |
| `LQA13` | `ILocalRicisAnalyzer.analyze` | `SRC02`, fixed clock | `analyzedAt` is injected fixed time; trace sequence contiguous from 1. |
| `LQA14` | `ILocalRicisAnalyzer.analyze` | repeated `SRC01` | Same inputs/dependencies create deeply equal result; input source remains unmodified. |
| `LQA15` | `ILocalRicisAnalyzer.analyze` | `SRC01` | Result excludes all prohibited authority fields at runtime and type-level fixture boundary. |

### 4.3 Parser, normalizer, AST and L1 identity

| ID | Direct surface | Fixture | Assertions |
|---|---|---|---|
| `LQA16` | `ILocalExpressionParser.parse` | `SRC09` | Precedence (`*` under `+`), node kinds, spans and canonical fragments exact. |
| `LQA17` | `ILocalExpressionParser.parse` | `SRC08`, `SRC13` | Parenthesis/span behavior and raw source preservation. |
| `LQA18` | `ILocalExpressionParser.parse` | `SRC01`–`SRC07` | Each P0 singular token parsed structurally without evaluation. |
| `LQA19` | `ILocalExpressionParser.parse` | `REJ02`–`REJ07` | Forbidden grammar rejected position-safely; sentinel function/object proves no execution/access. |
| `LQA20` | `ILocalExpressionParser.parse` | `SRC14`, `SRC15`, `REJ08`–`REJ10` | Character/token/depth limits exact at boundary. |
| `LQA21` | `ILocalExpressionNormalizer.normalize` | `SRC13` | Deterministic normalized text; original text/source hash unchanged. |
| `LQA22` | `ILocalExpressionNormalizer.normalize` | `SRC01`, `SRC07` | Does not cancel/reduce or introduce invariant; AST semantics remain structural. |
| `LQA23` | `ILocalStructuralIdentityComparator.compare` | `SRC10` | `L1_IDENTITY_CHECKED` only for same canonical AST. |
| `LQA24` | `ILocalStructuralIdentityComparator.compare` | `SRC11`, `SRC12` | No commutative, algebraic or numeric-coincidence identity claim. |
| `LQA25` | immutable AST contract | parsed `SRC01` | Consumer mutation attempt cannot mutate source/AST/result owned by module. |

### 4.4 SP4 semantic index, patterns and trace

| ID | Direct surface | Fixture | Assertions |
|---|---|---|---|
| `LQA26` | `ILocalSemanticIndexer.index` | `SRC01`–`SRC04` | Stable `ZERO_ORIGIN`/`INFINITY_ORIGIN` keys, spans and canonical fragments. |
| `LQA27` | `ILocalSemanticIndexer.index` | `SRC07`, `SRC09` | Factor/ratio key exists only where structural grammar supports it; index does not mutate AST. |
| `LQA28` | `ILocalPatternClassifier.classify` | `SRC01` | `ZERO_OVER_ZERO`, subject span, preconditions, `requiresCoreVerification: true` and resource key. |
| `LQA29` | `ILocalPatternClassifier.classify` | `SRC02`–`SRC07` | Each remaining P0 candidate independently covered. |
| `LQA30` | `ILocalPatternClassifier.classify` | `SRC09` | Empty candidate set; no inference from text substring. |
| `LQA31` | `ILocalPatternClassifier.classify` | all candidates | No candidate contains invariant, proof, Lean or resolved/trust output. |
| `LQA32` | `ILocalAnalysisTraceFactory.create` | successful `SRC01` flow | Ordered phases, contiguous sequence, resource keys/safe parameters only. |
| `LQA33` | `ILocalAnalysisTraceFactory.create` | capped trace | Trace entry limit and immutable array. |
| `LQA34` | trace/result separation | any flow | No `RicisPhaseTraceStep`, Core phase, Lean log, `ProofStep` or raw source appears. |

### 4.5 Suggestion ports and schema boundaries

| ID | Direct surface | Fixture | Assertions |
|---|---|---|---|
| `LQA35` | `IServerStructuralSuggestionGateway.request` contract adapter | `AI01` | Request contains consent, bounded structural input and correlation; no provider token/model selection/arbitrary prompt. |
| `LQA36` | `IServerStructuralSuggestionGateway.request` contract adapter | `AI08`, `AI09` | Unavailable/consent denial maps typed envelope; no classifier/status mutation. |
| `LQA37` | `IUserMediatedSuggestionPromptFactory.create` | `AI10` | Bounded prompt is copyable schema request; lacks provider key, external URL, DOM/window instruction and OAuth data. |
| `LQA38` | `IUserMediatedSuggestionValidator.validate` | `AI01`–`AI07` | Strict JSON/schema/length/unknown-field validation; source hash injected locally only. |
| `LQA39` | `IUserMediatedSuggestionValidator.validate` | `AI04` | Prohibited nested authority/credential/browser-control fields rejected. |
| `LQA40` | `LocalSuggestionEnvelope` integration | valid `AI01` | Validated suggestion cannot alter `candidates`, semantic index, analyzer status, recovery or provenance producer. |
| `LQA41` | user-mediated flow boundary | all fixtures | No `IExternalPageReader`, iframe, hidden window, DOM access, WebSocket or network fake is required/called. |

### 4.6 Map/proof non-promotion negative tests

| ID | Boundary | Fixture | Assertions |
|---|---|---|---|
| `LQA42` | Local analysis result → map application policy | `L1_IDENTITY_CHECKED` | Node remains its prior state; `Proof` and `MapState.proofs` unchanged. |
| `LQA43` | Local candidate → map application policy | `ZERO_OVER_ZERO` | Node remains its prior state; no axiom, proof, edge recolor or agent-memory training. |
| `LQA44` | Validated AI suggestion → map application policy | `AI01` | No `resolved`, Lean status, QED status or proof write. |
| `LQA45` | Core unavailable recovery + explicit analysis | `REC01` + `SRC01` | Core failure remains visible; local result is separate ephemeral artifact. |
| `LQA46` | Later Core authoritative result | same source/correlation family | Local artifact is not relabelled/replaced; future approved policy may show both artifacts only. |
| `LQA47` | Legacy fallback spy | any local analysis | `RicisFallbackEngine.evaluate`, `generateFormalProof`, `proveSystem`, `verifyProofChain` are never called. |
| `LQA48` | Strict bridge spy | any local analysis | `RicisWasmBridge.evaluate()` behavior is unchanged; no analyzer is invoked on its failure branches. |

## 5. Required fake ports

No mock is allowed to manufacture an authoritative result. Fakes implement only their named Local Analyzer port and expose call counts/order for direct assertions.

| Fake | Deterministic capability | Must not contain |
|---|---|---|
| `FakeSourceExpressionFactory` | Return fixed factory-created source or typed input diagnostic. | Random ID, browser access, Core/provider call or forged hash acceptance. |
| `FakeLocalExpressionParser` | Return immutable AST or typed parse outcome for fixture source. | Evaluation, regex fallback authority or provider call. |
| `FakeNormalizer` | Return fixed normalized text. | Algebraic reduction/invariant. |
| `FakeIdentityComparator` | Return exact fixture structural identity. | Numeric evaluator. |
| `FakeSemanticIndexer` | Return fixed readonly SP4 entries. | Mutation of AST or map. |
| `FakePatternClassifier` | Return fixed candidate fixtures. | Proof status, Lean or node state. |
| `FakeTraceFactory` | Return capped readonly typed trace. | Raw source, Core trace or localized text. |
| `FixedClock` | Return fixed epoch. | System clock access. |
| `RecordingAnalyzer` | Record explicit request/cancellation and return a supplied local result. | Core/fallback import. |
| `FakeServerSuggestionGateway` | Return supplied bounded envelope/typed unavailable state. | HTTP, key, secret, external API. |
| `FakeUserMediatedValidator` | Validate supplied pasted fixture deterministically. | DOM/window/iframe/WebSocket usage. |
| `MapWriteSpy` | Fail the test if proof/map/node/axiom persistence mutation is attempted. | A permissive no-op mutation. |

## 6. Red test sequencing

Step 4 begins only with this sequence; it does not begin by implementing a broad parser.

1. Create the additive contract module exactly as approved in Step 2 plus approved QA-HA-01 amendment, and make all `LQA00`–`LQA48` imports type-check against it.
2. Write test cases **red first** in fixture order: recovery/explicit invocation, grammar/limits, AST/L1/SP4/candidates/trace, suggestion schema, then non-promotion/anti-fallback boundaries.
3. Run the focused Vitest file. Tests must fail because ports have no implementation; a missing test is not considered a passing test.
4. Only after all tests exist and QA owner approves their actual red evidence may Step 4 implementation begin in bounded increments.
5. Each implementation increment turns only its associated direct tests green; it must not weaken assertions or skip any `LQA` ID.

No implementation test may be deleted, made conditional on environment/provider availability, silently `.skip`ped, converted to a broad snapshot, or replaced by a smoke assertion without explicit owner approval.

## 7. Step 3 acceptance criteria

The QA gate can be approved only if the owner accepts the following test obligations.

1. `LQA00`–`LQA48` (or later split test names retaining each ID) are mandatory direct regression obligations, not aspirational examples.
2. Every public Step 4 port method is directly tested with deterministic fakes; test code contains no live Core/provider/OAuth/browser external call.
3. Tests demonstrate strict separation of `CoreExecutionFailure`, `LocalAnalysisResult`, `Proof` and map state.
4. Tests reject source execution, forbidden grammar, unsafe resource use, hidden browser access and untrusted AI authority fields.
5. Tests prove that candidates and suggestions cannot calculate an invariant or promote a node/proof/Lean status.
6. Tests bind source, correlation and suggestion provenance without claiming that a user-mediated external model actually processed the text.
7. Tests assert resource keys/safe parameters and will cover resource bundles instead of hardcoded user-facing text.
8. Step 4 remains prohibited until this QA gate receives its own explicit **«ОК»**.

## References

[1]: [Approved Step 1 business specification](../02-sprints/SPRINT_LOCAL_RICIS_ANALYZER_STEP1_BUSINESS_SPEC.md)
[2]: [Approved Step 2 architecture](../01-architecture/SPRINT_LOCAL_RICIS_ANALYZER_STEP2_ARCHITECTURE.md)
[3]: [Draft Step 2.1 source-hash-origin amendment](../01-architecture/SPRINT_LOCAL_RICIS_ANALYZER_STEP2_1_HASH_ORIGIN_AMENDMENT.md)
[4]: [Existing strict Core bridge tests](../../src/services/ricisCore/ricisCoreEngine.test.ts)
[5]: [Current Core recovery tests](../../src/services/coreRecovery.test.ts)
[6]: [Project development contract](../../AGENTS.md)
