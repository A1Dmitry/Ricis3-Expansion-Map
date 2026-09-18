# Ricis.Auth — Шаг 1: durable persistence, opaque sessions, delegated-token vault и entitlements

**Статус:** `DRAFT — требуется явное «ОК» перед Шагом 2: архитектурные contracts. Runtime-код, database migration, key-management adapter, provider credential, HTTP endpoint и UI в этом документе не создаются.`

**Приоритет:** `P0.1 prerequisite` для server-side Host Control authorization и будущего production OAuth/passkey integration.

**Входные контракты:** [Ricis.Auth foundation architecture](../01-architecture/SPRINT_AUTH_LIBRARY_STEP2_ARCHITECTURE.md), [Host Control business/security specification](./SPRINT_HOST_CONTROL_PLANE_STEP1_BUSINESS_SPEC.md), [Strict Development Rules](../06-canonical-template/STRICT_DEVELOPMENT_RULES.md).

> **Бизнес-решение:** `Ricis.Auth` получает только server-side durable adapters. Browser получает один opaque session cookie и safe DTO states. Ни OAuth identity token, ни refresh token, ни provider client secret, ни host enrollment ticket, ни passkey private key не становятся browser state, report data или RICIS proof input.

## 1. Проблема и результат

Текущая foundation `Ricis.Auth` уже имеет domain ports для accounts, external identities, one-time authorization attempts, sessions, consent, passkey credentials и service connections. Она намеренно не имеет durable implementation. Пока нет durable server persistence, authenticated session и explicit entitlement не переживают process restart, one-time OAuth replay defence не имеет production atomicity, а Host Control не может честно выдать backend `FeatureDecision` для `host:manage:self`.

Этот increment создаёт продуктовую возможность хранить **минимально необходимые** identity/security records на сервере, управлять opaque sessions и server-only delegated provider tokens, а также вычислять entitlement decision на сервере. Он не включает login UI, live Google/Telegram/ORCID connection, passkey ceremony, database deployment, payment, organisation management, Host Registry, remote routing или proof execution.

| Business outcome | Visible product behaviour | Security boundary |
|---|---|---|
| Durable local account and identity link | A verified identity remains linked after process restart. | Provider subject is the identity key; email/name never grants access. |
| Opaque local session | Browser holds only an `HttpOnly; Secure; SameSite=Lax` cookie identifier. | Cookie is not a bearer token exposed to JavaScript; session record is server-side. |
| One-time authorization state | Replayed, expired or revoked callbacks receive a typed denial. | Atomic consume is required; a read-then-write race is not sufficient. |
| Explicit entitlement decision | Backend may decide `allowed`, `denied` or `server_capability_unavailable` for `host:manage:self`. | UI visibility is never the authorization check. |
| Delegated token vault | Future Manus/Zenodo token is encrypted, referenced by opaque ID and usable only server-side. | Raw token cannot cross `auth-core`, API DTO, log, UI, export or audit payload. |
| Consent/passkey durability | Revocation and authenticator counters survive restart. | Passkey private keys/biometrics never enter persistence. |

## 2. Scope and non-goals

### In scope

The implementation after all gates may provide durable implementations of the existing `auth-core` repository ports, a server-only opaque-session adapter, a server-only token-vault port/adaptor, a minimal entitlement policy port/adaptor and migration/recovery discipline. It must preserve the current public domain members; existing contracts are extended only compatibly.

The first entitlement vocabulary is intentionally narrow:

| Entitlement | Meaning | First consumer |
|---|---|---|
| `host:manage:self` | The account may create/manage only its own Host Control drafts after fresh authentication. | Host Control P0.1 feature decision and endpoints. |
| `host:manage:organization` | Deferred; no implicit grant in this increment. | Future organisation control plane. |
| `host:security:break_glass` | Deferred; must not be synthesized by local role fields. | Future platform security workflow. |

### Explicit non-goals

| Excluded capability | Reason |
|---|---|
| Browser `localStorage`, IndexedDB or a cookie value as auth/token vault | It violates the server secret and replay boundary. |
| Passing OAuth identity/access/refresh tokens to Host Control host, agent or remote Core | OAuth/session credentials are not remote-host credentials. |
| Passkey private key, biometric template, face scan, device PIN or Face ID result storage | These values never leave the authenticator/device. |
| Implicit entitlement from OAuth email, provider claim, display name, country or UI route | External identity is not local authorization truth. |
| Payment/monetization entitlement | Requires a separate business/payment policy gate. |
| Real key-management provider selection, database vendor selection or secret insertion | Deployment decision remains explicit; adapters are injected. |
| Changing `RicisWasmBridge.evaluate()`, proof status or Lean trust | Authentication cannot make a result `LEAN_VERIFIED`, `resolved` or mathematically verified. |
| Automatic migration of legacy browser identity/token data | Import requires a separately approved security/migration procedure. |

