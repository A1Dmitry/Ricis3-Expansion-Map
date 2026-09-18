# SPRINT P1 — Read-Only Map Node Explainer: Shared Providers and Bounded Worker Pool

## Step 3: Red-First QA Specification

**Status:** Proposed QA suite — must run RED before any production implementation exists.

**Scope identifier:** `P1-MAP-NODE-EXPLAINER-SHARED-PROVIDER-POOL-01`.

**Inputs:** approved [Step 1 Business Specification](../02-sprints/SPRINT_MAP_NODE_EXPLAINER_SHARED_PROVIDER_POOL_STEP1_BUSINESS_SPEC.md) and approved [Step 2 Architecture](../01-architecture/SPRINT_MAP_NODE_EXPLAINER_SHARED_PROVIDER_POOL_STEP2_ARCHITECTURE.md).

> **QA rule:** tests are written before production source. The expected first failure is a missing future `src/mapNodeExplainer/mapNodeExplainerApplication.ts` module. A missing module is the only acceptable initial RED reason. Test code itself must be strict-TypeScript clean and must not use `any`, provider SDKs, network calls, real credentials, timers that outlive a test, browser storage, map persistence, RICIS evaluator, Core or Lean sources.

---

## 1. Test seams and isolation

| Test file | Subject under test | Permitted dependencies | Explicitly forbidden |
|---|---|---|---|
| `src/mapNodeExplainer/mapNodeExplainerApplication.test.ts` | Common provider interface, abstract base lifecycle, application service and typed outcomes. | Vitest, future pure `mapNodeExplainerApplication` module, in-memory test fakes. | Provider SDKs, `fetch`, server globals, React, Zustand, IndexedDB/localStorage, map mutation, `server.ts`, legacy AI routes, Core/Lean. |
| `src/mapNodeExplainer/boundedProviderWorkerPool.test.ts` | Finite admission, queue, per-provider isolation, fair dispatch, cancellation, deadline and one-lease release. | Vitest, future pure `boundedProviderWorkerPool` module, deterministic deferred promises/clock/cancellation fakes. | Real timers, `worker_threads`, network, provider SDKs, application UI/store/persistence. |
| `src/mapNodeExplainer/mapNodeExplainer.topology.test.ts` | Static source-boundary assertions for one application-facing interface, base-owned lifecycle and no forbidden imports. | Vitest, Node text reads of future source tree. | Executing a provider call, inspecting secrets, mutating filesystem outside fixtures, app runtime. |

The QA suite tests the new isolated module only. It must not alter existing Agent Gateway tests, current Gemini model tests, Catalog Visibility tests, immutable Lean sources, or importer logic. The legacy mutating agent flows are expressly excluded.

---

## 2. Deterministic test fixtures

Step 3 test code defines only in-memory fakes. No test creates a network worker or runs a provider implementation.

| Fixture | Purpose | Required control |
|---|---|---|
| `Deferred<T>` | Deterministically pause/release a simulated provider transport. | Explicit resolve/reject; every test settles/awaits it. |
| `ManualClock` | Advance deadline timestamps without real sleep. | `nowEpochMilliseconds()` is fully test-owned. |
| `ManualCancellation` | Signal cancellation before admission, while queued or while active. | Registered callback count is observable; disposal is asserted. |
| `RecordingTransport` | Simulate a concrete provider protected transport hook. | Records only invocation metadata; returns a controlled `ProviderTransportReply`; never calls network. |
| `FakeGeminiAdapter` / `FakeOpenRouterAdapter` | Separate concrete adapters derived from the same abstract base. | Their public contract is only the common provider interface; each supplies a fixed descriptor/model/transport fake. |
| `InMemoryProviderRegistry` | Return a common interface from reviewed IDs. | Holds no credential; no implementation type crosses registry boundary. |
| `RecordingWorkerPool` or real pure pool SUT | Observe submissions and terminal outcomes. | Stores no raw snapshot body/secret; records correlation/provider lifecycle only. |
| `ReadOnlyNodeFixture` | Minimal existing selected-node snapshot. | Contains a stable `nodeId`, title/description, type/state and relationships; no proof/Lean/private data. |

The test model must use distinct provider IDs for Gemini and OpenRouter and distinct model IDs. This proves substitutability and provider isolation without asserting that either real provider is enabled or available.

---

## 3. Contract and application cases

