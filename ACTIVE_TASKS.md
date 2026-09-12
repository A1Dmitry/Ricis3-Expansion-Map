# Активные задачи проекта (RICIS Expansion Map Active Tasks)

В этом документе собран актуальный перечень активных и запланированных задач проекта **RICIS Expansion Map** согласно правилам разработки RICIS-III Agile Pipeline и протоколу RCVAP.

## 1. Текущие завершённые и верифицированные задачи

### **[RICIS-7.7-GEOMETRIC-BRIDGE-RUNTIME] Полное расширение 2D Geometric Bridge Runtime ($R^2_{RICIS}$) для $0/0$, $\infty/\infty$, $\infty-\infty$, $0-0$ и косого произведения в $O(1)$**
* **Статус:** `G4_DEVELOPMENT_COMPLETED` (Верифицировано независимыми unit-тестами)
* **Результаты:** Полная типизация операций и интерактивный visualizer.

### **[P5-EXACT-SYMBOLIC-RUNTIME] Полное символьное ядро без эвристик (`Math.abs < eps`)**
* **Статус:** `G4_DEVELOPMENT_COMPLETED` (Верифицировано, 100% прохождение тестов)
* **Результаты:** Устранены любые числовые пороги для константной свертки и семантического индексирования. Символьная редукция AST теперь абсолютно строгая.

### **[P6-KINEMATIC-ENGINEERING] Символьное ядро вычисления Null-space якобиана**
* **Статус:** `G4_DEVELOPMENT_COMPLETED` (Верифицировано, интегрировано в `planar3LinkKinematicService.ts`)
* **Результаты:** Реализовано символьное вычисление вектора Null-space через векторное произведение строк Jacobian AST. Внедрено в вычисление самодвижения (self-motion escape gradient).

### **[P7-DLS-VS-RICIS-BENCHMARK] Воспроизводимый headless-бенчмарк для сравнения DLS и RICIS**
* **Статус:** `G4_DEVELOPMENT_COMPLETED` (Верифицировано, добавлено в `kinematicBenchmark.ts` & `kinematicBenchmark.test.ts`)
* **Результаты:** Протестировано 3 сценария сингулярности (Boundary reach, Elbow fold, Shoulder pole). Доказана высокая точность и стабильность направления RICIS по сравнению с Damped Least Squares.

---

## 2. Приоритетный план работ (Dependency-Ordered Roadmap)

Граф зависимостей и порядок выполнения задач, основанный на результатах технического аудита:

| Приоритет | ID Задачи | Зависимости | Цель и область ответственности | Статус |
| :---: | :--- | :--- | :--- | :--- |
| **P0** | **GENERIC COMPOSITION / SUBSTITUTION** | Автономная задача | Внедрение единого дженерик-примитива структурной подстановки (`AstSubstitution.substitute`), формирующего DAG. | `G4_DEVELOPMENT_COMPLETED` |
| **P1** | **MANDELBROT AS GENERIC ITERATION TEST** | P0 | Проверка работы композиции на примере итерации $S_{n+1} = T(S_n)$ без создания фрактал-специфичных сущностей. | `G4_DEVELOPMENT_COMPLETED` |
| **P2** | **TEST SPECIFICATION** | P1 | Набор структурных unit-тестов для P0 и P1 (сохранение размерности, параметров, корректность структуры). | `G4_DEVELOPMENT_COMPLETED` |
| **P3** | **AST GRAPH / MEMORY** | P0, P2 | Инструментальное измерение O(n) роста графа и автоматического Structural Sharing (DAG) в памяти JS. | `G4_DEVELOPMENT_COMPLETED` |
| **P4** | **TS/C# GENERIC SEMANTIC GAP** | P0 | Закрытие разрыва в абстракциях с C#-версией (`Ricis.Core Compose / RebindTo`). | `G4_DEVELOPMENT_COMPLETED` |
| **P5** | **EXACT SYMBOLIC RUNTIME** | P0 | Замена числовых эвристик (`Math.abs < eps`) на строгую алгебраическую символьную редукцию AST. | `G4_DEVELOPMENT_COMPLETED` |
| **P6** | **KINEMATIC ENGINEERING** | P5 | Глубокая интеграция символьного RICIS-ядра для вычисления Null-space якобиана. | `G4_DEVELOPMENT_COMPLETED` |
| **P7** | **DLS VS RICIS BENCHMARK** | P6 | Создание воспроизводимого headless-бенчмарка (ошибки позиционирования, сингулярности) без привязки к UI. | `G4_DEVELOPMENT_COMPLETED` |
| **P8** | **DOCUMENTATION DRIFT** | Все выше | Синхронизация `README.md`, `ACTIVE_TASKS.md` с фактическим статусом кодовой базы и отсутствием generic-замен. | `G4_DEVELOPMENT_COMPLETED` |
| **P9** | **SCIENTIFIC CLAIMS** | P8 | Строгое разделение FACT / HYPOTHESIS / CLAIM в публичной документации и Lean-артефактах. | `G4_DEVELOPMENT_COMPLETED` |
| **P10** | **PRODUCT PRIORITY** | P4, P5 | Позиционирование продукта как универсального символьного/структурного движка (робототехника — тестовый кейс). | `G4_DEVELOPMENT_COMPLETED` |

### **[RICIS-SEED-A11] RICIS как СЕМЯ: протокол саморасширения (мета-аксиома A11) и выращенные правила A12–A14**
* **Статус:** `G4_DEVELOPMENT_COMPLETED` (верифицировано 48 unit-тестами модуля + 6 тестами страницы)
* **Результаты:**
  * Реализована каноническая запись `Ric.ExpandTo((x) => x.Resolve(UnsolvedSingularProblem))` с разделением уровней `Resolve` (разрешить и доказать) и `ExpandTo` (допуск через ворота).
  * Десять ворот допуска; любой отказ оставляет поколение R(n) неизменным (отпечаток сохраняется).
  * Фактический прогон R0 → R3 вырастил производные правила A12, A13, A14 (доказаны только из аксиом зерна).
  * Открытый класс $(0_F)^{\infty_G}$ зафиксирован как `OPEN_UNPROVEN` и не committed.
  * Детерминированные структурные отпечатки (`axiom-v1:*`, `seed-v1:*`), воспроизводимость прогона.
  * Выпущен единый документ v8.0: [`ricis-unified-complete-document-8.0-seed-expansion.json`](docs/01-architecture/ricis-unified-complete-document-8.0-seed-expansion.json) (консервативное расширение v7.9).
  * Ядро R0 приведено к v7.9: добавлены L1C3, SP5, P1; A3 помечена снятой и в активное зерно не входит.
* **Граница доверия:** локальная структурная проверка не является запуском ядра Lean; статус Lean — `REQUIRES_CORE_LEAN`.

---

## Регламент обновления реестра задач
* Перед началом любой разработки, изменением приоритета, публикацией или передачей контекста реестр задач должен быть обновлен.
* Продвижение задач по фазам разработки строго последовательно: `G1 (Бизнес-требования) → G2 (Архитектура) → G3 (QA-тесты) → G4 (Разработка)`.
