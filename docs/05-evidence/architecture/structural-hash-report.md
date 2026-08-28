# Structural Hash Refactoring Report

**Версия формата отчёта:** 0.1.0
**Релиз приложения:** 0.4.74
**Дата:** 2026-08-17
**Источник данных:** `src/**/*.ts` и `src/**/*.tsx` без test-файлов
**Машинный отчёт:** `structural-hash-report.json`

## Релиз v0.4.57: bounded Passport safety corrections

`LeanPassportSessionDialog` получает только local event-containment at its controlled dialog root, preventing a Passport interaction from reaching the enclosing edit-modal overlay. `leanPassportProjection` applies its already declared display-redaction policy to safe source disclosure; canonical source bytes, fingerprint and byteLength remain unchanged. No Core/Lean/proof/trust/state/persistence/provider/source authority path is added or altered.

## Релиз v0.4.56: B1 ephemeral Lean Passport source-reference boundary

Добавлены pure `leanPassportSession` projector и controlled read-only dialog, composed narrowly in existing `EditNodeModal` только после source lock. Они принимают лишь exact provenance metadata и дают local close action; не импортируют raw Lean/TeX source, proof payload, browser storage, network/popup/provider, Lean/Core execution, store write или proof/trust/workflow authority. Это UI/application boundary, а не Lean-kernel verification, human decision или source persistence.

## Релиз v0.4.35: A6 multi-evidence composition boundary

Добавлен isolated `a6Evidence` boundary: typed deferred-expression witness, RICIS geometric A6 representation, independent Agent/Core/Lean records, explicit unavailable/conflict DTO и pure merger. Contracts/application не импортируют Agent provider, Core singleton, Lean process, React, browser storage, network, secret или proof-state mutation; adapters остаются отдельными injected scopes.

## Релиз v0.4.34: Optional Admin Core unavailable HTTP boundary

Добавлены isolated `adminCoreRuntimeCapabilities` и `adminCoreUnavailableHttpAdapter`: узкий injected `inspect()` port и stable typed `503` namespace. Adapter не импортирует Core supervisor, network client, process environment/secret, browser state, registry, auth, database или active host routing; `server.ts` регистрирует его рядом с existing unavailable namespaces.

## Релиз v0.4.33: Roadmap and Admin Core composition boundaries

Добавлен чистый `rootTaskFilter` boundary, который нормализует persisted dependencyIds, parent declarations и visual edges в одно rootward-направление. UI Roadmap использует сервис как read-only adapter и не изменяет proof, Core или trust state.

## Релиз v0.4.33: Admin Core static-safe composition boundary

Добавлен isolated `adminCoreConnection` boundary: browser-safe feature/command/provenance DTO, typed static-unavailable facade и Settings projection. Contract module не импортирует React, Three.js, browser storage, HTTP/network, environment secret, database, crypto или Core singleton; реальная Auth/HostControl server composition остаётся отдельным injected adapter scope.

## Релиз v0.4.32: NodeEntry and readable-focus composition boundary

Добавлен isolated `nodeEntry` boundary: reviewed manifests, static entry rendering, canonical metadata, graph handoff и pure radius-aware focus policy. Он не импортирует Core, Lean, proof, CommunityRewards, React или Three.js в domain policy; `Map3D` остаётся execution adapter для полученного camera plan.

## Релиз v0.4.31: CommunityRewards composition boundary

Добавлен изолированный `CommunityRewardsApplication` с портами identity, unit-of-work, code issue/hash, risk, trusted automation, audit, feature entitlement и notification outbox. Domain/application слой не импортирует UI, React, Core, Lean, database SDK или vendor auth SDK; adapters остаются заменяемыми через DI.

## Релиз v0.4.29: Local Analyzer source-hash boundary

Добавлен versioned SHA-256/UTF-8 `SourceExpression` hash для локальной корреляции. Он не является proof hash, Lean evidence, invariant или основанием для map-state promotion; deterministic analyzer остаётся opt-in и Core-first.

## Релиз v0.4.28: HostControl DI application boundary

Добавлен отдельный `HostControlApplicationService`, который оркестрирует host lifecycle исключительно через injected ports. Он отделяет direct-IP/VPN enrollment policy, one-time assertion, public-key verification, bounded routing и provenance from existing Core-first boundary; реализации network/storage/crypto adapters не добавлены.

