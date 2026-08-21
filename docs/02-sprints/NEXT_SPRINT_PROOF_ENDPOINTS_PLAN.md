# Следующий спринт: C# Core-backed Proof Endpoints и устранение QA-backlog

## Цель

Перевести proof APIs приложения с legacy TypeScript fallback на authoritative Ricis.Core, не выдавая синтетический или непроверенный результат за математическое доказательство. Одновременно закрыть критический backlog, найденный восьмичасовым QA-спринтом, и сохранить воспроизводимый Lean/LaTeX/JSON evidence chain.

## Текущее состояние

Последний QA gate зафиксирован commit `eca1500`. Expansion Map проходит 33/33 test files и 184/184 tests, три stress-прогона, TypeScript lint и production build. Ricis.Core проходит 353/353 regression tests и 6/6 mandatory Lean artifacts. Production tree содержит 31/31 достижимый узел.

При этом 21 seeded proof record не проходит текущую policy-проверку содержимого, а один source node был отмечен `resolved` без proof. Runtime sanitation уже переводит такие состояния в `partial`. Это корректное защитное поведение, но не устранение самих proof records.

## Целевой trust contract

> `resolved` означает наличие proof record, прошедшего authoritative verification. `partial` означает наличие результата или неполного доказательного материала без достаточного kernel-backed evidence. `unresolved` означает отсутствие принятого результата. Legacy fallback никогда не может установить `resolved` и не может быть источником `RicisFormalProof`.

Каждый authoritative proof response должен содержать request correlation ID, canonical claim, normalized expression, ordered typed trace, conclusion invariant, proof status, execution engine, Core version, verification status, Lean evidence metadata, limitations и machine-readable diagnostics. HTTP success без этих полей считается invalid response.

## Архитектурный вариант

| Вариант | Содержание | Преимущества | Недостатки | Решение |
|---|---|---|---|---|
| A. Расширить существующий C# WebAPI | Добавить proof endpoints в Ricis.WebApi рядом с simplify/derivative/system и использовать существующий Ricis.Core pipeline | Минимум инфраструктуры, единая версия Core, проще trace и deployment | Нужно аккуратно расширить DTO и endpoint tests | **Рекомендуется** |
| B. Отдельный proof service | Вынести proof orchestration в отдельный процесс/API | Независимое масштабирование и отдельный release cycle | Дублирование DTO, versioning, health checks и deployment; усложнение trust boundary | Не использовать в этом спринте |

## Workstreams и порядок

### WS-1. API contract и Core orchestration — 3–4 часа

Зафиксировать versioned DTO: `ProofRequest`, `ProofResponse`, `ProofStepDto`, `ProofVerificationDto`, `ProofDocumentDto`, `ProofErrorResponse`. Реализовать endpoint для canonical proof run, endpoint для proof-chain verification и endpoint для document export с format enum `json`, `latex`, `lean`.

Результат Core должен формироваться одним run: expression parse, normalization, logical/algebraic reduction, proof trace, verification, document rendering. Renderer не имеет права самостоятельно пересчитывать выражение.

Минимальные endpoints:

| Endpoint | Назначение |
|---|---|
| `GET /health` | Проверка доступности и версии Core |
| `POST /api/proofs/generate` | Canonical proof run с typed trace |
| `POST /api/proofs/verify` | Проверка присланного proof contract и trace |
| `POST /api/proofs/export` | Экспорт уже проверенного результата в JSON/LaTeX/Lean |

### WS-2. Bridge migration и controlled-unavailable behavior — 2–3 часа

Изменить `RicisWasmBridge` так, чтобы `generateFormalProof`, `verifyProofChain`, `proveSystem` и `verifyIdentity` обращались к C# endpoints. При отсутствии Core, неверном HTTPS endpoint, timeout, malformed response или отсутствии kernel evidence bridge возвращает typed infrastructure failure либо controlled-unavailable result.

`RicisFallbackEngine` остаётся только изолированным legacy compatibility code для тестов и offline diagnostics. Он не должен вызываться из production proof path и не должен изменять `resolved` state.

UI proof console должен показывать: статус Core, request ID, причину отказа, точный endpoint/configuration problem, пошаговое решение и кнопку повторной проверки. Исключение не должно теряться в `finally` без сообщения пользователю.

### WS-3. Proof backlog repair — 4–8 часов на первую партию

