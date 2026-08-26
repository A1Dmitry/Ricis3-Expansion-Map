# RICIS QA Scorecard and Defect Register

**Status:** `ACTIVE_PROCESS`
**Purpose:** Independent QA lane for every Agile increment. It records objective evidence of specification compliance, defect discovery, re-test and release readiness. It is a process scorecard, **not a payment, employment, reputation or automatic punishment system**. Actual bonuses or penalties require a separate user-authorized rewards mechanism and are not created by this register.

> **Separation rule:** The implementer produces an artefact and self-checks it. The QA lane independently compares it with approved G1/G2/G3, ontology/trust boundaries, negative cases and release evidence. A QA finding must have a reproducible source, command, test, diff or scenario; a preference is not a defect.

## Status vocabulary

| Status | Meaning |
|---|---|
| `OPEN` | Reproducible nonconformity exists; release is blocked if severity is Critical/High. |
| `FIXED_PENDING_RETEST` | Implementer claims a correction; QA re-test is required. |
| `CLOSED_VERIFIED` | QA evidence confirms the correction and non-regression. |
| `REJECTED_NOT_A_DEFECT` | Report lacks a specification violation or reproducible evidence. |
| `ESCAPED` | A defect should have been detectable by approved QA scope but appeared after a green release. |

## Severity and process credits/debits

| Severity | Definition | Release effect | QA credit | Implementer debit if escaped |
|---|---|---|---:|---:|
| Critical | Ontology/trust/provenance breach, fabricated proof/evidence, destructive data behavior or security boundary failure. | Hard block. | +8 | -12 |
| High | Approved G1/G2/G3 violation, source replacement, state/trust mutation, incorrect published feature behavior. | Hard block. | +5 | -8 |
| Medium | Reproducible functional, accessibility, topology or reliability defect within scope. | Fix before release unless explicitly waived by user. | +3 | -4 |
| Low | Non-blocking clarity, layout, copy, test isolation or maintainability defect with a precise remediation. | Record and schedule. | +1 | -1 |

Credits recognize **verified discoveries before release**. Debits are quality signals, not punishment: they apply only to a later `ESCAPED` defect demonstrably covered by an approved QA requirement. QA receives a matching process debit only when an escaped defect was directly detectable by an approved, executed QA check and the omission is evidenced. No score is assigned for hypothetical bugs, subjective disagreement or untestable claims.

## Scorecards

| Role | Baseline | Quality credits | Debits | Current score | Evidence basis |
|---|---:|---:|---:|---:|---|
| Implementer | 100 | +0 | 0 | 100 | No escaped defect; independent OIR-01 release review found no new nonconformity. |
| Independent QA lane | 100 | +6 | 0 | 106 | +3 for pre-implementation fresh-worktree divergence detection, +1 for the prior OIR test-compilation defect, +1 for Lean-passport red-baseline test-contract compilation isolation, and +1 for the OIR-03 post-commit clean-integration scope-contract defect; no escaped defect is recorded. |

## Required QA gates

| Gate | QA must check | Evidence required |
|---|---|---|
| Before G3 | Approved G1/G2 maps to positive and negative tests; no scope is silently omitted. | QA test matrix and red-baseline result. |
| Before G4 merge | Implementation has no forbidden import, mutation, fallback, source replacement or trust promotion. | Diff review, topology tests and targeted behavior tests. |
| Before publish | Full suite, release metadata, audit, build, diff hygiene, known warning disclosure, clean scoped status. | Commands/output summary and file inventory. |
| After publish | Upstream commit matches reviewed scope; task register points to exact next gate. | `HEAD == origin/main`, clean status, register update. |

## OIR-01 QA review record

| ID | Type | Severity | Status | Finding / rule | Evidence | Owner | Re-test |
|---|---|---|---|---|---|---|---|
| QA-OIR-001 | Worktree integrity | Medium | `CLOSED_VERIFIED` | Old main worktree is at `ed5f239`, behind published `9094236`; OIR implementation there would omit CALC-EXP baseline. | `git fetch`; `HEAD=ed5f239`, `origin/main=9094236`; register entry. | Process | Fresh isolated worktree required before any OIR implementation. |
| QA-OIR-002 | G3 baseline isolation | Medium | `CLOSED_VERIFIED` | OIR G3 test was copied alone into fresh `9094236` worktree; independent baseline is type-correct and fails only three approved missing-behavior assertions. | `npm test -- --run src/model/migrationAudit.provenance.test.ts`: 3 passed / 3 failed; `npm run lint`: passed. | Implementer | Verified 2026-08-25; G4 may begin within approved scope. |
| QA-OIR-003 | Source/trust preservation | High | `CLOSED_VERIFIED` | Migration no longer contains P=NP/Mersenne keyword writer/canonical proof builder; preserve mode retains original Proof/LaTex/`externalLean` identity. | G3 focused suite: byte-for-byte identity, absent-proof non-generation, preserve audit and source topology all pass. | Implementer | Re-test passed 2026-08-25. |
| QA-OIR-004 | Legacy behavior containment | Medium | `CLOSED_VERIFIED` | Existing non-migration callers retain legacy repair until OIR-03; no broad behavior change is allowed. | G3 legacy default assertion passed after preserve-mode addition. | Implementer | Re-test passed 2026-08-25. |
| QA-OIR-005 | Test compilation | Low | `CLOSED_VERIFIED` | G3’s `@ts-expect-error` became stale when preserve-mode implementation satisfied the type contract. | First green behavior run: 6/6 tests passed, then lint failed only `TS2578`; directive removed; lint passed. | Implementer | QA caught pre-release; no escaped-defect debit. |
| QA-release-01 | Pre-publish release review | High | `CLOSED_VERIFIED` | Independent review confirms the diff removes only the forbidden migration template path and adds the narrow typed preserve boundary; no source-bound proof/`externalLean` mutation, Core/Lean/agent dependency, trust promotion, scope creep or release-metadata divergence was found. | Captured diff `OIR-01_QA_RELEASE_DIFF_2026-08-25.txt`; independent focused retest 6/6 + lint; `release:check` 12/12; full suite 71/507; audit 0 vulnerabilities; Pages build; `git diff --check`. | QA lane | Verified 2026-08-25; separate user approval received before commit/push. |
| QA-postpublish-01 | Publication convergence | High | `CLOSED_VERIFIED` | The published GitHub commit is exactly the reviewed OIR-01 release and the isolated worktree is clean after push. | `HEAD == origin/main == f8c82602afb40e7772de8ecb4ed6ad98f4632ca9`; GitHub commit API returned the same SHA and message `fix(migration): preserve source-bound proofs`. | QA lane | Verified 2026-08-25; no escaped defect and no process-score change. |

## OIR-01 QA baseline conclusion

The independent QA lane classifies the red baseline as **valid for G4**. It identifies only approved gaps: (1) direct migration rewrite of an existing P=NP/Mersenne proof, (2) missing migration-specific preserve mode in the audit seam, and (3) migration source retaining a canonical proof builder/template writer. The remaining three checks already pass: absence of proof when not supplied, retained legacy default repair for unrelated callers, and no agent/Core/Lean/limit/NaN dependency in migration. No fixture, type, upstream-version or unapproved-scope defect remains.

## OIR-01 QA acceptance matrix

| QA check | Required condition | Current status |
|---|---|---|
| QA-G3-01 | Fresh worktree is based exactly on published `9094236`. | Passed: `HEAD == origin/main == 9094236`. |
| QA-G3-02 | Copied G3 suite is type-correct; red failures isolate absent preserve behavior only. | Passed: lint green; 3 passed/3 red checks locate direct writer, absent preserve mode and template import/invocation. |
| QA-G4-01 | P=NP/source-bound proof object and all fields are byte-for-byte/identity preserved. | Passed: G3 focused identity/strict-equality/`externalLean` identity assertions green. |
| QA-G4-02 | No proof is generated if source-bound proof is absent. | Passed: no-proof P=NP/Mersenne migration assertion green. |
| QA-G4-03 | Preserve mode causes no audit rewrite; legacy default behavior is separately regression-tested. | Passed: preserve and default-legacy assertions green. |
| QA-G4-04 | No Core/Lean/agent/template/trust dependency enters OIR path. | Passed: migration source topology assertion green. |
| QA-release-01 | Full quality/release gates pass and scope diff is clean. | `CLOSED_VERIFIED`: independent diff review found only approved OIR-01 source/test/release artifacts; focused retest 6/6 and lint passed; release check 12/12, full suite 71 files/507 tests, audit 0 vulnerabilities, Pages build and `git diff --check` passed. Known Map3D chunk-size warning and sandbox engine mismatch are explicitly disclosed, not waived as CI conformity. |
| QA-postpublish-01 | Published commit equals reviewed candidate and worktree is clean. | `CLOSED_VERIFIED`: GitHub confirms `f8c82602afb40e7772de8ecb4ed6ad98f4632ca9` with message `fix(migration): preserve source-bound proofs`; `HEAD == origin/main` and isolated worktree is clean. |

## RICIS-LEAN-PASSPORT-01 QA planning record

**Status:** `PUBLICATION_BLOCKED_BY_CONSENT_INCIDENT`
**Scope:** v0.4.44 pre-publication QA remains recorded, but publication is blocked by the newly reported auto-reset/unauthorized-demotion incident until a separately gated correction is verified.
**Baseline:** published `f8c82602afb40e7772de8ecb4ed6ad98f4632ca9`; fresh isolated G4 worktree `/home/ubuntu/ricis3-lean-passport-g4` remains detached at that SHA and uncommitted.