| ID | Positive assertion | Required negative assertion |
|---|---|---|
| MNE-QA-01 | Registry returns `MapNodeExplainerProvider` for both fake Gemini and fake OpenRouter adapters; the same application service succeeds through either common contract. | Unknown provider returns `null`/typed unavailable and no transport is invoked. |
| MNE-QA-02 | `AbstractMapNodeExplainerProvider.explain()` validates, submits and normalizes a valid `ProviderTransportReply` as `explained`, external suggestion and no-proof disclaimer. | A malformed/oversize/unsupported provider response becomes `invalid_provider_output`, never raw provider text. |
| MNE-QA-03 | Result provenance reports configured provider/model, provider-returned resolved model, adapter version, request ID and correlation ID. | A concrete adapter cannot introduce arbitrary provider metadata into UI outcome. |
| MNE-QA-04 | Application creates the minimal `ReadOnlyMapNodeSnapshot` for the selected existing ID and uses configured server selection. | Browser request cannot override provider/model, include a free-form prompt, complete map, raw Lean, proof, key/token, queue policy or endpoint. |
| MNE-QA-05 | Valid explanation includes `classification: external_ai_suggestion`, `proofDisclaimer: not_a_proof_or_state_change`, nonempty limitations and an allowed `factsUsed` set. | Response construction rejects/does not represent `proof`, `resolved`, `LEAN_VERIFIED`, `QED_VERIFIED`, Core/Lean claim, state/type update, target-function update, node/edge/zone command or arbitrary URL. |
| MNE-QA-06 | No selected configuration produces typed `unconfigured`; disabled provider produces typed `disabled`. | Neither result invokes a provider, queue or implicit Gemini/OpenRouter fallback. |
| MNE-QA-07 | `serverRuntimeAvailable() === false` yields `static_host_unavailable`. | Static-host denial happens before provider lookup, worker-pool admission, credential access and transport. |
| MNE-QA-08 | A valid request leaves node, edge, zone, proof, selection, filter, URL and persistence-recording fake byte-for-byte unchanged. | Any attempt by a test adapter or result mapper to emit a mutation command is unavailable/unrepresentable. |

---

## 4. Bounded worker-pool cases

| ID | Positive assertion | Required negative assertion |
|---|---|---|
| MNE-QA-09 | A valid finite policy admits up to global active capacity and reports exact active/queued snapshot counts. | Zero, fractional, negative, `NaN`, infinite or inconsistent capacity/deadline/retry values are rejected deterministically at policy construction. |
| MNE-QA-10 | When global capacity is active but queue has space, next job is queued and starts only after a released lease. | When finite queue is full, submission returns `queue_saturated` immediately and its transport is never invoked. |
| MNE-QA-11 | Per-provider capacity prevents more than the configured active jobs for the same provider. | A full provider must not consume another provider's per-provider lease. |
| MNE-QA-12 | With global capacity remaining, an eligible job for provider B starts when provider A is capacity-full. | Provider A queued jobs do not starve provider B or violate fair eligible dispatch. |
| MNE-QA-13 | Completion, normalized provider failure and invalid output each release exactly one global/provider worker lease and dispatch the next eligible queued job once. | No terminal path double-releases, leaks capacity, runs the same job twice or reports negative counters. |
| MNE-QA-14 | Cancellation before dispatch removes a queued job; its transport is not invoked and a typed cancellation result is returned. | A cancelled job is not later started when another lease is released. |
| MNE-QA-15 | Cancellation while active and deadline expiry both settle to their distinct typed outcome and release leases exactly once. | Late transport success after cancellation/deadline cannot change the terminal outcome or re-render result. |
| MNE-QA-16 | Retry-classified transient failure consumes the same finite job deadline/retry policy and finally normalizes to a shared typed outcome. | An adapter cannot create an unbounded retry loop or a separate retry policy that bypasses the common base. |
| MNE-QA-17 | Worker-pool snapshot contains only active/queued counts and provider counts. | Snapshot/log fixtures cannot retain raw node snapshot body, prompt, provider output, browser data or credential marker. |

The implementation must be deterministic under these tests. Where a clock is required, it must be injected; a test must not use `setTimeout`, real elapsed time, HTTP, asynchronous global state or an unbounded promise.

---

## 5. Static topology/security cases

