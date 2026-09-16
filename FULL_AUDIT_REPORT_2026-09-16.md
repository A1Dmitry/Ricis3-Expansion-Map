# ПОЛНЫЙ АУДИТ ПРОЕКТА — 2026-09-16 (v0.4.198)

> **AUDITOR: SELF (same-pipeline)** — аудит выполнен тем же агентом/пайплайном, что и аудируемый код.
> Все статусы ниже — `SELF-REPORTED, NOT INDEPENDENTLY VERIFIED` до внешней проверки (AGENTS.md, No Self-Certification).
> **Branch:** `arena/01a0aa5d-ricis3-expansion-map` · **Base:** `c014d31` (main) · **Дата:** 2026-09-16

---

## 1. ORIGINAL GOAL

Полный аудит репозитория: бизнес-логика + фронтенд, проверка работоспособности всех кнопок, фиксация найденных багов, составление плана решения в порядке зависимостей (сначала блокирующие остальные задачи).

## 2. МЕТОДОЛОГИЯ (что и как проверялось)

| Слой | Метод | Результат |
| :-- | :-- | :-- |
| Качество кода | `npm ci` → `tsc --noEmit` (strict) | ✅ 0 ошибок |
| Тесты | `npx vitest run` (полный прогон) | ✅ **251 файл / 2020 тестов — зелёные** (~194 с) |
| Сборка | `npm run build` (release:check + generate:node-entries + vite + esbuild server) | ✅ успешна (server.cjs 100.6 kB) |
| API (runtime) | Smoke-тесты всех маршрутов Express против живого `npm run dev` | ⚠️ найден краш-баг BUG-01, остальные 200/202/400/503 — соответствуют контрактам |
| Фронтенд (runtime) | jsdom-рантайм клик-аудит: рендер 10 поверхностей (Map3D, Roadmap, Seed, Comparison, Kinematic, Voynich, Terminal, QA, Settings, CoreRecovery) + клик по **всем 172 уникальным кнопкам** + целевые проверки (input-значения, class-toggle, DOM-изменения, store-состояния) | ⚠️ 0 исключений; найдены мёртвые команды BUG-02/03/04 |
| Статический скан кнопок | Все 272 `<button>` в 54 tsx-файлах: наличие onClick/onMouseDown/type=submit | ✅ у всех есть обработчик (2 «без» — ложные: onMouseDown-история поиска, тест-файл) |
| Событийная шина | Кросс-чек `dispatchEvent('ricis:*')` ↔ `addEventListener` по всему коду | ❌ 13 событий без слушателей (BUG-02) |
| Бизнес-логика | Исполняемые пробы `packages/ricis-core-ts` (AlgebraicSimplifier, foldConstants), чтение localRicisReducer/localRicisAnalyzer/calculatorEngine | ❌ 3 математических ошибки + 1 DoS-риск (BUG-05) |
| Гигиена репо | bun.lock, patch-скрипты, TODO/FIXME, секреты | ✅ P2-долг из анализа 2026-09-14 закрыт (bun.lock и 13 скриптов удалены); секретов в репо нет |

Воспроизводимость: все баги ниже имеют конкретные шаги воспроизведения; jsdom-харнессы аудита удалены после фиксации результатов (временные файлы `src/ui/zz*.audit.test.tsx`, scratch-скрипты).

## 3. РЕЕСТР БАГОВ

Приоритет = P0 (краш/блокер) → P1 (функция недоступна/неверна) → P2 (среднее) → P3 (полировка).
Колонка «Блокирует» показывает, какие задачи/проверки нельзя осмысленно делать до исправления.

### BUG-01 · P0 · СЕРВЕР ПАДАЕТ ОТ ОДНОГО ЗАПРОСА (crash / remote DoS)

- **Файл:** `server/ricisCoreSupervisor.ts` → `launchCoreProcess()`
- **Суть:** `spawn('dotnet', …)` вешает обработчик `exit`, но **не `error`**. Если `dotnet` не установлен/недоступен (среда без .NET), Node кидает unhandled `'error'` event → **весь процесс сервера умирает** (exit 1). `assertCoreRuntime()` проверяет наличие DLL, но не наличие самого `dotnet`.
- **Воспроизведено (живой прогон):** `npm run dev` → `curl http://localhost:3000/api/ricis-core/health` →
  `Error: spawn dotnet ENOENT … throw er; // Unhandled 'error' event` → сервер мёртв, все остальные эндпоинты (и превью) недоступны.
