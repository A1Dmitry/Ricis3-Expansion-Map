# QA: блокирующая ошибка Monolith Guided Case — 2026-08-28

## Live reproduction

URL: https://a1dmitry.github.io/Ricis3-Expansion-Map/?node=calculator-node-mandelbrot&qa=guided-case-buttons

Фактический результат: приложение не отображает карту и не предоставляет кнопки Monolith Guided Case. Вместо этого показывается:

`Ошибка загрузки БД: identity_collision: paths=/разрешение-сингулярностей-деление-на-ноль; legacyIds=2bece2b29b58e53578922489e2fb261c,math-singularity`

## QA impact

Проверка кнопок Guided Case блокируется на шаге hydration/database load. Это не подтверждает, что обработчики кнопок сами не работают; текущий deployment не достигает UI из-за конфликта identity migration.

## Required next check

Найти источник дублирующего canonical path `/разрешение-сингулярностей-деление-на-ноль` и двух legacy IDs (`2bece2b29b58e53578922489e2fb261c`, `math-singularity`) в seed/persisted merge. Исправление должно сохранить единственный canonical SHA-128 identity, корректно переназначить ссылки и не скрывать конфликт через произвольное удаление узла.

## Повторная проверка

После попытки удалить только sandbox IndexedDB `ricis3-map-db` операция была заблокирована открытым соединением, а повторная загрузка страницы снова показала тот же `identity_collision`. Следовательно, блокер воспроизводим в текущем live-сеансе и требует deterministic repair в hydration; это не просто отсутствие клика по кнопке.

## Live-проверка после canonical root hydration repair

После merge `4664be6` live-запрос с legacy-путём `?node=calculator-node-mandelbrot` успешно разрешился в canonical SHA-128 node `a3949213aba674d8844812a2eba08a1f`; карта загрузилась без `identity_collision`, Guided Case и карточка узла доступны.

Карточка показывает `PARTIAL / LOCKED`, секцию `Formal Lean 4 Verification` со статусом `Requires Core / Lean evidence`, без ложного доказательства. Нажатие `Verify` не изменило proof/trust status; раскрытие `Formal Proof (Lean 4)` сохранило честный статус. Live blocker предыдущего snapshot не воспроизведён.