| ID | Type | Severity | Status | Finding / rule | Evidence | Owner | Next QA action |
|---|---|---|---|---|---|---|---|
| QA-LP-G3-PLAN | QA design | N/A | `CLOSED_VERIFIED` | G3 specifies 28 LPQA cases for exact-byte provenance, append-only records, candidate-evidence containment, Core correlation, read-only topology, privacy/security, persistence, legacy isolation and P=NP source preservation. | `RICIS-LEAN-PASSPORT-01_STEP3_QA_SPEC.md`; user G3 approval; fresh G4 worktree `f8c82602…` clean; target red suite valid. | QA lane | Production implementation may begin only within G1/G2/G3 scope. |
| QA-LP-001 | Test-contract compilation | Low | `CLOSED_VERIFIED` | Initial red tests used static imports of the deliberately absent future module, so `npm run lint` failed before runtime red cases could be isolated. | Five static imports produced TS2307; test contracts were changed to typed dynamic loaders; lint passed; final target run: 5 files/17 red tests, all 17 errors solely `Cannot find module ... leanPassport.domain`, no ENOENT. | Implementer | QA caught before implementation; +1 process credit to QA, no escaped-defect debit. |
| QA-LP-002 | Red-baseline validity | Medium | `CLOSED_VERIFIED` | The approved missing capability is isolated without upstream/trust/source defects. | Fresh `HEAD == origin/main == f8c8260`; `npm ci --ignore-scripts` completed (engine warning disclosed); lint passed; target 5 files/17 red, missing domain error count 17; six related regression files/31 tests passed. | QA lane | G4 implementation may begin only for approved Lean Passport contracts. |
| QA-LP-003 | Authority/topology review | High | `CLOSED_VERIFIED` | New pure domain is source-bound and does not introduce agent/fallback/Wasm/template/map-store/DB/network/browser-storage/Lean-toolchain authority, state writer or P=NP replacement path. | Independent source scan: no imports; forbidden dependency scan clean; target topology/security tests 17/17 passed; reviewed scope contains only one domain module, five approved tests and mandatory metadata/history. | QA lane | Retain current boundary; no UI/store/Core execution integration is included in this release. |
| QA-LP-release-01 | Release review | High | `BLOCKED_BY_INCIDENT` | v0.4.44 local gates remain valid, but user reported auto-reset/unauthorized demotion of entered Lean evidence; publication cannot proceed until separate corrective G1–G4 is complete. | Previous release evidence retained; incident record `QA-LEC-001` opened before commit/push. | QA lane | Review correction candidate and re-run release QA after consent invariant is enforced. |
| QA-LEC-001 | User Lean evidence reset/demotion | Critical | `AWAITING_G3_OK` | Reported behavior: user-entered Lean may be auto-reset or task state demoted while kernel/compiler is unavailable. This violates source-history and human-consent requirements. | `LEAN-EVIDENCE-CONSENT-01_STEP1_BUSINESS_SPEC.md`; static inventory identifies five direct surfaces (`LEC-P-01…05`): editor/submission, hydration, audit/migration and proof-state policy. Runtime reproduction is not claimed yet. | Implementation + QA | Obtain explicit `OK LEAN-EVIDENCE-CONSENT-01 G1`; then prepare G2 and independent G3 only. |
| QA-LEC-002 | Agent advisory challenge / competence feedback | High | `AWAITING_G3_OK` | Human-initiated Lean challenge must distinguish fallible agent advice from kernel evidence. An authoritative contradiction must preserve task/source evidence and create immutable `AGENT_COMPETENCE_CONFLICT` with `TRAINING_REQUIRED`, not autonomously retrain or alter state. | G1 sections 4–6 and revised G2 sections 4/6 define source/evidence/advisory/challenge fingerprints, no-self-certification, no-autonomous-training and later test requirements. | QA lane | Review G3 challenge authority, quarantine and attestation negative cases; no agent execution or training before separate approval. |
| QA-LEC-003 | Optional kernel evidence ports | High | `AWAITING_G3_OK` | Container and CI are optional evidence producers, not browser authority or state writers. | Revised G2 specifies sealed artifact/source hash, image/toolchain/project-lock/runner identity, bounded output, no `sorryAx`, response signature, and fail-closed correlation. Docker/Cloud Run/Actions provisioning is not authorized. | QA lane | G3 must include generic endpoint, shell injection, egress/secrets, unpinned action, branch/run-ID spoofing, attestation mismatch and no-direct-state-write negative cases. |
| QA-LEC-004 | Hosted API / playground handoff | High | `AWAITING_G3_OK` | AXLE may only be source-consented advisory preflight; Lean Web popup is manual diagnostic only. Neither is evidence authority. | Research file records provider/API limitations, AXLE `ignore_imports` and adversarial-verification cautions, and Lean Web source/URL privacy and cross-origin constraints. No source was transmitted. | QA lane | G3 must reject no-consent upload, import substitution, permitted sorries, source/result hash mismatch, unsigned response, popup auto-read/`postMessage`, URL prefill without warning, transcript-as-authority and any state/trust/competence write. |

| G3 specification | `LEAN-EVIDENCE-CONSENT-01_STEP3_QA_SPEC.md` — G2-approved architecture now has 36 named red/negative/provenance/release cases and six test-only red-baseline artefacts. No implementation test/code has been created. |

| QA control | Required independent evidence after G3 approval |
|---|---|
| Worktree integrity | Fresh `origin/main` SHA equals detached G4 worktree; clean status; no stale OIR/CALC/G1/G2 worktree reuse. |
| Red baseline | Target tests type-correct and red only for G2-approved missing capability; unrelated regression/lint baseline green. |
| Provenance | Exact source bytes, fingerprints, lineage, object identity and no replacement/template behavior. |
| Trust | No browser/static/agent/fallback self-certification; exact Core snapshot correlation only; passport does not invoke state policy. |
| Safety | No code execution/network/secret render; bounded and escaped/redacted evidence; safe failures. |
| Release | Diff scope, targeted/related/full suites, metadata, audit, build, diff hygiene, disclosed warnings, then separate publish approval. |

**Score impact:** `QA-LEC-001` remains a user-reported critical incident pending independent runtime classification; `QA-LEC-002` is a G1 control requirement, not a discovered defect. Neither changes the process score yet. Implementer remains **100** and Independent QA lane remains **105**. This is a process metric only, not compensation or a reputation score.

## Update protocol

1. Add a defect row before implementing a defect-driven change.
2. Attach exact command/test/diff evidence to every state change.
3. The implementer may set only `FIXED_PENDING_RETEST`; independent QA evidence sets `CLOSED_VERIFIED`.
4. Recalculate scorecard only after a closed/escaped defect, never from intent or self-report.
5. Copy the final QA result to `RICIS_TASK_REGISTER.md` before asking for commit/publication approval.

## LEAN-EVIDENCE-CONSENT-01 G4 red-baseline evidence — 2026-08-25

| QA ID | Severity | Status | Reproducible evidence | Owner | Exact next action |
|---|---:|---|---|---|---|
| QA-LEC-005 | Medium | `CLOSED_VERIFIED` | Fresh detached `/home/ubuntu/ricis3-lean-consent-g4` equals `origin/main == f8c82602…`; `npm ci --ignore-scripts` passed with 0 vulnerabilities and disclosed engine warning; `npm run lint` passed. Six approved target files produced exactly **36/36** runtime-red tests. Log contained exactly 36 matching `Cannot find module '/src/leanConsent/leanEvidenceConsent.domain'` errors and zero `ENOENT`, TS, assertion, type or reference-error markers. Existing related boundary suite passed **5 files / 66 tests**. | QA lane | Bounded G2-contract implementation is now permissible only in this fresh worktree; `QA-LEC-001…004` remain open. |
| QA-LEC-001 | Critical | `OPEN_IMPLEMENTATION_REQUIRED` | Reported user Lean reset/demotion is now represented by independent red contracts LEC-QA-01…12 and LEC-QA-31…34. Red baseline proves absence of the approved preserving capability; runtime fix is not yet implemented. | Implementation + QA | Implement only approved pure consent/evidence/state contracts; QA must reproduce target behavior green before status can change. |

> **Process note:** the earlier Lean Passport test-harness correction remains a separate low-severity QA finding. It neither weakens this red baseline nor earns/changes real compensation. No Lean compilation, external API/source upload, AI execution or retraining occurred.

## LEAN-EVIDENCE-CONSENT-01 independent G4/release review — 2026-08-25

| QA ID | Severity | Final status | Independent evidence | Conclusion |
|---|---:|---|---|---|
| `QA-LEC-001` | Critical | `CLOSED_VERIFIED` | The fresh detached G4 baseline reproduced the absence of all 36 approved consent capability checks; implementation then passed the 36 target tests, affected store/persistence integration (8 files / 51 tests), and final full suite (77 files / 543 tests). Static review confirms `updateProof`, `submitExternalLeanProof`, hydration and audit no longer write a consentless demotion. | The reported code-level reset/demotion paths are removed. User Lean submission is source-locked, static evidence remains `REQUIRES_CORE_LEAN`, and browser payload cannot self-certify Lean trust. This is a source-level/regression conclusion; no external runtime or Lean-kernel run is claimed. |
| `QA-LEC-002` | High | `CLOSED_VERIFIED` | `leanChallenge.agentBoundary.test.ts` 6/6 and independent source review of the pure domain: challenge requires explicit human identity plus exact advisory/source fingerprints; contradiction creates immutable `AGENT_COMPETENCE_CONFLICT` / `TRAINING_REQUIRED`; boundary inspection forbids Lean claim, writer, self-approval and training executor. | The approved **quarantine contract** is present. No agent execution, model training, memory rewrite or competence promotion was added. |
| `QA-LEC-003` | High | `CLOSED_VERIFIED` | `leanVerification.ioc.topology.test.ts` 6/6, `leanVerification.adapters.contract.test.ts` 6/6, source scan: no direct network, process, secret, provider SDK, Docker, CI or browser storage dependency in the new domain; default verification returns unavailable/inconclusive. | `RicisLeanVerificationPort` is provider-neutral and fail-closed. No container, Actions, hosted endpoint or attestation ingestion is provisioned. |
| `QA-LEC-004` | High | `CLOSED_VERIFIED` | Adapter tests 6/6 and source review reject no-consent upload, unsafe hosted profiles, transcript authority and cross-origin popup result; the only `postMessage` token is an explicit input-rejection marker, not a browser API call. | AXLE and Lean Web remain unintegrated future adapters. No source left the application and no popup or external request was made. |
| `QA-LEC-release-01` | High | `CLOSED_VERIFIED` | `npm run lint` passed; targets 6 files / 36 tests passed; store/persistence/target integration 8 files / 51 tests passed; final `npm test` 77 files / 543 tests passed; `npm run release:check` 12/12 passed; `npm audit --audit-level=moderate` reported 0 vulnerabilities; `GITHUB_PAGES=true npm run build` passed; `git diff --check` passed; static scope review captured in `LEAN-EVIDENCE-CONSENT-01_QA_RELEASE_DIFF_2026-08-25.txt`. | Candidate satisfies G1–G3 source/consent/IoC boundaries and release metadata consistency. Separate explicit publication approval is still mandatory. |

> **Known and retained boundaries:** the Pages build reports the pre-existing non-blocking `Map3D` chunk advisory (1,505.99 kB minified versus 500 kB warning threshold). The sandbox uses Node 22.13.0/npm 10.9.2 while project engines specify Node `>=22.22.2 <23` and npm `>=12.0.2`; local gates are not CI-engine conformity. Lean compilation, AXLE/Lean Web upload, popup interaction, Docker/CI provisioning, AI execution and retraining were not performed. `RICIS-LEAN-PASSPORT-01` remains separately blocked/uncommitted and is not included in this candidate.

**Score impact:** no new process credit or debit. `QA-LEC-001` originated from the user rather than a QA discovery; the low-severity Lean Passport test-contract credit remains separate. Implementer stays **100**; Independent QA stays **105**. These are process-only metrics, not compensation.

**Publication gate:** `AWAITING_EXPLICIT_USER_COMMIT_PUBLISH_OK` for `LEAN-EVIDENCE-CONSENT-01 v0.4.44` only.


## LEAN-EVIDENCE-CONSENT-01 post-publication convergence — 2026-08-25

| QA ID | Severity | Status | Evidence | Conclusion |
|---|---:|---|---|---|
| `QA-LEC-postpublish-01` | High | `CLOSED_VERIFIED` | `HEAD == origin/main == 123248d7e0a92b34327ca9827e7a762c8f6f89b0`; detached worktree status is clean; GitHub commit API returns the same SHA and message `fix(lean): preserve user evidence consent`. | Published `main` exactly matches the reviewed v0.4.44 Lean-consent candidate. No escaped defect or process-score change is recorded. |


## RICIS-LEAN-PASSPORT-REVALIDATION-01 QA planning record — 2026-08-25

**Status:** `ACTIVE_G4_RED_BASELINE`
**Classification:** This is a fresh **planning/control record**, not a new defect finding. The published consent remediation QA closure and the scorecard remain unchanged.
**Baseline:** Published `123248d7e0a92b34327ca9827e7a762c8f6f89b0` (`v0.4.44`) and new clean detached G4 worktree `/home/ubuntu/ricis3-lean-passport-revalidation-g4`, with `HEAD == origin/main == 123248d7e0a92b34327ca9827e7a762c8f6f89b0`. The uncommitted old candidate `/home/ubuntu/ricis3-lean-passport-g4` at `f8c8260` is quarantined reference-only.

