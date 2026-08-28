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