Разделить 21 seeded record на две категории. Records, которые являются только explanatory RICIS traces, перевести в `partial` и снабдить явным limitation. Records, которые заявляются как formal proof, перепроизвести через C# Core и добавить обязательные Lean artifact/evidence metadata.

Первая acceptance-партия должна включать A6 geometric bridge, identity conservation, singularity separation, infinity arithmetic и один отрицательный proof case. Нельзя массово добавлять DOI или `TRUSTED_AXIOM` без реально скомпилированного Lean evidence.

### WS-4. Тесты и coverage — 3–4 часа

Добавить endpoint contract tests для success, parse error, Core unavailable, timeout, malformed response, unsupported format и proof-status mismatch. Добавить bridge tests с assertion, что fallback не вызывается. Добавить persistence tests для `resolved`/`partial` transitions, seeded-data audit tests и mutation tests для каждого proof DTO.

Покрытие измерять отдельно по Ricis.Core, WebAPI и frontend bridge. Целевой минимум спринта: backend proof endpoint branches не менее 90%, bridge trust-boundary branches не менее 90%, общий frontend coverage поднять с 42.58% до 55% или выше. Если общий порог не достигнут из-за UI/WebGL зон, это должно быть явно разделено на backend/bridge/UI показатели.

### WS-5. Документация и release hardening — 1–2 часа

Обновить API contract, proof trust policy, recovery instructions, Lean artifact manifest, deployment configuration и backlog. Отдельно зафиксировать две non-blocking задачи: ineffective dynamic import `apiClient.ts` и основной JS chunk свыше 500 kB.

## Parallel processing input list

Параллельно можно выполнять только независимые работы после фиксации DTO contract:

1. endpoint contract tests;
2. bridge error/anti-fallback tests;
3. seeded proof inventory и classification;
4. document renderer tests для JSON/LaTeX/Lean;
5. coverage instrumentation и report generation;
6. UI recovery-state tests.

Нельзя выполнять параллельно изменения одного DTO contract, Core orchestration и bridge migration: эти работы должны идти последовательно через одну canonical schema.

## Итоговая оценка

| Пакет | Оценка |
|---|---:|
| Contract и DTO design | 1 час |
| C# endpoints и orchestration | 3–4 часа |
| Bridge migration | 2–3 часа |
| Tests и coverage | 3–4 часа |
| Первая proof repair batch | 4–8 часов |
| Документация, quality gate и commit | 1–2 часа |
| Полный MVP endpoint sprint | **10–14 часов** |
| MVP + первая formal proof batch | **14–22 часа** |

Поэтому следующий спринт лучше объявить как **12-часовой endpoint MVP sprint**, а repair всех 21 seeded proof records вести отдельным продолжением. За один 8-часовой пакет можно сделать contract, основные C# endpoints, bridge migration и тестовый каркас, но нельзя честно обещать полноценную формальную реконструкцию всех 21 доказательства.

## Acceptance criteria

Спринт считается принятым, если C# endpoints работают на canonical Ricis.Core run; frontend bridge не вызывает fallback на production proof path; malformed или unverified proof никогда не переводит node в `resolved`; JSON/LaTeX/Lean exports строятся из одного verified trace; Lean artifacts компилируются и входят в manifest; endpoint, bridge, persistence и mutation tests зелёные; три последовательных full-suite прогона стабильны; coverage report опубликован; recovery UI показывает точную причину Core failure; все оставшиеся seeded records классифицированы как `partial`, `formal`, `invalid` или `needs-reconstruction`.

## Предлагаемый backlog после MVP

| ID | Приоритет | Задача |
|---|---|---|
| P-01 | Blocker | C# authoritative proof generate endpoint |
| P-02 | Blocker | C# proof verification endpoint и DTO validation |
| P-03 | Blocker | Запрет fallback в production proof bridge |
| P-04 | High | Proof export endpoint из verified trace |
| P-05 | High | Первая formal proof batch из пяти representative cases |
| P-06 | High | Classification и sanitation всех 21 seeded records |
| P-07 | Medium | Устранение ineffective dynamic import |
| P-08 | Medium | Code splitting для chunk >500 kB |
| P-09 | Medium | UI proof console recovery and diagnostics |
| P-10 | Later | Полное повышение общего frontend coverage выше 70% |
