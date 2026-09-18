# Remote Ricis.Core Host Control Plane — Шаг 1: business и security specification

**Статус:** `APPROVED. In-process application orchestration completed in v0.4.28; provider credentials, network listeners, database migrations, VPN/mTLS/crypto adapters, UI and deployment remain separate unimplemented boundaries.`

**Цель.** Дать авторизованному и уполномоченному пользователю возможность подключить собственный runtime `Ricis.Core` к web-приложению, не встраивая произвольный IP/port в browser bundle, не раскрывая private keys и не превращая приложение в SSRF proxy или remote shell.

> OAuth, passkey или иной вход создают только local authenticated session. Они **не** дают автоматически ни права видеть Admin Hosting, ни права регистрировать host, ни права читать provider profile, ни права запускать команды на удалённой машине.

## 1. Бизнес-ценность и корректная граница обещания

Пользователь хочет запускать свой совместимый WebAPI host там, где ему удобно: на своей машине, VM, сервере организации или допустимой managed platform, и направлять разрешённые RICIS execution requests из приложения на этот host. Это полезно для независимого Core runtime, контролируемого обновления версии, локальной сети пользователя и автономного владения вычислительным контуром.

Система **не может честно обещать «запуск API с какого угодно места»** в абсолютном смысле. Host должен быть включён, иметь исходящий HTTPS доступ к control plane либо публично доступный защищённый ingress, соблюдать network policy и пройти possession/ownership verification. Host за NAT/firewall не становится доступен из интернета лишь от ввода IP/port. Поэтому P0 поддерживает два разных first-class режима: рекомендуемый `agent_tunnel`, в котором host сам создаёт исходящее защищённое соединение и работает за NAT, и ограниченный `direct_ip_webapi`, в котором оператор регистрирует literal IPv4/IPv6 и policy-approved port без DNS-зависимости.

| Формулировка пользователя | Точный продуктовый contract |
|---|---|
| «Зарегистрировать IP и порт.» | Для режима `direct_ip_webapi` оператор регистрирует канонический literal public IPv4/IPv6 и policy-approved port. IP/port — server-side endpoint policy, а не произвольный browser URL. |
| «После обмена ключами прописать в приложение.» | Host registry живёт server-side. UI получает безопасный `HostSummary`, а execution routing получает short-lived route decision. Никакого IP, private key или bearer credential в статической сборке. |
| «Запускать host откуда угодно.» | После локальной установки/запуска approved host agent и прохождения enrollment host доступен через разрешённый channel. P0 не запускает процессы на удалённой машине. |
| «WebAssembly или WebAPI.» | Это разные execution modes. WebAssembly — browser-local artifact without host IP/port registration. WebAPI — remote server runtime with host registry and mTLS/agent contract. |

## 2. Scope, non-goals и RICIS boundary

### P0 scope

P0 создаёт **control-plane model**, а не произвольный remote administration:

1. Local account, role/entitlement, fresh-authentication check и audited host-management access.
2. Server-side `HostRegistry` с состояниями lifecycle, owner, mode, capabilities, public-key/certificate fingerprint, trusted Core compatibility manifest и audit metadata.
3. One-time enrollment ticket, public-key proof of possession, per-host short-lived mTLS certificate or equivalent certificate-bound channel, heartbeat/health attestation and revocation.
4. Оба поддерживаемых P0 modes: `agent_tunnel` (рекомендуемый) и `direct_ip_webapi` (first-class restricted public-IP mode); browser-local `wasm` only as separate execution provider configuration. Hostname-based direct routing остаётся P1 и не является обязательным для reachability.
5. Fixed, bounded Ricis.Core operation routing — not arbitrary URL/path/method forwarding.
6. Typed statuses for unavailable/untrusted/suspended host; users never receive synthetic execution success.

### Explicit non-goals

