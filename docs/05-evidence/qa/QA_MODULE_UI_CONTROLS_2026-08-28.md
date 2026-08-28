# QA-отчёт UI-модуля — 2026-08-28

Проверены UI-компоненты карты, панели управления, карточки узлов, Guided Case, Calculator Explorer, recovery и mobile layout на `main` commit `a3b9f07`.

| Контроль | Результат |
|---|---:|
| UI test files | 23 |
| Tests | 138/138 passed |
| Control wiring | passed |
| Guided Case buttons | passed in isolation |
| Calculator controls | passed in isolation |
| Persistence panel | passed |
| Mobile layout/orbit controls | passed |
| Recovery diagnostics | passed |

Во время `UniverseSkybox` теста выводятся технические предупреждения `Multiple instances of Three.js` и `HTMLCanvasElement.getContext() not implemented` из jsdom/test environment. Они не приводят к падению тестов, но требуют отдельного visual/browser QA при проверке WebGL.

Live UI-проверка Guided Case не завершилась рендером карты из-за P1 `identity_collision` в hydration; это зафиксировано отдельно в Issue #25.

## Live-проверка локализации во втором цикле

На свежем live snapshot после нажатия `EN` URL получил `lang=en`, но видимые подписи Guided Case, панели Actions, Scientific Fields и карточки узла остались на русском (`РЕШЕННЫЕ СЛУЧАИ КАЛЬКУЛЯТОРА`, `МАРШРУТ ИЗУЧЕНИЯ МОНОМОЛИТОВ`, `Открыть узел`, русские категории и disclosures). Issue #17 воспроизводится.

## Live-проверка режима списка во втором цикле

Кнопка `РЕЖИМ СПИСКА` переключила приложение в доступный список: отображены `278` узлов и `14` научных зон. Нажатие на карточку `Квантовая ошибка` установило URL `?node=0218ceed74fcb7268d74d49bdec11753`, то есть переход выполнен по 32-hex node ID. Кнопка `Попробовать 3D-карту` вернула 3D-режим, сохранив тот же `?node=`.

После возврата открыта карточка узла с key в Base64, canonical path, Explore/Verify/Challenge, Share и Edit. Потеря выбранного узла не обнаружена.

## Live-проверка Explore карточки узла во втором цикле

На карточке узла `0218ceed74fcb7268d74d49bdec11753` нажатие `Explore` раскрыло три связанные зависимости: `Сложность сортировки`, `Криптографические хэш-функции`, `Целевая функция AGI (RICIS Core)`. Текущий URL `?node=0218ceed74fcb7268d74d49bdec11753` не изменился. Для каждой связи отображена отдельная кнопка со знаком `→` и hint `Перейти к узлу`, что соответствует ID-only navigation contract.

## Live-проверка Explore / Challenge во втором цикле

`Explore` раскрыл три связанные задачи с отдельными кнопками `→` и hint `Перейти к узлу`; текущий node ID сохранился. `Challenge` перевёл в Roadmap URL:

`?node=0218ceed74fcb7268d74d49bdec11753&mode=challenge&view=roadmap&root=0218ceed74fcb7268d74d49bdec11753`

Roadmap показал исходный узел `Квантовая ошибка`, root badge и действия `Открыть карту`, `Открыть проверку`, `Показать связанные задачи`, `Выбрать корневую цель`. Пример и root используют exact node ID, не title lookup.

## Live-проверка Share

Кнопка `Поделиться` присутствует с hint `Скопировать ссылку на эту задачу`; после нажатия URL страницы остался ID-based (`?node=0218ceed74fcb7268d74d49bdec11753&mode=explore`). Попытка прочитать clipboard через sandbox browser context завершилась timeout/context canceled, вероятно из-за permission boundary. Поэтому факт записи в clipboard оставлен как **неподтверждённый**, а не отмечен как успешный.

## Targeted UI/accessibility regression после hydration repair

Targeted набор из 6 файлов (`useI18nStore`, `i18n`, `nodeCardAccordion`, Guided Case domain/topology и `MonolithGuidedCaseTrail`) прошёл: **6 файлов, 58/58 тестов**.

Команда обхода обнаружила, что каталога `src/accessibility` в текущем проекте нет; это не падение приложения, а отсутствие отдельного каталога accessibility. UI accessibility-покрытие фактически находится в соответствующих model/domain/UI тестах.

## Live flood-fill cycle 16: переключатель English и Issue #17

На deployment `5f5cf54` при открытом canonical node `a3949213aba674d8844812a2eba08a1f` выполнен клик по верхнему переключателю `EN`. После обновления snapshot интерфейс фактически остался смешанным: русские названия научных полей, карточки и sidebar controls сохранились, а рядом продолжают отображаться английские заголовки (`SAVE & EXPORT`, `AVAILABLE TO SOLVE`, `Target Function & Singularity`). Фактический переход языка по этому контролу не подтверждён; это продолжение Issue #17 Localization, а не навигационный дефект.

Граф и canonical node ID не изменились. Finding требует отдельной разработки: провести UI-wide inventory hardcoded strings и заменить их на `t(TranslationKey)` с тестом RU/EN parity.
