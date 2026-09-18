# Agent Gateway — Шаг 1: business specification и provider assessment

**Статус:** `APPROVED — пользователь подтвердил переход к Шагу 2: architecture-only contracts. Runtime implementation remains subject to later QA and implementation gates.`

## 1. Решение задачи

`Ricis3-Expansion-Map` должен заменить текущий Gemini-specific access path на **provider-agnostic Agent Gateway**. Gateway даёт приложению единую доменную точку доступа к разрешённым AI services, скрывает provider SDK/API details за adapter boundary и передаёт агенту контролируемый Lean-контекст, сформированный из RICIS.

Приложение выбирает версионированный вопрос из внешнего catalog шаблонов, собирает минимально необходимый Lean context и отправляет их агенту вместе с ожидаемой JSON schema. Внутри строго заданного tool budget агент **сам решает**, достаточно ли supplied Lean context или следует вызвать единственный allowlisted server-side tool `web_search`. Ответ допускается только как JSON, который Gateway проверяет against the expected schema before its content is returned to UI or any application feature.

> **Ключевой принцип:** agent получает вопрос, Lean-контекст и JSON schema, но не получает произвольный доступ в интернет. Он может выбрать только заранее предоставленный `web_search`; не может вызвать URL, посетить ссылку, скачать артефакт, выполнить код, менять provider configuration или сохранять credentials.

Сейчас server-specific `callAIWithFallback` в `server.ts` одновременно хранит Gemini model pool, читает `GEMINI_API_KEY`, повторяет calls и выбирает fallback. В UI параллельно существует второй `AVAILABLE_GEMINI_MODELS`. Это два source-of-truth для одной capability. Кроме того, `runAgentDiscovery` сейчас изменяет nodes/edges research map; он не является RICIS Lean question flow и не может быть использован как provider gateway.

## 2. Application-led JSON-сценарий

> Как пользователь приложения, я получаю machine-readable и понятный ответ на заранее определённый исследовательский вопрос по выбранному RICIS Lean-артефакту. Приложение выбирает approved question template and response schema, передаёт доказательный контекст и отображает, ответил ли агент только по контексту либо дополнил его cited web sources. Агент может сам решить, нужен ли поиск, но не получает неконтролируемые полномочия.

| Шаг | Исполнитель | Результат |
|---|---|---|
| 1. Выбор вопроса | Приложение | Выбирает `AgentQuestionTemplate` и его `AgentResponseSchema` по feature/сценарию. Текст вопроса и schema resource лежат во внешних versioned resources, а не hard-coded в TypeScript. |
| 2. Сбор контекста | `LeanContextAssembler` | Из утверждённого RICIS export формирует ограниченный `LeanContextEnvelope`: artifact id, hash, locale, source classification, compiled-verification metadata и только нужные Lean fragments. |
| 3. Проверка передачи | Gateway policy | Проверяет user/artefact permission, consent for external AI processing, server-runtime availability, provider approval, token budget и запрет OAuth-token/private-key export. |
| 4. Вызов агента | `IAgentProvider` | Provider receives question, Lean envelope, schema identifier/contract and `toolChoice: AUTO`. Agent answers from context or autonomously invokes the advertised search tool within budget. |
| 5. Schema validation | Gateway | Parses JSON and validates it against the exact response schema, including allowed enums, required provenance, string/array limits and source URL rules. Invalid output becomes typed `INVALID_PROVIDER_OUTPUT`; it is not rendered as an answer. |
| 6. Нормализация результата | Gateway | Returns validated answer, `answerBasis`, Lean artifact references, web citations, tool-usage provenance, model/version and redacted cost/quota state. |
| 7. Представление | Приложение | Renders only validated JSON fields through localized report templates. Response is always labelled `EXTERNAL_AI_SUGGESTION`; it never changes RICIS proof state. |

The initial questions will be selected deliberately during a future prompt-design increment. The gateway therefore accepts a **template identifier, structured parameters and response-schema identifier**, not a raw hard-coded prompt string. Template prose and JSON schemas support localization/versioning and follow the established external resource/template approach.

