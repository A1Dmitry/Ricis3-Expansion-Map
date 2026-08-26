# RICIS Task Register

**Purpose:** Single continuity register for every RICIS task. Update this file before any task pause, priority change, G-gate transition, quality run, commit, publication or context handoff.
**Register status:** `ACTIVE`
**Last updated:** 2026-08-26 (GMT+3) — B1 v0.4.56 remains published/converged; selected B2-A account-ownership G1/G2 documents are complete and await independent G3 approval. No durable storage is approved.

**Canonical rule:** A task may move only through `G1 → G2 → G3 → G4 → separate publish approval`. A green product display must always state its exact basis and cannot mutate Core/Lean/proof authority.

## Status vocabulary

| Status | Meaning | Allowed next action |
|---|---|---|
| `DONE_PUBLISHED` | Quality-gated, committed and pushed. | Start dependent G1 only. |
| `ACTIVE_G4` | G1/G2/G3 approved; implementation in progress. | Implement only the approved scope and execute QA. |
| `AWAITING_PUBLISH_OK` | Implementation, independent QA and local release gates are closed; no commit/push is authorized yet. | Obtain explicit task-and-version-specific commit/publish approval only. |
| `READY_FOR_BRANCH_FIRST_PUBLICATION` | Implementation and independent local-release QA are closed, and a standing user authorization for autonomous publication is recorded. | Commit feature, integrate from fresh `origin/main`, repeat integration QA, non-FF merge to local `main`, push and verify convergence. |
| `AWAITING_G3_OK` | G3 red suite/spec prepared. | Obtain explicit G3 approval; no production implementation. |
| `AWAITING_G1_OK` | Business scope is drafted but unapproved. | Obtain explicit G1 approval. |
| `BACKLOG_G1` | Identified priority but no G1 artefact/approval. | Draft G1 only. |
| `G1_COMPLETE_DECISION_REQUIRED` | Evidence-complete G1 identifies a recommended route, but a product-path decision or documented G2 approval remains necessary. | Begin only the explicitly named G2 candidate; do not broaden to deferred alternatives. |
| `G1_APPROVED` | Business scope is evidence-complete and may move only to its explicitly bounded G2 design. | Produce the named G2 document; no production code. |
| `PAUSED_SEPARATE_SCOPE` | Deliberately isolated while another task has priority. | Resume at named gate only. |
| `BLOCKED_EXTERNAL_TOOLCHAIN` | Needs a reproducible external compiler/toolchain. | Obtain toolchain/evidence; never claim verification. |

## Active unfinished backlog — authoritative

> Этот раздел содержит **только незавершённые** задачи. Все опубликованные и локально закрытые инкременты сохранены ниже исключительно как historical continuity evidence и не являются active work.

| Priority | ID | Status | Current gate | Only permissible next action |
|---:|---|---|---|---|
| P1 | RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 | `G2_COMPLETE_AWAITING_G3_APPROVAL` | G1/G2 define B2-A account/tenant owner scope, closed metadata-only receipts, port topology, tenant isolation, lifecycle/retention/export/delete/revoke policy and fail-closed boundaries. | Obtain explicit `OK RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 G3`; no code/storage/auth integration before then. |

## Historical continuity record

> **CI-HISTORY-BASELINE-01 — PUBLISHED_CONVERGED:** GitHub Pages historical-checkout repair is published on unchanged `v0.4.55` in GitHub `main` at `e4a721cf629efe828ae57a921e9a2bcedb5ebb7d`; feature `ef42f9e` → integration `fbcbe6a` → main `e4a721c`; local/origin/GitHub API converge and Pages run `32939832954` is successful. This historical record is closed. The authoritative active table above contains only unfinished work.
>
> **RICIS-LEAN-PASSPORT-ROUTE-B1-01 — DONE_PUBLISHED_CONVERGED:** `v0.4.56` adds only an ephemeral read-only provenance-reference session for an already source-locked proof. Feature `5637f46` → integration `ea83db9` → main `7b0e06f`; local/origin/GitHub API main converge at `7b0e06fc3d419d3c4839d9560346b436115b7f4c`; GitHub Pages run `32946711779` succeeded. Target 3/44, protected 10/119, full 118/1087, lint/release/audit/build/diff and clean worktree checks passed. No raw source/persistence/Lean/Core/provider/authority action was added or run. B2 durable ledger remains separate and unstarted.

