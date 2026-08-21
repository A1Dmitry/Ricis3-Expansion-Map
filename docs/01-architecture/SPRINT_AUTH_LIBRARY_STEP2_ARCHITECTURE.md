# Ricis.Auth — шаг 2: архитектура отдельной библиотеки авторизации

**Статус:** `APPROVED — отдельный private repository Ricis.Auth создан; implementation contracts and QA work начаты там. Этот документ не подтверждает production provider configuration, secrets, deployment, token persistence или интеграцию Ricis3-Expansion-Map.`
**Вход:** согласованная бизнес-спецификация [`SPRINT_OAUTH_STEP1_BUSINESS_SPEC.md`](../02-sprints/SPRINT_OAUTH_STEP1_BUSINESS_SPEC.md).
**Выход шага:** самостоятельная TypeScript library architecture, её публичные domain contracts и integration seams. Здесь нет provider secrets, HTTP callbacks, database schema migrations, runtime registration, package installation или изменения `Ricis3-Expansion-Map`.

## 1. Решение: один отдельный repository, два publishable packages

Создаётся отдельный private repository **`A1Dmitry/Ricis.Auth`** с npm workspace. Такой boundary отделяет reusable security domain от RICIS proof/map UI, не заставляет browser bundle содержать server credentials и исключает копирование OAuth logic между текущими и будущими проектами.

| Package | Роль | Что может содержать | Что принципиально не содержит |
|---|---|---|---|
| `@ricis/auth-core` | Framework-neutral DDD domain, application use cases, ports и serializable DTO. | Value objects, state machines, interfaces repositories/gateways, generic OIDC flow contracts, consent policy, passkey ceremony contracts. | Express, `fetch`, Node crypto, browser WebAuthn calls, `localStorage`, cookies, client secrets, provider URLs с credentials. |
| `@ricis/auth-node` | Server-side adapters и connectors, зависящие от `@ricis/auth-core`. | Node crypto/randomness, durable encrypted repositories, OIDC discovery/JWKS/code exchange, WebAuthn assertion verification, secure session cookie adapter. | React state, UI texts, client-side token storage, biometric data, RICIS proof calculations. |

`Ricis3-Expansion-Map` остаётся application composition root. Его Express server создаёт adapters и injects их в use cases. React UI знает только request/response DTO endpoints и **не** импортирует token vault, provider client secret, raw OAuth claim или private passkey key.

```mermaid
flowchart LR
    UI[React UI] -->|public DTO only| API[RICIS Express composition root]
    API -->|inject ports/adapters| APP[@ricis/auth-core\nApplication use cases]
    APP --> DOMAIN[DDD domain\nidentity · consent · session · passkey]
    APP --> PORTS[Ports]
    PORTS --> NODE[@ricis/auth-node\nOIDC · WebAuthn · secure storage]
    NODE --> GOOGLE[Google OIDC]
    NODE --> TELEGRAM[Telegram OIDC]
    NODE --> ORCID[ORCID OIDC]
    NODE --> MANUS[Manus OAuth connection]
    NODE --> ZENODO[Zenodo service connection]
    NODE --> AUTHN[Platform authenticator\nFace ID-capable passkey]
```

## 2. Bounded contexts и ubiquitous language

| Bounded context | Aggregate / value objects | Инвариант |
|---|---|---|
| **Identity** | `Account`, `ExternalIdentity`, `ProviderSubject`, `ProviderKind`. | Local `AccountId` является единственным application principal. `provider + subject` уникальны; email, display name, username и locale не являются identity key. |
| **Authorization Ceremony** | `AuthorizationAttempt`, `OAuthState`, `PkceVerifier`, `OidcNonce`, `ReturnPath`. | Attempt одноразовый, limited TTL, привязан к provider и intended action; callback может быть потреблён только ровно один раз. |
| **Session** | `AuthenticatedSession`, `SessionId`, `SessionExpiry`. | Session создаётся только после verified identity / verified passkey assertion; browser знает только opaque secure cookie. |
| **Document-data Consent** | `DocumentPrefillConsent`, `PrefillField`, `DocumentPurpose`, `ConsentVersion`. | Sign-in не равен data retrieval. Consent field-scoped, revocable и создаёт лишь human-reviewable document draft. |
| **Passkey** | `PasskeyCredential`, `WebAuthnChallenge`, `RelyingParty`. | Server stores public key/metadata only; private key and biometric verification never cross device boundary. |
| **Delegated Service Access** | `ServiceConnection`, `GrantedCapability`, `EncryptedTokenReference`. | Manus/Zenodo connection не становятся application identity или report prefill permission. Token is server-only and capability-bound. |

