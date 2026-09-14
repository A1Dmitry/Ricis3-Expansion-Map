# Ядровой прогон Lean 4.33.1 по core-check производным артефактов `artifacts/proofs`

**Дата:** 2026-09-14
**Версия приложения:** 0.4.182
**Workflow:** [`lean-artifact-kernel-check.yml`](../../../.github/workflows/lean-artifact-kernel-check.yml)
**Run:** [34858902595](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/34858902595) ([job 104025599997](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/34858902595/job/104025599997)), PR #37, ветка `arena/01a0a04c-ricis3-expansion-map`
**Ядро:** Lean 4.33.1, x86_64-unknown-linux-gnu, commit `819816b2e0a3bf405af45ae5c7af2491d8f5bee6`, Release (elan, `--default-toolchain 4.33.1`)
**Команда:** `lean +4.33.1 <artifact>` для каждой цели
**Хост:** ubuntu-latest (GitHub Actions)
**Сырое evidence:** [`lean-kernel-run-34858902595.pr-comment.txt`](lean-kernel-run-34858902595.pr-comment.txt) (полный вывод компилятора по каждому файлу, sha256, toolchain)
**Машиночитаемый реестр:** [`artifacts/proofs/core-checks/kernel-findings.json`](../../../artifacts/proofs/core-checks/kernel-findings.json)

> Канал evidence: логи раннера и загруженный артефакт `lean-kernel-evidence` из среды агента не читаются
> (`results-receiver.actions.githubusercontent.com`, `productionresultssa*.blob.core.windows.net` недоступны),
> поэтому единственным достоверным каналом является комментарий PR — шаг его публикации переведён на
> `if: always()` (ранее при падении прогона evidence не публиковался вообще, см. F-04).

---

## 1. Что проверялось и почему это законно

Исходные артефакты `artifacts/proofs/*.lean` **неизменяемы** (AGENTS.md §7). Проверялись
**новые версии доказательства** — самодостаточные производные
`artifacts/proofs/core-checks/*.core-check.lean`, которые генерирует
[`scripts/generateLeanCoreChecks.ts`](../../../scripts/generateLeanCoreChecks.ts):

```
производная = (исходник − неиспользуемая строка `import Mathlib`)
              [+ заявленные точечные подстановки]
              + ДОБАВЛЕННЫЙ В КОНЕЦ эпилог `#print axioms` для каждой theorem
```

Свойства, которые защищает [`tools/leanKernelCoreChecks.test.ts`](../../../tools/leanKernelCoreChecks.test.ts) (10 тестов):

* повторная генерация даёт **побайтово** тот же текст (детерминизм, без меток времени);
* префикс производной **байт-в-байт** равен исходнику без неиспользованного импорта — ни одна декларация не переписана и не удалена;
* исходники не изменены: их sha256 зафиксирован в `core-checks/manifest.json` и совпадает с evidence 2026-09-14;
* каждая цель `#print axioms` — реально объявленная теорема производной (полное квалифицированное имя);
* каталог не содержит «ручных» файлов вне генератора;
* **любая подстановка обязана иметь установленную первопричину** (`sourceFindings`): замена байтов без факта, полученного прогоном ядра или аудитом исходников Lean 4.33.1, считается подгонкой evidence (ТУФТА) и тестом не пропускается;
* `contentHash` в метаданных `*.json` равен sha256 соответствующего Lean-исходника;
* каждый артефакт с `trustStatus: TRUSTED_AXIOM` имеет путь ядерной проверки или явное Mathlib-основание.

---

## 2. Результаты прогона (дословно из run 34858902595)

