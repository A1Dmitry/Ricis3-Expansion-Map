# Structural Hash Refactoring Report

**Версия формата отчёта:** 0.1.0
**Релиз приложения:** 0.4.14
**Дата:** 2026-08-17
**Источник данных:** `src/**/*.ts` и `src/**/*.tsx` без test-файлов
**Машинный отчёт:** `structural-hash-report.json`

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
