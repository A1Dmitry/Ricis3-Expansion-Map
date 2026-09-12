# Local RICIS Analyzer — Шаг 1: business specification и оценка сложности

**Статус:** `APPROVED — владелец проекта явно подтвердил Step 1. Следующий отдельный gate — Step 2: TypeScript architecture/contracts; на нём не создаются production-код, изменение Core evaluate-path, Gemini transport, UI или persistence.`

## 1. Решение задачи

Пользователю `Ricis3-Expansion-Map` нужен полезный и честный режим, когда `Ricis.Core` недоступен: приложение должно уметь разобрать небольшой безопасный язык выражений, распознать известные структурные RICIS-паттерны, показать локальный trace и объяснить, какие данные нужны Core. Режим не является вычислительной заменой C# Core, не выдаёт invariant как результат Core и не производит Lean evidence.

> **Основное правило:** при `CORE_UNAVAILABLE`, `CORE_INFRASTRUCTURE_ERROR` или `CORE_INVALID_RESPONSE` строгий `RicisWasmBridge.evaluate()` по-прежнему возвращает controlled failure. Новый analyzer вызывается только отдельным, явно выбранным пользователем действием **«Локальный структурный анализ»** и возвращает другой тип результата.

Это сохраняет уже существующую гарантию: TypeScript fallback не подставляет математический ответ в Core evaluation path. Нынешний `RicisFallbackEngine` содержит полезные legacy fragments, но его `evaluate`, `generateFormalProof`, `proveSystem` и статусы `isVerified`/`QED_VERIFIED` нельзя напрямую использовать как новый fallback result: они способны смешать structural draft с доказательством.

## 2. User story и сценарий

> Как пользователь, у которого Core временно недоступен, я хочу по явному действию получить локальную структурную диагностику выражения, увидеть безопасно распознанный pattern, semantic index, неизменяемый input и причины, по которым нужна проверка Core/Lean; я не хочу, чтобы приложение выдавало это за вычисленный Core invariant или доказательство.

| Шаг | Пользовательское действие | Система |
|---|---|---|
| 1 | Вводит expression и запускает Core operation. | `RicisWasmBridge` пытается C# WASM/API как сейчас. |
| 2 | Core возвращает typed failure. | Recovery UI сохраняет failure без invariant/trace/proof. |
| 3 | Пользователь выбирает «Локальный структурный анализ». | Separate analyzer получает raw input и failure context, а не `CoreExecutionResult`. |
| 4 | Пользователь читает результат. | Возвращаются parse/classification/index/trace/status `REQUIRES_CORE_VERIFICATION`; Core result не создаётся. |
| 5a | Если server provider есть и пользователь дал consent. | Optional Gemini structural enrichment даёт строго schema-validated suggestion с provenance. |
| 5b | Если static GitHub Pages или provider unavailable. | User-mediated bridge копирует short prompt в буфер/открывает видимую external page; пользователь вставляет ответ обратно, а клиент валидирует schema. |
| 6 | Пользователь повторяет Core request позднее. | Core result показывается рядом с local analysis, но не заменяется им автоматически. |

## 3. Область P0 local analyzer

### 3.1 Допустимые операции

P0 поддерживает только детерминированные структурные результаты. Parsing имеет complexity `O(n)` по длине входа; только конкретное локальное правило после parsing может маркироваться `O(1)`. Нельзя маркировать весь analyzer `O(1)`.

| Возможность | Результат | Статус доверия |
|---|---|---|
| Input normalization | Immutable original, normalized spelling, position-safe parse diagnostics. | `STRUCTURAL_CHECKED` |
| Safe grammar | Identifiers, finite literals, `+ - * /`, parentheses, `0_F`, `inf_F`; без `eval`, `Function`, source execution или user callback. | `STRUCTURAL_CHECKED` |
| SP4 semantic index | Canonical origin keys для recognized `0_F`, `inf_F`, factor and ratio patterns. | `STRUCTURAL_CHECKED` |
| L1 identity | Exact structural equality of canonical immutable expression trees. | `L1_IDENTITY_CHECKED` |
| Pattern classification | `0_F/0_F`, `0_F * inf_G`, `inf_F/inf_G`, `inf_F-inf_G`, scalar `/0`, scalar `*0`, factor cancellation candidate. | `REQUIRES_CORE_VERIFICATION` |
| Trace | Typed phases: ingestion, parse, index, rule candidate, non-decision. | `ANALYSIS_TRACE_ONLY` |
| Recovery recommendation | Required Core endpoint/capability and a redacted handoff payload. | `OPERATIONAL_DIAGNOSTIC` |

