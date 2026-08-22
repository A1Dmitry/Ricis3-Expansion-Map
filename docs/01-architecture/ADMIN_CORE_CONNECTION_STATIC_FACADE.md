# Admin Core Connection — Static-safe Facade

**Release:** 0.4.34
**Status:** implemented browser-safe static facade and deployment-optional unavailable Express namespace; real server control-plane adapters are intentionally unavailable.

## Purpose

The **Admin Core** section in Settings makes the operational boundary for an external `Ricis.Core` visible without claiming that GitHub Pages can securely manage a remote host. The static application projects a typed `server_capability_unavailable` state. It does not provide a host URL field, API-key field, browser-managed registry, direct external request or generic proxy.

> A current static deployment cannot authorise an operator, perform fresh authentication, keep a durable host registry/audit trail, issue one-time enrollment material, verify host-key possession, or enforce an outbound host route. It must fail closed rather than simulate these controls in browser storage.

## Composition

`src/adminCoreConnection/contracts.ts` contains browser-safe DTOs and DI ports. `staticAdminCoreConnection.ts` is the static implementation of the feature-reader, Settings query and command facade. Every command returns the same typed unavailability result and does not touch network, storage, environment configuration or credentials.

| Layer | Current v0.4.34 responsibility | Explicitly absent |
|---|---|---|
| `SettingsModal` | Shows a localized status card and safe explanation. | URL/key fields, lifecycle controls, enrollment display, host selection. |
| `StaticAdminCoreConnection` | Provides immutable empty snapshot and typed `server_capability_unavailable`. | Fetch, WebSocket, local/session storage, endpoint mutation, secret handling. |
| `adminCoreConnection` contracts | Defines feature, command, bounded Core operation and operational provenance types. | Runtime implementation, auth policy, network transport, proof mutation. |
| `adminCoreRuntimeCapabilities` | Defines a narrow injected `inspect()` deployment-capability port. | Environment probing, Core launch, network dial, host state or credential handling. |
| `adminCoreUnavailableHttpAdapter` | Registers `/api/admin-core/v1` and returns typed HTTP `503 backend_unconfigured` while active control plane is absent. | Host operation, generic routing, input reflection, Core/auth/database/agent call. |
| Existing `HostControl` | Remains the canonical domain contract for lifecycle/enrollment/route decision. | Browser composition in this release. |
| Existing Core bridge | Continues using current deployment configuration and Core-first recovery rules. | Per-user mutable external host configuration. |

## Deployment-optional server namespace

When an Express process starts, it registers `GET /api/admin-core/v1/status` and a namespace fallback through `registerAdminCoreUnavailableRoutes(app)`. Both return the same versioned, non-authoritative `503 backend_unconfigured` body until a separately reviewed server composition injects a genuine authorised application registrar.

The default `UnconfiguredAdminCoreRuntimeCapabilities` is pure and deterministic: it requires no environment variable, Core process, database, certificate, host agent or secret. A missing or throwing optional capability also maps to the generic safe status. Existing health, local Core, proof and CommunityRewards endpoints stay independent of this optional namespace.

> **A reachable status endpoint is not a control plane.** `control_plane_ready` has no authority semantics in the unavailable adapter: it still returns 503 until the future active registrar, durable authentication and HostControl-backed application are all explicitly composed.

## Trust and security boundary

An eventual external-host response may include `hostId`, Core build, route-decision reference and correlation ID as **operational provenance**. It cannot promote a graph node, Core computation, external source or proof artifact to `resolved`, `TRUSTED_AXIOM` or `LEAN_VERIFIED`.

The contract supports only a future fixed finite operation union: `core.health` and `expression.simplify`. It deliberately cannot represent a generic `url`, `baseUrl`, HTTP method, arbitrary path, headers, credentials or a client-selected HostId. Any server implementation must first ask existing Host Control for a short-lived approved route decision and then perform the fixed operation through a server-owned protected channel.

## Path to server activation

Activation is not a Settings toggle. It requires a separately deployed control plane with the following adapters:

1. Durable opaque session, explicit `host:manage:self` entitlement and fresh-auth decision.
2. Owner-scoped Host Registry and redacted append-only audit store.
3. One-time short-lived enrollment assertion, host public-key possession verification and signed health/build attestation.
4. Outbound mutual-TLS host-agent channel, approved compatibility manifest and revocation lifecycle.
5. Server-side route gateway with fixed schemas, time/size/rate/concurrency limits and no arbitrary forwarding.
6. Safe BFF facade that maps the contracts in this module to React Settings DTOs.

Direct public IP, hostname registration, VPN mode, browser WASM artifact registry and remote process lifecycle control remain separate future increments with their own security reviews.

## Verification

`src/adminCoreConnection/contracts.test.ts` verifies contract-only capability, secret/redaction, bounded-operation and provenance properties. `staticAdminCoreConnection.test.ts` verifies the fail-closed static facade and its sole Map3D → Settings composition seam. `server/adminCoreRuntimeCapabilities.test.ts` verifies clean-platform capability outcomes, while `server/adminCoreUnavailableHttpAdapter.test.ts` runs only a local in-process Express harness to verify exact 503 bodies, nested route safety, no input reflection and error redaction. The project quality gate runs all suites together with the full Core/Host Control/proof regression suite; no deployment smoke check is a required test prerequisite.
