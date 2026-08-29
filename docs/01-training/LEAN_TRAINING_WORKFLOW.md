# RICIS-III v7.7: ИНСТРУКЦИЯ И ЗАДАНИЕ ПО ОБУЧЕНИЮ АГЕНТА ИСПОЛЬЗОВАНИЮ LEAN В ДОКАЗАТЕЛЬСТВАХ

Данный документ представляет собой стандартизированную методику и практическое задание для обучения агента (LLM) проведению математических доказательств с использованием Lean 4, соответствующего аксиоматике RICIS-III.

---

## 1. СТРУКТУРА ОКРУЖЕНИЯ LEAN 4 В ПРОЕКТЕ

В проекте RICIS-III Lean-доказательства хранятся в каталоге `./artifacts/proofs/`.
Основными каноническими исходниками являются:
1. `database-a6-minimal-core-check.lean` — валидация минимального беспакетного (без Mathlib) ядра для A6-моста.
2. `ricis-backend-exact-reduction.standalone.lean` — полное доказательство структурной редукции $E / E \to 1$ и свойств неизменности выражений.

### Каноническое представление выражений (RExpr):
```lean
inductive RExpr (τ : Ty) where
  | atom (id : Nat) : RExpr τ
  | mul (a b : RExpr τ) : RExpr τ
  | zero (payload : RExpr τ) (keys : List Key) : RExpr τ
  | inf (payload : RExpr τ) (keys : List Key) : RExpr τ
```

---

## 2. ПОШАГОВЫЙ ПРАВИЛО-ПРОТОКОЛ ДЛЯ АГЕНТА (LEAN-AGENT-TRAINING)

Когда перед агентом стоит задача доказать утверждение RICIS-III в Lean 4, он обязан строго следовать следующему протоколу:

1. **Изучение Контекста и Типов данных**:
   Запрещено использовать произвольные структуры типов. Обязательно выполнить чтение `artifacts/proofs/database-a6-minimal-core-check.lean` для понимания индуктивных типов `RExpr`, `Ty`, `Phase` и `Rewrite`.

2. **Формализация Утверждения**:
   Записать сигнатуру доказываемой теоремы в виде отношения `Derivation src dst` или прямого равенства `ricisReduce src = dst`.

3. **Конструирование доказательства без sorry**:
   Агент должен генерировать полные, логически завершенные доказательства без использования заглушек `sorry`.

4. **Использование канонических тактик**:
   Для структурного равенства использовать `rfl`. Для редукций по шагам — тактики `exact Derivation.single (Rewrite.a6 ...)` или `induction`.

5. **Проверка аксиом (#print axioms)**:
   В конце каждого доказательства обязательно ставить команду `#print axioms <имя_теоремы>`, чтобы гарантировать отсутствие неявных зависимостей от внешних недоказанных утверждений.

---

## 3. ТЕСТ-ДРАЙВ СРАВНЕНИЯ: РУЧНОЕ VS АВТОМАТИЧЕСКОЕ ДОКАЗАТЕЛЬСТВО

Для проверки применимости методики проведем сравнительный тест-драйв доказательств.

### ТЕСТ А. Ручное доказательство (Выполнено Экспертом)
**Задача**: Доказать, что выражение произведения нуля, индексированного значением 5, на бесконечность, индексированную значением 3 (т.е. $0_5 \times \infty_3$), редуцируется ровно за один шаг моста к произведению исходных атомов $5 \times 3$.

**Доказанный вручную Lean 4 код** (из `database-a6-minimal-core-check.lean`):
```lean
namespace RICIS3.MinimalA6Check
open RExpr

def five : RExpr .scalar := .atom 5
def three : RExpr .scalar := .atom 3
def fiveKeys : List Key := [5]
def threeKeys : List Key := [3]

/-- Exact typed A6 bridge for the database claim `0_5 * inf_3`. -/
theorem database_a6_bridge :
    Derivation
      (.mul (.zero five fiveKeys) (.inf three threeKeys))
      (.mul five three) := by
  exact Derivation.single (Rewrite.a6 five three fiveKeys threeKeys)

#print axioms database_a6_bridge
end RICIS3.MinimalA6Check
```
*Статус*: **Успешно верифицировано**. Аксиома `database_a6_bridge` не опирается на `sorry` или другие сторонние допущения.

---

### ТЕСТ Б. Задание на доказательство Агенту
**Задача**: Сгенерировать доказательство для **диагонального случая аксиомы A6 (Telescope Case)**:
$$0_F \times \infty_F = F^2$$
где $F = 5$. Выражение должно преобразоваться из нуля, индексированного `five`, и бесконечности, индексированной `five`, в произведение `five * five`.

**Шаблон выполнения для Агента**:
```lean
namespace RICIS3.MinimalA6Check
open RExpr

def F_val : RExpr .scalar := .atom 5
def F_keys : List Key := [5]

/-- Diagonal A6 telescope bridge: 0_F * inf_F = F * F -/
theorem diagonal_a6_telescope :
    Derivation
      (.mul (.zero F_val F_keys) (.inf F_val F_keys))
      (.mul F_val F_val) := by
  -- ДОЛЖНО БЫТЬ ЗАПОЛНЕНО АГЕНТОМ
  exact Derivation.single (Rewrite.a6 F_val F_val F_keys F_keys)

#print axioms diagonal_a6_telescope
end RICIS3.MinimalA6Check
```

---

## 4. ОЦЕНКА И СХОДИМОСТЬ РЕЗУЛЬТАТОВ

| Критерий оценки | Ручное доказательство | Результат Агента | Сходимость / Вердикт |
| :--- | :--- | :--- | :--- |
| **Чистота типов (Type Safety)** | Полная (Ty.scalar) | Ожидается полная | Сходится |
| **Использование Rewrite.a6** | Использовано корректно | Должно использовать `Rewrite.a6` | Сходится |
| **Отсутствие sorryAx** | Да (0 sorry) | Должно быть 0 sorry | Сходится |
| **Complexity** | $O(1)$ | $O(1)$ | Сходится |

Если агент сгенерировал код, идентичный шаблону во втором тесте, доказательство признается математически валидным по RICIS-III и полностью эквивалентным ручной спецификации.
