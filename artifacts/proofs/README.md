# RICIS-III Core AGI Target Boundary Note

This directory contains artifacts for the **RICIS-III Core AGI Target** patch resolution.

The artifacts define and demonstrate parts of the RICIS-III structural reasoning and verification boundary.

## ⚠️ ARENA AGENT POLICY — RICIS-FIRST REASONING

This repository implements **RICIS-III**, not a conventional classical mathematics solver.

When working on any RICIS task, **do not solve the problem by blindly applying classical mathematics first and then adapting the result to RICIS**.

| Artifact | Status | Classification / Boundary |
| :--- | :--- | :--- |
| `database-a6-minimal-core-check.lean` | `LEAN_VERIFIED` | Kernel-verified specification (exit 0, no `sorryAx`, `#print axioms`: "does not depend on any axioms") |
| `ricis-jacobian-conjecture.standalone.lean` / `database-registry-120-jacobian.*` | `STRUCTURALLY_VALIDATED` | Structural model verification (not an arbitrary classical theorem proof) |
| Remaining Mathlib-importing files without a run path (1 file: `ricis-yang-mills.lean`) | `REQUIRES_CORE_LEAN` | Outside the explicit `MATHLIB_ARTIFACTS` allowlist and outside the core-check plan; whether to run it is the owner's decision (F-14). A from-scratch Mathlib build is what does not fit a runner — prebuilt oleans do (see `mathlib-kernel-check`) |
| `ricis-general-resolution.lean` | `LEAN_VERIFIED` (artifact) / `STRUCTURALLY_VALIDATED` (claim) | Kernel run 34950902412: source as provided exit 0, derivative exit 0, no `sorryAx`; the headline "general theorem of resolution" is not proven (F-09/F-10/F-11) |
| `ricis-yang-mills.lean` | `REQUIRES_CORE_LEAN` | Added to `main` on 2026-09-15 without metadata, status or verification path; its header claims full compilation, but the imported module `Mathlib.Basic.Real.Basic` does not exist in the pinned Mathlib revision (F-14) |
| `RicisAgiTarget.lean` | `LEAN_VERIFIED` (artifact) / `STRUCTURALLY_VALIDATED` (claim) | run 35145205870 (job `mathlib-kernel-check`, PR #59): source as provided exit 0 + byte-identical derivative exit 0, no `sorryAx`; no declared trusted contracts — all 3 theorems depend only on standard Lean axioms. Empirical AGI claims are NOT made or verified (structural prototype for the Zenodo deposit 10.5281/zenodo.22225762) |
| `Schwarzschild_GeometricBridge.lean` | `LEAN_VERIFIED` (artifact) | run 35145205870 (job `kernel-check`, PR #59, Lean 4.33.1): the derivative with the three unused `import Mathlib…` lines removed compiled exit 0, no `sorryAx` (7 theorems axiom-free, 4 use propext). Path-indexed Schwarzschild-bridge monolith with A6 computational proxy (canon L1, SP2, SP4, A6 proxy, P1 no-lim; DOI 10.5281/zenodo.22124493 workflow provenance). The kernel run verifies the structural artifact ONLY: Schwarzschild metric regularity / GR singularity removal are NOT claimed and were not the subject of the run; the map node stays `REQUIRES_CORE_LEAN` |
| `*.generated.lean` (2 files) | Fragments | Fragments of the matching `.standalone.lean` files; not standalone artifacts |

1. **Identify the RICIS object first**

   * expression / AST;
   * type and identity;
   * function / observer context;
   * zero-coordinate or singularity;
   * applicable protocols SP1–SP5;
   * applicable RICIS axioms/rules.

2. **Apply RICIS structural semantics before classical reduction.**

3. Classical mathematics may be used as a **known special-case projection, reference, or compatibility check**, but it must not silently replace RICIS semantics.

4. In particular:

   * Do not replace `F` by an ordinary numeric value when its structural identity matters.
   * Do not treat `0` as untyped absence when the RICIS context distinguishes `0_F`, `0_G`, etc.
   * Do not directly evaluate a singular expression when RICIS specifies deferred structural reduction.
   * Do not introduce limits, L'Hôpital, numerical approximation, or iterative numerical recovery where the RICIS protocol forbids them.
   * Do not assume that a classically undefined expression is automatically an invalid RICIS expression.
   * Do not assume that a classical identity remains valid after changing the observer/function context.

### Division by zero

`Evaluate(8 / 0)` is **not** the intended RICIS processing model.

Conceptually:

```text
8 / 0
  ↓
LazyDiv(8, 0)
  ↓
structural indexing
  ↓
applicable RICIS rule
  ↓
Resolve
```

The original expression must remain available for semantic inspection before reduction.

### Core principle

> **RICIS-first, classical-second.**

Classical mathematics is treated as a projection that may be used for comparison or compatibility analysis. It is not the default solver that defines the RICIS result.

When uncertain, inspect the RICIS protocols, canonical AST, rule definitions, proof contracts, and existing artifacts before introducing a classical solution.

---

## 🤖 Agent / Resolver Trust Boundary

An LLM, Arena agent, or resolver is a **candidate generator, not a proof authority**.

A generated result must not be considered proven merely because:

* the derivation looks mathematically plausible;
* the `from → to` chain is syntactically connected;
* a model reproduces its own claimed result;
* a Lean theorem is proved by `rfl` because the resolver itself defines the result;
* a structural model successfully reproduces a specified RICIS rule.

The intended verification pipeline is:

```text
LLM / Resolver
      ↓
Candidate AST
      ↓
RuleVerifier
      ↓
Semantic Derivation
      ↓
RICIS admissibility gates
      ↓
Lean certificate (where applicable)
      ↓
COMMIT
```

A resolver result must never bypass semantic verification merely because it was generated by an AI system.

---

## Included Files

* `ricis_agi_target_sp4.tex`
* `RicisAgiTarget.lean`

**Specification Lean 4 DOI:** `10.5281/zenodo.22124493`

---

## Kernel Verification Status — 2026-09-14

Reproducible Lean 4.33.1 kernel runs for the self-contained artifacts are provided by the:

`Lean Artifact Kernel Check`

workflow:

`.github/workflows/lean-artifact-kernel-check.yml`

Evidence including toolchain, SHA-256, compiler output, and `#print axioms` is recorded in:

`docs/05-evidence/proofs/lean-kernel-run-2026-09-14.md`

### Verification classification

| Artifact                                                                         | Status                   | Classification / Boundary                                                                           |
| :------------------------------------------------------------------------------- | :----------------------- | :-------------------------------------------------------------------------------------------------- |
| `database-a6-minimal-core-check.lean`                                            | `LEAN_VERIFIED`          | Kernel-verified specification: exit 0, no `sorryAx`, `#print axioms`: does not depend on any axioms |
| `ricis-jacobian-conjecture.standalone.lean` / `database-registry-120-jacobian.*` | `STRUCTURALLY_VALIDATED` | Structural model verification; **not an arbitrary classical theorem proof**                         |
| Mathlib-importing files with a registered run path (core-check or `MATHLIB_ARTIFACTS`) | `REQUIRES_CORE_LEAN`     | Derivatives generated and registered for a kernel run (`PENDING_KERNEL_RUN`); status is **not** promoted until the actual run produces evidence |
| Remaining Mathlib-importing file without a run path (`ricis-yang-mills.lean`)    | `REQUIRES_CORE_LEAN`     | Outside the `MATHLIB_ARTIFACTS` allowlist and the core-check plan; running it is the owner's decision (F-14). Status not promoted |
| `ricis-general-resolution.lean` (2026-09-15)                                     | `LEAN_VERIFIED`          | kernel run 34950902412, re-confirmed by run 35145205870 (PR #59): source as provided exit 0 + generated derivative exit 0, no `sorryAx`; theorems depend only on standard Lean axioms |
| `ricis-general-resolution.lean` — **claim level**                                | `STRUCTURALLY_VALIDATED` | The kernel verified compilation and axiom dependencies; the headline claim ("general theorem of resolution of complex singularities") is **not** proven: declared RICIS contracts are unused by the theorems, the singularity is never presented, and `ricis_reduce` is unused (F-09/F-10/F-11) |
| `ricis-yang-mills.lean` (2026-09-15, from `main`)                                | `REQUIRES_CORE_LEAN`     | No metadata JSON, no status, no kernel run. Static evidence (F-14): `import Mathlib.Basic.Real.Basic` — the module tree of the pinned Mathlib revision (`6f1ef4e5dd604a435bddba4747b13970cd65d2a1`) has no `Mathlib/Basic.lean` and no `Mathlib/Basic/Real/`, so the file cannot elaborate as provided; the header claim "100% compiles, 0% sorry" is therefore unverified and currently unsupported |
| `Schwarzschild_GeometricBridge.lean` (2026-09-15)                                | `LEAN_VERIFIED` (artifact) | kernel run 35145205870 (job `kernel-check`, Lean 4.33.1, PR #59): the derivative with the three unused `import Mathlib…` lines removed compiled exit 0, no `sorryAx` (7 theorems axiom-free, 4 use propext) — «тело не использует Mathlib» стало фактом прогона. Scope boundary stands: path identity, non-collapse, A6 product/ratio proxy on Int are facts; Schwarzschild metric regularity / GR singularity removal are NOT claimed and were not the subject of the run (claim level `STRUCTURALLY_VALIDATED`; the map node stays `REQUIRES_CORE_LEAN`) |
| `RicisAgiTarget.lean` (2026-09-16)                                               | `LEAN_VERIFIED` (artifact) / `STRUCTURALLY_VALIDATED` (claim) | kernel run 35145205870 (job `mathlib-kernel-check`, PR #59): source as provided exit 0 + byte-identical derivative exit 0, no `sorryAx`; no declared trusted contracts — all 3 theorems depend only on standard Lean axioms. Empirical AGI claims are NOT made or verified (structural prototype for the Zenodo deposit) |
| `jacobian-counterexample-full.lean` (2026-09-16)                                 | `REQUIRES_CORE_LEAN`     | run 35145205870 (job `mathlib-kernel-check`, PR #59): **исходник как предоставлен — exit 0** (все 10 теорем приняты, `#print axioms` напечатан), но производная — exit 1 по дефекту генератора эпилога (F-15/A-0011: аксиома внутри неймспейса напечатана неквалифицированно) — дефект генератора, не дефект доказательства; генератор исправлен, производная перегенерирована. Полный статус требует повторного двойного прогона (`PENDING_KERNEL_RUN`). Объявленная `JacobianCounterexample.trusted_full_jacobian_contract` остаётся доверенным контрактом, не доказанной леммой; разрешение классической гипотезы Якоби в целом не заявляется |
| `ricis-general-resolution-v3.lean` (2026-09-16)                                  | `LEAN_VERIFIED` (artifact) / `STRUCTURALLY_VALIDATED` (claim) | kernel run 35145205870 (job `mathlib-kernel-check`, PR #59): source as provided exit 0 + byte-identical derivative exit 0, no `sorryAx`. Факт ядра по F-09/F-11 на артефактном уровне: сингулярность 0/0 предъявлена, `ricis_reduce` в центре равен `ricis_eval_general`, а `ax_A4_general`/`ax_SP1_general` — фактические зависимости bridge-теоремы по `#print axioms`; контракты остаются объявленными (не доказаны), пределы не используются (P1) |
| `*.generated.lean` (2 files)                                                     | `Fragments`              | Fragments of matching `.standalone.lean` files; not standalone artifacts                            |

### Important boundary

`LEAN_VERIFIED` means that the specified Lean artifact was successfully checked by the Lean kernel under the stated conditions.

It does **not automatically mean** that the underlying mathematical proposition has been independently derived from classical mathematics or from more primitive RICIS semantics.

In particular:

* a kernel-verified rewrite specification verifies the formal rule encoded in that specification;
* a structural model verifies the behavior of the model;
* a self-definitional theorem does not become an independent proof merely because Lean accepts `rfl`;
* `STRUCTURALLY_VALIDATED` must not be presented as `MATHEMATICALLY_PROVEN`.

---

## Mathlib Artifacts — Kernel Path (2026-09-15)

Artifacts whose body genuinely needs Mathlib (`ℂ`, `ring`, `norm_num`, `Complex.ext_iff`, ...) are no
longer left unchecked on the grounds that "Mathlib does not fit a runner". What does not fit a
from-scratch build; prebuilt oleans of a pinned revision do.

* Job `mathlib-kernel-check` (`.github/workflows/lean-artifact-kernel-check.yml`) pins the toolchain
  from the `lean-toolchain` of the pinned Mathlib revision and runs
  `(cd mathlib-check && lake env lean <artifact>)` twice: once for the artifact **exactly as provided**
  (AGENTS.md §7) and once for the generated derivative in `artifacts/proofs/mathlib-checks/`, whose
  body is **byte-identical** to the source and which adds only an additive `#print axioms` epilogue
  (including the declared `axiom` contracts, so the trust boundary shows up in the evidence itself).
* Generator `scripts/generateLeanMathlibChecks.ts`; runner `scripts/mathlibKernelCheck.sh`
  (integrity via `cmp` + source sha256 in the epilogue, `ciPolicy.mathlibExpectedFailures`,
  stop-the-line on `sorryAx`); guards `tools/leanMathlibChecks.test.ts`.
* **First result (2026-09-15, run 34950902412):** `ricis-general-resolution.lean` — artifact level
  `LEAN_VERIFIED` (source as provided exit 0, derivative exit 0, no `sorryAx`, `#print axioms`
  published); claim level `STRUCTURALLY_VALIDATED` with findings F-09/F-10/F-11 recorded. A green
  kernel run is not evidence for the headline claim — see the audit document.
* Only files listed in the explicit `MATHLIB_ARTIFACTS` allowlist are checked; existing statuses are
  never promoted by the mere existence of this mechanism.
* **Allowlist extension (2026-09-16, P12):** `RicisAgiTarget.lean` (body needs `ℝ` + `ring`) and
  `jacobian-counterexample-full.lean` (body needs `ℚ` + `ring`/`norm_num`) were added to the allowlist
  with byte-identical derivatives; `Schwarzschild_GeometricBridge.lean` was established to have a
  Mathlib-free body and takes the **core-check** path (its three unused `import Mathlib…` lines are
  removed in the generated derivative).
* **Run 35145205870 (2026-09-16, PR #59) — фактические результаты:** `kernel-check` (Lean 4.33.1):
  `Schwarzschild_GeometricBridge` — exit 0, no `sorryAx`, 11 теорем (артефактный уровень
  `LEAN_VERIFIED`). `mathlib-kernel-check`: `ricis-general-resolution` (повторно) и
  `ricis-general-resolution-v3` — исходник и производная exit 0, no `sorryAx` (v3: bridge-теорема
  фактически зависит от именованных контрактов A4/SP1); `RicisAgiTarget` — exit 0, no `sorryAx`,
  без доверенных контрактов (артефактный уровень `LEAN_VERIFIED`, claim `STRUCTURALLY_VALIDATED`).
  `jacobian-counterexample-full`: исходник — exit 0, производная — exit 1 по дефекту генератора
  эпилога (F-15/A-0011: неквалифицированная аксиома внутри неймспейса), генератор исправлен,
  повторный прогон ожидается; статус не повышен.
* `ricis-yang-mills.lean` is **not** in the allowlist. Whether to run it (which yields either a
  `LEAN_VERIFIED` record or the kernel's verbatim error, to be registered in
  `ciPolicy.mathlibExpectedFailures`) is the owner's decision — the import defect F-14 is reported
  first, because a run whose target module does not exist cannot produce evidence about the theorems.

---

## Artifact Immutability

Per `AGENTS.md §7`, artifact sources are immutable.

Verification status and classification metadata are recorded in this README and in the evidence document; they must **not** be established by rewriting the artifact source itself.

---

## Development Rule

When extending this directory:

1. Preserve the RICIS-first reasoning boundary.
2. Keep candidate generation separate from proof verification.
3. Prefer structural AST transformations over uncontrolled string rewriting.
4. Do not silently introduce classical limits, L'Hôpital, numerical approximation, or other prohibited mechanisms.
5. Do not promote an artifact's verification status without reproducible evidence.
6. Distinguish clearly between:

   * generated;
   * structurally validated;
   * formally/kernel verified;
   * independently mathematically proven.

The repository's strongest claim is always the **strongest claim actually supported by the verification evidence**, not the strongest claim suggested by the artifact's name.
