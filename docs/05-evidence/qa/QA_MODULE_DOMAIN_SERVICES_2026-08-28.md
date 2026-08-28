# QA-отчёт доменного и сервисного модуля — 2026-08-28

Проверены `store`, `nodeEntry`, `industrialRicis`, `marketRicis`, `services/ricisCore` и `services/telegramBot` на `main` commit `a3b9f07`.

| Контроль | Результат |
|---|---:|
| Test files | 22 |
| Tests | 201/201 passed |
| Node entry/focus policy | passed |
| Graph relations and industrial contexts | passed |
| Market assurance lanes | passed |
| RICIS Core engine/orchestration | passed |
| Telegram command/service contracts | passed |
| Store and terminal state | passed |

Функциональных дефектов в изолированном доменном и сервисном слое не обнаружено. Live hydration collision относится к persistence/identity boundary и не считается закрытым этими unit/integration тестами.