| Артефакт (проверяемый файл) | Exit | Теорем | Аксиомы | Исход |
| :-- | :-: | :-: | :-- | :-- |
| `database-a6-minimal-core-check.lean` | 0 | 1 | нет | `LEAN_VERIFIED` (подтверждение run 34851801990) |
| `core-checks/ricis-universal-orchestration-template.core-check.lean` | 0 | 27 | 3 без аксиом, 24 × `propext` | **`LEAN_VERIFIED`** |
| `core-checks/ricis-chatbot-monetization.core-check.lean` | 0 | 2 | 1 без аксиом, 1 × `propext` | **`LEAN_VERIFIED`** |
| `core-checks/ricis-navier-stokes-ast-bridge.standalone.core-check.lean` | 0 | 2 | 2 × `propext` | **`LEAN_VERIFIED`** |
| `core-checks/ricis-riemann-zeta-ast-bridge.standalone.core-check.lean` | 0 | 2 | 2 × `propext` | **`LEAN_VERIFIED`** |
| `core-checks/ricis-v79-monolith.standalone.core-check.lean` | 1 | 31 (28 приняты: 2 без аксиом + 26 × `propext`) | 15 ошибок, 3 × `sorryAx` | `NOT_VERIFIED_CORE_ONLY` — первопричина установлена |
| `core-checks/ricis-backend-exact-reduction.standalone.core-check.lean` | 1 | 20 напечатано (12 приняты × `propext`); 2 декларации не созданы | 22 ошибки, 8 × `sorryAx` | `NOT_VERIFIED_CORE_ONLY` — первопричина установлена |
| `core-checks/ricis-jacobian-conjecture.standalone.core-check.lean` | 1 | 1 | 7 ошибок | **`SOURCE_REJECTED_BY_KERNEL`** — исходник не парсится |

Итог шага: `FAILED (exit 1)` — три файла не прошли; evidence опубликовано по каждому файлу отдельно.

### 2.1 Что именно доказано ядром

* **Универсальный оркестрационный шаблон (все 27 напечатанных теорем приняты, `sorryAx` отсутствует):** A1, A2, A4, A5, A6, A7, A10,
  L0-непрерывность, L1-тождество, SP2, SP4, 4D-остаток системы, счётчики шагов и ошибки,
  эквивалентность CPU/CUDA-представлений, `RICIS_unified`.
  `RICIS_Template.L1_identity`, `SP4_preserves_parent`, `mySystem_error_zero` — «does not depend on any axioms».
* **A6-мост монетизации чат-бота:** `RICIS_Monetization.Chatbot_Monetization_Resolution`
  (`resolveRICIS (mul (zeroF Cost) (infF N)) = mul Cost N`) принята ядром, аксиомы: `propext`.
* **AST-мосты Навье–Стокса и дзета-функции:** структурная редукция `E/E → one` и её независимость от
  вложенности (`laplace`, `deriv`, `pole`, `analyticContinuation`) — приняты ядром, аксиомы: `propext`.

`propext` — стандартная аксиома Lean (не `sorryAx`): доказательства настоящие, но заявление
«не зависит ни от одной аксиомы» для них недопустимо. Реестр разделяет классы
`LEAN_VERIFIED_AXIOM_FREE` и `LEAN_VERIFIED_WITH_STANDARD_AXIOMS` (F-03).

---

## 3. Первопричины, установленные прогоном (дословные ошибки ядра)

### 3.1 `ℕ` — нотация Mathlib, а не ядра (v79-monolith, backend-exact-reduction)

```text
301:26: error(lean.synthInstanceFailed): failed to synthesize instance of type class
  OfNat ℕ 1
203:2: error: Tactic `induction` failed: major premise type is not an inductive type
  ℕ
ℕ : Sort u_1
```

Ядро без Mathlib elaborирует `ℕ` как **свободную переменную** (`ℕ : Sort u_1`), а не как `Nat`:
в ядре 4.33.1 нотация `ℕ` не объявлена — есть только подсказка `@[suggest_for ℕ]`
(`src/Init/Prelude.lean:1238`) при том, что `instance instOfNatNat (n : Nat) : OfNat Nat n`
в ядре присутствует (`src/Init/Prelude.lean:1278`). Следствие: `resolveSteps`/`resolveError`
(v79) и `reductionSteps`/`exprSize`/`runReduced`/`repeatedError` (backend) не создаются,
а зависящие от них теоремы получают `sorryAx`:

* v79: `ns_steps_4D`, `ns_error_zero`, `RICIS_v79_unified` — `[propext, sorryAx]` / `[sorryAx]`;
* backend: 8 теорем с `sorryAx`, `RICIS.repeated_error_zero` и `RICIS.error_independent_of_iterations`
  — `Unknown constant` (декларации не созданы).

**Контроль:** идентичный по структуре `ricis-universal-orchestration-template.lean`, где счётчики
объявлены как `Nat`, тем же ядром компилируется с exit 0 и без `sorryAx`. Диагноз подтверждён
экспериментом, а не догадкой.

**Ремонт:** подстановка `ℕ → Nat` (2 вхождения в v79, 8 в backend) — тот же тип, ядро-совместимая
нотация; зафиксирована в плане генератора и в эпилоге производных. Ожидает повторного прогона.

### 3.2 `partial` — зарезервированное слово: исходник якобиана не парсится