## Результат первого прохода

Анализатор построил **100 descriptors** для классов и интерфейсов и обнаружил **31 структурный кандидат** после первого Extract Class. Структурный отпечаток включает вид, поля, сигнатуры методов, модификаторы, зависимости и рекурсивные дочерние хэши. Одинаковые имена типов в текущем отчёте не обнаружены, поэтому первый проход не потерял типы из-за коллизии имени.

| Классификация | Количество | Действие |
|---|---:|---|
| `existing_contract` | 7 | Не рефакторить; сохранить interface/implementation или extension boundary |
| `overlap_match` | 4 | Проверить Extract Class/Pull Up и LSP вручную |
| `composition_preferred` | 20 | Не строить базовый класс автоматически; предпочесть Value Object, интерфейс или делегирование |

## Уже корректные контракты

Сильные совпадения между `DependencyGraphAuditor` и `IDependencyGraphAuditor`, `FilterStorageService` и `IFilterStorageService`, `PhysicsStorageService` и `IPhysicsStorageService`, а также между `IRicisCoreEngine` и Core-адаптерами классифицированы как `existing_contract`. Это не дублирование, требующее Extract Superclass: интерфейс является портом, а класс — его адаптером или реализацией.

## Кандидаты на классический рефакторинг

| Пара | Первичное решение | Причина |
|---|---|---|
| `AddNodePrefillData` / `AiAssistantResponse` | Выполнено: общий `NodeContentFields` + два специализированных интерфейса | Общие поля вынесены без изменения публичного `AddNodePrefillData`; AI-ответ сохранил `normalizedFunction` |
| `AdaptiveRole` / `UIElementToggle` | Сначала проверить семантику; вероятнее общий UI descriptor | Совпадают `id` и `label`, но доменная роль может быть разной |
| `II18nActions` / `I18nStoreState` | Разделить state/action порт; не общий base class | Совпадение поля-функций не доказывает общую ответственность |
| `BenchmarkEco` / `EconomicInfo` | `Replace Primitive/Data Value with Object` или mapping | Поля совпадают, но один тип относится к benchmark-аудиту, другой — к доменной экономике |
| `PersistedSnapshot` / `MapState` | Выделить persistence DTO или mapper | Snapshot — транспортная форма, MapState — агрегат; наследование нарушит DDD-границу |

## Core-адаптеры

`RicisFallbackEngine` и `RicisWasmBridge` имеют высокий overlap. Это ожидаемая вариативность одного порта, а не повод объединять реализации в базовый класс. Классическое решение — общий `IRicisCoreEngine` плюс Strategy/Adapter; общий алгоритмический скелет допустим только после доказательства, что шаги и lifecycle совпадают. Lazy supervisor остаётся инфраструктурной деталью.

## Рекурсивное правило

После каждого принятого рефакторинга отчёт строится заново. Если Pull Up Field/Method создаёт новый общий invariant, он становится отдельным descriptor и участвует в следующем проходе. Цикл закрывается только при отсутствии новых `overlap_match` с совместимой доменной ролью. `existing_contract` не превращается в базовый класс автоматически.

## Проверки

Анализатор прошёл `npm run lint` (`tsc --noEmit`). Генерация отчёта выполнена локальным `tsx`; первый запуск через pnpm создал только временные файлы, которые удалены. В проекте не изменялись `package.json` и `package-lock.json`. Выполнен один безопасный `Extract Class` на уровне DTO-контрактов; базовые классы сервисов и наследники не создавались, поскольку отчёт отделил реальные кандидаты от уже корректных портов и инфраструктурных адаптеров.

## Классические основания

Алгоритм сопоставлен с [Martin Fowler Refactoring Catalog](https://refactoring.com/catalog/), [Extract Superclass](https://refactoring.guru/extract-superclass), [Pull Up Method](https://refactoring.guru/pull-up-method) и [Template Method](https://refactoring.guru/design-patterns/template-method). Structural hash используется только как механизм поиска кандидатов; решение о наследовании принимается по LSP, DDD-ответственности и тестируемому общему инварианту.
