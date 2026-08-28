# QA-отчёт модуля Agent Gateway — 2026-08-28

Проверены `agentGateway`, `agentRicis`, `mapNodeExplainer`, `localRicisAnalyzer` и `localRicisReducer` на `main` commit `a3b9f07`.

| Контроль | Результат |
|---|---:|
| Test files | 18 |
| Tests | 250/250 passed |
| Bounded worker pool | passed |
| Disabled-by-default provider catalog | passed |
| Agent authority/provenance boundary | passed |
| A6/A7 reducer ordering | passed |
| Gemini adapter contract | passed |

Дефектов выполнения в этом модульном слое не обнаружено. Внешний provider остаётся ограниченным и не получает authority над proof, trust или state.

## Live flood-fill cycle 15: AI Agent & Services

На опубликованной версии `v0.4.69` открыт раздел SETTINGS для canonical node `a3949213aba674d8844812a2eba08a1f`. DOM-проверка переключателя `AI Agent & Services` показала обратимый переход `On → Off → On` с ожиданием обновления React state. После восстановления статус снова `On`; URL сохранил только canonical `node` ID, а граф, node status и proof state не изменились.

В static deployment агент не запускается самопроизвольно: UI показывает журнал загрузки графа и bounded status, а управление Ricis.Core остаётся явно отмеченным как `Server-only`. Это соответствует границе полномочий: Pages UI не выдаёт математический результат без доступного Core/runtime.
