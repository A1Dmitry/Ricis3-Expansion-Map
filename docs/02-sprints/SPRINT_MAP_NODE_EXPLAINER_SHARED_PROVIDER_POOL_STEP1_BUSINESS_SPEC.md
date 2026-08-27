# SPRINT P1 — Read-Only Map Node Explainer: Shared Providers and Bounded Worker Pool

## Step 1: Business Specification

**Status:** `APPROVED` — user approval received before Step 2. This file was reconstructed on `spec/map-node-explainer-shared-provider` after the working directory was recovered from the separate importer branch. It records the already approved scope and creates no runtime capability.

**Scope identifier:** `P1-MAP-NODE-EXPLAINER-SHARED-PROVIDER-POOL-01`.

**Normative basis:** RICIS-III. The capability is reader-facing infrastructure only. It is not a RICIS evaluator, singularity calculator, proof generator, Ricis.Core substitute, Lean verifier, or authority.

> **The only first-scope action is a bounded, read-only explanation of one currently selected map node. Every error, cancellation and unavailable state leaves the persisted map unchanged.**

## 1. Problem and requested architecture

Existing model-related functionality is server-backed and Gemini-specific in places, while GitHub Pages deploys only a static Vite bundle. The new capability must be usable only where a protected Node server is available, including a non-Google host with an explicit OpenRouter adapter. It must never expose provider keys or direct provider calls in the browser.

The user requires that **every adapter interact with the application through one common programming interface**. Gemini, OpenRouter, and later providers must be separate concrete implementations behind that interface and a common abstract base class. Application service, UI, registry and worker-pool scheduler must never import a provider SDK, endpoint, credential name/value, provider-native request/response type or exception; they may not down-cast, use `instanceof`, call a concrete adapter or branch on vendor implementation detail.

The user also requires Agent Gateway to follow the operational principle of the C# `ThreadPool`. In Node/TypeScript this means a bounded asynchronous server scheduler: finite reusable in-flight worker capacity, finite queue, explicit back-pressure, per-provider isolation, cancellation, deadline and exactly-once lease release. It does not mean browser workers, unbounded `Promise.all`, one new OS thread per click or background work.

## 2. First permitted user story

> **US-01 — Explain selected node.** As a reader, after selecting an existing map node, I can request a concise localized explanation. I receive either a transient `EXTERNAL_AI_SUGGESTION` with an explicit no-proof disclaimer or a typed unavailable/rejected result. No node, edge, formula, proof, type, state, zone, URL, filter, selection or storage value changes.

Input is minimized to a read-only public selected-node snapshot: stable node ID, visible title/description, displayed target function when present, declared state/type, zone labels and existing dependency identifiers. It excludes the complete map, browser storage, user secrets, OAuth/session tokens, credentials, raw Lean files, unpublished material, arbitrary URLs and arbitrary prompts.

| Permitted | Prohibited |
|---|---|
| Explain supplied reader-visible node facts with bounded text/structured output. | Create/change/reverse graph links; create nodes/zones; write formula, state, type, proof or evidence. |
| Return typed outcomes such as `unconfigured`, `disabled`, `static_host_unavailable`, `queue_saturated`, rate limit, timeout or cancellation. | Evaluate `0/0`, `∞/∞`, `∞−∞`, `0_F × ∞_G`, numerical limits, classical fallbacks, `NaN`, RICIS reduction, Core evaluation or Lean compilation. |
| Execute one explicitly enabled server-side provider through the common interface. | Browser provider calls, browser-held key, silent Gemini/OpenRouter fallback, web search, tool usage, arbitrary fetch, file upload or autonomous background work. |

## 3. Common interface and base-class requirement

A single provider-neutral interface is the **sole permitted application-facing channel** for every adapter. The common abstract base class owns shared request/response validation, request-size/response-size limits, cancellation/deadline linkage, bounded-pool submission, finite retry/error classification, redacted diagnostics and provenance packaging.

Each concrete adapter owns only reviewed provider-specific transport mapping: fixed endpoint configuration, private credential-port use, serialization, provider-native result parsing and resolved model identity. It may not bypass the base class, schedule directly, choose another provider, modify the map or construct a UI response.

| Layer | Owner and boundary |
|---|---|
| UI/BFF | Requests one explanation and renders typed DTO only; no provider access or map mutation. |
| Application service | Resolves public snapshot and server-owned configured provider selection through common interface only. |
| Registry | Returns the common interface and immutable descriptors; no credentials and no auto-activation. |
| Common base class | Owns lifecycle policy, pool, cancellation/deadline, retry normalization and redaction. |
| Concrete Gemini/OpenRouter adapters | Protected transport hooks only; no public alternate application path. |

## 4. Bounded worker-pool requirements

