# RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 — Metadata-Only Account Ledger — G2 Architecture

**Статус:** `G2_COMPLETE_DOCUMENT_ONLY`
**Дата:** 2026-08-26 (GMT+3)
**Published baseline:** `291d4a0b6f9a16a28b2ed8c358bedb9e1d6c6176` (`main`, `v0.4.56`)
**G1 source:** `RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01_STEP1_BUSINESS_SPEC.md`
**Gate scope:** Architecture/contracts only. No production/test code, identity provider, OAuth configuration, database, server route, browser storage, export/delete UI, account/session, external call, Lean/Core/AI/provider execution, versioning, commit or publication is authorized by this document.

## 1. Architecture decision

The selected B2-A ledger is a future **server-owned, metadata-only bounded context** with authenticated account/tenant ownership. It is intentionally not an extension of `mapStore`, generic map persistence or B1 React local state. It receives only a caller-supplied exact source-lock reference and stores only the closed receipt metadata defined below.

> The account ledger is a lifecycle/navigation capability. It is not a proof store, evidence ledger, Lean verifier, Core service, source archive, consent substitute, trust owner, node-state writer or RICIS evaluator.

The future deployment requires a server-side account and durable data environment. The current static application contains no such runtime, and this G2 does not select a vendor, provision infrastructure or add an adapter.

## 2. DDD bounded contexts and one-way dependencies

| Context | Owns | May receive | Must not receive or mutate |
|---|---|---|---|
| **Account Access** | Authentication result, account/tenant identity and authorization claim. | Provider-neutral authenticated principal from an injected adapter. | Lean/TeX bytes, `Proof`, `externalLean` mutation, source identity creation, trust/state decision. |
| **Passport Receipt Ledger** | Closed receipt metadata, lifecycle state, owner-scoped audit/tombstone semantics. | Authenticated principal, explicit receipt command, canonical source-lock reference. | Raw source/proof/kernel/provider payload, map persistence, node/axiom/trust state. |
| **Source Provenance Read Port** | Existing canonical source-lock lookup/read result. | `nodeId + sourceFingerprint` only. | Receipt/account records, source rewrite, re-hash, source capture or display. |
| **Existing Proof Authority** | Authoritative trust/resolution under published policy. | Nothing from receipt ledger. | Receipt lifecycle or account authorization. |
| **B1 Ephemeral UI** | In-memory reference display. | Existing source-lock metadata and future receipt read model only when separately composed. | Account command, storage write, lifecycle mutation or authorization decision. |

All paths point inward toward the receipt application service. There is no callback, event or writer from Account Access or Passport Receipt Ledger into `mapStore`, proof policy, source capture, Lean verification, Core bridge or B1 session.

## 3. Provider-neutral ports

The application layer depends only on narrow injected ports. These names are contract placeholders; no implementation is added in G2.

```ts
type AuthenticatedPrincipal = Readonly<{
  accountId: string;
  tenantId: string;
  authenticationEpoch: string;
}>;

interface PassportAccountAccessPort {
  requireAuthenticatedPrincipal(): Promise<AuthenticatedPrincipal | 'UNAVAILABLE' | 'UNAUTHORIZED'>;
}

interface SourceLockReferenceReadPort {
  readLockedReference(input: Readonly<{
    nodeId: string;
    sourceFingerprint: string;
  }>): Promise<LockedSourceReference | 'NOT_FOUND' | 'MISMATCH' | 'UNAVAILABLE'>;
}

interface PassportReceiptRepository {
  createIfAbsent(receipt: AccountOwnedPassportReceipt): Promise<'CREATED' | 'IDEMPOTENT_REPLAY' | 'CONFLICT' | 'UNAVAILABLE'>;
  listOwned(scope: OwnerScope): Promise<ReadonlyArray<AccountOwnedPassportReceipt> | 'UNAVAILABLE'>;
  readOwned(scope: OwnerScope, receiptId: string): Promise<AccountOwnedPassportReceipt | 'NOT_FOUND' | 'UNAVAILABLE'>;
  transitionOwned(input: ReceiptLifecycleTransition): Promise<'APPLIED' | 'IDEMPOTENT_REPLAY' | 'CONFLICT' | 'NOT_FOUND' | 'UNAVAILABLE'>;
}

interface PassportReceiptIdPort {
  issue(): string;
}

interface PassportLifecycleClock {
  now(): string;
}
```

No port accepts raw source, `latex`, `proofLatex`, `currentProof`, source bytes, kernel output, provider transcript, access token, externally supplied tenant ID, node state target, trust decision, URL, command, upload or arbitrary JSON.

## 4. Closed DTOs and validation

### 4.1 Authenticated owner scope

```ts
type OwnerScope = Readonly<{
  accountId: string;
  tenantId: string;
}>;
```

