# RICIS-LEAN-PASSPORT-ROUTE-B-01 — Source-Bound Passport Session — G1

**Статус:** `G1_COMPLETE_DECISION_REQUIRED`
**Дата:** 2026-08-26
**Published baseline:** `e4a721cf629efe828ae57a921e9a2bcedb5ebb7d` (`main`, `v0.4.55`)
**Предпосылка:** пользователь выбрал Route B из current `RICIS-LEAN-PASSPORT-01` G1. Это **новая** задача, а не восстановление quarantined legacy worktree.

## 1. Что уже существует и почему этого недостаточно

Published `submitExternalLeanProof()` принимает user-initiated source, вычисляет fingerprint, фиксирует `sourceLocked: true`, оставляет node state неизменным и сохраняет `REQUIRES_CORE_LEAN`; browser-side acceptance по-прежнему disabled.[1] Existing map persistence сохраняет полный `proofs` snapshot, включая `latex`, в IndexedDB snapshot; у него нет отдельной Passport retention/consent/disclosure модели.[2]

Следовательно, source lock является **provenance lock**, а не самостоятельным согласием на раскрытие, долгосрочное Passport хранение, внешнюю передачу, Lean verification, trust change или state transition. Existing `leanPassportProjection` умеет read-only disclosure, но не скомпонован в application и не является source-session owner.[3]

| Свойство | Published baseline | Route B requirement |
|---|---|---|
| Source identity | User-provided `leanSource` becomes source-locked proof with deterministic fingerprint. | Passport may reference exact `nodeId + sourceFingerprint`; it must not substitute, transform or copy bytes implicitly. |
| State authority | Static diagnostic preserves state; `acceptVerifiedExternalLeanProof` throws; Core policy owns `resolved`. | Passport must not import/call/replicate any state writer or decision policy. |
| Disclosure | Projection supports bounded/escaped/redacted output, but no UI session owner exists. | Each source display needs a local user gesture and explicit disclosure scope. |
| Persistence | Generic map snapshot persists proofs; no dedicated retention/deletion/export ledger for Passport. | Route B must either add **no** new persistence or first specify a dedicated lifecycle before any durable Passport record. |
| Provider/external action | Default verification provider is unavailable; hosted/manual paths remain diagnostic-only. | No provider, popup, upload, webhook, connector, token or Lean execution belongs to this task. |

## 2. Non-negotiable ownership and authority requirements

A Source-Bound Passport Session may only be created for a proof that already contains an immutable source lock and matching source fingerprint. The user remains owner of the submitted bytes. The session must bind to the exact source identity, not a title, value, generated theorem, AI answer or computed static status.

> A source-bound display is evidence navigation only. It is never proof verification, consent to an external service, agent approval, human disposition, RICIS solution decision or state transition.

| Requirement | Mandatory rule |
|---|---|
| Explicit local disclosure consent | A local user gesture must declare display purpose and exact reference before Passport content is revealed. Consent is not inferred from earlier source submission, source lock or external verification consent. |
| Minimum disclosure | The first safe session exposes fingerprint, source name/byte count if available, state basis and diagnostic category. Raw source display is a separate explicit disclosure level. |
| Byte preservation | No normalization, line-ending conversion, generated replacement, agent rewrite, re-hash of altered bytes or migration repair may occur. |
| No duplicate raw-source store | Route B must not create a second copy of `leanSource`/`sourceBytes` in a Passport ledger, browser storage, logs or analytics. |
| Revocation and deletion | No new durable Passport record may be introduced until its owner, retention period, user export and deletion/revocation semantics are explicitly designed and tested. Deleting a display/session reference cannot alter existing source-locked proof history or state. |
| Authority separation | Passport output carries no `LeanVerified` authority and cannot call `AuthoritativeProofStatePolicy`, `acceptVerifiedExternalLeanProof`, Core/WASM, provider adapters or `saveMapToDb` as an authority shortcut. |
| External boundary | Upload/prefill/popup/manual handoff and hosted advisory each require separately scoped consent/architecture; they are absent from Route B G1/G2 candidates. |

## 3. Viable Route B implementation boundaries

| Alternative | User-visible result | New data retained | Trade-offs | G2 eligibility |
|---|---|---|---|---|
| **B1. Ephemeral source-reference session** | User opens a local read-only Passport view for an already source-locked proof. The view derives a `nodeId + sourceFingerprint` reference at runtime and disappears on close/reload. | **None.** No new Passport storage; existing proof persistence remains untouched. | Smallest safe B increment, but no history of view/consent events and no user-managed Passport archive. | Eligible for narrow G2B1: pure reference/session projection + controlled UI only. |
| **B2. Durable consented Passport ledger** | User manages append-only Passport session references and explicit disclosure receipts for source-locked proofs. | Reference/consent metadata only; raw Lean bytes prohibited. | Needs a named persistence owner, schema/migration, retention duration, export/delete/revocation policy and detailed abuse/privacy QA. | Requires a separate **G1B2-DATA-LIFECYCLE** before any G2. It cannot enter G2 from this document. |

No alternative is selected automatically. B1 is the lighter option; B2 is appropriate only when durable user-controlled Passport history is a clear requirement.

## 4. Excluded legacy material

The detached `/home/ubuntu/ricis3-lean-passport-g4` material is excluded. It starts from pre-incident source capture/persistence semantics, contains uncommitted `src/leanPassport/` code and stale release metadata, has no committed provenance branch, and does not satisfy the published authority and lifecycle boundary. It must not be copied, cherry-picked, merged, tested as a candidate or used as a design authority.

## 5. G2 entry conditions

An explicit selection is required:

1. **`OK PASSPORT B1 G2`** opens only B1 architecture. It may specify a pure source-reference view, explicit local display event, safe disclosure tiers and a controlled UI seam. It may not add persistence, raw source duplication, state/authority changes or external actions.
2. **`START PASSPORT B2 DATA-LIFECYCLE G1`** opens a separate G1 for durable metadata ownership before any implementation design.

## References

[1]: `src/store/mapStore.ts`, lines 604–675 — source lock, static diagnostic/state preservation and disabled browser evidence acceptance.

[2]: `src/model/persistence.ts`, lines 11–30 and 190–217 — generic persisted proof snapshot and map storage/export/import boundary.

[3]: `src/leanConsent/leanEvidenceConsent.domain.ts` and `src/leanPassportProjection/leanPassportProjection.domain.ts` — non-authoritative evidence/consent types and read-only Passport disclosure constraints.
