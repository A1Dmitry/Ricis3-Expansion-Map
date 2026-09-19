# Current State
_What is being worked on right now, what is unfinished, and the immediate next steps. Always update this section. If the outcome of the most recent action is unknown, say so explicitly._

INTERCEPTION-BENCHMARK SPRINT — **DONE** (0.4.216). **PR #79 открыт, КОНФЛИКТЫ С MAIN УРЕГУЛИРОВАНЫ: mergeable=MERGEABLE**. Main был переписан в единичный корневой снимок 7e00e1a (GAP-CLOSURE-SINGULARITY + несогласованный бамп версий), история не пересекалась с веткой → ручное слияние с явной базой 129081a: merge-коммит `096fb4f` (50 main-only файлов вербатим, 9 версионных файлов — наши 0.4.216, allowlist — объединение обоих блоков) + `6e0d7ad` (репайр: рефактор EditNodeModal у main потерял поля паритета — стражи UIRF-04/05 на самом снимке были красными; восстановлены zones/assignNodeZone/source-ссылка поверх рефактора, стражи не ослаблены). Гейты слитого дерева: tsc 0, полный vitest **2301/2301** (296 файлов, включая GAP-side), tps:gate чисто, build OK. Гейты: tsc 0 ✓, interceptionBenchmark.test.ts 8/8 ✓, полный vitest 2271 — после фикса allowlist-гейта 36/36 ✓ (единственный падший OIR03-QA-36 исправлен регистрацией 2 новых файлов), tps:gate чисто ✓, build ✓. Незавершённой работы нет; возможен лишь follow-up commit «session memory» этого апдейта. Ждём визуальной акцептации 0.4.214/0.4.215/0.4.216 от пользователя (превью).

ВАЖНО: локальная история git НЕ персистентна между песочницами — remote = источник правды. При новой сессии, если `git log` показывает только базу 129081a: `git fetch origin arena/01a0b613-ricis3-expansion-map && git reset FETCH_HEAD` (рабочее дерево сохраняется). `origin/<branch>` ссылок нет — используй FETCH_HEAD.

# Task
_What the user asked for, in their terms. Preserve active acceptance criteria and consequential scope decisions. Remove obsolete narrative when necessary, but do not lose requirements that still affect the work._

Task 4 COMPLETED (0.4.216, `7d69ca0`) — «Единое задание для LLM» (дословная спецификация хранится в чате): браузерный 3D-сим манипулятора, ловящего падающий шар (гравитация+отскок+предикт+достижимая точка+IK+синхронная плавная траектория+FK-проверка+детект недостижимости+разные начальные условия; **без нейросетей** — детерминированно). Тесты A (IK→FK roundtrip), B (плавное синхронное движение), C (t_c: шар ∈ Reachable ∧ t_robot ≤ t_c), D (пересчёт траектории после отскока), E (батарея 10 кейсов без ручных правок), ГЛАВНЫЙ — UNKNOWN SCENARIO (случайные позиция/скорость/угол/restitution/…, система знает только состояние симуляции; observe→predict→select→IK→trajectory→catch). Метрики: IK error, catch rate, prediction error, timing error, joint-limit/collision violations, smoothness, replanning, unreachable detection, determinism, manual intervention. Две реализации-линии: Вариант 1 (свободная архитектура LLM) vs Вариант 2 (RICIS/geometric pipeline: Ball State→Trajectory Prediction→Interception Point+Time→Analytical IK→Candidate Configurations→Constraints→Synchronized Motion Profile→FK Verification→Execution) — одинаковые входы/физика/манипулятор/время, НЕ подгонять тест под RICIS. Наша интерпретация: репо = готовая линия Варианта 2; бенчмарк-карниз построен как артефакт сравнения (батарея+UNKNOWN+таблица метрик в UI).

