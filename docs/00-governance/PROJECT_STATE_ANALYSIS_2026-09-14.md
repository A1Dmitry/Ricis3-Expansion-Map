# Анализ фактического состояния проекта — 2026-09-14

**Базовый коммит:** `7e3742c` (main, версия 0.4.188)
**Ветка анализа:** `arena/01a0a116-ricis3-expansion-map`
**Метод:** независимый прогон `npm ci → npm run lint → npm test → npm run build` в чистой среде, сверка заявлений документации с кодом и CI, инвентаризация pending-артефактов.

---

## 1. СДЕЛАНО ФАКТИЧЕСКИ (независимо верифицировано в этом прогоне)

### 1.1. Качество кода — все гейты зелёные

| Проверка | Заявлено в доках | Фактический результат |
| :--- | :--- | :--- |
| `npm run lint` (tsc --noEmit, strict) | «0 ошибок» | ✅ 0 ошибок |
| `npm test` (vitest) | 1852/1852 (ACTIVE_TASKS) | ✅ **238 файлов, 1857/1857 тестов** — зелёные |
| `npm run build` (release:check + generate:node-entries + vite + esbuild server) | успешна | ✅ успешна (vite 1.19 s, server.cjs 100.6 kB) |
| Deploy to GitHub Pages (main, 0.4.188) | живой сайт | ✅ success (run 34878187359), site live |

Заявление «100% Green» соответствует реальному прогону (нарушение анти-туфты из TEST-SUITE-RESTORE закрыто).

### 1.2. Реализованные и покрытые тестами модули

* **P0–P2**: дженерик-примитив структурной подстановки (`AstSubstitution.substitute`), проверка композиции на итерации Mandelbrot, структурные unit-тесты — реализованы.
* **P3**: инструментальное измерение O(n) роста AST-графа и Structural Sharing (DAG) — реализовано.
* **P5**: точный символьный runtime без эвристик `Math.abs < eps` — пакет `packages/ricis-core-ts` (ast / parser / engine / evaluator, 4 test-файла, включая `AstCompilerMillionRows`).
* **P6**: символьное вычисление Null-space якобиана (векторное произведение строк Jacobian AST), интегрировано в `planar3LinkKinematicService`.
* **P7**: headless-бенчмарк DLS vs RICIS, 3 сценария сингулярности (Boundary reach, Elbow fold, Shoulder pole).
* **Geometric Bridge runtime** (R²_RICIS): O(1) разрешение 0/0, ∞/∞, ∞−∞, 0−0, косое произведение; интерактивный visualizer.
* **Протокол семени A11** (`src/ricisSeed`): `Ric.ExpandTo((x) => x.Resolve(U))`, 10 ворот допуска, детерминированные отпечатки, фактический прогон R0→R3 (выращены A12, A13, A14), открытый класс `(0_F)^{∞_G}` честно зафиксирован как `OPEN_UNPROVEN` (не committed). 48+ unit-тестов + 6 тестов страницы. Идемпотентная генерация единого документа v8.0; восстановление `seed:state` / `seed:reconcile`.
* **П-8/П9/П10**: синхронизация документации, разделение FACT / HYPOTHESIS / CLAIM в README, позиционирование как универсальный символьно-структурный движок — выполнены на уровне доков.
* **Карта**: `initialMap.ts` — 54 узла. `core-agi-target` — `resolved` с **реальным DOI 10.5281/zenodo.22225762**; вся frontier детей открыта (`med-diagnostics`, `pharm-design`, `phys-unified`, `econ-value`, `ethic-alignment`, `ricis-chatbot-monetization`).
* **Ядро Lean (CI)**: workflow `lean-artifact-kernel-check.yml` (pinned Lean 4.33.1 via elan, allowlist `NO_MATHLIB_ARTIFACTS`, sha256 + полный лог + `#print axioms`). `database-a6-minimal-core-check.lean` — **`LEAN_VERIFIED`** (run 34851801990, exit 0, «does not depend on any axioms»).
* **Core-first API**: Express-прокси `/api/ricis-core/{health, expressions/:operation, proofs/v1/runs, proofs/v1/runs/:id, /documents/:format, capabilities}` + прикладные endpoints (generateProof, discoverTasks, aiAssistantNode, expandLeaves, fillNodeParams, searchDerivatives, telegram, key-pool).
* **Гигиена кода**: 0 маркеров TODO/FIXME в `src`/`packages`/`server.ts` (контролируется тестом `ricisSeed.topology.test.ts`). Секреты не в репо (`.env.example` — только плейсхолдеры; токены Telegram — via key pool с evidence-ремедией 2026-08-18).

