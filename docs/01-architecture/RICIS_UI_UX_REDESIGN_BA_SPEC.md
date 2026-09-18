# RICIS-III UI/UX Redesign — постановка бизнес-аналитика

**Проект:** RICIS-III / RICIS Expansion Map  
**Тип продукта:** интерактивное исследовательское приложение, визуализатор, computational workspace  
**Дата фиксации постановки:** 2026-09-18  
**Статус:** `HYPOTHESIS / READY_FOR_DISCOVERY`  
**Статус реализации:** `NOT STARTED BY REQUEST` — по прямому указанию владельца код, дизайн-макеты, прототип и рефакторинг не выполнялись.  
**Аудитор:** `AUDITOR: SELF (same-pipeline)`  
**Назначение:** каноническая постановка задачи для последующего UX-аудита и исполнения.

> Этот документ переводит исходное техническое задание в исполнимую программу работ, требования, критерии приёмки и реестр решений. Он не является отчётом о завершённом аудите, не подтверждает usability нового интерфейса и не заменяет будущую инвентаризацию фактического UI.

---

## 1. Решение бизнес-аналитика

RICIS-III должен восприниматься пользователем как **единое рабочее пространство**, а не как набор независимых мини-приложений. Для этого необходима не косметическая смена стилей, а последовательная реконструкция модели взаимодействия:

```text
Global Shell
  → Dynamic Main Menu
    → Compact Context Toolbar
      → Workspace / Object
        → Context Menu
          → Properties / Details / Advanced
```

Ключевой инвариант:

> **Основные действия видимы; подробности могут быть скрыты.**

Из него следуют обязательные ограничения:

1. `Accordion` не является контейнером для часто используемых команд.
2. Одна команда имеет одно логическое определение и несколько UI-представлений.
3. Одинаковые элементы одинаково выглядят, называются и работают во всех Applet.
4. Состояние системы отображается рядом с возможным действием.
5. Рабочая область получает максимальный приоритет по площади и вниманию.
6. Mobile сохраняет ту же командную модель, а не превращает интерфейс в новый набор глубоких accordion.

---

## 2. Цель, пользовательская ценность и границы

### 2.1. Цель

Создать предсказуемую и доступную UI/UX-систему, в которой новый пользователь без знания внутренней архитектуры RICIS может ответить на четыре вопроса:

- Где я нахожусь?
- Что я могу сделать сейчас?
- Что сейчас происходит?
- Как вернуться или продолжить работу?

### 2.2. Пользовательская ценность

| JTBD | Целевой результат |
|---|---|
| Исследовать карту | Выбрать, найти, открыть, проверить и изучить объект без поиска действий по accordion. |
| Работать с кинематикой | Запустить, приостановить, сбросить и вернуть модель в исходное состояние непосредственно из command surface. |
| Исследовать Seed / foundations | Различать действия над объектом и справочную информацию об объекте. |
| Сравнивать модели/графы | Выбрать A/B, сравнить, поменять местами, сбросить и экспортировать без раскрытия технических деталей. |
| Работать с Roadmap | Выбрать элемент, открыть его Applet, увидеть статус и вернуться назад. |
| Настраивать приложение | Изменить параметры, применить/сохранить/сбросить/отменить изменения без поиска кнопок внутри вложенных секций. |
| Работать с малым экраном и клавиатурой | Использовать ту же логику команд, видимый focus и доступные семантические controls. |

### 2.3. Входит в скоуп

- Global Shell и единая навигационная модель.
- Dynamic Main Menu для каждого зарегистрированного Applet.
- Compact Contextual Toolbar.
- Единая Command Model / Command Registry / execution lifecycle.
- Context menu для Node, Model, Map Object и иных типов объектов.
- Рекурсивный UX-аудит от Application до Result / Return.
- Классификация команд: global, common, contextual, advanced, informational.
- Инвентаризация текущего UI и дубликатов.
- Wireframes, дизайн-система, high-fidelity, prototype, responsive и accessibility specification.
- Developer handoff и критерии приёмки.

### 2.4. Не входит в текущую постановку без отдельного решения владельца