| Field | Value |
|---|---|
| Active task | `No implementation active — authoritative unfinished backlog governs next selection` |
| Gate | `CI-HISTORY-BASELINE-01 PUBLISHED_CONVERGED: Pages historical-byte guard checkout fixed; application version remains v0.4.55.` |
| Published baseline | `e4a721cf629efe828ae57a921e9a2bcedb5ebb7d` (unchanged `v0.4.55`), GitHub `main`; subject `merge: CI history baseline checkout`; Pages run `32939832954` success. |
| G1 scope | `OIR-02_STEP1_BUSINESS_SPEC.md`: make existing legacy local proof-document ownership explicitly `LOCAL_DIAGNOSTIC_ONLY` while preserving compatibility and strict Core/authoritative-state ownership. No Core/Lean/user-source/agent/provider/transport/UI/store/persistence/migration/catalog/graph authority or ontology change. Immutable RICIS III v7.7 and owner-authorized P=NP remain unchanged. |
| G1 artefact | `/home/ubuntu/ricis_review/OIR-02_STEP1_BUSINESS_SPEC.md` — autonomous document-only closed scope grounded in published `logic.ts`, Core policy/bridge and ownership trace. |
| Frozen scope / prohibition | OIR-02 G1 is document-only. Any G2 must remain an application-only legacy-diagnostic ownership boundary. It must not invoke/change Core/WASM/gateway, authoritative state policy, Lean/consent/passport, user Lean/TeX, agent/provider/model, `/api/generateProof` transport, UI/store/persistence/migration/catalog/graph, source/proof/trust/axiom authority or RICIS ontology. |
| G2 artefact | `/home/ubuntu/ricis_review/OIR-02_STEP2_ARCHITECTURE.md` — one pure injected legacy-document diagnostic wrapper and one `solveNodeLogic()` delegation; no Core/Lean/agent/provider/API/authority change. |
| G3 artefact / status | `/home/ubuntu/ricis_review/OIR-02_STEP3_QA_SPEC.md` — fresh 44-case independent matrix and final valid absent-module baseline; one test-only syntax defect is superseded history. |
| Published scope | `/home/ubuntu/ricis3-oir02-g4` has clean detached `HEAD` at published v0.4.51 `eb29bfc175c936c184454b12e9d34a4259ed5f0f`. The commit contains only `legacyProofDiagnostic`, narrow `logic.ts` delegation, four tests and mandatory release metadata; external review artefacts and user Lean/TeX/source bytes were excluded. |
| G1→G3 record | Published legacy `logic.ts`, legacy tests, strict Core bridge/state-policy contracts and captured caller topology were reviewed; G2/G3 were recorded under the active two-hour authorization. No Core/Lean/agent/provider/API/runtime operation occurred. |
| Red baseline / QA | `QA-OIR02-red-01 CLOSED_VERIFIED_FINAL_RED_BASELINE`: production module absent, strict lint green, exactly **4 failed files / 44 failed tests** and **44** missing-module errors only; dynamic-callback/TS/ENOENT/assertion/reference/syntax/TypeError counts are zero. A first test-only syntax error is superseded and did not alter G2 scope or production code. |
| Autonomy window | User authorized a two-hour Agile execution window: continue priority work and advance internal gates without intermediate `OK`; immutable RICIS/provenance/safety boundaries remain mandatory. |
| Email route check | Read-only connector inspection found built-in Gmail `9444d960-ab7e-450f-9cb9-b9467fb0adda` disabled/non-editable. No blocking question currently exists and no external email was sent. If a question becomes blocking, record it and use an enabled user-authorized route only. |
| G4 implementation / regression QA | `QA-OIR02-G4 CLOSED_VERIFIED_LOCAL`: wrapper returns only the exact injected local document plus frozen `LOCAL_DIAGNOSTIC_ONLY` envelope/false authority flags; one no-existing-proof `logic.ts` delegation retains partial state. Target **4/44**, protected **44/334**, final full **105/873** and strict lint all pass. Core/policy/API bytes remained unchanged; no external action or authority change was introduced. |
| Final QA / release | `QA-OIR02-release-01 CLOSED_VERIFIED_LOCAL`: release check **12/12**, audit **0**, Pages build, scope/diff hygiene and remote-baseline freshness passed. v0.4.51 metadata is synchronized. Local evidence is not CI-engine conformity, a proof, Core execution, Lean verification, trust/state decision or RICIS solution. |
| Publication / convergence | `QA-OIR02-publish-01 PUBLISHED_CONVERGED`: commit `eb29bfc175c936c184454b12e9d34a4259ed5f0f` was pushed as `main`; `HEAD == origin/main == GitHub API main`; subject `feat(oir): clarify local diagnostic ownership`; worktree clean. `/home/ubuntu/ricis_review` remains external and uncommitted. |
| Next priority | `RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 G2_COMPLETE_AWAITING_G3_APPROVAL`: B2-A authenticated ledger G1/G2 are document-complete. The only permissible next action is independent G3 approval; no durable storage is active and B1 remains the safe baseline. |
| Published-history pointer | Completed LEC v0.4.44, Passport v0.4.45 and AGENT v0.4.46 records remain preserved in their detailed sections below; quarantined old Passport candidate remains historical/reference-only. |
| G1 artefact | `/home/ubuntu/ricis_review/LEAN-EVIDENCE-CONSENT-01_STEP1_BUSINESS_SPEC.md` — `G1_APPROVED`; five static reset/demotion paths, immutable evidence/consent record, AI advisory, human challenge and competence-conflict/training-required lifecycle. |
| G2 artefact | `/home/ubuntu/ricis_review/LEAN-EVIDENCE-CONSENT-01_STEP2_ARCHITECTURE.md` — `G2_APPROVED`; pure ledgers, consent-gated state proposal, typed kernel correlation, challenge/competence quarantine, optional container/CI attestation adapters, hosted advisory/popup diagnostic adapters, and RICIS-owned provider-neutral API with IoC. |
| G3 artefact | `/home/ubuntu/ricis_review/LEAN-EVIDENCE-CONSENT-01_STEP3_QA_SPEC.md` — `G3_APPROVED`; 36 independent red/negative/provenance/release cases and six test-only red-baseline artefacts. |
| Priority review | `/home/ubuntu/ricis_review/RICIS_PRIORITY_RECALCULATION_2026-08-25.md` — active queue re-ranked; LEC P0 (110), blocked Lean Passport P0 dependent (88), AGENT P0 safety lane (81). |
| Fresh G4 baseline | `/home/ubuntu/ricis3-lean-consent-g4`, detached at exactly `f8c82602…`, clean before test creation; blocked v0.4.44 candidate remains separate and untouched. |
| Red baseline evidence | `npm run lint` passed; six target files red **36/36** solely on absent `leanEvidenceConsent.domain`; no ENOENT/TS/assertion/type/reference errors. Related boundary suite passed **5 files / 66 tests**. `QA-LEC-005` closed verified. |
| Release / QA evidence | v0.4.44: targets 6 files / 36 tests; store/persistence/target integration 8 files / 51; final full suite 77 files / 543; lint; release check 12/12; audit 0 vulnerabilities; Pages build; diff hygiene; `QA-LEC-001…004` and `QA-LEC-release-01` `CLOSED_VERIFIED`. No Lean/AI/provider/popup execution, retraining or kernel claim. |
| Publication result | Commit `123248d7e0a92b34327ca9827e7a762c8f6f89b0` (`fix(lean): preserve user evidence consent`) pushed to GitHub `main`; post-push `HEAD == origin/main`; worktree clean; GitHub API SHA/message match. |
| Required next action | Start a separate G1 only: recommended `RICIS-LEAN-PASSPORT-REVALIDATION-01 G1` from published v0.4.44, or user-selected backlog priority. |
| Published CALC-EXP commit | `9094236` — `feat(catalog): add source-bound green monolith cards` |
| CALC-EXP worktree | `/home/ubuntu/ricis3-calc-expansion`, clean and converged with `origin/main` |
| Old main worktree | `/home/ubuntu/ricis3-expansion-map` at `ed5f239`; its old untracked G3 test is superseded by the reviewed test in the fresh OIR worktree and must not receive implementation. |
| CALC-EXP authorization | G3, Wave A and separate publication approval received; published. |

