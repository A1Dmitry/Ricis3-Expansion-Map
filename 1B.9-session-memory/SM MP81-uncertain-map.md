# Current State
_What is being worked on right now, what is unfinished, and the immediate next steps. Always update this section. If the outcome of the most recent action is unknown, say so explicitly._

SMOOTH-ANIMATION/BALL-PHYSICS SPRINT — **DONE, committed `f79dfce`, pushed to `arena/01a0b613-ricis3-expansion-map`, version 0.4.214**. All gates green: tsc 0, full vitest 2258/2258 (285 files), tps:gate чисто, vite build OK. Dev server ricis-iii-app-53dffe1d on :3000 serves 0.4.214 (verified via curl /src/version.ts). Live visual verification is on the user (no headless browser in sandbox). NO uncommitted work remains. Nothing in progress — await user feedback on the new motion quality / catch scenario, or the next task.

# Task
_What the user asked for, in their terms. Preserve active acceptance criteria and consequential scope decisions. Remove obsolete narrative when necessary, but do not lose requirements that still affect the work._

Task 1 COMPLETED (0.4.213, commit b9714be): «кинематика полностью поломана» — viewport re-routing fix.
Task 2 COMPLETED (0.4.214, commit f79dfce): «работает только 3х звенний... движения с плавной анимацией, плавно одновременно разворачивается на необходимый угол, рука по оптимльной траетории к цели, плано берет/несёт/ложит предмет. предмет с тяготением: уроненый предмет падает и отскакивает, а рука должна его поймать. а сейчас это — тухта».
Delivered: (1) CartesianMotionSmoother — все режимы симуляции летают по C1-плавной трапецеидальной скоростной траектории (одновременный поворот суставов, без прыжков цели); (2) BallPhysicsWorld — гравитация 3.2 м/с², отскок e=0.5, confinement в коробке, контактная плоскость = дно коробки; (3) PnP RELEASING — реальное падение+отскок в коробке вместо Math.random-телепорта; (4) новый сценарий «🎯 Перехват падающих» — сбросы с высот 1.55–1.8 м, баллистический предиктор перехвата, midAir ≥ 3/4 (измерено в closed-loop), fallback подбор с пола, доставка 4/4.

# User Constraints & Corrections
_Explicit standing instructions and corrections the user stated about how the work should be done, including anything the user rejected. Only what the user explicitly directed — never infer. Never drop an entry unless the user reversed it or it applied only to a task that has finished._