- Изменение математического/Lean-ядра и научных утверждений RICIS.
- Изменение доменных алгоритмов, persistence или backend-контрактов, кроме адаптеров, необходимых для UI command lifecycle.
- Добавление новых Applet или новых предметных областей.
- Переписывание proof/evidence-артефактов.
- Визуальный редизайн ради цветов, градиентов, теней или анимаций до утверждения информационной архитектуры.
- Выбор конкретной дизайн-библиотеки, если он не следует из утверждённого design system.

---

## 3. Исходная техническая проблема

### 3.1. Первопричина

Основная проблема — не отсутствие отдельных кнопок, а отсутствие единой иерархии команд. Пользователь вынужден искать часто используемые действия в различных местах:

```text
найти раздел → раскрыть accordion → найти кнопку → выполнить → закрыть/переключить
```

Это увеличивает cognitive load, ухудшает discoverability, расходует рабочую площадь и нарушает единообразие между Applet.

### 3.2. Целевое правило размещения

| Тип элемента | Целевое размещение |
|---|---|
| Постоянно нужные global actions | Global Shell / main menu / global toolbar |
| Частые действия текущего Applet | Contextual toolbar и dynamic menu |
| Действие над выбранным объектом | Context menu или компактная contextual action bar |
| Редкая команда | Context menu, `More`, advanced section |
| Свойства, параметры и metadata | Collapsible panel / accordion |
| Текущее состояние и результат | Постоянный status surface, feedback рядом с источником действия |

### 3.3. Запрещённые решения

- «Если не помещается — спрячем в accordion».
- Giant toolbar или giant sidebar.
- Меню-корзина, где смешаны Applet, файловые операции, диагностика и команды.
- Одинаковая функция с независимыми реализациями в пяти местах.
- Icon-only controls для критических действий без понятной подписи.
- Кнопка, после которой неясно, произошло ли действие.
- Несогласованные паттерны Back, Close, Reset, Verify, Search в разных Applet.
- Глубокие меню более 2–3 уровней без доказанной необходимости.
- Интерактивные `<span>` вместо семантических `button`, `menu`, `menuitem`.

---

## 4. Предварительный baseline репозитория

Ниже зафиксированы наблюдения по структуре репозитория и уже существующим документам. Это **не финальный UX-аудит**: каждое наблюдение должно быть подтверждено в будущей инвентаризации через runtime-сценарий, keyboard-проверку и анализ результата действия.

| Наблюдение | Источник | Следствие для будущей работы |
|---|---|---|
| В приложении зарегистрированы 9 Applet: `map`, `kinematic`, `seed`, `comparison`, `roadmap`, `voynich`, `qa-tests`, `terminal`, `settings`. | `src/types/appletRegistry.ts` | Аудитировать нужно все 9 Applet, а не только Map3D/Kinematic/Seed. |
| Верхняя оболочка уже разделена на `CompactCommandMenuBar` и `AppletActionToolbar`. | `src/App.tsx`, `src/ui/components/CompactCommandMenuBar.tsx`, `src/ui/components/AppletActionToolbar.tsx` | Будущий redesign должен развивать существующую архитектурную границу, а не создавать параллельную оболочку без миграционного плана. |
| В проекте уже есть типы `AppCommand`, `CommandContext`, категории и `CommandRegistry`. | `src/types/commandTypes.ts`, `src/services/commandRegistry.ts` | Требование единой command model имеет техническую опору; требуется провести gap-анализ полноты, дубликатов, dead commands и реальной wiring-компетентности. |
| Существует command bus для отдельных событий, в том числе Kinematic. | `src/services/commandBus.ts`, `src/ui/KinematicEnginePage.tsx` и связанные тесты | Нужно различить canonical command, event transport и локальное состояние; они не должны стать тремя независимыми источниками поведения. |
| Menu bar содержит отдельные top-level меню и блок, названный `Файл`, который показывает Applet/виды. | `src/ui/components/CompactCommandMenuBar.tsx` | Проверить семантический конфликт «Файл» vs «Навигация / Рабочая область» и вынести файловые операции только при наличии реальных file actions. |
| Map3D содержит много accordion-секций, включая persistence/export surface. | `src/ui/Map3D.tsx`, `src/ui/Map3D.persistencePanel.test.ts` | Провести action-by-action проверку: что является редкой информацией, а что должно быть вынесено в toolbar/context menu. |
| В проекте уже есть mobile hooks и тесты mobile layout/view stack. | `src/hooks/useMobileLayout.ts`, `src/hooks/useMobileViewStack.ts`, `src/ui/Map3D.mobileLayout.test.ts` | Mobile redesign должен сохранить существующую SPA/history модель и не допустить возврата к скрытию критических действий в accordion. |
| В существующих аудиторских документах зафиксированы кандидаты на проблемы: dead commands, Settings placeholder, deep-link drift, несогласованные Back/Forward и accessibility-риски. | `FULL_AUDIT_REPORT_2026-09-16.md`, `UI_NAVIGATION_AUDIT.md` | Эти записи использовать как входные evidence и regression candidates; не переносить их статус без повторной проверки текущего кода. |
| В `UI_NAVIGATION_AUDIT.md` уже описана SPA-навигация, Applet history и mobile history stack. | `UI_NAVIGATION_AUDIT.md` | Навигационный redesign обязан не разрушить deep links, browser Back/Forward и emergency recovery boundary. |