## Task index

| Priority | ID | Status | Current gate | Scope boundary | Next permissible action |
|---:|---|---|---|---|---|
| P0 | CALC-EXP-01 G4A | `DONE_PUBLISHED` | Published v0.4.42 | Source-bound 14-case catalog, dual-green evidence, proof disclosure and read-only presentation for four existing bindings only. | Start separate G4B G1 only for physical-node/edge import. |
| P0 | OIR-01 | `DONE_PUBLISHED` | Published v0.4.43 | Removed source-free migration P=NP template substitution; source-bound payload is preserved byte-for-byte. | Start only a separate user-directed G1; recommended priority candidate: RICIS-LEAN-PASSPORT-01. |
| P0 | LEAN-EVIDENCE-CONSENT-01 | `DONE_PUBLISHED` | Published v0.4.44 / `123248d` | Consent-preserved Lean source/evidence, no automatic state demotion, disabled browser self-certification, fail-closed IoC contracts and agent competence quarantine. | Start only a separate G1; passport revalidation G1 is now drafted. |
| P0 | RICIS-LEAN-PASSPORT-REVALIDATION-01 | `DONE_PUBLISHED` | Published v0.4.45 / `512ce86` | Fresh pure read-only projection over canonical v0.4.44 consent records; old candidate remains superseded/quarantined. | Start only a separate user-approved G1. |
| P1 | RICIS-LEAN-PASSPORT-01 | `BLOCKED_BY_INCIDENT` | Publication paused | Append-only source-bound Lean passport: immutable versions, hash/evidence disclosure, Core correlation and read-only trust presentation. | Resume release QA/publication only after the consent incident is resolved and revalidated. |
| P1 | MARKET-RICIS-01 | `DONE_PUBLISHED` | Published v0.4.49 / `b15d47b` | Source-bound LLM-gradient assurance brief with five separated immutable lanes and fixed non-certification disclosure; no legal/runtime/authority path. | Start only a separately documented next task. |
| P1 | INDUSTRIAL-RICIS-01 | `DONE_PUBLISHED` | Published v0.4.50 / `b500732` | Static source-bound four-record industrial research context; no live twin, control, safety/certification, runtime or authority path. | Start only a separately documented next task. |
| P0 | AGENT-RICIS-01 | `DONE_PUBLISHED` | Published v0.4.46 / `2c8dbc6` | Source-bound typed agent advisory; no proof/Core/Lean replacement, writer or training authority. | Start only a separate user-approved G1. |
| P2 | LOCAL-RICIS-02 | `DONE_PUBLISHED` | Published v0.4.47 / `9483839` | Homogeneous scalar A6/A7 only; type promotion/composite stays deferred, no ontology or execution authority. | Start only a separate later task. |
| P2 | CALC-EXP-01 G4B | `DONE_PUBLISHED` | Published v0.4.48 / `faf1b98` | Ten unbound calculator descriptors as physical graph nodes and explicit reviewed edges; no authority/runtime/writer scope. | Start only a separate, documented next task. |
| P2 | CALC-EXP-02 | `DONE_PUBLISHED` | Published v0.4.53 / `9afd3ff`; branch-first feature → integration → main release adds only source-bound calculator explorer discoverability and fixed kinematic non-control disclosure. | Start only a separately scoped G1. |
| P2 | OIR-02 | `DONE_PUBLISHED` | Published v0.4.51 / `eb29bfc` | Explicit `LOCAL_DIAGNOSTIC_ONLY` legacy-document ownership envelope and narrow no-existing-proof delegation; Core authority remains unchanged. | Start only a separate documented G1. |
| P2 | OIR-03 | `DONE_PUBLISHED` | Published v0.4.52 / `45a4741` | Audit source-preservation containment is published through feature → integration → main; shared builder, OIR-02 generator and P=NP remain unchanged. | Start only a separately documented unfinished-task G1. |
| P3 | EDU-VIS-01 | `DONE_PUBLISHED` | Published v0.4.54 / `b6025c0`; feature `4b7331a` → integration `a2d7e60` → main `b6025c0`; local/origin/GitHub API converged. | Start only a separately documented unfinished-task G1. |
| P3 | COMMUNITY-READINESS-01 | `DONE_PUBLISHED` | Published v0.4.55 / `1a70ec8`; feature `0e9fa40` → integration `2dd1207` → main `1a70ec8`; target 3/44, protected 5/50, full 115/1037, release 12/12, audit 0 and convergence closed. | Start only a separately documented unfinished-task G1. |
| P0 | CI-HISTORY-BASELINE-01 | `DONE_PUBLISHED` | Published CI repair on unchanged v0.4.55 / `e4a721c`; feature `ef42f9e` → integration `fbcbe6a` → main `e4a721c`; full 115/1043, release 12/12, audit 0 and Pages run `32939832954` success. | Start only a separately documented G1; no source/proof authority implication. |
| P1 | RICIS-LEAN-PASSPORT-ROUTE-B1-01 | `DONE_PUBLISHED` | Published v0.4.56 / `7b0e06f`; feature `5637f46` → integration `ea83db9` → main `7b0e06f`; target 3/44, protected 10/119, full 118/1087; Pages `32946711779` success and local/origin/API convergence verified. | B1 remains the effective safe baseline; B2 is separately documented and decision-blocked. |
| P1 | RICIS-LEAN-PASSPORT-ROUTE-B2-DATA-LIFECYCLE-01 | `G1_COMPLETE_B2A_SELECTED` | Document-only lifecycle G1 at published `v0.4.56`; B2-A authenticated ledger selected as optimal durable-history strategy; no durable store/schema/migration/UI created. | Complete separate `RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 G1`; no B2 G2/code otherwise. |
| P1 | RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 | `G2_COMPLETE_AWAITING_G3_APPROVAL` | Selected B2-A G1/G2 define authenticated subject/tenant ownership, closed metadata-only DTOs, port topology, tenant isolation, lifecycle/retention/export/delete/revocation and fail-closed boundaries at published `v0.4.56`. | Explicit `OK RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 G3` only; do not add auth, server/database, storage, export/delete UI or external integration before approval. |
| P3 | P-10A coverage | `DONE_PUBLISHED` | Published test-only increment on unchanged v0.4.55 / `b6b4dbb`; feature `8a8624f` → integration `2cb0594` → main `b6b4dbb`; target 1/10, protected 7/95, full 115/1043, release 12/12, audit 0 and convergence closed. | Start only a separately documented G1; no global coverage threshold is implied. |