| QA ID | Type | Severity | Status | Mandatory control | Evidence basis | Independent QA action |
|---|---|---|---|---|---|---|
| QA-LPR-G1-PLAN | G1/G2 revalidation planning | N/A | `CLOSED_VERIFIED` | Passport is specified as a read-only projection of canonical v0.4.44 consent records; old candidate transfer is prohibited. | Approved G1/G2 specifications; clean baseline `HEAD == origin/main == 123248d`; quarantine path recorded in task register. | Boundaries are carried into G3; no production/test code exists. |
| QA-LPR-G2-PLAN | Canonical ownership / DRY | N/A | `CLOSED_VERIFIED` | G2 confines Passport to canonical record projection; no Passport-owned SHA-256, source capture, idempotency map, append-only evidence ledger, lifecycle, provider selection, decision application, state/proof/axiom writer or authority correlation writer. | Published `leanEvidenceConsent.domain.ts`; G2 canonical mapping/one-way read-port topology; G3 cases LPR-QA-01…07, 32…35. | Await G3 approval; no executable test or implementation yet. |
| QA-LPR-G2-BOUNDARY | Authority / consent / provider separation | N/A | `CLOSED_VERIFIED` | Static/hosted/manual/agent diagnostics are not Lean authority; human decisions are view-only; `TRAINING_REQUIRED` remains quarantine; unavailable stays fail-closed. No Lean/AI/provider/popup/source-upload operation is in scope. | Published v0.4.44 consent/IoC contracts; G2 classifier/IoC constraints; G3 cases LPR-QA-08…22 and 32…34. | Await G3 approval; no executable test or implementation yet. |
| QA-LPR-G2-DISCLOSURE | Provenance / privacy / compatibility | N/A | `CLOSED_VERIFIED` | Exact user source/Lean/TeX and owner-authorized RICIS III/P=NP evidence remain untouched; safe display is escaped/redacted; legacy `externalLean` is immutable provenance unless exact canonical correlation exists. | G1/G2 boundaries; OIR/LEC published regressions; G3 cases LPR-QA-23…31 and 36…40. | Await G3 approval; no executable test or implementation yet. |
| QA-LPR-G3-BASELINE | Fresh test plan | N/A | `ACTIVE_G4_RED_BASELINE` | G3 is approved; a fresh detached worktree at `123248d` exists for 40 independent LPR-QA cases and a red baseline. No old Passport test/code/metadata transfer is permitted. | Approved G3 specification; `HEAD == origin/main == 123248d`; clean G4 worktree evidence. | Author fresh tests and assess red baseline; production implementation remains prohibited until QA classification. |

**Score impact:** **none**. No new reproducible defect, QA discovery credit, implementation debit or escaped-defect assessment is asserted. Implementer remains **100** and Independent QA lane remains **105**, solely as the existing process-only measure.

### RICIS-LEAN-PASSPORT-REVALIDATION-01 G4 red-baseline evidence — 2026-08-25

| QA ID | Severity | Status | Independent evidence | Conclusion / next QA action |
|---|---:|---|---|---|
| `QA-LPR-001` | N/A | `CLOSED_VERIFIED` | Fresh detached worktree `/home/ubuntu/ricis3-lean-passport-revalidation-g4` was created only after G3 approval and has `HEAD == origin/main == 123248d7e0a92b34327ca9827e7a762c8f6f89b0`. The four newly authored tests contain exactly **40** unique `LPR-QA-01…40` labels and their initial hashes are logged. `npm ci --ignore-scripts` passed with 0 vulnerabilities; the known Node/npm engine warning was recorded separately. `npm run lint` passed. The four target files then produced **4 failed files / 40 failed tests**, exactly **40** matching missing-module errors for `leanPassportProjection.domain`, with **0** `ENOENT`, TypeScript, reference or runtime-error markers. Nine published consent/state/store/persistence/OIR boundary files passed **9/9 files / 57/57 tests**. No production module exists; status contains only the new test directory; no old-candidate path reference is present; test diff hygiene passed. | The red baseline is valid and maps solely to the G2-approved missing pure read-only projection capability. Production implementation may begin only within the four-test/G2 module boundary. This is a QA gate result, not a defect or score event. |

**Baseline logs:** `evidence/LPR_G4_NPM_CI_2026-08-25.log`, `evidence/LPR_G4_RED_LINT_2026-08-25.log`, `evidence/LPR_G4_RED_TARGET_2026-08-25.log`, and `evidence/LPR_G4_RED_RELATED_2026-08-25.log` under `/home/ubuntu/ricis_review`.

**Score impact:** **none**. The fresh test-harness duplicate was corrected before baseline classification and is recorded only as a test-authoring correction, not a reproducible product defect. Implementer remains **100** and Independent QA remains **105**.

### RICIS-LEAN-PASSPORT-REVALIDATION-01 independent G4/release review — 2026-08-25

| QA ID | Severity | Final status | Independent evidence | Conclusion |
|---|---:|---|---|---|
| `QA-LPR-002` | High | `CLOSED_VERIFIED` | Fresh red baseline `QA-LPR-001` was valid. New pure `leanPassportProjection.domain.ts` and four fresh test files pass all **4 files / 40 LPR-QA cases**. Source scan finds zero static imports, no provider/browser/network/process/Core/agent/WASM/legacy-candidate runtime token and no candidate-path transfer reference. One production module and four test files are the complete new feature scope. | Canonical read-only projection respects DRY ownership: no duplicate hash/idempotency/evidence lifecycle, source capture, provider, writer, state/trust mutation, Core/agent/Lean execution or old-candidate transfer. |
| `QA-LPR-003` | High | `CLOSED_VERIFIED` | Selected published consent/state/store/persistence/OIR suites passed **9 files / 57 tests** after implementation. Full suite passed **81 files / 583 tests**. | Published v0.4.44 consent preservation and OIR source/provenance boundary remain green. No automatic demotion, browser self-certification or source replacement was introduced. |
| `QA-LPR-release-01` | High | `CLOSED_VERIFIED` | `npm run lint`, target 4/40, related 9/57, `npm test` 81/583, `npm run release:check` 12/12, `npm audit --audit-level=moderate` (0 vulnerabilities), `GITHUB_PAGES=true npm run build`, and `git diff --check` all passed. Release scope contains package/lockfile/runtime version, README, CITATION, JSON-LD, three evidence headers, task log, one pure module and four fresh tests. | Candidate v0.4.45 satisfies G1–G3 and release policy locally. The only build observation is the pre-existing non-blocking Map3D 1,505.99 kB minified chunk advisory. Sandbox Node 22.13.0/npm 10.9.2 remains below declared Node >=22.22.2/npm >=12.0.2 and is not presented as CI-engine conformity. |

> **Authority conclusion:** No Lean compiler/kernel, external provider/API, source upload, popup, AI execution, Core execution or retraining was run. The red/green TypeScript and Vitest evidence does **not** constitute Lean verification. `RICIS III solved`, owner-authorized P=NP basis, source identity, user Lean/TeX and v0.4.44 consent ownership remain unchanged.

**Score impact:** **none**. QA-LPR-002/003/release-01 are required conformance/retest controls, not new discovered or escaped defects. Implementer remains **100** and Independent QA remains **105**; these are process-only values.

### RICIS-LEAN-PASSPORT-REVALIDATION-01 post-publication convergence — 2026-08-25

| QA ID | Severity | Status | Evidence | Conclusion |
|---|---:|---|---|---|
| `QA-LPR-postpublish-01` | High | `CLOSED_VERIFIED` | Explicit user publication confirmation was obtained. `HEAD == origin/main == 512ce86c24e8c3199ee07b78d46a18250a3da7f2`; published GitHub API returns the same SHA and message `feat(lean): add read-only evidence passport projection`; worktree porcelain status is clean; manifest version is `0.4.45`. | Published `main` exactly matches the independently reviewed v0.4.45 revalidation candidate. No escaped defect, scope drift or process-score change is recorded. |

**Score impact:** **none**. Implementer remains **100** and Independent QA remains **105** as process-only metrics. Published status does not create a Lean-kernel claim.

## AGENT-RICIS-01 G1 revalidation planning record — 2026-08-25

**Status:** `AWAITING_G1_OK`
**Classification:** Document-only safety planning, not a new defect finding or a claim that the inventoried server/training paths were executed. Published consent/Passport QA scores and closures remain unchanged.

| QA ID | Type | Severity | Status | Mandatory control | Evidence basis | Next QA action |
|---|---|---|---|---|---|---|
| QA-AR-G1-PLAN | Agent authority revalidation | N/A | `AWAITING_G1_OK` | First increment must be a pure typed non-authoritative advisory domain. It cannot invoke a model/provider, prompt transport, Lean/Core, popup, browser storage or state/proof/axiom/trust writer. | Revised G1; published v0.4.44 consent, v0.4.45 Passport and `a6Evidence` evidence-scope contracts. | Obtain revised G1 approval before drafting G2. |
| QA-AR-G1-PROVENANCE | Source and proof containment | N/A | `AWAITING_G1_OK` | No generic/canonical proof generation or repair, `Proof`/`latex`/`externalLean` rewrite, user Lean/TeX replacement, P=NP regeneration or legacy candidate/template import. | Published OIR preservation; static inventory of `/api/generateProof` canonical fallback. | G2 must define source/no-writer topology; G3 must test exact preservation and fallback rejection. |
| QA-AR-G1-TRAINING | Competence/training quarantine | N/A | `AWAITING_G1_OK` | Existing count-derived `AgentTrainingMemory`/`trainingAccuracy` cannot be proof/competence evidence. Exact contradiction remains `TRAINING_REQUIRED`, `effective: false`, without training/memory/state/proof effect. | Published `leanEvidenceConsent` challenge/conflict boundary and `src/model/agent.ts` inventory. | G2 must keep training outside scope and expose only read-only conflict correlation. |

**Score impact:** **none**. Implementer remains **100** and Independent QA remains **105**, solely as process-only metrics.

### AGENT-RICIS-01 G3 draft — 2026-08-25

| QA ID | Classification | Status | Planned evidence | Gate condition |
|---|---|---|---|---|
| `QA-AR-001` | Fresh red-baseline validity | `AWAITING_G3_OK` | Four newly-authored target files / **44** cases; lint green; all red outcomes must be only the absence of `agentRicisAdvisory.domain`; selected published consent/Passport/OIR/store/state/persistence regressions green. | No G4 implementation unless independent QA closes valid red baseline. |
| `QA-AR-002` | Target/scope review | `AWAITING_G3_OK` | Target 4/44, immutable result algebra, topology scan, one production module and no unapproved route/metadata scope. | No broad server, training, provider or writer work. |
| `QA-AR-003` | Published-boundary regressions | `AWAITING_G3_OK` | Consent/Passport conflict, OIR provenance, state/store/persistence and full suite after green target. | No source/state/trust regression. |
| `QA-AR-release-01` | Candidate release review | `AWAITING_G3_OK` | New post-v0.4.45 patch, lint, release consistency, audit moderate, Pages build, diff hygiene, independent scope review and separate publication approval. | No publication before fresh local gates and user approval. |

**Score impact:** **none**. This is a planning matrix; it creates neither a defect nor a Lean/Core/agent-authority claim. Implementer remains **100** and Independent QA remains **105** as process-only values.

### AGENT-RICIS-01 G4 fresh red-baseline review — 2026-08-25

| QA ID | Severity | Status | Evidence | Decision |
|---|---:|---|---|---|
| `QA-AR-001` | High | `CLOSED_VERIFIED` | Fresh G4 worktree starts at `HEAD == origin/main == 512ce86…` v0.4.45 and has only four untracked future target tests. `npm run lint` is green. Target run is exactly **4 failed files / 44 failed tests**, with **44** matching absent `agentRicisAdvisory.domain` module errors, zero `ENOENT` and zero assertion/type/reference/syntax markers. Inventory has exactly 44 unique, non-duplicated `AR-QA` IDs and zero production modules. Selected published consent/Passport/OIR/store/persistence/agent regressions are green: **9 files / 66 tests**. | Valid red baseline. Only the single G2-approved pure `src/agentRicis/agentRicisAdvisory.domain.ts` may now be authored. No provider/model/AI/Lean/Core/popup/source-upload/training/legacy-route/migration/UI/store/persistence/release activity is authorized. |

**Score impact:** **none**. The one test-harness TypeScript cast correction occurred before baseline validation and is not an implementation defect. Implementer remains **100** and Independent QA remains **105**, process-only.

### AGENT-RICIS-01 independent G4/release review — 2026-08-25