### 1.3. Честность границ доверия (главная ценность проекта)

* Статус узла карты ≠ Lean-верификация; `resolved` только при kernel-backed evidence или явно задокументированном workflow-документе.
* 14 Mathlib-артефактов честно не повышены до `LEAN_VERIFIED` (REQUIRES_CORE_LEAN), `jacobian-counterexample-full.lean` явно помечен trusted-contract mode.
* Раздел FACT / HYPOTHESIS / CLAIM в README и AXIOMS_AND_TEST_FAILURES.md — границы проведены.

---

## 2. НЕДОДЕЛАНО / OPEN (по приоритетам)

### 2.1. `P0` — горячая незакрытая работа

| # | Задача | Состояние |
| :--- | :--- | :--- |
| 1 | **PR #37** «Ядерная проверка Lean 4.33.1 для 7 Mathlib-свободных артефактов (закрытие дрейфа TRUSTED_AXIOM)» | **Битая**: ветка `arena/01a0a04c-ricis3-expansion-map` — `CONFLICTING` с main; оба CI-джоба упали (Lean kernel run 34870620154 — exit 1; TS/test/build 34870620264 — fail). Цель PR — повысить 7 артефактов до `LEAN_VERIFIED`. Нужны: rebase, диагностика упавшей компиляции артефакта, merge. Лог run'а недоступен из песочницы (results-receiver EOF) — диагностика только с GitHub UI/логина. |
| 2 | **14 Mathlib-артефактов = `REQUIRES_CORE_LEAN`** | Сборка Mathlib с нуля не помещается на стандартный runner; prebuilt-артефакта Mathlib не существует. Без инфраструктуры (self-hosted runner с кэшем Mathlib либо декомпозиция артефактов на Mathlib-free core + Mathlib-слой) формальная верификация ядра семени (`ricis-seed-expansion-a11.lean`), monolith, bridges NS/Riemann, `RicisAgiTarget.lean` останется на уровне «черновик». Это главная «тяжёлая» незакрытая часть формального слоя. |

### 2.2. `P1` — документированные отложенные работы

* **Локализация (DEFERRED_LOCALIZATION_TASK)** — намеренно отложена: 1 775 ресурс-кандидатов (Expansion 1 132 + Core 643), обязательные культуры `en-US, fr-CA, de-DE, hi-IN, ms-MY`. Сделаны только инвентаризация и каталоги с `pending-translation` (`src/model/i18n.legacy-resources.ts`). Переводы и миграция callers — не начаты. Сканнер-манифест `russian-resource-manifest.json` лежит в репо Ricis.Core (в этом репо ссылки на него, файла нет — cross-repo зависимость).
* **21 seeded proof record, отклонённый политикой** (найдены QA-спринтом до 2026-08-20): требуется deliberate-реконструкция/классификация каждого + миграция на Core-backed endpoints со статус-маппингом `LEAN_VERIFIED / TRUSTED_AXIOM / REQUIRES_CORE_LEAN / STATIC_CHECK_PASSED / HYPOTHESIS / REJECTED` → state карты. Bulk-DOI-вставка запрещена политикой. Runtime-санитизация уже предотвращает их показ как `resolved`, но репара как таковая не сделана. Спецификация Step 1 (бизнес-анализ, без кода) по MD_REVIEW 2026-08-20 — не найдена в репо.
* **Документационный дрейф PENDING-пакета**: `ricis-map-patch-core-agi-target-PENDING.json` в корне всё ещё несёт плейсхолдер `PENDING_DOI` и DOI 22124493, хотя фактический импорт в карту выполнен с DOI **22225762** (`initialMap.ts:203`). Файл удерживается тестом `coreAgiTargetZenodoPatch.test.ts` (валидирует структуру пакета «под Zenodo») — содержимое надо синхронизировать с реальным DOI или убрать из корневого каталога.

### 2.3. `P2` — технический долг

* **Bundle size** (несколько спринтов в бэклоге): `index-*.js` 586.5 kB, `Map3D-*.js` 707.9 kB, `OrbitControls-*.js` 795.1 kB (vite warning «chunks > 500 kB»); неэффективный динамический импорт `apiClient.ts`. Цель — ленивые чанки three.js/Map3D.
* **Остатки разовых скриптов в корне репо**: `patch.cjs`, `patch2.cjs`, `patchProofs.ts`, `patchSeed.ts`, `patchSeed2.ts`, `patch_areEqual.js`, `patch_semantic.js`, `patch_simplifier.js`, `fixAll.ts`, `fixDuplicates.ts`, `test-a10.ts`, `test_p6.ts`, `test_sp5.ts` — артефакты прошлых спринтов, не входящие в package scripts; либо в архив, либо удаление.
* **Два lockfile'а**: `bun.lock` (78.9 kB) + `package-lock.json` (173.3 kB) — прямое нарушение собственного правила AGENTS.md §3 («Один package manager: npm и package-lock.json. Нельзя добавлять альтернативный lockfile без миграции»). `bun.lock` кандидат на удаление.
* **Дискрепансии версий/сложностей**: AGENTS.md требует npm `12.0.2+`, фактические `packageManager: npm@10.9.2` и CI/локальная среда npm 10.9.8 (engines `>=10` — работает, но док претендует на 12); `.nvmrc` = 22.23.2 против engines `>=22`. README говорит «1500+ unit-тестов» — фактически 1857. Мелко, но по анти-туфта-принципу числа надо вести в актуальном состоянии.