### 3.2 Недопустимые операции

| Запрет | Причина |
|---|---|
| Замена `RicisWasmBridge.evaluate()` или `CoreExecutionFailure` | Нарушает существующий Core-first contract и создаёт ложный mathematical result. |
| `success: true`, `executionEngine: typescript_native`, Core invariant или Core trace | Локальный analysis не является C# Core execution. |
| `QED_VERIFIED`, `isVerified: true`, `LEAN_VERIFIED`, `TRUSTED_AXIOM` | Parser/pattern matcher/LLM не запускают Lean kernel. |
| Генерация Lean code как evidence | Разрешён только separately labelled unverified illustrative draft; P0 вообще не генерирует Lean. |
| Численное приближение, предел Коши, `NaN`, JavaScript `eval`/`Function` | Противоречит RICIS and project safety contract. |
| Расширение legacy regex engine как единственного source of truth | Regex-only recognition не даёт structural identity, reliable span, precedence или trace provenance. |
| AI output как input to rule engine без schema validation | LLM output is untrusted content; он не может влиять на trust status. |

## 4. RICIS vocabulary и invariant mapping

| Термин | P0 значение |
|---|---|
| `SourceExpression` | Неизменяемый пользовательский input с hash/length/locale-neutral syntax. |
| `NormalizedExpression` | Formatting-normalized representation, не заменяющая source. |
| `ExpressionNode` | Typed AST node, несущий original span и canonical structural form. |
| `L1_IDENTITY` | Exact equivalence canonical forms `X = X`; не numeric approximation. |
| `SP2 candidate` | Возможность factor reduction, требующая Core verification before any invariant is claimed. |
| `SP4 SemanticIndex` | Origin/pattern label that lets UI and Core compare context structurally. |
| `LocalAnalysisTrace` | Evidence of parser/classifier actions, never a Core trace. |
| `AnalyzerStatus` | Closed typed union: `STRUCTURAL_CHECKED`, `L1_IDENTITY_CHECKED`, `REQUIRES_CORE_VERIFICATION`, `UNSUPPORTED_EXPRESSION`, `INPUT_REJECTED`, `AI_SUGGESTION_UNVALIDATED`, `AI_SUGGESTION_VALIDATED`. |
| `GeminiSuggestion` | Optional non-authoritative structural prose/JSON; no invariant/proof/trust status field exists in its schema. |

## 5. Gemini strategy: three explicitly different modes

The repository already has a server-side `GEMINI_API_KEY` route for proof generation. This task must reuse the server capability only behind a new narrow, consented API contract; it must not reuse unrestricted proof output as analyzer input.

| Mode | Availability | Request/response transport | Result label |
|---|---|---|---|
| **A. Server-side Gemini enrichment** | Full deployment with provider configured. | App → same-origin backend → official Gemini API. | `SERVER_AI_STRUCTURAL_SUGGESTION` |
| **B. User-mediated Gemini bridge** | GitHub Pages / no server provider / user choice. | App produces copyable bounded prompt; user operates visible external Gemini page; user pastes response; app validates local schema. | `USER_SUPPLIED_AI_STRUCTURAL_SUGGESTION` |
| **C. User-delegated Google OAuth** | Potentially available only after separate browser feasibility/security approval. | User explicitly authorizes the Generative Language API through a registered web OAuth client; client obtains a short-lived token and makes only the bounded structural request. | `USER_DELEGATED_GOOGLE_AI_SUGGESTION` |
| **D. No AI** | All deployment modes. | Local deterministic analyzer only. | No AI provenance |

### 5.1 User-delegated Google OAuth is not automatic free access

A Google sign-in authenticates the person; it does not by itself create a Cloud project, enable the Generative Language API, grant an applicable API scope, select a user project, or promise quota. Gemini has an OAuth quickstart, but it requires a Google Cloud project, enabled Generative Language API, configured consent screen and appropriate OAuth credentials; its documented setup is simplified for testing and cautions production applications to choose credentials deliberately [8]. A Google OAuth token authorizes only the scope granted by the user, and scopes should be requested incrementally at the moment the feature is used [9].

Gemini API currently has a Free Tier for an active project or free trial and access to some models, but rate limits are per project—not per API key—and vary by model and account status [6] [7]. Therefore the product must state **“Google-authorized access subject to the user project’s current eligibility and quota”**, not “free API access because the user is logged into Google.” A request that succeeds must identify `USER_DELEGATED_GOOGLE_AI_SUGGESTION`, project attribution mode, model and timestamp; it remains an untrusted structural suggestion.