| QA ID | Severity | Final status | Independent evidence | Conclusion |
|---|---:|---|---|---|
| `QA-AR-002` | High | `CLOSED_VERIFIED` | Fresh targets passed **4 files / 44 tests**. Scope inventory contains exactly one production module and four fresh test files. Domain has zero static imports; forbidden provider/model/network/browser/Core/Lean/Passport/consent/store/persistence/proof-builder/training and old-candidate transfer scans are empty. | Approved pure advisory boundary is implemented without unapproved execution, writer, integration or legacy-route scope. |
| `QA-AR-003` | High | `CLOSED_VERIFIED` | Selected published consent/Passport/OIR/store/persistence/agent regressions passed **9 files / 66 tests**. Full suite passed **85 files / 627 tests**. | Published consent, Passport, OIR provenance, state/store/persistence and existing agent inventory behavior remain compatible. |
| `QA-AR-release-01` | High | `CLOSED_VERIFIED` | `npm run lint`, target 4/44, related 9/66, `npm test` 85/627, `npm run release:check` 12/12, `npm audit --audit-level=moderate` (0 vulnerabilities), `GITHUB_PAGES=true npm run build`, `git diff --check` and final untracked scope review passed. v0.4.46 metadata is synchronized in package/lock/runtime/README/CITATION/JSON-LD/three evidence headers/task log. | Candidate satisfies approved G1–G3 and local release policy. Known pre-existing Map3D chunk advisory remains disclosed; sandbox Node 22.13.0/npm 10.9.2 remains below declared CI engine contract and is not CI-engine conformity. |

> **Authority conclusion:** No model/provider/AI call, prompt transport, Lean compiler/kernel, Core/WASM, popup, source upload, training/retraining or legacy-route remediation was run. Passing TypeScript/Vitest checks do **not** claim Lean verification, Core execution, RICIS theorem authority or agent competence certification. Owner-authorized P=NP, RICIS III v7.7 and user Lean/TeX remain unchanged.

**Score impact:** **none**. The three recorded QA-harness corrections occurred before final target green, maintained the approved 44 IDs and production scope, and are not implementation defects. Implementer remains **100** and Independent QA remains **105** as process-only metrics.

### AGENT-RICIS-01 post-publication convergence — 2026-08-25

| QA ID | Status | Evidence | Conclusion |
|---|---|---|---|
| `QA-AR-postpublish-01` | `CLOSED_VERIFIED` | Local `HEAD`, `origin/main` and GitHub API `main` are all `2c8dbc66c911b8de70bb617e26a32bbf7083f309`; GitHub subject is `feat(agent): add source-bound advisory boundary`; GitHub `package.json` reports `0.4.46`; isolated release worktree is clean. | Reviewed v0.4.46 candidate converged to published `main` without post-QA drift. |

**Score impact:** **none**. Post-push convergence is a release control, not a fabricated defect or bonus.

### LOCAL-RICIS-02 revised G1 planning — 2026-08-25

| QA focus | Status | Required future evidence |
|---|---|---|
| Homogeneous A6/A7 eligibility | `AWAITING_G2_OK` | Closed typed AST discriminator; recursive payload reduction; L0/L1/SP2/SP3/SP4 order; exact scalar tag and finite semantic keys. |
| A6/A7 structural outputs | `AWAITING_G2_OK` | A6 returns typed structural `F × G`; A7 returns indexed infinity over typed structural `F − G`; no evaluation, scalarization, limit, L’Hôpital, NaN, proof or trust claim. |
| Type-composite safety | `AWAITING_G2_OK` | Vector/matrix/mismatch/absent-morphism paths retain `TYPE_PROMOTION_OR_COMPOSITE_DEFERRED` or current non-applicability; no generic composite invention. |
| Published-boundary preservation | `AWAITING_G2_OK` | LRS01–LRS17 regression, explicit recovery admission, local-only provenance, no Core/Lean/agent/provider/network/store/persistence/UI integration. |
| Fresh QA/release discipline | `AWAITING_G2_OK` | New G4 worktree, fresh red tests only after G3, valid missing-capability red baseline, independent regressions/release gates, patch after v0.4.46 and separate publish approval. |

**Score impact:** **none**. This G1 planning record creates neither an implementation defect nor an authority claim. Implementer remains **100** and Independent QA remains **105** as process-only values.

### LOCAL-RICIS-02 G3 draft — 2026-08-25

| QA record | Status | Evidence and gate |
|---|---|---|
| `QA-L02-G3-PLAN` | `AWAITING_G3_OK` | `LOCAL-RICIS-02_STEP3_QA_SPEC.md` defines **50** unique `L02-QA-01…050` cases in four future fresh test files: 14 closed A6/A7 AST contracts, 12 rule-order/source-identity controls, 12 type/composite/forbidden-semantics negatives and 12 topology/regression/release controls. A valid red baseline must be 50 missing-approved-capability failures only, with lint and published regressions green. |

**Score impact:** **none**. This is independent QA planning only; it creates no defect, implementation result or authority claim. Implementer remains **100** and Independent QA remains **105** as process-only values.

### LOCAL-RICIS-02 gate-record correction — 2026-08-25

| QA ID | Status | Evidence | Conclusion |
|---|---|---|---|
| `QA-L02-GATE-01` | `CLOSED_PROCESS_CORRECTION` | Initial verbal G2 and G3 approvals were present, but separate `LOCAL-RICIS-02_STEP2_ARCHITECTURE.md` had not yet been written. The record is now created; G3 references it and is set to `RECONFIRMATION_REQUIRED`. Fresh G4 worktree remains clean at `2c8dbc66…`; no target test or production file was created. | Strict G1→G2→G3 documentation sequence is restored before any G4 action. This is a process-record correction, not a mathematical, implementation, safety-boundary or release defect. |

**Score impact:** **none**. Implementer remains **100** and Independent QA remains **105** as process-only values.

### LOCAL-RICIS-02 independent G4 red-baseline review — 2026-08-25

| QA ID | Status | Evidence | Independent conclusion |
|---|---|---|---|
| `QA-L02-001` | `CLOSED_VERIFIED` | Fresh detached worktree began at published `2c8dbc66…` v0.4.46. Four newly authored target files contain exactly one each of `L02-QA-01…050`; `git diff --check` passed. | Test inventory is fresh, complete and contains no duplicate QA ID. |
| `QA-L02-002` | `CLOSED_VERIFIED` | `npm run lint` passed. Target run registered **4 files / 50 tests**, all 50 red solely with matching missing-module errors for `a6A7Homogeneous`; no `ENOENT`, TypeScript, assertion, syntax, type or reference defect remained. | The red baseline is valid for the approved missing capability. |
| `QA-L02-003` | `CLOSED_VERIFIED` | Selected published LOCAL-RICIS analyzer/reducer, consent, Passport, agent, OIR provenance, store, persistence and legacy-agent regressions passed **9 files** before implementation. | Published safety and provenance boundaries remain green at baseline. |

> **Authority conclusion:** The valid red baseline authorizes only the minimal G2-approved homogeneous-scalar A6/A7 structural extension. It does not authorize type promotion/composite implementation, Core/Lean/agent/provider/popup execution, proof/trust/state/axiom/consent/Passport mutation, source rewrite or mathematical authority claim.

**Score impact:** **none**. One test-harness TypeScript correction and six test gating corrections were completed before baseline classification; they are QA setup corrections, do not change the approved 50 IDs or production scope, and are not implementation defects. Implementer remains **100** and Independent QA remains **105** as process-only values.

### LOCAL-RICIS-02 independent G4 and release QA closure — 2026-08-25

| QA ID | Status | Exact evidence | Conclusion |
|---|---|---|---|
| `QA-L02-004` | `CLOSED_VERIFIED` | Target **4 files / 50 tests** and lint green after one pure helper, two rule labels/one phase label, the existing singularity-first seam and narrowly superseded LRS08 scalar expectation. | Approved A6/A7 homogeneous scalar scope is implemented; local output remains immutable AST and local-only provenance. |
| `QA-L02-005` | `CLOSED_VERIFIED` | Target + selected regression suite **13 files / 185 tests** green. Full suite **89 files / 677 tests** green. | LOCAL-RICIS analyzer/reducer and published consent, Passport, agent, OIR, store, persistence and legacy-agent boundaries regressions remain green. |
| `QA-L02-release-01` | `CLOSED_VERIFIED` | `release:check` **12/12**, `npm audit --audit-level=moderate` **0 vulnerabilities**, Pages build green, `git diff --check` green. | v0.4.47 candidate satisfies local repository gates. Existing build emits the known non-blocking Map3D chunk-size advisory; sandbox Node 22.13.0/npm 10.9.2 remains below declared CI engine contract. |
| `QA-L02-scope-01` | `CLOSED_VERIFIED` | Final inventory contains the one approved pure planner, minimal local reducer/contracts change, one updated superseded LRS08 and four fresh QA files. Static scan found no Core/Lean/agent/provider/network/browser/store/persistence/Passport/consent/proof/trust runtime dependency in the new planner. | No type-promotion/composite engine, external runtime, user source rewrite or authority escalation was introduced. |

> **Authority conclusion:** This local code evidence neither performs nor claims Lean kernel verification, Core execution, formal theorem verification, agent competence certification, proof/trust/state/axiom mutation, or any change to immutable RICIS III ontology, owner-authorized P=NP, user Lean/TeX or canonical consent/passport records.

**Score impact:** **none**. Implementer remains **100** and Independent QA remains **105** as process-only values.

### LOCAL-RICIS-02 post-publication convergence — 2026-08-25

| QA ID | Status | Evidence | Conclusion |
|---|---|---|---|
| `QA-L02-postpublish-01` | `CLOSED_VERIFIED` | Local `HEAD`, `origin/main` and GitHub API `main` all equal `948383943f679586f98040f6fa14d2d46dfcd9cb`; commit subject is `feat(local): add homogeneous scalar A6 A7 reduction`; worktree is clean and manifest is `0.4.47`. | Reviewed v0.4.47 candidate is converged and published. |

**Score impact:** **none**. Implementer remains **100** and Independent QA remains **105** as process-only values.

### CALC-EXP-01 G4B autonomous G1–G3 planning — 2026-08-25

| QA ID | Status | Planned independent control |
|---|---|---|
| `QA-CEG4B-001` | `PLANNED_AUTONOMOUS_G3` | Closed exact ten-descriptor inventory over the published fourteen-case calculator catalog; reject eleventh, bound, unknown and `registry-120` mapping. |
| `QA-CEG4B-002` | `PLANNED_AUTONOMOUS_G3` | Source commit/hash/semantic index, explicit relation identity/direction, four existing bindings and immutable output/provenance. |
| `QA-CEG4B-003` | `PLANNED_AUTONOMOUS_G3` | No proof/Lean/Core/agent/trust/state authority, no source rewrite/fuzzy relation/external calculator runtime and no forbidden topology import. |
| `QA-CEG4B-004` | `PLANNED_AUTONOMOUS_G3` | Fresh four-file/54-case red baseline, selected regressions, full gates, patch release evidence and post-push convergence. |

**Score impact:** **none**. Implementer remains **100** and Independent QA remains **105** as process-only values.

### CALC-EXP-01 G4B QA-harness correction and red-baseline re-test — 2026-08-25

| QA ID | Status | Evidence | Conclusion |
|---|---|---|---|
| `QA-CEG4B-red-01` | `SUPERSEDED_INVALID_HARNESS` | The previously recorded 54-failure run used `new Function('path', 'return import(path)')`. Vitest raised `TypeError: A dynamic import callback was not specified`; consequently those outcomes did not isolate an absent `calculatorGraphDescriptor.domain` capability. | **Not** a valid red baseline and **not** product-quality evidence. It is a QA harness/process correction only; G4B remains blocked from release classification until a valid re-test. |
| `QA-CEG4B-red-01R` | `CLOSED_VERIFIED_VALID_RED_BASELINE` | The module was moved aside non-destructively and restored. Lint passed; targets produced exactly **4 failed files / 54 failed tests** and **54** matching `Cannot find module ... calculatorGraphDescriptor.domain` errors. Dynamic-import callback, `ENOENT`, TypeScript, assertion, reference, syntax and other `TypeError` marker counts were all **0**. Integrity log records the exact v0.4.47 SHA, restored module, test SHA-256 values and `git diff --check`. | The corrected baseline cleanly isolates only the G2-approved missing pure projection capability. Implementation/re-test may continue inside this closed scope; this is application-test evidence only, not Lean/Core/calculator execution evidence. |
| `QA-CEG4B-red-02` | `GREEN_BASELINE_REGRESSIONS_PREVIOUSLY_RECORDED` | Published calculator catalogue plus consent/Passport/agent/OIR/store/persistence selected suite: **8 files / 81 tests** green before implementation. | This prior green-regression observation remains historical only; it must be re-run after valid red re-baselining and after implementation. |