### 2.4. Открытые исследовательские вопросы (не дефекты)

* Класс `(0_F)^{∞_G}` — `OPEN_UNPROVEN`, намеренно не committed (исследовательский вектор семени).
* CLAIM-категория «17 фундаментальных сингулярностей разрешены» (Navier-Stokes, Yang-Mills mass gap и др.) — по докам это именно CLAIM, а не FACT; Lean-подтверждение pending (связано с 2.1#2). Репутационный риск при внешнем чтении выше, чем технический.
* Finance backlog — существует в Ricis.Core, вне скоупа этого репо (MD_REVIEW 2026-08-20).

---

## 3. ЧТО НУЖНО СДЕЛАТЬ (рекомендуемый порядок)

### P0 (сейчас)
1. **Решить судьбу PR #37**: rebase на main → диагностика падения Lean-джоба (какой из 7 артефактов не компилируется) → починить → зелёный CI → merge. Либо честно закрыть PR с фиксацией причины (anti-tukhta: «проверка 7 артефактов» не может числится выполненной с красным CI).
2. **Почистить корень**: удалить `bun.lock` (правило §3 AGENTS.md) и 13 разовых patch/fix/test-скриптов (архив `docs/05-evidence/` или удаление коммитом).

### P1 (ближайший спринт)
3. **Инфраструктура Mathlib** для 14 артефактов: (а) self-hosted runner с prebuilt/cached Mathlib, либо (б) декомпозиция каждого артефакта на Mathlib-free часть (паттерн PR #37 — в allowlist `NO_MATHLIB_ARTIFACTS`) + явный trusted-contract остаток. Целевой статус: макс. число `LEAN_VERIFIED`, честный `REQUIRES_CORE_LEAN` только на Mathlib-зависимое.
4. **21 seeded proof record**: спецификация Step 1 (без кода) по требованиям MD_REVIEW 2026-08-20 → статус-маппинг → поштучная классификация.
5. **Синхронизация PENDING-пакета** с реальным DOI 22225762 (или перенос в `artifacts/proofs/` как published-артефакт).

### P2 (квалификация)
6. **Локализация**: начать с Expansion-каталога (1 132 ключа), en-US первым; миграция UI-callers партиями с regression-тестами «no Russian leakage».
7. **Bundle**: code-splitting Map3D/three.js, починить динамический импорт `apiClient.ts`; цель — убрать warning >500 kB.
8. **Актиuality чисел в доках**: 1857 тестов, npm-версия, «1500+» → актуально.

### P3 (исследовательское)
9. Открытый класс `(0_F)^{∞_G}`: попытка `Resolve` через существующие аксиомы семени (при отказе ворот — фиксация причины, генерация не блокируется).
10. Внешний аудит CLAIM-категории: проверить, что UI нигде не подаёт «17 сингулярностей» как FACT (по докам — только в разделе CLAIMS).

---

## 4. ИТОГОВАЯ КАРТИНА (один абзац)

Ядро проекта **фактически готово и зелёное**: 1857/1857 тестов, строгий tsc, build, Pages-деплой, P0–P7 дорожная карта закрыты, семенной протокол A11 работает с честными воротами, один Lean-артефакт `LEAN_VERIFIED` ядром 4.33.1. **Незакрытым остаётся формальный слой**: 14 Mathlib-артефактов без ядерной верификации (нужна инфраструктура) и битый PR #37 с целью поднять 7 из них; **отложены по решению**: локализация (1 775 строк) и репара 21 отклонённого proof-record; **течёт долг**: bundle >500 kB, `bun.lock` против правила §3, 13 мусорных скриптов в корне, дрейф DOI в PENDING-пакете. По анти-туфта-методике проекта ключевой риск — не в коде (он чистый), а в том, чтобы не считать «сделанным» PR #37 с красным CI и не повышать статусы Lean-артефактов без фактического прогона.