### 4.1. Ограничение интерпретации baseline

Факт существования `CommandRegistry` не доказывает, что все UI-представления действительно используют одну команду. Факт наличия теста не доказывает отсутствие runtime-проблемы во всех сценариях. Поэтому первый будущий этап — **Inventory + runtime evidence**, а не изменение компонентов.

---

## 5. Нормативные требования

### 5.1. Business / UX requirements

| ID | Требование | Приоритет |
|---|---|---:|
| `UX-BR-01` | Пользователь видит текущий Applet, workspace и выбранный объект/режим. | P0 |
| `UX-BR-02` | Основные действия текущего контекста доступны без раскрытия accordion. | P0 |
| `UX-BR-03` | После действия пользователь видит состояние: running/paused/passed/failed/online/loaded и т. п. | P0 |
| `UX-BR-04` | Back, Forward, Close, Escape и возврат в предыдущий контекст имеют предсказуемое поведение. | P0 |
| `UX-BR-05` | Для одной функции нет конфликтующих независимых реализаций. | P0 |
| `UX-BR-06` | Одинаковые controls имеют единое имя, appearance, focus, disabled и keyboard behavior. | P1 |
| `UX-BR-07` | Рабочая область не перекрыта постоянно открытыми большими панелями. | P1 |
| `UX-BR-08` | Mobile, tablet и desktop используют одну логическую модель команд. | P1 |
| `UX-BR-09` | Icon-only control не используется как единственное объяснение критической функции. | P1 |
| `UX-BR-10` | Accordion используется для Properties, Details, Parameters, Advanced, Metadata и Debug, а не для частых primary actions. | P0 |

### 5.2. Architecture requirements

| ID | Требование | Критерий |
|---|---|---|
| `UX-ARCH-01` | Global Shell постоянен и не зависит от конкретной страницы. | Brand, navigation, search, back/forward, settings/help, share/status доступны согласованно. |
| `UX-ARCH-02` | Main Menu динамически отражает текущий Applet. | В меню нет несвязанных команд текущего контекста; common actions остаются common. |
| `UX-ARCH-03` | Toolbar компактен и ограничен частыми действиями. | Не более необходимого набора; overflow уходит в `More` или menu, а не в гигантскую панель. |
| `UX-ARCH-04` | Context Menu зависит от типа объекта и selection state. | Node, Model, Map Object и прочие типы получают разные допустимые команды. |
| `UX-ARCH-05` | Properties/Advanced отделены от command surface. | Accordion открывает информацию/настройки, но не является обязательным шагом для primary action. |
| `UX-ARCH-06` | Navigation and deep-link semantics сохраняются. | Переключение Applet не вызывает full reload в обычном сценарии; URL остаётся shareable. |

### 5.3. Accessibility requirements

