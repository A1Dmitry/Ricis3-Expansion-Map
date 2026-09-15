# Активные задачи проекта (RICIS Expansion Map Active Tasks)

В этом документе собран актуальный перечень активных и запланированных задач проекта **RICIS Expansion Map** согласно правилам разработки RICIS-III Agile Pipeline и протоколу RCVAP.

## 1. Текущие завершённые и верифицированные задачи

### **[RICIS-7.7-GEOMETRIC-BRIDGE-RUNTIME] Полное расширение 2D Geometric Bridge Runtime ($R^2_{RICIS}$) для $0/0$, $\infty/\infty$, $\infty-\infty$, $0-0$ и косого произведения в $O(1)$**
* **Статус:** `G4_DEVELOPMENT_COMPLETED` (Верифицировано независимыми unit-тестами)
* **Результаты:** Полная типизация операций и интерактивный visualizer.

### **[P5-EXACT-SYMBOLIC-RUNTIME] Полное символьное ядро без эвристик (`Math.abs < eps`)**
* **Статус:** `G4_DEVELOPMENT_COMPLETED` (Верифицировано, 100% прохождение тестов)
* **Результаты:** Устранены любые числовые пороги для константной свертки и семантического индексирования. Символьная редукция AST теперь абсолютно строгая.

### **[P6-KINEMATIC-ENGINEERING] Символьное ядро вычисления Null-space якобиана**
* **Статус:** `G4_DEVELOPMENT_COMPLETED` (Верифицировано, интегрировано в `planar3LinkKinematicService.ts`)
* **Результаты:** Реализовано символьное вычисление вектора Null-space через векторное произведение строк Jacobian AST. Внедрено в вычисление самодвижения (self-motion escape gradient).

### **[P7-DLS-VS-RICIS-BENCHMARK] Воспроизводимый headless-бенчмарк для сравнения DLS и RICIS**
* **Статус:** `G4_DEVELOPMENT_COMPLETED` (Верифицировано, добавлено в `kinematicBenchmark.ts` & `kinematicBenchmark.test.ts`)
* **Результаты:** Протестировано 3 сценария сингулярности (Boundary reach, Elbow fold, Shoulder pole). Доказана высокая точность и стабильность направления RICIS по сравнению с Damped Least Squares.

### **[TEST-SUITE-RESTORE] Восстановление верифицируемого 100% Green тестового набора**
* **Статус:** `G4_DEVELOPMENT_COMPLETED` (независимая проверка: `npm run lint && npm test && npm run build` — 1852/1852 зелёные на чистой ветке)
* **Результаты:** На базе ветки тест `src/App.routeTopology.test.ts` падал: маркер roadmap-ветки указывал на устаревшую форму маршрутизации (`roadmapParams.get('view') === 'roadmap'`), в то время как roadmap стал applet-ветвью центрального switch (`case 'roadmap':`, deep-link контракт через `AppletNavigationService`). Приоритетный порядок (error → hydration → recovery → applet-выбор → map default) сохранён, тест теперь утверждает актуальные маркеры ветвей. Зафиксировано нарушение анти-туфты: до исправления заявление «100% Green» в документации не соответствовало реальному прогону.

### **[LEAN-KERNEL-VERIFY] Воспроизводимая ядровая проверка Lean-артефактов (пinned toolchain 4.33.1)**
* **Статус:** `G4_DEVELOPMENT_COMPLETED` для self-contained артефактов; `REQUIRES_CORE_LEAN` сохранён для 14 Mathlib-артефактов (статус не повышен)
* **Результаты:**
  * Новый workflow `lean-artifact-kernel-check.yml`: ядро Lean 4.33.1 (elan, `--default-toolchain 4.33.1`), явный allowlist `NO_MATHLIB_ARTIFACTS`, фиксация sha256 исходников, полного вывода компилятора и `#print axioms`; evidence публикуется в step summary, артефакте и комментарии PR.
  * `database-a6-minimal-core-check.lean` повышен до `LEAN_VERIFIED`: run 34851801990, exit 0, без `sorryAx`, `#print axioms`: «does not depend on any axioms».
  * Evidence: [`docs/05-evidence/proofs/lean-kernel-run-2026-09-14.md`](docs/05-evidence/proofs/lean-kernel-run-2026-09-14.md); байты исходников не изменялись (AGENTS.md §7).