| Non-goal | Почему запрещён в P0 |
|---|---|
| Arbitrary remote shell, SSH, Docker command or process start | Это превращает host enrollment в RCE/control agent и требует отдельный endpoint-management threat model. |
| User-entered arbitrary URL fetch or proxy | Это SSRF primitive, особенно опасный against loopback/private/cloud metadata addresses.[1] |
| Storing host private key, OAuth token, passkey key, raw SSH key or client secret in browser/registry | Нарушает secret boundary и делает credential replay вероятным. |
| Automatic promotion of a RICIS/Core response to `LEAN_VERIFIED` or `resolved` | Runtime location and login state do not supply Lean kernel evidence. |
| Dynamic arbitrary WASM loading from a user host | Browser code supply chain needs separate signed-artifact/SRI policy; it is not IP/port host registration. |
| Silent hostname/IP replacement after enrollment | DNS rebinding, endpoint hijack and provenance confusion require explicit review/verification.[1] |
| Delegating owner/admin rights based on email, display name or OAuth provider claim | Identity linking requires explicit local policy; provider data is not authorization truth. |

The host layer affects only **execution provenance**: which approved Core build produced a typed result. It cannot change the RICIS proof graph, bypass Core-first authority, recalculate a renderer, or promote a theorem/claim status.[5]

## 3. Actors and authorization model

| Actor | Required condition | Allowed action | Prohibited action |
|---|---|---|---|
| Visitor | No session. | View public documentation/features. | View host inventory, create ticket, access admin routing. |
| Member | Local authenticated account. | View personal settings, request host-operator access. | Register host merely by OAuth login. |
| Host Operator | Member with explicit `host:manage:self` entitlement. | Create/revoke own host drafts; retrieve one-time enrollment ticket after step-up; view redacted health/audit. | Alter other owner’s host, edit global network policy, create arbitrary proxy route. |
| Organization Admin | Explicit role + fresh step-up session. | Approve/suspend delegated hosts; assign operator entitlement within own organization. | Override platform security policy or inspect secrets. |
| Platform Security Admin | Separate break-glass RBAC/approval policy. | Emergency suspend, certificate revoke, policy review, audited incident response. | Normal user content/proof changes without domain authority. |
| Host Agent | Possesses enrolled key/certificate and a non-revoked HostId. | Establish mTLS/tunnel, present health/build attestation, accept bounded authorised operations. | Obtain admin UI session, access another host, change owner/role/policy. |

**UI rule.** `Settings` is visible to authenticated members. `Admin Hosting` is shown only when backend returns `FeatureDecision: allowed(host_manage)`; every backend endpoint repeats server-side authorization. Absence of the button is not a security check.

A host enrollment, revocation, endpoint change, capability upgrade, or route policy change requires a **fresh authentication** event. P0 supports passkey/WebAuthn step-up when configured; otherwise the action is unavailable rather than silently weakened.

## 4. Deployment alternatives and decision record

The control plane needs a secure server, durable storage, server secret management, outbound network policy and audit records. A pure static GitHub Pages deployment cannot safely implement OAuth callbacks, mTLS verification, host secret storage or host registry; it must show `server_capability_unavailable`.[4]

| Alternative | User experience | Strengths | Trade-offs and prerequisite |
|---|---|---|---|
| **A. Managed central control plane with outbound host agent** | User installs/runs a small host agent alongside Core; agent connects outward. Admin selects host by name. | Works through NAT; no public host port; strongest P0 network stance; revoke/rotate centrally. | Requires a server-side control plane and a persistent agent connection. |
| **B. Managed central control plane with direct public IP WebAPI** | User registers a publicly reachable literal IPv4/IPv6 and policy-approved port; no DNS is needed. | Domain-independent route where a valid public IP is reachable; fewer host components. | Higher SSRF/egress risk; requires HTTPS verification by IP SAN or pinned public key, mTLS, ownership proof, narrow port policy and outgoing firewall enforcement. |
| **C. Browser-local WebAssembly runtime** | User runs compatible module in browser; no remote host field. | No host registry/no server-to-host route; useful offline/local execution. | No private server secret, limited compute/runtime, requires signed/versioned WASM artifact policy; does not satisfy remote API hosting. |
| **D. Manual environment configuration (lightweight interim)** | Operator deploys one centrally configured Core API. | Lowest implementation/security surface. | Does not provide per-user self-service registration and therefore does not satisfy the target admin workflow. |