## 2.1. Второй контур: контрольные вопросы по аксиомам

После основного structured response application may issue a compact, preselected `AxiomControlTemplate`. This is **verification of the provider answer path**, not agent retraining, not a new request to rediscover RICIS theory and not a mechanism to promote proof trust. Control templates are selected by the application from `RicisKnowledgeProfile`; their question text, expected schema and expected semantic outcome are external versioned resources.

| Контур | Назначение | Tool policy | Последствие |
|---|---|---|---|
| Основной | Получить structured research answer for selected Lean context. | `AUTO`: context-only or one allowlisted cited web search. | Returns `EXTERNAL_AI_SUGGESTION`. |
| Контрольный | Проверить, что provider returns a known RICIS axiom/profile result in exact JSON shape. | `NONE`: no search, no arbitrary network and no repeated full Lean transfer. | Gateway returns `PASS`, `KNOWLEDGE_CONFLICT` or `INVALID_PROVIDER_OUTPUT`. A `PASS` never creates or upgrades a proof. |

The first mandatory control profile is `RICIS_TYPED_ZERO_SAME_GENERATOR_RATIO_V1`. For the RICIS semantic-indexing rule SP3/A4, when the profile declares that numerator and denominator are the same typed-zero generator context `F`, the expected semantic value is `1`. The control JSON must name the profile, return the value `1`, cite `SP3` and `A4`, state that it is a semantic RICIS outcome, and retain the profile's supplied trust status. Until a compiled Lean artifact is attached to the profile, the profile must remain `TRUSTED_AXIOM` or `REQUIRES_CORE_LEAN` as applicable; a provider's correct answer cannot make it `LEAN_VERIFIED`.

## 2.2. Qualification lifecycle: provider interview before RICIS work

The axiom-control set is an **interview for a concrete AI configuration**, not a claim that a vendor or model is permanently reliable. The application forms a `ProviderQualificationKey` from provider id, model id, adapter contract version, provider-reported model/version fingerprint when available, response-schema set revision and the hashes of all required `RicisKnowledgeProfile` resources. A pass for one key never transfers to another model, version, adapter or knowledge-profile revision.

| Qualification state | Meaning | Permission for RICIS work |
|---|---|---|
| `UNQUALIFIED` | No valid interview record exists for the exact qualification key. | Agent may receive only a bounded qualification/interview call or a quarantined same-request preliminary response; it may not produce an accepted, rendered or persisted RICIS answer. |
| `QUALIFYING` | Application is running the compact control set as part of the current bounded request. | No main answer is shown, persisted as usable evidence or acted on until conclusion. |
| `QUALIFIED` | Every required control returned schema-valid expected result under `ToolSelectionPolicy.NONE`. | May handle approved, bounded RICIS question templates while the key remains valid. Every result stays `EXTERNAL_AI_SUGGESTION`. |
| `QUALIFICATION_FAILED` | Any control conflicts with expected profile, invokes a tool, violates JSON schema or is unavailable. | RICIS work is denied; response is recorded as a redacted diagnostic only. |
| `STALE` | The provider/model/adapter/schema/profile/policy key changed after a pass. | Requalification is required before further RICIS work. |
| `REVOKED` | Security, entitlement, consent, policy or provider-health rule invalidated the configuration. | RICIS work is denied until a new compliant qualification succeeds. |

The application may collect a non-authoritative preliminary response before sending controls, but it must not display, store as an application finding, or act on that response until the qualification interview passes. The preliminary payload remains quarantined in request memory and is discarded on any failed/stale/revoked conclusion. The control interview may alternatively run before the primary question when an existing qualification is absent. Qualification runs within the explicit user-triggered request; P0 introduces no scheduled probing or background provider activity.

## 2.3. Alternative RICIS engine candidate boundary

The application should be ready for a future in which an AI agent or other engine already contains a RICIS graph. Such a system is an **alternative RICIS engine candidate**, not automatically a mathematical authority. A provider assertion that it was trained on, contains, or recognizes the graph is untrusted metadata; semantic compatibility is established only through the declared graph manifest and the contract suite.