- **Затронуто:** `npm run dev` И `npm start` (`dist/server.cjs` — тот же код). Любой посетитель может уронить сервер одним GET-запросом. На GitHub Pages (статика) не проявляется.
- **Блокирует:** любую проверку core-first API (`/api/ricis-core/*`), всю runtime-верификацию API, стабильность демо-стендов.
- **Fix (минимальный):** `coreProcess.once('error', (e) => { console.warn(...); coreProcess = null; })` + предпроверка `which dotnet`/`spawnSync('dotnet','--version')` с честным 503; опционально `process.on('unhandledRejection')` в `server.ts` как второй слой.

### BUG-02 · P1 · 13 «мертвых» команд тулбара/меню (события без слушателей)

- **Файлы:** `src/services/commandRegistry.ts`, `src/App.tsx` (commandContext), потребители — отсутствуют.
- **Суть:** команды диспатчат `window.dispatchEvent(new CustomEvent('ricis:*'))`, но **ни один компонент во всём репо не вызывает `addEventListener('ricis:*')`** (проверено кросс-сканом). Колбэки `CommandContext` (`onResetCamera`, `onSearchNodes`, `onToggleSimulation`, …) реализованы в App.tsx повторным диспатчем тех же мёртвых событий. Итог — кнопки **тулбара и пункты меню не делают ничего**:
  - `view.resetCamera` «Сброс Камеры» (в Map3D есть своя рабочая кнопка — дубль мёртв)
  - `view.searchNodes` «Поиск Узлов»
  - `view.toggle3D` «2D/3D» — меняет только локальный `is3DMode` App, который **никем не читается** при рендере
  - `kinematic.toggleSimulation/resetJoints/stepForward` «Запуск/Пауза», «Сброс Шарниров», «Шаг Вперед»
  - `seed.runVerification` «Верификация Seed», `seed.downloadLedger` «Крипто-Квитанция»
  - `terminal.clear` «Очистить Буфер», `terminal.leanVerify` «Lean 4 Шлюз»
  - `qa.runFloodFill` «Запуск Краулера», `qa.exportReport` «Экспорт Отчета»
  - `global.diagnostics` «Диагностика»
  - Работает только `global.share` «Поделиться» (реально копирует URL в буфер).
- **Дополнительно:** `isSimulationRunning`/`isAutoProverRunning` никогда не передаются в контекст → `isActive`-индикаторы Play/Pause и краулера никогда не загораются.
- **Блокирует:** смысл апгрейда UI-команд (шорткаты Space/F5/Ctrl+Enter и т.д. тоже диспатчат эти события), доверие к «рабочему столу»-метафоре (Office-style меню выглядит живым, но половина пунктов — заглушки).
- **Fix:** в целевых страницах (`Map3D`, `KinematicEnginePage`, `RicisProofConsoleModal`, `AutoProverModal`, `RicisSeedPage`) подписаться на соответствующие события ИЛИ заменить событийную шину на прямой вызов store-методов через commandContext; для toggle3D — реализовать фактическое переключение презентации карты (или убрать кнопку до реализации).

### BUG-03 · P1 · Settings-апплет из меню — заглушка

- **Файл:** `src/App.tsx` (case `'settings'`).
- **Суть:** `SettingsModal` открывается с `roles={[]}`, `onSelectRole={() => {}}`, `onCreateRole={() => {}}` и без `uiElements/hiddenElementIds/physicsParams`. Проверено рантаймом: форма «Create new» открывается, но **созданная роль молча исчезает**; список ролей пуст; секции настройки панелей/физики скрыты. Полноценный экземпляр модалки живёт в `Map3D.tsx:2360` с реальными пропсами — из App они не проброшены.
- **Fix:** поднять `useAdaptiveUI`/physics-стор в App (или прокинуть колбэки через mapStore) и передать их в settings-апплет, как это делает Map3D.

### BUG-04 · P1 · `updateBrowserUrl` игнорирует `seed` — кнопка «Ссылка на это состояние (?view=seed)» мертва

- **Файл:** `src/services/UrlShareService.ts` (в `updateBrowserUrl` нет ветки `params.seed`; в `generateShareUrl` — есть).
- **Суть:** `RicisSeedPage.tsx:314` вызывает `updateBrowserUrl({ seed: true })` → no-op, URL не меняется (подтверждено клик-аудитом: NO-EFFECT).
- **Сопутствующее:** `mode: 'challenge'` пишется в URL (`NodeCardDetails.tsx`), но RoadmapPage/Map3D его не читают — параметр-призрак.
- **Fix:** добавить ветку `seed` в `updateBrowserUrl` (симметрично roadmap/kinematic/comparison) + single source of truth для списка view-параметров; решить судьбу `mode=challenge`.