The architecture retains all four alternatives. P0 implementation must not silently select a paid/persistent deployment: the user will choose the operating model once the control-plane hosting requirement and policy are approved. For any remote host, **A** remains the security baseline; **B** is a first-class P0 configuration for an explicitly registered public IP+port but has stricter egress/ownership/certificate gates; and **C** is modelled separately rather than pretending that WebAssembly is a server.

## 5. Ubiquitous language and lifecycle

| Term | Definition |
|---|---|
| **Control plane** | Backend that owns authorization, host registry, enrollment, route decision, audit, revocation and policy. It does not perform generic proxying. |
| **Data plane** | Actual bounded Ricis.Core request/response channel between control plane and one approved host. |
| **Host** | Registered execution runtime identified by stable `HostId`, ownership, mode, capability manifest and key fingerprint. It is not an account. |
| **Host agent** | Locally operated process next to Core that initiates mTLS/tunnel connection and proves possession of host key. |
| **Enrollment ticket** | One-time, short-lived, hashed server-side record used only to bootstrap a host key/certificate. Never a durable API key. |
| **Attestation** | Signed statement of HostId, agent version, Core build/version, compatibility manifest, timestamp, nonce and health category. It is execution provenance, not proof verification. |
| **Route decision** | Short-lived server-side approval to route one named bounded operation to one HostId. |
| **Compatibility manifest** | Approved API major/minor, Core build identifier, supported operations, resource limits and artifact hashes. |

```text
Draft → PendingApproval → TicketIssued → KeyBound → Verifying → Active
                                         ↘ Expired
Active → Degraded → Active | Suspended | Revoked | Retired
```

No host is selectable for execution before `Active`. `Degraded` continues no new expensive jobs by default; `Suspended` and `Revoked` deny every new route decision. Revocation invalidates certificate/key fingerprint, server session/tunnel and pending tickets.

## 6. Enrollment and key-exchange protocol

### 6.1 P0 preferred: agent-initiated mTLS/tunnel

The browser never communicates the enrollment secret to a remote host automatically and never receives a private key. The signed-in Host Operator performs a fresh-authenticated operation in the control plane.

1. Operator creates a `HostDraft`: display name, execution mode, environment classification, expected Core compatibility and allowed bounded capabilities. For `agent_tunnel`, no IP/port is entered.
2. Control plane applies RBAC/entitlement/step-up checks, quota and organization policy. It creates `EnrollmentTicket` with random high-entropy secret, one use, maximum 10-minute TTL, HostId, owner, permitted public key algorithm and immutable approved scope. Database stores a salted hash, not the secret.
3. UI shows the secret exactly once as copy/QR/CLI input. It is redacted from UI telemetry, browser history, logs and audit events. It cannot be retrieved again; a replacement invalidates the original.
4. On the host, a future `ricis-host-agent enroll` command generates an Ed25519/ECDSA private key or mTLS keypair **locally**. Private key remains protected by the host OS/key store. Agent sends only ticket, HostId, CSR/public key and signed control-plane nonce over TLS.
5. Control plane atomically consumes the ticket, validates key/algorithm/policy and issues a short-lived client certificate (or registers pinned public-key fingerprint). It stores HostId, certificate/public-key fingerprint, policy version and audit event; it does not store the host private key.
6. Agent initiates mutual TLS to a fixed control-plane hostname. Control plane validates host certificate, HostId binding, revocation state, nonce/time window and compatibility manifest. It then grants a tunnel/session limited to that HostId and allowed operations.
7. Agent sends periodic bounded health attestation and receives no arbitrary shell command. Control plane marks the host `Active` only after all checks pass.