`OwnerScope` originates only from `PassportAccountAccessPort`. The client may request a receipt operation but cannot supply or override account/tenant identifiers. A missing, malformed or unavailable principal returns a typed non-authoritative error and must not fall back to anonymous, browser-local or global scope.

### 4.2 Provenance read result

```ts
type LockedSourceReference = Readonly<{
  nodeId: string;
  sourceFingerprint: string;
  sourceLocked: true;
  submittedAt: string;
  displayedTrustStatus: 'REQUIRES_CORE_LEAN' | 'LEAN_VERIFIED' | 'TRUSTED_AXIOM' | 'REJECTED';
}>;
```

The read port validates identity equality and source lock before receipt creation. It returns no source body or proof object. An existing status label is presentation metadata only and does not cause verification, trust elevation or workflow transition.

### 4.3 Receipt aggregate and command algebra

```ts
type AccountOwnedPassportReceipt = Readonly<{
  receiptId: string;
  receiptVersion: 1;
  tenantId: string;
  accountId: string;
  nodeId: string;
  sourceFingerprint: string;
  sourceLocked: true;
  submittedAt: string;
  displayedTrustStatus: 'REQUIRES_CORE_LEAN' | 'LEAN_VERIFIED' | 'TRUSTED_AXIOM' | 'REJECTED';
  disclosureTier: 'REFERENCE_ONLY';
  retentionClass: 'ACCOUNT_MANAGED';
  createdAt: string;
  reviewAt: string;
  lifecycle: 'ACTIVE' | 'REVOKED' | 'DELETED';
}>;

type CreateReceiptCommand = Readonly<{
  idempotencyKey: string;
  nodeId: string;
  sourceFingerprint: string;
  requestedDisclosureTier: 'REFERENCE_ONLY';
}>;

type RevokeReceiptCommand = Readonly<{
  receiptId: string;
  idempotencyKey: string;
}>;

type DeleteReceiptCommand = Readonly<{
  receiptId: string;
  idempotencyKey: string;
  confirmed: true;
}>;
```

The command algebra is closed. Additional fields are rejected. `idempotencyKey` is opaque request correlation, not source-derived identity and not a permission grant. The system may use it only inside the owner-scoped receipt context to distinguish exact replay from conflict.

## 5. Application service flows

### 5.1 Create receipt

1. `PassportAccountAccessPort` resolves an authenticated principal, otherwise returns `AUTH_UNAVAILABLE` or `UNAUTHORIZED`.
2. The service validates the closed command and obtains a locked provenance reference from `SourceLockReferenceReadPort`.
3. The service requires exact `nodeId`/fingerprint equality and literal source lock. `NOT_FOUND`, `MISMATCH`, malformed data or unavailable source read fail closed.
4. The service issues a receipt ID, writes account/tenant from the authenticated principal, copies only allowed locked-reference metadata, assigns `REFERENCE_ONLY`, `ACCOUNT_MANAGED`, `ACTIVE`, `createdAt` and policy-derived `reviewAt`.
5. `PassportReceiptRepository.createIfAbsent()` executes one owner-scoped idempotent write. Its result is a receipt outcome only; no source/proof/state/trust/axiom event is emitted.

### 5.2 List/read receipt

The service first derives owner scope from the principal. Repository queries always include both account and tenant scope. A missing or cross-scope receipt is returned as a non-enumerating `NOT_FOUND`; no receipt existence leak, account discovery or source lookup occurs.

### 5.3 Export receipt metadata

Export is a separate explicit application command. It resolves the principal, reads only owned active/revoked metadata according to policy and serializes a closed export DTO. It is not network delivery, email, connector, clipboard, browser download or provider upload. Those transports, if ever desired, require a separate G1/G2.

### 5.4 Revoke and delete

A lifecycle transition is owner-scoped, idempotent and append-only at the receipt lifecycle level. `REVOKED` denies future normal receipt use while retaining the policy-defined audit/tombstone record. `DELETED` is a terminal receipt lifecycle outcome with a documented tombstone decision. Neither state calls any source/proof/map/trust writer, and neither deletes or alters existing source provenance.

## 6. Lifecycle state machine

| From | Command | To | Required conditions | Prohibited effect |
|---|---|---|---|---|
| — | create | `ACTIVE` | Authenticated owner, exact locked reference, closed command, idempotency key. | Source capture/copy, trust/state mutation. |
| `ACTIVE` | revoke | `REVOKED` | Owner/tenant match and idempotency control. | Source/proof/map deletion or verification. |
| `ACTIVE` | delete | `DELETED` | Owner/tenant match, explicit confirmation, idempotency control. | Delete original proof/source/history. |
| `REVOKED` | delete | `DELETED` | Owner/tenant match and policy-defined tombstone. | Restore/invent source data. |
| `DELETED` | any lifecycle mutation | Reject. | No terminal receipt resurrection. | Hidden replacement record. |

