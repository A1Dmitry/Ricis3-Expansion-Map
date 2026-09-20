# Инцидент 2026-09-20: «приложение перестало запускаться» — удалён конфиг тестовой среды и гейты сборки; workflow проверки PR невалиден по YAML

**Дата:** 2026-09-20 · **Версия до ремонта:** 0.4.230 (`788635b`) · **После ремонта:** 0.4.230 + ремонт сборки
**Тип:** инцидент запуска (build / CI / публикация), **не** научный и **не** proof-слой. Статусы ядра, аксиом и узлов карты не затрагивались.
**Статус:** закрыт ремонтом (см. §6, §7); атрибуция нарушителя — `REJECT` (см. §5).
**Границы доверия:** `AUDITOR: SELF (same-pipeline)` — всё измерено тем же исполнителем, который выполнил ремонт; независимой внешней проверки нет. Поведенческая проверка в реальном браузере в песочнице недоступна (нет Chrome: загрузка бинарей блокируется сетью), поэтому отображение подтверждено HTTP-контрактом, графом модулей Vite, jsdom-рендером `App` и production-сборкой — не пиксельной приёмкой.

---

## 1. Симптом

Сообщение владельца: **«приложение перестало запускаться»**. Измеренно это означает ровно следующее:

* `npm run build` — **падает** (exit 1) до сборки: `release:check` ищет тест, которого в дереве нет, → `dist/` не создаётся, `npm start` (`node dist/server.cjs`) невозможен;
* GitHub Actions **Deploy to GitHub Pages** — красный: последний успешный деплой `35480998755 @ ab14628`, дальше все падения;
* GitHub Actions **PR verification** (`pr-verify.yml`) — **не выполняется вовсе**: файл воркфлоу невалиден по YAML, GitHub зарегистрировал его как startup failure и «шлёт» пустой красный прогон на каждый push, то есть все гейты PR (G1 исполнительских ключей, G0 допуска, тесты, сборка) молча выключены.

## 2. Что измерено (дословно)

### 2.1 Локально на `788635b` (HEAD)

```console
$ npm run build
> ricis3-expansion@0.4.230 build
> npm run release:check && npm run generate:node-entries && vite build && esbuild server.ts …
> ricis3-expansion@0.4.230 release:check
> npm run sync:version && vitest run tools/releaseConsistency.test.ts
 RUN  v5.0.1 /home/user/Ricis3-Expansion-Map
No test files found, exiting with code 1
filter: tools/releaseConsistency.test.ts
$ ls dist
ls: cannot access 'dist': No such file or directory
```

```console
$ npm test
 Test Files  12 failed | 295 passed (307)
      Tests  4 failed | 2326 passed (2330)
```

Раскладка падений (10 «Failed Suites» + 4 теста):

| Класс | Файлы | Причина |
| :-- | :-- | :-- |
| `ReferenceError: describe is not defined` / `beforeEach is not defined` | `server/zenodoHttpAdapter.test.ts`, `src/agentRicis/agentRicisAdvisory.domain.test.ts`, `src/agentRicis/agentRicisAdvisory.topology.test.ts`, `src/leanPassportSession/leanPassportSession.domain.test.ts`, `src/model/migrationAudit.provenance.test.ts`, `src/ricisSolutionCatalog/ricisSolutionCatalog.test.ts`, `src/ui/EditNodeModal.passportSession.test.tsx`, `src/ui/solutionMonolithCard.topology.test.ts` и др. | в дереве нет `vitest.config.ts` с `globals: true` |
| `ONBOARDING GATE: ворота нельзя выключить правкой package.json` | `tools/onboardingGate.test.ts` | из `package.json` удалены `pretest`/`prebuild`/`predev`/`prepare` |
| `ANDON_YOKOTEN_TARGET_MISSING` ×3 | `tools/tpsStandardWork.test.ts` | цель ёкотэна `tools/seedArtifactFreshness.test.ts` удалена |
| `seoProjectProfile` / `seoAssets` (version drift) | `src/services/zenodo/seoProjectProfile.test.ts`, `tools/seoAssets.test.ts` | `index.html` JSON-LD `softwareVersion=0.4.229` против `package.json=0.4.230` |

