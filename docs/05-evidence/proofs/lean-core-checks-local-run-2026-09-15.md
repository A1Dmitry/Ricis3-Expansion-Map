# Локальный ядерный прогон 2026-09-15 — ремонт A11 (F-08)

**Назначение.** Ядровой ремонт производной `ricis-seed-expansion-a11.core-check.lean` (F-08):
замена тактики `monotonic_growth` (написанной под семантику Mathlib-`split`) на ядровое
доказательство и усиление трёх identity-доказательств (`simp [h]` → `simp` + `assumption`).
Исходник `artifacts/proofs/ricis-seed-expansion-a11.lean` неизменён (AGENTS.md §7): ремонт —
заявленные подстановки в генераторе `scripts/generateLeanCoreChecks.ts`, производная
перегенерирована детерминированно (`--check`: drift 0).

## Toolchain

- **Lean 4.33.1, x86_64-unknown-linux-gnu, commit `819816b2e0a3bf405af45ae5c7af2491d8f5bee6`, Release** —
  **идентичный commit, что и в CI-закреплённом тулчейне** (ср. `generatedFrom.toolchain`
  `kernel-findings.json`: run 34891262489).
- Почему сборка из исходников: elan и CDN релизов GitHub (`elan.lean-lang.org`,
  `release-assets.githubusercontent.com`) недоступны из среды выполнения сессии (селективная
  сетевая изоляция); официальный исходный тег `v4.33.1` склонирован через `git clone` с
  `github.com`, двухэтапная бутстрап-сборка (stage0 + stage1) из закоммиченных исходников.
- Опции сборки и их влияние на проверяемость:
  - `USE_GMP=OFF` — встроенный bignum ядра; на проверкуProp-теорем артефакта не влияет;
  - `LLVM=OFF` — кодогенерация не участвует в kernel check;
  - `USE_MIMALLOC=OFF` — аллокатор, не влияет на ядро;
  - `libuv 1.48.0` — собран из официального тега github.com/libuv/libuv;
  - OpenSSL — **заглушка** (постоянные заголовки + пустые статические библиотеки): единственное
    использование OpenSSL в компиляторе — `lean_openssl_version`, возвращающая макрос
    `OPENSSL_VERSION_NUMBER` (`src/runtime/openssl.cpp`); символов OpenSSL в бинарнике не
    ссылки, на проверку .lean-файлов не влияет (проверено чтением исходников ядра 4.33.1).
- Компилятор проверен: `lean --version` →
  `Lean (version 4.33.1, commit 819816b2e0a3bf405af45ae5c7af2491d8f5bee6, Release)`.

## Команды

```
# 1) Воспроизведение F-08 на ТУРЯЩЕЙСЯ (до ремонта) производной:
lean artifacts/proofs/core-checks/ricis-seed-expansion-a11.core-check.lean   # exit 1

# 2) Прогон НОВОЙ (отремонтированной, перегенерированной) производной:
lean artifacts/proofs/core-checks/ricis-seed-expansion-a11.core-check.lean   # exit 0
```
(путь к бинарнику: `/tmp/lean4-build/stage1/bin/lean` среды сессии; `lean +4.33.1` из CI —
то же ядро, тот же commit.)

## Факт 1 — воспроизведение F-08 (дословно)

Вывод команды (1) на производной 0.4.195 (exit 1), ключевые ошибки — дословно, совпадают с
run 34870620154:

```
ricis-seed-expansion-a11.core-check.lean:104:4: error: Type mismatch
  List.mem_append.mpr (Or.inl hr)
has type
  r ∈ s.rules ++ ?m.77
but is expected to have type
  r ∈ a✝¹.rules
ricis-seed-expansion-a11.core-check.lean:105:4: error: Tactic `split` failed: Could not split an `if` or `match` expression in the goal
ricis-seed-expansion-a11.core-check.lean:156:63: error: unsolved goals
  ...
  ⊢ check inputForm outputForm = false
```

Диагностика отказа `split` (вывод при `trace.split.failure`) доказала первопричину дефекта
тактики исходника: ядровой `split` расщепляет **внешний** match по `ExpansionOutcome` и
оставляет равенство scrutinee **гипотезой**:

```
case h_2
s : Seed  form : String  resolve : Seed → Option Rule  r : Rule  hr : r ∈ s.rules
x✝ : ExpansionOutcome  a✝¹ : Seed  a✝ : String
heq✝ : (match resolve s with | none => rejected s "RESOLUTION_REQUIRED"
          | some r => if (!coreProtected r) = true then ... else ...) =
       ExpansionOutcome.rejected a✝¹ a✝
⊢ r ∈ a✝¹.rules
```