mTLS proves certificate-key possession and enables certificate-bound access protection; the standard describes certificate-based client authentication and binding access tokens to the client certificate.[3] The enrollment ticket is not a bearer credential for normal execution after bootstrapping.

### 6.2 Direct IP WebAPI: P0, restricted and DNS-independent

`direct_ip_webapi` accepts a canonical literal IPv4 or IPv6 address and a policy-approved port. It does **not** accept a hostname, complete arbitrary URL, path, query or fragment; the execution operation chooses the fixed path. This directly supports a domain-independent connectivity route where a public IP is reachable, but it does not promise to bypass legal restrictions, provider terms, or network blocks. Deployment must comply with applicable law and the hosting/network provider's policies.

The control plane parses the address into binary canonical form and rejects loopback, unspecified, link-local, multicast, private, carrier-grade NAT, IPv4-mapped/IPv6 equivalents and cloud metadata ranges. A private IP is valid only for a future same-network connector with its own explicit network-segmentation contract; a public internet control plane never routes to it. Port policy begins with an approved allowlist, for example `443`, `8443` and `5001`, and a policy change—not a browser field—adds another port. HTTP redirects, proxy environment variables and arbitrary upstream path/method selection are disabled.[1]

TLS verification is mandatory. The server must validate either an X.509 certificate containing the enrolled IP address in `subjectAltName` or an explicitly enrolled public-key/SPKI pin. It must never suppress certificate validation because the endpoint is an IP literal. The client additionally presents a per-host mTLS certificate or equivalent proof-of-possession credential; a public IP alone is not host identity.

Ownership proof requires both:

1. Host agent uses the same one-time enrollment sequence and presents host mTLS certificate/public-key proof to the control plane; and
2. The declared API endpoint returns a signed enrollment nonce over validated TLS at the fixed path `GET /.well-known/ricis-host-enrollment/{nonce}`, with expected HostId and public-key fingerprint.

The control plane stores the canonical endpoint encrypted server-side for routing and exposes only a redacted representation to ordinary UI/audit views. Any IP, port, certificate/public-key pin or capability/build change returns host to `PendingApproval`; there is no silent re-route. Direct data-plane requests use exact IP+port, fixed method/path/schema, mTLS where feasible, response bounds and route firewall policy; they are never browser-controlled forwarding.

### 6.3 WebAssembly execution mode

`wasm` creates a `ClientExecutionProvider` record, not a network host record. It references an approved versioned artifact manifest with content hash/SRI, allowed origin policy and explicit runtime capabilities. No IP/port, host agent ticket, server certificate or server-side secret is involved. If a calculation requires protected Core/Lean or durable server evidence, browser WASM returns a typed `requires_server_authority` state and does not fabricate it.

## 7. Routing and application integration

Current static `VITE_RICIS_CORE_API_BASE_URL` is not the final multi-host contract. The future server backend resolves a user-visible host selection into a policy-controlled `RouteDecision`; React receives no raw host credential and no universal proxy URL.

| Layer | Responsibility | Must not do |
|---|---|---|
| React Settings/Admin UI | Show redacted summaries, obtain explicit action confirmation, display typed lifecycle/error state. | Store ticket after display, expose private key, construct arbitrary destination URL, decide entitlement. |
| API/BFF | RBAC, fresh-auth, host draft/ticket lifecycle, route decision, DTO validation and audit. | Trust client `HostId` without ownership/policy, forward arbitrary methods/paths, return raw upstream errors. |
| Host Registry | State machine, host ownership, capability/build manifest, fingerprint, revocation. | Store key material/token plain text, promote trust/proof status. |
| Route Gateway | Resolve approved HostId to fixed operation and enforce request/response size/time/rate limits. | General-purpose HTTP proxy/SSRF primitive. |
| Host Agent / Core API | mTLS, signed attestation, strict bounded endpoint behavior. | Accept remote shell, modify role/entitlement or emit unverified Lean claim. |

