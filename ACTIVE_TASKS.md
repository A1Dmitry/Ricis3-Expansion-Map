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
* **Статус:** `PARTIALLY_COMPLETED` (8 целей верифицированы ядром в двух прогонах; 4 производные остаются красными с установленными первопричинами; F-01 требует решения владельца)
* **Основание задачи (аудит Md + Lean):** метаданные `artifacts/proofs/*.json` (5 файлов) заявляли `TRUSTED_AXIOM`, а `src/model/initialMap.ts` (6 записей, включая LaTeX «Axiom Status: LEAN_VERIFIED») — `LEAN_VERIFIED`, тогда как AGENTS.md §7 / E-03 / E-04 требуют для этих статусов фактический ядерный прогон. Единственный прогон (run 34851801990) покрывал один файл, потому что остальные 14 начинаются с `import Mathlib`.
* **Результаты прогона 2 (run [34870620154](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/34870620154), 12 целей — пакет 2 выполнен):**
  * **Подстановка `ℕ → Nat` подтверждена ядром:** `ricis-backend-exact-reduction` — было 22 ошибки и 8 × `sorryAx`, стало **exit 0, 0 ошибок, 22 теоремы (6 без аксиом, 16 × `propext`), `sorryAx` отсутствует** → `LEAN_VERIFIED`. `ricis-v79-monolith` — было 15 ошибок и 3 × `sorryAx`, стало **0 × `sorryAx`, 31 теорема напечатана**, но exit 1: `392:2 No goals to be solved` (8 избыточных буллетов `· rfl` после `repeat constructor`) → `NOT_VERIFIED_CORE_ONLY` (F-06), статус не повышается.
  * **Две записи базы проверены без подстановок:** `database-a6-0_5_inf_3` и `database-registry-120-jacobian` — exit 0, по 19 теорем (16 «does not depend on any axioms», 3 × `propext`) → `LEAN_VERIFIED`.
  * **`ℚ → Rat` устранило нотацию, но вскрыло нехватку экземпляра:** `ricis-kernel-ast-sp5` — `26:2 error(lean.synthInstanceFailed): failed to synthesize instance of type class Decidable (a = b)`, обе теоремы с `sorryAx` (F-07). Ремонт: `deriving DecidableEq` у `RExpr`.
  * **Замена Mathlib-леммы в A11 оказалась неверной (дефект собственного ремонта):** `ricis-seed-expansion-a11` — `104:4 Type mismatch: List.mem_append.mpr (Or.inl hr) has type r ∈ s.rules ++ ?m.77 but is expected to have type r ∈ a✝¹.rules`, `105:4 Tactic `split` failed`, `156:63`/`165:50`/`176:105 unsolved goals` → 3 из 6 теорем с `sorryAx` (F-08).
  * **F-01 усилен вторым прогоном:** после переименования `partial → partialDeriv` файл якобиана парсится, но `62:2 Tactic `rfl` failed: resolveRICIS (F.zeroF.det RExpr.zero RExpr.zero G.infF) is not definitionally equal to (F.mul G).sub RExpr.zero.zeroF` → `Jacobian_singularity_resolved` несёт `sorryAx`. Тождество не определительно, `rfl` — ядровая тактика: `TRUSTED_AXIOM` необоснован в любой конфигурации.
  * Итог двух прогонов: **8 целей exit 0 без `sorryAx`, 4 цели exit 1**. Evidence: [`lean-core-checks-run-2026-09-14.md`](docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md) §6, сырой лог [`…34870620154.pr-comment.txt`](docs/05-evidence/proofs/lean-kernel-run-34870620154.pr-comment.txt), реестр v2 (12 артефактов, 8 находок).
