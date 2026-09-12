# EXP-MAP-AGENT-GATEWAY-RUNTIME-RECONCILIATION-01 — G2-A Architecture

**Статус:** `G2-A_APPROVED_ARCHITECTURE_ONLY`
**Дата:** 2026-08-27 (GMT+3)
**Одобрение владельца:** `OK EXP-MAP-AGENT-GATEWAY-RUNTIME-RECONCILIATION-01 G2-A`
**Baseline:** `main` `1c2974f61451c8ed9636c2ca3063d4e6426d62e3`
**G1 input:** `EXP-MAP-AGENT-GATEWAY-RUNTIME-RECONCILIATION-01_G1_DECISION_2026-08-27.md` (external continuity record).

## 1. Решение G2-A

G2-A **не активирует runtime, server route или provider**. Он определяет только будущий узкий local wrapper над уже опубликованным `src/agentGateway/agentGatewayApplication.ts`. Цель — устранить mismatch historical branch `p1/agent-gateway-runtime`, где standalone runtime type taxonomy был добавлен до fresh current-main reconciliation, хотя документы одновременно объявляли implementation отсутствующей и обещали более широкий BFF/server composition.

> **G2-A invariant:** один будущий wrapper только валидирует closed request, выбирает typed static/unavailable short-circuit, делегирует существующему published application contract и создаёт redacted in-memory audit observation. Он не создаёт второй Agent Gateway application, provider registry, qualification store, response validator, authority taxonomy либо network transport.

| Аспект | G2-A решение | Явно не входит в G2-A |
|---|---|---|
| Future source surface | Один будущий pure module `src/agentGateway/agentGatewayRuntimeBoundary.ts`. | Новая application service, provider registry, vendor adapter или duplicate response validator. |
| Canonical DTO direction | Future module адаптирует only the existing published application request/result contract; не вводит новый parallel `external_ai_suggestion` union или raw provider DTO. | `canonicalAnswerJson`, raw provider response, prompt, transport exception, tool transcript или runtime-specific proof/trust result. |
| Invocation | Только явный typed caller с validated selected-node/resource identifiers; no raw HTTP parsing. | Express/BFF route, `server.ts` integration, browser client invocation, endpoint or HTTP status mapping. |
| Host behavior | Static context получает closed `static_host_unavailable` before application delegation. Server context только делегирует to injected published application contract. | Static-host fallback call, browser key, browser-side emulation, auto-retry or provider discovery. |
| Audit | One injected synchronous in-memory redacted observation per terminal path; no prompt/node content/raw result/credential retention. | Durable log, analytics, telemetry, external sink, database, queue or scheduler. |
| Authority | Outputs remain `external_ai_suggestion` or typed availability/error; they cannot mutate source, map, proof, trust, state, type, formula, Lean or Core result. | `LEAN_VERIFIED`, `TRUSTED_AXIOM`, `resolved`, `acceptVerifiedExternalLeanProof`, `updateProof`, `updateNode` or any authority writer. |

## 2. Dependency topology

The future module has one production import direction: it may import published types/functions only from the sibling `./agentGatewayApplication` module. Its factory receives application and audit dependencies explicitly. No production import is permitted from `server.ts`, UI, map store, persistence, proof/source/trust/state/axiom modules, `RicisWasmBridge`, Lean adapters, Core bridge, provider SDK, browser APIs or environment configuration.

```text
future explicit typed caller
            │
            ▼
AgentGatewayRuntimeBoundary (future one local wrapper)
            │                     │
            ▼                     ▼
published Agent Gateway app   injected redacted in-memory audit port
            │
            ▼
published disabled/qualified provider-neutral contracts
```

No arrow reaches `server.ts`, a network transport, a browser artifact, map mutation, proof authority, Lean or Ricis.Core. The published legacy Gemini routes remain unmodified legacy code; G2-A does not normalize, migrate, invoke or reclassify them.

## 3. Closed future boundary contract

The future wrapper receives a **closed object only**. It contains an exact selected node/resource identity, approved template/schema identifiers, locale, correlation identifier and literal explicit user request marker. Client-supplied prompt prose, provider ID, model ID, endpoint, credential, arbitrary tool declaration, proof, state, type, formula, source/Lean payload or unknown key is invalid before application delegation.

The wrapper must preserve the published application-layer type taxonomy rather than duplicate it. Its only additional wrapper-level states are the following infrastructure-neutral outcomes:

| Wrapper result | Preconditions | Required behavior |
|---|---|---|
| `invalid_request` | Any missing, unknown, forbidden, empty or oversized field. | Return redacted typed rejection; do not invoke application. |
| `static_host_unavailable` | Host is explicit static context. | Return typed availability result; do not invoke application or network. |
| Published typed application result | Valid request and explicit server context. | Delegate once to injected published application contract; preserve its existing non-authoritative result semantics. |
| `runtime_unavailable` | Injected application/audit cannot complete safely without a fallback. | Return redacted typed failure; no retry loop, alternate provider or state change. |