### BUG-05 · P2 · Математические ошибки в `AlgebraicSimplifier.simplify` (публичный пакет ricis-core-ts)

- **Файл:** `packages/ricis-core-ts/src/engine/AlgebraicSimplifier.ts` (правило `(x^n − a^n)/(x − a)` и multiply-chain ветка).
- **Подтверждено исполняемыми пробами:**
  | Вход | Получено | Верно |
  | :-- | :-- | :-- |
  | `(x*y*x − 1)/(x − 1)` | `x + 1` | нет — `y` молча теряется (`countMultiplyChain` не проверяет, что цепочка состоит только из `x`) |
  | `(x^(−2) − 1)/(x − 1)` | `0` | нет — при n<0 `buildPolynomialSum` делает 0 итераций → Const(0) |
  | `(x^0.5 − 1)/(x − 1)` | `x^(−0.5)` | нет — дробная степень попадает в цикл, собирается мусорный член |
- **DoS-риск:** `n` не ограничен → `(x^1000000000 − 1)/(x − 1)` строит миллиард узлов (зависание/OOM). До пользователя живого UI не доходит (пакет потребляют тесты/инструменты, UI использует `localRicisReducer`), но это экспортируемый «точный символьный движок» проекта.
- **Fix:** guard `Number.isInteger(n) && n >= 2 && n <= MAX_POLY_EXPANSION` (например 64); в multiply-chain ветке требовать, чтобы все листья цепочки были `Parameter(x)` (счётчик ≠ сумме → отказ от факторизации); тесты на все 4 случая.

### BUG-06 · P2 · Несогласованный контракт ошибок API

- **Файл:** `server.ts` (`/api/expandLeaves`).
- **Суть:** при отсутствии GEMINI_API_KEY эндпоинт возвращает **HTTP 200** с телом `{tasks: [], error: "GEMINI_API_KEY не настроен…"}`. Фронт (`mapStore.ts:791`) проверяет только `res.ok` → ошибка молча проглатывается, пользователь видит «0 новых задач» без причины. Соседние эндпоинты при этом отдают локальный шаблонный черновик с HTTP 200 (задокументированный фолбэк) — три разных паттерна деградации в одном API.
- **Fix:** единый контракт: либо 503 + `{error}` для всех AI-зависимых эндпоинтов, либо 200 + структурированное поле `degraded: 'local_draft' | 'no_api_key'`, которое UI честно показывает.

### BUG-07 · P2 · Clipboard без guard/catch — кнопки «Копировать» падают в небезопасном контексте

- **Файлы:** `SettingsModal.tsx:58` (нет ни guard, ни catch), `AgentLogModal.tsx:53`, `KinematicEnginePage.tsx:485`, `Lean4ReportViewer.tsx:52`, `PlainTerminalLogViewer.tsx:46`, `TheoremReportViewer.tsx:28`, `CompactCommandMenuBar.tsx:86` (`.then` без `.catch`/guard).
- **Суть:** в не-secure контексте (http по IP/LAN — не localhost) `navigator.clipboard === undefined` → TypeError в обработчике клика; при отклонении промиса — unhandled rejection. На Pages (HTTPS) и localhost не проявляется. Guard реализован только в `UrlShareService.copyShareUrlToClipboard` и `CoreRecoveryPage`.
- **Fix:** DRY-хелпер `copyToClipboard(text): Promise<boolean>` (guard + textarea-fallback + catch) и перевести все 7 мест на него.

### BUG-08 · P3 · Back/Forward всегда кликабельны

- **Файл:** `src/ui/components/CompactCommandMenuBar.tsx` — есть класс `disabled:opacity-30`, но нет атрибута `disabled` и не используются `AppletNavigationService.canGoBack()/canGoForward()`. Клик «Назад» при пустой внутренней истории вызывает `window.history.back()` — пользователь внезапно покидает приложение.
- **Fix:** `disabled={!AppletNavigationService.canGoBack()}` (плюс подписка на изменение стеков).

### BUG-09 · P3 · Двойной апдейт URL на каждую навигацию

