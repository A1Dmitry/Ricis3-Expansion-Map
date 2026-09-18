# AI Agent Gateway — Шаг 4: implementation release evidence

**Статус:** `IMPLEMENTED — deterministic/in-memory contract implementation only. Live provider credentials, network adapters, provider SDK calls, browser execution, UI activation and Ricis.Core changes are intentionally not included.`

**Предыдущие gates:** [Step 1 business specification](../02-sprints/SPRINT_AGENT_GATEWAY_STEP1_BUSINESS_SPEC.md) — `APPROVED`; [Step 2 architecture contracts](../01-architecture/SPRINT_AGENT_GATEWAY_STEP2_ARCHITECTURE.md) — `APPROVED`; [Step 3 QA specification](./SPRINT_AGENT_GATEWAY_STEP3_QA_SPEC.md) — `APPROVED`.

> **Release conclusion:** the project now has a server-safe, DI-only Agent Gateway contract implementation with deterministic test doubles and typed unavailable states. It does not call any AI provider. A qualified alternative engine remains an alternative provenance classification; final mathematical and proof authority remains in Ricis.Core/Lean.

## 1. Implemented scope

| Area | Implemented artifact | Deliberate boundary |
|---|---|---|
| Domain/application | `src/agentGateway/agentGatewayApplication.ts` | DI-only contracts, deterministic validation, orchestration and in-memory policy stores. No Express route, SDK or `fetch`. |
| Provider registry | `StaticAgentProviderRegistry` | Reviewed in-memory descriptors only; duplicate provider IDs are rejected. |
| Candidate catalog | `disabledProviderCatalog.ts` | Gemini, Groq, OpenRouter, Hugging Face and Cloudflare Workers AI are registered as `unconfigured`, `defaultEnabled: false` candidates. No credential/value exists in code. |
| Structured output | `DeterministicAgentResponseValidator` | Strict JSON only: duplicate keys, oversize/deep payloads, unknown Lean fragments, forged tool provenance, non-HTTPS citations and proof-promotion fields are denied. No regex/prose repair. |
| Qualification | `InMemoryProviderQualificationStore`, compact control orchestration | Exact key binding, profile-based interview and quarantine. Main answer may be released only after the applicable control result passes. |
| RICIS control | `createRicisTypedZeroSameGeneratorProfile` | SP3/A4 same-generator typed-zero control requires JSON semantic value `1`, zero tool calls and retained `TRUSTED_AXIOM` status. |
| Alternative engines | `StaticEngineCompatibilityRegistry` | Exact approved graph + explicitly qualified key can become `ricis_compatible_engine`; no branch emits `authoritative_ricis_core`. |
| Gemini DRY seam | `geminiCatalogProjection.ts` and `server.ts` import | Existing public model IDs/catalog are projected to the server `MODELS_POOL`; no existing model member was removed. |

## 2. Test-first evidence

Each implementation addition began with an observable red test state and then received the smallest implementation needed to turn it green.

| Increment | Initial red condition | Green evidence |
|---|---|---|
| Gateway application | Missing `agentGatewayApplication` module. | Deterministic public-contract suite passes. |
| Gemini projection | Missing `geminiCatalogProjection` module. | Projection equals existing `AVAILABLE_GEMINI_MODELS` and is frozen. |
| Provider registry | Missing `StaticAgentProviderRegistry` export. | Reviewed lookup, unknown denial, immutable descriptor list and duplicate rejection pass. |
| Disabled provider catalog | Missing `disabledProviderCatalog` module. | All five candidate adapters are server-only, disabled and typed `unconfigured`. |
| Compatible engine | No compatible classification for a qualified exact manifest. | Only explicit qualified graph key reaches `ricis_compatible_engine`; Core authority remains unreachable. |
| Control template isolation | Primary instruction was reused by qualification. | Compact control template is resolved separately and substitution is denied. |

## 3. Security and trust assertions enforced

| Invariant | Regression coverage |
|---|---|
| No live provider/network/browser execution | Production `src/agentGateway` scan contains no `fetch`, `WebSocket`, `GoogleGenAI`, `process.env` or `localStorage`; unit fixtures are in-memory. |
| No secret/token/private-key flow | Candidate descriptors exclude credential values; sensitive Lean-context markers are denied before adapter use/audit output. |
| Structured-only output | Non-JSON prose, duplicate keys, invalid enum/value, unknown fragment, invalid citation and forged observed tool usage yield `invalid_provider_output`. |
| Control interview is not retraining | Compact template is separate, `toolPolicy.none`, and validates fixed RICIS Knowledge Profile outcomes only. |
| Qualified engine is not Core | `ricis_compatible_engine` is provenance only; external output cannot claim `LEAN_VERIFIED`, proof resolution or `authoritative_ricis_core`. |
| Existing Gemini path preserved | Server fallback still has the current ordering, now sourced from the tested public model catalog projection. |

## 4. Quality-gate record

The following commands ran successfully during this release gate:

| Command | Recorded result |
|---|---|
| `npm run lint` | Strict TypeScript (`tsc --noEmit`) passed. |
| Focused Agent Gateway regression | Agent contracts, disabled candidate catalog and Gemini projection suites passed. |
| `npm test` | **37 test files / 245 tests passed**. |
| `npm run build` | Release consistency test passed; Vite bundle and `dist/server.cjs` were created successfully. |
| `git diff --check` | Passed. |
| Production source scan | No prohibited live-network, browser-storage, environment-secret or Google SDK access under `src/agentGateway`. |

## 5. Deferred activation work

The following items remain intentionally out of scope. They need their own security/policy review before being enabled: real provider SDK/API adapters and credentials; secret-vault/configuration adapters; server-side consent/entitlement persistence; versioned external template, response-schema, Knowledge Profile and Graph Manifest stores; Express BFF route; React UI; durable qualification store with atomic compare-and-set; observed provider tool-event integration; Core-backed review of every production profile; and production engine compatibility-suite evidence.

No deferred item may introduce a browser key, direct client-to-provider path, implicit provider activation, trust-status promotion or a TypeScript replacement for `RicisWasmBridge.evaluate()`.

## References

[1]: [Agent Gateway Step 1 business specification](../02-sprints/SPRINT_AGENT_GATEWAY_STEP1_BUSINESS_SPEC.md)
[2]: [Agent Gateway Step 2 architecture contracts](../01-architecture/SPRINT_AGENT_GATEWAY_STEP2_ARCHITECTURE.md)
[3]: [Agent Gateway Step 3 QA specification](./SPRINT_AGENT_GATEWAY_STEP3_QA_SPEC.md)
[4]: [Strict Development Rules](../06-canonical-template/STRICT_DEVELOPMENT_RULES.md)