```text
24:12: error: expected token
29:4: error: Invalid pattern variable: Variable name must be atomic, but `RExpr.zero` has multiple components
40:4: error: Invalid pattern: Expected a constructor or constant marked with `[match_pattern]`
92:14: error(lean.unknownIdentifier): Unknown constant `RICIS_Jacobian.Jacobian_singularity_resolved`
```

Строка 25 исходника `artifacts/proofs/ricis-jacobian-conjecture.standalone.lean`:
`  | partial (F x : RExpr)`. `partial` — ключевое слово Lean 4 (модификатор определений),
поэтому конструктор не парсится, индуктив `RExpr` не создаётся, и весь файл рассыпается.
**Это не зависит от Mathlib: файл никогда не был проверен ни одним ядром Lean**, хотя его
метаданные заявляют `TRUSTED_AXIOM`, а `initialMap` показывает узел `registry-120` как
`TRUSTED_AXIOM` с тем же хешем (F-01).

Ядро подтвердило только `RICIS_Jacobian.Jacobian_L1_identity` (`e = e`, без аксиом) —
тривиальное тождество, а не разрешение сингулярности якобиана.

**Ремонт:** новая версия доказательства с переименованием неиспользуемого конструктора
`partial → partialDeriv`. Основание точечности: имя встречается в файле ровно один раз
(строка 25), ни `ricisResolve`, ни одна из двух теорем его не используют. Ожидает повторного прогона.

### 3.3 `ℚ` и `List.mem_of_mem_append_left` (пакет 2, статический аудит ядра 4.33.1)

* нотация `ℚ` в ядре не объявлена (`src/Init/Data/Rat/Basic.lean` содержит тип `Rat` с
  `deriving DecidableEq, Hashable` и лишь `@[suggest_for ℚ]`) → в производной SP5 подстановка `ℚ → Rat`;
* `List.mem_of_mem_append_left` в ядре 4.33.1 **отсутствует** (в `src/Init/Data/List/Lemmas.lean`
  есть `mem_append` (`:1598`, `@[simp]`), `mem_append_cons_self`, `not_mem_append`) → в производной
  модели семени A11 подстановка на ядровой эквивалент `List.mem_append.mpr (Or.inl hr)`;
  формулировка `monotonic_growth` не меняется;
* `split` — core-тактика (`src/Init/Tactics.lean:1205`), `simpa`/`simp` — ядро 4.33.1,
  поэтому модель A11 и два `database-*.standalone.lean` не требуют Mathlib помимо указанных точечных замен.

---

## 4. Найденные нарушения (ТУФТА / дефекты evidence)

| ID | Severity | Суть | Статус |
| :-- | :-- | :-- | :-- |
| **F-01** | CRITICAL | `ricis-jacobian-conjecture.standalone.lean` не является валидным Lean-файлом, но заявлен как `TRUSTED_AXIOM` (JSON-метаданные, `initialMap.proofs['registry-120']`, LaTeX-отчёт). QA-тест `src/model/jacobianProof.test.ts` проверяет лишь **текстовое** присутствие строки `theorem Jacobian_singularity_resolved` и утверждает сам статус — классическая подмена основания метрикой. | Факт зафиксирован evidence. Решение за владельцем: (а) принять новую версию доказательства с переименованием конструктора и повторным прогоном, либо (б) понизить статус с обновлением QA-контрактов. Молчаливая демонтажа авторизованного результата не выполнялась (C-03). |
| **F-02** | HIGH | `LEAN_VERIFIED`/`TRUSTED_AXIOM` в `initialMap` (6 записей) и `TRUSTED_AXIOM` в 5 JSON были выставлены **без** ядерного прогона; evidence 2026-09-14 прямо фиксировало «14 Mathlib-артефактов — `REQUIRES_CORE_LEAN`, статус не повышен». | Частично закрыто: 4 артефакта получили фактический прогон ядра (exit 0, без `sorryAx`). v79 и backend — первопричина устранена, ожидают повторного run. jacobian — см. F-01. |
| **F-03** | MEDIUM | Зависимость от `propext` не фиксировалась: заявление «без аксиом» смешивалось с доказательствами, зависящими от стандартных аксиом Lean. | Закрыто: раздельные классы `LEAN_VERIFIED_AXIOM_FREE` / `LEAN_VERIFIED_WITH_STANDARD_AXIOMS` в реестре и по каждой теореме. |
| **F-04** | MEDIUM | Дефект workflow: фильтр `grep -E "has (no axioms|axioms)\|^database"` не соответствовал реальной формулировке ядра (`does not depend on any axioms`) — секция «#print axioms output» в run 34851801990 была пустой; шаг публикации комментария PR не имел `if: always()`, из-за чего падение run 34857939167 осталось без evidence. | Закрыто в этом PR: корректный фильтр, брак по `sorryAx`, `if: always()`, диагностика окружения до цикла, материализованный `targets.txt`, исход шага в `GITHUB_OUTPUT`. |
| **F-05** | HIGH | Семантическая граница: kernel-прогон доказывает структурные AST-теоремы (`ricisReduce (divSelf e) = one`, `mul (zeroF F) (infF G) = mul F G`), тогда как узлы карты и LaTeX-отчёты по тем же хешам формулируют это как доказательство гипотезы Римана / Навье–Стокса / якобиана. | Граница зафиксирована в эпилоге каждой производной, в реестре и в этом документе. Изменение формулировок узлов — отдельное решение владельца (E-03). |