- **Файл:** `src/App.tsx` `handleSelectApplet` → `navigateTo()` уже делает `syncUrl` (replaceState + popstate), затем App повторно вызывает `UrlShareService.updateBrowserUrl(...)` (ещё replaceState + popstate). 2 лишних события/рендера на каждый переход.
- **Fix:** убрать второй вызов, оставить `setLocationSearch`.

### BUG-10 · P3 · Legacy-диплинки `?view=` покрывают не все апплеты

- **Файл:** `src/services/AppletNavigationService.ts` `resolveCurrentApplet` — распознаёт `view=kinematic|seed|comparison|roadmap`, но не `view=voynich|terminal|qa-tests|settings` (в отличие от `?applet=`, который понимает все 9). Старые ссылки/закладки молча ведут на карту.
- **Fix:** расширить маппинг или явно documented-редирект `view→applet`.

### BUG-11 · P3 · Дрейф документации

- README: «1500+ unit-тестов» → фактически **2020** (251 файл). `QA_RECURSIVE_AUDIT_REPORT.md` (v0.4.107) заявляет «ВЕРИФИЦИРОВАНО» без AUDITOR-маркера и описывает устаревшую топологию (4 поверхности вместо 9). Числа тестов стоит вести в актуальном состоянии (анти-туфта-принцип проекта).

### BUG-12 · P3 · Доступность: интерактивные `<span onClick>`

- `Map3D.tsx:1832` (✕ скрытия сферы), `Map3D.tsx:1847` (✕ снятия выбранного узла) — кликабельные span без `role="button"`/`tabIndex`/обработки клавиатуры. Недоступно с клавиатуры и скринридеров.

### BUG-13 · P3 · `mode`-параметр «verify/challenge/explore» читается только при первом монтировании

- `Map3D.tsx:425` — `useState(() => initialUrlParams.initialMode === 'verify' …)` вычисляется один раз; повторная навигация внутри SPA с новым `?mode=` не меняет состояние (помогает только full reload, который RoadmapPage и делает через `window.location.assign` — тяжёлый, но рабочий путь).

## 4. ЧТО ПРОВЕРЕНО И РАБОТАЕТ (чтобы не дублировать работу)

- **Кнопки страниц (внутренние контролы):** терминал (пресеты заполняют input, Evaluate считает, Formal proof генерирует), seed (выбор проблем, ExpandTo, сброс к зерну), kinematic (Play/Pause, 2x, сценарии, QA-стресс, режимы RICIS), roadmap (выбор корневой цели, связанные задачи), voynich (все табы), core-recovery (повтор проверки), map3d (аккордеоны через CSS max-height — рабочие; zone-чекбоксы; сохранение IndexedDB; download JSON; сброс карты через confirm; поиск с историей; кнопки карточки узла — калькулятор/кинематика/roadmap/share), autoProver (batch-прогон). **0 исключений при кликах по всем 172 кнопкам.**
- **API:** `/api/health` 200; `/api/telegram/status` 200 (mode disabled, честно); `/api/v1/keys/*` 503 SHARED_KEY_POOL_DISABLED (by design); `/api/v1/solve` 202; валидация полей (400) на generateProof/aiAssistantNode/fillNodeParams/expandLeaves — контракты фронт↔бек совпадают (проверено по коду вызовов).
- **NaN-гигиена ядра:** `foldConstants(0/0)`, `foldConstants(5/0)` остаются символьными (не NaN) — RICIS-инвариант соблюдён.
- **Гигиена репо:** bun.lock и 13 одноразовых скриптов удалены (P2 из анализа 2026-09-14 закрыт); секретов в репо нет; CI (pr-verify) гоняет tsc+tps-gate+tests+build.

## 5. ПЛАН РЕШЕНИЯ (dependency-ordered)

> Правило порядка: сначала баги, без исправления которых нельзя осмысленно проверять/делать остальное.

