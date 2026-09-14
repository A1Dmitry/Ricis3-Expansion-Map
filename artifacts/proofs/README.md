# RICIS-III Core AGI Target Boundary Note

This directory contains artifacts for the RICIS-III core AGI target patch resolution.

Included files:
- `ricis_agi_target_sp4.tex`
- `RicisAgiTarget.lean`

**Specification Lean 4 DOI:** 10.5281/zenodo.22124493

## Kernel verification status (2026-09-14, обновлено прогоном run 34870620154 — 12 целей)

Reproducible Lean 4.33.1 kernel runs for the self-contained artifacts are provided by the
`Lean Artifact Kernel Check` workflow (`.github/workflows/lean-artifact-kernel-check.yml`).

Исходники `artifacts/proofs/*.lean` **неизменяемы** (AGENTS.md §7). Ядром проверяются новые версии
доказательства — самодостаточные производные в [`core-checks/`](core-checks), которые генерирует
`scripts/generateLeanCoreChecks.ts`:

```
производная = (исходник − неиспользуемая строка `import Mathlib`) [+ заявленные точечные подстановки]
              + добавленный в конец эпилог `#print axioms`
```

Побайтовое равенство префикса исходнику, детерминизм перегенерации, неизменность sha256 исходников и
обязательность установленной первопричины для любой подстановки проверяет
`tools/leanKernelCoreChecks.test.ts`.

Evidence: [`docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md`](../../docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md)
(сырой лог: [`lean-kernel-run-34858902595.pr-comment.txt`](../../docs/05-evidence/proofs/lean-kernel-run-34858902595.pr-comment.txt),
машиночитаемый реестр: [`core-checks/kernel-findings.json`](core-checks/kernel-findings.json)).

| Артефакт | Статус после run 34870620154 | Основание |
| :--- | :--- | :--- |
| `database-a6-minimal-core-check.lean` | `LEAN_VERIFIED_AXIOM_FREE` | exit 0; `'…database_a6_bridge' does not depend on any axioms` (подтверждён повторно) |
| `ricis-universal-orchestration-template.lean` | `LEAN_VERIFIED` (27 теорем: 3 без аксиом, 24 × `propext`) | производная, exit 0, `sorryAx` отсутствует |
| `ricis-chatbot-monetization.lean` | `LEAN_VERIFIED` (2 теоремы: 1 без аксиом, 1 × `propext`) | производная, exit 0 |
| `ricis-navier-stokes-ast-bridge.standalone.lean` | `LEAN_VERIFIED` (2 теоремы × `propext`) | производная, exit 0 |
| `ricis-riemann-zeta-ast-bridge.standalone.lean` | `LEAN_VERIFIED` (2 теоремы × `propext`) | производная, exit 0 |
| `ricis-backend-exact-reduction.standalone.lean` | **`LEAN_VERIFIED`** (22 теоремы: 6 без аксиом, 16 × `propext`) | подстановка `ℕ → Nat` подтверждена прогоном: exit 0, 0 ошибок, `sorryAx` отсутствует (в run 34858902595 было 22 ошибки и 8 × `sorryAx`) |
| `database-a6-0_5_inf_3.standalone.lean` | `LEAN_VERIFIED` (19 теорем: 16 без аксиом, 3 × `propext`) | производная без подстановок, exit 0 |
| `database-registry-120-jacobian.standalone.lean` | `LEAN_VERIFIED` (19 теорем: 16 без аксиом, 3 × `propext`) | производная без подстановок, exit 0. Граница: доказан сгенерированный мост записи реестра, **не** гипотеза Якоби (F-05) |
| `ricis-v79-monolith.standalone.lean` | `NOT_VERIFIED_CORE_ONLY` (F-06) | `ℕ → Nat` устранил все 15 ошибок и весь `sorryAx`: 31 теорема напечатана (3 без аксиом, 28 × `propext`), **но** exit 1 — `392:2 No goals to be solved` (8 избыточных буллетов `· rfl` после `repeat constructor`). По критерию «нет ошибок компилятора» `LEAN_VERIFIED` не устанавливается |
| `ricis-jacobian-conjecture.standalone.lean` | **`SOURCE_REJECTED_BY_KERNEL`** (исходник) → `NOT_VERIFIED_CORE_ONLY` (производная), F-01 | исходник не парсится: конструктор `partial` — зарезервированное слово Lean (`24:12 expected token`). После заявленного переименования `partial → partialDeriv` файл парсится, но `62:2 Tactic `rfl` failed: resolveRICIS (…) is not definitionally equal to (F.mul G).sub RExpr.zero.zeroF` → `Jacobian_singularity_resolved` несёт `sorryAx`. `trustStatus: TRUSTED_AXIOM` в метаданных необоснован |
| `ricis-kernel-ast-sp5.standalone.lean` | `NOT_VERIFIED_CORE_ONLY` (F-07) | `ℚ → Rat` устранило нотацию, но `26:2 error(lean.synthInstanceFailed): failed to synthesize instance of type class Decidable (a = b)` → обе теоремы (`singular_div_identity`, `ricis_reduce_divself`) с `sorryAx`. Ремонт принят: `deriving DecidableEq, Repr` у `RExpr` (commit `8665a06` в `main`) встроен в генератор как заявленная подстановка, производная перегенерирована — ожидает повторного прогона |
| `ricis-seed-expansion-a11.lean` | `NOT_VERIFIED_CORE_ONLY` (F-08) | заявленная замена Mathlib-леммы `List.mem_of_mem_append_left` → `List.mem_append.mpr (Or.inl hr)` неприменима: `104:4 Type mismatch` (после `induction` цель `r ∈ a✝¹.rules` не содержит `++`), `105:4 Tactic `split` failed`, `156:63`/`165:50`/`176:105 unsolved goals` → 3 из 6 теорем с `sorryAx`. Это дефект самой подстановки |
| `RicisAgiTarget.lean`, `jacobian-counterexample-full.lean` | `REQUIRES_CORE_LEAN` | реально требуют Mathlib: `ℝ`/`ℚ` + `ring`/`norm_num`; статус не повышается |
| `*.generated.lean` (2 файла) | фрагменты | 3-строчные фрагменты без namespace/imports, ссылаются на символы соответствующих `.standalone.lean`; отдельно ядром не проверяются |

Итог run [34870620154](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/34870620154): **8 целей exit 0 без `sorryAx`, 4 цели exit 1**
(v79 — без `sorryAx`, но с ошибкой компилятора; jacobian, sp5, a11 — с `sorryAx`). Детальные первопричины,
планы ремонта и пофамильный статус каждой теоремы — в [`core-checks/kernel-findings.json`](core-checks/kernel-findings.json)
и в [`docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md`](../../docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md) (§6).

### Граница доверия

Ядровой прогон подтверждает **структурные теоремы артефакта** (например
`ricisReduce (divSelf e) = one`, `resolveRICIS (mul (zeroF F) (infF G)) = mul F G`). Он **не** является
доказательством эмпирических утверждений узлов карты (гипотеза Римана, Навье–Стокс, якобиан,
AGI-метрики, экономика). `propext` — стандартная аксиома Lean, не `sorryAx`; заявление
«не зависит ни от одной аксиомы» допустимо только для класса `LEAN_VERIFIED_AXIOM_FREE`.

Per AGENTS.md §7, artifact sources are immutable; status metadata is recorded here, in
`core-checks/kernel-findings.json` and in the evidence document, never by rewriting the sources.
