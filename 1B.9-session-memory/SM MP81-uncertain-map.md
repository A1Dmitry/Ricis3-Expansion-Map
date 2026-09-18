# Current State
_What is being worked on right now, what is unfinished, and the immediate next steps. Always update this section. If the outcome of the most recent action is unknown, say so explicitly._

ROOM + TENNIS-CANNON + ELBOW-GUARD SPRINT — **DONE, committed `591ecb9` (23 файла, +818/−78), pushed to `arena/01a0b613-ricis3-expansion-map`, version 0.4.215**. Gates: tsc 0, full vitest **2263/2263** (286 файлов), tps:gate чисто, vite build OK. Память обновлена и закоммичена; в allowlist OIR03 зарегистрированы ОБЕ формы пути памяти (`?? ` и ` M `, git кавычит путь с пробелом). Возможен лишь follow-up commit «chore: session memory» после этого апдейта. Ждём визуальной проверки пользователя (превью :3000). Незавершённой работы нет.

ВАЖНО: локальная история git НЕ персистентна между песочницами — remote = источник правды. При новой сессии, если `git log` показывает только базу 129081a: `git fetch origin arena/01a0b613-ricis3-expansion-map && git reset FETCH_HEAD` (рабочее дерево сохраняется). `origin/<branch>` ссылок нет — используй FETCH_HEAD.

# Task
_What the user asked for, in their terms. Preserve active acceptance criteria and consequential scope decisions. Remove obsolete narrative when necessary, but do not lose requirements that still affect the work._

Task 3 COMPLETED (0.4.215, `591ecb9`) — дословно: «добавь атоматы отстреливающие шарики. это комната. нарисуй пол потолок стены. шарики отстреливаются пушкой для тенниса. но выстрел слабый пневмо. камера смотрит сквозь стену. сила выстрела разная поэтому шарики отскакивают с разной силой. манипулятор их или перехватывает на лету, либо собирает с пола. заметь. локоть уходит ниже основания. надо либо манипулятор поднять, либо другую траекторию локтя задавать чтобы он не уходил под пол.»
Delivered: (1) комната 4.8×4.8×2.8, пол/потолок/4 стены полупрозрачные (opacity 0.05–0.07, depthWrite false, DoubleSide) — камера смотрит сквозь стену; рёбра контура; 2D-схема: контур стен + линия потолка; (2) 2 пушки-автомата (дуло 1.35/0.62 м), 6 залпов 1.45–2.05 м/с, углы 9–34°, баллистика + отскоки от пола/стен (room-confinement в интеграции и предикторе), перехват на лету И подбор с пола (измерено 3+3 у обоих солверов, 6/6 доставок); (3) локоть ≥ 0 на каждом кадре: выбор зеркальной ветви 2R-IK внутри полярного солвера (гистерезис), зеркальный гард движка для итеративных солверов, подъём груза вертикально (z→0.95) перед переносом.
Ранее завершены: 0.4.213 (b9714be) viewport repair; 0.4.214 (f79dfce) smooth motion + ball physics + catch scenario.

# User Constraints & Corrections
_Explicit standing instructions and corrections the user stated about how the work should be done, including anything the user rejected. Only what the user explicitly directed — never infer. Never drop an entry unless the user reversed it or it applied only to a task that has finished._

