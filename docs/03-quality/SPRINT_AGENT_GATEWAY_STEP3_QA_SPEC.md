# AI Agent Gateway — Шаг 3: QA specification и adversarial regression plan

**Статус:** `APPROVED — пользователь подтвердил переход к Шагу 4: deterministic implementation. Live provider activation remains outside this gate.`

**Вход:** [approved Step 1 business specification](../02-sprints/SPRINT_AGENT_GATEWAY_STEP1_BUSINESS_SPEC.md) and [approved Step 2 architecture contracts](../01-architecture/SPRINT_AGENT_GATEWAY_STEP2_ARCHITECTURE.md).

> **QA verdict before implementation:** no provider adapter, registry, JSON validator, qualification store, orchestrator, graph-manifest registry or UI is implemented until this test specification is approved. Every future public method in the approved contract has direct regression coverage before it can be used in a live provider path.

## 1. Test strategy and non-negotiable rules

Tests run in Vitest using deterministic in-memory fakes. They make **no live network request**, load no provider SDK credential, access no `process.env` secret, call no browser provider API, and do not need an active Gemini/Groq/OpenRouter/Hugging Face/Cloudflare account.

| QA rule | Required enforcement |
|---|---|
| Core-first | A test must prove every gateway result is external/alternative-engine provenance only. No test fixture, DTO or adapter can produce `LEAN_VERIFIED`, resolved proof status or Core computation. |
| Direct public-method test | Every planned public method/interfaces implemented in Step 4 has at least one direct positive and one direct negative regression test, in addition to orchestration tests. |
| Determinism | Provider answers, clock, request IDs, hashes, availability, tool events and audit sink are injected fixed values. No random/live date/network dependency. |
| No secrets | Fixtures contain provider IDs, fake fingerprints and redacted markers only. They never contain an API key, OAuth token, private key, session cookie or real Lean export. |
| Structured-only | Tests pass JSON strings to `IAgentResponseValidator`; regex extraction, prose fallback and “best effort” repair are prohibited for gateway paths. |
| One asserted cause | Tests use a single changed input per adversarial case whenever possible, so a failing test identifies the broken invariant. |
| External resources | Question templates, report strings, JSON schemas, Knowledge Profiles and Graph Manifests are fixture resources, not strings embedded in an implementation method. |

## 2. Required fixture catalog

The future QA project must implement these reusable fakes under a test-only `agentGateway/fixtures` directory. Fakes are DI inputs, not production singletons.

| Fixture | Contract exercised | Required controls |
|---|---|---|
| `FakeAgentProvider` | `IAgentProvider` | Scripted descriptor/models/availability/response/failure; capture structured request; expose observed tool events; refuse unknown endpoint or credential field. |
| `FakeProviderRegistry` | `IAgentProviderRegistry` | Immutable reviewed descriptors; known/unknown lookup; duplicate registration failure. |
| `FakeTemplateCatalog` | `IAgentTemplateCatalog` | External fixture resource lookup for localized template/schema, parameter rejection, missing/stale schema. |
| `FakeResponseValidator` / real deterministic validator fixture | `IAgentResponseValidator` | Canonical JSON parse/schema result; tool provenance reconciliation; intentionally invalid JSON inputs. |
| `FakeKnowledgeProfileCatalog` | `IKnowledgeProfileCatalog` | Version/hash bound SP3/A4 profile plus missing/unknown profile cases. |
| `FakeAxiomControlEvaluator` / real deterministic evaluator fixture | `IAxiomControlEvaluator` | Exact expected outcome comparison, `PASS`, conflict, invalid output and unavailable result. |
| `InMemoryQualificationStore` | `IProviderQualificationStore` | Exact key equality, stale invalidation, no partial pass write. |
| `FakeEngineCompatibilityRegistry` | `IEngineCompatibilityRegistry` | External/candidate/compatible classification; impossible authoritative classification. |
| `FakeAgentAuthorizationGateway` | `IAgentAuthorizationGateway` | Allowed, entitlement denied, artifact denied, consent required/revoked. Capture invocation ordering. |
| `FakeRuntimeContext` | `IAgentRuntimeContext` | Server available/unavailable without a browser workaround. |
| `CapturingRedactedAuditSink` | `IAgentAuditSink` | Captures immutable events and asserts no sensitive substring is emitted. |
| `FixedClockAndIdSource` | Time/IDs used by future application service | Stable timestamp/request/correlation/audit IDs for exact assertions. |

