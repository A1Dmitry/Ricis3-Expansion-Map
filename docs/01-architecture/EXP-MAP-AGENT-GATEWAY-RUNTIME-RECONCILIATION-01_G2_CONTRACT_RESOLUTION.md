# EXP-MAP-AGENT-GATEWAY-RUNTIME-RECONCILIATION-01 — G2 Contract Resolution

**Статус:** `G2_CONTRACT_RESOLUTION_ARCHITECTURE_ONLY`
**Дата:** 2026-08-27 (GMT+3)
**Одобрение владельца:** `OK EXP-MAP-AGENT-GATEWAY-RUNTIME-RECONCILIATION-01 G2-CONTRACT-RESOLUTION`
**Baseline:** `main` `da0ac4f9fb6fe4b21d5e332083e2c3c8ea4fa171`

## 1. Resolved incompatibility

The approved privacy-minimized runtime request contains a selected node identifier, approved template/schema identifiers, locale, correlation identifier and literal explicit user request marker. The published `AgentGatewayApplicationService.invoke` instead requires a server-owned `InvokeAgentQuestion`, including account identity, provider/model selection, template parameters and `LeanContextEnvelope`.

These identities must not be fabricated by a wrapper, reconstructed from client text, cast from an incomplete object or supplied by the browser. Doing so would weaken the closed-input boundary and erase the distinction between client request data and server-owned invocation context.

> **Resolution:** a future wrapper receives only the privacy-minimized request and calls a typed, injected, server-owned resolution port. Only a successful resolution yields the already published `InvokeAgentQuestion`; only then may the wrapper delegate once to the already published Agent Gateway application contract.

## 2. Future one-module contract

This record remains architecture only. A later G4 may still add only one production file, `src/agentGateway/agentGatewayRuntimeBoundary.ts`. That file is the sole home for the following wrapper-local interfaces; no new composition, persistence or route module is authorized.

```ts
import type { AgentInvocationResult, InvokeAgentQuestion } from './agentGatewayApplication';

export interface AgentGatewayRuntimeRequest {
  readonly nodeId: string;
  readonly templateId: string;
  readonly responseSchemaId: string;
  readonly locale: string;
  readonly correlationId: string;
  readonly explicitUserRequest: true;
}

export type ServerOwnedInvocationResolution =
  | { readonly kind: 'resolved'; readonly invocation: InvokeAgentQuestion }
  | { readonly kind: 'unavailable'; readonly redactedReason: 'context_unavailable' | 'identity_unavailable' | 'selection_unavailable' | 'artifact_unavailable' };

export interface ServerOwnedAgentInvocationResolver {
  resolve(request: AgentGatewayRuntimeRequest): Promise<ServerOwnedInvocationResolution>;
}

export interface PublishedAgentGatewayApplication {
  invoke(input: InvokeAgentQuestion): Promise<AgentInvocationResult>;
}

export interface RedactedAgentRuntimeAuditSink {
  record(event: Readonly<{
    correlationId: string;
    nodeIdHash: string;
    templateId: string;
    responseSchemaId: string;
    outcome: 'invalid_request' | 'static_host_unavailable' | 'runtime_unavailable' | AgentInvocationResult['kind'];
  }>): void;
}
```

The resolver is an interface, not a provider or a source reader. It must be injected by a future server-owned composition root that is outside this increment. The wrapper cannot access a session, request object, environment variable, header, cookie, database, global singleton or browser storage. It does not compose a resolver and does not know how account, provider/model, template parameters or Lean context are obtained.

| Boundary | Permitted behavior | Forbidden behavior |
|---|---|---|
| Runtime request | Exact-key validation of the six client-safe fields and finite length limits. | Prompt, provider/model IDs, endpoint, credential, account ID, arbitrary params, Lean/source/proof/trust/state/type/formula fields, unknown keys or a cast to `InvokeAgentQuestion`. |
| Resolver port | Return a typed complete published invocation or a redacted unavailable reason. | Provider call, network, credential read, database/session lookup, browser access, source/proof copy, state/trust mutation or authority decision. |
| Application port | Exactly one `invoke(resolution.invocation)` after successful resolution. | A second gateway application, duplicate validator/registry/qualification store, retry/fallback/legacy Gemini call, provider activation or result remapping into authority. |
| Audit port | At most one redacted terminal event. | Raw node content, prompt, account identifier, selected model, Lean/source/proof bytes, provider body, token/key, durable/external logging or replay queue. |

