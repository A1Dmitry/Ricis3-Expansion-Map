# RICIS SEED — протокол саморасширения (A11): отчёт о фактическом прогоне

**Дата:** 2026-09-12
**Версия приложения:** 0.4.163
**Модуль:** `src/ricisSeed` (чистый домен, без React/DOM/сети)
**Единый документ:** [`docs/01-architecture/ricis-unified-complete-document-8.0-seed-expansion.json`](../../01-architecture/ricis-unified-complete-document-8.0-seed-expansion.json)
**Lean-модель (черновик):** [`artifacts/proofs/ricis-seed-expansion-a11.lean`](../../../artifacts/proofs/ricis-seed-expansion-a11.lean)

---

## 1. Что именно сделано

RICIS-III перестал быть застывшим списком правил: он задан как **семя** (seed) с оператором роста.

```
Ric.ExpandTo((x) => x.Resolve(UnsolvedSingularProblem))
```

* `x` — текущее состояние самой системы RICIS (аксиомы, покрытые формы, журнал), а не числовая переменная;
* `Resolve` — **разрешить и доказать** (возвращает сертификат доказательства, а не догадку);
* `ExpandTo` — **допуск** доказанного правила в аксиоматику, с независимыми воротами.

Формально: `R(k+1) = Ric.ExpandTo(R(k), Resolve(U(k))) = R(k) ∪ {A_new}`.

**A11 — это мета-аксиома (правило над системой правил), а не одиннадцатая математическая формула рядом с A1–A10.**
A11 входит в защищённое ядро: то, что она порождает, не вправе её переопределить.

---

## 2. Фактический прогон (R0 → R3)

Команда: `grow(Ric, [U-NESTED-SINGULAR-DIV, U-MIXED-ZERO-INF-DIFF, U-INF-SELF-DIFF])`

| Поколение | Отпечаток | Правил |
|---|---|---|
| R0 (зерно) | `seed-v1:fa42fc7b5dd510b1` | 21 |
| R1 | `seed-v1:664a5891eff96ce5` | 22 |
| R2 | `seed-v1:d6b5705b062e70a0` | 23 |
| R3 | `seed-v1:d24f16c96fbcf443` | 24 |

### Журнал развёртывания

| # | Проблема U | Форма | Аксиома | Доказательство | R(k) → R(k+1) |
|---|---|---|---|---|---|
| 0 | U-NESTED-SINGULAR-DIV | `(0_F/0_G)/(0_H/0_K)` | **A12** | A4 → A4 → CLASSICAL (INHERITED_CLASSICAL) | R0 → R1 |
| 1 | U-MIXED-ZERO-INF-DIFF | `0_F*(inf_G-inf_H)` | **A13** | A7 → A6 (RICIS_STRUCTURAL, без классических шагов) | R1 → R2 |
| 2 | U-INF-SELF-DIFF | `inf_F-inf_F` | **A14** | A7 → локальная редукция → A2 (RICIS_STRUCTURAL) | R2 → R3 |

### Выращенные правила

* **A12:** `(0_F/0_G)/(0_H/0_K) = (F*K)/(G*H)` — `axiom-v1:05705443f0f233c8`
* **A13:** `0_F*(inf_G-inf_H) = F*(G-H)` — `axiom-v1:026c9d5bbc5948c8`
* **A14:** `inf_F-inf_F = 1` — `axiom-v1:cb8d045819ee4f3b`

Все три — **производные правила**: доказаны исключительно из аксиом зерна (плюс один явно помеченный классический шаг в A12).
Это не новые независимые допущения.

---

## 3. Ворота допуска (что именно запрещено)