### 2.1 Canonical RICIS control fixture

`RICIS_TYPED_ZERO_SAME_GENERATOR_RATIO_V1` is a **test profile**, not a new proof. It has source status `TRUSTED_AXIOM` unless a separately attached compiled Lean artifact changes the source profile. The test never expects an agent answer to promote that status.

| Field | Fixture value |
|---|---|
| Profile | `RICIS_TYPED_ZERO_SAME_GENERATOR_RATIO_V1` |
| Rule basis | `SP3`, `A4` |
| Semantic context | Same typed-zero generator `F` in numerator and denominator |
| Expected JSON semantic value | `1` |
| Required `responseKind` | `answer` |
| Required `answerBasis` | `context_only` |
| Required tool calls | `0` |
| Required source trust after pass | `TRUSTED_AXIOM` unchanged |
| Forbidden outcomes | `LEAN_VERIFIED`, `resolved`, tool event, free-form result, profile mutation |

The valid control JSON fixture must itself conform to an external response-schema fixture. It must contain the profile/version, `SP3`/`A4`, semantic value `1`, source trust copied from profile, and `toolUsage` with zero calls. It does not contain an actual Lean theorem, provider secret or browser data.

## 3. Direct regression inventory

Each row is a mandatory future `describe` group. IDs are immutable QA references used by implementation pull requests and release evidence.

| QA family | Required public surface | Direct test IDs |
|---|---|---|
| AGP — provider adapter | `descriptor`, `listModels`, `checkAvailability`, `completeStructured` | `AGP-001`–`AGP-012` |
| AGR — provider registry/model projection | `findProvider`, `listDescriptors`, `AgentModelOptionDto` compatibility projection | `AGR-001`–`AGR-008` |
| AGT — templates/schema catalog | `resolveQuestion`, `findResponseSchema` | `AGT-001`–`AGT-010` |
| AGJ — structured JSON validator | `validate` | `AGJ-001`–`AGJ-020` |
| AGK — Knowledge Profile/control evaluation | `findProfile`, `findControlTemplate`, `evaluate` | `AGK-001`–`AGK-014` |
| AGQ — qualification lifecycle | `find`, `save`, `invalidate` | `AGQ-001`–`AGQ-016` |
| AGE — engine graph manifest | `classify`, `findCompatible` | `AGE-001`–`AGE-012` |
| AGA — authorization/consent/runtime/audit | `authorize`, `externalProcessingConsent`, `serverRuntimeAvailable`, `append` | `AGA-001`–`AGA-012` |
| AGI — application service | `IAgentInvocationGateway.invoke` | `AGI-001`–`AGI-021` |
| AGM — migration/Core boundary | model compatibility and static Core authority regression | `AGM-001`–`AGM-010` |

## 4. Provider and model adapter scenarios

| ID | Fixture action | Required assertion |
|---|---|---|
| AGP-001 | Read known descriptor. | `serverRuntimeRequired` is true, `defaultEnabled` is false, endpoint family is closed and descriptor contains no credential field. |
| AGP-002 | Attempt descriptor mutation after retrieval. | Mutation cannot affect a later descriptor/model call; implementation returns immutable data. |
| AGP-003 | List a reviewed provider model catalog. | Every model belongs to descriptor provider and only advertises closed capabilities. |
| AGP-004 | Provider response includes unrecognized capability string. | Adapter/registry rejects it as invalid configuration; it is never exposed to UI. |
| AGP-005 | Availability `unconfigured`, `disabled`, `quota_exhausted`, `rate_limited`, `payment_required`, `tool_unavailable`, `provider_unavailable`, `static_host_unavailable`. | Each maps to the exact typed union; none is converted to `ready`. |
| AGP-006 | Adapter receives structured request with a raw URL field injected by test cast. | Public request shape has no target URL; adapter fake rejects unknown transport input. |
| AGP-007 | Script provider `timeout`. | `ProviderInvocationFailure.timeout` is returned; raw error is not surfaced. |
| AGP-008 | Script quota/rate/payment/tool failures. | Distinct typed failure kinds remain distinguishable. |
| AGP-009 | Script result larger than `maxOutputBytes`. | `response_too_large`; body is not parsed or audited raw. |
| AGP-010 | Script valid `context_only` JSON without tool events. | Response preserves zero observed tool events for validator. |
| AGP-011 | Script valid `context_and_web` JSON plus observed citation event. | Event/citation is carried to validator unmodified. |
| AGP-012 | Script provider tries to return hidden reasoning field. | Public `ProviderStructuredResponse` has no reasoning field; audit fixture receives none. |