| Property | Required behaviour |
|---|---|
| Finite global capacity | An immutable server configuration limits simultaneously active provider jobs. Capacity never scales with click volume. |
| Finite queue | An immutable waiting limit applies. Saturation returns typed `queue_saturated` immediately, without unbounded promises or silent drops. |
| Reusable lease | Active worker capacity is acquired once per job and released exactly once after success, typed provider failure, validation rejection, timeout or cancellation. |
| Provider isolation | A finite per-provider active quota applies in addition to global capacity. One slow/free provider cannot consume all other provider capacity. |
| Fairness | A capacity-full provider cannot starve an eligible job for another provider while global capacity remains. |
| Cancellation/deadline | Queued work is removed before dispatch; active work settles once as cancelled/timed out; a late success cannot replace that terminal result. |
| Bounded retry | Shared base policy owns finite retry/backoff inside the same deadline and budget. No adapter may create unbounded retry. |
| Observability | Only redacted lifecycle counts/correlation IDs are observable; pool state retains no prompt, snapshot, raw reply or credential. |

Pool sizes, byte limits, deadline and retry budget must be finite server configuration values proposed and tested in later steps. Browser input and provider output cannot alter them.

## 5. Hosting and provider policy

GitHub Pages remains static: the result is `static_host_unavailable` before provider lookup, credential access, queue admission or transport. A current or future Node/Express server may run on any approved hosting environment. Existing server use of Gemini Developer API does not make Google Cloud hosting a requirement.

Gemini and OpenRouter are explicit selections, never silent fallbacks. `openrouter/free` may be selected only by a future enabled server-side OpenRouter adapter. Because free routing may resolve to a variable model, an explanation must carry the provider-reported resolved model ID as transient provenance and remains non-authoritative.[1]

## 6. RICIS, proof and identity boundary

No singularity operation occurs in this scope. The request is transient and local to one correlation ID.

| Normative boundary | Requirement |
|---|---|
| L0 continuity | Failure/cancellation does not delete, replace or hide persisted map objects. |
| L1 identity | The selected node ID is a read-only identity reference and cannot be substituted/redirected. |
| L1C2 type identity | Existing state/type/proof/evidence remain application facts and cannot be changed or promoted by provider text. |
| SP1 locality | One transient explanation has no graph-wide side effect. |
| SP2, A1/A4/A6_GENERAL | Not invoked; no calculation/result field is allowed. |
| Core/Lean/proof boundary | Response is `EXTERNAL_AI_SUGGESTION`, never `LEAN_VERIFIED`, proof result, Core result, `resolved` state or mathematical authority. |

`X/X = 1` under RICIS typed identity remains normative project semantics but is neither evaluated nor validated by this scope.

## 7. Acceptance criteria

| ID | Acceptance criterion |
|---|---|
| MNE-AC-01 | The single provider-neutral interface is the sole application-facing route to every adapter. No UI/application/registry/scheduler down-cast, provider branch or direct transport call exists. |
| MNE-AC-02 | A common abstract server-only base class owns lifecycle/validation/pool/retry/redaction; each provider has only protected transport hooks. |
| MNE-AC-03 | Static hosting reaches typed denial without provider, queue, credential or transport contact. No browser bundle contains provider key/SDK/direct endpoint. |
| MNE-AC-04 | Global active capacity, queue capacity and per-provider capacity are finite and enforced with typed saturation. |
| MNE-AC-05 | Success, failure, invalid output, timeout, cancellation and admission rejection have one terminal outcome and no worker-lease leak/double release. |
| MNE-AC-06 | A saturated provider cannot prevent an eligible other-provider request when global capacity remains. |
| MNE-AC-07 | Explanation input/output is minimal and read-only; no graph/persistence/URL/filter/selection/proof/state/type change is representable. |
| MNE-AC-08 | Successful output is bounded, labelled external suggestion and contains no proof/Core/Lean/status-authority claim. |
| MNE-AC-09 | Missing/disabled/limited provider returns exact typed outcome; no automatic provider activation or fallback occurs. |
| MNE-AC-10 | No code in this scope evaluates a singularity, emits `NaN`, uses a numerical/classical fallback, calls Core/Lean or changes an immutable author artifact/DOI. |

## 8. Exclusions, migration and approval boundary

This scope does not alter existing legacy `/api/aiAssistantNode`, `/api/discoverTasks`, `/api/fillNodeParams`, `/api/generateProof` or derivative-search paths because they can mutate map/proof-adjacent data and need their own approved scope. It introduces no migration, version increment, provider activation, secret, SDK, network call, BFF route, UI, deployment, Core change or Lean change.

**Step 1 is approved.** Step 2 may provide only contracts/DTOs/types and abstract-base/pool architecture. It may not implement source runtime behaviour or activate a provider.

## References

[1]: https://openrouter.ai/docs/guides/routing/routers/free-router "OpenRouter — Free Models Router"

[2]: [Existing Agent Gateway Step 1](SPRINT_AGENT_GATEWAY_STEP1_BUSINESS_SPEC.md)
