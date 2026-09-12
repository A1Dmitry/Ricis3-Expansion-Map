# RICIS-LEAN-PASSPORT-ROUTE-B1-01 — Ephemeral Source-Reference Session — G2

**Статус:** `G2_COMPLETE`
**Дата:** 2026-08-26
**Baseline:** `e4a721cf629efe828ae57a921e9a2bcedb5ebb7d`
**Scope source:** `RICIS-LEAN-PASSPORT-ROUTE-B-01_STEP1_BUSINESS_SPEC.md` (selected B1).

## 1. Architectural result

B1 adds only a local, runtime-only Passport reference view for an already source-locked external Lean proof. The session is created from `nodeId`, `externalLean.sourceHash`, `externalLean.submittedAt` and `externalLean.trustStatus`; it never receives or stores `Proof.latex`, `leanSource`, `sourceBytes`, kernel evidence or a user identity.

> Opening the session is an explicit local disclosure event, not a persistence write, verification request, consent ledger record, external upload, proof action or state transition.

## 2. Approved bounded inventory

| Layer | New or changed item | Allowed responsibility | Explicit exclusions |
|---|---|---|---|
| Pure domain | `src/leanPassportSession/leanPassportSession.domain.ts` | Validate the exact source-locked reference and project immutable Russian disclosure text. | No imports; no I/O; no raw source, hash calculation, timestamp generation, store, persistence, Core, Lean, provider or browser API. |
| Presentational UI | `src/ui/LeanPassportSessionDialog.tsx` | Controlled accessible dialog that renders reference/basis/disclosures and delegates close only. | No store import, source text, copy/export, API, popup, network, localStorage, IndexedDB or verification action. |
| Narrow composition | `src/ui/EditNodeModal.tsx` | Derive the public reference from existing current proof only when `externalLean.sourceLocked === true`; open/close dialog in local React state. | No `submitExternalLeanProof`, `updateProof`, `updateNode`, `saveMapToDb`, `acceptVerifiedExternalLeanProof`, `AuthoritativeProofStatePolicy`, raw source or state mutation on Passport-open path. |
| Test-only guard | `src/model/audit.proofSynthesisContainment.test.ts` | Exact candidate-path allowlist for reviewed B1 test/source paths only, if OIR scope guard requires it. | `audit.ts` implementation, repair behavior and authority rules remain untouched. |

The existing source submission/edit path stays unchanged. B1 only becomes visible after a previous user-created source lock already exists; it is not a second submission form and cannot create a lock.

## 3. Pure session contract

```ts
type SourceBoundPassportReference = Readonly<{
  nodeId: string;
  sourceFingerprint: string;
  submittedAt: string;
  trustStatus: 'REQUIRES_CORE_LEAN' | 'LEAN_VERIFIED' | 'TRUSTED_AXIOM' | 'REJECTED';
  sourceLocked: true;
}>;

type EphemeralPassportSessionView = Readonly<{
  state: 'SOURCE_BOUND_READ_ONLY';
  reference: SourceBoundPassportReference;
  basis: 'SOURCE_LOCKED_PROVENANCE';
  disclosures: readonly string[];
  capabilities: Readonly<{
    canMutate: false;
    canVerify: false;
    canUpload: false;
    canPersist: false;
    canRevealRawSource: false;
  }>;
}>;

createEphemeralPassportSession(reference): EphemeralPassportSessionView
```

The projector rejects malformed node identifiers, absent/non-string fingerprints, non-locked sources and unknown trust status. It never falls back to a scalar default or fabricated source identity. Its fixed disclosures state that the reference is source-bound provenance only; static diagnostics and this view do not verify Lean Kernel or change state; no raw source is shown; no external action occurs.

## 4. Controlled UI and lifecycle

`EditNodeModal` already knows whether the current proof is source-locked. B1 extends this seam with one conditional local button, `Открыть паспорт источника`, shown only when the current proof supplies a source-locked `externalLean` reference. The click creates a local immutable view and opens `LeanPassportSessionDialog`.

| Event | State retained after event | Side effect |
|---|---|---|
| Modal opens without locked external source | None. B1 control absent. | None. |
| User clicks Passport control | In-memory dialog view only. | None. |
| Dialog displays | In-memory dialog view only. | None. No raw source text is passed. |
| User closes dialog / parent modal closes / page reloads | Reference disappears. | None. |

No event writes consent, agent log, map state, proof, node, IndexedDB, localStorage or URL. There is no copied/exported text, no raw source reveal and no browser window/popup.

## 5. Dependency and authority barriers

The new domain must have an empty import graph. The new dialog may import React and B1 domain types only. `EditNodeModal` may import only the B1 projector/dialog. It must pass the published `externalLean` metadata as a narrowed reference, never `currentProof`/`proofLatex`.

The following are protected negative dependencies: `leanEvidenceConsent`, `leanPassportProjection`, `leanVerifier`, `ricisCore`, `AuthoritativeProofStatePolicy`, `acceptVerifiedExternalLeanProof`, `saveMapToDb`, `submitExternalLeanProof`, `updateProof`, `updateNode`, provider adapters, `fetch`, `XMLHttpRequest`, `window.open`, `localStorage`, `sessionStorage`, IndexedDB and all `src/leanPassport/` legacy paths.

## 6. G3 entry specification

G3 must create test-only red baseline artifacts for exactly three contracts: pure reference projection, controlled dialog and narrow EditNodeModal composition. Red is valid only for the missing B1 modules/composition. Any TypeScript, lint, existing test, OIR scope guard, raw-source leakage or authority import failure is an invalid baseline and must be corrected before G4.

The G3 suite must prove at least: accepted `REQUIRES_CORE_LEAN` and `TRUSTED_AXIOM` references preserve their status text without deciding state; malformed/unlocked references reject; every capability is false; dialog has accessible label, fixed no-verification/no-raw-source disclosure and close callback; source-locked-only B1 button; opener passes reference metadata but not `proofLatex`; and static negative checks exclude persistence/authority/external tokens.

## References

[1]: `src/ui/EditNodeModal.tsx`, lines 15–22 and 209–228 — source-lock UI seam and static-only disclosure.

[2]: `src/model/types.ts`, lines 82–112 — published `ExternalLeanProvenance` contract.

[3]: `src/store/mapStore.ts`, lines 604–675 — existing source-lock/static diagnostic path and disabled browser evidence acceptance.

[4]: `src/model/authoritativeProofStatePolicy.ts` — sole authoritative proof-state decision owner.