## 5. Structured JSON and tool-provenance red suite

| ID | Adversarial input | Required result |
|---|---|---|
| AGJ-001 | Valid canonical control JSON. | `valid` with canonical hash and allowed profile fields. |
| AGJ-002 | Non-JSON prose before/after object. | `invalid_provider_output`; no regex recovery. |
| AGJ-003 | Duplicate JSON key. | Reject deterministically. |
| AGJ-004 | Invalid UTF-8/parse error. | Reject deterministically. |
| AGJ-005 | JSON exceeds byte limit. | Reject before schema interpretation. |
| AGJ-006 | JSON exceeds depth or array count limit. | Reject before semantic result. |
| AGJ-007 | Unknown schema id/version. | Reject; no compatibility guessing. |
| AGJ-008 | Wrong `responseKind` enum. | Reject. |
| AGJ-009 | `context_only` with web evidence. | Reject. |
| AGJ-010 | `context_and_web` without HTTPS citation. | Reject. |
| AGJ-011 | `context_and_web` citation is non-HTTPS. | Reject. |
| AGJ-012 | `context_and_web` has JSON citation but no observed tool event. | Reject forged provider self-report. |
| AGJ-013 | Observed tool event exists but JSON declares `context_only`. | Reject conflict. |
| AGJ-014 | JSON reports one tool call while provider observation records two. | Reject conflict. |
| AGJ-015 | Lean reference not in submitted envelope. | Reject. |
| AGJ-016 | JSON embeds `LEAN_VERIFIED`, `resolved` or proof-promoting field. | Reject schema/forbidden-field violation. |
| AGJ-017 | Prompt-injection text inside a Lean comment requests a new tool. | It remains data; tool policy/schema do not change. |
| AGJ-018 | Web citation title/excerpt contains instruction to change provider. | It remains evidence text; registry/policy do not change. |
| AGJ-019 | Provider returns raw source body or hidden reasoning. | Public validation result/audit excludes it. |
| AGJ-020 | Valid external evidence uses tool within count/citation budget. | `valid` only if all observed budgets and schema constraints match. |

## 6. SP3/A4 control interview and qualification tests

| ID | Action | Required assertion |
|---|---|---|
| AGK-001 | Resolve known version/hash of `RICIS_TYPED_ZERO_SAME_GENERATOR_RATIO_V1`. | Returns immutable profile with `TRUSTED_AXIOM`; no model memory is consulted. |
| AGK-002 | Profile unknown or version mismatch. | Control cannot start; typed unavailable/knowledge failure. |
| AGK-003 | Resolve linked compact `AxiomControlTemplate`. | Tool policy is exactly `none`; it has no full Lean envelope field. |
| AGK-004 | Evaluate valid control JSON: same-generator `F`, value `1`, `SP3`/`A4`, zero tools. | `pass`; profile source trust unchanged. |
| AGK-005 | Change semantic value to `0`, string `"1"`, `null` or an object. | `knowledge_conflict` or invalid schema; never partial pass. |
| AGK-006 | Omit SP3 or A4. | Conflict. |
| AGK-007 | Add any tool event to control. | Conflict/failure, even if value is `1`. |
| AGK-008 | Return declared `LEAN_VERIFIED`. | Conflict; agent cannot promote profile. |
| AGK-009 | Inject unknown profile id in otherwise valid JSON. | Conflict. |
| AGK-010 | Attempt profile/manifest mutation from agent JSON. | Output rejected; catalog remains unchanged. |
| AGQ-001 | No qualification record. | State is `unqualified`; primary output cannot be released. |
| AGQ-002 | All required compact controls pass. | One exact `qualified` record is saved. |
| AGQ-003 | One of multiple controls fails. | Whole record is `qualification_failed`; no partial pass. |
| AGQ-004 | Change provider ID, model ID or adapter version. | Prior pass is stale/not found for new exact key. |
| AGQ-005 | Change provider fingerprint, schema set, profile set, tool policy or graph hash. | Prior pass is stale/not transferable. |
| AGQ-006 | Invalidate a qualified key. | State becomes `stale`/`revoked` according command; primary answer release is denied. |
| AGQ-007 | Persist a partial profile list as qualified. | Store rejects it. |
| AGQ-008 | Attempt `qualified` without zero-tool control result. | Store/application refuses write. |