> **RICIS boundary:** identity, consent and login statuses никогда не доказывают `L1_IDENTITY`, SP2/SP4, A1/A4/A6, mathematical claim либо Lean kernel trust. Они существуют только на perimeter access layer и не могут изменять proof graph.

## 3. SOLID / DRY dependency rules

### 3.1. Dependency inversion

`auth-core` объявляет ports и use cases. `auth-node` implements ports. Express composition root создаёт specific adapter instances. Ни use case, ни domain entity не импортируют Express, Node `process.env`, database driver, provider SDK, `window`, `navigator`, React, Zustand, IndexedDB или `localStorage`.

```ts
// Packages/auth-core/src/ports.ts — architectural contract only
export interface IOidcConnector {
  readonly provider: OidcIdentityProvider;
  start(input: StartOidcAuthorization): Promise<AuthorizationRedirect>;
  complete(input: CompleteOidcAuthorization): Promise<VerifiedExternalIdentity>;
}

export interface IPasskeyConnector {
  beginRegistration(input: BeginPasskeyRegistration): Promise<PasskeyCreationOptions>;
  completeRegistration(input: CompletePasskeyRegistration): Promise<RegisteredPasskey>;
  beginAuthentication(input: BeginPasskeyAuthentication): Promise<PasskeyRequestOptions>;
  completeAuthentication(input: CompletePasskeyAuthentication): Promise<VerifiedPasskeyAssertion>;
}

export interface IAuthorizationAttemptRepository {
  create(attempt: AuthorizationAttempt): Promise<void>;
  consumeOnce(attemptId: AuthorizationAttemptId, at: Date): Promise<AuthorizationAttempt>;
}

export interface IExternalIdentityRepository {
  findByProviderSubject(provider: IdentityProvider, subject: ProviderSubject): Promise<ExternalIdentity | null>;
  link(identity: ExternalIdentity): Promise<void>;
  unlink(identityId: ExternalIdentityId): Promise<void>;
}

export interface IDocumentPrefillConsentRepository {
  grant(consent: DocumentPrefillConsent): Promise<void>;
  findActive(input: FindActiveConsent): Promise<DocumentPrefillConsent | null>;
  revoke(consentId: DocumentPrefillConsentId, at: Date): Promise<void>;
}
```

### 3.2. Single responsibility and open extension

`GenericOidcConnector` owns common protocol mechanics: discovery/cache, exact redirect validation, `state`, PKCE S256, nonce, authorization-code exchange, JWKS signature/issuer/audience/expiry validation and claims normalization. Provider classes only supply immutable metadata and a profile mapping policy. No `if (provider === ...)` cascade may be placed in controllers or use cases.

`PasskeyConnector` owns only WebAuthn ceremony verification. The device/operating system owns Face ID, Touch ID, Windows Hello, PIN and private-key use. `DocumentPrefillService` consumes an explicitly approved field policy and cannot reach any OAuth connector without an active matching consent. `SessionService` creates/revokes opaque sessions but never decides user profile fields.

| Extension | Required abstraction | Prohibited shortcut |
|---|---|---|
| New OIDC identity provider | `OidcProviderDefinition` + `ClaimProjectionPolicy`; reuse generic connector. | Copy Google callback/controller for the next provider. |
| New report prefill field | `PrefillFieldPolicy` version and explicit consent UI text. | Read all claims and serialize an arbitrary profile object into a document. |
| New service API connection | `IServiceConnectionConnector` with capability set distinct from `IIdentityConnector`. | Treat access token or service account nickname as sign-in identity. |
| New authenticator type | Existing `IPasskeyConnector`; RP and user-verification configuration. | A Face ID SDK, biometric upload or server-side biometric verification. |

