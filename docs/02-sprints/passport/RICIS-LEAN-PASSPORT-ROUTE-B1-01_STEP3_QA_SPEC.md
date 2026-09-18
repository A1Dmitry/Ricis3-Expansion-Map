# RICIS-LEAN-PASSPORT-ROUTE-B1-01 — G3 QA и valid-red baseline

**Статус:** `DONE_PUBLISHED_CONVERGED`
**Дата:** 2026-08-26
**Baseline:** `e4a721cf629efe828ae57a921e9a2bcedb5ebb7d`
**G2 source:** `RICIS-LEAN-PASSPORT-ROUTE-B1-01_STEP2_ARCHITECTURE.md`

## 1. QA objective

G3 validates only the planned **ephemeral source-reference** B1 contract. It neither creates a real Passport session nor reads/stores raw user Lean source. Test fixtures may contain synthetic fingerprints and opaque non-source metadata only; they must never contain Lean theorem text, user source bytes or kernel evidence.

A valid red baseline is expected because B1 production modules and UI composition do not yet exist. Red may contain only the approved future-module/composition absence signatures. Lint must be green. Any TypeScript error, existing regression failure, OIR guard failure, raw-source fixture, persistence token, authority import or unexpected test-harness error invalidates the baseline.

## 2. Exact test-only inventory

| Test file | Contract family | Cases |
|---|---|---:|
| `src/leanPassportSession/leanPassportSession.domain.test.ts` | Pure source-reference validation, immutable projection, capability and no-I/O topology. | 17 |
| `src/ui/LeanPassportSessionDialog.test.tsx` | Controlled accessibility, fixed disclosure, reference-only rendering and close callback. | 13 |
| `src/ui/EditNodeModal.passportSession.test.tsx` | Source-locked-only opener, narrowed metadata handoff and static protected-boundary assertions. | 14 |
| **Total** | Approved B1 target suite | **44** |

Each red-baseline test must dynamically load its missing future B1 module where needed. This preserves a runtime missing-module signal and avoids converting red baseline into a TypeScript static-import failure.

## 3. Mandatory contract assertions

### 3.1 Pure domain — 17 cases

The G4 executable suite must establish that the projector accepts only a nonempty `nodeId`, nonempty `sourceFingerprint`, string `submittedAt`, known trust status and `sourceLocked: true`. It must preserve the supplied reference exactly and expose `SOURCE_BOUND_READ_ONLY` / `SOURCE_LOCKED_PROVENANCE` without determining proof or node state. `REQUIRES_CORE_LEAN`, `LEAN_VERIFIED`, `TRUSTED_AXIOM` and `REJECTED` are display metadata only; no basis text may claim a verification action occurred during B1 opening.

The suite must reject absent/blank node ID, blank/invalid source fingerprint, missing date, unknown trust status, `sourceLocked: false`, raw-source-shaped input and any extra capability request. It must freeze output and prove every capability false: `canMutate`, `canVerify`, `canUpload`, `canPersist`, `canRevealRawSource`.

Static topology checks must reject imports and runtime terms for `leanEvidenceConsent`, `leanPassportProjection`, `leanVerifier`, `ricisCore`, `AuthoritativeProofStatePolicy`, `mapStore`, `fetch`, browser storage, `saveMapToDb`, provider/popup paths, `src/leanPassport`, `latex`, `sourceBytes` and kernel evidence. The domain import inventory must be empty.

### 3.2 Controlled dialog — 13 cases

The dialog must provide `role="dialog"`, an accessible Russian label, source fingerprint/reference metadata, basis `SOURCE_LOCKED_PROVENANCE`, and exact no-verification/no-raw-source/no-persistence disclosure. It must render a close control that delegates the supplied `onClose` exactly once. It must never render a verify/upload/save/copy/export/launch action.

Static UI checks must restrict imports to React and B1 domain types, and reject store, persistence, raw source, external, Lean/Core/provider/browser-storage and authority tokens. Closing/unmounting is not a persistence event.

### 3.3 EditNodeModal composition — 14 cases

The Passport opener must be present only for a current proof with `externalLean.sourceLocked === true`; it must be absent for no proof, ordinary proof and malformed/unlocked provenance. The opener receives only `nodeId`, `sourceHash`, `submittedAt`, `trustStatus` and literal `sourceLocked: true`. It must not pass `currentProof`, `proofLatex`, `latex`, source bytes, kernel evidence or node mutable state to B1.

Opening and closing must remain local component state. Static negative tests must reject B1-open-path calls/imports of `submitExternalLeanProof`, `updateProof`, `updateNode`, `saveMapToDb`, `acceptVerifiedExternalLeanProof`, `AuthoritativeProofStatePolicy`, provider, popup, storage, network and legacy Passport paths. Existing EditNodeModal submission behavior is protected regression, not B1 behavior.

## 4. OIR scope guard

OIR containment may correctly reject new candidate paths at first test run. If it does, the only permitted amendment is test-only candidate-path allowlisting of exactly:

```text
src/leanPassportSession/leanPassportSession.domain.test.ts
src/ui/LeanPassportSessionDialog.test.tsx
src/ui/EditNodeModal.passportSession.test.tsx
```

**Observed G3 guard result:** OIR03-QA-36 rejected the three new untracked B1 test paths and no other protected regression failed. This is an expected positive scope-control detection. The next action is the exact test-only allowlist amendment below; no `audit.ts` change, repair change, source rewrite or general wildcard is permitted. If G4 adds reviewed B1 production paths, their allowlisting must occur only after a separate scope review in G4; G3 allows test paths only.

