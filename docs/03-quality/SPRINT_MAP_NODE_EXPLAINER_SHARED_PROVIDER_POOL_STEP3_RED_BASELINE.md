# SPRINT P1 — Read-Only Map Node Explainer: Shared Providers and Bounded Worker Pool

## Step 3: Red Baseline Record

**Status:** `RED — expected and accepted only as pre-implementation baseline; awaiting user approval before Step 4.`

**Scope identifier:** `P1-MAP-NODE-EXPLAINER-SHARED-PROVIDER-POOL-01`.

**Branch:** `spec/map-node-explainer-shared-provider`, based on `origin/main` `9c57487b6947049c5861a5c258172968044fc812`.

**Date:** 2026-08-27.

**Source QA inputs:** [Step 3 QA Specification](SPRINT_MAP_NODE_EXPLAINER_SHARED_PROVIDER_POOL_STEP3_QA_SPEC.md), [approved Step 2 Architecture](../01-architecture/SPRINT_MAP_NODE_EXPLAINER_SHARED_PROVIDER_POOL_STEP2_ARCHITECTURE.md), and [approved Step 1 Business Specification](../02-sprints/SPRINT_MAP_NODE_EXPLAINER_SHARED_PROVIDER_POOL_STEP1_BUSINESS_SPEC.md).

> **The RED condition is deliberate. Production modules `src/mapNodeExplainer/mapNodeExplainerApplication.ts` and `src/mapNodeExplainer/boundedProviderWorkerPool.ts` do not exist yet. No adapter, provider SDK, provider request, credential, server route, UI, storage action, deployment action, RICIS calculation, Core action or Lean action has been added.**

## 1. Commands and exact result

```bash
npm run lint
```

**Exit status:** `2`.

The strict TypeScript compiler reported exactly two diagnostics, both `TS2307` unresolved imports of the intended future production modules:

```text
src/mapNodeExplainer/boundedProviderWorkerPool.test.ts(11,8): error TS2307:
Cannot find module './boundedProviderWorkerPool' or its corresponding type declarations.

src/mapNodeExplainer/mapNodeExplainerApplication.test.ts(24,8): error TS2307:
Cannot find module './mapNodeExplainerApplication' or its corresponding type declarations.
```

There were no further test-code type diagnostics. In particular, no implicit-`any`, source-test syntax, provider SDK, network, credential, browser-storage, RICIS, Core or Lean diagnostic appeared.

```bash
npx vitest run \
  src/mapNodeExplainer/mapNodeExplainerApplication.test.ts \
  src/mapNodeExplainer/boundedProviderWorkerPool.test.ts \
  src/mapNodeExplainer/mapNodeExplainer.topology.test.ts
```

**Exit status:** `1`.

| Suite | Observed RED result | Classification |
|---|---|---|
| `mapNodeExplainerApplication.test.ts` | `Failed to resolve import "./mapNodeExplainerApplication"` | Expected missing future production module. |
| `boundedProviderWorkerPool.test.ts` | `Failed to resolve import "./boundedProviderWorkerPool"` | Expected missing future production module. |
| `mapNodeExplainer.topology.test.ts` | Five assertions fail because the required future production source files do not exist. | Expected source-absence topology state; tests do not invoke a provider. |

No test ran a provider transport. No browser, network, provider credential, external API, worker thread, timer-based background job, persistence call or map mutation occurred.

## 2. QA suite created before implementation

| File | Cases | Purpose |
|---|---:|---|
| `src/mapNodeExplainer/mapNodeExplainerApplication.test.ts` | MNE-QA-01..08 | Substitutability through one common interface, common base outcome/provenance, minimum snapshot, typed unavailable/static-host response and no map mutation. |
| `src/mapNodeExplainer/boundedProviderWorkerPool.test.ts` | MNE-QA-09..17 | Finite policy validation, finite queue, provider isolation/fairness, exactly-once release, cancellation, deadline and redacted snapshot. |
| `src/mapNodeExplainer/mapNodeExplainer.topology.test.ts` | MNE-TOPO-01..06 | One interface, base-owned lifecycle and absence of SDK/network/secret/browser/mutation/legacy endpoint/RICIS/Core/Lean/unbounded-fan-out dependencies. |

The suites use only deterministic in-memory fakes: manual cancellation, manual clock and deferred promises. They contain no real timers, external transport, `worker_threads`, provider SDK, API key or direct mutation helper.

## 3. Trust and semantic boundary

This QA step tests infrastructure safety only. It evaluates no singular expression and asserts no mathematical result. The RICIS status is therefore **not applicable to calculation**; the relevant controls are identity/persistence non-mutation boundaries.

| Requirement | RED-suite assertion |
|---|---|
| L0 continuity | Unavailability/cancellation/timeout must preserve map state; no deletion/replacement path exists in request/outcome contracts. |
| L1 identity | A request is bound to one selected `nodeId`; no response field can redirect or replace it. |
| L1C2 type identity | Declared state/type are read-only snapshot facts; output has no mutation field. |
| SP1 locality | The only anticipated effect is a correlation-bound transient explanation. |
| SP2, A1/A4/A6_GENERAL | Not invoked; QA rejects/omits reduction and numeric result fields. |
| Core/Lean/proof boundary | QA requires `external_ai_suggestion` and no-proof disclaimer; it rejects proof/status-authority fields. |

## 4. Next authorized boundary

The test code and red baseline are complete. Per the mandatory QA-first pipeline, work is stopped before production implementation.

After explicit user approval of this Step 3 result, Step 4 may create the smallest pure `mapNodeExplainerApplication` and `boundedProviderWorkerPool` modules needed to turn these tests green. It remains prohibited to add a real Gemini/OpenRouter adapter, provider SDK, credential, external API call, server route, UI, persistence/migration, deployment, Core modification, Lean modification or automatic provider activation in that implementation increment.