| ID | Требование |
|---|---|
| `UX-A11Y-01` | Полная Tab-навигация с видимым focus. |
| `UX-A11Y-02` | Enter/Space активируют button; Escape закрывает menu/panel/context menu; Arrow keys перемещают фокус в menu. |
| `UX-A11Y-03` | Context menu доступно мышью, клавиатурой и через keyboard context-menu key/Shift+F10, если применимо. |
| `UX-A11Y-04` | Используются корректные семантики `button`, `menu`, `menuitem`, `dialog`, `status`, `aria-expanded`, `aria-controls`, `aria-disabled`. |
| `UX-A11Y-05` | Нет интерактивного поведения, доступного только через hover или tooltip. |
| `UX-A11Y-06` | Контраст, hit area, reduced motion и screen-reader labels проверяются на каждом общем компоненте. |

---

## 6. Целевая information architecture

### 6.1. Global Shell

Кандидат на постоянную структуру:

```text
RICIS-III
├─ Workspace / Navigation
├─ Back
├─ Forward
├─ Search
├─ View
├─ Share / Copy URL
├─ Application status
├─ Settings
└─ Help
```

`Verify` может быть Global Shell только в случае, если действие действительно глобально и имеет смысл без конкретного объекта; иначе оно должно быть contextual.

### 6.2. Dynamic Main Menu

Предварительная карта ниже — **рабочая гипотеза для inventory**, а не финальный перечень команд:

| Applet | Сохраняемые common sections | Contextual sections / candidate actions | Advanced / information |
|---|---|---|---|
| Map | Navigation, View, Search, Help | Node, Map Object, Verify, Open | Properties, Details, Graph filters, Technical info |
| Kinematic | Navigation, View, Help | Simulation, Manipulator, Model, Play/Pause, Reset, Home | Joints, Physics, Constraints, Parameters, Advanced |
| Seed | Navigation, View, Help | Seed, Axioms, Verify, Inspect, Compare, Expand, Copy, Export | Identity, Fingerprint, Origin, History, Metadata |
| Comparison | Navigation, View, Help | Select A, Select B, Compare, Swap, Reset, Export | Details, Advanced, Metadata |
| Roadmap | Navigation, View, Help | Select, Open, Go to Applet, Status, Back | Dependencies, Details, Metadata |
| Voynich | Navigation, View, Help | Select/Inspect, Research action, Verify/Export — подтвердить инвентаризацией | Source, Interpretation, Technical details |
| Terminal | Navigation, View, Help | Execute, Clear, Stop/Cancel, Copy result, Export | Session, Runtime, Diagnostics |
| QA Tests | Navigation, View, Help | Run, Stop, Reset, View result, Export report | Test parameters, Logs, Technical diagnostics |
| Settings | Navigation, View, Help | Apply, Save, Reset, Cancel | Parameters grouped into accordions |

### 6.3. Смысловое разделение «Файл»

До подтверждения фактических file operations top-level `Файл` не считать допустимым контейнером для перехода между Applet. Целевая модель:

```text
Файл             → Новый / Открыть / Импорт / Экспорт — только если существует file-domain
Рабочая область  → Map / Kinematic / Seed / Comparison / Roadmap / ...
Навигация        → Back / Forward / Home / deep-link actions
```

---

## 7. Command architecture

### 7.1. Каноническая модель

```text
Command Registry
       │
       ├── Main Menu
       ├── Toolbar
       ├── Context Menu
       ├── Keyboard Shortcut
       └── Mobile Command Surface
                │
             Command
                │
             Action
                │
       State / Result / Feedback
```

### 7.2. Контракт одной команды

Каждая команда в будущем inventory должна иметь:

```text
id                стабильный canonical identifier
label             короткий пользовательский текст
description       понятное объяснение результата
category          navigation / view / action / context / advanced / help
scope             global / applet / object type
availability      предикат доступности в текущем состоянии
presentation      menu / toolbar / context / shortcut / mobile
shortcut          если существует
execute           одна точка запуска action
state              idle / running / success / failure / disabled
result            observable outcome and feedback
undo/cancel       если действие обратимо или длительное
telemetry         только при допустимой privacy-модели
```

### 7.3. Правило устранения дубликатов

Например, `RESET_CAMERA` может отображаться в toolbar, menu, context menu и по shortcut, но все surfaces обязаны вызывать один canonical command. Нельзя поддерживать отдельные `onClick`-реализации с разной логикой для одной функции.

### 7.4. Command discoverability record

Для каждой команды обязательна запись:

| Поле | Вопрос |
|---|---|
| `currentLocation` | Где команда находится сейчас? |
| `proposedLocation` | Где она должна находиться? |
| `visibility` | Видна ли без раскрытия панели? |
| `frequency` | High / Medium / Low? |
| `context` | При каком Applet/object/state доступна? |
| `clickDepth` | Сколько действий до запуска? |
| `accordionRequired` | Нужно ли раскрытие accordion? |
| `duplicates` | Где ещё она реализована/показана? |
| `resultFeedback` | Как пользователь понимает результат? |
| `stateFeedback` | Видно ли running/success/failure/current state? |
| `keyboard` | Есть ли shortcut и keyboard path? |
| `mobile` | Как команда представлена на малом экране? |
| `priority` | P0 / P1 / P2? |

---

## 8. Единая модель состояний

Минимальный status vocabulary, который должен быть согласован для всех Applet:

```text
idle
ready
selected
loading
running
paused
stopping
success / passed
failed
cancelled
offline
online
loaded
not-loaded
unsaved
saved
unavailable
```

Примеры пользовательского представления:

- `Simulation: Running`
- `Simulation: Paused`
- `Verification: Running`
- `Verification: Passed`
- `Verification: Failed`
- `Connection: Online`
- `Model: Loaded`
- `Settings: Unsaved changes`

Каждое длительное или асинхронное действие обязано иметь старт, промежуточное состояние, успех/ошибку и допустимый cancel/return path.

---

## 9. Context Menu contract

Context menu строится от **типа объекта + selection state + capabilities**, а не копирует global menu.

| Тип объекта | Основные действия | Дополнительные действия |
|---|---|---|
| Node | Open, Verify, Copy ID, Copy DOI, Share | Expand, Properties, Details |
| Model | Select, Reset, Run, Pause, Verify | Properties, Parameters, Advanced |
| Map Object | Open, Inspect, Verify, Expand | Properties, Details |
| Seed artifact | Inspect, Verify, Compare, Expand, Copy, Export | Identity, Axioms, Fingerprint, Metadata |
| Roadmap item | Select, Open, Go to Applet, Back | Status, Dependencies, Details |

Точный состав должен быть получен из фактических capability checks; недоступные команды должны быть явно disabled с объяснением, а не исчезать без причины, если это важно для discoverability.

---

## 10. Рекурсивный UX-аудит: будущий протокол

Аудит выполнять сверху вниз и обратно по цепочке:

```text
Application
  ↓
Global Shell
  ↓
Applet
  ↓
Workspace
  ↓
Panel
  ↓
Object
  ↓
Action
  ↓
Result / State
  ↓
Return / Next Action
```

Для каждого сценария фиксировать:

1. Где пользователь находится до действия?
2. Как он понимает доступные действия?
3. Где команда расположена и почему?
4. Видна ли она без accordion?
5. Сколько кликов/keypress требуется?
6. Есть ли более короткий путь?
7. Есть ли дубликаты или конфликтующие labels?
8. Что произошло после запуска?
9. Видно ли состояние и результат?
10. Можно ли отменить или повторить действие?
11. Как пользователь возвращается?
12. Работает ли мышь, клавиатура, screen reader и mobile path?
13. Соответствует ли команда canonical command model?

### 10.1. Форма UX inventory

Для каждого Applet создать и заполнить таблицу:

| Action | Current location | Proposed location | Visibility | Frequency | Context | Duplicate | Click depth | State/result | Keyboard | Mobile | Priority | Evidence |
|---|---|---|---|---|---|---|---:|---|---|---|---|---|
| `...` | `...` | `...` | Visible / Hidden / Conditional | High / Medium / Low | `...` | Yes / No / Unknown | `...` | `...` | `...` | `...` | P0/P1/P2 | path/test/run |

`Unknown` разрешён только на этапе discovery и должен быть закрыт evidence до утверждения wireframes.

### 10.2. Сценарии минимального покрытия

