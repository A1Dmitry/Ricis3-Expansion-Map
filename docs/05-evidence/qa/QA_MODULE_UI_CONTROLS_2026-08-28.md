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