| Classification | Required evidence | Permitted result |
|---|---|---|
| `EXTERNAL_AGENT` | Provider/model descriptor and ordinary gateway qualification. | `EXTERNAL_AI_SUGGESTION` only. |
| `RICIS_ENGINE_CANDIDATE` | Versioned `RicisGraphManifest` declaration: graph id/version/hash, implemented axiom/profile ids, response-schema set and engine capability manifest. | May enter graph-compatibility interview; not an authority. |
| `RICIS_COMPATIBLE_ENGINE` | Exact manifest comparison plus full deterministic profile/control suite pass for the specific engine qualification key. | May return an **alternative-engine result** with explicit compatibility provenance. It remains `REQUIRES_CORE_LEAN` or the supplied source status, never self-promoted. |
| `AUTHORITATIVE_RICIS_CORE` | Actual approved Ricis.Core/Lean execution path and its own verification output. | Sole source that can produce or preserve final Core/Lean proof status. |

`RicisGraphManifest` is an external, versioned and hash-addressed resource. It identifies graph nodes/edges, applicable axiom profiles, required control templates, expected JSON schema revisions and compatibility-suite revision. An agent never writes this manifest from its own output. When the graph, adapter, model fingerprint, profile, schema or policy changes, the engine compatibility record becomes `STALE` and qualification must be repeated.

> **Future-proofing rule:** the system may use a qualified compatible engine as an alternative computational/explanatory path, but its result must keep independent provenance. It is not substituted into `RicisWasmBridge.evaluate()` and it cannot cause the TypeScript client to claim `LEAN_VERIFIED`.

## 3. External question and JSON-schema contract

A question template is not merely a text string. It binds the allowed parameters, Lean context profile, expected response schema, tool policy and rendered report template. The response schema must be a versioned external JSON resource, reviewed together with the template. It is a contract, not a suggestion to the model.

| Contract field | Purpose | Gateway requirement |
|---|---|---|
| `schemaVersion` | Identifies a immutable `ricis.agent-answer.*` response contract. | Required and exact-match; unknown version is rejected. |
| `responseKind` | States `ANSWER`, `INSUFFICIENT_CONTEXT`, `TOOL_UNAVAILABLE`, `QUOTA_UNAVAILABLE` or `REFUSAL`. | Closed enum; no free-form status is interpreted as an application result. |
| `answerBasis` | States `CONTEXT_ONLY` or `CONTEXT_AND_WEB`. | `CONTEXT_AND_WEB` requires tool provenance and at least one valid web citation. |
| `answer` | Schema-specific structured fields, for example findings, limitations and suggested questions. | Field names, types, bounds and localization render mapping are schema-controlled. |
| `leanEvidence` | References only supplied Lean artifact IDs/hashes and permitted fragment identifiers. | Each reference must belong to the submitted envelope; raw Lean is never replaced or silently synthesized. |
| `webEvidence` | Normalized citation objects: HTTPS URL, title, cited claim mapping and retrieval/provenance reference. | Must be empty for `CONTEXT_ONLY`; is validated and displayed as external evidence only. |
| `toolUsage` | `webSearchInvoked`, tool-call count and bounded outcome. | Must agree with gateway-observed tool events; provider self-report is not sufficient. |
| `limitations` | Explicit unknowns, tool/coverage caveats and no-proof disclaimer. | Required for answer kinds that depend on incomplete context or external sources. |

Schema validation is deterministic. P0 does **not** apply an unbounded LLM “repair” loop to malformed JSON. A valid provider-native structured-output feature may be used by an adapter where officially supported; otherwise the adapter must request JSON and Gateway validates it. Malformed, oversized, duplicate-key or schema-mismatched output yields a typed non-answer and redacted audit evidence.

## 4. Role of Lean context and proof boundary

Lean text is a research input, not an authorization to redefine proof status. `LeanContextEnvelope` carries a content hash and only Ricis.Core-originated verification metadata. The agent can explain, summarize, compare, formulate questions and identify gaps; it may not compile Lean, assert that compilation occurred, produce `LEAN_VERIFIED`, resolve a RICIS node or replace Core evaluation.