## 4. Provider connector taxonomy

All provider configuration is supplied to `@ricis/auth-node` by composition root from **server-only** environment variables. `@ricis/auth-core` contains no secret values, production URL or browser-facing raw claims.

| Connector | Interface role | Common adapter | Capability | P0 allowed use | Explicitly excluded |
|---|---|---|---|---|---|
| Google | `IIdentityConnector` | `GenericOidcConnector` | `identity` | Login with normalized provider `sub`; optional field-level document prefill after consent. | Google APIs, Drive/Calendar scopes, UI-stored refresh token. |
| Telegram | `IIdentityConnector` | `GenericOidcConnector` | `identity` | Login with OIDC discovery/JWKS and `openid profile`. | `phone`, `telegram:bot_access`, legacy widget, Bot API side effects. |
| ORCID | `IIdentityConnector` | `GenericOidcConnector` | `identity`, `research_identity` | Authenticated ORCID iD; optional source-labelled prefill after consent. | `/read-limited`, member/write actions, scraping, academic proof inference. |
| Manus | `IServiceConnectionConnector` | `GenericOAuthCodeConnector` | `manus_delegated_api` | Explicit Connect Manus once Team/Open App credentials/minimal scopes are configured. | General public identity provider, broad task/connector access by default. |
| Zenodo | `IServiceConnectionConnector` | `GenericOAuthCodeConnector` **only after discovery gate**. | `zenodo_deposit` | Future explicit service connection after official authorization-code registration proof. | Sign-in provider, PAT collection, deposit/upload/publish action in P0. |
| Face ID-capable passkey | `IPasskeyConnector` | `WebAuthnPasskeyConnector` | `passwordless_identity`, `step_up` | Passkey sign-in on a compatible platform authenticator. | Face data, biometric template/result, private key, Apple Account data. |

### 4.1. Public provider configuration types

```ts
export type IdentityProvider = 'google' | 'telegram' | 'orcid';
export type ServiceProvider = 'manus' | 'zenodo';
export type AuthenticationProvider = IdentityProvider | 'passkey';

export interface OidcProviderDefinition {
  readonly provider: IdentityProvider;
  readonly discoveryUrl: string;
  readonly clientId: string;
  readonly redirectUri: ExactRedirectUri;
  readonly scopes: readonly string[];
  readonly claimProjection: ClaimProjectionPolicy;
}

export interface ServiceProviderDefinition {
  readonly provider: ServiceProvider;
  readonly authorizationEndpoint: HttpsUri;
  readonly tokenEndpoint: HttpsUri;
  readonly clientId: string;
  readonly redirectUri: ExactRedirectUri;
  readonly allowedCapabilities: readonly ServiceCapability[];
}

export interface RelyingPartyDefinition {
  readonly id: RelyingPartyId;
  readonly name: string;
  readonly allowedOrigins: readonly HttpsUri[];
  readonly userVerification: 'required';
}
```

Client secret is deliberately absent from all public contracts. It is represented only by a node adapter constructor input resolved at server process startup; no DTO, log, return value, exception or configuration endpoint may reveal it.

## 5. Application use cases and DTO seams

The following use cases are the library public application facade. They return discriminated, serializable result unions. Expected denials (`expired`, `replayed`, `unlinked`, `consent_required`, `static_host`, `provider_unavailable`) are statuses, not thrown raw provider exceptions. Unexpected faults are redacted at the adapter boundary.

