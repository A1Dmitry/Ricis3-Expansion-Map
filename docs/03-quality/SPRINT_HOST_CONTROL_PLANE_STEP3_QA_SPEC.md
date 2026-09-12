# Remote Ricis.Core Host Control Plane — Шаг 3: adversarial QA specification

**Статус:** `GREEN in v0.4.28. The initial red module-resolution result is retained as test-first evidence; all 13 direct HostControl adversarial tests pass against the in-process application layer.`

**Вход:** утверждённый [Step 2 architecture contract](../01-architecture/SPRINT_HOST_CONTROL_PLANE_STEP2_ARCHITECTURE.md).
**Тестируемая future public application surface:** `HostControlApplicationService`.
**Не реализуется на этом шаге:** database, HTTP/VPN/mTLS adapter, cryptographic library, Express route, React admin UI, host agent, network listener, environment secret or deployment.

## 1. QA principle

Каждое новое public method должно иметь прямой positive test и adversarial negative tests. Security failure возвращается typed result, не `throw`, не arbitrary upstream request и не silent fallback. Tests use only in-memory dependency fakes; they must not contact an IP, open VPN, create key material or depend on browser OAuth/session storage.

| Public method | Positive direct test | Required negative/adversarial tests |
|---|---|---|
| `createDraft` | Entitled owner creates a valid direct-IP or VPN draft. | Missing entitlement; forbidden direct-IP class; non-approved port; IP without TLS identity; browser-observed IP is not auto-trusted. |
| `issueEnrollmentAssertion` | Fresh operator receives one display-only short-lived assertion. | OAuth/session token is absent from assertion/DTO; no fresh auth; cross-owner HostId; second issue invalidates/revokes earlier assertion. |
| `completeEnrollment` | Correct assertion + public-key possession + approved manifest changes host to `verifying`. | Expired/replayed assertion; nonce/signature/key-binding failure; rejected capability manifest; raw remote HTML cannot become form input. |
| `activateFromHealthAttestation` | Valid HostId/key/nonce/manifest attestation moves verified host to `active`. | Key mismatch; replayed nonce; stale timestamp; invalid signature; manifest hash mismatch. |
| `requestRouteDecision` | Active owner gets one bounded allowlisted operation route. | Suspended/revoked/degraded host; cross-owner HostId; unsupported operation; quota denial; route decision never includes URL/method/path/secret. |
| `revokeHost` | Fresh owner revokes host and invalidates future routes/assertions. | No fresh auth; cross-owner revoke; stale state; post-revocation route remains denied. |
| `resolveExecutionProvider` | Selects eligible active owned host and attaches provenance. | Static deployment returns `static_host_unavailable`; no eligible host; provenance cannot promote `LEAN_VERIFIED`/`resolved`. |
| `requestVpnPeerPlan` | Policy accepts public peer key with one tunnel address/destination/port. | No private key in plan; `0.0.0.0/0` denied; public direct-IP cannot reach private address; unapproved port/route denied. |

## 2. Required test fixtures

| Fake dependency | Controlled behavior | Test purpose |
|---|---|---|
| `FakeHostAuthorizationGateway` | Entitlement and fresh-auth outcomes. | Ensures no client role or OAuth claim is trusted directly. |
| `FakeHostRegistry` | Owner-scoped records, CAS transition state and revoked state. | Detects tenancy leaks, stale transitions and post-revoke use. |
| `FakeEnrollmentAssertionIssuer` | One-time issue/consume/revoke in memory. | Tests replay, expiry and reissue boundary. |
| `FakeHostPublicKeyVerifier` | Configurable possession/health verification result. | Tests typed cryptographic failures without crypto implementation. |
| `FakeHostTransportPolicy` | Direct-IP/VPN allow/deny result. | Validates no generic network operation reaches tests. |
| `FakeVpnPeerProvisioner` | Narrow plan or denial. | Proves public-key-only and no-default-route requirement. |
| `FakeHostRouteDecisionIssuer` | Bounded route issuance/invalidation. | Ensures operation scope without URL/proxy field. |
| `FakeHostAuditSink` | Captures redacted audit events. | Ensures sensitive changes leave an audit event without secret payload. |
| `FakeExecutionProviderResolver` | Static/no-host/resolved outcomes. | Tests UI/runtime availability semantics. |

## 3. Explicit anti-regressions

1. Test source must not contain a real public IP, VPN peer endpoint, OAuth token, private key, mTLS certificate, raw enrollment assertion or user document payload.
2. A hostname string, URL, redirect, arbitrary method or arbitrary path must have no public property in `BoundedRouteDecision`.
3. The direct-IP test vector uses only RFC 5737 documentation addresses such as `203.0.113.10`, never reachable infrastructure.
4. Tests distinguish a host public key string from its private counterpart by construction; no fixture creates a private key.
5. All test assertions describe expected typed status rather than checking textual errors.
6. A successful host action verifies execution provenance only; no test may expect formal proof status promotion.

## 4. Red execution expectation

The initial test run is expected to fail at module resolution because `src/hostControl/hostControlApplication.ts` does not exist during the QA stage. This red result is intentional evidence that tests were created before implementation. It must be recorded with the exact missing public surface; it is not masked by a mock application service or skipped test.

## 5. Recorded red execution

| Command | Actual result | Assessment |
|---|---|---|
| `npm exec vitest run src/hostControl/hostControlApplication.test.ts` | `EXIT_STATUS=1`; Vite failed to resolve `./hostControlApplication` from the direct QA test. No test was skipped and no fake application service was introduced. | **Expected RED.** This is the exact missing Step 4 public module, not a dependency/toolchain/network failure. |

The future implementation must make this module resolvable and then satisfy all listed test cases without weakening the tests, changing their security assertions to text matching, or adding a production fake.

## 6. QA acceptance criteria

The QA stage is complete only when the committed suite names every public method, includes at least one positive and one independently meaningful negative test for it, has direct security coverage for token separation/direct-IP/VPN/replay/revocation/tenancy/provenance, and produces an expected red outcome without modifying runtime adapters.

## References

[1]: [Step 2 architecture contract](../01-architecture/SPRINT_HOST_CONTROL_PLANE_STEP2_ARCHITECTURE.md)
[2]: [Step 1 business and security specification](../02-sprints/SPRINT_HOST_CONTROL_PLANE_STEP1_BUSINESS_SPEC.md)
[3]: [Strict Development Rules](../06-canonical-template/STRICT_DEVELOPMENT_RULES.md)