## Detailed active record — CALC-EXP-01 G4A

### Intent and immutable boundaries

| Aspect | Fixed decision |
|---|---|
| Product intent | Turn already solved calculator cases into source-bound green monolith disclosures with evidence, example, visualization and relation context. |
| Green basis | `RICIS III solved`, `Lean kernel verified`, both, or neither. Bases are shown separately. |
| Existing bindings in G4A | `informatics-complexity` (P=NP), `registry-115` (CDCC), `registry-117` (Navier–Stokes), `registry-118` (LLM gradient). |
| Explicitly out of scope | Ten new physical nodes, physical graph-edge import, `initialMap.ts` mutation, `ProblemNode.state` mutation, `Proof`/`externalLean` mutation, Core/agent/Lean execution, calculator proxy/iframe, remote fetch. |
| Trust rule | Catalog is a read-only presentation projection; `AuthoritativeProofStatePolicy` remains sole owner of authoritative resolved state. |

### Completed gate record

| Gate | Status | Artefact/evidence |
|---|---|---|
| G1 | `APPROVED` | `CALC-EXP-01_STEP1_BUSINESS_SPEC.md`, dual-green and extensibility amendments approved by user. |
| G2 | `APPROVED` | `CALC-EXP-01_STEP2_ARCHITECTURE.md`, closed catalog contracts and ownership boundaries approved by user. |
| G3 | `APPROVED` | `CALC-EXP-01_STEP3_QA_SPEC.md`; CEQA01–16 red suite approved by user. |
| G4 domain | `COMPLETE_PENDING_RELEASE` | 18/18 `ricisSolutionCatalog` tests green after runtime module implementation and visual-policy tests. |
| G4 UI/map | `COMPLETE_PENDING_RELEASE` | Read-only card, exact NodeCard composition and Map3D policy integrated; topology QA 3/3 passed. |
| Release/publish | `DONE_PUBLISHED` | Targeted QA 21/21, related authority regressions 85/85, lint, release check 12/12, full suite 70 files/501 tests, audit 0 vulnerabilities, Pages build and diff hygiene passed. Published as `9094236`; `HEAD == origin/main`, isolated worktree clean. |

### Current G4A worktree changes

| Path | State | Purpose | Verification state |
|---|---|---|---|
| `src/ricisSolutionCatalog/index.ts` | Added | Immutable 14-case catalog, source/hash validator, dual-green policy, relation projection, link builder, proof-disclosure view, map visual policy. | CEQA01–18 passed; lint passed; full regressions pending. |
| `src/ricisSolutionCatalog/index.d.ts` | Removed | Superseded declaration-only G3 seam removed after runtime implementation. | Strict lint passed. |
| `src/ricisSolutionCatalog/ricisSolutionCatalog.test.ts` | Added | CEQA01–18 domain and visual-policy contracts. | 18/18 passed. |
| `src/ui/SolutionMonolithCard.tsx` | Added | Read-only source/evidence/example/visualization/relation/launch disclosure. | Topology QA passed. |
| `src/ui/NodeCardDetails.tsx` | Modified | Composes solution card only for exact existing bindings. | Topology QA passed. |
| `src/ui/Map3D.tsx` | Modified | Uses one read-only `presentMapNodeVisualStatus` policy; no state/proof mutation. | Topology QA passed. |
| `src/ui/solutionMonolithCard.topology.test.ts` | Added | CEUI01–03 import and no-mutation topology checks. | 3/3 passed. |

### Immediate quality checklist

