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

## Live-проверка Calculator Explorer во втором цикле

После открытия `РЕШЕННЫЕ СЛУЧАИ КАЛЬКУЛЯТОРА` каталог раскрылся и показал 14 кнопок узлов. Каждая кнопка имеет aria-label `Открыть <title>` и отображает semantic index. Каталог обозначен как source-bound: выбор открывает существующий узел карты и не запускает расчёт.

Визуально каталог доступен; отдельный внешний calculator launch control внутри этого списка не отображается, что соответствует текущему read-only contract.

## Live flood-fill cycle 17: provenance boundary после deployment `8b91630`

Свежий опубликованный deployment `v0.4.69` принимает URL с canonical SHA-128 `node=a3949213aba674d8844812a2eba08a1f` и загружает именно соответствующую карточку без текстового lookup. В карточке сохраняется разделение evidence: `FORMAL LEAN 4 VERIFICATION` явно сообщает `Requires Core / Lean evidence`, при этом `Ошибок верификации не найдено` не подменяется положительным Lean proof. На странице нет созданного математического результата или изменения статуса из-за отсутствия Core.

Live-клик по `Explore`/`Verify` в текущем snapshot не изменил URL и не создал новый результат; это наблюдение требует отдельной проверки event handling, но не нарушает ID-навигацию и proof boundary.

## Уточнение cycle 18: event handling action tabs

После проверки через точный DOM-текст подтверждено, что кнопка `Verify` функциональна: клик обновляет локальное evidence-содержимое карточки (`EVIDENCE`, `PROOF`, русское описание доверия), при этом URL сохраняет canonical `node=a3949213aba674d8844812a2eba08a1f` и не запускается calculator/Core. Предыдущее наблюдение о «неизменившемся snapshot» объясняется проверкой до обновления нужного DOM-состояния; дефект event handling не подтверждён.

## Live flood-fill cycle 18: Roadmap ID navigation

Roadmap, открытый из выбранного узла, явно показал исходный canonical ID `a3949213aba674d8844812a2eba08a1f`. Кнопка `Открыть карту` вернула приложение по URL `?node=a3949213aba674d8844812a2eba08a1f&mode=explore`. Таким образом, фактический переход использует SHA-128 node ID; встречающиеся в пояснительном тексте legacy-примеры (`core-agi-target`) не участвуют в navigation contract.