т.е. во второй ветви `split` (и в первой) цель — голый `r ∈ a✝¹.rules` **без if/match** —
повторный `split` невозможен, а `List.mem_append.mpr (Or.inl hr)` неприменим (цель не содержит
`++`). Тактика исходника (`split; · exact …; · split <;> simp [hr]`) написана под семантику
Mathlib-`split` и с ядром 4.33.1 несовместима — это и есть F-08.

## Факты 2–5 — семантика ядра, установленные экспериментом (минимальные примеры)

1. **`cases` по непрозрачному терму НЕ подменяет его вхождения в цель и контекст**
   (`cases resolve s with | none => … | some r0 => …` оставляет цель byte-in-place; во
   `some`-ветви зависимая элиминация падает: «Dependent elimination failed: Failed to solve
   equation none = f n»). Рабочая схема — **`let` + `change` + `cases` по let-константе**:
   `let` вводит терм, `change` (defeq) перестраивает цель через константу, `cases` подменяет
   константу в целевых вхождениях (проверено: после `cases b1` цель содержит `true`/`false`).
2. **Условия `if` над Bool в ядре 4.33.1 elaborируются как Prop-равенства** (в цели видно
   `if coreProtected r0 = false then …`); `cases` по такому Prop падает
   («generalize failed: result is not type correct» — нет `Decidable` для произвольного Prop).
   Корректно — case-split по **Bool-значению** (`coreProtected r0`) через let; после подстановки
   литерала `simp` сворачивает `if (true = false) then … else …` и match на конструкторе.
3. **Ядровой `simp`** сворачивает match на конструкторе (встроенное matching) и Prop-ite с
   литеральным условием, но НЕ раскрывает user-defs без явного указания и НЕ дотягивает
   identity-теоремы до `rfl`: после `unfold admitWithIdentity identityCoherent` `simp [h]`
   оставляет дословно `⊢ check inputForm outputForm = false` (лентер: «This simp argument is
   unused: h»); остаток совпадает с гипотезой `h` после раскрытия `identityCoherent` — закрыт
   `assumption`. (Проверено на минимальном примере и на самом артефакте.)
4. `List.mem_append` есть в ядре 4.33.1 (`@[simp]`, src/Init/Data/List/Lemmas.lean:1598) —
   в финальной ветке `simp` развивает `r ∈ s.rules ++ [r0]` в `r ∈ s.rules ∨ r = r0`,
   закрытое `Or.inl hr`.

## Факт 6 — зелёный прогон новой производной

Вывод команды (2) (exit 0, ошибок 0, `sorryAx` — 0 вхождений):

```
warning: Variable name `hok` is not explicitly referenced.   (пример A14; `hok` неиспользуем и в исходнике)
'RICIS.Seed.monotonic_growth' depends on axioms: [propext]
'RICIS.Seed.rejection_preserves_generation' depends on axioms: [propext]
'RICIS.Seed.no_commit_without_proof' depends on axioms: [propext]
'RICIS.Seed.core_rule_never_commits' depends on axioms: [propext]
'RICIS.Seed.identity_violation_never_commits' depends on axioms: [propext]
'RICIS.Seed.identity_ok_preserves_expansion' depends on axioms: [propext]
```

**Итог:** 6/6 теорем приняты ядром без `sorryAx`, все — только стандартный `propext`. F-08
устранён: производная больше не «ожидаемый отказ» и исключена из `ciPolicy.expectedFailures`.

## Граница и честность заявления

- Это **локальный** прогон (среда выполнения сессии от 2026-09-15), **не** GitHub Actions
  раннер: тулчейн собран из исходников официального тега v4.33.1 (commit идентичен CI-закреплённому),
  команда идентична (`lean <file>`), производная детерминирована генератором
  (`tools/leanKernelCoreChecks.test.ts`: перегенерация byte-in-byte, `--check` drift 0).
- Повторный прогон в CI (workflow `lean-artifact-kernel-check.yml`) — **ожидается**: соединение
  с GitHub в среде сессии обрывалось (истёк токен), пуш/PR задерживаются до восстановления
  подключения; при `workflow_dispatch`/PR прогон отработает на том же закреплённом тулчейне.
- До зелёного CI-прогона повышение статуса A11 опирается на факты этого локального прогона,
  что зафиксировано в реестре (`kernel-findings.json`, запись артефакта, поле `run`);
  сам прогон проверяет только структурные теоремы A11, а не эмпирические утверждения узлов карты.