| Use case | Command | Result | Key invariant |
|---|---|---|---|
| Start identity login | `StartIdentityLoginCommand` | `AuthorizationRedirect` | Creates one `AuthorizationAttempt` with state/nonce/PKCE and allowed return path. |
| Complete identity callback | `CompleteIdentityLoginCommand` | `LoginCompleted` / `LoginRejected` | Atomic attempt consumption precedes session creation; verified provider subject only. |
| Link identity | `LinkIdentityCommand` | `IdentityLinked` / `IdentityLinkRejected` | Requires existing fresh local session; no email matching. |
| Connect service | `StartServiceConnectionCommand` | `AuthorizationRedirect` / `ConnectionUnavailable` | Manus/Zenodo connections remain capability-scoped and distinct from login. |
| Create prefill consent | `GrantDocumentPrefillConsentCommand` | `ConsentGranted` / `ConsentRejected` | Requires active session, concrete provider, document purpose, policy version and approved field list. |
| Create document draft prefill | `CreateDocumentPrefillCommand` | `PrefilledDraft` / `ManualEntryRequired` | Requires matching active consent; returned fields carry `UserConfirmedProviderPrefill` source label. |
| Revoke consent | `RevokeDocumentPrefillConsentCommand` | `ConsentRevoked` | Prevents future provider reads immediately. |
| Register passkey | `Begin/CompletePasskeyRegistrationCommand` | `PasskeyCreationOptions` / `PasskeyRegistered` | Fresh authenticated session + UV required; only public credential stored. |
| Authenticate passkey | `Begin/CompletePasskeyAuthenticationCommand` | `PasskeyRequestOptions` / `LoginCompleted` | One-time challenge, RP ID/origin/signature/UV verification. |
| Disconnect provider / delete passkey | `DisconnectIdentityCommand`, `RemovePasskeyCommand` | `IdentityDisconnected`, `PasskeyRemoved` | Capability/credential is no longer usable; service token revocation is attempted separately. |

```ts
export type DocumentPrefillField = 'display_name' | 'orcid_id';
export type DocumentFieldSource = 'ManualEntry' | 'UserConfirmedProviderPrefill';

export interface GrantDocumentPrefillConsentCommand {
  readonly accountId: AccountId;
  readonly provider: IdentityProvider;
  readonly documentPurpose: DocumentPurpose;
  readonly policyVersion: ConsentPolicyVersion;
  readonly fields: readonly DocumentPrefillField[];
  readonly confirmedAt: Instant;
}

export interface PrefilledDocumentField {
  readonly field: DocumentPrefillField;
  readonly value: string;
  readonly source: 'UserConfirmedProviderPrefill';
  readonly reviewRequired: true;
}

export type CreateDocumentPrefillResult =
  | { readonly kind: 'prefilled'; readonly fields: readonly PrefilledDocumentField[] }
  | { readonly kind: 'manual_entry_required'; readonly reason: 'consent_required' | 'field_not_available' | 'provider_not_linked' | 'consent_revoked' };
```

## 6. Persistence, session, static host and revocation boundaries

Existing client IndexedDB/localStorage patterns are **not** usable for OAuth attempts, token vault, session secret, passkey verification state or consent audit integrity. GitHub Pages has no Express backend, and the current typed API client already recognizes a static host. Therefore production auth needs a same-origin HTTPS server deployment with durable server-side storage and a managed encryption key; its exact database/key manager will be selected during the implementation deployment decision, not silently emulated in browser storage.

| Data class | Server persistence | Browser visibility | Retention/lifecycle |
|---|---|---|---|
| OAuth state / nonce / PKCE verifier / WebAuthn challenge | Ephemeral encrypted or protected server record. | Never. | One use, short TTL, atomically consumed. |
| Local session | Opaque server record + `HttpOnly; Secure; SameSite=Lax` cookie. | Cookie only; no bearer token JavaScript access. | Short TTL, logout/revocation invalidates. |
| External identity | `provider + providerSubject + AccountId` only. | Sanitized display outcome only. | User unlink/account deletion. |
| Consent | Provider, document purpose/version, allowed field names, grant/revoke timestamps. | Consent summary only. | Revocation, logout/session invalidation or policy invalidation. |
| Provider token | Encrypted server-only vault record referenced by opaque ID. | Never. | Only for separately approved service connection; revocation/unlink/deletion. |
| Passkey credential | Credential ID, public key, counter/metadata, AccountId. | Registration/authentication options/assertion only. | Credential removal/account deletion. |
| Face data / biometric template / passkey private key | Never. | Never. | Does not enter application system. |

## 7. Map integration plan

