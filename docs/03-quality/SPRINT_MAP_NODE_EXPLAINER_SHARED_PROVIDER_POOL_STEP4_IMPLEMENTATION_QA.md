# SPRINT P1 — Read-Only Map Node Explainer: Shared Providers and Bounded Worker Pool

## Step 4: Implementation and QA Evidence

**Status:** `IMPLEMENTED — pure provider-neutral contracts, shared base lifecycle and bounded in-memory worker pool only. No live provider is enabled.`

**Scope identifier:** `P1-MAP-NODE-EXPLAINER-SHARED-PROVIDER-POOL-01`.

**Branch:** `spec/map-node-explainer-shared-provider`, based on `origin/main` `9c57487b6947049c5861a5c258172968044fc812`.

**Release version:** `0.4.67`.

**Approved QA sequence:** Step 1 business specification → user `OK`; Step 2 architecture-only contracts → user `OK`; Step 3 red-first QA suite/baseline → user `OK`; Step 4 minimal implementation.

> **Release conclusion:** the map now has a pure, server-oriented common interface/base-class/pool foundation for a future read-only node explanation use case. It does not contain a Gemini/OpenRouter SDK, provider credential, provider request, Express endpoint, browser UI, storage write, deployment change, Core call, Lean action, proof/state/type promotion or map mutation capability.

## 1. Implemented artifacts

| Artifact | Implemented responsibility | Deliberate boundary |
|---|---|---|
| `src/mapNodeExplainer/mapNodeExplainerApplication.ts` | Provider-neutral branded IDs; closed availability/outcome unions; minimal selected-node snapshot; common registry; read-only application service; abstract provider base lifecycle; response validation/provenance. | No vendor SDK, `fetch`, endpoint, environment variable, provider key, browser storage, persistence, UI, legacy endpoint, RICIS calculation, Core/Lean import or provider activation. |
| `src/mapNodeExplainer/boundedProviderWorkerPool.ts` | Finite startup-validated policy; reusable active/queued capacity; per-provider capacity; fair eligible dispatch; cancellation/deadline processing; exactly-once terminal lease release; redacted capacity snapshot. | No timer/interval, `worker_threads`, network, prompt/snapshot/raw-reply retention, credential or map reference. |
| `src/mapNodeExplainer/mapNodeExplainerApplication.test.ts` | In-memory Gemini/OpenRouter fakes derived from the same base; common interface substitution; minimal snapshot; outcome/provenance; unavailable/static host/non-mutation paths; common bounded retry. | Fakes have no provider SDK or network path. Their distinct IDs prove substitutability, not real provider availability. |
| `src/mapNodeExplainer/boundedProviderWorkerPool.test.ts` | Deterministic pool policy, saturation, isolation/fairness, rejection, cancellation, deadline and snapshot cases using manual clock/cancellation/deferred promises. | No real time, background worker, HTTP or credential. |
| `src/mapNodeExplainer/mapNodeExplainer.topology.test.ts` | Static contract scan for the single application-facing provider interface, base-owned lifecycle and forbidden dependencies. | Scan is limited to the new module tree; it does not weaken unrelated containment. |

## 2. Single-interface and base-class guarantee

`MapNodeExplainerProvider` is the only application-facing programming interface. `MapNodeExplainerProviderRegistry`, `MapNodeExplainerApplicationService`, BFF-facing DTOs and a future UI operate only with its provider-neutral types and closed outcomes. The registry accepts/returns `MapNodeExplainerProvider`; it does not expose a concrete adapter, endpoint, SDK or credential.

`AbstractMapNodeExplainerProvider` owns the public `descriptor()` and `explain()` lifecycle: availability gate, minimum input validation, cancellation/deadline checks, bounded pool submission, finite retry for typed transient `provider_unavailable`, reply validation, typed error normalization, no-proof label and provenance. Concrete adapters are limited to protected `resolveConfiguredModelId()` and `executeProviderTransport()` hooks. A topology test enforces that no concrete provider class name exists in application code and that the base owns public explanation/transport boundaries.

| Application operation | Allowed implementation detail | Not representable in the common contract |
|---|---|---|
| Select provider | Server-owned configured provider/model through the common registry. | Browser override, implicit fallback or vendor-specific selection branch. |
| Run explanation | `MapNodeExplainerProvider.explain()` through base class and finite pool. | Direct adapter call, raw completion/fetch/tool use or provider exception exposure. |
| Render result | Transient `external_ai_suggestion`, fact labels, limitations, provider/model/version provenance. | Proof, Lean/Core execution, `resolved`, `LEAN_VERIFIED`, formula/state/type update, node/edge/zone command. |
| Handle unavailable | Closed typed availability state. | Silent retry loop, unbounded promise, automatic alternate provider or browser key. |

## 3. Bounded worker-pool implementation evidence

The implementation uses an asynchronous server-side scheduler with the operational semantics required for a C# `ThreadPool`: finite reusable capacity, finite queue, per-provider quota, fair eligible dispatch and explicit terminal cleanup. It does not create operating-system/browser threads because this initial pure server contract manages network-I/O-style jobs without a provider transport.