Initial operation allowlist is a finite versioned set, such as `core.health`, `expression.simplify`, `expression.derivative`, `expression.system`, and approved proof-document requests. Every operation has a DTO schema, request byte limit, response byte limit, deadline, concurrency/quota and explicit Core compatibility requirement. A host response includes `HostId`, Core/agent build identifiers and a correlation ID; it does not receive the user’s OAuth/refresh token.

> A host response can be structurally valid yet still have status `REQUIRES_CORE_LEAN`, `STATIC_CHECK_PASSED` or `REJECTED`. Host registration cannot make it `LEAN_VERIFIED`.[5]

## 8. Security invariants and threat model

### 8.1 Non-negotiable invariants

1. Only server-side control plane routes to a remote API. Browser clients never receive a generic server-to-host proxy capability.
2. Every enrollment ticket is high entropy, server-hashed, one-time, TTL-bounded, action/HostId-bound and invalidated on use/reissue/revocation.
3. Every host identity is asymmetric: host private key never leaves host; control plane retains only public fingerprint/certificate metadata and revocation state.
4. OAuth/session credential, host credential and host operation credential are distinct, minimally scoped and audience/HostId-bound. OAuth BCP recommends authorization-code/PKCE, exact redirect matching, least privilege and sender-constrained tokens where possible.[2]
5. Direct mode accepts only HTTPS, no redirect, explicit hostname/IP and permitted port. It blocks loopback, unspecified, link-local, multicast, private, carrier-grade NAT, IPv4-mapped/IPv6 equivalents and cloud metadata ranges, and applies egress firewall policy. Domain resolution is pinned/checked at registration and connection time to defend DNS rebinding.[1]
6. Host mode/endpoint/certificate/build/capability changes are separate sensitive actions requiring step-up, re-verification and audit.
7. Admin status is backend RBAC/entitlement, never a claim inferred from OAuth provider, email or client role field.
8. Registry/artifacts/audit contain no host private key, raw enrollment ticket, browser token, OAuth refresh token, passkey credential private key or full user request body by default.
9. No remote shell or arbitrary process lifecycle in P0. A future local service controller can expose only an explicitly allowlisted `start|stop|restart|health` operation and needs a new threat model/approval gate.
10. Failure returns typed denial/unavailability; it never falls back to local TypeScript computation, arbitrary upstream route or invented proof result.

### 8.2 Threat matrix