---

## 5. Граница доверия (строго)

* **Доказано ядром Lean 4.33.1 (exit 0, `sorryAx` отсутствует):** структурные теоремы четырёх артефактов
  (шаблон оркестрации, A6-мост монетизации, AST-мосты Навье–Стокса и дзета-функции) плюс ранее
  верифицированный A6-минимум. Для части теорем зависимость — `propext` (стандартная аксиома Lean).
* **Не доказано:** заголовочная `RICIS_v79_unified` и счётчики v79/backend в core-only прогоне
  (`sorryAx` как каскад от `ℕ`); центральная `Jacobian_singularity_resolved` (декларация не создана);
  всё, что требует Mathlib (`RicisAgiTarget.lean` — `ℝ`+`ring`, `jacobian-counterexample-full.lean` —
  `ℚ`+`ring`/`norm_num`) — статус `REQUIRES_CORE_LEAN` не изменялся.
* **Не утверждается:** что kernel-прогон структурной AST-теоремы является доказательством эмпирического
  или Clay-утверждения узла карты (F-05); что метаданные `TRUSTED_AXIOM`/`LEAN_VERIFIED` в `initialMap`
  и `*.json` автоматически стали обоснованными для всех узлов — обоснованы только перечисленные в §2.1.
* Статусы записываются **снаружи** исходников (реестр, manifest, этот документ); байты артефактов не менялись.

---

## 6. Ожидает прогона ядра (пакет 2)

Зафиксированы в ветке, в allowlist workflow попадают автоматически (каталог `core-checks`):

| Производная | Подстановки | Основание |
| :-- | :-- | :-- |
| `ricis-v79-monolith.standalone.core-check.lean` | `ℕ → Nat` | §3.1 (run 34858902595) |
| `ricis-backend-exact-reduction.standalone.core-check.lean` | `ℕ → Nat` | §3.1 (run 34858902595) |
| `ricis-jacobian-conjecture.standalone.core-check.lean` | `partial → partialDeriv` (неиспользуемый конструктор) | §3.2 (run 34858902595) |
| `ricis-kernel-ast-sp5.standalone.core-check.lean` | `ℚ → Rat` | §3.3 (аудит ядра 4.33.1) |
| `ricis-seed-expansion-a11.core-check.lean` | `List.mem_of_mem_append_left → List.mem_append.mpr (Or.inl ·)` | §3.3 (аудит ядра 4.33.1) |
| `database-a6-0_5_inf_3.standalone.core-check.lean` | нет | тело core-only, `simpa` — core-тактика |
| `database-registry-120-jacobian.standalone.core-check.lean` | нет | тело core-only, `simpa` — core-тактика |

Прогон выполняется автоматически при push в `artifacts/proofs/**` (триггеры `pull_request`/`push`/
`workflow_dispatch`). До получения зелёного run статусы этих артефактов **не повышаются**.

---

## 7. Воспроизводимость

```bash
npm run bootstrap
npx tsx scripts/generateLeanCoreChecks.ts --check   # дрейф производных = exit 1
npx vitest run tools/leanKernelCoreChecks.test.ts   # 10 стражей неизменяемости и согласованности
gh workflow run lean-artifact-kernel-check.yml      # повторный прогон ядра (или push в artifacts/proofs/**)
```

Каждый прогон публикует: step summary, артефакт `lean-kernel-evidence` (90 дней) и комментарий PR
с полным логом компилятора и выводом `#print axioms` по каждой цели.
