# RICIS3-Expansion-Map

**Версия: v0.4.6**

Интерактивная 3D-карта проблем сингулярности и RICIS-III. Проект визуализирует граф задач, научные зоны, зависимости, доказательства и историю преобразований.

## Демо

[GitHub Pages](https://a1dmitry.github.io/RICIS3-Expansion/)

## Возможности

Проект содержит 3D-карту сингулярностей, каталог задач RICIS-III, сохранение узлов в IndexedDB, отображение Lean 4/LaTeX-доказательств, локальное редактирование доказательств, визуализацию научных зон и серверные API для генерации доказательств и работы агента.

## Требования

Требуется поддерживаемая LTS-версия Node.js 20 или новее. Нельзя устанавливать устаревшие версии зависимостей или обходить конфликты через `--force` и `--legacy-peer-deps`. Версии в `package.json` и `package-lock.json` должны оставаться синхронизированными.

## Локальный запуск

Для чистой установки используйте lock-файл:

```bash
npm ci
npm run dev
```

Для проверки проекта выполните:

```bash
npm audit --audit-level=moderate
npm run lint
npm test
npm run build
```

`npm run build` формирует production-сборку Vite и серверный bundle в каталоге `dist/`.

После обновления приложения с сервера в UI можно выполнить **Сброс карты**, чтобы загрузить актуальный каталог узлов из исходного кода.

## Интеграция с Ricis.Core

`Ricis3-Expansion-Map` не запускает C# runtime при старте Express. При первом реальном обращении к `Ricis.Core` `RicisWasmBridge` вызывает относительный маршрут `/api/ricis-core/health`. Supervisor сначала запускает готовое bundled-зеркало `runtime/ricis-core/Ricis.WebApi.dll` через `dotnet`, а если зеркало отсутствует — автоматически использует соседний `../Ricis.Core/Ricis.WebApi/Ricis.WebApi.csproj` через `dotnet run`. После готовности `/health` клиент использует `/api/ricis-core/expressions/{simplify|derivative|system}`; неподдержанные или недоступные выражения переходят в детерминированный `RicisFallbackEngine`.

В репозитории уже находится Release-зеркало `runtime/ricis-core` со связанными DLL, `.deps.json`, `.runtimeconfig.json` и конфигурацией. Для обновления зеркала достаточно заменить его содержимое новой Release-сборкой Ricis.Core/WebApi. Дополнительно доступны `RICIS_CORE_RUNTIME`, `RICIS_CORE_REPO`, `RICIS_CORE_PROJECT`, `RICIS_CORE_PORT`, `RICIS_CORE_URL` и `RICIS_CORE_START_TIMEOUT_MS`; все пути задаются относительно корня Expansion. На статическом GitHub Pages серверный supervisor недоступен, поэтому сохраняется локальный fallback.

## Архитектурные правила

Обработка сингулярностей должна следовать правилам RICIS-III и сохранять структурную идентичность `L1_IDENTITY`. Классические пределы не должны подменять RICIS-преобразования. Пользовательский результат не должен возвращаться как `NaN`: неразрешённое или диагностическое состояние должно передаваться явно типизированным статусом или структурным значением RICIS.

## Репозиторий

[https://github.com/A1Dmitry/Ricis3-Expansion-Map](https://github.com/A1Dmitry/Ricis3-Expansion-Map)