| Threat | Likely abuse | Required mitigation | Residual/operational action |
|---|---|---|---|
| SSRF via IP/port | Reach `127.0.0.1`, RFC1918, metadata or internal services through control plane. | Fixed protocol/path, address-class deny, allowlist, DNS recheck, no redirect, egress firewall, no arbitrary proxy.[1] | Alert + suspend host/policy review. |
| DNS rebinding | Approved hostname later resolves to private/malicious address. | Resolve A/AAAA at registration and each connection; reject forbidden/resolution drift; require reapproval. | Mark `Suspended`; audit change. |
| Stolen enrollment ticket | Attacker enrolls their host. | One-use/short TTL/hash, fresh step-up, host nonce, public-key possession, immediate invalidation. | Revoke host and issue new ticket. |
| Stolen host bearer token | Attacker replays operation credential. | Prefer mTLS/certificate-bound or proof-of-possession token, short TTL, HostId/audience/action scope.[2] [3] | Certificate/token revocation and session kill. |
| Host impersonation | Fake service claims a valid HostId. | mTLS fingerprint validation, signed nonce/attestation, no shared global host key. | Suspend on fingerprint/cert mismatch. |
| OAuth account takeover | Attacker gains user session then manages host. | Authorization code+PKCE/nonce/state, exact redirects, fresh passkey/MFA step-up for sensitive action, RBAC.[2] | Force logout, revoke tickets/hosts as appropriate. |
| Cross-tenant access | User selects another owner’s HostId. | Server derives allowed hosts from account/org/role; opaque IDs do not authorize. | Authorization regression test and incident audit. |
| Compromised host agent | Malicious host executes broad operations or exfiltrates data. | Narrow operation capability, quotas, no secrets sent to host, version/build policy, rate/time/size bounds. | Immediate revoke/suspend, rotate keys, forensic audit. |
| Replay / duplicate callback | Reuse ticket, health nonce or completion event. | Atomic consume, nonce, timestamp window, idempotency key, monotonic sequence/counter. | Deny and security event. |
| Key rotation error | Stale certificate breaks service or old key remains accepted. | Overlap window, key version, explicit activate/revoke, expiry alert, bounded grace period. | Degrade/suspend rather than accept unknown key. |
| Log/telemetry disclosure | Ticket, token or personal payload appears in log. | Structured redaction, deny-list fields, secret scan, safe correlation IDs. | Rotate exposed credential and incident workflow. |
| DoS / cost abuse | Registered host consumes gateway resources. | Per-account/host quotas, concurrency, max bytes, max duration, circuit breaker, job cancellation. | `Degraded`, rate-limit, notify owner. |
| Proof-status laundering | Host result displayed as formal proof. | Immutable status mapping, Core/Lean evidence requirements, renderer consumes same snapshot only.[5] | Rejected/partial typed state. |

### 8.3 Incident and credential lifecycle

| Phase | Required action | Security output |
|---|---|---|
| Detect | Control plane observes certificate mismatch, replay, forbidden target resolution, anomalous rate/error pattern, invalid attestation or secret-scanner finding. | Redacted `SecurityEvent`, correlation ID, HostId/account reference and policy version. |
| Contain | Auto-suspend the affected HostId, stop new route decisions, invalidate pending enrollment tickets and block certificate fingerprint. | Typed `host_suspended` result; no silent failover to unapproved target. |
| Assess | Security Admin reviews append-only audit, affected operations and route metadata; no raw document body/token is needed by default. | Scope, severity, owner notification and revocation decision. |
| Eradicate | Owner rebuilds/replaces agent/host, rotates key locally, creates fresh enrollment ticket and completes new ownership proof. | Old certificate/key remains revoked; no key reuse. |
| Recover | New host remains `Verifying` until mTLS/attestation/compatibility/health tests pass, then becomes `Active`. | New provenance record and explicit recovery time. |
| Learn | Approved post-incident review updates host policy, test cases, detection threshold or dependency/SBOM controls. | Versioned policy/test evidence; no retrospective trust promotion. |

A host-agent release must have an explicit version, artifact hash/SBOM policy and signed distribution decision before production rollout. If an agent package or signing key is suspected compromised, the platform revokes all affected agent certificates and disables the distribution channel until a separately approved remediation is complete.

## 9. Privacy, data retention and audit

| Record | Minimal retained fields | Never retain | Lifecycle |
|---|---|---|---|
| Host registry | HostId, owner/org reference, mode, redacted origin/fingerprint, capability/build manifest, state, timestamps. | Private key, raw ticket, OAuth refresh token, full personal request. | Retire/revoke then retain minimum audit metadata by explicit policy. |
| Enrollment ticket | Salted verifier/hash, HostId, expiry, consumed/revoked time. | Plain ticket after creation/display. | Delete/cryptographically invalidate after expiry/consume. |
| Health attestation | HostId, signed build/capability summary, timestamp, latency/status category. | Secret configuration and full environment variables. | Short operational window; aggregate metrics longer only by policy. |
| Audit event | Actor type/id reference, action, HostId, result, correlation ID, policy version, redacted reason. | Token/ticket/private key, raw provider profile. | Append-only/tamper-evident according to retention policy. |
| Route event | HostId, allowed operation, status, latency/size class, correlation ID. | Full expression/document body by default. | Aggregated/redacted operation retention. |