## 3. Actors, authorization and fresh-auth policy

| Actor | Preconditions | Allowed in this increment | Denied by default |
|---|---|---|---|
| Visitor | No active opaque session. | Receive public `requires_authentication` state. | Entitlement/consent/session records. |
| Authenticated member | Active non-revoked server session. | Read own safe session/feature decision summary. | Host management merely due to OAuth login. |
| Host operator | Member plus durable `host:manage:self`; fresh-auth for sensitive action. | Receive an allow decision for own Host Control actions. | Other owner’s host, organisation-wide delegation, break-glass. |
| Revoked session holder | Revoked/expired session. | Receive a typed denial. | Token use, consent read, entitlement allow, Host Control action. |
| Server composition root | Explicit server runtime with injected storage/key adapters. | Resolve token references and execute authorised server-side operations. | Expose raw token to browser or remote host. |

A fresh-auth proof is required by the consumer before creating/reissuing an enrollment ticket, binding/replacing a host key, changing endpoint/capability, suspending/revoking a host or reading a server-only service token. A routine feature decision may say an account has the entitlement; it cannot itself satisfy fresh-auth.

## 4. Security invariants

1. **Server-only secret path.** Token plaintext may appear only inside the injected vault adapter during a scoped server operation. It is not representable in `@ricis/auth-core` result DTOs.
2. **Opaque-session-only browser contract.** Browser-visible cookie contains an unpredictable session reference, never identity/OAuth claims, capabilities, refresh token, encryption key, host credential or proof state.
3. **Atomic one-time ceremonies.** Authorization state, WebAuthn challenge and other single-use records are consumed with one atomic success transition. Replay remains observable as a typed `already_consumed`/denied result.
4. **Entitlement is local and revocable.** Every server call re-evaluates current session, account status and entitlement. OAuth assertion, email, client-provided role and UI state cannot replace it.
5. **Least data and redaction.** Audit contains action, opaque references, policy version, correlation ID and outcome; it contains no raw provider token, cookie value, PKCE verifier, authorization code, passkey response body, enrollment assertion or private key.
6. **Cryptographic separation.** Token encryption uses authenticated encryption and a key identifier/version supplied by an injected server-side key protector. Rotation creates a new ciphertext/key version; failed decryption is typed and redacted.
7. **No silent availability downgrade.** Static host, unavailable vault, unavailable durable store, encryption failure or stale session produces a typed unavailable/denied result. It never falls back to browser persistence or in-memory acceptance.
8. **RICIS trust isolation.** Session, consent, token-vault or entitlement result cannot alter a RICIS trust/proof status or substitute Ricis.Core/Lean execution.

## 5. Domain rules and lifecycle

### 5.1 Opaque session lifecycle

```text
Verified identity/passkey
  → Active opaque session
  → [expiry | account revoke | explicit logout | credential/security event]
  → Revoked/Expired session
  → typed authentication denial
```

An active session is bound to one local `AccountId`, issued/expiry timestamps, session version and an opaque cookie reference. Session renewal/rotation must invalidate the predecessor according to a server policy. Account-wide revocation invalidates every active session and delegated-token operation for that account.

### 5.2 Delegated token lifecycle

```text
Verified service callback
  → validate approved capability scope
  → encrypt token into vault record
  → retain opaque token reference in ServiceConnection
  → server-side authorised use only
  → [disconnect | revoke | expiry | key rotation | account deletion]
  → vault record revoked/destroyed
```

The system must not store a provider token inside a `ServiceConnection`, account, audit event, session, report model, exception, test snapshot or browser payload. A token reference alone does not authorise an operation: the calling service must hold an active session/account context, matching capability, consent/policy where applicable and a server runtime.

### 5.3 Entitlement lifecycle

```text
No explicit grant → denied
Explicit durable grant + active session → allowed feature decision
Grant revoke | session/account revoke | policy version change → denied or stale
Sensitive Host Control action → additionally requires fresh-auth proof
```