- Открыть приложение → понять текущий Applet → перейти в Map.
- Map: найти Node → выбрать → Open → Verify → увидеть result → открыть Properties → вернуться.
- Map3D: Zoom/Pan/Rotate → Reset → Search → Select → Context Menu → Inspect.
- Kinematic: Select Model → Play → Pause → Reset → Home → открыть Simulation Settings.
- Seed: Inspect → Verify → Compare → Expand → Copy/Export → изучить Identity/Axioms/Fingerprint.
- Roadmap: Select item → Open → перейти в Applet → Back → Forward.
- Comparison: Select A/B → Compare → Swap → Reset → Export.
- Settings: изменить parameter → увидеть Unsaved → Apply/Save → Reset/Cancel.
- Keyboard-only: пройти те же пути через Tab/Enter/Escape/Arrow/shortcuts.
- Mobile: пройти основные действия через `☰ → Context → Workspace`, не открывая accordion для primary action.

---

## 11. План работ для последующего исполнения

Работы выполнять строго в указанном порядке; переход к следующей фазе требует артефакта предыдущей.

| Фаза | Результат | Gate выхода |
|---:|---|---|
| 0. Discovery setup | Scope, scenarios, route map, evidence plan | Все Applet и критические сценарии перечислены. |
| 1. Inventory | Полный UX inventory + duplicate/dead-command list | Нет неизвестных primary actions без owner/evidence. |
| 2. UX architecture | Approved Global/Dynamic/Toolbar/Context/Advanced model | Для каждой команды определён canonical surface и fallback. |
| 3. Command classification | Command Map и discoverability records | Нет primary action, спрятанного только в accordion. |
| 4. Navigation model | Applet transitions, URL, history, back/forward, mobile stack | SPA/deep-link/accessibility contracts не конфликтуют. |
| 5. Wireframes | Desktop/tablet/mobile low-fidelity flows | Проверены основные сценарии и рабочая площадь. |
| 6. Design system | Tokens, controls, menus, panels, status, focus | Общие states и semantics утверждены. |
| 7. High-fidelity | Основные экраны всех Applet | High-fidelity не вводит новую логику, не отражённую в IA. |
| 8. Prototype | Navigation → Action → Result → Return | Все P0-сценарии проходимы в prototype. |
| 9. Usability review | Findings, severity, remediation decisions | Новый пользователь проходит acceptance scenarios без знания архитектуры. |
| 10. Final specification | Handoff, command mapping, responsive/a11y | Есть complete traceability от requirement до component/state. |
| 11. Implementation | Отдельная инженерная задача по утверждённой спецификации | Начинается только после явного решения владельца. |

---

## 12. Deliverables и Definition of Done

### Обязательные deliverables

1. `UX Audit` — полный фактический аудит с evidence и severity.
2. `Information Architecture` — Global, Applet, Context Menu, Toolbar, Workspace, Advanced.
3. `Command Map` — полный список текущих команд и классификация.
4. `Wireframes` — все основные Applet и responsive states.
5. `Design System` — typography, colors, spacing, buttons, menus, toolbar, context menu, panels, accordion, dialogs, status, icons.
6. `High-Fidelity Screens` — Main/Map, Map3D, Kinematic, Seed, Comparison, Roadmap, Settings, mobile.
7. `Interactive Prototype` — Navigation → Applet → Action → Context → Result → Return.
8. `Responsive specification` — desktop/tablet/mobile.
9. `Accessibility specification` — keyboard, focus, semantics, screen reader behavior.
10. `Developer handoff` — размеры, states, behavior, responsive behavior и command mapping для каждого компонента.

### Definition of Done для UX-проекта

- Все 9 зарегистрированных Applet прошли inventory.
- Все P0 actions видимы или доступны через однозначную compact command surface без accordion.
- У каждой команды есть canonical ID, scope, availability, result/state и owner.
- Нет необъяснённых command duplicates или dead commands.
- Global, dynamic, contextual и advanced layers разделены.
- Back/Forward, deep links, mobile stack и recovery behavior документированы.
- Keyboard-only path и semantic accessibility проверены.
- Основные сценарии пройдены пользователем, не знающим внутреннего устройства приложения.
- Все решения имеют traceability на исходное требование и evidence.
- Утверждённый handoff не требует от разработчика угадывать расположение или поведение команды.

---

## 13. Приоритизированный backlog будущего исполнения

### P0 — Critical UX