- [x] Detached worktree created from `ed5f239` to isolate CALC-EXP work from OIR-01 red tests.
- [x] Calculator component content hashes recorded at inspected commit `9806b7c97b57bd738301db459b8c8e72f73d1a23`.
- [x] CEQA01–18 pass after pure runtime catalog and visual policy implementation.
- [x] Superseded `index.d.ts` declaration seam removed.
- [x] Strict `npm run lint` passed after UI integration.
- [x] Pure visual policy integrated into `Map3D`; CEUI01–03 no-mutation/UI topology tests passed.
- [x] Targeted CALC-EXP QA passed: 21/21; related persistence/authoritative/Core/local-reducer/local-analyzer regressions passed: 85/85.
- [x] Full suite passed: 70 files / 501 tests; release consistency: 12/12; audit: 0 vulnerabilities; Pages build: passed; `git diff --check`: passed.
- [x] Mandatory v0.4.42 package/runtime/README/CITATION/JSON-LD/evidence/task-log metadata synchronized.
- [x] Separate `OK commit and publish CALC-EXP-01 v0.4.42` received; commit `9094236` published. `HEAD == origin/main`; isolated worktree clean.

## Detailed active record — LEAN-EVIDENCE-CONSENT-01

| Field | Value |
|---|---|
| Status | `DONE_PUBLISHED — v0.4.44 / 123248d` |
| Reported issue | User reports automatic reset/demotion of entered Lean evidence while no Lean compiler/kernel is available; node remains `partial` and must not be downgraded or discarded without explicit human consent. |
| Mandatory invariant | User-submitted source bytes, source hash, evidence records and history are append-only. Absence of a compiler/kernel produces only `REQUIRES_CORE_LEAN` / `localDiagnosticOnly`; it never erases evidence or autonomously lowers a workflow state. |
| AI boundary | AI may provide a clearly fallible, non-authoritative logical advisory. It cannot claim Lean verification, set `LEAN_VERIFIED`/`TRUSTED_AXIOM`, create a proof authority, or change task resolution. |
| Human boundary | Only explicit, context-bound human confirmation may accept an advisory decision; refusal, timeout, unavailable kernel or uncertain AI result preserves current state and evidence. |
| Normative boundaries | RICIS III v7.7, user Lean/TeX sources, L0/L1, SP1–SP4, A1/A4/A5/A6/A7/A10, source provenance, transformation history and owner-authorized P=NP basis remain immutable. |
| G1 evidence | `LEAN-EVIDENCE-CONSENT-01_STEP1_BUSINESS_SPEC.md`; static inventory of editor/submission, hydration sanitization, audit/migration, authoritative policy and agent training paths. Five direct reset/demotion surfaces `LEC-P-01…05` and agent feedback boundary are recorded. |
| G2 contract | `LEAN-EVIDENCE-CONSENT-01_STEP2_ARCHITECTURE.md`; `G2_APPROVED`; six pure contexts, exact record contracts, explicit-only human disposition, source-bound kernel challenge, agent competence quarantine, optional container/CI/hosted/popup adapters behind the RICIS-owned verification API and IoC, no automatic retraining/state writer, and required G3 matrix. |
| G3 QA specification | `LEAN-EVIDENCE-CONSENT-01_STEP3_QA_SPEC.md`; `G3_APPROVED`; 36 named QA cases for exact-byte provenance, consent/state proposals, IoC/provider boundaries, hosted/popup negatives, attestation, agent conflict, P=NP, passport/OIR compatibility, security and release. |
| Fresh G4 worktree | `/home/ubuntu/ricis3-lean-consent-g4`, detached at `f8c82602…`; six approved red test files added. Lint passed; exact runtime-red classification is recorded before implementation. |
| Red evidence | Six target files / 36 tests red solely due to missing `leanEvidenceConsent.domain`; no harness noise. Related existing suite: 5 files / 66 tests passed. |
| QA status | `QA-LEC-001…004` and `QA-LEC-release-01` are `CLOSED_VERIFIED` from independent code/diff/retest/release evidence; no Lean kernel run is claimed. |
| G4 delivered scope | Pure `src/leanConsent/leanEvidenceConsent.domain.ts`; six approved QA test artefacts; state-preserving editor/submission/hydration/audit changes; browser self-certification fail-closed; v0.4.44 metadata only. No provider, Lean/AI/popup integration, source upload, Docker/CI or retraining. |
| Priority review | `RICIS_PRIORITY_RECALCULATION_2026-08-25.md`; LEC ranks first, Lean Passport is blocked dependent, AGENT is a separate next P0 safety lane. |
| Hosted boundary | Research recorded in `LEAN_HOSTED_VERIFICATION_RESEARCH_2026-08-25.md`: AXLE is the strongest verified free/no-deploy API candidate but remains advisory-only; Lean Web popup is diagnostic-only with per-source privacy consent. Docker/Cloud Run/GitHub Actions, AXLE/Lean Web integration, source upload, compiler execution, secrets/OIDC setup and external calls remain out of scope until a future separately approved increment. |
| Out of scope | Lean execution, AI execution, hosted/popup integration, source upload, Docker/CI provisioning, retraining, RICIS/Lean/TeX source change and trust/state promotion. |
| Publication result | `123248d7e0a92b34327ca9827e7a762c8f6f89b0` published to `main`; GitHub API verifies the same SHA/message; `HEAD == origin/main`; clean worktree. |
| Next permissible action | Open a separate G1 only; recommended `RICIS-LEAN-PASSPORT-REVALIDATION-01 G1` from this published remediation baseline. |
| Dependency | Existing v0.4.44 candidate remains uncommitted and blocked from publication. |
| Next permissible action | Open a separate G1 only; no external provider/popup/Lean/AI execution or retraining is implied by the published remediation. |

## Detailed active record — AGENT-RICIS-01

