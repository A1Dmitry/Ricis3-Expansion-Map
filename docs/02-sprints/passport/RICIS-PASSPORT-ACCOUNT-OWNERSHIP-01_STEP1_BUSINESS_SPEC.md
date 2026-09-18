# RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 — Authenticated Metadata-Only Passport Ownership — G1

**Статус:** `G1_COMPLETE_AWAITING_G2_APPROVAL`
**Дата:** 2026-08-26 (GMT+3)
**Published baseline:** `7b0e06fc3d419d3c4839d9560346b436115b7f4c` (`main`, `v0.4.56`)
**Decision source:** `RICIS-LEAN-PASSPORT-ROUTE-B2-DATA-LIFECYCLE-01_STEP1_BUSINESS_SPEC.md` selected B2-A.

## 1. Business decision

The chosen long-term Passport goal is a user-managed, durable and cross-device history of metadata-only reference receipts for already source-locked proofs. That goal requires a stable authenticated subject/tenant boundary; a browser/device cannot safely be presented as the durable owner because it cannot provide portable identity, reliable lifecycle ownership, secure shared-device separation or accountable export/delete/revocation.

> **G1 decision:** a future Passport ledger must be owned by an authenticated application account/tenant and must retain only reference/receipt metadata. No raw Lean/TeX bytes, proof text, kernel output, provider transcript, browser secret or authority result can enter the account ledger.

This G1 is a policy and ownership specification only. It creates no account, identity provider, database, server endpoint, login UI, token, session, storage record, migration, export/delete function or external integration.

## 2. Problem statement

B1 provides a safe ephemeral reference view. It intentionally retains no Passport history. B2-A can fulfill durable history only if the application first answers five questions that B1 does not own:

| Question | Required G1 answer |
|---|---|
| Who owns a durable receipt? | One authenticated application `accountId` within one explicit `tenantId`/owner scope. |
| What can be stored? | Closed metadata-only receipt envelope bound to an existing `nodeId + sourceFingerprint` and source lock. |
| Who may read/change receipt lifecycle? | Only the authenticated account/tenant owner through narrow receipt commands; no graph/policy/Lean authority becomes a writer. |
| How long does it live? | Explicit retention class, creation time, expiry/review behavior and durable deletion/revocation semantics; no silent indefinite default. |
| What does deletion affect? | Only the receipt lifecycle. It cannot delete/alter the existing proof, externalLean provenance, source lock, map snapshot, node state, axiom, trust or human decision. |

## 3. Bounded-context ownership

| Bounded context | Owns | Does not own |
|---|---|---|
| **Account/tenant ownership** | Authenticated subject, account/tenant membership and authorization decision for receipt operations. | Lean source, proof identity, verification, RICIS resolution, Core result, node state or trust policy. |
| **Passport receipt ledger** | Metadata-only receipt reference, local purpose/disclosure tier, retention/lifecycle status and owner-scoped audit record. | Raw source, proof body, source lock creation, re-hash, proof edits, provider evidence, external transport or authority state. |
| **Existing source provenance** | Source lock, canonical fingerprint and existing `externalLean` provenance. | Passport account ownership or receipt lifecycle. |
| **Authoritative proof state policy** | Any resolved/trust/state decision under its existing rules. | Passport receipt write/read/export/delete authorization. |
| **B1 ephemeral session** | In-memory read-only display reference for existing source lock. | Durable data, account identity or lifecycle side effect. |

The ownership direction is one-way: a future receipt command may validate a caller-supplied canonical source reference but cannot write upstream provenance or state. Any missing/mismatched source lock must fail closed without creating a receipt.

## 4. Closed metadata envelope