## 7. Alternative-engine graph manifest tests

| ID | Action | Required assertion |
|---|---|---|
| AGE-001 | No claimed manifest. | Classification is `external_agent`. |
| AGE-002 | Agent self-description says “trained on RICIS” without manifest. | Still `external_agent`; claim is not evidence. |
| AGE-003 | Manifest has invalid/unrecognized graph hash. | `candidate_manifest_rejected`. |
| AGE-004 | Manifest is missing node or edge hash. | Rejected. |
| AGE-005 | Manifest omits required profile/control/schema revision. | Rejected. |
| AGE-006 | Exact manifest but no qualified key. | At most `ricis_engine_candidate`, not compatible. |
| AGE-007 | Exact manifest, exact key and complete required suite. | `ricis_compatible_engine` record with alternative provenance. |
| AGE-008 | Change graph manifest hash or compatibility-suite revision. | Existing compatible record is stale. |
| AGE-009 | Change model/adaptor/provider fingerprint after compatibility. | Existing compatible record is stale. |
| AGE-010 | Attempt to construct external registry result `authoritative_ricis_core`. | Type/application guard rejects it; result union has no such branch. |
| AGE-011 | Compatible engine output claims `LEAN_VERIFIED` or resolved proof. | Structured validator/gateway rejects output. |
| AGE-012 | Compatible engine result is displayed. | UI DTO exposes `alternativeEngine` provenance and source trust only; never Core authority. |

## 8. Invocation, authorization, consent and quarantine tests

| ID | Action | Required assertion |
|---|---|---|
| AGA-001 | Server runtime unavailable. | `static_host_unavailable`; no adapter method is called. |
| AGA-002 | Feature entitlement denied. | Typed denial before template resolution/provider call. |
| AGA-003 | Lean artifact access denied. | Typed denial before provider call. |
| AGA-004 | External-processing consent required/revoked. | Typed denial before provider call. |
| AGA-005 | Authorized consented request. | Application proceeds only to allowed template/qualification path. |
| AGA-006 | Audit a normal denial/result. | Event includes IDs/hashes/redacted reason only. |
| AGA-007 | Try to audit prompt, Lean text, provider body, reasoning, token, key or private key marker. | Capturing sink rejects/scrubs sensitive value. |
| AGI-001 | `control_before_primary`, unqualified provider, all controls pass. | Controls run first with no tools, record becomes qualified, then primary may be invoked/released. |
| AGI-002 | `control_before_primary`, one control fails. | Primary provider call never occurs; typed qualification failure. |
| AGI-003 | `control_after_quarantined_primary`, primary valid, controls pass. | Primary stays request-memory quarantined until pass, then is released once. |
| AGI-004 | `control_after_quarantined_primary`, primary valid, control fails. | Primary discarded, never persisted/rendered/audited raw. |
| AGI-005 | Existing exact qualified key. | Primary skips repeated interview and may invoke according template tool policy. |
| AGI-006 | Existing stale/revoked/failed key. | No primary release; only bounded qualification path is allowed. |
| AGI-007 | Provider/model browser hint differs from reviewed registry. | Typed denied/unavailable; never dynamically constructs endpoint. |
| AGI-008 | Template asks `AUTO`, provider lacks cited web-search capability. | Typed `tool_unavailable`; no silent context-only substitution. |
| AGI-009 | Template asks `NONE`. | Adapter request exposes no tool even when provider advertises search. |
| AGI-010 | Primary output has valid `context_only` result. | Accepted external result retains profile/source provenance, no Core status. |
| AGI-011 | Primary output has valid cited `context_and_web` result within budgets. | Accepted only with gateway-observed tool provenance. |
| AGI-012 | Any result claims proof/status promotion. | Typed invalid output; `RicisWasmBridge.evaluate()` spy is not changed/called as substitution. |
| AGI-013 | A fake agent “glitches” and returns wrong control JSON after previous pass. | New exact-key control failure denies/revokes future release; Core result remains unchanged. |
| AGI-014 | Provider is rate-limited or quota-exhausted after qualified status. | Typed provider availability; no model/provider fallback changes qualification silently. |
| AGI-015 | User changes locale or template schema revision. | Qualification/profile/schema key policy determines stale/requalification; no prior response is reused. |
| AGI-016 | Two concurrent requests race qualification writes. | Only atomic exact-key valid state is released; neither partial control result wins. |
| AGI-017 | Agent returns candidate provider card. | Card is `DISCOVERED_UNTRUSTED`; it creates no adapter, credential, default selection or scheduled job. |
| AGI-018 | Static browser attempts to use local storage model/key fallback. | Gateway returns typed static unavailable; test sees no browser-provider route. |
| AGI-019 | Existing `IAiModelOption` Gemini catalog projection. | Existing IDs/default/fast/category expectations survive migration. |
| AGI-020 | Current server fallback error with no key. | New gateway contract maps to unconfigured/typed unavailable; no secret is printed. |
| AGI-021 | Input includes OAuth/private key/host enrollment token marker. | Lean context assembler/application rejects before adapter/audit raw path. |