## 3. Future terminal outcome rules

The wrapper preserves the published `AgentInvocationResult` verbatim after successful resolution and application invocation. It introduces only wrapper-local availability/rejection outcomes before invocation.

| Condition | Wrapper result | Application invocation |
|---|---|---|
| Invalid or unknown client field | `invalid_request` with a fixed redacted reason | Never. |
| Explicit static host | `static_host_unavailable` | Never. |
| Resolver returns unavailable | `runtime_unavailable` | Never. |
| Resolver throws or audit cannot complete safely | `runtime_unavailable` | Never after resolver failure; no fallback. |
| Resolver returns published full invocation | The exact typed published `AgentInvocationResult` | Once, with the resolver-returned object identity. |
| Published application throws | `runtime_unavailable` with fixed redacted reason | Once only; no retry or legacy path. |

The wrapper must record exactly one terminal event if the injected audit sink returns normally. An audit sink exception must not permit a retry, fallback, provider activation, map mutation or authority change. The module’s observable public result stays redacted and non-authoritative.

## 4. RICIS and authority invariants

This contract transports external-agent availability/results only. It does not calculate, project, reinterpret or reclassify L0/L1, SP1–SP4, A1/A4/A5/A6/A7/A10, typed F/G, Monoliths, Fractal Law or any author-primary RICIS III result. It does not invoke Lean, lake, elan, `RicisWasmBridge`, Ricis.Core or a proof/status writer.

A resolver’s complete `InvokeAgentQuestion` must not be interpreted as a grant to expose its account, selected provider/model, template parameters or Lean context to the wrapper caller. Published `AgentInvocationResult` remains non-authoritative external-agent output; it cannot create `LEAN_VERIFIED`, `TRUSTED_AXIOM`, resolved node status, proof, trust/type/state/formula change or Core result.

## 5. Revised G3 contract requirements

The existing local-only G3 valid-red contract is **superseded before implementation** because it assumes the future wrapper can call `application.invoke` directly from a six-field client-safe request. It must not be merged or used for G4.

A new separately approved G3 must replace only the two test-only runtime-boundary contracts on a fresh `main` baseline. Its valid-red must prove absence of the module and define these observations:

1. The factory requires an injected `ServerOwnedAgentInvocationResolver` and a published application port typed to `InvokeAgentQuestion`.
2. Static and invalid requests invoke neither resolver nor application.
3. Resolver unavailable/throw invokes no application and returns only redacted `runtime_unavailable`.
4. A resolved full invocation is passed to application exactly once with object identity preserved.
5. Application failure has no retry, fallback, provider call, state mutation or authority effect.
6. Topology permits only the sibling `./agentGatewayApplication` import and prohibits server, BFF, provider, browser, storage, scheduler, Lean/Core and authority dependencies.
7. OIR admits exactly the two revised G3 tests and the one future production module; protected guards and existing B2 admission remain unchanged.

## 6. Explicit exclusions

G2-CONTRACT-RESOLUTION does not create a resolver implementation, session/identity resolver, provider/model selector, Lean context builder, HTTP/BFF route, `server.ts` integration, `fetch`, provider SDK/API, credential/config/secret, UI, browser call/storage, database/schema/migration, durable audit, scheduler/worker, external service, source/proof material reader, Lean/Core/WASM action or authority writer.

No current local G3 test is changed by this document; its supersession is a design finding, not an authorization to modify or publish it.

## 7. Exact next gate

The only next step is a fresh test-only revised G3:

```text
OK EXP-MAP-AGENT-GATEWAY-RUNTIME-RECONCILIATION-01 G3-CONTRACT-RESOLUTION
```

It does not authorize implementation. A subsequent separate G4 may implement only the single runtime-boundary module after the revised valid-red contract is measured and approved.