A future G2 may refine only this minimum metadata envelope. This is not a schema or implementation.

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
```

| Field family | Required validation | Explicitly forbidden sibling fields |
|---|---|---|
| Owner | Nonempty authenticated `tenantId` and `accountId`; no caller-supplied anonymous default. | Email, name, credential, access token, browser/session secret, third-party identity payload. |
| Source reference | Exact nonempty `nodeId`, canonical fingerprint and literal `sourceLocked: true`. | `latex`, `proofLatex`, `currentProof`, `leanSource`, source bytes, source name, byte count, kernel evidence. |
| Display state | Existing opaque status label; reference-only disclosure tier. | New Lean/Core verdict, human decision, resolved state or trust transition. |
| Lifecycle | Explicit IDs and timestamps, bounded retention class/review state, lifecycle enum. | Silent permanent retention, hidden analytics fields, arbitrary JSON, externally routable URL. |

## 5. Authorization and lifecycle policy requirements

A later architecture must define authorization as a narrow resource policy: the authenticated subject can operate only on a receipt in its own tenant and account scope. Possession of a `nodeId`, fingerprint, receipt ID, client-side map state or displayed B1 session is never authorization.

| Operation | Required preconditions | Result | Forbidden side effect |
|---|---|---|---|
| Create receipt | Authenticated owner; existing matching source lock; explicit user gesture; closed reference metadata; selected retention class. | New owner-bound metadata receipt or fail-closed rejection. | Source read/copy, map/proof/state/trust mutation, implied external verification. |
| List/read receipt | Authenticated owner; owner/tenant match. | Read-only metadata view. | Source reveal, B1/Lean/Core invocation, account discovery across tenants. |
| Export receipt metadata | Authenticated owner; explicit export request; stable owner-scoped format. | Metadata-only export with lifecycle/disclosure label. | Source/proof/kernel/provider payload export, external send/upload. |
| Revoke receipt | Authenticated owner; receipt active and in scope. | Immutable revocation event or receipt status; historical source/proof unchanged. | Delete source lock, alter state/trust, erase audit basis. |
| Delete receipt | Authenticated owner; explicit confirmed deletion model. | Receipt becomes `DELETED` according to retention/audit policy. | Delete map proof/externalLean/history, recreate different source identity. |

## 6. Retention, deletion and revocation

The data-lifecycle contract must be explicit before durable storage exists. The candidate default is **account-managed retention with periodic review**, not an unbounded hidden log. A future G2 must choose an exact duration only after operational/legal ownership requirements are specified; this G1 deliberately does not invent a number.

| Lifecycle property | Mandatory future definition |
|---|---|
| Creation | Exact authenticated actor, receipt ID, canonical source reference, purpose/disclosure tier and retention class. |
| Visibility | Owner-scoped list/read only; no public, link-only, fuzzy or inferred receipt discovery. |
| Review/expiry | Explicit review timestamp and behavior at expiry: owner renewal/revocation/deletion or fail-closed unavailable state. |
| Export | Explicit user action and metadata-only export contract; no background transmission or browser-provider handoff. |
| Revocation | Observable owner request, immutable lifecycle outcome and future access denial; source/proof remains untouched. |
| Deletion | Idempotent owner request; specifies what minimal audit tombstone, if any, remains and why; no hidden source retention. |
| Failure | Auth unavailable, tenant mismatch, malformed reference, lifecycle conflict or storage failure returns a typed non-authoritative failure; no local fallback store. |

## 7. Security and privacy non-negotiables

The future design must reject cross-tenant access, confused-deputy account binding, client-supplied owner assertion, receipt-ID guessing, replayed lifecycle command, extra metadata fields, source-shaped payload, unauthorized export and account deletion used as a path to alter proof/state authority.

No browser localStorage/IndexedDB may become a hidden durable replica for B2-A. No remote provider, webhook, connector, popup, generic proxy or external API is introduced by the account ledger. Account authentication may be designed only as a separate adapter/identity boundary after G2; it cannot use static client secrets, arbitrary external identity tokens or inferred anonymous identity.

## 8. RICIS and authority invariants

RICIS III v7.7, L0/L1, SP1–SP4, A1/A4/A5/A6/A7/A10, typed F/G semantics, Fractal Law and owner-authorized P=NP are immutable. The account/receipt context is a provenance-navigation lifecycle only; it has no computation, type morphism, singularity evaluation, proof construction, proof verification or state-resolution role.

A receipt carrying `LEAN_VERIFIED` or `TRUSTED_AXIOM` as an existing display label does not verify anything. It may not call Lean/lake/elan, Core/WASM, `AuthoritativeProofStatePolicy`, `acceptVerifiedExternalLeanProof`, `submitExternalLeanProof`, `updateProof`, `updateNode`, `saveMapToDb` or any provider adapter.

## 9. Explicit exclusions

This G1 authorizes no code/tests, auth SDK, OAuth configuration, database/table/schema/migration, server route, account/session UI, token/secret storage, durable record, browser persistence, export/delete/revoke implementation, external API/provider/popup/upload, Lean/Core/AI execution, source/proof display, map mutation, state/trust/axiom decision, versioning, commit, push or publication.

The quarantined `/home/ubuntu/ricis3-lean-passport-g4` worktree remains prohibited as an implementation or design source. B1 code remains published and unchanged.

## 10. G2 entry criteria

A future **`RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 G2`** may begin only after explicit approval. It must define: (1) a non-vendor-specific account/tenant authorization port; (2) exact closed DTOs and lifecycle state machine; (3) a metadata-only storage abstraction with no raw source fields; (4) owner-scoped export/delete/revoke semantics; (5) retention/review/tombstone decision; (6) idempotency/replay and tenant-isolation controls; (7) no-write integration seams to existing proof/source/trust state; and (8) QA matrix for privacy, authorization, provenance and lifecycle failure cases.

No future G2 may authorize production implementation automatically. It must proceed through independent G3 valid-red, G4 and separate publication approval.

## 11. References

[1]: `RICIS-LEAN-PASSPORT-ROUTE-B2-DATA-LIFECYCLE-01_STEP1_BUSINESS_SPEC.md` — selected B2-A lifecycle decision and receipt boundary.

[2]: `RICIS-LEAN-PASSPORT-ROUTE-B-01_STEP1_BUSINESS_SPEC.md` — Route B ownership/authority requirements and legacy-candidate quarantine.

[3]: Published B1 v0.4.56 release record: `RICIS-LEAN-PASSPORT-ROUTE-B1-01_G4_RELEASE_REVIEW.md` and `RICIS-LEAN-PASSPORT-ROUTE-B1-01_STEP3_QA_SPEC.md`.

[4]: Published `src/model/types.ts`, `src/model/persistence.ts`, `src/store/mapStore.ts`, `src/leanConsent/leanEvidenceConsent.domain.ts`, `src/leanPassportProjection/leanPassportProjection.domain.ts`, and `src/leanPassportSession/leanPassportSession.domain.ts` at `7b0e06f`.