| Field | Value |
|---|---|
| Status | `DONE_PUBLISHED — post-push convergence verified` |
| Published baseline | `512ce86c24e8c3199ee07b78d46a18250a3da7f2` (`v0.4.45`), including published consent and read-only Passport boundaries. |
| G1 artefact | `AGENT-RICIS-01_STEP1_BUSINESS_SPEC.md` — revised G1 explicitly approved after inventory of published `server.ts`, `src/model/agent.ts` and `a6Evidence` contracts. |
| G2 artefact | `AGENT-RICIS-01_STEP2_ARCHITECTURE.md` — explicitly approved pure advisory contract/read-only canonical correlation/topology and legacy-route containment design. |
| G3 artefact | `AGENT-RICIS-01_STEP3_QA_SPEC.md` — drafted independent 44-case matrix, red-baseline validity protocol and release controls. |
| Material safety finding | The broad `/api/generateProof` route accepts free-form data and can substitute canonical proof LaTeX; discovery/assistant routes consume broad prompts; `AgentTrainingMemory` contains count-derived `trainingAccuracy`. These are inventory/containment findings, not repaired behavior and not authorized implementation scope. |
| First increment boundary | New pure typed advisory contract only: canonical typed witness/result/read-only challenge correlation/unavailable default. No model/provider execution, prompt transport, proof output/repair, state/proof/axiom/consent/Persistence write, UI, Passport command, Core/Lean execution or training. |
| Immutable boundaries | RICIS III v7.7; owner-authorized P=NP; user Lean/TeX; L0/L1, SP1–SP4, A1/A4/A5/A6/A7/A10; OIR provenance; v0.4.44 canonical consent records and v0.4.45 Passport read-only ownership. |
| Training boundary | Exact canonical contradiction may only be represented as `AGENT_COMPETENCE_CONFLICT` / `TRAINING_REQUIRED`, `effective: false`; no autonomous retraining, memory rewrite, score change or workflow effect. |
| Published boundary | One pure source-bound advisory module and its QA contracts are published. No provider/model/AI/Lean/Core/popup, source upload, training/retraining, legacy-route/migration/UI/store/persistence integration was added or run. Any extension requires a separate G1. |
| G1 approval | Explicit `OK AGENT-RICIS-01 G1 (revised v0.4.45)` received. |
| G2 approval | Explicit `OK AGENT-RICIS-01 G2` received. |
| G3 approval | Explicit `OK AGENT-RICIS-01 G3` received. |
| Red baseline / QA | `QA-AR-001 CLOSED_VERIFIED`: lint green; 4 target files / 44 red tests, all 44 only missing `agentRicisAdvisory.domain`, zero setup/ENOENT/type/assertion/reference/syntax noise; 9 related published files / 66 tests green. |
| G4 / release QA | `QA-AR-002…003` and `QA-AR-release-01 CLOSED_VERIFIED`: targets 4/44, related 9/66, full 85/627, `release:check` 12/12, audit 0 vulnerabilities, Pages build and diff check passed. v0.4.46 metadata is synchronized. |
| Publication | Explicit publish approval received; commit `2c8dbc66c911b8de70bb617e26a32bbf7083f309` pushed to GitHub `main`. |
| Post-push convergence | `QA-AR-postpublish-01 CLOSED_VERIFIED`: local `HEAD`, `origin/main` and GitHub API `main` equal `2c8dbc66…`; GitHub manifest is v0.4.46; worktree clean. |
| Next permissible action | Begin a different task only under a separate explicit G1 approval. |

## Detailed active record — RICIS-LEAN-PASSPORT-REVALIDATION-01

| Field | Value |
|---|---|
| Status | `DONE_PUBLISHED — v0.4.45 / 512ce86` |
| Published baseline | `123248d7e0a92b34327ca9827e7a762c8f6f89b0` (`v0.4.44`); fresh clean worktree `/home/ubuntu/ricis3-lean-passport-revalidation`. |
| G1 artefact | `RICIS-LEAN-PASSPORT-REVALIDATION-01_STEP1_BUSINESS_SPEC.md` — approved fresh source-bound revalidation specification. |
| G2 artefact | `RICIS-LEAN-PASSPORT-REVALIDATION-01_STEP2_ARCHITECTURE.md` — approved read-only projection architecture and canonical published-contract mapping. |
| G3 artefact | `RICIS-LEAN-PASSPORT-REVALIDATION-01_STEP3_QA_SPEC.md` — approved independent 40-case test matrix, red-baseline validity protocol and release controls. |
| Fresh G4 worktree | `/home/ubuntu/ricis3-lean-passport-revalidation-g4`, detached at exactly `HEAD == origin/main == 123248d7e0a92b34327ca9827e7a762c8f6f89b0`; four fresh tests are the only untracked scope. |
| Red baseline / QA | `QA-LPR-001 CLOSED_VERIFIED`: `npm run lint` green; 4 target files / 40 red tests, all 40 only missing `leanPassportProjection.domain`, zero setup/ENOENT/TS/runtime markers; 9 related published files / 57 tests green. |
| G4 / release QA | `QA-LPR-002…003` and `QA-LPR-release-01 CLOSED_VERIFIED`: targets 4/40, related 9/57, full 81/583, `release:check` 12/12, audit 0 vulnerabilities, Pages build and diff check passed. v0.4.45 metadata is synchronized. |
| Revalidation decision | Passport is a read-only projection over canonical v0.4.44 `LeanSourceVersion`, observations, kernel facts, human decisions and competence-conflict records. It owns no parallel hash/idempotency/evidence ledger, provider route, state/proof/axiom writer or trust promotion. |
| Quarantined candidate | `/home/ubuntu/ricis3-lean-passport-g4` at superseded `f8c8260`, uncommitted. Its code/tests/metadata may be inspected as reference only; no file may be copied/cherry-picked/merged/published without future G2/G3 decisions. |
| Immutable boundaries | RICIS III v7.7, owner-authorized P=NP, user Lean/TeX source, L0/L1, SP1–SP4, A1/A4/A5/A6/A7/A10, source identity/history and v0.4.44 consent/IoC authority remain unchanged. |
| Closed-task boundary | Published scope is frozen: no retroactive scope/version/evidence change, migration, provider/Lean/AI/popup execution, source upload or retraining is implied. Any extension requires a separate approved G1. |
| G1 approval | Explicit `OK RICIS-LEAN-PASSPORT-REVALIDATION-01 G1` received after delivery of the fresh source-bound revalidation specification. |
| G2 approval | Explicit `OK RICIS-LEAN-PASSPORT-REVALIDATION-01 G2` received. |
| G3 approval | Explicit `OK RICIS-LEAN-PASSPORT-REVALIDATION-01 G3` received. |
| Publication result | Explicit user confirmation received; commit `512ce86c24e8c3199ee07b78d46a18250a3da7f2` (`feat(lean): add read-only evidence passport projection`) pushed to GitHub `main`. |
| Post-push QA | `QA-LPR-postpublish-01 CLOSED_VERIFIED`: `HEAD == origin/main`, clean worktree, manifest v0.4.45 and GitHub API SHA/message convergence. |
| Next permissible action | This task is closed. Start only a separate approved G1, preserving `AGENT-RICIS-01` as a distinct P0 safety lane. |