**Score impact:** **none**. The harness correction is not a reproducible product defect or an escaped defect. Implementer remains **100** and Independent QA remains **105** as process-only values.

### CALC-EXP-01 G4B static-seed composition review — 2026-08-25

| QA ID | Severity | Status | Evidence | Conclusion |
|---|---:|---|---|---|
| `QA-CEG4B-G4-01` | Medium | `CLOSED_VERIFIED` | G2 requires a static seed adapter and physical graph presence. The strengthened existing `CEG4B-QA-47` first failed alone (**1 failed / 53 passed**) because the domain output was not yet composed into `initialMap`. The bounded `calculatorGraphDescriptor.seed.ts` plus static `initialMap` spreads then made target QA green: **4 files / 54 tests**; strict lint passed. | The ten closed nodes, ten explicit hierarchy edges and only their declared math/physics/informatics memberships now enter the canonical initial graph seed. No existing node object, catalog entry, proof/Lean/Core/trust payload, runtime, persistence, store, UI or external integration was changed. |
| `QA-CEG4B-G4-02` | High | `CLOSED_VERIFIED` | Published catalog, consent, Passport, agent, migration, persistence and map-store regression gate passed **18 files / 159 tests** after seed composition. | The static G4B addition does not regress the protected source, consent, provenance, agent or startup/hydration boundaries. This is application-test evidence only; no Lean/Core/calculator execution claim is made. |

**Score impact:** **none**. The missing static composition was detected and corrected before release by the approved QA contract, with no escaped defect or compensation/reputation consequence. Implementer remains **100** and Independent QA remains **105** as process-only values.

### CALC-EXP-01 G4B independent local release review — 2026-08-25

| QA ID | Severity | Final status | Independent evidence | Conclusion |
|---|---:|---|---|---|
| `QA-CEG4B-release-01` | High | `CLOSED_VERIFIED_LOCAL` | Corrected red baseline, target **4/54**, protected related **18/159**, final full suite **93/731**, strict lint, release check **12/12**, audit **0 vulnerabilities**, Pages build, tracked/untracked diff hygiene, forbidden-production scan and same-SHA upstream fetch all passed. The candidate diff contains only mandatory v0.4.48 metadata, the closed descriptor domain/seed/tests and narrow `initialMap` static composition. | The local candidate conforms to G1–G3 source/topology/authority limits. No source catalog or existing node payload is rewritten; no Core/Lean/agent/provider/calculator/browser/network/storage/state/proof/trust runtime is added. This is local application/release evidence only, not Lean/Core/calculator execution evidence. |

> **Known local observations:** Pages build retains the existing Vite native-config/`__dirname` advisory and large-chunk advisory. Sandbox Node `22.13.0`/npm `10.9.2` is below the declared Node/npm engine floor; local gates are not presented as CI-engine conformity. No commit, tag, push, publication, external source upload, Lean toolchain execution or external communication occurred.

**Score impact:** **none**. This is a required conformance/release review, not a new discovered or escaped defect. Implementer remains **100** and Independent QA remains **105** as process-only values.

### MARKET-RICIS-01 G3 QA-first baseline — 2026-08-25

| QA ID | Status | Evidence | Classification |
|---|---|---|---|
| `QA-MAR01-red-01` | `CLOSED_VERIFIED_FINAL_RED_BASELINE` | Final variable dynamic-import rebaseline after matcher-only clarifications. Strict lint passed; candidate module was moved aside and restored; exactly **4 failed files / 48 failed tests** and **48** matching missing-module errors. Dynamic callback, `ENOENT`, TypeScript, assertion, reference, syntax and other `TypeError` counts were **0**. Baseline SHA is `faf1b98…`; evidence is `MAR01_G3_FINAL_RED_*_2026-08-25.log`. | Valid absence proof for only the G2-approved pure source-bound assurance projection. Application-test evidence only; it makes no calculator, Core, Lean, agent, legal or certification claim. |
| `QA-MAR01-harness-01` | `CLOSED_MATCHER_CLARIFICATION` | Static QA controls originally treated the required HTTPS source provenance and source path `components` as runtime/UI output, and a broad text scan treated named `lean`/`agent` display lanes as forbidden imports. Controls were narrowed to structural output keys and import statements; no prohibited import or writer check was removed. | QA-only false-positive correction before release; no product defect, source identity change or score impact. |

**Score impact:** **none**. The first runner-absent attempt (`tsc: not found`) was an environment-preparation observation, not a product or harness defect; it was not classified as a baseline. Implementer remains **100** and Independent QA remains **105** as process-only values.

### MARKET-RICIS-01 v0.4.49 publication convergence — 2026-08-25

| QA ID | Status | Evidence | Classification |
|---|---|---|---|
| `QA-MAR01-release-01` | `CLOSED_VERIFIED_PUBLISHED` | Target **4/48**, related **21/207**, final full **97/779**, final lint, release consistency **12/12**, audit **0**, Pages build, scope/diff hygiene and local release review closed before stage. Exact frozen commit `b15d47bc6f46643c1c4c1d6d78be7ae85804d66c` was pushed after staged inventory excluded `/home/ubuntu/ricis_review`. Post-push `HEAD == origin/main == GitHub API main`; GitHub subject matches `feat(market): add source-bound assurance brief`; worktree is clean. | Published local application feature with source/authority boundaries intact. No calculator/Core/Lean/agent/provider execution, legal advice, compliance decision, certification or Lean kernel claim. |

**Score impact:** **none**. Release was clean; no new escaped defect or QA miss was found. Implementer remains **100** and Independent QA remains **105** as process-only values.

### INDUSTRIAL-RICIS-01 G3 QA-first baseline — 2026-08-25

| QA ID | Status | Evidence | Classification |
|---|---|---|---|
| `QA-IND01-red-01` | `CLOSED_VERIFIED_FINAL_RED_BASELINE` | After two superseded QA-only harness corrections (one strict negative-fixture type and one transformed-URL static loader), strict lint passed; production module remained absent; exactly **4 failed files / 50 failed tests** and **50** matching missing-module errors resulted. Dynamic callback, `ENOENT`, TypeScript, assertion, reference, syntax and `TypeError` markers were **0**. Baseline SHA `b15d47b…`, test hashes and diff hygiene are captured in `IND01_G3_FINAL_RED_*_2026-08-25.log`. | Valid absence proof for only the G2-approved four-record static industrial research context. Application-test evidence only; it makes no industrial/digital-twin/safety/control/calculator/Core/Lean/agent/legal/certification claim. |
| `QA-IND01-harness-01` | `SUPERSEDED_QA_ONLY` | The first absent-module attempt had a strict TypeScript fixture error; its first rerun had six unsupported transformed-URL loader `TypeError`s. Both were corrected before any production module existed; final baseline is authoritative. | QA process correction, not a product defect, source change or score impact. |

**Score impact:** **none**. Implementer remains **100** and Independent QA remains **105** as process-only values.

### INDUSTRIAL-RICIS-01 v0.4.50 local release review — 2026-08-25

| QA ID | Status | Evidence | Classification |
|---|---|---|---|
| `QA-IND01-release-01` | `CLOSED_VERIFIED_LOCAL` | Final red **4/50** absent-only; target **4/50**; related **26/258**; final full **101/829**; final lint; release consistency **12/12**; audit **0**; Pages build; scope/diff hygiene; external independent review. Upstream `origin/main` and GitHub API `main` both equal baseline `b15d47b…`. Candidate version is `0.4.50`; no commit/push at review time. | Locally release-ready static application projection. It is not a live digital twin, industrial/safety/control assessment, calculator/Core/Lean/agent execution, legal advice or certification. |

**Score impact:** **none**. The closed G4 review found no new escaped defect. Implementer remains **100** and Independent QA remains **105** as process-only values.

### INDUSTRIAL-RICIS-01 v0.4.50 publication convergence — 2026-08-25

| QA ID | Status | Evidence | Classification |
|---|---|---|---|
| `QA-IND01-release-01` | `CLOSED_VERIFIED_PUBLISHED` | Target **4/50**, related **26/258**, final full **101/829**, final lint, release consistency **12/12**, audit **0**, Pages build, scope/diff hygiene and independent review closed before stage. Exact frozen commit `b5007327f676a291a726c6b7d22d076e3110112d` was pushed after staged inventory excluded `/home/ubuntu/ricis_review`. Post-push `HEAD == origin/main == GitHub API main`; GitHub subject matches `feat(industrial): add source-bound research context`; worktree is clean. | Published static research-context application feature with source and authority boundaries intact. No live industrial twin/control/safety system, calculator/Core/Lean/agent/provider execution, legal advice or certification claim. |

**Score impact:** **none**. Release was clean; no escaped defect or QA miss was found. Implementer remains **100** and Independent QA remains **105** as process-only values.

### OIR-02 G3 QA-first baseline — 2026-08-25

| QA ID | Status | Evidence | Classification |
|---|---|---|---|
| `QA-OIR02-red-01` | `CLOSED_VERIFIED_FINAL_RED_BASELINE` | After one superseded test-only syntax correction, strict lint passed; production module remained absent; exactly **4 failed files / 44 failed tests** and **44** matching missing-module errors resulted. Dynamic callback, `ENOENT`, TypeScript, assertion, reference, syntax and `TypeError` markers were **0**. Baseline SHA `b500732…`, test hashes and diff hygiene are captured in `OIR02_G3_RED_RETEST_*_2026-08-25.log`. | Valid absence proof only for the G2-approved local diagnostic wrapper. It is not proof execution, Core/Lean verification, source/trust/state authority, agent/provider action or RICIS solution evidence. |
| `QA-OIR02-harness-01` | `SUPERSEDED_QA_ONLY` | First absent-module run had one QA assertion parenthesis syntax error, corrected before any production module existed. | QA process correction, not a product defect, source change or score impact. |

**Score impact:** **none**. Implementer remains **100** and Independent QA remains **105** as process-only values.

### OIR-02 G4 independent local release review — 2026-08-25

| QA ID | Status | Evidence | Classification |
|---|---|---|---|
| `QA-OIR02-G4` | `CLOSED_VERIFIED_LOCAL` | Final restored target **4 files / 44 tests**, protected OIR/Core/consent/Passport/agent/API/persistence/store regressions **44 files / 334 tests**, final full suite **105 files / 873 tests**, strict lint, release check **12 / 12**, audit **0 vulnerabilities**, Pages build, scope/diff hygiene and fresh remote baseline all pass. | Pure application boundary only. No Core execution, Lean kernel verification, proof/trust/source/state authority, agent/provider action or RICIS solution claim. |
| `QA-OIR02-release-01` | `CLOSED_VERIFIED_LOCAL` | `OIR02_G4_RELEASE_REVIEW_2026-08-25.md`; frozen v0.4.51 candidate passed release review before publication. | Local application-boundary evidence only; no CI-engine conformity, Lean/Core/kernel or authority claim. |
| `QA-OIR02-publish-01` | `PUBLISHED_CONVERGED` | Commit `eb29bfc175c936c184454b12e9d34a4259ed5f0f` (`feat(oir): clarify local diagnostic ownership`); local `HEAD`, `origin/main` and GitHub API `heads/main` returned the same SHA; worktree clean. | External review artefacts, user Lean/TeX/source data and authority boundaries were excluded from the commit. |

### OIR-03 G3 independent baseline — 2026-08-25