No default allow exists. Organisation/delegated entitlement is out of scope; a consumer requesting it receives a typed unavailable/denied state rather than an inferred expansion of `host:manage:self`.

## 6. User stories and acceptance criteria

### US-1 — durable identity and session safety

> As a RICIS member, I need my verified account/session to survive a server restart without exposing a provider bearer token to the browser, so I can use permitted server features safely.

| ID | Acceptance criterion |
|---|---|
| AC-1.1 | A server restart does not erase a correctly persisted account, external identity, consent, passkey public credential or non-revoked opaque session. |
| AC-1.2 | Browser response/cookie contract never contains OAuth token, refresh token, client secret, PKCE verifier, authorization code, passkey private key or proof status. |
| AC-1.3 | Expired/revoked/nonexistent session produces a typed denial and cannot reach entitlement or vault use. |
| AC-1.4 | Replaying a consumed authorization attempt returns a typed replay result; concurrent consume attempts can have at most one success. |

### US-2 — server-side Host Control entitlement

> As an authorised host operator, I need the backend to decide whether I may manage my own host, so UI visibility cannot be forged and the next Host Control increment can depend on a stable permission result.

| ID | Acceptance criterion |
|---|---|
| AC-2.1 | A normal authenticated user without durable `host:manage:self` receives `requires_entitlement`/denied from backend feature decision. |
| AC-2.2 | A grant enables only `host:manage:self`; it does not grant cross-owner, organisation or break-glass capability. |
| AC-2.3 | Revocation or account/session invalidation immediately prevents new allowed decisions. |
| AC-2.4 | Host ticket/key/revoke actions demand separately verified fresh-auth; entitlement alone is insufficient. |
| AC-2.5 | UI may hide an unavailable feature, but API re-checks the server decision for every action. |

### US-3 — delegated provider token protection

> As a user who explicitly connects a future service, I need the service token to stay in a server-only encrypted vault, so a report, browser or remote RICIS host cannot reuse it.

| ID | Acceptance criterion |
|---|---|
| AC-3.1 | A raw token is encrypted before durable write and never returned by an `auth-core` use case or client-facing DTO. |
| AC-3.2 | Decryption/use is allowed only by an injected server adapter after local account/session/capability checks. |
| AC-3.3 | Disconnect, policy revoke, account deletion and key rotation prevent further plaintext use and produce auditable redacted events. |
| AC-3.4 | Vault/key-store failure returns typed unavailable/redacted state; no in-memory/plaintext/browser fallback occurs. |

### US-4 — RICIS trust non-promotion

> As a RICIS user, I need authentication and host-management configuration to remain separate from mathematical proof truth, so operational access cannot mislabel a result as verified.

| ID | Acceptance criterion |
|---|---|
| AC-4.1 | Auth persistence, entitlement and vault public DTOs contain no `LEAN_VERIFIED`, `resolved` or proof-resolution mutation capability. |
| AC-4.2 | Host Control receives only a server-side access/fresh-auth decision and cannot receive OAuth/refresh token plaintext. |
| AC-4.3 | Any unavailable auth/vault/deployment condition returns typed failure; `RicisWasmBridge.evaluate()` remains unchanged and Core-first. |

## 7. Required external resources and localisation

User-visible text, consent wording, cookie/feature recovery messages and audit display labels must be resolved from external culture resources. No hardcoded Russian/English policy prose may be emitted by library domain/application code.

| Resource group | Required resource-key family | Example semantics, not literal UI text |
|---|---|---|
| Feature decision | `auth.feature.host_manage.*` | allowed, authentication required, entitlement required, fresh-auth required, server unavailable. |
| Session recovery | `auth.session.*` | expired, revoked, signed out, renewal required. |
| Consent/vault recovery | `auth.service_connection.*` | consent required, connection unavailable, token access denied/revoked. |
| Audit presentation | `auth.audit.*` | safe action/outcome labels; no secret interpolation. |

Resources must provide the project coverage cultures: `en-US`, `fr-CA`, `de-DE`, `hi-IN`, `ms-MY`. Domain status codes remain locale-neutral and serializable.

## 8. Data classification and retention constraints