A future retention worker, if separately approved, may only identify `reviewAt` eligibility and return a typed review-required outcome. It cannot autonomously delete, revoke, export or modify a receipt in G2 design.

## 7. Data retention and export/deletion policy boundary

G2 establishes `ACCOUNT_MANAGED` as a named policy class but deliberately does not invent a retention duration. Before G3, the owner must approve an explicit policy value and a legal/operational basis for it. The architecture nevertheless requires the following invariants:

| Policy concern | Required architecture rule |
|---|---|
| Retention duration | Persisted explicit review timestamp; no implicit unlimited default. |
| Owner visibility | Owner-scoped receipt list/read only; no public URL or fuzzy lookup. |
| Export | Closed metadata-only DTO; explicit owner command; no automated transmission. |
| Revoke | Lifecycle transition preserves provenance independence and prevents regular use. |
| Delete | Terminal receipt state with policy-defined tombstone/minimal audit only; original proof/source unaffected. |
| Account deletion | Requires a separate account-lifecycle policy; it cannot silently bypass receipt review/deletion rules. |
| Storage outage | Typed unavailable outcome; no browser-local fallback replica, no partial write. |

## 8. Security controls

The G3 test matrix must cover: tenant isolation, account mismatch, client-supplied owner substitution, unauthenticated access, auth unavailable, receipt-ID enumeration, idempotency replay/conflict, lifecycle race, source-lock mismatch, malformed/extra metadata, source-shaped payload, cross-tenant export, deleted receipt resurrection, export transport absence, storage outage and no write to proof/state/trust/axiom boundaries.

Architecture must make `tenantId` and `accountId` part of repository keys/indexes and authorization predicates; filtering solely after broad read is forbidden. Repository error messages must not reveal whether a receipt exists outside the authenticated scope.

## 9. Prohibited dependencies and integration seams

The future domain/application contracts may import only local closed types and injected ports. They must not import React, Zustand/mapStore, `persistence.ts`, IndexedDB/localStorage, `Proof`, raw Lean/TeX source, browser APIs, API clients, provider SDKs, Core/WASM, Lean toolchain, `AuthoritativeProofStatePolicy`, external verification, agent/model modules, crypto secrets or third-party auth SDKs.

A later server composition adapter may implement `PassportAccountAccessPort`, `PassportReceiptRepository`, ID and clock ports only after a separately approved implementation gate. It must be tested independently and cannot expose a generic proxy, raw record dump or browser-trusted identity assertion.

## 10. G3 entry specification

G3 may create **test-only valid-red artefacts** after this architecture is approved. The proposed inventory is limited to:

| Test file family | Purpose |
|---|---|
| `passportAccountOwnership.domain.test.ts` | Closed DTO validation, owner scope, lifecycle state machine and no-authority outcomes. |
| `passportAccountOwnership.application.test.ts` | Create/read/list/revoke/delete flows with injected fake ports, idempotency and failure closure. |
| `passportAccountOwnership.topology.test.ts` | Zero forbidden import/runtime-token proof for domain/application layer. |
| `passportAccountOwnership.tenantIsolation.test.ts` | Cross-tenant/account rejection, non-enumeration and export boundary. |

The red baseline may fail only because the future pure domain/application modules are absent. It must not add storage, auth provider, server, browser persistence, raw source fixture, external test account, network request or actual Lean/Core/provider invocation.

## 11. Non-claims

This G2 neither authenticates any user nor stores a receipt. It does not introduce a server, database, account, token, retention duration, export/delete/revoke implementation, source transfer, network channel, Lean compiler run, Core execution, provider interaction, AI action, proof verification, state/trust/axiom decision or RICIS computation. Local future tests would be application-code evidence only and never Lean-kernel evidence.

## 12. References

[1]: `RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01_STEP1_BUSINESS_SPEC.md` — selected B2-A owner/lifecycle G1.

[2]: `RICIS-LEAN-PASSPORT-ROUTE-B2-DATA-LIFECYCLE-01_STEP1_BUSINESS_SPEC.md` — durable reference ledger decision and data-minimization rules.

[3]: Published B1 documents under `docs/01-architecture/passport/`, `docs/02-sprints/passport/` and `docs/05-evidence/architecture/passport-governance/` at `291d4a0` — source-lock, read-only session, QA and publication boundaries.

[4]: Published `src/model/types.ts`, `src/model/persistence.ts`, `src/store/mapStore.ts`, `src/leanConsent/leanEvidenceConsent.domain.ts`, `src/leanPassportProjection/leanPassportProjection.domain.ts`, `src/leanPassportSession/leanPassportSession.domain.ts` and `src/model/authoritativeProofStatePolicy.ts` at `291d4a0`.