| QA ID | Status | Evidence | Classification |
|---|---|---|---|
| `QA-OIR03-red-01` | `CLOSED_VERIFIED_VALID_RED_BASELINE` | Fresh detached `HEAD == origin/main == eb29bfc…`; strict lint passed. The target suite reports **1 failed file / 36 tests: 12 expected red, 24 green**. The failures are only `OIR03-QA-01,02,08,09,11–15,21–23`: existing `auditMapRicisProofIntegrity()` rewrites an invalid proof through its canonical template. `Cannot find module`, ENOENT, TypeScript, syntax, TypeError, ReferenceError, ERR and dynamic-import-callback markers are all **0**. | Valid absence proof for the G2-approved audit source-preservation change only. It does not execute Lean/Core/provider/API, alter owner-authorized P=NP, establish an authority decision or prove a RICIS result. |
| `QA-OIR03-red-02` | `CLOSED_VERIFIED` | Test SHA `1f20ce…`; audit SHA `7c94b7…`; only one untracked test file and `git diff --check` clean. | Test contract is type-correct; green controls cover nested identity, preserved mode, state/axiom/edge observations, function-body authority negatives and protected-byte checks. |

**Score impact:** **none**. Implementer remains **100** and Independent QA remains **105** as process-only values.


## OIR-03 source-preserving legacy audit containment — branch-first QA record (2026-08-25)

| QA ID | Severity | Status | Independent evidence | Conclusion / next action |
|---|---:|---|---|---|
| `QA-OIR03-G3-01` | High | `CLOSED_VERIFIED` | Fresh `eb29bfc…` worktree, strict lint green; one 36-case target had exactly 12 approved legacy-rewrite/topology red failures and 24 green controls, with zero module/ENOENT/TypeScript/syntax/TypeError/reference/ERR/dynamic-callback markers. | Valid red baseline: only the approved audit source-rewrite containment was missing. |
| `QA-OIR03-G4-01` | High | `CLOSED_VERIFIED` | Target plus migration transition contract: 2 files / 42 tests; protected OIR/Core/consent/Passport/API/migration set: 13 files / 149 tests; scope scan confirmed protected published bytes for logic, OIR-02 diagnostic, Core policy/bridge, API, core rules and migration production source. | Existing `Proof`, `latex` and nested provenance are preserved; no protected authority or transport boundary changed. |
| `QA-OIR03-release-01` | High | `CLOSED_VERIFIED` | Final candidate full suite: 106 files / 909 tests; lint; release check 12/12; audit 0 vulnerabilities; Pages build; diff hygiene. `OIR03_G4_RELEASE_REVIEW_2026-08-25.md` records the exact 13-path repository scope and retained build advisories. | v0.4.52 candidate meets local G1–G4/release gates. Sandbox Node/npm remain below declared engine range; this is not CI-engine conformity. |
| `QA-OIR03-001` | Low | `CLOSED_VERIFIED` | First clean integration branch run failed only because `OIR03-QA-36` required the test file to be untracked. The test-only fix permits both reviewed dirty candidate paths and a clean committed integration state; feature target 1/36 then passed. | Pre-release QA caught a scope-test isolation defect. It never reached `main` or remote; no implementer escaped-defect debit applies. QA receives +1 process credit. |
| `QA-OIR03-integration-01` | High | `CLOSED_VERIFIED` | Delayed feature branch `oir-03-source-preserving-audit` is clean at `b23980f…`; its integration branch `integration/oir-03-v0.4.52` is clean at merge `9c04f6b…`. After the second merge, full suite is 106/909, lint and release check 12/12 pass. | Branch-first commit/merge procedure is complete locally. `origin/main` and GitHub API `main` both remain `eb29bfc…`; no push or publication occurred. |

> **Authority and publication boundary:** These checks are local TypeScript/Vitest/build evidence only. They do not run Lean, Core, a provider, an agent, a calculator or any external source transport; they do not establish a proof, Lean-kernel verification, source/trust/state authority or a mathematical result. The reviewed integration branch is ready only for a separately authorized main integration/push decision.

**Score impact:** Implementer remains **100**. Independent QA lane is **106** after the documented low-severity pre-release scope-test isolation discovery; this is a process metric, not compensation or reputation.


### OIR-03 post-publication convergence — 2026-08-25

| QA ID | Severity | Status | Evidence | Conclusion |
|---|---:|---|---|---|
| `QA-OIR03-postpublish-01` | High | `CLOSED_VERIFIED` | Explicit user direction to publish completed work; clean local `main` `HEAD == origin/main == GitHub API main == 45a4741638975f0f46d574a25e35a38b69d545cc`; GitHub subject `merge: release OIR-03 source preservation`; manifest version `0.4.52`; main worktree clean. Main integration validation passed 106 files / 909 tests, lint, release check 12/12, audit 0, Pages build and diff hygiene before push. | The reviewed OIR-03 v0.4.52 scope converged to GitHub `main` through feature → integration → main. No external continuity evidence entered Git. No escaped defect, authority claim or process-score change is recorded. |

> **Authority boundary:** The publication confirms versioned TypeScript application code only. It does not establish Lean-kernel verification, Core execution, a provider/agent run, a proof, source/trust/state authority or a mathematical conclusion.


## CALC-EXP-02 G3 fresh red-baseline review — 2026-08-25

| QA ID | Severity | Status | Independent evidence | Decision |
|---|---:|---|---|---|
| `QA-CE02-001` | High | `CLOSED_VERIFIED` | Fresh detached worktree `/home/ubuntu/ricis3-calc-exp02-g3` starts at `HEAD == origin/main == 45a4741638975f0f46d574a25e35a38b69d545cc`; `npm ci --ignore-scripts` completed with 0 vulnerabilities and recorded engine warning; strict lint passed. Three newly authored target files contain exactly **40** unique contiguous `CE02-QA-01…40` IDs. Target run is exactly **3 failed files / 40 failed tests**, with exactly **40** `Cannot find module` errors for only the approved future pure explorer domain and UI component, and zero `ENOENT`, TypeScript, assertion, reference, syntax, TypeError or `ERR_` markers. | Valid red baseline. Only the G2-approved pure calculator explorer domain, presentational calculator explorer UI, existing seed export, narrow NodeCard resolver composition and Map3D trigger are eligible for G4. |
| `QA-CE02-002` | High | `CLOSED_VERIFIED` | Published catalogue/descriptor/industrial/solution-card/OIR/authority related suite: **9 files / 107 tests** passed. Fresh status contains only the three test-only future contracts; no product domain or UI module exists. Test hashes and exact status are in `CALC_EXP02_G3_BASELINE_PROVENANCE_2026-08-25.log`. | Existing calculator provenance, source identity, industrial non-control disclosure and OIR/Core authority boundaries remain green before G4. |

> **Authority boundary:** The red baseline represents only missing read-only UI/domain capability. It does not execute a calculator or renderer, call an external URL, run Lean/Core, transmit source, operate a manipulator, make a safety/control decision, alter P=NP or create a proof/status/trust claim.

**Score impact:** none. This is a required G3 gate, not a newly discovered product defect or a compensation event.


## CALC-EXP-02 G4 implementation and regression review — 2026-08-25

| QA ID | Severity | Status | Independent evidence | Decision |
|---|---:|---|---|---|
| `QA-CE02-003` | High | `CLOSED_VERIFIED_LOCAL` | Approved G4 adds only: frozen descriptor export, pure `calculatorExplorer.domain`, presentational `CalculatorExplorer`, narrow `NodeCardDetails` resolver/disclosure, one `Map3D` Quick Actions trigger and the three G3 test files. Initial target pass exposed only an invalid UI test fixture shape; two fixture-only corrections were made before regression closure. Final target: **3 files / 40 tests** green; strict lint green. | The closed fourteen-case source-bound projection, exact `KINEMATIC → calculator-node-kinematic → J(q)` mapping, fail-closed launch result and non-control UI disclosure are verified locally. |
| `QA-CE02-004` | High | `CLOSED_VERIFIED_LOCAL` | Full suite initially caught `OIR03-QA-36` before release: its historical dirty-worktree allowlist omitted the new candidate. The reconciliation changes only that test's allowlist to enumerate exact paths under `--untracked-files=all`; `audit.ts`, all OIR/Core authority files and catalogue/industrial source files remain baseline-identical. Retest: target with OIR **4 files / 76 tests** green; final full **109 files / 949 tests** green; lint green; `git diff --check` green. | No escaped defect. The scope guard is stronger because untracked files are now enumerated individually; no product audit or authority semantic changed. |
| `QA-CE02-005` | High | `CLOSED_VERIFIED_LOCAL` | `CALC_EXP02_G4_SCOPE_2026-08-25.log`: protected `logic`, `legacyProofDiagnostic`, authoritative policy, Core bridge, API client, core rules, audit, calculator catalogue and industrial context byte-identical to v0.4.52. New pure domain/UI scan found no fetch, browser-open, storage, network, Lean, Core, agent, provider, industrial-control or safety/certification action. | G4 satisfies the read-only UI projection boundary. No calculator execution, external call, proof/status/trust/source mutation or manipulator operation occurred. |

**Score impact:** QA receives a positive pre-release detection for the legacy scope-test incompatibility; no escaped-defect debit. The G4 implementation receives no quality penalty because its authority boundary was maintained and the defect was isolated to an obsolete test candidate allowlist.


## CALC-EXP-02 branch-first publication convergence — 2026-08-25

| QA ID | Severity | Status | Evidence | Decision |
|---|---:|---|---|---|
| `QA-CE02-006` | High | `PUBLISHED_CONVERGED` | Delayed feature branch `feature/calc-exp-02-v0.4.53` commit `c0b912df681825c149580c2c464382a6a1dadf73` passed staged scope review. It was merged into delayed integration branch `integration/calc-exp-02-v0.4.53` commit `999145b2491122cd27e9328853e490b3f7a4d500`, whose clean integration gates passed: full **109/949**, lint, release check **12/12**, audit **0**, Pages build and diff hygiene. Verified integration then merged into local `main` and was pushed as `9afd3ff097e05e25f8c7b219300daa9bbe1cbf29`. | Branch-first policy satisfied. |
| `QA-CE02-007` | High | `PUBLISHED_CONVERGED` | Post-push: local `main` HEAD == `origin/main` == GitHub API `main` == `9afd3ff097e05e25f8c7b219300daa9bbe1cbf29`; local `main` worktree clean. External `/home/ubuntu/ricis_review` documentation and pinned-source inspection artefacts were not staged, committed or pushed. | Publication is complete. No Core/Lean/source/trust/state/calculator/control authority conclusion is implied. |

**Score impact:** publication/process quality is positive. The previously detected OIR scope-test incompatibility was caught and resolved before any feature, integration or main publication, so no escaped-defect debit applies.


## EDU-VIS-01 G3 valid red baseline — 2026-08-26

| QA ID | Severity | Status | Evidence | Decision |
|---|---:|---|---|---|
| `QA-EV01-001` | High | `VALID_RED_BASELINE` | Fresh detached worktree at v0.4.53 / `9afd3ff…`; strict lint green. Three G3-first target files yield exactly **3 files / 44 failed tests**, with exactly **44** `Cannot find module` errors for the absent pure trail/UI modules and zero ENOENT, TypeError, ReferenceError, SyntaxError, AssertionError, dynamic-callback or harness markers. IDs `EV01-QA-01…44` are contiguous. | G4 is authorised only within the closed G2 path inventory. |
| `QA-EV01-002` | Medium | `CLOSED_TEST_CONTRACT` | First selected regression run caught `OIR03-QA-36`: the existing full-untracked-file candidate guard properly rejected the new G3 tests. It was updated only to enumerate the exact three EDU-VIS test paths. Audit implementation and all protected-byte assertions remain unchanged. Retest selected boundaries: **9 files / 131 tests** green. | Positive QA detection before product change. No escaped defect and no authority scope expansion. |

**Score impact:** QA receives positive credit for the pre-G4 scope-guard detection. The red baseline contains no production source modifications; local lint/test evidence is not calculator execution, Lean verification, Core authority, source/state/trust decision or manipulator result.


