# Agent Gateway Runtime Activation — Step 1: Business Specification

**Status:** `DRAFT — bounded P1 increment for review before architecture and red QA.`

**Scope identifier:** `P1-AGENT-GATEWAY-RUNTIME-ACTIVATION-01`.

## 1. Purpose

The project already contains provider-neutral Agent Gateway contracts, disabled provider descriptors, qualification rules, deterministic response validation and a bounded reusable worker pool. This increment composes those contracts into a server-only runtime boundary so the application can request a typed agent capability result without importing a provider SDK, exposing credentials, or allowing the browser to call an external AI service.

The first runtime behavior is deliberately conservative: when no approved provider transport is configured, the gateway returns a typed unavailable result. The route and application composition must be useful for deployment validation while remaining safe on static GitHub Pages. This is an activation boundary, not live provider activation.

> **RICIS boundary:** An unavailable or external-agent response cannot alter a node, edge, type, state, formula, proof, Lean status or Core result. `X/X = 1` and all RICIS semantic rules remain outside this gateway increment; the gateway does not compute or reinterpret them.

## 2. User outcome

When a future UI or server client requests an explanation for a selected map node, the server exposes one provider-neutral endpoint contract. The client receives either a bounded typed result or an explicit `STATIC_HOST_UNAVAILABLE` / `UNCONFIGURED` state. It never receives a raw provider error, credential, arbitrary endpoint, proof claim or mutation command.

The current static site must continue to operate without a backend. A static-host request therefore fails closed with a typed availability response rather than attempting a browser-side fallback or direct provider call.

## 3. In scope

| Capability | Required behavior |
|---|---|
| Server composition | Construct the Agent Gateway application with an injected provider registry, qualification store, validator and bounded worker pool. |
| Common interface | Application code calls only the existing provider-neutral gateway contract; concrete provider classes are not exposed to the route or UI. |
| Typed endpoint boundary | Add a server-side request/response adapter for a bounded read-only explanation request, with explicit static-host and unconfigured outcomes. |
| Input limits | Validate node ID, template/schema identifiers, locale, correlation/request IDs and serialized request size before application execution. |
| Error normalization | Convert route parsing, unavailable provider, timeout, cancellation and validation failures to closed redacted response states. |
| Browser DTO | Expose only provider-neutral availability/result DTO fields; never expose raw JSON, credentials, prompt, Lean source, provider exception or transport detail. |
| Audit seam | Emit only a redacted in-memory audit event through an injected port; no persistence or external logging service is introduced. |
| Regression safety | Preserve the existing Gemini-specific server path and all current client behavior while adding the new isolated boundary. |

## 4. Explicitly out of scope

This increment does not add or enable Gemini, OpenRouter, Groq, Hugging Face or Cloudflare network calls. It does not add an API key, secret store, provider SDK, arbitrary `fetch`, web-search tool, OAuth, consent database, durable qualification store, browser storage, React controls, scheduled probing, background provider work, or deployment proxy.

It also does not select a default model, migrate `callAIWithFallback`, modify `RicisWasmBridge`, run Lean, create proof evidence, change node or edge state, persist explanations, discover providers, or promote any external answer to `LEAN_VERIFIED`, `RESOLVED`, `TRUSTED_AXIOM` or authoritative Core output.

## 5. Request contract

The endpoint accepts a bounded provider-neutral request containing a selected node identifier, approved question-template identifier, response-schema identifier, locale, correlation identifier and explicit user-triggered request marker. The server resolves the node and approved resources; client-supplied prompt prose, endpoint URLs, provider IDs, model IDs, credentials and trust statuses are rejected.

The application must enforce the existing qualification policy. An unconfigured, disabled, stale, revoked, static-host or otherwise unavailable provider produces a typed non-answer. A preliminary response is never released as an application finding unless the existing exact qualification gate permits it.

## 6. Response contract

| Result | Meaning | Permitted client behavior |
|---|---|---|
| `static_host_unavailable` | The request reached a static client without a server runtime. | Show a neutral unavailable message; perform no fallback call. |
| `unconfigured` | No approved server provider transport is configured. | Show configuration unavailable; do not retry indefinitely. |
| `provider_unavailable` | The injected provider path is unavailable or bounded execution failed. | Show redacted diagnostic state only. |
| `invalid_provider_output` | A provider response failed deterministic validation. | Do not render it as an answer or evidence. |
| `external_ai_suggestion` | A validated, qualified, provider-neutral suggestion. | Render as non-authoritative external suggestion only. |

No response branch contains a graph mutation command or final RICIS/Lean authority field.

## 7. Security and privacy requirements

The server route must be the only external-processing boundary. Credentials, endpoint configuration and transport implementations remain server-private. The browser bundle must contain no provider key, provider endpoint, raw prompt, raw Lean export or direct provider call.

Request data is minimized and bounded before entering the worker pool. The worker pool retains only scheduling state and does not retain prompts, node snapshots, raw provider output or credentials. Audit output uses identifiers, hashes, typed outcome and redacted availability only.

Untrusted node text, Lean fragments, template parameters and any future provider response are data. They cannot change the registry, policy, endpoint, schema, trust taxonomy, graph state or Core/Lean authority.

## 8. Acceptance criteria

The increment is accepted only when all of the following are true:

1. The server composition is injectable and uses the existing common gateway contract and bounded worker pool.
2. Static-host and unconfigured paths return typed closed outcomes without network access.
3. Malformed, oversized or unauthorized requests are rejected before provider execution.
4. No browser bundle contains provider credentials, direct provider transport or raw Lean export.
5. Existing Gemini server behavior and current client tests remain unchanged.
6. Every external-agent result is explicitly non-authoritative and cannot mutate the map or proof status.
7. Focused red-first tests cover the absent composition/route boundary before implementation.
8. Full lint, regression, build and diff checks pass.

## 9. Next pipeline gate

After approval of this specification, Step 2 must define the route/application composition, DTOs, injected ports, lifecycle and containment rules. Step 3 must create a failing baseline against the absent runtime composition and route. Only after those artifacts are complete may the minimal implementation be added.

## References

[1]: `docs/02-sprints/SPRINT_AGENT_GATEWAY_STEP1_BUSINESS_SPEC.md` — approved Agent Gateway business boundary.

[2]: `docs/01-architecture/SPRINT_AGENT_GATEWAY_STEP2_ARCHITECTURE.md` — approved provider-neutral architecture contracts.

[3]: `docs/03-quality/SPRINT_AGENT_GATEWAY_STEP4_RELEASE_EVIDENCE.md` — current deterministic/in-memory implementation and deferred activation work.
