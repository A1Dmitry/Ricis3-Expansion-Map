# QA-отчёт модуля Calculator / Monolith Guided Case — 2026-08-28

Проверены `calculatorExplorer`, `calculatorGraphDescriptor`, `ricisSolutionCatalog` и `monolithGuidedCaseTrail` на `main` commit `a3b9f07`.

| Контроль | Результат |
|---|---:|
| Test files | 9 |
| Tests | 130/130 passed |
| Calculator descriptor relations | passed |
| Calculator topology/boundary | passed |
| Solution catalog | passed |
| Guided Case domain/topology | passed |
| Node-ID callback contract | passed |

Изолированный UI-контракт Guided Case передаёт `entry.nodeId` и `relation.to.entry.nodeId`. Однако live-проверка заблокирована hydration-дефектом `identity_collision`, описанным в `QA_GUIDED_CASE_LIVE_BLOCKER_2026-08-28.md` и Issue #25.

## Live-проверка второго цикла после `10b0919`

Свежий live deployment загрузился без hydration error: `NODES 278`, `AVAILABLE 4`, `LOCKED 115`, `RESOLVED 159`.

Кнопка `МАРШРУТ ИЗУЧЕНИЯ МОНОМОЛИТОВ` открыла Guided Case и показала 14 source-bound entries с кнопками открытия и outgoing relations.

Переходы проверены в browser:

| Действие | URL после клика | Результат |
|---|---|---|
| `Открыть узел` для CDCC | `?node=registry-115` | карточка/фокус изменились |
| `Следовать к Существенная комплексная сингулярность` | `?node=calculator-node-complex-analysis` | переход выполнен по node ID |

В URL не использовались titles или текстовые значения. Live Guided Case в новом snapshot доступен; предыдущий `identity_collision` в текущем browser-сеансе исчез после обновления состояния/новой версии.