## 5. Required runs and valid-red classification

| Run | Expected result at G3 red | Invalid result |
|---|---|---|
| `npm run lint` | Pass. | Any new lint/type failure. |
| B1 target suite | 3 files / 44 failures only due to missing reviewed B1 modules/composition. | Existing test failure, malformed harness, static TS import failure, unrelated module error. |
| Related protected suite | Green after exact test-only OIR allowlist, including source-lock, mapStore external Lean, authoritative policy, Passport projection and OIR containment tests. | Any failure. |
| Full suite | Green except three approved B1 future-module failures until G4 exists. | Any other failure. |
| `git diff --check` / scope | Only three B1 test files plus exact OIR test allowlist amendment. | Production, persistence, authority or legacy Passport path. |

## 6. G3 execution result — `VALID_RED`

The initial B1 UI harness attempted to import an unavailable `@testing-library/react` package. This was a **test-only harness defect**, not an approved red condition; it was corrected by replacing the import with the repository's existing `react-dom/client` + `act` pattern. No production byte, dependency, package lock or configuration changed.

The corrected baseline has `npm run lint` green. The exact B1 target reports three failing files and **44 failing tests**: 17 dynamic missing-module failures for the absent pure domain, 13 dynamic missing-module failures for the absent controlled dialog, and 14 missing approved composition assertions in `EditNodeModal`. No package-resolution, TypeScript, lint, existing regression or unexpected harness failure remains.

The first protected suite run correctly rejected the three untracked B1 test paths under OIR03-QA-36. The exact test-only candidate allowlist amendment was applied. The corrected protected suite is **9 files / 105 tests green**. The full suite is **118 files**, with **115 green** and only the approved **3 B1 red files / 44 red tests**. `git diff --check` is green. This is a valid-red baseline, not a Lean/Core verification, raw source operation, persistence event, provider action or authority claim.

## 7. G4 implementation and local-release evidence — `GREEN`

G4 реализовал строго approved B1 inventory: один zero-import pure projector `src/leanPassportSession/leanPassportSession.domain.ts`, controlled read-only `LeanPassportSessionDialog` и narrow local composition в existing `EditNodeModal`. Opener появляется только при existing `externalLean.sourceLocked === true`, передаёт ровно provenance metadata и очищает local session только при delegated close. Никакой существующий submit/save/update/verification path не изменён.

После target-green scope review OIR03-QA-36 первоначально корректно отклонил новые production candidate paths. В test-only allowlist добавлены только exact reviewed entries `src/leanPassportSession/leanPassportSession.domain.ts`, `src/ui/LeanPassportSessionDialog.tsx` и modified `src/ui/EditNodeModal.tsx`, наряду с уже approved тремя B1 test paths. `audit.ts` не изменялся; wildcard не добавлялся. Diff review подтвердил отсутствие изменений в `AuthoritativeProofStatePolicy`, `mapStore`, `leanConsent`, `leanPassportProjection`, `audit.ts`, RICIS core rules, Core bridge и API client; B1 domain/dialog не содержат raw-source, persistence, browser/network/popup/provider, Lean/Core или authority runtime tokens.

| G4 local gate | Результат |
|---|---:|
| `npm run lint` | Green |
| B1 target suite | **3 files / 44 tests green** |
| Related protected suite | **10 files / 119 tests green** |
| Full suite | **118 files / 1087 tests green** |
| `npm run release:check` | Green; package/version consistency for `v0.4.56` |
| `npm audit --omit=dev --audit-level=high` | Green; 0 high vulnerabilities |
| `npm run build` | Green; only pre-existing Vite config/chunk-size warnings observed |
| `git diff --check` | Green |

B1 is a user-visible feature, therefore the release candidate receives patch version **`v0.4.56`**; canonical package, lock, source version, README, citation, JSON-LD and required evidence markers are synchronized. These local application-code gates do not constitute Lean-kernel verification, Core execution, raw-source handling, durable record creation, human decision, proof trust, workflow promotion or mathematical verification. The next permitted workflow step is feature commit followed by fresh-main integration QA.

## 8. Post-publication convergence — `DONE_PUBLISHED`

The approved branch-first workflow completed without post-QA drift: feature `5637f4671288fa42b7e20903f1311d3397d94f96` → clean integration merge `ea83db9c4b083283939274ee3cc36a13b038295f` → local non-fast-forward main merge `7b0e06fc3d419d3c4839d9560346b436115b7f4c`. Push to GitHub `main` succeeded. Final verification established `HEAD == origin/main == GitHub API main == 7b0e06fc3d419d3c4839d9560346b436115b7f4c`; main, feature and integration worktrees are clean.

GitHub Pages run [`32946711779`](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/32946711779) for the same main SHA completed with `success`. The build job ran release alignment, TypeScript/test suite, static-site build and artifact upload, followed by successful deployment. This is CI publication evidence for the application release, not Lean/Core execution or proof authority.

## 9. Non-claims

No Lean/lake/elan, Core/WASM, static analysis execution on a user source, map source capture, source read, user consent write, persistence, IndexedDB/localStorage, provider, upload, popup, connector, external action or proof/state authority decision is authorized by this G3.

## References

[1]: `RICIS-LEAN-PASSPORT-ROUTE-B1-01_STEP2_ARCHITECTURE.md` — approved B1 domain/UI/composition boundary.

[2]: `src/ui/EditNodeModal.tsx` and `src/model/types.ts` — published source-lock UI seam and metadata contract.

[3]: `src/model/audit.proofSynthesisContainment.test.ts` — protected candidate-path scope guard.
