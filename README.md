# RICIS3-Expansion-Map

**Версия: v0.4.16**

RICIS3-Expansion-Map — открытая интерактивная карта задач, выражений и зависимостей RICIS-III. Она объединяет исследовательский каталог, визуальную навигацию по графу, локальные RICIS-вычисления, интеграцию с Ricis.Core и явные уровни доверия к proof-артефактам. Цель проекта — сделать путь от задачи и выражения до проверяемого артефакта обозримым, а не заменить проверку сильными визуальными заявлениями.

## Демо

Откройте актуальную сборку на [GitHub Pages](https://a1dmitry.github.io/Ricis3-Expansion-Map/). Если 3D/WebGL недоступен, приложение переключается на семантический **режим списка**; в работающей 3D-карте тот же режим можно включить кнопкой **«Режим списка»** в шапке.

## Для кого проект

| Аудитория | Первый полезный сценарий | Что получает пользователь |
|---|---|---|
| Исследователь RICIS-III | Найти узел, изучить функцию и зависимые задачи | Структуру проблем, цепочки зависимостей, RICIS trace и экспорт артефактов. |
| Рецензент или формализатор Lean | Открыть proof и раздел formal verification | Разделение структурного черновика, внешнего Lean source, kernel evidence и trusted contract. |
| Студент или преподаватель | Переключиться в режим списка и выбрать задачу | Доступный список узлов без зависимости от WebGL, описание и связь с научными зонами. |
| Разработчик Ricis.Core / TypeScript | Запустить локальный стек и выполнить тесты | Воспроизводимый npm-контур, lazy relative-path интеграцию с Core и проверяемый CI. |

## Три первых действия

1. На карте выберите задачу или используйте поиск в левой панели.
2. Откройте **«Формальная верификация»** в карточке узла и прочитайте именно уровень trust evidence.
3. Используйте **RICIS Proof & Singularity Console** для локальной структурной цепочки; её результат можно передать на карту только как черновик, пока не приложено внешнее Core/Lean evidence.

## Граница доверия доказательств

> **Состояние узла карты не равно Lean kernel verification.** Ни интерфейс, ни локальный TypeScript-проверяющий слой не повышают статус текста до `LEAN_VERIFIED`.

| Видимый статус | Что он означает | Что не следует из статуса |
|---|---|---|
| `Lean kernel verified` | Сохранены воспроизводимые toolchain, команда, compiler output и axiom report для внешнего Lean source. | Не является утверждением о других узлах или более широкой гипотезе. |
| `Trusted external axiom` | Неизменяемый внешний source принят как явно маркированный trusted contract. | Не означает, что приложение само синтезировало теорему без аксиом. |
| `Requires Core / Lean evidence` | Сохранён структурный RICIS-результат или исходник, но kernel evidence отсутствует. | Не является формальной Lean-проверкой. |
| `Resolved workflow state` | Узел завершён в рабочем процессе карты. | Сам по себе не является доказательством theorem в Lean. |

Внешний Lean source сохраняется неизменяемо: его hash, provenance и evidence должны быть видимыми. Подробнее — в [`AGENTS.md`](AGENTS.md) и [`artifacts/proofs/lean-boundary-audit-2026-08-18.md`](artifacts/proofs/lean-boundary-audit-2026-08-18.md).

## Возможности

Проект предоставляет 3D-карту и 2D fallback каталога, поиск и фильтры, локальное сохранение в IndexedDB, визуализацию научных зон, историю преобразований, экспорт TeX/JSON, карточки зависимостей, редактор proof и безопасную симуляцию Telegram-интерфейса. Live Telegram transport намеренно отключён до отдельной production-интеграции. Серверные API для AI используют только server-side `GEMINI_API_KEY`; приложение не принимает, не хранит и не разделяет пользовательские API-ключи.

## Требования и локальный запуск

Требуются Node.js `22.22.2` или новее в ветке 22 и npm `12.0.2` или новее. `package.json` — единственный источник текущей версии; `package-lock.json`, `src/version.ts`, README и актуальные release-артефакты синхронизируются release-check. Проект использует только npm lockfile. Нельзя обходить конфликты через `--force` или `--legacy-peer-deps`.

```bash
npm ci
npm run dev
```

Полный локальный quality gate:

```bash
npm audit --audit-level=moderate
npm run release:check
npm run lint
npm test
npm run build
```

`npm run build` формирует Vite production bundle и серверный bundle в `dist/`. После обновления исходного каталога можно выполнить **«Сброс карты»** в интерфейсе, чтобы загрузить актуальные начальные узлы.

## Интеграция с Ricis.Core

Expansion не запускает C# runtime при старте Express. При первом реальном обращении к Ricis.Core `RicisWasmBridge` запрашивает относительный маршрут `/api/ricis-core/health`. Supervisor сначала использует Release-зеркало `runtime/ricis-core/Ricis.WebApi.dll`, а при его отсутствии — соседний проект `../Ricis.Core/Ricis.WebApi/Ricis.WebApi.csproj` через `dotnet run`. После health-check клиент обращается к `/api/ricis-core/expressions/{simplify|derivative|system}`.

Расчёт сингулярностей работает в **строгом Core-first режиме**: успешный результат может иметь происхождение только `csharp_api` или `csharp_wasm`. Если Core недоступен, отклонил lambda-ввод, вернул инфраструктурную ошибку или неполный payload, TypeScript fallback не вычисляет заменяющий инвариант. Пользователь направляется на `?view=core-recovery` с пошаговым объяснением восстановления. На статическом GitHub Pages без browser-WASM или развёрнутого C# API математический результат честно остаётся недоступным.

Для production Pages можно явно задать при сборке `VITE_RICIS_CORE_API_BASE_URL=https://core.example.org/api/ricis-core`. Resolver принимает только абсолютный HTTPS URL без credentials, query и fragment; пустое значение сохраняет текущий same-origin proxy `/api/ricis-core`. И вычисление, и recovery health-check используют один endpoint. Удалённый C# API обязан предоставить `GET /health` и `POST /expressions/simplify`, а также разрешить CORS с `https://a1dmitry.github.io`. Настройка не является секретом и не заменяет развёртывание самого C# runtime. Дополнительные server-side настройки локального supervisor: `RICIS_CORE_RUNTIME`, `RICIS_CORE_REPO`, `RICIS_CORE_PROJECT`, `RICIS_CORE_PORT`, `RICIS_CORE_URL` и `RICIS_CORE_START_TIMEOUT_MS`.

## Нормативные ограничения RICIS-III

Обработка сингулярностей следует последовательности `L0 → L1 → SP2 → локальная O(1)-редукция → A1/A4 → SP3 → SP4 → A5/A6/A7`. `F` сохраняется как структурное дерево или отложенное выражение, а установленная `L1_IDENTITY` не раскрывается повторно без нового основания. Классический предел не может молча подменять RICIS-преобразование. Пользовательский результат не должен становиться `NaN`: диагностика передаётся типизированным статусом или структурным значением RICIS.

## Цитирование, лицензия и участие

Код распространяется по [MIT License](LICENSE). Для ссылки на конкретную версию используйте metadata из [`CITATION.cff`](CITATION.cff) и GitHub release после его публикации. Пожалуйста, сообщайте о воспроизводимых дефектах через [GitHub Issues](https://github.com/A1Dmitry/Ricis3-Expansion-Map/issues); issue с theorem claim должен содержать исходное выражение, версию приложения, ожидаемый статус доверия и, если применимо, Lean source plus kernel evidence.

## Репозиторий

[https://github.com/A1Dmitry/Ricis3-Expansion-Map](https://github.com/A1Dmitry/Ricis3-Expansion-Map)