The P0 analyzer must not carry this option. A separate feasibility spike must first prove, using a real registered **web** OAuth client and an allowlisted test project: browser-appropriate OAuth flow/PKCE, granted-scope check, current Gemini endpoint CORS behavior, exact user-project attribution/header rules, token non-persistence, token expiry/revocation handling, quota error mapping and no refresh-token storage. The existing Gemini OAuth quickstart demonstrates desktop/local ADC setup, so it cannot simply be copied to GitHub Pages. Until that spike passes, client direct calls are a typed `USER_DELEGATED_ACCESS_UNAVAILABLE` state, not a fallback.

A user-visible external-window bridge cannot read the external Gemini page. Browser same-origin policy restricts cross-origin script/document reads; cross-origin window references have only limited safe access and `postMessage` requires cooperation of both documents [1]. An iframe can also be refused by the embedded site through `X-Frame-Options` [1]. A WebSocket is a duplex connection to a WebSocket **server**, not a capability to retrieve another site’s HTML or DOM [2]. Therefore, **WebSocket, hidden tab, hidden iframe, DOM scraping and cross-origin bypass are forbidden designs**.

For mode B, the local schema accepts only:

```json
{
  "schemaVersion": "1",
  "classification": "string",
  "candidatePatterns": ["string"],
  "questionsForCore": ["string"],
  "explanation": "string"
}
```

It excludes `invariant`, `proof`, `lean`, `verified`, `trustStatus`, `url`, `html`, executable code, credentials and provider tokens. Input/output size limits, strict JSON parsing, schema validation, local escape-safe rendering and explicit delete control are mandatory.

## 6. Existing-code impact and debt correction

| Current component | Finding | Required relation to new task |
|---|---|---|
| `RicisWasmBridge.evaluate()` | Correctly returns only C# result or typed recovery failure. | Preserve unchanged; add negative regression tests that analyzer is never invoked automatically. |
| `coreRecovery.ts` / recovery UI | Correctly says no invariant/trace/proof was created. | Add a secondary explicit local-analysis entry point; retain original failure wording. |
| `RicisFallbackEngine` | Contains useful safe arithmetic/bracket fragments but also claims `typescript_native`, `QED_VERIFIED`, `isVerified: true` and legacy fixed-pattern results. | Do not call it as P0 analyzer. Extract only audited, pure utilities after tests; deprecate false-verification semantics in a separately approved compatibility migration. |
| `IRicisCoreEngine` | Allows `typescript_native` and proof types that can blur trust boundaries. | Do not extend this contract for P0. Create a separate `ILocalRicisAnalyzer` contract. |
| `logic.ts` | Local proof/draft path already exists outside strict evaluate path. | Keep local analyzer result separate from `Proof`; prohibit resolved-node promotion based on analyzer or AI result. |
| Existing `/api/generateProof` | Server-side Gemini setup exists. | Do not call it from analyzer; new capability needs a separate, narrow request schema, auth/consent/rate policy and server validation. |

## 7. Acceptance criteria

| ID | Acceptance criterion |
|---|---|
| AC-01 | Core failure remains a `CoreExecutionFailure`; analyzer is absent unless user selects it explicitly. |
| AC-02 | Every analyzer result has an immutable source, parse status, typed analyzer status, trace provenance and no Core `executionEngine`. |
| AC-03 | `L1_IDENTITY` requires exact canonical AST equality; numeric coincidence is insufficient. |
| AC-04 | SP2/SP4 pattern match produces a candidate and `REQUIRES_CORE_VERIFICATION`, never an asserted Core invariant. |
| AC-05 | Unsupported input and resource limits produce typed diagnostics without `NaN`, `eval`, `Function` or throw-based user flow. |
| AC-06 | Analyzer/AI result cannot mark a node resolved or promote Lean/proof status. |
| AC-07 | Server Gemini route is explicit-consent, bounded, schema-validated, rate-limited and provenance-labelled. |
| AC-08 | GitHub Pages user-mediated path has no provider key, no hidden window, no iframe/DOM scraping/WebSocket workaround and no automatic external data collection. |
| AC-09 | P0 has direct tests for every public method and negative tests for automatic fallback, false invariant, false proof status, malformed AI JSON and cross-origin bridge denial. |

## 8. Complexity assessment

The P0 deterministic analyzer is **medium-high complexity** because a safe AST/trust boundary must replace a legacy regex-shaped pseudo-engine without breaking strict Core-first behavior. It is not a small UI fallback. The lowest-risk delivery is several approved two-hour increments.

