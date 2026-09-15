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
  * Дополнение 2026-09-15 (задача **P12**, F-12): пункт «Mathlib-артефакты нельзя проверить» пересмотрен — сборка Mathlib из исходников действительно не влезает на runner, но готовые oleans закреплённой ревизии влезают. Для Mathlib-артефактов добавлен job `mathlib-kernel-check` (прогон **исходника как предоставлен** + производной с байт-в-байт телом); статусы не повышаются автоматически: прогон идёт только по явному allowlist `MATHLIB_ARTIFACTS`.
* **Граница доверия:** статусы записаны снаружи исходников; байты артефактов не изменялись; kernel-прогон не является подтверждением эмпирических утверждений узлов карты.

---

### **[SCHWARZSCHILD-GEOMETRIC-BRIDGE-NODE] Узел карты «Геометрический мост Шварцшильда» + артефакт `Schwarzschild_GeometricBridge.lean` (регистрация со связями)**
* **Статус:** `G4_DEVELOPMENT_COMPLETED` (все G1→G4 пройдены последовательно; ядровой прогон Lean НЕ выполнялся — см. границу доверия)
* **Основание задачи (ORIGINAL_GOAL 2026-09-15):** «обновить или добавить узел в том числе его связи» для артефакта `Schwarzschild_GeometricBridge.lean` (канон L1, SP2, SP4, A6 proxy, P1 no-lim; provenance DOI 10.5281/zenodo.22124493).
* **Результаты:**
  * Артефакт-источник внесён байт-в-байт: `artifacts/proofs/Schwarzschild_GeometricBridge.lean` (sha256 `1df6b21df93cf2e5e822156a151929d849dd553979ef32c8992045d2a5b3de63`); после фиксации источник неизменяем (AGENTS.md §7).
  * Метаданные снаружи источника: `artifacts/proofs/Schwarzschild_GeometricBridge.json` — `verification.contentHash` = фактический sha256, `trustStatus: REQUIRES_CORE_LEAN` (импорты Mathlib вне allowlist `MATHLIB_ARTIFACTS`, ядрового прогона нет); блок `kernelCheck` не присоединён (фактов прогона нет — evidence не синтезируется).
  * Классификация в каноническом реестре `artifacts/proofs/README.md`: строка артефакта со статусом `REQUIRES_CORE_LEAN` в обеих таблицах; существующие строки не изменены, статусы других артефактов не повышались.
  * Узел карты `schwarzschild-geometric-bridge` (resolved, scientific_task, зоны `physics` + `astrophysics`, `ricisSolvable: true`) добавлен в `src/model/initialMap.ts`; кальдкуляторный узел `calculator-node-gravitational` (каталожная проекция, read-only) не модифицирован.
  * **Связи узла:** рёбра `math-singularity → schwarzschild-geometric-bridge`, `phys-unified → schwarzschild-geometric-bridge`, `schwarzschild-geometric-bridge → calculator-node-gravitational`; зеркальные `dependencyIds`/`dependentIds` согласованы (`math-singularity`, `phys-unified` пополнили `dependentIds`).
  * Proof-запись с L1 → SP4 → A6 шагами и LaTeX (Lean-spec DOI `10.5281/zenodo.21529989` + A6-контент, аудит чистый); `externalLean.trustStatus = REQUIRES_CORE_LEAN`, `sourceHash` = sha256 артефакта, `sourceLocked: true`.
  * QA-контракт `src/model/schwarzschildGeometricBridge.test.ts` (6 тестов): существование/зоны узла, три связи с проверкой висячих концов и зеркальности, аудит proof (score ≥ 80), декларированные теоремы артефакта + запрет sorry-терма, честность trust boundary (хеш, REQUIRES_CORE_LEAN, отсутствие сфабрикованного kernelCheck), provenance DOI.
  * Версия 0.4.190 → 0.4.191 (`package.json`; `sync:version` синхронизирует `src/version.ts`, lockfile, README, CITATION и прочие версионируемые документы).
