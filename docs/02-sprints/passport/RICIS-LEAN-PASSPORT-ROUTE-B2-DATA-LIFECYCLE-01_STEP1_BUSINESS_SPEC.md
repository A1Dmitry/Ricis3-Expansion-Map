# RICIS-LEAN-PASSPORT-ROUTE-B2-DATA-LIFECYCLE-01 — Durable Reference Ledger — G1

**Статус:** `G1_DECISION_SELECTED_B2A_PREREQUISITE_G1_REQUIRED`
**Дата:** 2026-08-26 (GMT+3)
**Published baseline:** `7b0e06fc3d419d3c4839d9560346b436115b7f4c` (`main`, `v0.4.56`)
**Предшественник:** `RICIS-LEAN-PASSPORT-ROUTE-B-01_STEP1_BUSINESS_SPEC.md`, B1 `DONE_PUBLISHED_CONVERGED`.

## 1. Решение G1

B1 завершил минимально безопасный read-only вариант: local ephemeral reference исчезает при закрытии/reload и не создаёт новый Passport data store. B2 рассматривается только как отдельный **durable ledger ссылок и disclosure receipts** для уже существующих source-locked proofs. Он не является продолжением B1 implementation, не переносит B1 in-memory state в storage и не использует quarantined legacy Passport candidate.

> **G1 decision:** выбрана **B2-A: authenticated Passport account ledger** как единственный вариант, который может обеспечить user-managed durable history, cross-device lifecycle и accountable export/delete/revocation без ложного утверждения, что текущий browser/device является устойчивым owner. Продукт пока не содержит published authenticated Passport-account owner, поэтому B2 G2, код, schema, migration, storage, export и UI остаются заблокированными до отдельного ownership/authorization G1.

## 2. Пользовательская цель и строгая граница

Потенциальная цель B2 — позволить пользователю видеть и управлять историей собственных Passport reference sessions и explicit disclosure receipts, сохраняя только метаданные, необходимые для идентичности reference и жизненного цикла записи. Пользователь остаётся владельцем ранее submitted source bytes; B2 не получает права читать, дублировать, re-hash, исправлять, экспортировать или передавать эти bytes.

| Категория | Допустимое B2 значение | Запрет |
|---|---|---|
| Reference identity | Exact `nodeId`, canonical `sourceFingerprint`, immutable receipt ID/version. | Title/keyword/fuzzy binding, generated theorem, source replacement. |
| Provenance display | Existing `submittedAt`, `trustStatus`, literal `sourceLocked: true`, disclosure tier and lifecycle timestamps. | Raw Lean/TeX, `latex`, `proofLatex`, `currentProof`, source bytes, kernel output, provider transcript. |
| User lifecycle command | Explicit user request to create/list/export/delete/revoke **own receipt metadata** after an approved owner model exists. | Implicit write after source lock, automatic analytics/event log, delete of existing proof history, state/trust/axiom transition. |
| Verification/authority | Read-only `REQUIRES_CORE_LEAN`/existing provenance display may be carried as opaque metadata. | Lean verification, Core evidence, `TRUSTED_AXIOM`, human decision, `resolved` state, `AuthoritativeProofStatePolicy` call. |

## 3. Non-negotiable invariants

| ID | Invariant |
|---|---|
| B2-I-01 | Every durable record must bind only to an already existing immutable source lock and exact `sourceFingerprint`; it must never infer or construct identity from a title, value, prompt or source text. |
| B2-I-02 | A B2 ledger stores no raw Lean/TeX/source bytes, no proof body, no kernel evidence, no provider payload, no credential and no browser secret. |
| B2-I-03 | Receipt creation requires an explicit local user action separate from source submission and source lock. Existing source lock is not durable-storage consent. |
| B2-I-04 | Deleting/revoking a B2 receipt changes only the B2 receipt lifecycle. It cannot alter an existing `Proof`, `externalLean`, source lock, map snapshot, node state, axiom, trust or human decision. |
| B2-I-05 | Any export contains only the user-authorized receipt metadata under an explicit export contract. It never exports raw source or assumes external destination trust. |
| B2-I-06 | Retention must be an explicit policy with discoverable creation time, expiry/review semantics, deletion/revocation state and error behavior. Indefinite silent retention is forbidden. |
| B2-I-07 | No provider, popup, upload, connector, webhook, network transport, Lean/Core execution, agent action or calculator/industrial function belongs to B2 G1/G2 by default. |
| B2-I-08 | RICIS III v7.7, L0/L1, SP1–SP4, A1/A4/A5/A6/A7/A10, typed F/G semantics and owner-authorized P=NP remain immutable and are not B2 data fields or lifecycle commands. |

## 4. Required owner and lifecycle decision