## Detailed active record — RICIS-LEAN-PASSPORT-01

| Field | Value |
|---|---|
| Status | `BLOCKED_BY_INCIDENT` |
| Red baseline | `npm run lint` passed; five approved target files / 17 tests red solely on absent `leanPassport.domain` (17 matching missing-module errors, no ENOENT); related 6 files / 31 tests passed. QA-LP-001 (low test-contract compilation) was corrected and QA-LP-002 red-baseline validity closed verified. |
| Release QA | Target 5 files / 17, related 6 files / 31, full 76 files / 524, release check 12/12, audit 0 vulnerabilities, Pages build and all diff hygiene checks passed. QA-LP-003 authority/topology and QA-LP-release-01 are closed verified. |
| Purpose | Establish a source-bound, append-only evidence passport for user-supplied Lean sources and reproducibility records without creating a browser proof authority. |
| G1 artefact | `RICIS-LEAN-PASSPORT-01_STEP1_BUSINESS_SPEC.md` (2026-08-25), `G1_APPROVED` by explicit user `OK`. |
| G2 artefact | `RICIS-LEAN-PASSPORT-01_STEP2_ARCHITECTURE.md` (2026-08-25), `G2_APPROVED` by explicit user `OK`; defines future ledger/records/lifecycle/commands/projection/topology and no-write authority boundaries. |
| G3 artefact | `RICIS-LEAN-PASSPORT-01_STEP3_QA_SPEC.md` (2026-08-25), `G3_APPROVED` by explicit user `OK`; 28 LPQA cases, independent QA/release controls and approved red-baseline test-only setup. |
| G4 worktree | `/home/ubuntu/ricis3-lean-passport-g4`, detached at `f8c82602afb40e7772de8ecb4ed6ad98f4632ca9`, confirmed clean before test creation. |
| Baseline | Fresh worktree `/home/ubuntu/ricis3-lean-passport` detached at published `f8c82602afb40e7772de8ecb4ed6ad98f4632ca9`; clean at discovery. |
| Normative boundaries | RICIS III v7.7 and user Lean/TeX sources immutable; preserve L0/L1, SP1–SP4, A1/A4/A5/A6/A7/A10, typed provenance, owner-authorized P=NP source basis and transformation history. |
| Required model | Verbatim source bytes, algorithm/versioned hash, captured time/context, source lock, version lineage, exact evidence records, mismatch diagnostics and read-only Core snapshot correlation. |
| Trust rule | Static audit/browser/user-entered evidence cannot produce `LEAN_VERIFIED`, `TRUSTED_AXIOM` or `resolved`. A passport itself never writes node state. Any future kernel display requires exact source-hash match, pinned toolchain, command, compiler output, `#print axioms`, authority identity and no `sorry`/`sorryAx`. |
| Existing risk to contain in G2 | Current node-scoped `submitExternalLeanProof` / `acceptVerifiedExternalLeanProof` workflow demonstrates source lock but accepts browser-side evidence strings; G2 must prevent self-certification and avoid replacement of existing source-bound Proof fields. |
| Out of scope | Lean toolchain install/run; Lean/TeX/RICIS edits; Core changes; proof generation; agent/fallback use; source replacement; map/proof/state mutation; API/UI/persistence code; tests; release/version/commit/publish. |
| Evidence inventory | SHA-256 ledger of six versioned Lean files recorded in G1; actual sandbox `lean`, `lake`, `elan`: absent. No fresh Lean verification asserted. |
| Dependencies | Existing types/persistence/badge/authoritative Core policy/gateway; a separately provisioned reproducible Lean environment or authoritative Core snapshot service for future kernel claims. |
| Next permissible action | No publication. Resume only after LEAN-EVIDENCE-CONSENT-01 is implemented, independently retested, and its result is integrated into a fresh release candidate. |

## Detailed active record — OIR-01