## EDU-VIS-01 G4/release local review — 2026-08-26

| QA ID | Severity | Status | Evidence | Decision |
|---|---:|---|---|---|
| `QA-EV01-003` | High | `G4_GREEN` | Target **3/44**, protected **12/175**, full pre-metadata **112/993** green; exact G2 path review confirmed protected catalogue/card/Core/Lean/API/industrial bytes unchanged. | No product-scope defect found. |
| `QA-EV01-004` | Medium | `RELEASE_CANDIDATE_VERIFIED_LOCAL` | Post-metadata full **112/993**, lint, release check **12/12**, audit **0**, Pages build and diff hygiene green. Local browser preview showed the discoverable Quick Actions trigger and read-only trail without invoking any node/calculator/external action. | Candidate may enter delayed feature branch only. |

**Boundary:** local application-code and presentation checks are not Lean-kernel verification, calculator execution, Core output, mathematical proof, source/state/trust authority, safety assessment or manipulator operation. Declared engine mismatch remains a local-environment limitation, not CI conformity.


## EDU-VIS-01 publication and convergence — 2026-08-26

| QA ID | Severity | Status | Evidence | Decision |
|---|---:|---|---|---|
| `QA-EV01-005` | High | `PUBLISHED_CONVERGED` | Feature `4b7331ac09a005f39322a69f713e43c73b3af74d` → integration `a2d7e608e6530841dcd0b61fa0da1b6e422a56aa` → main `b6025c0deba14bb2398afa4cc1ca990a1a3f5ae4`; clean integration full **112/993**, lint, release check **12/12**, audit **0**, Pages build and diff hygiene green. | `HEAD == origin/main == GitHub API main == b6025c0…`; external review files remain uncommitted. |

**Authority conclusion:** publication delivers only the source-bound educational UI projection. It does not establish calculator execution, embedded rendering, manipulator control, industrial safety/certification, Core output, Lean-kernel verification, mathematical proof or source/proof/trust/state authority.

## COMMUNITY-READINESS-01 G1 boundary review — 2026-08-26

| QA ID | Severity | Status | Evidence | Decision |
|---|---:|---|---|---|
| `QA-CR01-G1-001` | High | `CLOSED_DOCUMENT_REVIEW` | Published `Map3D` invitation seam, `communityRewardsClient`, typed unavailable HTTP adapter, local Telegram simulator and disabled server routes were read statically. Official Telegram documentation confirms that a live webhook is HTTPS-delivered and may use the secret header; it is not enabled here. | Existing typed `503` / `authoritative: false` boundary remains correct; reject any demo credit, browser-only identity/ledger, live bot, external transport or authority expansion. |
| `QA-CR01-G1-002` | High | `CLOSED_SCOPE` | `COMMUNITY-READINESS-01_STEP1_BUSINESS_SPEC.md` defines Route A only: a local, read-only readiness notice. Routes involving real rewards or an external bot are deferred to separate G1s. | G2 may proceed only after a narrow architecture record; no score change, runtime QA claim, Lean/Core proof claim or external-service operation arises from G1. |

## COMMUNITY-READINESS-01 Route A G2 architecture review — 2026-08-26

| QA ID | Severity | Status | Проверенное архитектурное условие | Решение |
|---|---:|---|---|---|
| `QA-CR01-G2-001` | High | `CLOSED_DOCUMENT_REVIEW` | G2 определяет исключительно `existing availability status → pure Russian projection → controlled local notice`; единственный допустимый запрос остаётся существующим same-origin `GET /api/community-rewards/v1/status`. | Server adapter/client contract, reward application, Telegram routes, Core/Lean/proof/state/graph/catalogue/calculator/industrial paths исключены из diff inventory. |
| `QA-CR01-G2-002` | High | `CLOSED_CONTAINMENT` | Existing `communityRewardsApplication` содержит command/identity/ledger/risk/audit/notification semantics; G2 явно запрещает его import или composition. | G3 обязан доказывать static topology containment и absence of reward/account/referral semantics. |
| `QA-CR01-G2-003` | Medium | `CLOSED_ACCESSIBILITY_DESIGN` | Dialog обязан показывать critical disclosure при любой ширине, передавать copy action callback-ом и поддерживать keyboard close. | G3 обязан включить component tests для visible disclosures, controlled callbacks и focus/close behavior. |

**Влияние на process score:** отсутствует. Это архитектурный review, не обнаруженный runtime defect и не подтверждение production behavior, Lean/Core authority, proof, release readiness или внешней интеграции.

## COMMUNITY-READINESS-01 Route A G3 valid red — 2026-08-26

| QA ID | Severity | Статус | Доказательство | Решение |
|---|---:|---|---|---|
| `QA-CR01-G3-001` | High | `VALID_RED_BASELINE` | Fresh detached worktree at `b6025c0…`; after local dependency visibility bootstrap, strict lint passed. Three approved test-only files produced exactly **3 files / 44 failed tests** and exactly three approved `Cannot find module` families for absent pure projector/presentational component. | Valid red; no `TS2307`, `TS2578`, `ENOENT`, `SyntaxError`, `TypeError`, `ReferenceError`, assertion or harness defect was classified. |
| `QA-CR01-G3-002` | Medium | `CLOSED_TEST_CONTRACT` | First protected run caught existing `OIR03-QA-36`, which correctly rejected unreviewed untracked Route A tests. Only `audit.proofSynthesisContainment.test.ts` candidate allowlist was amended to name the exact three test paths; `audit.ts` and all authority sources stayed unchanged. | Positive pre-G4 QA detection; no escaped defect, release claim or authority expansion. |
| `QA-CR01-G3-003` | High | `CLOSED_PROTECTED_REGRESSION` | After exact allowlist amendment, selected protected suite passed **5 files / 50 tests**: typed status client, Map3D status seam, legacy rewards application, Telegram command boundary and OIR containment. | Narrow G4 may begin only in a fresh feature worktree and only within G2 inventory. |

**Влияние на process score:** QA detection `QA-CR01-G3-002` предотвращает unreviewed candidate-path widening до implementation. Это process-quality finding без автоматического денежного, репутационного или authority consequence.


## COMMUNITY-READINESS-01 v0.4.55 — публикация и convergence — 2026-08-26

| QA ID | Severity | Статус | Доказательство | Решение |
|---|---:|---|---|---|
| `QA-CR01-release-01` | High | `CLOSED_VERIFIED_LOCAL` | Feature G4: target **3/44**, protected **5/50**, full **115/1037**, strict lint, release consistency **12/12**, `npm audit` **0**, Pages/server build и diff hygiene passed. | Release candidate approved only as local application-code QA evidence; Node/npm below declared engine floors remains disclosed. |
| `QA-CR01-publish-01` | High | `PUBLISHED_CONVERGED` | Feature `0e9fa40` → integration `2dd1207` → published main `1a70ec8`; `HEAD == origin/main == GitHub API main`; clean main worktree. | Branch-first publication closed. External continuity files remained uncommitted. |

**Влияние на process score:** `QA-CR01-G3-002` remains the sole process-quality detection for this item: OIR candidate guard correctly rejected unreviewed test paths before the exact reviewed allowlist amendment. No production/audit-authority defect escaped. This QA record is not Lean verification, Core execution, reward-programme activation, identity/ledger confirmation, Telegram/webhook activity or RICIS proof/state authority.


## P-10A Coverage G1 baseline — 2026-08-26

| QA ID | Severity | Статус | Доказательство | Решение |
|---|---:|---|---|---|
| `QA-P10A-G1-001` | Medium | `CLOSED_MEASUREMENT` | Published v0.4.55 full coverage run in temporary report directory: **115 files / 1037 tests passed**; 86 instrumented source files; statements **63.74%**, branches **60.69%**, functions **72.50%**, lines **66.04%**. Main worktree remained clean. | Baseline only; no global threshold, CI contract or release claim created. |
| `QA-P10A-G1-002` | Medium | `CLOSED_SCOPE_SELECTION` | `useMobileLayout` is 30 lines, 14.29% statements (2/14), 20% functions (1/5), lacks lifecycle/listener/cleanup coverage and has no Core/Lean/proof/source/trust/state/calculator/provider/server dependency. | P-10A selects only test-only mobile-layout lifecycle harness. Larger adaptive UI/storage, Three/canvas, physics, persistence, graph/API and authority-sensitive files remain deferred/separately scoped. |

**Влияние на process score:** отсутствует. Coverage percentage и test outcome являются application QA measurement только; они не подтверждают RICIS ontology, P=NP, Lean kernel, Core execution, proof, source/trust/state decision, calculation, safety or external service.


## P-10A Coverage G2 architecture — 2026-08-26

| QA ID | Severity | Статус | Доказательство | Решение |
|---|---:|---|---|---|
| `QA-P10A-G2-001` | Medium | `CLOSED_ARCHITECTURE_REVIEW` | G2 limits all future diff to `src/hooks/useMobileLayout.test.ts`: deterministic test-local `matchMedia` double, mounted React probe and six lifecycle contracts. | No production hook/API/media query/config/threshold change is permitted. |
| `QA-P10A-G2-002` | High | `CLOSED_AUTHORITY_CONTAINMENT` | The harness may create only in-memory media-query events and restores `window.matchMedia` after every test. | No storage/navigation/network/timer/provider/connector/calculator/Core/Lean/proof/source/trust/state action enters P-10A. |

**Влияние на process score:** отсутствует. Это document-only test architecture; не является coverage result, release evidence, Lean/Core result или authority claim.


## P-10A Coverage G3 green baseline — 2026-08-26

| QA ID | Severity | Статус | Доказательство | Решение |
|---|---:|---|---|---|
| `QA-P10A-G3-001` | Medium | `CLOSED_TEST_HARNESS_DEFECT` | First target run passed 10/10, but lint caught `TS2790` in test-only cleanup (`delete` operand). | Replaced only harness cleanup with `Reflect.deleteProperty`; no production source changed. |
| `QA-P10A-G3-002` | Medium | `CLOSED_SCOPE_GUARD_DETECTION` | First full run triggered `OIR03-QA-36` because modified `useMobileLayout.test.ts` was not yet reviewed in candidate allowlist. | Added only exact `M src/hooks/useMobileLayout.test.ts` to test-only allowlist; `audit.ts` unchanged. |
| `QA-P10A-G3-003` | High | `VALID_GREEN_BASELINE` | Final lint passed; target **1/10**, temporary hook coverage **92.85% statements / 87.50% branches / 100% functions / 100% lines**, protected **7/95**, full **115/1043**, diff check green. | Fresh G4 may contain only two reviewed test files. |

**Влияние на process score:** two pre-G4 detections were contained before feature implementation. This is application-test evidence only, not a global coverage threshold, Lean/Core verification, RICIS proof or source/trust/state authority claim.


## P-10A Coverage — публикация и convergence — 2026-08-26

| QA ID | Severity | Статус | Доказательство | Решение |
|---|---:|---|---|---|
| `QA-P10A-release-01` | Medium | `CLOSED_VERIFIED_LOCAL` | Feature and integration: target **1/10**, target V8 **92.85% / 87.50% / 100% / 100%**, protected **7/95**, full **115/1043**, strict lint, release consistency **12/12**, audit **0**, build and diff hygiene passed. | Test-only quality increment; version remains v0.4.55 and no global threshold was introduced. |
| `QA-P10A-publish-01` | High | `PUBLISHED_CONVERGED` | Feature `8a8624f` → integration `2cb0594` → main `b6b4dbb`; `HEAD == origin/main == GitHub API main`; main worktree clean. | Branch-first publication closed. External continuity files uncommitted. |

**Влияние на process score:** `QA-P10A-G3-001` and `QA-P10A-G3-002` remain positive pre-publication detections contained in test-only files. Published P-10A evidence is not a release-version claim, a global coverage threshold, Lean/Core verification, RICIS proof, calculator result, source/trust/state decision or external-service activity.