### **[LEAN-CORE-CHECK-COVERAGE] Ядерная проверка Lean 4.33.1 для Mathlib-свободных артефактов и закрытие дрейфа статусов `TRUSTED_AXIOM` / `LEAN_VERIFIED`**
* **Статус:** `PARTIALLY_COMPLETED` (пакеты 1 и 2 прогнаны фактически: run 34858902595 + run 34870620154; 8 из 12 целей exit 0; v79 и SP5 — ремонты выполнены, повторный прогон в этом PR; jacobian и A11 — ciPolicy-отказы с установленными основаниями; F-01: решение владельца по артефактному уровню внесено, узел-уровень — L9)
* **Основание задачи (аудит Md + Lean):** метаданные `artifacts/proofs/*.json` (5 файлов) заявляли `TRUSTED_AXIOM`, а `src/model/initialMap.ts` (6 записей, включая LaTeX «Axiom Status: LEAN_VERIFIED») — `LEAN_VERIFIED`, тогда как AGENTS.md §7 / E-03 / E-04 требуют для этих статусов фактический ядерный прогон. Единственный прогон (run 34851801990) покрывал один файл, потому что остальные 14 начинаются с `import Mathlib`.
* **Результаты (run [34858902595](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/34858902595) — пакет 1; run [34870620154](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/34870620154) — пакет 2; Lean 4.33.1, `lean +4.33.1 <artifact>`):**
  * Генератор [`scripts/generateLeanCoreChecks.ts`](scripts/generateLeanCoreChecks.ts) создаёт **новые версии доказательства** (`artifacts/proofs/core-checks/*.core-check.lean`) из неизменённых исходников: `производная = (исходник − неиспользуемая строка import Mathlib) [+ заявленные точечные подстановки] + добавленный эпилог #print axioms`. Исходники не переписаны (§7), sha256 зафиксированы в `core-checks/manifest.json`.
  * **`LEAN_VERIFIED`** (exit 0, `sorryAx` отсутствует): `ricis-universal-orchestration-template.lean` (27 теорем: 3 без аксиом, 24 × `propext`), `ricis-chatbot-monetization.lean` (2), `ricis-navier-stokes-ast-bridge.standalone.lean` (2), `ricis-riemann-zeta-ast-bridge.standalone.lean` (2) — run 34858902595; `ricis-backend-exact-reduction.standalone.lean` (22 теоремы), `database-a6-0_5_inf_3.standalone.lean` (19), `database-registry-120-jacobian.standalone.lean` (19) — run 34870620154; подтверждён `database-a6-minimal-core-check.lean`. SP5: файл той же содержательной версии зелёный на main (коммит 8665a06, run 34877214125); перегенерированная производная (с `deriving DecidableEq, Repr`) повторно проверяется прогоном этого PR.
  * **Первопричины отказов установлены дословными ошибками ядра:** (1) `ℕ` — нотация Mathlib → v79/backend (run 34858902595), устранено подстановкой `ℕ → Nat`; (2) v79: 8 избыточных буллетов `· rfl` после `repeat constructor` — 392:2 «No goals to be solved» при полностью доказанных 31 теоремах (F-06), устранено подстановкой в генераторе 0.4.189; (3) SP5: `Decidable (a = b)` не синтезируется без `deriving DecidableEq` (F-07), клауза введена (main 8665a06 + подстановка в генераторе); (4) jacobian: исходник не парсится (`partial` — зарезервированное слово), а после переименования `partial → partialDeriv` центральное тождество не определительное — 62:2 `rfl failed` → `sorryAx` (F-01): TRUSTED_AXIOM необоснован в любой конфигурации; (5) A11: подстановка Mathlib-леммы неприменима после `induction` (104:4 Type mismatch) + core-simp (F-08).
  * **ciPolicy (ожидаемые отказы без маскировки):** единственная декларация «ожидаемого отказа» — `kernel-findings.json ciPolicy.expectedFailures` (jacobian — F-01, A11 — F-08; основания — дословные ошибки фактического прогона run 34870620154). Workflow читает список из реестра (jq), ожидаемый отказ маркируется `EXPECTED_FAIL` и не рвёт прогон, `sorryAx` в скопилированном файле всегда рвёт прогон (stop-the-line), любой ненадлежащий отказ рвёт прогон, невоспроизведённое ожидание помечается NOTE об обновлении реестра.
  * **Решение владельца по F-01 (артефактный уровень, 2026-09-14):** README `artifacts/proofs` (канонический, пересобран владельцем) классифицирует jacobian-артефакты как `STRUCTURALLY_VALIDATED` (не MATHEMATICALLY_PROVEN); `trustStatus` метаданных понижен `TRUSTED_AXIOM → STRUCTURALLY_VALIDATED`; QA-контракт `src/model/jacobianProof.test.ts` обновлён (QA-2 + QA-4 — связь с реестром).
  * Стражи: `tools/leanKernelCoreChecks.test.ts` — 17 тестов (побайтовая перегенерация, префиксное равенство исходнику, неизменность sha256, подстановка только с установленной первопричиной (включая вставочные подстановки), запрет повышения статуса по красному прогону, согласованность реестра/метаданных/документации, целостность ciPolicy и workflow).
  * Workflow: цели = явный allowlist + каталог производных; исправлен фильтр вывода `#print axioms` (прежний шаблон не совпадал с формулировкой ядра — секция evidence была пустой); добавлен брак по `sorryAx`; публикация evidence переведена на `if: always()`.
  * Evidence: [`docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md`](docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md), сырой лог [`…34858902595.pr-comment.txt`](docs/05-evidence/proofs/lean-kernel-run-34858902595.pr-comment.txt), реестр [`artifacts/proofs/core-checks/kernel-findings.json`](artifacts/proofs/core-checks/kernel-findings.json).