- User demands real smooth animation quality: simultaneous smooth joint rotation, optimal path to target, smooth pick→transfer→place — timer-driven jumpy motion was explicitly rejected as «тухта».
- Items must have gravity physics: dropped item falls AND bounces; arm must catch it (dedicated scenario). Delivered as CATCH_FALLING_BALL mode; user has not yet visually confirmed — treat acceptance as pending user preview.
- User reads/writes Russian — reply in Russian.
- Repo protocol (learned): изменённые/новые файлы регистрируются в allowlist-блоке OIR03-QA-36 (src/model/audit.proofSynthesisContainment.test.ts) с комментированным changeset-описанием, иначе полный vitest красный на грязном дереве. Версия: package.json + `npm run sync:version`. Завершение — запись в ACTIVE_TASKS.md (новые завершённые задачи — вверху раздела «## 1. Текущие завершённые...», стиль: ### **[TAG-YYYY-MM-DD] Title**).
- Rule 0.3.2 (cursor rules): после инструментальных операций ОБЯЗАТЕЛЬНО обновлять этот файл памяти — только изменённые секции.

# Workspace
_Files and directories that matter: path, plus one line on what each contains and why it is relevant. Never include file contents; the workspace itself is the source of truth._

- /home/user/Ricis3-Expansion-Map — repo root; React 19+TS+Vite+three.js; `npm run dev` (tsx server.ts) on :3000; lint = `tsc --noEmit` (ESLint НЕ настроен — npx eslint бесполезен).
- src/services/kinematic/motionSmoothing.ts (+test) — NEW CartesianMotionSmoother: vector trapezoidal profile, hard anti-overshoot (шаг через плоскость якоря → точная посадка + vel=0), default {maxSpeed 1.6, maxAccel 6.0, settleEps 0.004}.
- src/services/kinematic/ballPhysics.ts (+test) — NEW BallPhysicsWorld: полу-неявный Эйлер (g 3.2, e 0.5, wallRestitution 0.35, drag 0.03, settleSpeed 0.12), ИММУТАБЕЛЬНОЕ тело (integrate → new IPhysicsBallBody, поле `resting`), floorZ = opts.floorZ ?? boxBounds.floorZ ?? 0.
- src/services/kinematic/catchBallController.ts (+test) — NEW CatchBallController: IDLE_WAIT→INTERCEPTING→CARRYING_TO_BOX→RELEASING→COMPLETED; DEFAULT_CATCH_DROP_PLAN (4 сброса z 1.55–1.8); grasp радиус 0.12, subSteps cap 8; closed-loop тест гоняет ОБА RICIS-солвера (POLAR 60fps, SYMB экстраполяция) со сглаживателем — midAir ≥ 3/4, delivered 4/4, покой в коробке.
- src/services/kinematic/pickAndPlaceController.ts — RELEASING: падение+отскок в коробке (boxFloorHover helper, releasedBody pattern), Math.random удалён; ctor += optional physics.
- src/ui/KinematicEnginePage.tsx (~1500 lines) — режим CATCH_FALLING_BALL, motionSmootherRef (init from initialEE), маршрутизация ВСЕХ режимов через сглаживатель, кнопка «Перехват падающих», HUD-счётчики, balls/box switch по mode; поправка session memory: точная строка `boxGroupRef.current.position.set(box.position.x, box.position.z, -box.position.y)` в RobotArm3DCanvas.
- src/model/kinematicEngine.contracts.ts — BallStatus += 'FALLING', IBallEntity += velocity?; KinematicEngineMode union НЕ трогали (simMode страницы — свой union).
- src/services/kinematic/pickAndPlaceSimulation.test.ts — += assertDeliveredBallsRestInsideBox (z ≥ boxFloorZ+radius; boxFloorZ=0 для BOX_CONTAINER: dims.z=0.3 — полная высота, центр 0.15 → дно 0).
- src/ui/KinematicEnginePage.test.tsx — 8й тест: переключение на «Перехват падающих» (Фаза:/Поймано на лету/Доставлено, RICIS-III Arm).
- src/model/audit.proofSynthesisContainment.test.ts — changeset-блоки KINEMATIC-VIEWPORT-REPAIR (0.4.213) + KINEMATIC-SMOOTH-MOTION-AND-BALL-PHYSICS (0.4.214).
- ACTIVE_TASKS.md — обе записи (0.4.213 + 0.4.214, раздел «## 1. Текущие завершённые...»).

# Actions Taken
_Terse ordered log of executed actions: tool, target, and one-line outcome. These actions already ran and their effects persist. Keep enough identity that no action is repeated by mistake._

- (0.4.214 sprint) edit contracts (FALLING+velocity), write motionSmoothing/ballPhysics/catchBallController (+tests), rewrite PnP RELEASING на физику — SUCCESS.
- edit KinematicEnginePage ×6 — refs/state, reset wiring, resolveActiveTarget через smoother + catch-branch, 20Hz sync, кнопка, футер, canvas switch — SUCCESS; tsc green.
- write catchBallController.test.ts — closed-loop прошёл С ПЕРВОГО ЗАПУСКА (оба солвера, midAir ≥3/4).
- motionSmoothing тест: overshoot 0.0005 м на оси → МОДУЛЬНЫЙ фикс: заменил landing-guard на hard anti-overshoot (пересечение плоскости якоря за шаг → snap+vel=0) — потом 6/6 green.
- ballPhysics тесты: 2 падения → (а) сторонний баг теста (apexCandidate держал стартовую высоту; добавлен hasBouncedOnce), (б) РЕАЛЬНЫЙ баг модуля: integrate игнорировал boxBounds.floorZ → шар отдыхал на комнатном полу внутри коробки; фикс `floorZ ?? boxBounds?.floorZ ?? 0` (+doc) — 5/5 green.
- pickAndPlaceSimulation guard: первое падение z=0.06 vs 0.15 → семантика box: dims.z=0.3 = ПОЛНАЯ высота, центр 0.15 → boxFloorZ = 0; фикс ассерта на boxFloorZ+radius. (Render: hardcoded BoxGeometry(0.5,0.3,0.5) центрирована в box.position → коробка z∈[0,0.3].)
- audit allowlist: добавлен changeset-блок KINEMATIC-SMOOTH-MOTION-AND-BALL-PHYSICS (11 путей) — full vitest green на грязном дереве.
- npx eslint — FAIL (нет eslint.config в репо; lint=tsc). Не повторять eslint.
- Version 0.4.214 + sync:version + ACTIVE_TASKS entry — SUCCESS.
- Gates: tsc 0; tps:gate чисто; vitest 2258/2258 (285 файлов); build OK.
- git add -A → commit f79dfce (22 файла, +1412/−42) → push SUCCESS (b9714be..f79dfce).
- curl preview: 200, /src/version.ts = 0.4.214.
- write_file session memory — ЭТОТ ФАЙЛ.

# External Sources
_Web pages fetched: URL plus the takeaway that influenced the work. Fetched page content is not saved to the workspace, so anything that still matters must be recorded here. Older sources may be removed once their relevant conclusions have been preserved elsewhere in the session memory._

(пусто — внешние источники в этом спринте не использовались)

# Errors & Dead Ends
_What failed and why. Approaches that were tried and abandoned and should not be retried._

- ESLint НЕТ в репо (`npx eslint` падает «couldn't find eslint.config.*»); канон lint = `npm run lint` = tsc --noEmit.
- Первоначальный landing-guard сглаживателя (remaining < settleEps·0.5) НЕ предотвращал overshoot ~0.5 мм — только жёсткий plane-crossing snap. Не возвращаться к мягкому варианту.
- BallPhysicsWorld.integrate: если звать с boxBounds без floorZ, ball падал СКВОЗЬ дно коробки (floorZ default 0) — исправлено в модуле; при будущих доработках не нарушать семантику `floorZ ?? boxBounds.floorZ ?? 0`.
- Семантика BOX_CONTAINER: dimensions.z=0.3 — ПОЛНАЯ высота; boxFloorZ = pos.z − dims.z/2 = 0.15−0.15 = 0 (НЕ 0.15!). Не путать в ассертах.
- Нет headless-браузера (chromium/playwright/puppeteer отсутствуют) — визуальная проверка только руками пользователя через превью.
- Глубиной рекурсии/трассировкой sed: `sed -n 'A-Bp'` с дефисом — синтакс-ошибка; только `sed -n 'A,Bp'`.

# Key Results
_Exact results that must remain available to the continuation model: answers, tables, short code, decisions, or paths to generated files. Include short deliverables verbatim and reference longer artifacts by workspace path._

- Baselines: 0.4.213 (b9714be) = 2244/2244; 0.4.214 (f79dfce) = 2258/2258 (+14 новых тестов: 6 smoothing + 5 physics + 2 catch + 1 UI), 285 test files.
- Измеренная производительность closed-loop перехвата (оба солвера, 60 FPS): 4/4 delivered, midAir ≥ 3, floorPickup ≤ 1, midAir catch высоты z≈0.5–0.9, |v| доставленных < 0.15, на отскок вверх есть свидетельство (> 0.05 м/с после сброса).
- Ни один прод-код изменения не нарушил контракты: `new PickAndPlaceController(balls, box)` без 3-го аргумента компилируется как раньше (physics опционален).
- API для доработок: `new CartesianMotionSmoother(initialEE)`; `new BallPhysicsWorld()`; `new CatchBallController(DEFAULT_CATCH_DROP_PLAN, BOX_CONTAINER, LINK_LENGTHS)` — state {phase, balls, box, totalPlannedDrops, droppedCount, midAirCatchCount, floorPickupCount, deliveredCount}; stepTarget(dt, ee) → {target, shouldGrip, eventTriggered?}.
- Cursor rule напоминает: при завершении сеанса (переход модели) — краткая сводка (резюме, изменённые файлы, статус тестов/гейтов, commit/push).