| Increment | Deliverable | Complexity | Estimated effort | Dependency |
|---|---|---:|---:|---|
| A0 | Current assessment and acceptance contract | 2/5 | completed | None |
| A1 | Architecture: isolated AST/status/trace/DI contracts | 3/5 | 2 h | A0 approval |
| A2 | QA: parser, L1/SP4, non-promotion, resource-limit and no-auto-fallback tests | 4/5 | 2 h | A1 approval |
| A3 | Safe parser/normalizer and immutable AST implementation | 4/5 | 2 h | A2 approval |
| A4 | Deterministic classifier, trace and Core recovery UI branch | 4/5 | 2 h | A3 |
| A5 | Regression/debt boundary: prohibit legacy engine proof/status reuse; migration report | 3/5 | 2 h | A4 |
| B1 | User-mediated bridge UI, prompt template, JSON validator, provenance and deletion | 3/5 | 2 h | A4 |
| B2 | Optional same-origin server Gemini enrichment: consent, rate limit, request/response schema, redaction | 4/5 | 2–4 h | A4; server deployment |
| B2a | Google OAuth user-delegated feasibility spike: PKCE, scope, CORS, user-project quota attribution, non-persistence and revocation | 4/5 | 2 h | A4; Google Cloud test project and registered web client |
| B2b | Optional user-delegated browser integration only if B2a passes: consent UX, short-lived token, bounded request, quota errors, provenance and client security tests | 5/5 | 4–6 h | B2a approval |
| B3 | Adversarial security and e2e regression, documentation and release | 4/5 | 2 h | A5 + B1; B2/B2b optional |

**P0 deterministic local analyzer:** approximately **10–12 focused engineering hours** after Step 1 approval.
**GitHub Pages user-mediated bridge:** add **2 hours**.
**Production server-side Gemini enrichment:** add **2–4 hours** plus deployment/quota/secret-operational prerequisites.
**User-delegated Google OAuth integration:** add **6–8 hours** only after a separate 2-hour feasibility spike confirms the browser flow, provider policy, CORS and user-project quota attribution.

**Not included:** reimplementing Ricis.Core symbolic solver, remote host API/VPN deployment, formal Lean proof, autonomous browser automation, arbitrary web scraping or a generic AI agent.

## 9. Risks and mitigations

| Risk | Severity | Mitigation |
|---|---:|---|
| Legacy fallback is mistaken for a formal solver | Critical | Separate contract/result type, no `isVerified`, no Core success, direct non-promotion tests. |
| Scope grows into duplicating Core | Critical | P0 limited grammar and candidate classification; unsupported always typed. |
| Gemini hallucination changes analysis | High | AI has no invariant/trust fields; schema validation, provenance, display as suggestion only. |
| GitHub Pages exposes provider credential | Critical | No provider key or automatic API call in static path; only user-mediated flow. |
| Browser cross-origin workaround leaks data or breaks policy | High | Explicit prohibit hidden tab/iframe/DOM scraping/WebSocket bypass; use official backend API or copy/paste. |
| Input-driven parser resource exhaustion | High | Input/token/depth/trace-size limits and deterministic cancellation status. |
| Existing UI semantics are weakened | High | Keep Core recovery unchanged; analyzer opt-in and visually separate. |

## 10. Approval boundary

Этот утверждённый Step 1 authorizes only preparation of Step 2 architecture. Step 2 определит TypeScript contracts для `ILocalRicisAnalyzer`, immutable AST, `AnalyzerResult`, `LocalAnalysisTrace`, `AnalyzerProvenance`, `IGeminiStructuralEnricher` и `IUserMediatedSuggestionValidator` — без parser implementation, UI, server endpoint или Gemini call. Step 3 QA и любая реализация потребуют отдельных явных approval.

## References

[1]: [MDN: Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy)
[2]: [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[3]: [Current strict Core bridge](../../src/services/ricisCore/RicisWasmBridge.ts)
[4]: [Current Core recovery contract](../../src/services/coreRecovery.ts)
[5]: [Current Core-first regression tests](../../src/services/ricisCore/ricisCoreEngine.test.ts)
[6]: [Gemini API billing](https://ai.google.dev/gemini-api/docs/billing)
[7]: [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
[8]: [Gemini OAuth quickstart](https://ai.google.dev/gemini-api/docs/oauth)
[9]: [Google OAuth 2.0 authorization](https://developers.google.com/identity/protocols/oauth2)
[10]: [Project development contract](../../AGENTS.md)