| Record | Required durable fields | Prohibited fields | Lifecycle |
|---|---|---|---|
| Account | Opaque local ID, timestamps, lifecycle status. | Raw OAuth profile/token, inferred entitlement. | Retention/deletion policy, then irreversible deletion/tombstone by policy. |
| External identity | Provider kind, provider subject, AccountId, lifecycle. | Password, access/refresh token, raw profile claim dump. | Unlink/account deletion. |
| Authorization attempt | State hash/reference, nonce/PKCE protected data, expiry, consumed/revoked timestamps. | Plain state/PKCE in logs or DTO. | One use/short TTL, then delete or tombstone audit metadata. |
| Session | Opaque reference hash, AccountId, expiry, issued/revoked/session-version metadata. | Browser-readable identity token or provider token. | Expire, logout, account/security revoke. |
| Consent | Account/provider/purpose/policy version/field set/timestamps. | Broader profile data. | Explicit revoke, policy invalidation, account deletion. |
| Passkey | Credential ID, public key, counter, transport/metadata. | Private key, biometric, assertion secret. | Removal/account deletion. |
| Token vault record | Opaque reference, encrypted ciphertext, key ID/version, capability scope, lifecycle. | Plain token in durable primary database/audit. | Disconnect/revoke/expiry/key rotation/deletion. |
| Entitlement grant | AccountId, exact entitlement, grant/revoke/policy/audit references. | Email-derived or provider-derived allow flag. | Explicit grant/revoke/account deletion. |

## 9. Risks, dependencies and migration order

| Risk/dependency | Required treatment |
|---|---|
| Database and transaction semantics are not selected | Architecture must use ports and require atomic unique/conditional mutations; no `Map` persistence labelled production. |
| KMS/key-management provider is not selected | Architecture must define an injected key-protection port; implementation must fail closed until a server key provider is configured. |
| Live identity/service credentials are absent | No provider adapter is activated; this increment must remain test-double/durable-adapter ready. |
| Static GitHub Pages deployment | Auth/host-management returns `server_capability_unavailable`; it does not begin a browser OAuth/vault flow. |
| Existing public `auth-core` ports | No deletion/rename of public contract members without user approval; additions require direct regression tests. |
| Host Control P0.1 | It consumes access/fresh-auth decision only after this contract is approved and implemented. |
| Security audit/backup/retention policy | Must be explicitly chosen before production data is retained. |

### Proposed dependency order

1. **G2:** Define immutable value objects/ports for protected persistence, token encryption, local entitlement decision and safe cookie/session adapter.
2. **G3:** Write direct adversarial tests: atomic replay race, session revoke, entitlement bypass, stale policy, cross-account token reference, ciphertext tamper, decryption/key failure, static-host, audit redaction and Core non-promotion.
3. **G4.1:** Implement deterministic/in-memory contract adapters and a migration-safe repository test harness; no production provider/credential.
4. **G4.2:** After deployment/key-management decision, implement one selected durable store and authenticated-encryption/key-protector adapter with migration/recovery tests.
5. **G4.3:** Compose Host Control P0.1 server feature-decision endpoint, then separately approve its Express/UI integration.

## 10. Time-box and completion definition

| Increment | Estimate | Dependency |
|---|---:|---|
| G2 durable contracts | 2 hours | Explicit approval of this Step 1. |
| G3 adversarial QA specification/tests | 2 hours | Approved G2. |
| G4.1 deterministic adapter baseline | 2 hours | Approved G3. |
| G4.2 one durable store + key-protector adapter | 4–6 hours | Server deployment/database/KMS decision. |
| G4.3 Host Control P0.1 composition | 2–4 hours | G4.2 plus Host Control server decision. |

**Gate-1 completion criterion:** this document explicitly separates durable server security facts from future deployment choices, names every secret/authorization boundary, preserves Core-first trust isolation, and defines testable acceptance criteria. No implementation begins before the user approves it.

## References

[1]: [RFC 9700 — OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/info/rfc9700/) — authorization-code/PKCE, redirect, token replay and least-privilege guidance.
[2]: [RFC 8705 — OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens](https://datatracker.ietf.org/doc/html/rfc8705) — proof-of-possession and certificate-bound access context.
[3]: [Ricis.Auth Step 2 architecture](../01-architecture/SPRINT_AUTH_LIBRARY_STEP2_ARCHITECTURE.md) — current server persistence/session/token-vault boundary.
[4]: [Host Control Step 1 business/security specification](./SPRINT_HOST_CONTROL_PLANE_STEP1_BUSINESS_SPEC.md) — Host Control P0.1 server-side entitlement/fresh-auth consumer contract.
[5]: [Strict Development Rules](../06-canonical-template/STRICT_DEVELOPMENT_RULES.md) — G1–G4, Core-first and no-secret rules.