| Context fact | Agent may do | Agent may not do |
|---|---|---|
| Source Lean fragment | Explain symbols, dependency relationships and apparent proof intent in schema-approved fields. | Treat uncompiled text or a model interpretation as a compiled proof. |
| Ricis.Core verification metadata | Quote the supplied status with artifact reference. | Upgrade, downgrade or create a trust status. |
| Selected research question | Answer from supplied context or decide to search via available tool. | Invent an additional privilege, template, tool or network destination. |
| External web result | Return cited, schema-valid external evidence. | Treat it as RICIS proof or automatically ingest it into the knowledge base. |

> **Trust boundary:** `RicisWasmBridge.evaluate()` remains Core-first and unchanged. No local TypeScript calculation or external agent output can claim `LEAN_VERIFIED`, resolved proof status or mathematical computation authority.

## 5. In-scope P0 capability

The P0 gateway is server-first. Static hosting receives a typed `STATIC_HOST_UNAVAILABLE` state: no key, provider call, web search, Lean export or synthetic fallback is emulated in browser storage.

| Capability | P0 result |
|---|---|
| Provider adapter base | One interface and abstract base behaviour for capability declaration, input validation, structured-output request mapping, result normalization, retry classification and redacted diagnostics. |
| Registry | Immutable approved provider descriptors, model/capability catalog and run-time availability snapshot. It is not a credential store. |
| Existing Gemini extraction | The current server-side Gemini caller becomes an adapter behind the common contract without changing its secret boundary. |
| Lean context assembly | A bounded, permission-aware, hash-addressed envelope selected from RICIS artifacts. Raw documents, OAuth tokens, private keys and unrelated user data are excluded. |
| Curated question and schema resources | Versioned, localized external templates plus JSON schemas and validators; no prompt prose or report prose is hard-coded in application code. |
| RICIS Knowledge Profile | Application-owned manifest connecting approved axiom/theorem profiles to expected control JSON outcomes, source artifact references and pre-existing trust status; it is not a model-memory claim. |
| Provider qualification | An exact provider/model/version/adapter/schema/profile interview record gates RICIS work; a successful record is invalidated by any qualification-key change. |
| Alternative engine classification | An agent/engine may declare a versioned RICIS graph manifest and qualify as a compatibility-tested alternative engine candidate; no declaration changes Core/Lean authority. |
| Autonomous tool election | `toolChoice: AUTO` means agent chooses between supplied Lean context and only the pre-authorized web-search tool. Gateway controls capability, request count, time, output/citation budget and egress. |
| Structured result validation | Provider result is JSON-parsed and schema-validated before use. Invalid result has a typed denial state and cannot be rendered as a finding. |
| Candidate-provider research | A selected internal question may ask for new AI APIs. The agent may search if needed and return schema-valid cited `ProviderCandidate` records for later human review. It cannot activate an adapter or provider. |
| Audit | Append-only redacted record of template/schema id/version, Lean artifact hashes, consent, provider/model, observed tool decision, citation hashes, JSON-validation result, candidate hash and typed result state. |

## 6. Required common vocabulary

