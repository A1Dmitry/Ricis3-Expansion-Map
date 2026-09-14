# RICIS-III Core AGI Target Boundary Note

This directory contains artifacts for the RICIS-III core AGI target patch resolution.

Included files:
- `ricis_agi_target_sp4.tex`
- `RicisAgiTarget.lean`

**Specification Lean 4 DOI:** 10.5281/zenodo.22124493

## Kernel verification status (2026-09-14, обновлено прогоном run 34858902595)

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

| Артефакт | Статус после run 34858902595 | Основание |
| :--- | :--- | :--- |
| `database-a6-minimal-core-check.lean` | `LEAN_VERIFIED` (без аксиом) | exit 0; `'…database_a6_bridge' does not depend on any axioms` (run 34851801990, подтверждён) |
| `ricis-universal-orchestration-template.lean` | `LEAN_VERIFIED` (27 теорем: 3 без аксиом, 24 × `propext`) | производная, exit 0, `sorryAx` отсутствует |
| `ricis-chatbot-monetization.lean` | `LEAN_VERIFIED` (2 теоремы: 1 без аксиом, 1 × `propext`) | производная, exit 0 |
| `ricis-navier-stokes-ast-bridge.standalone.lean` | `LEAN_VERIFIED` (2 теоремы × `propext`) | производная, exit 0 |
| `ricis-riemann-zeta-ast-bridge.standalone.lean` | `LEAN_VERIFIED` (2 теоремы × `propext`) | производная, exit 0 |
| `ricis-v79-monolith.standalone.lean` | `NOT_VERIFIED_CORE_ONLY` | 15 ошибок: нотация `ℕ` (Mathlib) без Mathlib elaborируется как свободная переменная → `RICIS_v79_unified`, `ns_steps_4D`, `ns_error_zero` получили `sorryAx`. Ремонт (`ℕ → Nat`) зафиксирован, ожидает прогона |
| `ricis-backend-exact-reduction.standalone.lean` | `NOT_VERIFIED_CORE_ONLY` | та же первопричина `ℕ`: 22 ошибки, 8 × `sorryAx`, две декларации не созданы. Ремонт зафиксирован, ожидает прогона |
| `ricis-jacobian-conjecture.standalone.lean` | **`SOURCE_REJECTED_BY_KERNEL`** | исходник не парсится: конструктор `partial` — зарезервированное слово Lean (`24:12 expected token`), `Jacobian_singularity_resolved` — `Unknown constant`. Файл никогда не проверялся ядром, несмотря на `trustStatus: TRUSTED_AXIOM` в метаданных (F-01) |
| `ricis-kernel-ast-sp5.standalone.lean` | `REQUIRES_CORE_LEAN` → ожидает прогона | производная с подстановкой `ℚ → Rat` (нотация `ℚ` объявлена в Mathlib) |
| `ricis-seed-expansion-a11.lean` | `REQUIRES_CORE_LEAN` → ожидает прогона | производная с подстановкой Mathlib-леммы `List.mem_of_mem_append_left` на ядровой эквивалент `List.mem_append.mpr (Or.inl ·)`; формулировки теорем не изменены |
| `database-a6-0_5_inf_3.standalone.lean`, `database-registry-120-jacobian.standalone.lean` | `REQUIRES_CORE_LEAN` → ожидают прогона | тело core-only (`simpa` — core-тактика 4.33.1), производные без подстановок |
| `RicisAgiTarget.lean`, `jacobian-counterexample-full.lean` | `REQUIRES_CORE_LEAN` | реально требуют Mathlib: `ℝ`/`ℚ` + `ring`/`norm_num`; статус не повышается |
| `*.generated.lean` (2 файла) | фрагменты | 3-строчные фрагменты без namespace/imports, ссылаются на символы соответствующих `.standalone.lean`; отдельно ядром не проверяются |

### Граница доверия

Ядровой прогон подтверждает **структурные теоремы артефакта** (например
`ricisReduce (divSelf e) = one`, `resolveRICIS (mul (zeroF F) (infF G)) = mul F G`). Он **не** является
доказательством эмпирических утверждений узлов карты (гипотеза Римана, Навье–Стокс, якобиан,
AGI-метрики, экономика). `propext` — стандартная аксиома Lean, не `sorryAx`; заявление
«не зависит ни от одной аксиомы» допустимо только для класса `LEAN_VERIFIED_AXIOM_FREE`.

Per AGENTS.md §7, artifact sources are immutable; status metadata is recorded here, in
`core-checks/kernel-findings.json` and in the evidence document, never by rewriting the sources.
