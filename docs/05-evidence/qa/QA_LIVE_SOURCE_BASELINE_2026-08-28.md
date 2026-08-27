# Базовая сверка QA — RICIS Expansion Map

Дата проверки: 2026-08-28.

## Источник GitHub

Репозиторий: https://github.com/A1Dmitry/Ricis3-Expansion-Map  
Свежий read-only clone: `/tmp/ricis3-qa-source`  
Актуальный GitHub commit при загрузке: `e3c8b8d` (`merge: publish server persistence SQLite architecture G2`)  
Версия из `package.json`: `0.4.69`  
Количество тестовых файлов в clone: 146.

## Опубликованная карта

Live URL: https://a1dmitry.github.io/Ricis3-Expansion-Map/  
Последняя известная успешная проверка runtime до начала QA: карта загружалась и показывала `v0.4.69`; далее live необходимо сверить уже с актуальным GitHub commit `e3c8b8d`.

## Важное расхождение для проверки

Локальная рабочая копия ранее была на `e72d9a5`, а свежий GitHub clone уже на `e3c8b8d`. Поэтому нельзя считать опубликованный deployment эквивалентным текущему `main` без проверки hash/build metadata и фактического поведения UI.

## Результат live-базовой проверки

Проверенный URL: https://a1dmitry.github.io/Ricis3-Expansion-Map/?qa=baseline-2026-08-28

Live приложение загрузилось без fatal error. Видимые значения: `v0.4.69`, `NODES 379`, `AVAILABLE 73`, `LOCKED 147`, `RESOLVED 159`. В нижнем статусе: `Граф загружен. Обучение Агента завершено (159 из 379 решенных задач, 21 доказательств)`.

Доступны пользовательские элементы: переключение RU/EN, Roadmap, режим списка, Settings, Sandbox, поиск, Quick Actions, открытие доступной задачи, добавление новой проблемы, RICIS Console, решённые случаи калькулятора, маршрут изучения мономолитов и фильтры 14/14 научных полей.

Открытым остаётся вопрос соответствия live deployment свежему GitHub commit `e3c8b8d`: live показывает только версию `0.4.69`, но не публикует commit hash, поэтому требуется отдельная проверка deployment workflow/assets.

## Проверка пользовательского раздела решённых случаев

Через штатную кнопку `РЕШЕННЫЕ СЛУЧАИ КАЛЬКУЛЯТОРА` раздел открылся и показал 14 элементов каталога. Для 13 элементов отображается `Visual calculator не настроен: calculator_base_url_missing`; для кинематического мономолита дополнительно указано, что это source-driven visualization, не запускающая расчёт, управление, safety assessment или certification.

Раздел не падает и явно сообщает отсутствие calculator backend. Это пока классифицировано как **наблюдение/возможный незавершённый функциональный сценарий**, а не как дефект, пока не сопоставлены acceptance criteria каталога и deployment configuration.

## Проверка обратной совместимости legacy URL

Сценарий: открыть `https://a1dmitry.github.io/Ricis3-Expansion-Map/?node=real-catalog-98&lang=en`.

Результат: карта загрузилась, fatal error отсутствует. Исходник GitHub подтверждает, что `real-catalog-98` — это узел `Распределение богатства Парето`, поэтому live-переход к этому узлу корректен. UI отображает его Base64 key и canonical path, состояние `UNRESOLVED`, а proof panel честно сообщает отсутствие proof artifact.

После сценария консоль браузера не содержит сообщений (`No console output`).