| Domain term | Meaning |
|---|---|
| `AgentProviderId` | Branded immutable provider identifier, not a URL supplied by an agent. |
| `AgentCapability` | Closed feature declaration such as `text_completion`, `structured_json`, `web_search_with_citations`, `model_catalog`. |
| `ProviderDescriptor` | Static reviewed metadata: provider, server runtime requirement, allowed endpoint family, auth kind, privacy/cost caveat and capability declaration. |
| `ProviderAvailability` | Run-time typed state: `UNCONFIGURED`, `DISABLED`, `READY`, `QUOTA_EXHAUSTED`, `RATE_LIMITED`, `UNAVAILABLE`, `STATIC_HOST_UNAVAILABLE`, `REQUIRES_REAUTH`. |
| `LeanContextEnvelope` | Bounded RICIS-derived input with artifact references/hashes, locale, classification, Core-originated status metadata and selected Lean fragments. |
| `AgentQuestionTemplate` | External versioned/localized question resource with id, version, parameter schema, Lean context profile, response-schema id and tool policy. |
| `AgentResponseSchema` | External versioned JSON schema that defines permissible answer fields, result enums, evidence and bounds. |
| `RicisKnowledgeProfile` | Versioned application-owned manifest of known RICIS axiom/theorem profiles, expected control outcomes, source artifact references and immutable trust status. |
| `AxiomControlTemplate` | External versioned compact question bound to one `RicisKnowledgeProfile`, a control response schema and `ToolSelectionPolicy.NONE`. |
| `AxiomControlOutcome` | Typed result: `PASS`, `KNOWLEDGE_CONFLICT`, `INVALID_PROVIDER_OUTPUT` or `CONTROL_UNAVAILABLE`; it is an agent-quality signal, never proof status. |
| `ProviderQualificationKey` | Immutable fingerprint of provider/model/adapter/schema/profile/policy inputs on which an interview result depends. |
| `ProviderQualificationState` | `UNQUALIFIED`, `QUALIFYING`, `QUALIFIED`, `QUALIFICATION_FAILED`, `STALE` or `REVOKED`; it gates approved RICIS work and is not a mathematical trust status. |
| `RicisGraphManifest` | External immutable graph id/version/hash and contract resource listing nodes, axiom profiles, control templates, schema revisions and compatibility-suite revision. |
| `EngineClassification` | `EXTERNAL_AGENT`, `RICIS_ENGINE_CANDIDATE`, `RICIS_COMPATIBLE_ENGINE` or `AUTHORITATIVE_RICIS_CORE`; a compatibility classification is distinct from proof trust. |
| `EngineCompatibilityRecord` | Exact qualified engine/graph manifest/control-suite combination, invalidated on any relevant input change. |
| `ToolSelectionPolicy` | Gateway-owned rule specifying `NONE` or `AUTO`; under `AUTO`, only registered server-side tools are exposed and usage is bounded. |
| `AgentRequest` / `AgentResult` | Provider-neutral bounded payload/result. Result carries validated structured JSON, provenance, model and timestamps; it has no RICIS trust-promotion fields. |
| `ProviderCandidate` | Untrusted discovered metadata record with official source URLs, claimed auth model, free-tier wording, capability evidence and review state. |
| `DiscoveryEvidence` | Source URL, title, excerpt hash, retrieval timestamp and citation location. It is data, not executable configuration. |

## 7. Provider matrix based on official documentation

Free access changes frequently; the registry must show the claim as a dated capability observation, not a permanent product promise.

| Provider | Verified useful capability | Free/cost boundary | Autonomous search suitability | P0 disposition |
|---|---|---|---|---|
| Gemini Developer API | Existing repo server has a Gemini API-key caller. | Free tier applies to some models in an active project/free trial; quota is project/model/account dependent. [1] [2] | Not assumed: existing repo usage is generation only. | Extract existing caller first. |
| Groq | Free-plan rate limits and `groq/compound` systems are documented. Compound web search returns citations. [3] [4] | Limits apply at organization level; built-in-tool pricing must be checked at activation time. [3] [5] | **Candidate preferred for `AUTO` tool election** because provider agent can decide whether to search and returns citations. | Future adapter; disabled until credential and policy approval. |
| OpenRouter | Unified API and `:free` model variants. [6] | Free variants have 20 RPM / 50 RPD before credit threshold; web search can add cost even with a free model. [6] [7] | Technically possible, but disabled until an explicit nonzero-cost search policy is approved. | Future inference adapter. |
| Hugging Face Inference Providers | Routed inference across multiple providers. [8] | Free user experimentation credit is $0.10 monthly and subject to change. [8] | No provider-wide autonomous web-search capability verified in this research. | Low-priority context-only inference candidate. |
| Cloudflare Workers AI | 50+ open models, Free and Paid plans. [9] | Actual allowance/limits must be reviewed at activation. [9] | No provider-wide autonomous web-search capability verified here. | Deployment-hosted, context-only candidate. |

## 8. Autonomous web-search and structured-output guardrails

`AUTO` is not unrestricted browsing. It merely exposes the specific search tool declared by the approved provider adapter for this request. The tool is server-executed; the browser never receives provider credentials or a general network channel.

