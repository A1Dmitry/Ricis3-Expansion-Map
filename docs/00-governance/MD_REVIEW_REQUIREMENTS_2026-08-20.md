# Повторный обзор всех Markdown-документов — требования к следующему спринту

**Дата обзора:** 2026-08-20

## Объём обзора

Повторно изучены все versioned Markdown-документы, исключая dependency/vendor/generated directories: 55 документов `Ricis.Core` и 22 документа `Ricis3-Expansion-Map`. Включены концепция RICIS III, regression matrix, Lean artifact policy/inventory, proof/document/typed-log design, WebAPI, Finance backlog, application AGENTS/DDD instructions, proof-boundary audits, QA findings и текущий endpoint plan.

## Неподвижные требования Core

| ID | Требование |
|---|---|
| C-01 | RICIS priority: L1 identity, structural/SP2, internal O(1) bridges, A1/A4, type consistency, A5/A6/A7; классика только для не определённых RICIS операций и только после явного согласования пользователя. |
| C-02 | Proof path не компилирует и не исполняет user `conditions`, `constraints`, `claim` или deferred expression trees. |
| C-03 | Один canonical derivation создаёт typed trace, verification и все presentation outputs. JSON/LaTeX/log renderer не пересчитывает доказательство и не меняет tree. |
| C-04 | Generic C# expression tree не является Lean theorem. Для unsupported shape обязателен controlled rejection; kernel proof возможен только через typed `RicisLeanTemplate`/supported rows и реальную Lean compilation без `sorry`/`sorryAx`. |
| C-05 | Public API changes требуют direct regression tests; functional change требует version review по `RICIS_VERSIONING.md`. |
| C-06 | WebAPI принимает только bounded `LambdaTextParser` grammar, не произвольный C#, не исполняет пользовательский code, ограничивает input и скрывает internal exception details. |
| C-07 | Изменение proof pipeline требует Release build, full regressions, API/Swagger smoke checks и Lean verification. NuGet publication по текущей политике не выполняется. |

## Неподвижные требования Expansion Map

| ID | Требование |
|---|---|
| E-01 | Четырёхшаговый lifecycle: business analysis → architecture DTO/contracts → QA tests → implementation. После каждого из первых трёх шагов необходимо пользовательское подтверждение `ОК`. |
| E-02 | TypeScript strict; no placeholder/TODO route, no `NaN` user success, no untyped divide-by-zero, no classical substitution for RICIS rule. |
| E-03 | `resolved` может быть установлен только kernel-backed `LEAN_VERIFIED` либо explicit trustworthy evidence; static check, RICIS trace, goal match и fallback output не равны Lean verification. |
| E-04 | External Lean source immutable: source hash, toolchain, compiler output и `#print axioms` are mandatory before `TRUSTED_AXIOM`. |
| E-05 | `Ricis.Core` is Core-first authority. Fallback is diagnostic compatibility code, not production mathematical or proof truth. Ports/adapters remain separate; do not merge them mechanically. |
| E-06 | Functional application change requires patch version bump, synchronized `package.json`/lock/`src/version.ts`, then `npm ci`, `npm audit --audit-level=moderate`, lint, tests and build. |
| E-07 | Secrets never enter browser, repo, logs or proof payloads. |

## Updated trust contract for endpoint sprint

1. **C# Core is the sole authority** for proof generation, proof verification and proof status in production.
2. A response may produce `resolved` only when it carries a successful authoritative verification status and the required evidence metadata. A RICIS derivation without kernel evidence remains `partial`/`REQUIRES_CORE_LEAN` unless an explicitly scoped non-Lean status is approved in the domain policy.
3. `/api/proofs/*` must map already-existing canonical Core operations (`ProveChecked`, `ProveDocumentsCheckedWithLog`, typed trace and bounded Lean models) rather than creating a second proof engine.
4. Proof document export must consume the same snapshot as verification. Generic Lean document export must reject unsupported shape; it cannot return a comment scaffold as proof.
5. The frontend bridge must not delegate proof calls to `RicisFallbackEngine`; unavailability must become a typed, user-facing recovery result.
6. Map state transitions must consume authoritative proof status, not a local `goalMatched` boolean.

## Required corrections to the prior endpoint plan

The previous plan must be corrected before implementation:

| Prior draft | Corrected requirement |
|---|---|
| `resolved` based merely on an accepted `auditProofContent` record | Insufficient. `resolved` requires `LEAN_VERIFIED` or an explicitly approved trusted external contract with immutable evidence. Canonical RICIS proof text remains `partial`/`REQUIRES_CORE_LEAN`. |
| A generic `POST /api/proofs/generate` can always return Lean evidence | Generic expressions must return controlled `UNSUPPORTED_LEAN_SHAPE`; only supported typed bridges can emit Lean source/evidence. |
| Build proof endpoint and immediately implement | Expansion Map AGENTS requires user approval after business-analysis specification, contract design and test plan. The next response must therefore stop at Step 1 unless the user says `ОК`. |
| Update npm dependency without formal release checks | Any package change must verify engines/current compatible release, synchronise version artifacts, run clean `npm ci`, npm audit, lint, test and build. The existing coverage provider needs these checks before permanent release acceptance. |

## Proposed first deliverable: Step 1 business-analysis specification

The immediate next output must be a **non-code specification** for Core-backed proof endpoints. It must include: user story, terms, endpoint scope, mapping from proof status to map state, risks, fallback removal plan, no-go constraints, test acceptance criteria, API input limitations, compatibility plan, migration inventory for `RicisWasmBridge`, `mapStore`, `logic.ts` and proof console.

It must explicitly distinguish:

| Status | Meaning | Can set `resolved`? |
|---|---|---:|
| `LEAN_VERIFIED` | Current reproducible kernel run with evidence | Yes |
| `TRUSTED_AXIOM` | Immutable external Lean source with recorded evidence and named trust dependency | Only by explicit domain policy; UI must show trust boundary |
| `REQUIRES_CORE_LEAN` | RICIS/Core or static result without current kernel evidence | No; `partial` |
| `STATIC_CHECK_PASSED` | Textual/structural validation only | No; `partial` |
| `HYPOTHESIS` | Research statement | No; `partial` or `unresolved` |
| `REJECTED` | Invalid/unsupported/malformed proof | No; `unresolved` or `partial` with diagnostic |

## Current evidence and backlog

The prior QA sprint found a 31-node fully reachable graph but 21 policy-rejected seeded proof records. Runtime sanitation correctly prevents unaccepted records from presenting as resolved. The actual repair requires Core-backed endpoint migration, explicit proof-status mapping, and deliberate reconstruction/classification of each seeded proof; bulk DOI insertion or status promotion is prohibited.

Non-blocking release backlog remains: ineffective `apiClient.ts` dynamic import and the main JavaScript chunk exceeding 500 kB. Finance backlog remains outside this proof-endpoint sprint.