| ID | Задача | Критерий приёмки |
|---|---|---|
| `UX-P0-01` | Убрать primary actions из accordion-only paths. | Play/Pause/Reset/Search/Verify/Navigation/Object actions запускаются без раскрытия accordion там, где они актуальны. |
| `UX-P0-02` | Ввести единый status model. | После каждого длительного/асинхронного действия виден текущий state и результат. |
| `UX-P0-03` | Свести меню, toolbar, context menu и shortcut к одной command model. | Один canonical command вызывается с разных surfaces без расхождения поведения. |
| `UX-P0-04` | Исправить конфликтующие навигационные модели. | Applet, browser history, URL, Back/Forward и mobile stack дают предсказуемый результат. |
| `UX-P0-05` | Провести accessibility stop-the-line review. | Нет критических keyboard/semantic/focus блокеров в Global Shell и P0 flows. |
| `UX-P0-06` | Удалить или исправить dead/disabled commands. | Каждая отображаемая P0/P1 команда либо работает, либо корректно недоступна с объяснением. |

### P1 — Major UX

| ID | Задача | Критерий приёмки |
|---|---|---|
| `UX-P1-01` | Пересобрать dynamic menu по Applet context. | В каждом Applet видны только common + contextual sections; labels единообразны. |
| `UX-P1-02` | Ограничить toolbar до frequent actions. | Редкие команды перемещены в More/menu/context; рабочая область не теряет значимую площадь. |
| `UX-P1-03` | Создать объектные context menus. | Node/Model/Map Object/Seed/Roadmap получают capability-aware actions. |
| `UX-P1-04` | Унифицировать terminology и visual language. | Одинаковые элементы имеют одинаковые размеры, states и semantics. |
| `UX-P1-05` | Разделить File и Workspace navigation. | `Файл` содержит только подтверждённые файловые операции; Applet navigation находится в Navigation/Workspace. |
| `UX-P1-06` | Привести Settings к exception policy. | Apply/Save/Reset/Cancel видимы; accordion используется только для параметров. |

### P2 — Improvement

| ID | Задача | Критерий приёмки |
|---|---|---|
| `UX-P2-01` | Visual polish. | Стили поддерживают, а не маскируют IA. |
| `UX-P2-02` | Micro-interactions и motion. | Анимации не мешают state visibility и respect reduced motion. |
| `UX-P2-03` | Расширенные shortcuts и tooltips. | Shortcuts ускоряют работу, но не являются единственным способом discoverability. |

---

## 14. Responsive и accessibility specification — целевые правила

### Desktop

```text
Global Shell
Dynamic Main Menu
Compact Context Toolbar
Workspace (maximum area)
Context / Advanced surfaces on demand
```

### Tablet

- Сохранить shell и contextual toolbar.
- Сократить labels только после проверки понятности.
- Использовать `More` для низкочастотных команд.
- Не переносить primary actions в accordion только из-за нехватки ширины.

### Mobile

```text
☰ Global / Workspace Menu
Context toolbar or Context action surface
Workspace
Bottom sheet / side sheet: Properties, Details, Advanced
```

- Primary action остаётся доступной максимум через один predictable context step.
- Accordion не заменяет navigation или command surface.
- Back/Escape/close работают одинаково в drawer, sheet и menu.
- Selection и context menu должны быть доступны touch и keyboard/assistive technology где платформа это поддерживает.

### Keyboard contract

- `Tab`: последовательный проход по интерактивным элементам.
- `Enter` / `Space`: запуск focused button/menuitem.
- `Escape`: закрытие menu/context/panel/dialog без потери контекста.
- `Arrow keys`: перемещение внутри menu и selectable lists.
- `Shift+F10` / Context Menu key: открытие context menu для выбранного объекта.
- Shortcuts: только для частых команд; не должны перехватывать ввод в text fields.
- Focus: всегда виден, не исчезает после async action и не перескакивает непредсказуемо.

---

## 15. Метрики и evidence будущей проверки

Метрики не заменяют usability review, но делают regressions видимыми:

| Метрика | Целевой ориентир |
|---|---|
| Доля P0 actions, доступных без accordion | 100% |
| P0 commands с canonical ID | 100% |
| Commands с понятным post-action state/result | 100% |
| Необъяснённые duplicates | 0 |
| Dead commands среди отображаемых P0/P1 | 0 |
| Основные сценарии, доступные keyboard-only | 100% |
| Основные mobile scenarios без accordion-only step | 100% |
| Глубина primary action path | Не более 2 действий после открытия актуального контекста; исключения обоснованы |
| Applet с documented menu/toolbar/context policy | 9/9 |

Evidence должен включать:

- source/runtime references;
- inventory tables;
- screenshots или prototype links;
- keyboard walkthrough;
- responsive walkthrough;
- accessibility findings;
- command registry mapping;
- before/after click-depth records;
- list of accepted exceptions.

---

## 16. Риски, зависимости и открытые решения

### Риски

1. **Фальшивое исправление:** визуально вынести кнопку, но оставить отдельную дублирующую реализацию.
2. **Регрессия SPA:** redesign shell может нарушить URL/deep-link/history/recovery behavior.
3. **Скрытая сложность:** сокращение меню может убрать discoverability, если не сделать contextual fallback.
4. **Toolbar inflation:** попытка вынести всё из accordion превратит toolbar в новую корзину.
5. **Mobile divergence:** отдельный mobile UI может потерять часть command model.
6. **Trust drift:** существующий документированный audit может не совпадать с текущим runtime; старые PASS нельзя автоматически переносить.
7. **Domain ambiguity:** Verify, Export, Compare и Inspect могут иметь разные meanings в разных Applet и требуют capability taxonomy.

### Решения владельца, необходимые до implementation

- Утвердить финальные названия top-level menu.
- Определить, существуют ли реальные File operations; иначе переименовать/разделить `Файл`.
- Утвердить список Applet, входящих в public navigation, и роль вспомогательных `qa-tests`/`terminal`.
- Утвердить, является ли `Verify` global, applet-level или object-level в каждом сценарии.
- Утвердить лимит команд в toolbar и поведение `More`.
- Утвердить status vocabulary и допустимые состояния для каждой команды.
- Определить владельца UX sign-off и владельца инженерного command migration.
- Решить, какие изменения допустимы в существующих accessibility/history contracts.

---

## 17. Traceability к исходному техническому заданию

| Блок исходного задания | Реализованная в постановке секция |
|---|---|
| Global Shell / 4 levels | §1, §6, §14 |
| Accordion policy | §3.2–3.3, `UX-BR-10`, `UX-P0-01` |
| Main/Dynamic menu | §6, `UX-ARCH-01/02`, `UX-P1-01` |
| File vs Navigation | §6.3, `UX-P1-05` |
| Context Menu | §9, `UX-P1-03` |
| Command architecture | §7, `UX-P0-03` |
| Command discoverability | §7.4, §10 |
| State visibility | §8, `UX-P0-02` |
| Unified visual language/icons | §5, `UX-P1-04`, deliverables |
| Map3D/Kinematic/Seed/Roadmap/Comparison/Settings | §6.2, §10.2, §13 |
| Mobile / responsive | §14 |
| Keyboard / accessibility | §5.3, §14 |
| Recursive audit | §10 |
| UX inventory | §10.1 |
| Priorities | §13 |
| Work sequence | §11 |
| Deliverables / quality criterion | §12, §15 |
| Philosophy and target architecture | §1, §3 |

---

## 18. Финальная фиксация границы исполнения

На текущем шаге выполнено только следующее:

- исходное ТЗ преобразовано в бизнес-, UX-, architecture- и acceptance requirements;
- зафиксирована целевая interaction model;
- описан предварительный baseline репозитория;
- определены discovery-протокол, deliverables, backlog, риски и решения владельца;
- документ сохранён для дальнейшего исполнения.

На текущем шаге **не выполнено и намеренно не заявляется выполненным**:

- полный runtime UX-аудит;
- финальный UX inventory;
- wireframes и high-fidelity screens;
- interactive prototype;
- redesign компонентов;
- изменение `src/`, тестов, стилей, command registry или navigation implementation;
- usability/accessibility sign-off;
- implementation handoff.

**Следующий допустимый шаг:** отдельное выполнение Фазы 0–1 (`Discovery setup` → `Inventory`) с фиксацией evidence. Переход к изменению интерфейса допускается только после утверждения IA, Command Map и wireframes.