| ID | Required assertion |
|---|---|
| MNE-TOPO-01 | `MapNodeExplainerApplicationService`, `MapNodeExplainerProviderRegistry` and the BFF-facing code import only the common `MapNodeExplainerProvider` type/interface, never Gemini/OpenRouter concrete adapter classes. |
| MNE-TOPO-02 | The abstract base class owns public `explain`; every concrete adapter uses only protected transport/model hooks and does not declare/override `explain`. |
| MNE-TOPO-03 | Concrete adapters do not import the bounded pool/scheduler, map store, persistence, React, Zustand, IndexedDB/localStorage, legacy AI endpoint client, proof generator, RICIS evaluator or Lean artifacts. |
| MNE-TOPO-04 | The common/application/pool modules contain no vendor SDK import, `fetch`, endpoint URL, `process.env`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, raw credential field, browser storage or direct server route. Provider SDK/transport imports are confined to a future designated provider-infrastructure directory. |
| MNE-TOPO-05 | The new module has no import path to `/api/aiAssistantNode`, `/api/discoverTasks`, `/api/fillNodeParams`, `/api/generateProof`, `RicisWasmBridge`, proof synthesis or `Ricis3.lean`. |
| MNE-TOPO-06 | The contracts include no RICIS numerical/reduction result, `NaN`, classical limit, proof/state upgrade or Core/Lean authority field. |

Source scans must use specific allowlists and inspect the newly introduced module tree only. They must not match ordinary prose in documentation or unrelated historic code. A source scan failure must identify the forbidden token and exact source file.

---

## 6. Red baseline procedure

1. Create the three test files and this QA specification before any file exists under `src/mapNodeExplainer/` other than the tests themselves.
2. Run strict TypeScript using `npm run lint`. Any compile error must originate only from unresolved imports of the future production modules; test syntax/types themselves must be internally valid under the selected expected public contracts.
3. Run the focused Vitest command:

   ```bash
   npx vitest run \
     src/mapNodeExplainer/mapNodeExplainerApplication.test.ts \
     src/mapNodeExplainer/boundedProviderWorkerPool.test.ts \
     src/mapNodeExplainer/mapNodeExplainer.topology.test.ts
   ```

4. Record the exact command, exit status and missing-module error in `SPRINT_MAP_NODE_EXPLAINER_SHARED_PROVIDER_POOL_STEP3_RED_BASELINE.md`.
5. Stop. Do not create the missing production module, provider adapter, server route, UI, configuration or deployment until the user explicitly approves the complete Step 3 tests and red baseline.

The expected red reason is exclusively the unresolved production module(s), such as `mapNodeExplainerApplication` and `boundedProviderWorkerPool`. It is not acceptable to replace missing imports with local test doubles that make the suite green, to skip the tests, to mark failures as optional, or to import a legacy Gemini/Agent Gateway module instead.

---

## 7. Scope and authority assertions

No test evaluates a singularity, applies a classical operation, performs a RICIS reduction, checks a Lean theorem or claims a mathematical result. These cases test only infrastructure safety and read-only identity preservation.

| RICIS requirement | QA assertion |
|---|---|
| L0 continuity | Every error/cancellation/unavailability result leaves map state unchanged. |
| L1 identity | The response DTO keeps the requested selected `nodeId`; it cannot substitute or redirect it. |
| L1C2 type identity | The read-only declared state/type may be described only as input facts; response types cannot represent a mutation. |
| SP1 locality | One request affects only its transient correlation-bound outcome; no graph-wide side effect occurs. |
| SP2 and A1/A4/A6_GENERAL | Not invoked. Tests reject mathematical/reduction fields rather than calculate them. |
| Core/Lean boundary | No test accepts a provider statement as `LEAN_VERIFIED`, resolved proof, Core execution or authority. |

---

## 8. Step 3 approval boundary

The approved Step 3 output will consist only of this specification, the three isolated test files and a factual RED baseline record. It will add no production source, adapter, provider SDK, network activity, credential, configuration, browser/UI control, server route, persistence action, version increment, publish, merge or deployment.

After an explicit **`OK`** for the completed red test suite, Step 4 may implement the smallest pure provider-neutral contracts, common base lifecycle, bounded worker pool and in-memory test adapters required to turn only these tests green. It may not enable Gemini/OpenRouter, add a credential, call a provider or expose the UI/BFF route without a further approved activation scope.