The published application currently has generic map persistence but no dedicated authenticated Passport account/tenant owner or Passport data-lifecycle owner. Consequently, the following alternatives are documented, not selected.

| Alternative | Named owner | Storage implication | User lifecycle quality | G2 eligibility |
|---|---|---|---|---|
| **B2-A: Authenticated Passport account ledger** | Future authenticated account/tenant bounded context. | Server-side durable metadata only, with an explicit subject binding. | Strongest basis for list/export/delete/revocation and cross-device history. | Requires separate auth/data-store/authorization G1; not eligible for B2 G2 now. |
| **B2-B: Device-local receipt ledger** | User’s current browser/device only; no cross-device identity claim. | New local storage schema for metadata only. | Can offer local list/export/delete, but device loss, shared-device and reset semantics must be explicit. | Requires explicit user selection and a dedicated browser-lifecycle/privacy G2; not eligible by default. |
| **B2-C: No new ledger** | No durable owner. | Continue B1 only. | No history/archive; current safe published baseline. | Already published as B1. |

> **Selected outcome:** B2-A is selected by delegated product decision. B1 remains the effective runtime baseline until the separate account/tenant ownership G1 defines an authenticated subject, authorization boundary, server-side metadata store, retention, export/delete/revocation and audit model. B2-B is rejected for this goal because browser-local storage cannot provide durable cross-device user ownership and makes shared-device/reset loss an inherent product limitation.

## 5. Minimum receipt data contract for a future selected B2

A future G2 may propose only the following metadata envelope, subject to exact retention/owner decision. This is a design boundary, not an implemented schema, API, migration, storage write or consent record.

```ts
type PassportReceiptReference = Readonly<{
  receiptId: string;
  receiptVersion: 1;
  nodeId: string;
  sourceFingerprint: string;
  sourceLocked: true;
  submittedAt: string;
  displayedTrustStatus: 'REQUIRES_CORE_LEAN' | 'LEAN_VERIFIED' | 'TRUSTED_AXIOM' | 'REJECTED';
  disclosureTier: 'REFERENCE_ONLY';
  createdAt: string;
  lifecycle: 'ACTIVE' | 'REVOKED' | 'DELETED';
}>;
```

The future design must decide who issues `receiptId`, how a lifecycle event is authenticated, where the record is retained, how expiry is represented, what export format is permitted, and how delete/revoke requests are auditable without retaining hidden source data. It must reject additional fields by default.

## 6. Explicit exclusions

B2 G1 authorizes no production/test code, version change, dependency change, database, IndexedDB/localStorage write, map persistence modification, migration, browser command, account creation, identity collection, secrets, export implementation, external transport, provider/API, Lean/lake/elan/Core/WASM execution, AI/agent execution, popup, source upload, source display, proof rewrite, RICIS calculation, state/trust/axiom decision, commit, push or publication.

The quarantined `/home/ubuntu/ricis3-lean-passport-g4` worktree remains `SUPERSEDED_QUARANTINED`; its source-capture/persistence material may not be copied, cherry-picked, merged, staged, tested as B2 candidate or treated as design authority.

## 7. G2 entry criteria and required owner decision

The delegated choice is **B2-A: authenticated Passport account ledger**. Its next and only permitted action is a separate prerequisite **`RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 G1`**. That G1 must establish account/tenant ownership, identity/authorization boundary, metadata-only server lifecycle, retention limits, export/delete/revocation model, audit and fail-closed behavior. It does not authorize B2 G2 or implementation.

A later B2 G2 may begin only after the prerequisite G1 is completed and the user approves its selected lifecycle design. It must define a complete retention table (owner, storage location, allowed fields, max duration, user visibility, export behavior, deletion/revocation behavior, failure mode and test proof), then demonstrate no change in existing map/Proof/source/trust authority.

## 8. References

[1]: `RICIS-LEAN-PASSPORT-ROUTE-B-01_STEP1_BUSINESS_SPEC.md` — Route B ownership requirements and B1/B2 split.

[2]: Published `src/model/persistence.ts` and `src/store/mapStore.ts` at `7b0e06f` — generic map persistence/source-lock seam; not a dedicated Passport lifecycle owner.

[3]: Published `src/model/types.ts`, `src/leanConsent/leanEvidenceConsent.domain.ts`, `src/leanPassportProjection/leanPassportProjection.domain.ts`, and `src/leanPassportSession/leanPassportSession.domain.ts` at `7b0e06f` — canonical provenance, consent, read-only Passport and B1 ephemeral boundaries.

[4]: `RICIS-LEAN-PASSPORT-ROUTE-B1-01_G4_RELEASE_REVIEW.md` — completed B1 scope and explicit non-claims.
