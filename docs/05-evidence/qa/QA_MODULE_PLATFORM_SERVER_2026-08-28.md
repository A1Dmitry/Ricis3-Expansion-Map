# QA-отчёт модуля Platform / Server — 2026-08-28

Проверены `adminCoreConnection`, `hostControl`, `serverPersistence`, `communityReadiness`, `communityRewards` и server adapters на `main` commit `a3b9f07`.

| Контроль | Результат |
|---|---:|
| Test files | 10 |
| Tests | 84/84 passed |
| Admin Core contracts | passed |
| Host control | passed |
| SQLite-first repository template | passed |
| Community readiness/rewards | passed |
| Unavailable HTTP adapters | passed |

Функциональных дефектов в изолированном platform/server слое не обнаружено. Проверка не является подтверждением доступности внешних production credentials или deployment secrets.

## Live-проверка Persistence & Export во втором цикле

После открытия `SAVE & EXPORT` панель раскрылась и показала четыре действия: `Сохранить в IndexedDB`, `Импорт решений (JSON)`, `Скачать .json`, `Сброс карты`. Разрушительный reset не выполнялся. Карта до открытия панели загружена корректно (`NODES 278`, `AVAILABLE 4`, `LOCKED 115`, `RESOLVED 159`).

После нажатия `Сохранить в IndexedDB` сохранение проверено чтением структуры client DB: `nodes=278`, `edges=305`, `zones=14`, `axioms=0`, `proofs=21`, `meta=3`. Ошибка сохранения не проявилась. `Импорт решений` и разрушительный `Сброс карты` в этом проходе не запускались.

## Live-проверка Audit controls

На свежем deployment карта загрузилась с `NODES 278`, `AVAILABLE 4`, `LOCKED 115`, `RESOLVED 159`. Кнопка `System Audit` отработала: журнал показал `RICIS Operation "System Audit" completed successfully`, а UI показал `OK: System Audit`. Количество узлов и состояние карты не изменились.

## Live-проверка диагностических controls во втором цикле

На свежей live-версии `System Audit` завершился сообщением `RICIS Operation "System Audit" completed successfully` и UI `OK: System Audit`. Затем `Empty Targets` завершился сообщением `RICIS Operation "Search Empty Targets" completed successfully` и UI `OK: Search Empty Targets`. Счётчики карты не изменились; destructive controls не запускались.

## Live-проверка SETTINGS и sidebar toggles

Панель `SETTINGS` открывается при сохранённом canonical node ID и показывает physics parameters, `Save`, `Сброс`, profile controls, sidebar toggles и честное server-only предупреждение для RICIS Core.

В текущем live-сеансе после тестового клика один sidebar toggle изменился на `Scientific fields Off`, при этом `Quick actions`, `Available to solve`, `AI Agent & Services` и `Persistence & Export` остались `On`. Граф и выбранный node ID не изменились. Обратное включение проверяется отдельным действием.

## Результат toggle и localization проверки

После обратного клика `Scientific fields` восстановлен в состояние `On`; основные sidebar controls снова отображаются, выбранный `node=a3949213aba674d8844812a2eba08a1f` не изменился. Это подтверждает рабочее переключение sidebar visibility без изменения graph state.

В SETTINGS одновременно отображаются английские заголовки (`UI SETTINGS`, `Save`, `Core Administration`, `Sidebar panels`) и русские подписи physics/profile (`Настройки точной физики`, `Общий профиль`, `Аналитик`). Это дополнительное live-свидетельство общей localization inconsistency, связанное с Issue #17.