| Control | Required policy |
|---|---|
| Tool surface | Zero or one tool: `web_search_with_citations`. No arbitrary HTTP fetch, browser automation, code interpreter, file upload, website visit or plugin from agent output. |
| Axiom control isolation | An `AxiomControlTemplate` uses `ToolSelectionPolicy.NONE`; it cannot invoke web search, transmit a full Lean bundle or become a hidden agent-training loop. |
| Qualification gate | A RICIS answer can be accepted, rendered or persisted only for an exact `QUALIFIED` `ProviderQualificationKey`. `UNQUALIFIED`, `QUALIFICATION_FAILED`, `STALE` and `REVOKED` may execute only the bounded qualification/interview path; all preliminary work output is quarantined and non-publishable. |
| Engine-manifest gate | `RICIS_COMPATIBLE_ENGINE` requires exact `RicisGraphManifest` and compatibility-suite match. A provider claim that it is trained on RICIS is not evidence and cannot elevate classification. |
| No automatic probing | Requalification occurs only within an explicit application request; P0 has no scheduler, hidden interval, background task or user-independent provider call. |
| Invocation decision | The agent may decide `CONTEXT_ONLY` or `CONTEXT_AND_WEB`; application does not need to say “search”. |
| Search budget | Per request maximum for tool calls, sources, tokens, elapsed time and allowed provider cost. Budget exhaustion produces typed partial/unavailable state. |
| Source evidence | Citations are required whenever a tool call happened. Missing, malformed or non-HTTPS source evidence makes web evidence unavailable, not trusted. |
| JSON result | Gateway accepts only JSON that passes the selected `AgentResponseSchema`; schema failure returns `INVALID_PROVIDER_OUTPUT` and never free-form fallback. |
| Tool provenance | Gateway records observed tool events and compares them to `toolUsage`. A model cannot claim a search it did not perform or omit one it did. |
| Prompt injection | Lean comments, template parameters, tool snippets and web excerpts remain data. None can change roles, policy, tool surface, registry, network boundary, JSON schema or RICIS trust state. |
| Content egress | Lean context is classification-checked and minimized before external processing. OAuth tokens, session tokens, private keys, host enrolment material and undisclosed user data are prohibited. |
| Provider discovery | Candidate cards are created only from validated structured output plus citations. They are `DISCOVERED_UNTRUSTED`; no card activates an adapter, stores a key, changes default model or schedules work. |
| Availability | A provider can be `READY` for context-only answers but unavailable for `AUTO` search. Quota, rate, payment, structured-output and tool availability remain separate typed facts. |

## 9. Security and privacy requirements

| Risk | Required control |
|---|---|
| Credential exposure | Secrets stay only in server-side secret storage or user-controlled provider configuration. Registry, browser DTO, audit record, Lean envelope and candidate card contain no raw key/token. |
| Private Lean export | Send only the designated exportable fragments after artifact permission and external-processing consent. Permit revocation stops future requests; it does not claim deletion from an already contacted provider. |
| False “free” claim | Candidate stores a dated source citation and `FREE_TIER_UNVERIFIED` until human validation of current provider terms. Runtime maps quota/payment/rate errors explicitly. |
| Invalid JSON / schema bypass | Strict parsing, duplicate-key rejection, schema validation, maximum depth/bytes/items and observed-tool reconciliation occur server-side before the result can leave Gateway. |
| Untrusted instructions | Model, Lean and search output cannot mutate configuration, RICIS proof state, host config, authorization, templates, schemas or networking. |
| SSRF/arbitrary fetch | Adapter owns the fixed provider endpoint. No output URL is fetched by the application in this workflow. |
| Uncontrolled autonomous agent | Tool allowlist, `AUTO` policy, max tool calls, timeout, token/cost budget, response schema and audit remain Gateway authority. |
| Unauthorized user feature use | Server-side feature entitlement and artifact permission apply before any external request. UI hiding never implements authorization. |
| Static host secret use | Static client gets typed denial. Browser cannot receive project key or call provider/search with a shared credential. |
| RICIS trust confusion | Agent outputs are `EXTERNAL_AI_SUGGESTION`. They cannot resolve a node, create proof, write Lean, compile Lean or upgrade `REQUIRES_CORE_LEAN`. |