Delivered 0.4.216: (1) contracts — `BallStatus` += `'UNREACHABLE'`; (2) catchBallController — `unreachableCount`, `IInterceptPlan`/`getLastInterceptPlan()`, часы `scenarioTimeSec`, `isReachable()` (annulus radial/z−L0, maxReach=L1+L2−0.06, min 0.25), `declareUnreachable()` (покоящийся шар вне кольца охвата → событие + dropIndex++ + статус; зависания нет), очистка плана в graspBall; (3) НОВЫЙ `src/services/kinematic/interceptionBenchmark.ts` — `INTERCEPTION_SCENARIO_BATTERY` (T01–T10), `generateUnknownScenarioBatch(seed,count)` (mulberry32), `runInterceptionScenario` (живой пайплайн controller→smoother→engine POLAR, 60 Гц, кэп 30 с), `runInterceptionBenchmark` → отчёт с `determinismSignature`; (4) UI-панель «📊 Бенчмарк перехвата» в KinematicEnginePage (state `benchmarkReport/IInterceptionBenchmarkReport`, `benchmarkRunning`, handler `runInterceptionBenchmarkPanel` с setTimeout-defer, сводка `data-testid="benchmark-catch-rate"`, таблица метрик); (5) страж `interceptionBenchmark.test.ts` 8/8.

Ранее завершены: 0.4.213 (b9714be) viewport repair; 0.4.214 (f79dfce) smooth motion + ball physics + catch scenario; 0.4.215 (591ecb9) комната + теннисные пушки + elbow-guard.

# User Constraints & Corrections
_Explicit standing instructions and corrections the user stated about how the work should be done, including anything the user rejected. Only what the user explicitly directed — never infer. Never drop an entry unless the user reversed it or it applied only to a task that has finished._