| Ворота | Правило | Код отказа |
|---|---|---|
| RESOLUTION_PRESENT | есть сертификат доказательства, strategy ≠ UNPROVEN | `RESOLUTION_REQUIRED` |
| CORE_PROTECTED | кандидат не из ядра (L0/L1/L1C*, SP1–SP5, P1, A11) | `PROTECTED_CORE_MUTATION` |
| NO_FORBIDDEN_SEMANTICS | нет пределов Коши, нет eps-порогов; LEAN_KERNEL — только с kernel run | `FORBIDDEN_NON_RICIS_SEMANTICS` |
| NO_SELF_CERTIFICATION | шаг доказательства не ссылается на вводимую аксиому | `SELF_CERTIFICATION` |
| RULE_SET_CLOSED | каждое правило шага уже есть в R(k) | `PROOF_RULE_UNKNOWN` |
| PROOF_CHAIN_CONNECTED | цепочка начинается с формы U, без разрывов, завершается формулировкой кандидата | `PROOF_CHAIN_BROKEN` / `PROOF_CONCLUSION_MISMATCH` |
| PROBLEM_OPEN_IN_RICIS | форма ещё не покрыта R(k) | `PROBLEM_ALREADY_COVERED` |
| NO_DUPLICATE_AXIOM | уникальны и идентификатор, и отпечаток | `DUPLICATE_AXIOM` |
| CONSISTENCY_TABLE | одна входная форма → один выход | `CONTRADICTS_EXISTING_AXIOM` |
| MONOTONIC_COMMIT | R(k) ⊂ R(k+1), отпечатки прежних аксиом сохранены | `INVALID_CANDIDATE` |

### Фактически проверенные отказы

| Сценарий | Форма | Итог |
|---|---|---|
| Класс открыт, доказательства нет | `(0_F)^(inf_G)` | `RESOLUTION_REQUIRED` (не зафиксировано) |
| Самосертификация (шаг ссылается на A15) | `inf_F*0_G` | `SELF_CERTIFICATION` |
| Кандидат переопределяет доказанную форму | `(0_F/0_G)*(0_H/0_K)` | `CONTRADICTS_EXISTING_AXIOM` |
| Попытка переопределить L1 | `0_F/0_F` | `PROTECTED_CORE_MUTATION` |
| Форма уже покрыта A6 | `0_F*inf_G` | `PROBLEM_ALREADY_COVERED` |

Во всех пяти случаях отпечаток поколения не изменился: **отказ ничего не портит**.

---

## 4. Граница доверия (строго)

* **Локальная структурная проверка** (ворота, отпечатки, монотонность, детерминизм) выполнена в TypeScript:
  48 тестов `src/ricisSeed/*` + 6 тестов страницы `src/ui/RicisSeedPage.test.tsx` — все зелёные.
* **Это НЕ запуск ядра Lean.** Статус верификации Lean для слоя развёртывания: `REQUIRES_CORE_LEAN`
  (нужны toolchain, compiler output, `#print axioms`, отсутствие `sorryAx`).
* Lean-модель в `artifacts/proofs/ricis-seed-expansion-a11.lean` — **черновик спецификации**,
  ядром в этом репозитории не проверялась; статус не повышался.
* **Известное ограничение:** таблица согласованности — проверка по точной форме.
  Она ловит явные противоречия, но не является полной процедурой унификации;
  например, частный случай общей формы не проверяется автоматически. Полнота требует Lean.
* **Оговорка про SP5/P1/A3:** ядро R0 приведено к v7.9 — добавлены L1C3, SP5, P1;
  аксиома A3 помечена снятой (`deprecated`) согласно `AXIOMS.deprecated` v7.7/v7.9
  и в активное зерно не входит, но сохраняется в исторической таблице `src/ricisSeed/seedTable.ts`.

---

## 5. Воспроизводимость

Отпечатки структурные и детерминированные: в модуле запрещены `Math.random`, `Date.now`,
`node:crypto` и любые обращения к сети/DOM (проверяется тестом топологии).
Два независимых прогона дают одинаковые `seed-v1:*` для R0…R3.
Отпечаток аксиомы не включает provenance (origin/proof), поэтому одинаковая математика
не может быть выдана за две разные аксиомы.