| Field | Value |
|---|---|
| Status | `DONE_PUBLISHED` |
| Purpose | Preserve existing owner-authorized source-bound RICIS P=NP payload through migration; remove only generic keyword/template replacement. |
| Approved gates | G1 and G2 approved; G3 explicitly approved; G4 implementation and independent QA release review closed; separate publication approval received. |
| Fresh worktree | `/home/ubuntu/ricis3-oir01`, isolated at `90942367775507b010b3611951d19e58c15b6839` (published v0.4.42); no implementation was placed in stale old main worktree. |
| Implemented scope | `src/model/audit.ts`: typed `ProofRepairMode` / `AuditProofIntegrityOptions`, preserve mode; `src/model/migrationAudit.ts`: direct writer and canonical builder import deleted, migration invokes preserve audit; `src/model/migrationAudit.provenance.test.ts`: six reviewed provenance/topology contracts; v0.4.43 metadata/task log only. |
| Proof/provenance rule | Preserve mode leaves existing `Proof` object, `latex` and nested `externalLean` references untouched; absent proof stays absent. Existing audit observation/demotion behavior remains. Legacy default repair remains explicit for unrelated callers until separate OIR-03. |
| Prohibited / checked absent | No P=NP demotion/removal, Lean/TeX change, generic replacement text, agent/Core/Lean tooling dependency, trust promotion, map topology/state mutation or source-free proof construction. |
| Quality evidence | Fresh red baseline 3 passed/3 expected failures; focused G3 6/6; related independent regressions 7 files/110; independent final re-test 6/6 plus lint; `release:check` 12/12; full `npm test` 71 files/507; `npm audit --audit-level=moderate` 0 vulnerabilities; Pages build; `git diff --check`. QA diff capture: `OIR-01_QA_RELEASE_DIFF_2026-08-25.txt`. |
| Known non-blockers | Pages build warns that async `Map3D` chunk is 1,505.99 kB minified (>500 kB threshold); warning unchanged. Sandbox is Node 22.13.0/npm 10.9.2 versus project Node >=22.22.2/npm >=12.0.2; results are local evidence, not CI-engine conformity. |
| QA result | QA-OIR-001…005 and QA-release-01 `CLOSED_VERIFIED`; no new defect or process-score change. |
| Lean result | No Lean compiler/toolchain exists in sandbox; fresh compilation and Lean kernel verification are not claimed. |
| Publication result | Commit `f8c82602afb40e7772de8ecb4ed6ad98f4632ca9` (`fix(migration): preserve source-bound proofs`) pushed to GitHub main. Post-push `HEAD == origin/main`, GitHub commit API SHA/message match and isolated worktree is clean. |
| Next permissible action | Await explicit user selection of a separate G1 task. Recommended priority candidate is `RICIS-LEAN-PASSPORT-01 G1`; do not start it automatically. |

## Update protocol

1. Add a new row before creating code or tests for any new task.
2. At every G1/G2/G3/G4 transition, update its status and cite the artefact/check output.
3. Before a pause, set the exact `NEXT PERMISSIBLE ACTION` and identify worktree/branch/base commit.
4. Before commit/push, record diff scope, version, quality outcomes and the user’s separate authorization.
5. Never delete history of a completed or paused task; supersede it with a dated status line.

## Reference artefacts

- `RICIS_FRACTAL_GROWTH_PLAN.md`
- `RICIS_GLOBAL_DEMAND_PRIORITIZATION.md`
- `RICIS_ONTOLOGY_REMEDIATION_BACKLOG.md`
- `RICIS_AGILE_PRIORITY_BACKLOG.md`
- `CALC-EXP-01_STEP1_BUSINESS_SPEC.md`
- `CALC-EXP-01_STEP2_ARCHITECTURE.md`
- `CALC-EXP-01_STEP3_QA_SPEC.md`
- `LOCAL-RICIS-01_STEP1_BUSINESS_SPEC.md`, `LOCAL-RICIS-01_STEP2_ARCHITECTURE.md`, `LOCAL-RICIS-01_STEP3_QA_SPEC.md`
- `OIR-01_STEP1_BUSINESS_SPEC.md`, `OIR-01_STEP2_ARCHITECTURE.md`


---

## OIR-03 — source-preserving legacy audit containment (v0.4.52) — LOCAL FEATURE/INTEGRATION COMPLETE

**Priority:** Closed current increment; no new OIR code may begin from this record.
**G1:** closed in `OIR-03_STEP1_BUSINESS_SPEC.md`.
**G2:** closed in `OIR-03_STEP2_ARCHITECTURE.md`.
**G3:** closed valid red baseline in `OIR-03_STEP3_QA_SPEC.md`.
**G4/release:** closed locally; branch-first integration is complete and clean.

| Control | Verified result |
|---|---|
| Published baseline | `eb29bfc175c936c184454b12e9d34a4259ed5f0f` / v0.4.51 |
| OIR-03 functional boundary | Audit preserves every existing `Proof` source; no audit template rewrite; historical options signature remains compatible; migration production source unchanged. |
| G3 baseline | 1 target file / 36 cases: 12 approved red legacy-rewrite/topology failures; 24 green controls; strict lint green. |
| Green QA | Target + migration: 2 files / 42 tests; protected: 13 files / 149 tests; candidate full: 106 files / 909 tests. |
| Release gates | lint, release check 12/12, audit 0, Pages build, diff hygiene all green; known Vite `__dirname` and chunk-size advisories retained; sandbox engines below declared CI range are disclosed. |
| Feature branch | `oir-03-source-preserving-audit` clean at `b23980ff8ac1d455c7bae54573ff3bee651b6caf`; commits `b96120f…` and test-only scope correction `b23980f…`. |
| Integration branch | `integration/oir-03-v0.4.52` clean at `9c04f6b216aa8581735b58efa6b426b22065f02b`; branch-first merge sequence verified; clean integration full suite 106 files / 909 tests and release check 12/12. |
| Remote/main | `origin/main == GitHub API main == eb29bfc175c936c184454b12e9d34a4259ed5f0f`; no main change, push or publication occurred. |
| External evidence | Release review `evidence/OIR03_G4_RELEASE_REVIEW_2026-08-25.md`, scope review and target/related/full/release/merge logs under `/home/ubuntu/ricis_review/evidence`. None is committed. |

> **Strict boundary:** This is local application-code QA only. No Lean compiler/kernel, Core/WASM, provider, agent, calculator, popup, external source transport, source/trust/state/axiom decision, user Lean/TeX mutation or RICIS III v7.7/P=NP ontology change occurred.

**Only next permitted action:** a new explicit decision to integrate the clean local `integration/oir-03-v0.4.52` branch into local `main`, followed by a separately confirmed push/publication procedure. Do not direct-commit from a worktree to `main`; preserve the feature → integration → main sequence.