* **Граница доверия (anti-tukhta):** регистрация узла и артефакта — НЕ ядровая верификация. Артефакт импортирует Mathlib и не входит в allowlist прогонов; статус артефакта и `externalLean` зафиксированы как `REQUIRES_CORE_LEAN` и не повышаются без воспроизводимого прогона workflow `lean-artifact-kernel-check.yml`. Узел НЕ утверждает регулярность метрики Шварцшильда, устранение сингулярности ОТО, физику интерьера чёрной дыры или структуру горизонта событий (физические имена — только метки пути SP4 по канону артефакта).
* **Проверка:** `npm run sync:version && npm run lint && npm test` (включая новый QA-контракт и существующие стражи: `leanKernelCoreChecks.test.ts`, `auditResolution.test.ts` — «resolved узел без proof» = 0).
* **AUDITOR: SELF (same-pipeline).**

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
| **P12** | **RICIS-GENERAL-RESOLUTION-VERIFY** | P11 | Mathlib-путь ядровой проверки (`lake env lean`, закреплённая Mathlib) + верификация внешнего артефакта «общая теорема разрешения сингулярностей»: §7-приём байт-в-байт, аудит F-09…F-12, ожидающий прогон. | `PARTIALLY_COMPLETED` |

### **[RICIS-GENERAL-RESOLUTION-VERIFY] Верификация внешнего артефакта «общая теорема разрешения комплексных сингулярностей» + Mathlib-путь ядровой проверки**
* **Статус:** `PARTIALLY_COMPLETED` (фактический прогон ядра выполнен: артефактный уровень `LEAN_VERIFIED`; уровень заявленного результата остаётся `STRUCTURALLY_VALIDATED` — F-09/F-10/F-11 за владельцем)
* **Основание:** владелец передал внешний Lean-исходник «ОБЩАЯ теорема разрешения комплексных сингулярностей (ФИНАЛЬНАЯ ВЕРСИЯ 2)» с инструкцией «интегрировать в проект». §7 запрещает нормализацию и перезапись внешнего источника, поэтому интеграция выполнена как верификация заявленного результата.
* **Результаты:**
  * Исходник сохранён байт-в-байт: `artifacts/proofs/ricis-general-resolution.lean` (sha256 `e92ebe52a85af838205a6bdb950ff4517f959cbfc4f38c1d0e7c4cb65cc35db3`); метаданные присоединены снаружи (`ricis-general-resolution.json`); статус — `REQUIRES_CORE_LEAN` (не `LEAN_VERIFIED`).
  * **F-09 (HIGH) — метрика вместо задачи:** `ricis_eval_general` объявлена ровно тем выражением, которое утверждает теорема; `ax_A4_general`, `ax_SP1_general`, `ricis_reduce` не участвуют ни в одном доказательстве. Заголовок «общая теорема разрешения сингулярностей» содержимым не подтверждается.
  * **F-10 (HIGH) — граница доверия:** две `axiom`-декларации (доверенные контракты, не доказательства) и имя `ricis_equals_classical_limit` без какого-либо предельного содержания (P1 запрещает пределы внутри `Resolve_RICIS`). Контракты зафиксированы в `declaredAxioms` и печатаются `#print axioms` в прогоне.
  * **F-11 (MEDIUM):** разрыв «редукция ↔ вычисление» — `ricis_reduce` не используется, сингулярность `N a = 0 ∧ D a = 0` не предъявлена.
  * **F-12 (MEDIUM):** основание `REQUIRES_CORE_LEAN` «no prebuilt Mathlib fits a runner» было недостоверным для 14 артефактов. Создан job `mathlib-kernel-check` (закреплённая Mathlib: `lean-toolchain` = `leanprover/lean4:v4.33.0`, Mathlib @ `6f1ef4e5dd604a435bddba4747b13970cd65d2a1`, oleans через `lake exe cache get`, прогон `lake env lean`).
  * Двойной прогон без подстановок: проверяется **сам исходник как предоставлен** и производная (`artifacts/proofs/mathlib-checks/*.mathlib-check.lean`), тело которой байт-в-байт равно исходнику (скрипт `scripts/mathlibKernelCheck.sh` подтверждает целостность через `cmp` и sha256 эпилога). Генератор — `scripts/generateLeanMathlibChecks.ts`; стражи — `tools/leanMathlibChecks.test.ts` (9 тестов).
  * ciPolicy расширен отдельным списком `ciPolicy.mathlibExpectedFailures` (пуст до фактического прогона: прогноз не является основанием). `sorryAx` в скопилированном файле рвёт прогон всегда.
  * Граница: механизм сам по себе **ничего не повышает**; остальные Mathlib-артефакты остаются `REQUIRES_CORE_LEAN` до собственного прогона.
  * Evidence: [`ricis-general-resolution-claim-audit-2026-09-15.md`](docs/05-evidence/proofs/ricis-general-resolution-claim-audit-2026-09-15.md) (§10 дополнения в [`lean-core-checks-run-2026-09-14.md`](docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md)); машиночитаемый реестр — `kernel-findings.json` (`pendingKernelRun`, F-09…F-12).