No response contains a graph command, direct provider metadata, raw response text, proof or authority field. A future caller may render only the existing application’s closed non-authoritative outcome, without promotion or persistence.

## 4. Request, audit and failure rules

Validation uses exact-key and explicit finite string-bound checks. The future wrapper must neither transform arbitrary data into a synthetic valid request nor retain an invalid payload. The node identity used for a redacted audit observation is represented only through a documented one-way redaction seam; G2-A does not prescribe or claim a cryptographic function. A future G3 must test collision-independent non-authority behavior and the absence of raw node data in each event.

The application is called at most once for a valid server-context request. The audit receives at most one terminal observation. An audit failure, unexpected application throw, cancellation or unavailable result must terminate with a redacted unavailable outcome and must not retry, fall back to legacy Gemini, dispatch a provider, enqueue background work, mutate the map or alter authority state.

## 5. Red-first G3 design gate

No G3 test or production module is created by this G2-A publication. A separate G3 may introduce only the following **test-only** paths on a fresh current-main worktree:

```text
src/agentGateway/agentGatewayRuntimeBoundary.test.ts
src/agentGateway/agentGatewayRuntimeBoundary.topology.test.ts
```

The initial valid-red must prove that the future `agentGatewayRuntimeBoundary.ts` production module is absent. It must keep TypeScript health and use dynamic module loading only after the explicit existence gate. Before any OIR amendment, the two untracked G3 test paths must produce the expected OIR rejection. After that recorded red result, OIR may admit exactly these two test paths and the one future production module path:

```text
src/agentGateway/agentGatewayRuntimeBoundary.ts
```

No other OIR admission is authorized. `src/model/audit.ts`, all protected OIR byte guards and the already published B2 receipt-ledger admissions remain immutable.

| Required G3 test family | Observable assertion |
|---|---|
| Existence/red baseline | The future module is initially absent; no source/environment/provider defect is hidden by the test harness. |
| Delegation and static host | Static host returns unavailable without application call; valid server request invokes the published application contract exactly once. |
| Closed input | Prompt/provider/model/endpoint/key/proof/state/type/formula/Lean/source/unknown fields are rejected before delegation. |
| Output and authority | Wrapper does not create duplicate result taxonomy, raw transport payload, map/proof/state/type/trust/Lean/Core authority field or mutation command. |
| Audit minimization | One terminal redacted event only; no raw node text, prompt, source/proof bytes, provider payload, token or credential. |
| Topology | Only sibling application import; no server/UI/store/persistence/network/provider/browser/Lean/Core/authority coupling. |
| Legacy preservation | `server.ts` and existing Gemini path remain byte-for-byte unchanged by candidate scope. |

G3 green is not an implementation authorization. A later explicit G4 may implement only the single future module listed above, after a separate user gate.

## 6. Immutable RICIS and authority boundary

G2-A does not compute, reinterpret or classify any RICIS expression. L0/L1, SP1–SP4, A1/A4/A5/A6/A7/A10, typed F/G semantics, Monoliths, Fractal Law and author-primary RICIS III results, including owner-authorized P=NP, remain outside the wrapper and immutable.

Lean source, proof bytes, Core results, trust/state policy and canonical source identities are not request, response, audit or persistence fields. No Lean, lake or elan process is called. TypeScript/Vitest/build evidence from any later gate may show only technical compatibility; it cannot be described as Lean-kernel verification, a mathematical proof or an authority decision.

## 7. Explicit exclusions

G2-A does not add or authorize: `server.ts` changes; BFF/Express route; HTTP request/response mapping; provider SDK/API; provider selection/activation; credential/config/secret; network or web search; UI control; browser storage; persistence/database/schema/migration; export/delivery; scheduler/worker; durable audit; consent/authentication implementation; Core/Lean/WASM call; source/proof read/copy; trust/state/axiom/RICIS writer; package upgrade; release version change; or direct merge of the historical candidate branch.

## 8. Next gate

The next permitted step is a separate test-only approval:

```text
OK EXP-MAP-AGENT-GATEWAY-RUNTIME-RECONCILIATION-01 G3
```

Without it, this G2-A document is the complete reconciliation design and no test, source, implementation or publication expansion may begin.

## References

[1]: `docs/03-quality/SPRINT_AGENT_GATEWAY_STEP4_RELEASE_EVIDENCE.md` — current published deterministic/in-memory Agent Gateway boundary.
[2]: `src/agentGateway/agentGatewayApplication.ts` — published application-layer contract to be delegated to, not duplicated.
[3]: `EXP-MAP-AGENT-GATEWAY-RUNTIME-RECONCILIATION-01_G1_DECISION_2026-08-27.md` — external read-only candidate assessment, exact divergence and OIR conflict record.