```console
$ npm run tps:gate
  [ANDON_YOKOTEN_TARGET_MISSING] x2
    - andon A-0006 yokoten target does not exist: tools/seedArtifactFreshness.test.ts
    - andon A-0009 yokoten target does not exist: tools/seedArtifactFreshness.test.ts
ИТОГ: линия остановлена — нарушения стандарта TPS.
```

### 2.2 Воспроизведение «до» на коммите 99ea1ba (worktree, только чтение)

```console
$ git worktree add --detach /tmp/wt-99 99ea1ba   # + symlink node_modules
$ npx vitest run src/ui/AutoProverModal.test.tsx src/ui/components/TopProgressBar.test.tsx
 FAIL  src/ui/AutoProverModal.test.tsx  > ReferenceError: document is not defined
 FAIL  src/ui/components/TopProgressBar.test.tsx > ReferenceError: document is not defined
 Test Files  2 failed (2)
      Tests  7 failed (7)
```

### 2.3 GitHub Actions (источник — API `actions/runs`, `actions/jobs`)

| Workflow | run | коммит | Итог | Упавший шаг |
| :-- | --: | :-- | :-- | :-- |
| Deploy to GitHub Pages | 35480998755 | `ab14628` | **success** (последний зелёный, 2026-09-20T01:17Z) | — |
| Deploy to GitHub Pages | 35510957090 | `99ea1ba` | failure | Run test suite |
| Deploy to GitHub Pages | 35516954870 | `d0169db` | failure | Run test suite |
| Deploy to GitHub Pages | 35517124343 | `788635b` | failure | Verify release alignment and TypeScript (deploy пропущен) |
| pr-verify | 343555118 (все push после 2026-09-19T18:40Z) | — | startup failure, 0 s | прогон не начинался |

### 2.4 YAML-дефект workflow проверки PR

```console
$ node -e "require('js-yaml').load(fs.readFileSync('.github/workflows/pr-verify.yml','utf8'))"
pr-verify.yml INVALID: bad indentation of a mapping entry (40:34)
   40 |       - name: Onboarding gate (G0: executor has read and accepted the documentation)
```

