# Telegram/token-pool remediation

**Версия:** 0.4.26
**Дата:** 2026-08-18
**Основание:** `telegram-tokenpool-bug-graph-2026-08-18.md`

## Релиз v0.4.26

Desktop UI patch добавляет Manus-подобные состояния right task panel: полноценную docked-панель и узкую rail-полосу с возвратом по стрелке. Изменение не затрагивает ingress Telegram, обработку секретов, server-side API-key policy или Core-first boundary.

## Релиз v0.4.18

Desktop UI patch переносит карточку выбранной задачи из overlay в правую пристыкованную grid-панель и объединяет её в единый accordion surface.

## Выполненные слои

| Bug-узел | Исправление | Статус |
|---|---|---|
| B-01: token в Git history | В текущем коде не найден hard-coded Telegram token; server читает token только из environment | Код исправлен; исторический token должен отозвать владелец |
| B-02…B-07: key-pool | Удалены active `src/domain/tokenPool` и `src/services/tokenPool`; UI, handler и server больше не принимают, не хранят и не маршрутизируют user API keys | Исправлено |
| Public `/addkey`/`/pool` | Команды отвечают отказом без воспроизведения введённого секрета | Исправлено |
| REST key endpoints | Legacy endpoints возвращают `410 SHARED_KEY_POOL_DISABLED` | Исправлено |
| REST solve | Больше не принимает `userProvidedKey`; результат имеет `REQUIRES_CORE_LEAN`, а не ложный статус решения | Исправлено |
| Dynamic evaluation | `new Function` заменён ограниченным parser-ом чисел, переменных и `+ - * / ()`; всё вне grammar остаётся структурным выражением для Core | Исправлено |
| Singleton DI | Telegram handler получает только `IRicisEngineService` через конструктор | Исправлено |
| Zustand in application service | `RicisBotService` зависит от `IRicisKnowledgeRepository`; Zustand изолирован в `ZustandRicisKnowledgeRepository` adapter | Исправлено |
| Cache write on read | Cache hit читает сохранённый proof и не вызывает `updateProof` | Исправлено |
| Random economics | Новые Telegram-задачи получают нулевые неоценённые economic values вместо случайной псевдооценки | Исправлено |
| False Lean status | `SingularitySolveResponse` требует `verificationStatus`; локальный путь маркируется `REQUIRES_CORE_LEAN` | Исправлено |
| Canonical proof generator | Убраны сгенерированные Lean-теоремы и текст, заявлявший доказательство `P = NP`; structural draft теперь имеет явный `REQUIRES_CORE_LEAN` или `HYPOTHESIS` | Исправлено |
| Transport status/logging | status сообщает `disabled/acknowledgement_only`; webhook требует `TELEGRAM_WEBHOOK_SECRET` и не логирует текст/ID | Исправлено |

## Проверяемые ограничения

Локальная симуляция Telegram не является live bot transport. Она используется только для проверки command flow. Live webhook не включает обработчик команд автоматически, потому что для production нужны отдельные gateway, persistent deduplication и защищённый delivery lifecycle.

KaTeX продолжает рендериться через KaTeX `renderToString`; этот путь не принимает HTML как самостоятельный контент. Он не относится к user API-key ingress.

## Неустранимый кодом внешний шаг

Token Telegram был раскрыт в historical commit и в присланном diff. Его нельзя сделать безопасным одной правкой исходного дерева: владелец бота должен отозвать этот token в BotFather и выпустить новый. Новый token нельзя помещать в Git, чат, issue, log или fallback literal; для runtime нужен только secret/environment variable `TELEGRAM_BOT_TOKEN`.

## Контроль

После remediation выполнены/запланированы: `npm run lint`, узкие Telegram/Core tests, полный `npm test`, `npm run build`, `git diff --check` и grep активного исходного дерева на `rawKey`, `contributeKey`, `userProvidedKey`, `TokenPoolManager`, `ITokenPoolService`, `new Function` и AI-key prefix.