* **Найденная ТУФТА (зафиксирована, не замалчивается):**
  * **F-01 (CRITICAL):** `TRUSTED_AXIOM` для `ricis-jacobian-conjecture` при некомпилируемом исходнике; QA-1 проверяет лишь **текстовое** присутствие строки `theorem Jacobian_singularity_resolved` — подмена основания метрикой. Run 34870620154 усилил находку: даже после ремонта исходник (тождество не определительно, `rfl failed` → `sorryAx`). **Решение владельца (2026-09-14):** артефактный уровень — `STRUCTURALLY_VALIDATED` (README + понижение trustStatus метаданных + QA-контракт); узел-уровень (`initialMap registry-120`) — остаётся за владельцем (L9).
  * **F-02 (HIGH):** статусы `LEAN_VERIFIED`/`TRUSTED_AXIOM` в `initialMap` и JSON были выставлены без прогона ядра — закрыто фактическим прогоном для 7 артефактов (+SP5 на main): шаблон, монетизация, мосты NS/зета, backend, database×2.
  * **F-06 (MEDIUM) / F-07 (HIGH) / F-08 (MEDIUM):** v79-буллеты, SP5-экземпляр, дефект подстановки A11 — зафиксированы дословными ошибками run 34870620154; F-06 и F-07 исправлены подстановками в 0.4.189 (повторный прогон в этом PR), F-08 — отдельная задача ядрового ремонта.
  * **F-03 (MEDIUM):** зависимость от `propext` не фиксировалась; введены классы `LEAN_VERIFIED_AXIOM_FREE` и `LEAN_VERIFIED_WITH_STANDARD_AXIOMS`.
  * **F-04 (MEDIUM):** дефект workflow — пустая секция `#print axioms` и отсутствие evidence при падении; исправлено.
  * **F-05 (HIGH):** семантическая граница — прогон доказывает структурные AST-теоремы (`ricisReduce (divSelf e) = one`), а не гипотезу Римана / Навье–Стокса / якобиан, как формулируют узлы карты по тем же хешам.
* **Осталось (не закрыто):** (1) повторный прогон v79 (после F-06-ремонта) и SP5 (перегенерированная) в этом PR + внесение фактов в реестр; (2) решение владельца L9: узел `registry-120` в `initialMap` (TRUSTED_AXIOM) и F-05 (формулировки узлов карты); (3) F-08: ядровой ремонт A11 (тактические шаги под цели после induction, точки 156/165/176); (4) `RicisAgiTarget.lean` и `jacobian-counterexample-full.lean` остаются `REQUIRES_CORE_LEAN` (реально требуют Mathlib: `ℝ`/`ℚ` + `ring`/`norm_num`).
* **Граница доверия:** статусы записаны снаружи исходников; байты артефактов не изменялись; kernel-прогон не является подтверждением эмпирических утверждений узлов карты.

---

## 2. Приоритетный план работ (Dependency-Ordered Roadmap)

Граф зависимостей и порядок выполнения задач, основанный на результатах технического аудита:

| Приоритет | ID Задачи | Зависимости | Цель и область ответственности | Статус |
| :---: | :--- | :--- | :--- | :--- |
| **P0** | **GENERIC COMPOSITION / SUBSTITUTION** | Автономная задача | Внедрение единого дженерик-примитива структурной подстановки (`AstSubstitution.substitute`), формирующего DAG. | `G4_DEVELOPMENT_COMPLETED` |
| **P1** | **MANDELBROT AS GENERIC ITERATION TEST** | P0 | Проверка работы композиции на примере итерации $S_{n+1} = T(S_n)$ без создания фрактал-специфичных сущностей. | `G4_DEVELOPMENT_COMPLETED` |
| **P2** | **TEST SPECIFICATION** | P1 | Набор структурных unit-тестов для P0 и P1 (сохранение размерности, параметров, корректность структуры). | `G4_DEVELOPMENT_COMPLETED` |
| **P3** | **AST GRAPH / MEMORY** | P0, P2 | Инструментальное измерение O(n) роста графа и автоматического Structural Sharing (DAG) в памяти JS. | `G4_DEVELOPMENT_COMPLETED` |
| **P4** | **TS/C# GENERIC SEMANTIC GAP** | P0 | Закрытие разрыва в абстракциях с C#-версией (`Ricis.Core Compose / RebindTo`). | `G4_DEVELOPMENT_COMPLETED` |
| **P5** | **EXACT SYMBOLIC RUNTIME** | P0 | Замена числовых эвристик (`Math.abs < eps`) на строгую алгебраическую символьную редукцию AST. | `G4_DEVELOPMENT_COMPLETED` |
| **P6** | **KINEMATIC ENGINEERING** | P5 | Глубокая интеграция символьного RICIS-ядра для вычисления Null-space якобиана. | `G4_DEVELOPMENT_COMPLETED` |
| **P7** | **DLS VS RICIS BENCHMARK** | P6 | Создание воспроизводимого headless-бенчмарка (ошибки позиционирования, сингулярности) без привязки к UI. | `G4_DEVELOPMENT_COMPLETED` |
| **P8** | **DOCUMENTATION DRIFT** | Все выше | Синхронизация `README.md`, `ACTIVE_TASKS.md` с фактическим статусом кодовой базы и отсутствием generic-замен. | `G4_DEVELOPMENT_COMPLETED` |
| **P9** | **SCIENTIFIC CLAIMS** | P8 | Строгое разделение FACT / HYPOTHESIS / CLAIM в публичной документации и Lean-артефактах. | `G4_DEVELOPMENT_COMPLETED` |
| **P10** | **PRODUCT PRIORITY** | P4, P5 | Позиционирование продукта как универсального символьного/структурного движка (робототехника — тестовый кейс). | `G4_DEVELOPMENT_COMPLETED` |
| **P11** | **LEAN-CORE-CHECK-COVERAGE** | P9 | Ядерная проверка Lean 4.33.1 самодостаточных производных неизменяемых артефактов; закрытие дрейфа `TRUSTED_AXIOM`/`LEAN_VERIFIED` фактическим evidence. | `PARTIALLY_COMPLETED` |

### **[RICIS-SEED-A11] RICIS как СЕМЯ: протокол саморасширения (мета-аксиома A11) и выращенные правила A12–A14**
* **Статус:** `G4_DEVELOPMENT_COMPLETED` (верифицировано 48 unit-тестами модуля + 6 тестами страницы)
* **Результаты:**
  * Реализована каноническая запись `Ric.ExpandTo((x) => x.Resolve(UnsolvedSingularProblem))` с разделением уровней `Resolve` (разрешить и доказать) и `ExpandTo` (допуск через ворота).
  * Десять ворот допуска; любой отказ оставляет поколение R(n) неизменным (отпечаток сохраняется).
  * Фактический прогон R0 → R3 вырастил производные правила A12, A13, A14 (доказаны только из аксиом зерна).
  * Открытый класс $(0_F)^{\infty_G}$ зафиксирован как `OPEN_UNPROVEN` и не committed.
  * Детерминированные структурные отпечатки (`axiom-v1:*`, `seed-v1:*`), воспроизводимость прогона.
  * Выпущен единый документ v8.0: [`ricis-unified-complete-document-8.0-seed-expansion.json`](docs/01-architecture/ricis-unified-complete-document-8.0-seed-expansion.json) (консервативное расширение v7.9).
  * Ядро R0 приведено к v7.9: добавлены L1C3, SP5, P1; A3 помечена снятой и в активное зерно не входит.
* **Граница доверия:** локальная структурная проверка не является запуском ядра Lean; статус Lean — `REQUIRES_CORE_LEAN`.

---

## Регламент обновления реестра задач
* Перед началом любой разработки, изменением приоритета, публикацией или передачей контекста реестр задач должен быть обновлен.
* Продвижение задач по фазам разработки строго последовательно: `G1 (Бизнес-требования) → G2 (Архитектура) → G3 (QA-тесты) → G4 (Разработка)`.