## CI-HISTORY-BASELINE-01 — GitHub Pages build repair — 2026-08-26

| QA ID | Severity | Статус | Доказательство | Решение |
|---|---:|---|---|---|
| `QA-CIHB-001` | High | `CLOSED_ROOT_CAUSE` | Pages runs through `b6b4dbb` failed 12 historical-byte tests on `git show <SHA>:<path>`; depth-one disposable clone reproduced unavailable historical objects. | Add full-history checkout only. |
| `QA-CIHB-002` | Medium | `CLOSED_SCOPE_GUARD_DETECTION` | First G4 full suite correctly rejected the new reviewed workflow path under OIR03-QA-36. | Added only exact test-only allowlist item; `audit.ts` unchanged. |
| `QA-CIHB-release-01` | Medium | `CLOSED_VERIFIED_LOCAL` | Lint, full **115/1043**, release **12/12**, audit **0**, Vite Pages build, YAML nesting and diff hygiene passed. | Candidate contains only workflow property + test-only guard allowlist. |
| `QA-CIHB-publish-01` | High | `PUBLISHED_CONVERGED` | Feature `ef42f9e` → integration `fbcbe6a` → main `e4a721c`; `HEAD == origin/main == GitHub API main`; GitHub Pages run `32939832954` completed `success`. | Build repair closed. |

**Влияние на process score:** historical baseline availability is now an explicit CI checkout property. This result is CI/build evidence only; it is not Lean/Core verification, a RICIS proof, global source authority decision, mathematical result, calculator execution or external-provider action.


## RICIS-LEAN-PASSPORT-01 — новый current G1 после инцидента — 2026-08-26

| QA ID | Severity | Статус | Доказательство | Решение |
|---|---:|---|---|---|
| `QA-LP01-G1-001` | Critical | `LEGACY_QUARANTINE_CONFIRMED` | Old pre-consent Passport candidate remains superseded; it has no current G2/G3/G4 authority. | New G1 starts from published incident-safe boundaries only. |
| `QA-LP01-G1-002` | Critical | `AUTHORITY_WRITER_DISABLED_CONFIRMED` | `acceptVerifiedExternalLeanProof` explicitly throws on browser evidence; `AuthoritativeProofStatePolicy` remains sole resolved-state decision owner. | Neither G1 route may change or bypass this boundary. |
| `QA-LP01-G1-003` | Medium | `READ_ONLY_GAP_IDENTIFIED` | Published Passport projection has zero mutation/verification/upload capabilities and no live application composition reference. | Two routes isolated: local read-only disclosure vs separately scoped source-bound session. |
| `QA-LP01-G1-004` | High | `DECISION_REQUIRED` | Route A and Route B differ in user-source/consent/persistence ownership. | Do not auto-select; explicit route selection required before G2. |

**Влияние на process score:** this is static G1 boundary evidence only. It is not Lean/Core execution, a proof result, consent record, human decision, source capture, external upload, browser action or authority transition.


## RICIS-LEAN-PASSPORT-ROUTE-B-01 — Source-Bound Session G1 — 2026-08-26

| QA ID | Severity | Статус | Доказательство | Решение |
|---|---:|---|---|---|
| `QA-LPB1-G1-001` | Critical | `SOURCE_OWNER_BOUNDARY_CONFIRMED` | Existing user source is fingerprinted/locked in map proof, while generic map snapshot persists proofs without dedicated Passport lifecycle semantics. | Passport may reference exact existing `nodeId + sourceFingerprint`; raw bytes may not be copied into a new store. |
| `QA-LPB1-G1-002` | Critical | `AUTHORITY_SEPARATION_CONFIRMED` | Static diagnostics preserve state; browser evidence acceptance is disabled; Core policy remains sole state decision owner. | Route B cannot call or import state/authority writers. |
| `QA-LPB1-G1-003` | High | `LEGACY_EXCLUSION_CONFIRMED` | Dirty old `lean-passport-g4` contains uncommitted source capture/persistence code and stale metadata from pre-incident baseline. | It remains quarantined and is excluded from Route B design and implementation. |
| `QA-LPB1-G1-004` | High | `LIFECYCLE_DECISION_REQUIRED` | B1 has no new persistence; B2 requires retention/export/delete/revocation policy before durable metadata exists. | Do not start G2 until user selects B1 or separately starts B2 data-lifecycle G1. |

**Влияние на process score:** Route B G1 is static ownership/lifecycle evidence only. It performs no source capture, user-data read, browser storage operation, Lean/Core execution, provider call, upload, consent write, human disposition or proof/state transition.


## RICIS-LEAN-PASSPORT-ROUTE-B1-01 — Ephemeral Source-Reference G2 — 2026-08-26

| QA ID | Severity | Статус | Доказательство | Решение |
|---|---:|---|---|---|
| `QA-LPB1-G2-001` | Critical | `NO_RAW_SOURCE_DUPLICATION_DESIGNED` | Pure B1 input is narrowed to `nodeId + sourceFingerprint + submittedAt + trustStatus + sourceLocked`; `Proof.latex`/source bytes are excluded. | G3/G4 must prove raw-source absence structurally. |
| `QA-LPB1-G2-002` | Critical | `NO_PERSISTENCE_DESIGNED` | Opening/closing session exists only as local controlled UI state; no ledger, map write, storage, analytics or URL. | Any durable record remains B2-only and requires separate data-lifecycle G1. |
| `QA-LPB1-G2-003` | Critical | `AUTHORITY_NEGATIVE_DEPENDENCIES_FROZEN` | Domain has empty imports; dialog is controlled; composition cannot touch Core/Lean/provider/state writers. | G3 topology tests must reject each protected import/token. |
| `QA-LPB1-G2-004` | Medium | `NARROW_UI_SEAM_SELECTED` | `EditNodeModal` already distinguishes `sourceLocked`; B1 control appears only for existing locked source. | No second source-submission route or state transition is designed. |

**Влияние на process score:** G2 is architecture evidence only. It does not create a Passport session, read raw user source, write consent, invoke static/Lean/Core verification, call a provider or change proof/state authority.


## RICIS-LEAN-PASSPORT-ROUTE-B1-01 — G3 valid-red — 2026-08-26

| QA ID | Severity | Статус | Доказательство | Решение |
|---|---:|---|---|---|
| `QA-LPB1-G3-001` | Medium | `TEST_HARNESS_DEFECT_CAUGHT_AND_CORRECTED` | Initial dialog red test referenced unavailable `@testing-library/react`; lint/target exposed it before baseline acceptance. | Replaced only test harness with existing ReactDOM + `act` pattern; no dependency, lockfile, config or production change. |
| `QA-LPB1-G3-002` | Critical | `VALID_RED` | Lint green; target has exactly 3 files / 44 approved absences: 17 pure-domain, 13 dialog, 14 EditNodeModal composition contracts. | G4 must close this exact inventory only. |
| `QA-LPB1-G3-003` | High | `OIR_SCOPE_GUARD_DETECTED_AND_NARROWED` | OIR03-QA-36 initially rejected three untracked B1 test paths; after exact test-only allowlist, protected suite is 9/105 green. | `audit.ts` unchanged; no wildcard or source rewrite. |
| `QA-LPB1-G3-004` | Critical | `NO_AUTHORITY_OR_SOURCE_OPERATION` | Full suite: 115 green files plus only three approved B1 red files; `git diff --check` green. | No source read/copy, persistence, consent write, Lean/Core/provider execution or state transition occurred. |

**Влияние на process score:** G3 valid-red is test specification evidence, not Lean verification, Core evidence, proof acceptance or durable Passport session.


## RICIS-LEAN-PASSPORT-ROUTE-B1-01 independent G4/local-release review — 2026-08-26

**Status:** `CLOSED_VERIFIED_LOCAL_PENDING_BRANCH_FIRST_PUBLICATION`. This entry assesses only the approved ephemeral source-reference increment. It does not authorize or report a Lean compiler run, Core execution, provider action, source upload, persistence, proof/state/trust decision, or publication.

| QA ID | Severity | Final status | Independent evidence | Conclusion |
|---|---:|---|---|---|
| `QA-B1-001` | Low | `CLOSED_VERIFIED` | The initial G3 UI test harness requested unavailable `@testing-library/react`; it was replaced before valid-red classification with the repository’s existing `react-dom/client` + `act` pattern. Later two static test assumptions were corrected after target execution; production behavior was not broadened. | The approved 44-case matrix is executable without a new dependency, package-lock change or non-B1 production workaround. This is a pre-release test-isolation correction, not an escaped product defect. |
| `QA-B1-002` | High | `CLOSED_VERIFIED` | Fresh target retest: **3 files / 44 tests** passed. Scope review found exactly the approved pure domain, controlled dialog, narrow `EditNodeModal` composition, three target tests, exact OIR candidate-path allowlist, and release metadata. Source scan found no raw-source/persistence/browser/network/popup/provider/Lean/Core/authority token in the B1 domain/dialog. Protected authority, map store, consent, canonical Passport projection, audit implementation, RICIS rules, Core bridge and API client have no diff. | B1 remains a metadata-only, fail-closed local reference view. It does not read/copy/store source or extend proof, source, trust, state, axiom, human or agent authority. |
| `QA-B1-003` | High | `CLOSED_VERIFIED` | Related protected regression passed **10 files / 119 tests**; final full suite passed **118 files / 1087 tests**. The OIR scope guard first rejected unreviewed new source paths, then passed only after an exact non-wildcard allowlist amendment; `audit.ts` stayed unchanged. | Published consent/provenance, mapStore external-Lean behavior, authoritative policy and canonical Passport boundaries remain compatible. |
| `QA-B1-release-01` | High | `CLOSED_VERIFIED_LOCAL` | `npm run lint`, `npm run release:check` (**12/12**), `npm audit --omit=dev --audit-level=high` (**0 vulnerabilities**), `npm run build`, and `git diff --check` all passed. `v0.4.56` is synchronized in package/lock/runtime/README/CITATION/JSON-LD/required evidence markers. Build retained only the known Vite config and chunk-size warnings. | Candidate satisfies approved G1–G3 and local release policy. Sandbox engine versions remain local evidence only, not CI-engine conformity. Branch-first integration must re-run clean QA before push. |

> **Authority conclusion:** Passing TypeScript/Vitest/build gates are application-code evidence only. They do **not** create Lean-kernel verification, Core evidence, a trusted proof, a human decision, workflow resolution, raw-source authority, or a RICIS mathematical claim. RICIS III v7.7, owner-authorized P=NP, existing user Lean/TeX identity, and the source-lock authority boundary remain unchanged.

**Score impact:** **none.** `QA-B1-001` was corrected before the valid-red baseline; QA-B1-002/003/release-01 are required conformance controls, not a new discovered or escaped product defect. Existing process-only scores remain unchanged.

**Next QA gate:** commit the reviewed feature, integrate it from fresh `origin/main`, repeat target/protected/full/release/audit/build/diff gates in the clean integration worktree, then verify non-FF main publication and GitHub convergence.


### RICIS-LEAN-PASSPORT-ROUTE-B1-01 post-publication convergence — 2026-08-26

| QA ID | Severity | Status | Evidence | Conclusion |
|---|---:|---|---|---|
| `QA-B1-postpublish-01` | High | `CLOSED_VERIFIED` | Feature `5637f46` → integration `ea83db9` → main `7b0e06fc3d419d3c4839d9560346b436115b7f4c`; `HEAD == origin/main == GitHub API main`; main/feature/integration worktree status is clean. [GitHub Pages run 32946711779](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/32946711779) for that SHA completed `success`; its build executed release alignment, tests, static build and artifact upload, then deployment succeeded. | The reviewed B1 v0.4.56 candidate converged to published `main` without post-QA scope drift. No escaped defect, process-score change, Lean/Core claim, source operation, persistence action or authority expansion is recorded. |

**Score impact:** **none.** Publication convergence is a release control, not a fabricated defect or compensation event. B1 is closed; any future B2 durable ledger work requires its own `G1B2-DATA-LIFECYCLE` decision.