`Ricis3-Expansion-Map` consumes `@ricis/auth-core` as a workspace/dependency and adds a small application-specific composition module later. No OAuth provider logic is added to `src/model`, proof/Lean modules, Zustand stores or UI before the library use cases and tests exist.

| Integration seam | Future target | Library dependency | No-go rule |
|---|---|---|---|
| Express endpoints | `/api/auth/*`, `/api/passkeys/*`, `/api/document-prefill/*` | `@ricis/auth-node` adapter composition + `@ricis/auth-core` facade. | Never call provider directly from React. |
| React UI | Sign in, link identity, passkey settings, consent dialog, prefilled document review. | Serialised DTOs only. | No provider secret/token/raw claims in Zustand or props. |
| Locale-aware reports | Existing future report service. | `PrefilledDocumentField` source label and explicit requested UI culture. | OAuth locale/country claim cannot determine report language. |
| Academic report/Lean | Existing reporting/proof pipeline. | None, except manually approved author data via separate contract. | No automatic external identity → author SEO/proof metadata mapping. |

## 8. Required implementation decisions and migration order

Implementation begins only after an explicit `ОК` for this document. The architecture makes the security/deployment dependencies visible rather than creating browser-only mock login.

1. Create private `A1Dmitry/Ricis.Auth` workspace repository; TypeScript strict settings match `Ricis3-Expansion-Map` (`strict`, `strictNullChecks`, target `noUncheckedIndexedAccess`).
2. Add `@ricis/auth-core` types, value objects, ports and application facade only; no HTTP/provider libraries yet.
3. Add adversarial tests against all public use cases before adapter implementation: state replay, wrong provider/issuer/audience, exact redirect mismatch, expired challenge, passkey wrong RP/origin/UV, email collision, consent bypass/revocation, secret redaction, and static-host denial.
4. Add `@ricis/auth-node` generic OIDC and WebAuthn adapters, then provider definition instances for Google, Telegram and ORCID. Implement Manus as capability-scoped service connector; Zenodo stays feature-gated until official authorization-code registration evidence is supplied.
5. Add a deployment-owned durable storage/token vault/session adapter, configure production callback HTTPS domain and only then integrate Express endpoints/UI.
6. Run package lint/tests/build/audit plus Ricis3 regression suite; publish no provider config or secret. Every new public method has direct tests; version and README/releases are synchronized.

## 9. Architecture acceptance criteria

| ID | Criterion |
|---|---|
| AR-01 | `@ricis/auth-core` compiles without Node, Express, React, browser or provider SDK imports. |
| AR-02 | Google, Telegram and ORCID code paths share one generic OIDC protocol implementation; only definition/claim policy differs. |
| AR-03 | Manus and Zenodo satisfy a separate service-connection interface and cannot be passed to `StartIdentityLoginCommand`. |
| AR-04 | Passkey flow verifies WebAuthn server-side and has no biometric field in any DTO, persistence port, event or log contract. |
| AR-05 | Prefill requires a matching active consent grant and produces manually reviewable fields with source label, never report/publisher/proof side effects. |
| AR-06 | All token/secret-bearing types are node adapter internals, cannot cross `auth-core` API boundaries and are omitted/redacted from errors. |
| AR-07 | Static browser hosting returns a typed `server_auth_unavailable` status rather than beginning a client-side OAuth or storing secrets. |
| AR-08 | No identity, consent or service connection changes Lean trust, RICIS axiom status, academic claim status or locale selection order. |

## References

[1]: https://developers.google.com/identity/openid-connect/openid-connect "Google OpenID Connect"
[2]: https://core.telegram.org/widgets/login "Telegram Login and OpenID Connect"
[3]: https://info.orcid.org/documentation/api-tutorials/api-tutorial-get-and-authenticated-orcid-id/ "ORCID: Get an Authenticated ORCID iD"
[4]: https://open.manus.ai/docs/v2/open-app "Manus Open App OAuth 2.0"
[5]: https://developers.zenodo.org/ "Zenodo REST API and Authentication"
[6]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API "MDN: Web Authentication API"
[7]: https://support.apple.com/en-us/102195 "Apple: About the security of passkeys"