## 10. Acceptance criteria and future QA suite

| ID | Criterion |
|---|---|
| AG-01 | Every public gateway method returns typed result/denial; no user flow exposes raw provider exception, API key, OAuth token or private key. |
| AG-02 | Gemini model pool exists in exactly one provider registry source; UI derives options from gateway DTO rather than a duplicate Gemini-only list. |
| AG-03 | An adapter cannot execute until descriptor is reviewed, server runtime is present, credential is configured, feature entitlement/artifact permission is valid and capability checks pass. |
| AG-04 | `free` never means guaranteed access. `quota_exhausted`, `rate_limited`, `payment_required`, `tool_unavailable`, `invalid_provider_output` and `provider_unavailable` remain distinct typed results. |
| AG-05 | The application can choose an external, versioned question template and exact JSON schema and supply a bounded Lean envelope without question/report prose being hard-coded in implementation code. |
| AG-06 | With `AUTO`, an agent can return schema-valid `CONTEXT_ONLY` without invoking search; with search it returns `CONTEXT_AND_WEB`, validated citations and gateway-observed tool provenance. |
| AG-07 | Malformed JSON, a duplicate key, invalid enum, unknown Lean reference, excessive output, non-HTTPS citation or mismatched tool declaration results in typed rejection before UI rendering. |
| AG-08 | `AUTO` exposes no tool other than configured `web_search_with_citations`; arbitrary URLs, website visit, code execution, uploads and downloaded execution are denied by construction. |
| AG-09 | A provider candidate can be recorded only as validated `DISCOVERED_UNTRUSTED`; it cannot create a connector, provider secret, adapter, code change, active selection or recurring task. |
| AG-10 | Each Lean-context request rejects tokens/keys, unauthorized artefacts, oversized fragments and unconsented external processing before provider invocation. |
| AG-11 | All agent result types explicitly exclude `resolved`, `isVerified`, `proof`, `lean`, RICIS invariant and trust-promotion fields. |
| AG-12 | Every future public adapter, registry, context assembler, schema validator and tool-policy method has direct positive, negative, quota/retry, malformed-JSON, redaction, artifact-permission, consent and static-host regression tests. |
| AG-13 | The application may issue a post-response control only from an external `AxiomControlTemplate` linked to `RicisKnowledgeProfile`; the template is `NONE` for tools and transmits no full Lean bundle. |
| AG-14 | `RICIS_TYPED_ZERO_SAME_GENERATOR_RATIO_V1` accepts value `1` only when its profile identifier, SP3/A4 basis, schema version and profile trust status match exactly. Wrong value, missing basis, false `LEAN_VERIFIED`, tool call, malformed JSON or unknown profile yields `KNOWLEDGE_CONFLICT` or `INVALID_PROVIDER_OUTPUT`. |
| AG-15 | A matching axiom-control answer is a provider-quality `PASS` only. It cannot write RICIS knowledge, alter a theorem profile, resolve a node or promote any proof status. |
| AG-16 | Only `QUALIFIED` exact `ProviderQualificationKey` configurations may produce an accepted, rendered or persisted RICIS structured answer. Every other state permits at most a bounded qualification/interview path, whose preliminary output is quarantined and non-publishable. |
| AG-17 | Changing provider id, model id, adapter version, available model fingerprint, response-schema revision, Knowledge Profile hash or policy input invalidates the prior pass as `STALE`. |
| AG-18 | A provider control interview uses `ToolSelectionPolicy.NONE`; a tool event, policy violation, failed control, malformed JSON or unavailable provider produces `QUALIFICATION_FAILED`, not a partial pass. |
| AG-19 | `QUALIFIED` means compatibility with the declared compact control set only. It does not represent general reliability, user authorization, external data truth, proof completion or a RICIS trust taxonomy value. |
| AG-20 | An agent may be classified `RICIS_ENGINE_CANDIDATE` only with an external immutable `RicisGraphManifest`; provider self-description or generated graph content is insufficient. |
| AG-21 | `RICIS_COMPATIBLE_ENGINE` requires exact manifest hash, engine qualification key, required profile/control suite and schema revision match. Any difference invalidates the record as `STALE`. |
| AG-22 | A compatible-engine result carries `alternativeEngine` provenance and cannot invoke, replace or alter `RicisWasmBridge.evaluate()`, emit `LEAN_VERIFIED`, resolve proof state or write a graph manifest. |
| AG-23 | `AUTHORITATIVE_RICIS_CORE` is reserved for the approved Ricis.Core/Lean execution path. Gateway tests must prove that no external provider/agent classification reaches this status. |

