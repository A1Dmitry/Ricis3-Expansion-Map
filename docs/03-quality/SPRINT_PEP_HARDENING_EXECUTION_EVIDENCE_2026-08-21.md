# PEP-01 — Execution Evidence: proof trust hardening

**Дата:** 21 августа 2026 года (UTC)
**Статус:** завершены и опубликованы три связанных инкремента; каждый independently validated GitHub Actions run завершился `success`.

> **Правило измерения.** Ниже приведено только воспроизводимое окно от первого до последнего опубликованного commit в данном подцикле. Оно не подменяет полный двухчасовой sprint и не является оценкой общего объёма PEP-01.

## 1. Измерение времени и сложности

Воспроизводимое окно коммитов составило **1 623 секунды (27,05 минуты)**: от `9aab274` в `16:23:12Z` до `8a26fb6` в `16:50:15Z`. Окно независимого CI составило **1 598 секунд (26,63 минуты)**; суммарное время трёх отдельных GitHub Actions run составило **211 секунд (3,51 минуты)**. Эти значения получены из commit и run timestamp, а не из ручной оценки.

| Инкремент | Оценка сложности | Изменено файлов | Главная инженерная неопределённость | Commit | CI |
|---|---:|---:|---|---|---|
| Локальный proof output | Средняя | 2 | Не допустить, чтобы local audit или static Lean диагностик стал proof authority. | [`9aab274`](https://github.com/A1Dmitry/Ricis3-Expansion-Map/commit/9aab27472164747ce6ccc617d53ded72f60ca2c5) | [32502802180](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/32502802180) — `success` |
| Store и hydration trust policy | Высокая | 4 | Найти и удалить hidden live-store и persisted paths, где valid text либо `TRUSTED_AXIOM` сохраняли `resolved`. | [`fdf7f5d`](https://github.com/A1Dmitry/Ricis3-Expansion-Map/commit/fdf7f5d0fa7f81de39f2dfd0a62f372332f744e2) | [32503713454](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/32503713454) — `success` |
| Authoritative Proof Console | Высокая | 3 | Убрать все production legacy proof calls, показать immutable Core snapshot и не потерять typed recovery. | [`8a26fb6`](https://github.com/A1Dmitry/Ricis3-Expansion-Map/commit/8a26fb6a1a1ac6877ec530e36f618bb0fd80c52e) | [32505006363](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/32505006363) — `success` |

## 2. Реализованный trust boundary

Первый инкремент перевёл `logic.ts` в diagnostic-only режим для локального текста. Новый либо локально изменённый proof остаётся `partial`; legacy proof engine больше не вызывается из этого production path. Regression проверяет именно запрет на прежний fallback marker и на local transition к `resolved`.

Второй инкремент устранил три состояния ложного разрешения. `updateProof` больше не повышает узел по `auditProofContent`, статической Lean-проверке либо наличию локального текста. `TRUSTED_AXIOM` сохраняет immutable external contract и kernel metadata, но остаётся `partial`. `sanitizeMap` больше не восстанавливает `resolved` из local proof validity или `TRUSTED_AXIOM`: это разрешено только при явном `LEAN_VERIFIED` status.

Третий инкремент заменил production Proof Console. Консоль посылает один bounded `IRicisProofGateway.createRun` request с `claim`, `expected` и allowlisted `Academic`, `Latex`, `Log` formats. Она показывает immutable snapshot identifiers, Core version, structural status, trust status, evidence-boundary resource key, document descriptors и ordered trace. Failure отображается только как safe resource key и передаётся в санкционированный recovery flow. UI больше не вызывает `generateFormalProof`, `verifyProofChain` или `proveSystem`.

| Инвариант | Regression evidence | Результат |
|---|---|---|
| Только `LEAN_VERIFIED` может сохранить `resolved` | `persistence.test.ts`: local valid proof и `TRUSTED_AXIOM` demote to `partial`; `LEAN_VERIFIED` сохраняет `resolved`. | PASS |
| Local/static proof не решает node | `mapStore.test.ts`: audit-valid local proof остаётся `partial`. | PASS |
| Trusted external contract не решает node | `mapStore.test.ts`: accepted `TRUSTED_AXIOM` остаётся `partial`. | PASS |
| Proof Console не использует legacy proof calls | `RicisProofConsoleModal.test.tsx`: static scan плюс success/failure injected-gateway cases. | PASS |
| Console recovery не раскрывает raw error | `RicisProofConsoleModal.test.tsx`: отображается safe resource key. | PASS |

## 3. Quality gates

Локальный quality gate последнего инкремента завершился с **42 test files / 318 tests PASS**, `npm run lint` PASS, production `npm run build` PASS и `npm audit --audit-level=moderate` с результатом **0 vulnerabilities**. Build сообщил только существующее предупреждение Vite о chunk size после minification; это предупреждение не изменяет результат build и не является security finding.

GitHub Actions повторил release-alignment, TypeScript verification, full test suite, static build и deployment. Все три run выше успешно завершились. Рабочее дерево было clean после каждого опубликованного increment.

## 4. Границы и следующий приоритет

Работа не создаёт новую Lean theorem и не заявляет `LEAN_VERIFIED` из TypeScript, UI, local static checking, документа validity либо external agent result. Generic Core scenario продолжает возвращать `REQUIRES_CORE_LEAN`, пока отдельная воспроизводимая kernel-evidence service не создаст соответствующий authoritative artifact.

Следующий технический priority после этого evidence — систематическая externalization remaining legacy hardcoded user-facing Proof Console strings в существующий i18n dictionary, с direct locale regression. Auth durable persistence Step 2 architecture остаётся отдельным gate и не должна реализовываться без отдельного approved architecture decision.

## References

[1]: [PEP-01 Step 1 business specification](../02-sprints/SPRINT_PEP_STEP1_BUSINESS_SPEC.md).
[2]: [PEP-01 Step 2 architecture](../01-architecture/SPRINT_PEP_STEP2_ARCHITECTURE.md).
[3]: [PEP-01 Step 3 QA specification](SPRINT_PEP_STEP3_QA_SPEC.md).
[4]: [Expansion Map GitHub Actions workflow runs](https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions).