- Бенчмарк-спецификация (владелец): без нейросетей для кинематики; батарея 10 кейсов без ручных правок между ними; UNKNOWN-режим с рандомизацией; оценивать НЕ картинку, а объективные метрики (таблица: IK error, catch rate, prediction/timing error, violations, smoothness, replanning, unreachable detection, determinism, manual intervention); не подгонять тест под RICIS — одинаковые входы/физика/манипулятор/время для обеих линий сравнения.
- Пользователь проектировщик-сценарист: комната, прозрачность для камеры, физика предметов (падение+отскок), вариативность (сила выстрела), поведенческие исходы (перехват OR подбор), инженерная достоверность (локоть не сквозь пол).
- User reads/writes Russian — reply in Russian.
- Репо-протокол: изменённые/новые файлы → allowlist-блок в OIR03-QA-36 (src/model/audit.proofSynthesisContainment.test.ts, `--untracked-files=all`, пути с пробелами — в кавычках git-формы); версия через package.json + `npm run sync:version`; запись в ACTIVE_TASKS.md (новейшая вверху раздела «## 1», формат ### **[SPRINT-ID-дата] Заголовок**); желателен `git add -A` коммит с подробным changelog'ом + push.
- Rule 0.3.2: после инструментальных операций обновлять ЭТОТ файл памяти (только изменённые секции); при завершении сеанса — краткая сводка.

# Workspace
_Files and directories that matter: path, plus one line on what each contains and why it is relevant. Never include file contents; the workspace itself is the source of truth._

- src/services/kinematic/interceptionBenchmark.ts — НОВЫЙ: `IInterceptionScenarioSpec`, батарея 10 кейсов T01–T10 (slow/fast/high-lob/low-throw/bounce/lateral/multi-bounce/unreachable/too-fast/free-form), `generateUnknownScenarioBatch(seed,count)` (mulberry32, спаун у стен, прицел в воркспейс, elev 8–40°, speed 1.3–3.2, restitution 0.3–0.7), `runInterceptionScenario(spec)` (детект исхода по дельтам счётчиков), `runInterceptionBenchmark(specs)` → `IInterceptionBenchmarkReport` (+`determinismSignature`).
- src/services/kinematic/interceptionBenchmark.test.ts — НОВЫЙ страж, 8 тестов (см. Key Results).
- src/services/kinematic/catchBallController.ts — += `unreachableCount`, `IInterceptPlan`/`getLastInterceptPlan()` (штампится в planIntercept; null при отсутствии airborne-плана), `scenarioTimeSec`, `isReachable()` (annulus radial/z−L0, maxReach=L1+L2−0.06, min 0.25), `declareUnreachable()` (IDLE_WAIT + dropIndex++ + UNREACHABLE + событие), очистка плана в graspBall. Все state-rebuild через spread `...this.state` — счётчики сохраняются.
- src/model/kinematicEngine.contracts.ts — `BallStatus` += `'UNREACHABLE'`.
- src/ui/KinematicEnginePage.tsx — панель `<details>` «📊 Бенчмарк перехвата» перед блоком canvas: imports из interceptionBenchmark, стейты `benchmarkReport`/`benchmarkRunning`, `runInterceptionBenchmarkPanel` (specs = батарея + generateUnknownScenarioBatch(7,10), setTimeout 30ms defer).
- src/services/kinematic/polarSolvers.ts — выбор ветви локтя в закрытой форме (0.4.215); НЕ трогать далее.
- src/services/kinematic/kinematicSolvers.ts — BENCHMARK-классы (DlsSolver3D и пр.) — НЕ ИЗМЕНЁН, не трогать.
- Координаты three.js: model (x,y,z-up) → three (x, z, −y); камера стартует вне комнаты.
- /tmp/bench.ts — smoke-скрипт бенчмарка (абсолютные импорты с .js суффиксом для tsx).

# Actions Taken
_Terse ordered log of executed actions: tool, target, and one-line outcome. These actions already ran and their effects persist. Keep enough identity that no action is repeated by mistake._

- edit_file contracts: `BallStatus` += 'UNREACHABLE' → успех.
- Патчи catchBallController (edit_file ×3 + python): state/counters/reset + часы + `getLastInterceptPlan`, штамп плана в planIntercept, unreachable-детект в ветке `body.resting` через `isReachable`, `declareUnreachable`, очистка плана при grasp → успех.
- write_file interceptionBenchmark.ts (garниз+battery+generator+aggregator); smoke `npx tsx /tmp/bench.ts` → батарея 10/10, catchRate 1.00, jl/col 0, FK-drift 0; UNKNOWN seed7 10/10.
- edit_file KinematicEnginePage.tsx: JSX-панель (прошлый ход) + imports + стейты + handler (этот ход) → tsc TSC-OK.
- write_file interceptionBenchmark.test.ts (8 тестов) → vitest файла 8/8 ✓ (~474 мс).
- Полный vitest run: 2270/2271 — падал OIR03-QA-36 (allowlist) → регистрация `?? src/services/kinematic/interceptionBenchmark.test.ts` + `?? src/services/kinematic/interceptionBenchmark.ts` с комментарием такта → 36/36 ✓.
- package.json 0.4.215→0.4.216, `npm run sync:version` ✓ (все документы синкнули).
- ACTIVE_TASKS.md: запись такта добавлена ### **[INTERCEPTION-BENCHMARK-2026-09-19] ...** вверху «## 1» (первый вариант как «## 0.7» — удалён, неверная форма).
- tps:gate чисто ✓, npm run build ✓ (включает releaseConsistency).
- commit `7d69ca0` (17 файлов) + push ✓; память — ЭТОТ файл (follow-up).

# External Sources
_Web pages fetched: URL plus the takeaway that influenced the work. Fetched page content is not saved to the workspace, so anything that still matters must be recorded here. Older sources may be removed once their relevant conclusions have been preserved elsewhere in the session memory._

(пусто)

# Errors & Dead Ends
_What failed and why. Approaches that were tried and abandoned and should not be retried._

- GIT-СБРОС ПЕСОЧНИЦЫ: локальный HEAD упал на базовый коммит при пересоздании окружения → `git fetch origin <branch>` + `git reset FETCH_HEAD` (mixed reset сохраняет worktree, индекс выравнивается с remote).
- ALLOWLIST-ЛОВУШКИ: (a) `git status --porcelain --untracked-files=all` разворачивает untracked-директории в файлы — регистрировать ФАЙЛ, не директорию; (b) пробелы в имени → git оборачивает путь в двойные кавычки — allowlist-строка должна содержать кавычки буквально.
- ACTIVE_TASKS.md форма: верхнеуровневые «## 0.x» — формат ДРУГОГО цикла (сентябрьские такты аксиоматики); kinematics-спринты фиксируются ### -записями вверху раздела «## 1. Текущие завершённые и верифицированные задачи» (по образцу 0.4.213/14/15).
- Мой «вырожденный» тест-кейс {q2:−1.4, q3:3.05} не был вырожден (radial 0.081) — гард правильно перевернул ветвь, тест был виноват; истинное вырождение = {q2:−π/2, q3:π}.
- BENCHMARK-КЛАССЫ в kinematicSolvers.ts (DlsSolver3D и пр.) не трогать; изменения только в polarSolvers.ts + гард движка.
- Гард движка НЕ применять к PolarRicisConstraintSolver (instanceof) — ветвь выбирается внутри его закрытой формы; применение гарда вызывало dithering/ping-pong.
- /tmp скрипты: относительный импорт из /tmp не резолвится — абсолютный путь с `.js` суффиксом для tsx. ESLint отсутствует (lint=tsc).
- РЕЦЕПТ СЛИЯНИЯ С ПЕРЕПИСАННЫМ MAIN: несвязанные истории (`main` = одиночный root-коммит) — `git replace --graft` в песочнице (git 2.39.5) НЕ влияет на rev-list/merge-base (replace-refs игнорируются). Рабочий рецепт: (1) checkout main-only файлов из FETCH_HEAD; (2) ручное объединение пересечений; (3) дерево через `git write-tree` + коммит с двумя родителями через `git commit-tree -p HEAD -p <main>`; (4) `git update-ref` + `git reset --quiet`. После этого branch — настоящий потомок main, GitHub видит mergeable.

# Key Results
_Exact results that must remain available to the continuation model: answers, tables, short code, decisions, or paths to generated files. Include short deliverables verbatim and reference longer artifacts by workspace path._

- Baselines тестов: 0.4.213=2244 → 0.4.214=2258 → 0.4.215=2263 → **0.4.216=2271/2271** (287 файлов; +8 interceptionBenchmark).
- Матрица батареи (замерено, зафиксировано стражами): 10/10 expectations (T01–T07,T10 пойманы — 6 MID_AIR + 2 FLOOR_PICKUP; T08/T09 UNREACHABLE за 186/149 шагов < 400), catchRateExpected=1.00, totalJointLimitViolations=0, totalCollisionViolations=0, maxFkDriftM=0.0e+0 (<1e-9), IK ≤ 0.121 м (радиус захвата), UNKNOWN seed 7 → 10/10 (страж ≥8), оба прогона детерминированы (determinismSignature равны).
- Честные не-гейтовые метрики: T05 multi-bounce prediction error раннего плана 0.70 м / Δt 1.58 с (план до первого отскока); maxAccel сырого лерпа ~2709 rad/s² (строка smoothness таблицы; сглаживатель страницы в harness не входит).
- Исходы per-case: T01 MID_AIR 1.70 с, T02 MID_AIR 1.37, T03 MID_AIR 1.88, T04 FLOOR 2.50, T05 FLOOR 3.08, T06/T07/T10 MID_AIR, T08 186 шагов, T09 149.
- Архитектура детекта: дельты `midAirCatchCount/floorPickupCount/unreachableCount` против базовых; `firstPlan` = первый `getLastInterceptPlan()`; `predictionErrorM = |firstPlan.point − ballPosAtGrasp|`, `timingErrorSec = |(plannedAtSec+timeSec) − graspTime|`.
- Граница правки 0.4.216: солверы/физика/сглаживатель/логика перехвата НЕ менялись — только наблюдательность (часы, план) + исход UNREACHABLE + гарниз + UI + стражи.
- Коммиты: b9714be (0.4.213) → f79dfce (0.4.214) → 591ecb9 (0.4.215) → 7d69ca0 (0.4.216) → ae488d5 (memory) → **096fb4f (merge main-snapshot 7e00e1a, явная база 129081a) → 6e0d7ad (UIRF-репайр EditNodeModal)**. PR #79 → main, mergeability MERGEABLE.