| Pool behavior | Evidence |
|---|---|
| Valid finite policy only | `createBoundedProviderWorkerPoolPolicy()` rejects zero, negative, fractional, non-finite and globally inconsistent values. |
| Global back-pressure | Queue returns typed `queue_saturated` before invoking the excess job transport. |
| Provider isolation | Per-provider active capacity prevents a provider from exceeding its quota while an eligible second provider can use remaining global capacity. |
| Fair dispatch | Queue scan starts the first eligible provider job rather than allowing a capacity-full provider queue to starve another provider. |
| Exactly-once release | `terminal` lifecycle guard, active set removal and provider counter decrement are centralized in one active completion method. Late completion after cancellation/deadline is ignored. |
| Cancellation/deadline | Queued cancellation/deadline removes work before transport. Active cancellation/deadline returns a single terminal result and releases capacity. |
| Data minimization | Pool snapshot exposes only counts and configured capacities; no raw selected-node content, explanation, key or provider payload is retained. |

## 4. Read-only and RICIS/authority boundary

The application request resolves one `ReadOnlyMapNodeSnapshot` and the common outcome contains only transient explanation content or typed unavailability. The implementation does not import map persistence/store/UI modules and exposes no mutation command. Tests preserve the selected snapshot byte-for-byte across the explanation path.

| Boundary | Enforced result |
|---|---|
| L0 continuity | No unavailable/failure/cancellation path deletes, replaces or modifies persisted map data. |
| L1 identity | Selected node ID is verified against the resolved snapshot; a mismatch produces typed unavailability rather than a substituted node. |
| L1C2 type identity | Declared type/state are input facts only. No output contains a type/state mutation. |
| SP1 locality | Outcome is request/correlation-bound and transient. No graph-wide state is emitted. |
| SP2, A1/A4/A6_GENERAL | Not invoked. No singularity, limit, `NaN`, numeric fallback, structural reduction, invariant or mathematical result type exists. |
| Lean/Core/proof | No Lean/Core dependency, proof field, verification label or status promotion is admitted. Output is explicitly `external_ai_suggestion` with `not_a_proof_or_state_change`. |

RICIS III remains the normative semantic rule for the project. In particular, `X/X = 1` for identical typed identity is unchanged but is not computed, confirmed or replaced by this reader-explainer infrastructure.

## 5. Red-to-green QA evidence

The first baseline was intentionally red: strict TypeScript reported only the two missing future module imports and focused Vitest reported only the same missing modules plus topology assertions that those source files were absent. No test-specific type defect remained in the final recorded red baseline.[1]

After the minimal pure implementation, focused tests are green:

```text
Test Files  3 passed (3)
Tests       20 passed (20)
```

The 20 cases cover the shared interface, base lifecycle, explicit provider/model provenance, read-only snapshot, malformed/empty output rejection, unavailable/static host paths, no mutation, finite retry, finite policy, queue saturation, provider isolation/fairness, rejection cleanup, cancellation, deadline and redacted pool state.

## 6. Full quality gates

| Command | Result |
|---|---|
| `npm run release:check` | PASS — release alignment test: **1 file / 12 tests**. |
| `npm run lint` | PASS — strict `tsc --noEmit`. |
| `npm test` | PASS — **133 test files / 1195 tests**. |
| `npm run build` | PASS — Vite client bundle and `dist/server.cjs` completed. |
| `git diff --check` | PASS. |

Vite emitted the pre-existing advisory that the `Map3D` chunk exceeds 500 kB after minification. It is a warning, not an error, and this scope did not alter the `Map3D` chunk or add a client-side provider integration.

The existing containment test initially rejected the new untracked scope. The allowlist was extended exactly with the approved Step 1–4 documents and the five new `src/mapNodeExplainer` source/test files, preserving fail-closed behavior for every other dirty path.

## 7. Version and changed-file scope

The functional Step 4 change increments version `0.4.66 → 0.4.67` through npm and the existing release synchronization script. No dependency changed.

| Category | Files |
|---|---|
| New P1 documents | Step 1 business spec; Step 2 architecture; Step 3 QA spec; Step 3 RED baseline; this Step 4 evidence record. |
| New pure source | `mapNodeExplainerApplication.ts`; `boundedProviderWorkerPool.ts`. |
| New tests | Application, worker-pool and topology tests. |
| Containment | `src/model/audit.proofSynthesisContainment.test.ts`, exact approved candidate allowlist only. |
| Required release alignment | `package.json`, `package-lock.json`, `src/version.ts`, `README.md`, `CITATION.cff`, `index.html`, and three existing release-evidence metadata files. |

## 8. Explicit non-implementation and next boundary

The following remain intentionally absent: Gemini/OpenRouter concrete production adapter; provider SDK; API key/credential/config port; provider network transport; Express BFF route; React panel/button; persisted history; user consent flow; server deployment; GitHub Pages proxy; legacy agent endpoint migration; automatic provider enablement; and real use of `openrouter/free`.

The new interface and pool are therefore **not a live external-agent feature**. They are a verified, provider-neutral, read-only-safe infrastructure foundation. A later activation scope must separately define credential handling, consent/privacy, fixed provider endpoint, model selection, rate/cost policy, BFF route, static-host UI behavior, provider adapter QA and deployment verification. It must not bypass the common interface/base/pool or silently convert a model explanation into a RICIS/Core/Lean/proof result.

No commit, push, PR, merge or deployment occurred in this Step 4 implementation work.

## References

[1]: [Step 3 RED baseline](SPRINT_MAP_NODE_EXPLAINER_SHARED_PROVIDER_POOL_STEP3_RED_BASELINE.md)

[2]: [Step 2 architecture](../01-architecture/SPRINT_MAP_NODE_EXPLAINER_SHARED_PROVIDER_POOL_STEP2_ARCHITECTURE.md)

[3]: [Step 1 business specification](../02-sprints/SPRINT_MAP_NODE_EXPLAINER_SHARED_PROVIDER_POOL_STEP1_BUSINESS_SPEC.md)
