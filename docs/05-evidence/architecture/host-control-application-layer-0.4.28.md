# HostControl application layer — implementation evidence v0.4.28

**Версия:** `0.4.28`
**Статус:** `IN_PROCESS_ORCHESTRATION_TESTED`
**Trust status:** `APPLICATION_POLICY_CHECKED — not network/VPN/cryptographic deployment evidence`

## Delivered scope

`src/hostControl/hostControlApplication.ts` implements `HostControlApplicationService` as a strictly dependency-injected in-process orchestration layer. It creates a host draft only after authorization and transport-policy decisions; it issues a one-time enrollment assertion through an injected issuer; it coordinates public-key possession result, bounded VPN peer plan, direct-IP policy, route-decision request, revocation and static-host denial through ports.

| Capability | Delivered behavior | Not delivered |
|---|---|---|
| Direct IP | Typed `direct_ip_webapi` policy result and no generic URL/proxy surface. | DNS/IP parsing, egress firewall, TLS/IP-SAN/SPKI verification or HTTP request. |
| Enrollment | Short-lived assertion orchestration, consume-once call and public-key verifier boundary. | JWS/PASETO generation, keypair generation, certificate issuance or secret storage. |
| VPN | Public-key-only plan/revoke port and no-default-route test contract. | WireGuard installation, peer configuration, private-key handling or tunnel creation. |
| Routing | Bounded operation route decision port; static deployment denial. | Express endpoint, request forwarding, remote API connection or Core host runtime. |
| Revocation | Coordinates registry revoke, assertion invalidate, VPN revoke and route invalidate. | Durable transaction/database/queue or real credential revocation service. |
| Trust boundary | Carries application-level host state only. | Lean verification, proof-status promotion, document publication or author attribution. |

## Test-first evidence

The Step 3 suite was committed before `HostControlApplicationService` existed and initially failed with the expected unresolved module. After the Step 4 implementation, the direct suite passes **13/13** adversarial scenarios. They cover direct-IP denial, browser-IP hint nontrust, no OAuth/private-key assertion leakage, fresh-auth step-up, assertion replay, VPN route scope, cross-tenant route denial, atomic revocation, static host denial and no formal trust-status promotion.

## Quality gate

| Gate | Result |
|---|---|
| Node/npm | Node `22.23.2`; Corepack npm `12.0.2` |
| Clean install | PASS; audit reports **0 vulnerabilities** at moderate threshold |
| Release consistency | PASS; **12/12** checks |
| Strict TypeScript lint | PASS (`tsc --noEmit`) |
| Direct HostControl suite | PASS; **13/13** tests |
| Full Vitest suite | PASS; **34 files / 197 tests** |
| Production build | PASS |
| `git diff --check` | PASS |

The production build retains pre-existing informational warnings: an ineffective dynamic import involving `apiClient.ts`, Vite’s future native-config `__dirname` warning, and a JavaScript chunk over 500 kB. No warning is caused by HostControl source.

## Required next boundaries

Before any actual user can register/reach a Core host, a new approved sprint must add server-side adapters and tests for persistence transactionality, OAuth/passkey entitlement integration, one-time signed assertion generation/validation, certificate/pinned-key verification, public-IP policy and egress firewall, VPN peer provisioning, secure audit retention, Express BFF routes, React Admin Hosting UI, rate/quota/circuit breaking, agent protocol, deployment and incident operations.

> The presence of `HostControlApplicationService` does not make a host reachable, does not open an IP/port, does not configure VPN and does not elevate a mathematical or Lean trust status.

## References

[1]: [Business and security specification](../../02-sprints/SPRINT_HOST_CONTROL_PLANE_STEP1_BUSINESS_SPEC.md)
[2]: [Architecture contracts](../../01-architecture/SPRINT_HOST_CONTROL_PLANE_STEP2_ARCHITECTURE.md)
[3]: [QA specification](../../03-quality/SPRINT_HOST_CONTROL_PLANE_STEP3_QA_SPEC.md)