- Пользователь проектировщик-сценарист: комната, прозрачность для камеры, физика предметов (падение+отскок), вариативность (сила выстрела), поведенческие исходы (перехват OR подбор), инженерная достоверность (локоть не сквозь пол — принял вариант «другая траектория локтя», не подъём манипулятора).
- User reads/writes Russian — reply in Russian.
- Репо-протокол: изменённые/новые файлы → allowlist-блок в OIR03-QA-36 (src/model/audit.proofSynthesisContainment.test.ts, `--untracked-files=all`, пути с пробелами — в кавычках git-формы); версия через package.json + `npm run sync:version`; запись в ACTIVE_TASKS.md (новейшая вверху раздела «## 1»); желателен `git add -A` коммит с подробным changelog'ом + push.
- Rule 0.3.2: после инструментальных операций обновлять ЭТОТ файл памяти (только изменённые секции); при завершении сеанса — краткая сводка.

# Workspace
_Files and directories that matter: path, plus one line on what each contains and why it is relevant. Never include file contents; the workspace itself is the source of truth._

- Координаты three.js: model (x,y,z-up) → three (x, z, −y); камера стартует (3.8,3.2,3.8) — вне комнаты.
- src/services/kinematic/catchBallController.ts — `ICatchDropPlanEntry` += initialVelocity?/cannonId?/muzzleSpeedMps?; TENNIS_CANNONS (A: дуло (2.28,0.55,1.35), B: (0.75,2.28,0.62)); ROOM_HALF_EXTENT_M=2.4, ROOM_HEIGHT_M=2.8; TENNIS_CANNON_SHOT_PLAN (6 залпов, компоненты скоростей проверены тюнинг-симом → rest reach 0.47–1.01 м); roomBallBounds() (радиус-inset 0.06); stepCarrying: CLIMB z→0.95 при horizontal>0.25 && ee.z<0.85.
- src/services/kinematic/kinematicMath.ts — += computeElbowPosition3D, enforceElbowFloorClearance (зеркало: q2'=2φ−q2, q3'=−q3, φ из FK EE; flip только если mirror > current+0.04; radial<1e-9 → noflip; возвращает ТОТ ЖЕ объект при no-op).
- src/services/kinematic/kinematicConstants.ts — += MIN_ELBOW_UP_JOINT_LIMIT_RAD=−(π−0.05), ELBOW_FLOOR_CLEARANCE_METERS=0.02, ELBOW_FLIP_HYSTERESIS_METERS=0.04.
- src/services/kinematic/polarSolvers.ts — PolarRicisConstraintSolver: выбор ветви в закрытой форме (q2Up=α+βDown, q3='±'; текущая ветвь по знаку текущего q3, flip с гистерезисом); ClassicDlsGhostSolver: clamp q3 симметричный (MIN_ELBOW_UP); KinematicDualDebuggerEngine: applyElbowFloorGuard ТОЛЬКО неполярным RICIS + призраку (пересчёт EE/det: det∝sin q3 — знак флипает, |det| сохраняется).
- src/services/kinematic/kinematicSolvers.ts — НЕ ИЗМЕНЁН (benchmark-калибровка: DlsSolver3D clamp односторонний; RicisSymbolicJacobianSolver3D вообще без clamp q3 — зеркало принимает сам).
- src/services/kinematic/ballPhysics.ts — tangential impact damping 0.85→0.6 (иначе слабые выстрелы уезжали метрами; вертикаль/реституция без изменений, box-сбросы не затронуты).
- src/ui/components/kinematic/RobotArm3DCanvas.tsx — комната (roomSurfaces, roomEdges, grid 4.8), эффект пушек по `showCannons` (пьедестал+станина+ствол quaternion+дуло/glow/бак, dispose), 2D scale на комнату + контур стен + линия потолка.
- src/ui/KinematicEnginePage.tsx — TENNIS_CANNON_SHOT_PLAN, кнопка «Теннисная пушка», showCannons по mode.
- Тесты: catchBallController.test.ts (closed-loop: 6/6, midAir≥2, floor≥1, локоть≥−1e-9, комната, minBallZ≥0, разброс reboundVz>0.25 м/с, покой в коробке); pickAndPlaceSimulation.test.ts (+инвариант локтя обеих рук); elbowFloorGuard.test.ts (5 зеркальных юнитов, вкл. полярную сходимость к низкой цели: локоть≥0.02, q3<0); KinematicEnginePage.test.tsx (кнопка «Теннисная пушка»).

# Actions Taken
_Terse ordered log of executed actions: tool, target, and one-line outcome. These actions already ran and their effects persist. Keep enough identity that no action is repeated by mistake._

- Разведка: catch controller/canvas/polar solver/symbolic+движок/benchmark прочитаны; q3 всегда +acos → локоть < 0 на низких целях (измерено: −0.18 при r=1.2,z=0.06).
- kinematicConstants + kinematicMath (guard) + polarSolvers (branch policy + engine guard + ghost clamp) — первая итерация: engine guard ДЛЯ ВСЕХ → POLAR closed-loop ЗАВИС (lerp-таргет elbow-down vs зеркало движка = пинг-понг) + benchmark scenario 2 упал (симметричный clamp DLS УЛУЧШИЛ его 0.32° vs symbolic 4.76° → нарушен calibrated ordering).
- Исправление: branch policy ТОЛЬКО внутри полярного closed-form; engine guard только итеративным; kinematicSolvers.ts полностью откачен (import cls cls cls); результат 82/82 → позже 102/102.
- Тюнинг залпов /tmp/tune*.ts: первые планы улетали за reach→2.7 м; правка tangential 0.8→0.6 + низкое дуло B + аимы в зону → 6 залпов rest reach 0.47–1.01, apex spread 0.21–0.41.
- Canvas: комната+рёбра+grid 4.8 (roomBoxGeo dispose), cannons effect, 2D rescale+стены+потолок; Page: план/кнопка/showCannons.
- SYMBOLIC closed-loop: локоть −0.215 в CARRYING (зонд /tmp/probe.ts: q3≈−3.1 складка у полюса, зеркало зеркало−0.318 — noflip корректен) → fix: CLIMB z→0.95 перед переносом в catch stepCarrying (у PnP уже есть LIFTING z=0.85) → локоть ≥0.
- elbowFloorGuard.test.ts: мой «вырожденный» конфиг был невалиден (radial 0.081 → guard верно флипнул) → настоящий полюс q2=−π/2,q3=π.
- Git: песочница сбросила локальную историю на 129081a! → fetch + reset FETCH_HEAD (remote f79dfce) — дерево сохранено.
- Allowlist OIR03: block зарегистрирован; два фолаута: (1) `--untracked-files=all` → полный путь файла, не директория; (2) пробел в имени → git-кавычки в записи. vitest run: 2263/2263.
- Gates: tsc 0 ✓, tps:gate ✓, build ✓; commit 591ecb9 + push ✓; allowlist += ' M ' форма пути памяти ✓; память — ЭТОТ файл.

# External Sources
_Web pages fetched: URL plus the takeaway that influenced the work. Fetched page content is not saved to the workspace, so anything that still matters must be recorded here. Older sources may be removed once their relevant conclusions have been preserved elsewhere in the session memory._

(пусто)

# Errors & Dead Ends
_What failed and why. Approaches that were tried and abandoned and should not be retried._

- **Engine-level зеркальный гард для полярного closed-form солвера = пинг-понг ветвей** (солвер lerp-тянет к своему elbow-down таргету, гард зеркалит каждый шаг → отсутствие сходимости, closed-loop зависает 240с). Правильно: выбор ветви ВНУТРИ closed-form, гард только итеративным.
- **Симметричный clamp q3 в DlsSolver3D (benchmark-класс)** — эталонный benchmark scenario 2 калиброван на одностороннем clamp (0.01); симметрия улучшает DLS 15× → ломает упорядочивание symbolic>DLS. НЕ трогать benchmark-классы.
- Зеркало q3=±π у полюса-складки: обе ветви под полом — guard корректно молчит; лечится ТРАЕКТОРИЕЙ (подъём перед переносом), не зеркалом.
- `git status --short` ≠ `--porcelain --untracked-files=all`: директория vs развёрнутые файлы + кавычки у путей с пробелами. Всегда реплицировать точные строки теста.
- /tmp скрипты: относительный импорт из /tmp не резолвится — абсолютный путь с `.js` суффиксом для tsx.
- ESLint отсутствует (lint=tsc). `sed -n 'A-Bp'` — ошибка; только 'A,Bp'. npx vitest до npm ci бесполезен.

# Key Results
_Exact results that must remain available to the continuation model: answers, tables, short code, decisions, or paths to generated files. Include short deliverables verbatim and reference longer artifacts by workspace path._

- Baselines: 0.4.213=2244 → 0.4.214=2258 → **0.4.215=2263/2263** (+5: 2 переписанных catch (теперь со стражами пушек) + 5 elbowFloorGuard; catch-файл был 2→2, pnp-sim assertions расширены без новых тестов).
- Closed-loop пушек (оба солвера, 60 FPS): delivered 6/6, symbolic split **midAir=3, floor=3** (polar тоже оба исхода ≥2/≥1), локоть min ≥ −1e-9, шар в комнате всегда, minBallZ ≥ 0, разброс rebound vz > 0.25 м/с, покой в коробке < 0.15.
- Зеркальное тождество 2R: при flip |ΔEE| < 1e-12; polar сходимость к (1.15,0.35,0.08): локоть ≥ 0.02, q3 < 0 (elbow-up «pick from above»).
- Залпы (проверено тюнингом): A 1.45/9° flat v0z 0.227; B 2.05/33° v0z 1.117; A 1.9/34° v0z 1.063; B 1.55/20° v0z 0.530; A 1.7/30° v0z 0.850; B 1.8/26° v0z 0.789; rest reach 0.47–1.01 м; apex: A-кластер 0.37–0.41, B-кластер 0.21–0.24.
- Клей: page mode 'CATCH_FALLING_BALL', catchControllerRef(TENNIS_CANNON_SHOT_PLAN, BOX_CONTAINER, LINK_LENGTHS); canvas props showCannons; комната константы экспортируются из catchBallController.
- Коммиты: b9714be (0.4.213) → f79dfce (0.4.214) → **591ecb9 (0.4.215)**.