* **ФАКТ прогона (run [34950902412](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/34950902412), PR #40, job `mathlib-kernel-check`, 2026-09-15T09:10:52Z):** outcome `success`.
  * Исходник **как предоставлен** — exit 0; производная — exit 0; `sorryAx` отсутствует; целостность производной подтверждена `cmp` и совпадением sha256 внутри прогона.
  * `#print axioms`: `'ricis_general_resolution' depends on axioms: [propext, Classical.choice, Quot.sound]` (то же для `ricis_equals_classical_limit` и `specific_case_from_general`); `ax_A4_general`/`ax_SP1_general` напечатаны отдельно как объявленные контракты (зависят от самих себя).
  * **Ядро независимо подтверждает F-09:** ни одна теорема не зависит от RICIS-контрактов A4/SP1 — они в доказательстве не участвуют. Артефактный уровень → `LEAN_VERIFIED`, `claimLevel` → `STRUCTURALLY_VALIDATED` (заголовок «общая теорема разрешения сингулярностей» прогоном не подтверждается).
  * Тулчейн: `leanprover/lean4:v4.33.0` (lean-toolchain закреплённой Mathlib @ `6f1ef4e5dd604a435bddba4747b13970cd65d2a1`), oleans готовыми (`lake exe cache get`); глобальный default раннера 4.33.1 для компиляции не использовался (диагностика скрипта это различает).
  * Предупреждения прогона подтвердили класс F-06 (избыточный `simp h_k_zero` 87:10; неисполняемые хвостовые тактики 160:8/161:8) — как warning, не error.
  * **F-12 закрыт фактом:** прежнее основание `REQUIRES_CORE_LEAN` («prebuilt Mathlib не влезает на runner») опровергнуто зелёным прогоном.
  * **F-13 (новое):** статический прогноз об ошибке «unknown tactic `omega`» **опровергнут ядром** — тактика доступна транзитивно. Экспертиза Lean-кода без компилятора не является статусом; прогноз был помечен `UNVERIFIED_PREDICTION`, а `ciPolicy` оставлен пустым, поэтому прогноз не превратился в политику.
* **Сверка с `main` (2026-09-15, вечер):** `main` ушёл вперёд (прямые пуши владельца `ff954f7` → `142d744` → `4560a7f`) и **потерял** `.github/workflows/lean-artifact-kernel-check.yml` — файл исчез внутри merge-разрешения `142d744` («added lean», merge со устаревшей ветки), поэтому ни один `--diff-filter=D` его не показывает. Тот же класс инцидента, что F-07 (утрата `deriving`-клаузы при мерже PR #37). `main` влит в ветку; конфликт (modify/delete) разрешён **сохранением workflow** (обе job-ы) — без него все статусы `LEAN_VERIFIED` безосновательны по §7. Приняты также исправления seed-домена (`0d23090`).
  * **F-14 (HIGH, новая):** артефакт `artifacts/proofs/ricis-yang-mills.lean` из `main` объявляет в шапке «Статус: 100% компилируется, 0% sorry», но импортирует `Mathlib.Basic.Real.Basic`, которого нет в закреплённой ревизии Mathlib (`6f1ef4e5dd604a435bddba4747b13970cd65d2a1`): отсутствуют `Mathlib/Basic.lean`, `Mathlib/Basic/Real/Basic.lean`, `Mathlib/Real/Basic.lean`; существуют `Mathlib/Tactic/Ring.lean` и `Mathlib/Data/Real/Basic.lean`. Метаданных, `trustStatus` и записи в прогонах у артефакта нет. Внесён как `REQUIRES_CORE_LEAN` + `pendingKernelRun` (`expectedOutcome: UNKNOWN`); в allowlist `MATHLIB_ARTIFACTS` **не** внесён — запуск цели с несуществующим целевым модулем не даёт evidence о теоремах, а расширение allowlist — решение владельца. Байты не изменялись (§7); ремонт импорта — только новая версия доказательства.
* **Осталось:** (1) решение владельца о классификации **заявления** (артефактный уровень уже `LEAN_VERIFIED`; F-09/F-10/F-11 зелёным прогоном не снимаются); (2) расширение allowlist `MATHLIB_ARTIFACTS` на остальные Mathlib-артефакты — отдельное решение владельца; (3) содержательный ремонт — новая версия доказательства, связывающая `ricis_reduce`/A4/SP1 со значением (исходник не перезаписывается, §7).

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

### **[MOBILE-SWIPE-TO-CLOSE-PANELS] Мобильная поддержка: жест закрытия свайпом для всех дополнительных панелей апплетов (0.4.195)**
* **Статус:** `G4_DEVELOPMENT_COMPLETED` (верифицировано 33 новыми/расширенными тестами жеста, хука, обёртки и топологии проводки; `tsc --noEmit` чист)
* **Результаты:**
  * Чистый контракт классификации свайпа в `src/hooks/mobileGestures.ts`: `classifySwipeToClose` (доминирующая ось ≥ 64 px, флик ≤ 900 ms, поперечный дрейф ≤ 0.8) и `isSwipeDismissBlockedByScroll` (вертикальный свайп не перехватывает незавершённую прокрутку контента). Без NaN-ветвлений: откат часов и отрицательный ход времени отклоняются.
  * Хук `src/hooks/useSwipeToClose.ts`: отслеживает только touch-указатели (мышь на десктопе не затрагивается), первый указатель жеста, вложенные dismissable-поверхности владеют жестом самостоятельно (`data-swipe-dismiss`), ссылки onDismiss не устаревают.
  * Zero-layout обёртка `src/ui/components/SwipeDismissable.tsx` (`display: contents`) — добавляет жест любым панелям/модалкам без изменения их разметки и стекового контекста.
  * Проводка: экраны мобильного шелла карты (меню/детали) — свайп вправо = «назад»; все оверлей-панели Map3D (настройки — свайп вправо по направлению закрытия ящика, Telegram-бот, Войнич, QA-тесты, Auto Prover, логи агента, импорт патчей, добавление/редактирование узла, статус сообщества) — свайп вниз; песочница RICIS (терминал) и её вложенная модалка добавления узла; QA-панель кинематического апплета; вложенный Lean passport-диалог. Все жесты гейтятся `useMobileLayout()`.
  * Стражи: `src/hooks/mobileGestures.test.ts` (16), `src/hooks/useSwipeToClose.test.tsx` (8), `src/ui/components/SwipeDismissable.test.tsx` (3), `src/ui/swipeDismissWiring.topology.test.ts` (6).
* **Граница доверия:** жесты проверены jsdom-симуляцией PointerEvent и source-контрактами; поведенческая проверка на реальном сенсорном устройстве — за пределами локального прогона (`SELF-REPORTED, NOT INDEPENDENTLY VERIFIED` для физического тач-UX).

---

## Регламент обновления реестра задач
* Перед началом любой разработки, изменением приоритета, публикацией или передачей контекста реестр задач должен быть обновлен.
* Продвижение задач по фазам разработки строго последовательно: `G1 (Бизнес-требования) → G2 (Архитектура) → G3 (QA-тесты) → G4 (Разработка)`.