## 8.1. Migration and Core-authority regression scenarios

| ID | Action | Required assertion |
|---|---|---|
| AGM-001 | Load existing `AVAILABLE_GEMINI_MODELS`. | Legacy exported catalog remains present until a tested gateway DTO projection replaces every consumer. |
| AGM-002 | Project Gemini descriptor/models to `AgentModelOptionDto`. | Legacy `id`, `name`, `category`, `isDefault`, `isFast` values are preserved exactly. |
| AGM-003 | Select a provider/model unknown to server registry. | Browser hint is denied; endpoint is not constructed from user input. |
| AGM-004 | Run the existing no-key Gemini failure path under a fake environment. | Error maps to typed unavailable state and contains no variable value/secret. |
| AGM-005 | Feed agent result with `LEAN_VERIFIED`, `resolved`, proof or mathematical-computation field. | Structured validation rejects it. |
| AGM-006 | Spy on `RicisWasmBridge.evaluate()` during agent invocation. | Agent gateway does not call it as fallback/substitution and never mutates its output. |
| AGM-007 | Try to qualify an external engine as `authoritative_ricis_core`. | Result union/type guard makes this impossible. |
| AGM-008 | Resolve template/report wording. | Fixture catalog, not gateway implementation, owns localized prompt/report prose and schema resource. |
| AGM-009 | Run the complete QA suite with network interception. | Zero real provider HTTP/WebSocket/browser call and zero secret lookup occurs. |
| AGM-010 | Add/modify any public method in Step 4. | A static QA inventory test fails if its direct regression-test mapping is absent. |

## 9. Execution gates and measurable acceptance

| Gate | Entry condition | Exit condition |
|---|---|---|
| G3.1 — test skeleton | Step 3 approved and architecture public surface unchanged. | Every inventory family has a `describe` suite and deterministic fake; zero real provider dependencies. |
| G3.2 — red suite | Fixtures and test names implemented before application logic. | All listed negative scenarios initially fail for missing behaviour, not skip/pending. |
| G3.3 — implementation acceptance | Step 4 implementation proposed. | All direct unit tests pass; no `.skip`, `.only`, `todo`, mocked “pass”, real network or secret. |
| G3.4 — Core boundary | Gateway unit/integration suite green. | Source/contract tests prove no external engine can emit `authoritative_ricis_core`, `LEAN_VERIFIED` or substitute `RicisWasmBridge.evaluate()`. |
| G3.5 — release evidence | Full test run and review completed. | Test count/outcome, changed public methods, coverage mapping and redacted audit evidence recorded in sprint/release documentation. |

## 10. QA approval boundary

This document does not create a test project, source file, provider adapter, key, network request, graph manifest, template or UI. After explicit **«ОК»**, Step 4 may create implementation code together with the direct tests specified above. Every divergence from approved contracts requires return to the appropriate preceding gate rather than silent contract change.

## References

[1]: [Agent Gateway Step 1 business specification](../02-sprints/SPRINT_AGENT_GATEWAY_STEP1_BUSINESS_SPEC.md)
[2]: [Agent Gateway Step 2 architecture contracts](../01-architecture/SPRINT_AGENT_GATEWAY_STEP2_ARCHITECTURE.md)
[3]: [Strict Development Rules](../06-canonical-template/STRICT_DEVELOPMENT_RULES.md)
[4]: [Host Control Step 3 QA specification](./SPRINT_HOST_CONTROL_PLANE_STEP3_QA_SPEC.md)