| # | Задача | Баги | Почему раньше других | Оценка | Верификация |
| :-- | :-- | :-- | :-- | :-- | :-- |
| **1** | **Стабилизировать сервер**: обработчик `error` на child-process, предпроверка dotnet, честный 503 + `process.on('unhandledRejection')` | BUG-01 | Блокирует ВСЕ runtime-проверки API и стабильность любого стенда. Пока не закрыт — любой следующий шаг нельзя проверить на живом сервере | 0.5–1 ч | e2e: curl `/api/ricis-core/health` без dotnet → 503, процесс жив; с dotnet → 200 |
| **2** | **Оживить командную шину**: подписчики `ricis:*` в целевых страницах (или прямой вызов store из commandRegistry), пробросить `isSimulationRunning`/`isAutoProverRunning`, решить судьбу toggle3D | BUG-02 | Крупнейший видимый дефект UI; без него «проверка всех кнопок» не может быть зелёной; заодно определяет архитектуру для BUG-03 | 0.5–1 день | jsdom-харнессы кликов команд + юнит-тесты на каждую команду |
| **3** | **Пробросить реальные пропсы в Settings-апплет** (roles/useAdaptiveUI/physics из Map3D-конфигурации) | BUG-03 | Зависит от архитектуры команд из шага 2 (где живут store-колбэки); закрывает последний «апплет-заглушка» | 2–4 ч | рантайм: создание роли из `?applet=settings` реально появляется в списке |
| **4** | **Починить UrlShareService**: ветка `seed` в `updateBrowserUrl`, single-source-of-truth для view-параметров, убрать двойной апдейт (BUG-09), disabled для Back/Forward (BUG-08), расширить legacy `?view=` (BUG-10) | BUG-04, 08, 09, 10 | Один файл/одна зона; диплинки — основа share-функциональности, на которую завязаны карточки узлов | 0.5 дня | юнит-тесты updateBrowserUrl на все флаги + AppletNavigationService-тесты |
| **5** | **Исправить AlgebraicSimplifier** (guard целого n≥2≤64, полная проверка multiply-chain, тесты 4 кейсов) | BUG-05 | Публичный пакет; правка локальная, но требует новых тестов на каждый кейс | 0.5 дня | новые юнит-тесты: y не теряется, n<0/n∉Z не факторизуется, n=1e9 — отказ |
| **6** | **Единый clipboard-хелпер** + перевод 7 мест | BUG-07 | Механическая правка после п.4 (тот же слой сервисов) | 2–3 ч | юнит-тест с моком undefined clipboard |
| **7** | **Единый контракт деградации API** (503 или `degraded`-поле) + показ причины в UI | BUG-06 | Требует решения по контракту (бизнес-вопрос: считать ли локальный черновик успехом) | 0.5 дня | контрактные тесты сервера + UI-тест «нет ключа → видно, почему» |
| **8** | **Полировка**: доступность span-контролов (BUG-12), mode-параметр при SPA-навигации (BUG-13), актуализация чисел в README/QA-отчёте (BUG-11) | BUG-11, 12, 13 | Не блокирует ничего; выполняется последним | 0.5 дня | линт-правило/тест на числа тестов; axe-проверка контролов |

После шага 8 — повторить полный jsdom клик-аудит (харнессы из §2 восстановимы по описанию) и зафиксировать «0 dead-кнопок» как критерий готовности.

## 6. REMAINING RISKS

- Аудит кнопок выполнен в jsdom (WebGL/canvas-поведение Map3D, полные CSS-эффекты и IndexedDB-персистентность проверены статически/частично). Полный браузерный e2e (Playwright) в песочнице невозможен — нет доступа к CDN браузеров; рекомендуется добавить e2e-джобу в CI.
- `qa-tests`-кнопки тулбара (BUG-02) частично дублируются работающими внутренними кнопками AutoProverModal — при фиксации не забыть про дублирование UX.
- Часть «строгих» тестов репо (например, `Map3D.communityRewardsStatus.test.ts`) — это строковые проверки исходника, а не рантайм-поведения; они могут маскировать регрессии при рефакторинге шагов 2–3 (рекомендуется дополнять рантайм-тестами в тех же PR).

## 7. ИЗМЕНЕНИЯ, ВНЕСЁННЫЕ В ХОДЕ АУДИТА

1. `server.ts`: добавлен опциональный `allowedHosts` для Vite-dev в middleware-режиме (env `VITE_ALLOWED_HOSTS=true`) — нужен для проксированного превью в песочнице; по умолчанию поведение неизменно.
2. Аудит-харнессы (7 временных `*.audit.test.tsx` + scratch-скрипты) созданы для проверки и **удалены** после фиксации результатов; полный тест-сьют после аудита — зелёный.

## 8. FINAL STATUS

- **Аудит:** `COMPLETED` (SELF-REPORTED): 13 багов зафиксированы с воспроизведением и планом; базовые гейты (tsc/tests/build) зелёные.
- **Устранение багов:** `NOT STARTED` — план в §5 ожидает запуска (шаг 1 можно делать немедленно).
- **CONFIDENCE:** высокая для BUG-01…07 (живое воспроизведение/исполняемые пробы/кросс-скан), средняя для BUG-08…13 (статический анализ + частичный рантайм).