Locale preference, author metadata and consent remain independent from host registry. A registered host cannot retrieve provider profile data or publish a report merely because it receives a computation request.

## 10. User journey and UX states

1. The user signs in with OAuth, passkey or a future approved method. The app creates a local session only.
2. Settings calls backend feature decision. A standard Member sees `Request host access`; a permitted Host Operator sees `Admin Hosting`.
3. Admin Hosting explains modes with no security ambiguity: **Connect host agent (recommended)**, **Register public IP WebAPI (restricted, DNS-independent)** or **Configure browser WebAssembly (local)**.
4. Operator creates a draft and sees capability/policy requirements. Literal public IP+port is validated as a restricted server-side configuration but not displayed as an open browser URL.
5. After explicit confirmation and fresh authentication, system reveals a one-time enrollment ticket with expiry and safe copy instructions. The UI never shows it again.
6. Host completes key binding and control plane displays `Verifying`, then `Active` or specific typed failure: `ticket_expired`, `ownership_not_proven`, `network_policy_denied`, `incompatible_core`, `certificate_rejected`, `server_unavailable`.
7. The user selects an Active host in execution settings. Application uses a server-issued route decision; it does not modify JavaScript build configuration.
8. Operator can rotate credential, suspend, revoke or retire. Each action states impact, requires fresh auth where sensitive and creates audit event.

## 11. Migration impact

| Existing component | Required future adaptation | Not permitted |
|---|---|---|
| `Ricis.Auth` | Add separate host-management RBAC/entitlement, fresh-auth policy and service-to-service identity ports. | Reuse OAuth identity token as remote host credential or place host secrets in auth-core DTO. |
| `Ricis3-Expansion-Map` React settings | Add capability-gated Admin Hosting shell, redacted HostSummary and typed state UI. | Expose admin button after any OAuth login; persist ticket/private key in browser state. |
| Express/BFF | Add server-only Host Registry, enrollment, route decision and audit ports/adapters. | Fetch arbitrary user URL or act as transparent proxy. |
| `RicisWasmBridge` / Core gateway | Resolve selected approved execution provider server-side, attach provenance envelope. | Trust `VITE_RICIS_CORE_API_BASE_URL` submitted by UI as arbitrary target. |
| Proof/document pipelines | Consume canonical Core response snapshot and preserve trust status. | Let host location, health or account role mark proof resolved. |
| GitHub Pages static deployment | Show server capability unavailable/recovery state. | Simulate control plane with `localStorage`, client secret or static configuration. |

## 12. Phased backlog and acceptance criteria

### Gate A — Business approval (this document)

The user confirms deployment mode direction, role policy, P0 non-goals and the distinction between remote WebAPI and browser WebAssembly.

### Gate B — Architecture contract

After approval, create only interfaces/DTOs/state machine types and ports for: `HostRegistry`, `EnrollmentTicket`, `HostCertificateAuthority`, `HostChannel`, `HostPolicy`, `RouteDecision`, `HostAuditSink`, `HostHealthAttestation` and `ExecutionProviderResolver`. The contract must include all typed denials and no implementation.

### Gate C — QA plan/tests

After architecture approval, write direct tests for every public contract. Required adversarial cases include ticket replay/expiry, role bypass, cross-owner HostId, forbidden address classes, DNS drift, redirect, certificate mismatch, old-key rotation, invalid attestation nonce, operation path escape, quota denial, revocation propagation and proof-status non-promotion.

### Gate D — Implementation order