* ревизия `49a8ebe^` (до PR #82) разбирается без ошибок: `pr-verify.yml OK name= "Pull Request Verification"`;
* начиная с `49a8ebe` (PR #82) файл содержит **незакавыченный plain-скаляр с `": "`** внутри `name:` — в YAML это конец ключа, поэтому не парсится весь файл;
* `d0169db` (PR #88) добавил второй такой шаг (`Onboarding gate (G0: …)`) и дефект сохранил;
* следствие: последний реальный прогон проверки PR — 2026-09-19T13:46Z; далее вместо проверки GitHub отдаёт startup failure на каждый push, а `gh pr checks` на PR-ветках отвечает «no checks reported». Именно поэтому следующие коммиты попали в `main` без единого гейта.

## 3. Хронология поломки

| Коммит | Время (UTC) | Исполнительский ключ в коммите | Что сделал с запуском приложения |
| :-- | :-- | :-- | :-- |
| `ab14628` | 2026-09-20 01:17 | нет (squash-слияние PR #86) | последнее зелёное состояние: тесты, сборка, деплой |
| `99ea1ba` | 2026-09-20 12:33 | **нет** | **удалил `vitest.config.ts`** (jsdom + `globals: true`) → 10 suite-падений → первый красный деплой |
| `d0169db` | 2026-09-20 14:35 | `c55cc355edfd2d76…` (в теле, squash PR #88) | добавил ворота G0 (и их тесты), **сохранил** невалидный YAML в `pr-verify.yml` |
| `788635b` | 2026-09-20 14:38 | **нет** | **удалил `tools/releaseConsistency.test.ts`** (его требует `release:check`), `tools/seedArtifactFreshness.test.ts` (требуют андон A-0006/A-0009) и проводку G0 из `package.json`; снял бит исполнения с `hooks/*` → `npm run build` красный |
| `49a8ebe` | 2026-09-19 18:40 | `a73af5ede6cbdf70…` (в теле, squash PR #82) | **ввёл невалидный YAML** в `pr-verify.yml` (шаг с незакавыченным `": "`) → с этого момента PR-гейты не запускаются |

## 4. Первопричины

* **D1. Потеря тестовой среды.** Удаление `vitest.config.ts` (`99ea1ba`) убрало `environment: 'jsdom'` и `globals: true`. `788635b` вернул jsdom в `vite.config.ts`, но **без `globals: true`** — 10 suite-файлов, писанных на глобальные `describe/it/beforeEach`, перестали загружаться.
* **D2. Разрыв ссылок «скрипт → файл».** `package.json` ссылался на удалённые `tools/releaseConsistency.test.ts` (через `release:check`, а значит через `npm run build`, `deploy-pages.yml`, `pr-verify.yml`) и на `tools/seedArtifactFreshness.test.ts` (через ёкотэн-цели андонов TPS A-0006/A-0009). Удалять файл, не сняв ссылку, — гарантированный красный гейт.
* **D3. Выключенные ворота.** Невалидный YAML в `pr-verify.yml` (PR #82, закреплён PR #88) сделал так, что проверка PR **не выполнялась**: G1 (ключи в заголовках), G0 (допуск), `tps:gate`, `npm test`, сборка — ни один гейт не запускался. Коммиты без ключа (`99ea1ba`, `788635b`) проходили в `main` беспрепятственно.

## 4a. Дефект ворот G1, найденный при ремонте: синтетический merge-коммит GitHub

Ворота G1 (§3) проверяют **каждый** коммит диапазона `<base>..HEAD`. В контексте события
`pull_request` GitHub подставляет в `HEAD` собственный синтетический merge-коммит
(«Merge `<sha>` into `<sha>`»), который по построению не может нести заголовок §2. Значит ворота
краснеют на **любом** PR независимо от содержимого ветки — не потому, что исполнитель нарушил
правило, а потому что проверяемый объект не является коммитом исполнителя.

Измерено на PR #89 (run 35524888840, ветка уже с валидными ключами во всех трёх коммитах):
шаги 1–9 зелёные (установка, аудит, `release:check` + `tsc`, `tps:gate`, `onboarding:gate`), шаг 10
«Executor traceability gate» красный. Локальное воспроизведение контекста CI (merge ветки в
`788635b` + прогон ворот):

```console
$ git merge --no-ff arena/01a0bf4a-… -m "Merge 85288b2c… into 788635bfa4c8…"
$ npx tsx scripts/executorGate.ts --check-headers --base origin/main
EXECUTOR GATE: нарушений 1 (база origin/main)
  - [EXECUTOR_HEADER_MISSING] 0d20e22e8cf7 — в заголовке нет префикса «исполнитель : <ключ>»;
    получено: «Merge 85288b2c34c9ca4bd25d1a98df37fa293162aea7 into 788635bfa4c8cfb696c2325f19089852fc853d2f …»
```

Локальный прогон тех же ворот по самой ветке (`--base origin/main` без merge-коммита) — **чисто**:

```console
$ npx tsx scripts/executorGate.ts --check-headers --base origin/main
EXECUTOR GATE: чисто (проверено коммитов: 3, база origin/main)
```

Исправление сделано в конфигурации CI, **а не** в семантике ворот: `actions/checkout` для
`pull_request` теперь берёт `github.event.pull_request.head.sha` — то есть ворота видят ровно
коммиты ветки. Коммиты слияния, созданные самим исполнителем внутри ветки, остаются в диапазоне
`<base>..HEAD` и по-прежнему проверяются; ослабления правила §2 нет. Страж класса дефекта добавлен
в `tools/releaseConsistency.test.ts` (проверяет и наличие шага ворот, и привязку checkout к
head-sha PR).

## 5. Атрибуция: по какому ключу вкоммитан ломающий код

**Ответ: ни по какому. Оба ломающих коммита неатрибутируемы — в них нет обязательного заголовка «исполнитель : <ключ>» (§2 EXECUTION_TRACEABILITY_GATES.md).**

Вердикт G2 (форензика по истории GitHub, `git bisect` по `npm test`, диапазон `ab14628..HEAD`):

```console
$ npx tsx scripts/executorGate.ts --forensics ab14628 -- npm test
EXECUTOR GATE FORENSICS: вердикт REJECT
  сломавший функционал коммит: 99ea1ba06163e7cf78089f1130fd3568e3479e11 «chore: bump version to 0.4.228 and optimize AI pool»
  атрибуция: исполнитель не идентифицирован (заголовок без валидного ключа)
  немедленный отказ: неатрибутируемый коммит-нарушитель отклоняется полностью
  повторный приём вкладов — только после принудительного изучения всей документации и повторной проверки ворот
```

Проверка заголовков G1 по тому же диапазону (exit 1) — все три коммита без ключа:

```console
$ npx tsx scripts/executorGate.ts --check-headers --base ab14628
EXECUTOR GATE: нарушений 3 (база ab14628)
  - [EXECUTOR_HEADER_MISSING] 99ea1ba06163 — … «chore: bump version to 0.4.228 and optimize AI pool»
  - [EXECUTOR_HEADER_MISSING] d0169dba989a — … «G0: ворота допуска исполнителя — … (#88)»
  - [EXECUTOR_HEADER_MISSING] 788635bfa4c8 — … «feat: add Preview Integrity Law and test environment»
```

Дополнительный факт того же класса, внесённый ранее: `git cat-file commit 99ea1ba` и `git cat-file commit 788635b` не содержат строки «исполнитель» ни в заголовке, ни в теле.

Ключи, которые в окне поломки **есть** (в теле squash-коммитов, потому что заголовок переписывается при слиянии PR):

| Ключ | Где | Роль в инциденте |
| :-- | :-- | :-- |
| `a73af5ede6cbdf70f161c7cf493597f967745c80fc005a1de497121218f88c21` | `49a8ebe` (PR #82) | ввёл невалидный YAML в `pr-verify.yml` — гейты PR перестали запускаться (D3). Сборку приложения сам по себе не ломал: деплои `b86f380`, `269da9b`, `771c5c8`, `ab14628` после него зелёные |
| `c55cc355edfd2d767e186adea7fa5e511642abc29dd384774be261718ec1eeb6` | `d0169db` (PR #88) | сохранил невалидный YAML (добавил второй такой шаг) и добавил ворота G0; **не** удалял ни `vitest.config.ts`, ни `releaseConsistency.test.ts` |

Структурное замечание (остаточный риск): из-за squash-слияний заголовок §2 в истории `main` не сохраняется — ключ остаётся только в теле. Поэтому G1 на `main`-истории красный по построению; проверяемый в CI диапазон — `<base origin/main>..HEAD` ветки PR, где заголовки наши.

### 5.1 Смена исполнительского ключа (2026-09-20, по решению владельца)

Первый прогон отремонтированного PR #89 (run 35519230609) показал: шаги 1–9 зелёные, шаг 10
«Executor traceability gate» красный — по аттестации, а не по заголовкам:

```console
EXECUTOR GATE: нарушений 2 (база origin/main)
  - [ONBOARDING_ATTESTATION_FOREIGN] 33bd67ba22fd — аттестация
    docs/00-governance/onboarding/c55cc355….json записана коммитом d0169dba989a с другим/отсутствующим
    ключом: чужая аттестация не является прочтением этого исполнителя
  - [ONBOARDING_ATTESTATION_FOREIGN] 93bfa420c645 — … то же …
```

Причина — ровно тот же squash-дефект: §0.6 требует, чтобы **каждый** коммит, писавший
`onboarding/<ключ>.json`, нёс в заголовке тот же ключ; файл аттестации `c55cc355…` был записан
коммитом `d0169db`, чей заголовок при squash-слиянии PR #88 переписан GitHub'ом. Пока это так,
ни один PR этого исполнителя не может пройти G1 — не из-за содержимого работы, а из-за
неизменяемой истории.

Решение владельца: перерегистрировать ключ по §1.4 (новая регистрация перезаписывает
`EXECUTOR_KEY.md`; прежняя остаётся валидной для коммитов своего периода).

| | было | стало |
| :-- | :-- | :-- |
| Ключ | `c55cc355edfd2d767e186adea7fa5e511642abc29dd384774be261718ec1eeb6` | `cdd5cf6c11571be82999befbd9208bfb2268331021601d5213e275fc78343c92` |
| Регистрация | `EXECUTOR_KEY.md` (2026-09-20T13:11:55Z) | `EXECUTOR_KEY.md` (2026-09-20T15:24:00Z), прежняя — в истории git |
| Аттестация | `onboarding/c55cc355….json` (устарела: AGENTS.md изменён в `788635b`) | `onboarding/cdd5cf6c….json` — 9 документов, `acceptance` = `ACCEPTANCE_STATEMENT`, ответы R1–R3/Q1–Q7, персональные цитаты (RCVAP строка 33, `WORK_PATTERNS.md` строка 19, `RICIS_IMMUTABILITY_MANIFEST.md` строка 59) |

Ремонтные коммиты **переоформлены** (rebase `788635b`, только заголовки; содержимое деревьев
не менялось — сверено по хешам файлов до и после) и запушены под новым ключом; коммит регистрации
и аттестации стоит первым в ряду, чтобы G0 был действителен на каждый коммит (§3 G1). Локальный
G1 после переоформления — `чисто (проверено коммитов: 3, база origin/main)`.

Побочный факт: после смены ключа подпись коммита перестала быть «переаттестацией предыдущего
ключа» — обновление файла `c55cc355….json` сохранено как есть (это правда о той сессии), но
действующим допуском является аттестация нового ключа.

## 6. Ремонт

| # | Что | Файлы |
| :-- | :-- | :-- |
| 1 | Возвращён конфиг тестовой среды: `globals: true` рядом с `environment: 'jsdom'` | `vite.config.ts` |
| 2 | Возвращены удалённые стражи и утилиты, на которые ссылаются гейты и реестры | `tools/releaseConsistency.test.ts`, `tools/seedArtifactFreshness.test.ts`, `tools/proofTrustBoundary.test.ts`, `tools/seoAssets.test.ts`, `tools/sourceHeredocLeakage.test.ts`, `tools/recursiveProductionAudit.ts`, `tools/ricis-calculator-routing-fix.patch` |
| 3 | Возвращена проводка допуска G0 (§0): хук `prepare` → `core.hooksPath`, `pretest`/`prebuild`/`predev` → `onboarding:gate` | `package.json` |
| 4 | Возвращён бит исполнения локальным хукам G3 | `hooks/pre-commit`, `hooks/commit-msg` |
| 5 | Исправлен YAML workflow проверки PR: имена шагов с `": "` закавычены | `.github/workflows/pr-verify.yml` |
| 6 | Добавлен страж класса дефекта (D3): незакавыченный `": "` в `- name:` любого workflow = красный тест | `tools/releaseConsistency.test.ts` |
| 7 | Синхронизирована версия release-документов (drift от бампа 0.4.230) | `index.html`, `package-lock.json`, `docs/05-evidence/...` |
| 8 | Переаттестация после изменения обязательного документа (§0.3: AGENTS.md изменился в `788635b` — добавлен критерий PREVIEW INTEGRITY LAW) | `docs/00-governance/onboarding/c55cc355….json` |
| 9 | Исправлена неработоспособность самих ворот G1 в контексте `pull_request` (синтетический merge-коммит GitHub не может нести §2): checkout берёт head-sha PR | `.github/workflows/pr-verify.yml`, `tools/releaseConsistency.test.ts` |
| 10 | Регистрация нового исполнительского ключа `cdd5cf6c…` и его персональная аттестация G0; ремонтные коммиты переоформлены на новый ключ (§5.1) | `docs/00-governance/EXECUTOR_KEY.md`, `docs/00-governance/onboarding/cdd5cf6c….json` |
| 11 | Эта запись + запись в реестре активных задач | `docs/05-evidence/architecture/incident-2026-09-20-app-launch-broken.md`, `ACTIVE_TASKS.md` |

## 7. Проверка после ремонта

* `npm run lint` (`tsc --noEmit`) — 0 ошибок;
* `npm run release:check` — зелёный (16 тестов, включая страж YAML);
* `npm run build` — зелёный, `dist/` с клиентским бандлом и `dist/server.cjs`;
* `npm run tps:gate`, `npm run tps:board:check`, `npm run tps:digest:check` — чисто;
* `npx tsx scripts/onboardingGate.ts --check` — `ONBOARDING GATE: допущен (ключ c55cc355edfd…, документов аттестовано: 9)`;
* `npm test` (через `predev`-проводку G0) — **312 файлов, 2470 тестов, 0 падений** (до ремонта: 12 файлов / 4 теста красные; `release:check` вообще не мог найти тест);
* запуск приложения, dev: `npm run dev` → `Server running on http://localhost:3000 (bound 0.0.0.0:3000)`; `curl` — `/` 200 (5758 B), `/src/main.tsx` 200 (4342 B), `/src/App.tsx` 200 (41371 B), `/src/model/audit.ts` 200 (31543 B), `/src/ui/KinematicEnginePage.tsx` 200 (292664 B); полный обход графа модулей от `main.tsx`/`App.tsx` — 62 модуля, 0 ошибок трансформации;
* запуск приложения, production: `PORT=3100 node dist/server.cjs` → 200 на `/`, `/assets/`, `/calculator-sandbox/`, `<title>RICIS Expansion Map — 3D-карта сингулярностей RICIS-III</title>`, клиентские чанки в `dist/assets/` (предупреждение `WebSocket server error: Port 24678 is already in use` — следствие одновременного запуска dev-сервера, на HTTP не влияет);
* **красно-зелёное доказательство стража D3**: регулярное выражение стража помечает обе исторические строки —
  `old1 flagged: true | old2 flagged: true` (строки `- name: Onboarding gate (G0: …)` и `- name: Executor traceability gate (commit header «исполнитель : ключ», …)`), на исправленном файле тест зелёный;
* CI PR #89 (ветка `arena/01a0bf4a-…`): run 35519230609 — шаги 1–9 зелёные (включая «Onboarding gate»), шаг 10 красный по аттестации (§5.1); после смены ключа run 35524888840 — шаги 1–9 зелёные, шаг 10 красный из-за синтетического merge-коммита (§4a) → устранено привязкой checkout к head-sha PR; локальные ворота по ветке — `чисто (проверено коммитов: 3, база origin/main)`.

## 8. Остаточные риски и незакрытые пункты

* **Андон TPS и карточка по инциденту не открыты в `docs/00-governance/tps/board.json`** — реестр доски машинно-проверяемый (классы, WIP-лимиты, ёкотэн-цели), и его правка — отдельный такт; решение о последствиях для нарушителя, согласно §4 EXECUTION_TRACEABILITY_GATES, остаётся за мейнтейнером.
* Squash-слияние стирает заголовок §2 в `main` (см. §5) — правило исполнительского ключа в `main`-истории не наблюдается; действующая проверка живёт только на диапазоне PR.
* Визуальная приёмка preview владельцем — за пределами песочницы (браузера нет); настоящий документ не заявляет пиксельную проверку.