* **Результаты прогона 1 (run [34858902595](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/34858902595), Lean 4.33.1, `lean +4.33.1 <artifact>`):**

  * Генератор [`scripts/generateLeanCoreChecks.ts`](scripts/generateLeanCoreChecks.ts) создаёт **новые версии доказательства** (`artifacts/proofs/core-checks/*.core-check.lean`) из неизменённых исходников: `производная = (исходник − неиспользуемая строка import Mathlib) [+ заявленные точечные подстановки] + добавленный эпилог #print axioms`. Исходники не переписаны (§7), sha256 зафиксированы в `core-checks/manifest.json`.
  * **`LEAN_VERIFIED`** (exit 0, `sorryAx` отсутствует): `ricis-universal-orchestration-template.lean` (27 теорем: 3 без аксиом, 24 × `propext`), `ricis-chatbot-monetization.lean` (2), `ricis-navier-stokes-ast-bridge.standalone.lean` (2), `ricis-riemann-zeta-ast-bridge.standalone.lean` (2); подтверждён `database-a6-minimal-core-check.lean`.
  * **Первопричины отказов установлены дословными ошибками ядра:** `ℕ` — нотация Mathlib, без Mathlib elaborируется как свободная переменная (`ℕ : Sort u_1`, `OfNat ℕ 1` не синтезируется) → `ricis-v79-monolith` (15 ошибок, `RICIS_v79_unified` получил `sorryAx`) и `ricis-backend-exact-reduction` (22 ошибки, 8 × `sorryAx`); контроль — template-артефакт с `Nat` компилируется с exit 0. Ремонт (`ℕ → Nat`) зафиксирован в производных и ожидает прогона.
  * **`SOURCE_REJECTED_BY_KERNEL`:** `ricis-jacobian-conjecture.standalone.lean` не парсится — конструктор `| partial (F x : RExpr)` использует зарезервированное слово Lean (`24:12 expected token`), `Jacobian_singularity_resolved` — `Unknown constant`. Файл никогда не проверялся ни одним ядром Lean.
  * Стражи: `tools/leanKernelCoreChecks.test.ts` — 15 тестов (побайтовая перегенерация, префиксное равенство исходнику, неизменность sha256, подстановка только с установленной первопричиной, запрет повышения статуса по красному прогону, согласованность реестра/метаданных/документации).
  * Workflow: цели = явный allowlist + каталог производных; исправлен фильтр вывода `#print axioms` (прежний шаблон не совпадал с формулировкой ядра — секция evidence была пустой); добавлен брак по `sorryAx`; публикация evidence переведена на `if: always()`.
  * Evidence: [`docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md`](docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md), сырой лог [`…34858902595.pr-comment.txt`](docs/05-evidence/proofs/lean-kernel-run-34858902595.pr-comment.txt), реестр [`artifacts/proofs/core-checks/kernel-findings.json`](artifacts/proofs/core-checks/kernel-findings.json).
* **Найденная ТУФТА (зафиксирована, не замалчивается):**
  * **F-01 (CRITICAL):** `TRUSTED_AXIOM` для `ricis-jacobian-conjecture` при некомпилируемом исходнике; `src/model/jacobianProof.test.ts` QA-1 проверяет лишь **текстовое** присутствие строки `theorem Jacobian_singularity_resolved` — подмена основания метрикой. Требуется решение владельца: принять новую версию доказательства (переименование неиспользуемого конструктора `partial → partialDeriv`) либо понизить статус с обновлением QA-контрактов. Молчаливый демонтаж авторизованного результата не выполнялся (C-03).
  * **F-02 (HIGH):** статусы `LEAN_VERIFIED`/`TRUSTED_AXIOM` в `initialMap` и JSON были выставлены без прогона ядра — частично закрыто фактическим прогоном для 4 артефактов.
  * **F-03 (MEDIUM):** зависимость от `propext` не фиксировалась; введены классы `LEAN_VERIFIED_AXIOM_FREE` и `LEAN_VERIFIED_WITH_STANDARD_AXIOMS`.
  * **F-04 (MEDIUM):** дефект workflow — пустая секция `#print axioms` и отсутствие evidence при падении; исправлено.
  * **F-05 (HIGH):** семантическая граница — прогон доказывает структурные AST-теоремы (`ricisReduce (divSelf e) = one`), а не гипотезу Римана / Навье–Стокса / якобиан, как формулируют узлы карты по тем же хешам.
  * **F-06 (MEDIUM):** v79 — 31 теорема доказана без `sorryAx`, но exit 1 из-за избыточных тактических буллетов; `LEAN_VERIFIED` не устанавливается до устранения.
  * **F-07 (HIGH):** SP5 — в ядре не синтезируется `Decidable (a = b)` для `RExpr` (Mathlib давал его через deriving-механизмы); обе теоремы с `sorryAx`. Ремонт принят: `deriving DecidableEq, Repr` (commit `8665a06` владельца в `main`) встроен в генератор как заявленная подстановка, производная перегенерирована — ожидается факт ядра.
  * **F-08 (MEDIUM):** A11 — заявленная мной замена Mathlib-леммы неприменима в точке 104; собственный отказ зафиксирован, а не замолчан (ANTI-TUKHTA LAW).
* **Осталось (не закрыто):** (1) v79 — новая версия производной без 8 избыточных буллетов `· rfl` → ожидается `LEAN_VERIFIED`; (2) SP5 — ремонт `deriving DecidableEq, Repr` принят (commit `8665a06` владельца в `main` встроен в генератор как заявленная подстановка), остался повторный прогон; (3) A11 — корректный ядровый шаг вместо неприменимой подстановки + усиление доказательств в точках 156/165/176; (4) решение владельца по F-01 (новое доказательство тождества 62:2 либо понижение `TRUSTED_AXIOM`) и по F-05 (формулировки узлов карты); (5) `RicisAgiTarget.lean` и `jacobian-counterexample-full.lean` остаются `REQUIRES_CORE_LEAN` (реально требуют Mathlib: `ℝ`/`ℚ` + `ring`/`norm_num`). План ремонта зафиксирован в `pendingKernelRun` реестра.
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