## 11. Phased estimate

This is a high-complexity, security-sensitive integration. The dependency structure requires each two-hour increment to complete its own approved role before the next starts.

| Increment | Role and deliverable | Complexity | Estimate |
|---|---|---:|---:|
| G0 | Business specification, provider research, Lean/tool/JSON security matrix | 3/5 | completed |
| G1 | Architecture-only contracts: provider, capability, result, registry, Lean envelope, template, response schema, validator, tool policy, graph manifest and qualification ports | 5/5 | 2 h |
| G2 | QA red suite: registry, availability, redaction, no-auto-enable, envelope permission, JSON validation, tool-election, axiom-control, graph-manifest and qualification-invalidation state machines | 5/5 | 2 h |
| G3 | Core gateway/registry implementation, policy-safe test adapters, knowledge-profile/control comparison, graph-manifest and qualification ports | 5/5 | 2 h |
| G4 | Extract existing Gemini caller behind common adapter; remove duplicate model source through DTO projection | 4/5 | 2 h |
| G5 | Lean context assembler plus external localized question-template/schema catalog and deterministic validator | 5/5 | 2 h |
| G6 | Groq `AUTO` web-search and structured-output adapter contract/test implementation, but no activation without user-provided key and cost policy | 5/5 | 2 h |
| G7 | Application research orchestrator, qualification interview/control sequence, structured candidate recorder and provenance/audit ports | 5/5 | 2 h |
| G8 | User-facing question/provenance UI and typed static-host/quota/consent/schema-rejection states | 4/5 | 2 h |
| G9 | Full adversarial security regression, release evidence and publication | 5/5 | 2 h |

**Estimated P0 solution:** **18 focused engineering hours** after this Step 1 approval. It records graph-manifest and alternative-engine compatibility contracts but does not certify a real external engine. The first actual external `RICIS_COMPATIBLE_ENGINE` candidate requires a separate **4-hour** post-P0 compatibility-suite increment after a concrete graph manifest and provider configuration exist. OpenRouter, Hugging Face and Cloudflare adapters are separate future 2–4 hour increments because their credentials, rate/cost policies and server contracts differ.

## 12. Approval boundary

This revision records the required application-led, JSON-constrained behaviour. It does not create an adapter, provider API call, connector, credential, tool call, prompt template, JSON schema, user UI or persistent background worker. After explicit **«ОК»**, Step 2 will create only TypeScript interfaces, DTOs, abstract base class and policy/port contracts. Runtime implementation, tests and provider activation remain later approved steps.

## References

[1]: [Gemini billing](https://ai.google.dev/gemini-api/docs/billing)
[2]: [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
[3]: [Groq rate limits](https://console.groq.com/docs/rate-limits)
[4]: [Groq web search](https://console.groq.com/docs/tool-use/built-in-tools/web-search)
[5]: [Groq Compound built-in tools](https://console.groq.com/docs/compound/built-in-tools)
[6]: [OpenRouter limits](https://openrouter.ai/docs/api_reference/limits)
[7]: [OpenRouter web search](https://openrouter.ai/docs/api_reference/responses/web-search)
[8]: [Hugging Face Inference Providers pricing](https://huggingface.co/docs/inference-providers/pricing)
[9]: [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
[10]: [Retained provider research source](../01-architecture/AGENT_GATEWAY_PROVIDER_RESEARCH_SOURCES.md)