| Priority | Increment | Completion condition |
|---|---|---|
| P0.1 | Backend role/entitlement and admin feature decision. | Button and endpoints server-authorized; no host network call. |
| P0.2 | Server Host Registry + lifecycle + audit schema. | State transitions atomic and owner-scoped. |
| P0.3 | Agent enrollment ticket/public-key proof + mTLS outbound channel. | No private key/ticket retention; replay/revocation tests pass. |
| P0.4 | Bounded agent route gateway for health and one Core operation. | Fixed DTO/path/time/size/rate limit, provenance envelope, no generic proxy. |
| P0.5 | Direct public IP WebAPI registration. | Literal IP+policy port, IP-SAN/pinned-key TLS, mTLS, endpoint nonce proof, SSRF/egress gates pass. |
| P0.6 | React Admin Hosting UX and route selection. | Typed states, secret-redaction, accessible recovery flow. |
| P1 | Hostname-based direct API origin registration. | Separate DNS-rebinding/hostname policy and ownership verification gates pass. |
| P2 | Local service lifecycle controller. | Separate approval/threat model; only allowlisted service actions, no remote shell. |
| P3 | Browser WASM artifact registry. | Version/hash/SRI/supply-chain policy and server-authority fallback pass. |

### Acceptance criteria for P0 approval

1. An OAuth-authenticated Member without host entitlement cannot view/use admin host endpoints.
2. A Host Operator must re-authenticate/step-up before ticket issue, key rotation, endpoint change, suspend/revoke.
3. Ticket replay, expiry or HostId mismatch returns typed denial and leaves no active key/channel.
4. Host private key and raw ticket are absent from browser, logs, registry and API DTOs.
5. Agent can become active from behind NAT using outbound secured channel; no public inbound host port is required.
6. Route gateway rejects arbitrary URL, method, path, redirect, unsupported operation, over-limit input/output and stale/revoked host.
7. Host selection remains owner/org/entitlement-scoped and cannot bypass tenancy through altered client HostId.
8. Every response shows Core/host provenance, but no execution result gains Lean/formal status solely from remote host registration.
9. Static deployment visibly returns an unavailable/recovery state for host management rather than emulating it client-side.
10. Security audit can reconstruct who requested/approved/enrolled/revoked which HostId without exposing secret material.

## 13. Questions requiring policy confirmation before Gate B

| Decision | Options | Why it changes the architecture |
|---|---|---|
| P0 remote mode | Agent-tunnel only; agent + direct public IP WebAPI; manual static configuration. | Determines SSRF/egress surface, sanctions/resilience route, networking and first adapters. |
| Host ownership | Personal hosts only; organization sharing; delegated admin. | Determines tenancy, approval workflow and RBAC model. |
| Strong auth | Passkey-required; external MFA accepted; disabled until configured. | Determines sensitive-action availability and recovery process. |
| Control-plane location | Managed server; owner-operated deployment; later choice. | Determines storage, TLS/CA, audit and operational ownership. |
| Core compatibility | Exact pinned build; approved version range; operator attestation only. | Determines supply-chain/provenance policy and rollout speed. |
| Direct endpoint policy | P0 literal public IP + policy-approved port; agent-only; or hostname later. | Determines sanctions/resilience path, SSRF controls and user experience. |

## References

[1]: [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) — URL/address allowlisting, disabled redirects, DNS rebinding concern and network-layer egress defence.
[2]: [RFC 9700 — OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/info/rfc9700/) — exact redirect matching, authorization-code/PKCE, nonce/state, least privilege, token replay and asymmetric client-auth guidance.
[3]: [RFC 8705 — OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens](https://datatracker.ietf.org/doc/html/rfc8705) — mTLS client authentication, proof of private-key possession and certificate-bound token semantics.
[4]: [`Ricis.Auth architecture`](../01-architecture/SPRINT_AUTH_LIBRARY_STEP2_ARCHITECTURE.md) — existing identity/session/consent/passkey server-boundary principles.
[5]: [`MD review requirements`](../00-governance/MD_REVIEW_REQUIREMENTS_2026-08-20.md) — Core-first authority and Lean trust status boundary.
[6]: [`Research sources`](../01-architecture/ADMIN_HOST_CONTROL_PLANE_RESEARCH_SOURCES.md) — retained primary-source findings for this increment.
