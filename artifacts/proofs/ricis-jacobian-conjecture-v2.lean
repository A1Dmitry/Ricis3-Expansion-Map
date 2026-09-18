import Mathlib

namespace RICIS_Jacobian

/-!
  RICIS v7.9 — АРТЕФАКТ ЯКОБИАНА, ВЕРСИЯ 2 (закрытие F-01)

  ГРАНИЦА ДОВЕРИЯ (читается до всего остального):
  * Этот файл — НОВАЯ версия доказательства (`ricis-jacobian-conjecture.standalone.lean`,
    v1, остаётся неизменяемым внешним исходником по AGENTS.md §7 и не переписан).
  * Утверждение v1 (строка 62 исходника) ДОКАЗУЕМО НЕ БЫЛО: `rfl` не проходит, и это не
    техническая трудность, а содержательный факт. Ниже он доказан формально как
    ОПРОВЕРЖЕНИЕ: `jacobian_v1_identity_refuted` — для ЛЮБЫХ F и G равенство v1 ложно.
    Причина (тоже доказана): `ricisResolve` для узла `det` разворачивает детерминант в
    `sub (mul m11 m22) (mul m12 m21)` и НЕ спускается в произведения, поэтому A6-пара
    `zeroF F · infF G` не попадает ни в A6-стадию, ни в `geometricMeasure`.
  * Исправленное утверждение (`Jacobian_singularity_resolved`) сохраняет замысел v1
    (сингулярный якобиан с 0_F/∞_G на диагонали → инвариант F·G минус разрешённый нуль),
    но выполняет то, чего не делал v1: ОПУСК разрешения в произведения детерминанта —
    ровно A6-стадия канона (AGENTS.md §10; то же определение A6, что в
    `ricis-universal-orchestration-template.lean`). Это ИЗМЕНЁННАЯ формулировка, а не
    доказательство формулировки v1: реестр (artifacts/proofs/README.md,
    core-checks/kernel-findings.json, F-01) обязан хранить это различие.
  * Тело не использует Mathlib: из ядра нужны только индуктивный тип, `rfl`, `rw`,
    `injection`, `cases`. Внешний эпилог с `#print axioms` добавляет генератор
    (`scripts/generateLeanCoreChecks.ts`), исходные байты не изменяются.
-/

inductive RExpr : Type where
  | zero
  | one
  | var (name : String)
  | add (a b : RExpr)
  | sub (a b : RExpr)
  | mul (a b : RExpr)
  | div (a b : RExpr)
  | divSelf (e : RExpr)
  | subSelf (e : RExpr)
  | zeroF (F : RExpr)
  | infF  (F : RExpr)
  | rect  (F G : RExpr)
  | mu    (R : RExpr)
  | partialDeriv (F x : RExpr)
  | det   (m11 m12 m21 m22 : RExpr)

/-- A1/A10-стадия: умножение на структурный нуль даёт индексированный нуль левого множителя. -/
def ricisResolveMul (a b : RExpr) : RExpr :=
  match b with
  | RExpr.zero => RExpr.zeroF a
  | x =>
    match a with
    | RExpr.zero => RExpr.zeroF x
    | RExpr.zeroF F =>
      match x with
      | RExpr.infF G => RExpr.mu (RExpr.rect F G)
      | y => RExpr.mul a y
    | z => RExpr.mul z b

/-- Один проход структурной редукции. Обратите внимание на ветвь `det`: она РАЗВОРАЧИВАЕТ
    детерминант в `sub (mul m11 m22) (mul m12 m21)` и на этом останавливается — рекурсии в
    произведения здесь нет (это и есть первопричина F-01). -/
def ricisResolve : RExpr → RExpr
  | RExpr.divSelf _            => RExpr.one
  | RExpr.subSelf e            => RExpr.zeroF e
  | RExpr.mul a b              => ricisResolveMul a b
  | RExpr.det m11 m12 m21 m22  =>
      RExpr.sub (RExpr.mul m11 m22) (RExpr.mul m12 m21)
  | e                          => e

/-- A6-стадия: геометрическая реализация `mu (rect F G) → F * G`. -/
def geometricMeasure : RExpr → RExpr
  | RExpr.mu (RExpr.rect F G) => RExpr.mul F G
  | e                         => e

/-- Канонический одношаговый резолвер (как в v1 и в универсальном шаблоне). -/
def resolveRICIS (e : RExpr) : RExpr :=
  geometricMeasure (ricisResolve e)

/-- Разрешение детерминантного узла С ОПУСКОМ в произведения: каждое из двух произведений
    детерминанта проходит полный цикл `resolveRICIS` (A1/A10-стадия и A6-стадия), и только
    после этого результаты собираются в `sub`. Это тот же A6-механизм, что в каноне, но
    применённый на той глубине, где сингулярная пара действительно находится. -/
def ricisResolveDet (m11 m12 m21 m22 : RExpr) : RExpr :=
  RExpr.sub (resolveRICIS (RExpr.mul m11 m22)) (resolveRICIS (RExpr.mul m12 m21))

-- ============================================================================
-- ЧАСТЬ 1. ПЕРВОПРИЧИНА: что реально делает одношаговый резолвер с узлом det
-- ============================================================================

/-- Первопричина F-01, зафиксированная формально: узел `det` под одним проходом даёт
    детерминант с НЕразрешёнными произведениями. A6-пара `zeroF F · infF G` остаётся
    внутри `mul` и до `geometricMeasure` не доходит. -/
theorem det_expansion_single_pass (F G : RExpr) :
    resolveRICIS (RExpr.det (RExpr.zeroF F) RExpr.zero RExpr.zero (RExpr.infF G)) =
      RExpr.sub (RExpr.mul (RExpr.zeroF F) (RExpr.infF G)) (RExpr.mul RExpr.zero RExpr.zero) := rfl

/-- Конструкторы `mul` и `zeroF` несовместимы: равенство таких выражений ложно. -/
theorem RExpr_mul_ne_zeroF (a b c : RExpr) : RExpr.mul a b ≠ RExpr.zeroF c := by
  intro h
  cases h

-- ============================================================================
-- ЧАСТЬ 2. ОПРОВЕРЖЕНИЕ УТВЕРЖДЕНИЯ v1
-- ============================================================================

/-- Утверждение v1 (строка 62 исходника) ложно для любых F и G, а не «не доказано»:
    правая часть требует `mul zero zero = zeroF zero`, но это равенство разных
    конструкторов. Следовательно, `rfl` в v1 не мог пройти ни при какой доработке
    тактик — требовалось другое утверждение. -/
theorem jacobian_v1_identity_refuted (F G : RExpr) :
    ¬ (resolveRICIS (RExpr.det (RExpr.zeroF F) RExpr.zero RExpr.zero (RExpr.infF G)) =
        RExpr.sub (RExpr.mul F G) (RExpr.zeroF RExpr.zero)) := by
  intro h
  rw [det_expansion_single_pass] at h
  injection h with _ h_off
  exact RExpr_mul_ne_zeroF RExpr.zero RExpr.zero RExpr.zero h_off

-- ============================================================================
-- ЧАСТЬ 3. A6 НА ТОЙ ГЛУБИНЕ, ГДЕ СИНГУЛЯРНАЯ ПАРА ДЕЙСТВИТЕЛЬНО НАХОДИТСЯ
-- ============================================================================

/-- A6-стадия срабатывает на паре `zeroF F` и `infF G`, если пара передана резолверу.
    Здесь это зафиксировано на уровне промежуточного результата `mu (rect F G)`. -/
theorem A6_pair_reaches_geometric_measure (F G : RExpr) :
    ricisResolve (RExpr.mul (RExpr.zeroF F) (RExpr.infF G)) = RExpr.mu (RExpr.rect F G) := rfl

/-- A6: геометрическая реализация `zeroF F · infF G → F * G` (то же утверждение и то же
    доказательство, что `A6_geometric_realization` в универсальном шаблоне канона). -/
theorem A6_geometric_realization (F G : RExpr) :
    resolveRICIS (RExpr.mul (RExpr.zeroF F) (RExpr.infF G)) = RExpr.mul F G := rfl

/-- A10/A1: произведение с структурным нулём даёт индексированный нуль. -/
theorem A10_mul_zero (F : RExpr) :
    resolveRICIS (RExpr.mul F RExpr.zero) = RExpr.zeroF F := rfl

/-- ИСПРАВЛЕННОЕ УТВЕРЖДЕНИЕ (TASK-01 / F-01).

    Сингулярный «якобиан» с диагональной A6-парой `0_F` и `∞_G` разрешается в инвариант
    `F * G` минус разрешённый нулевой член — при условии, что разрешение ОПУСКАЕТСЯ в
    произведения детерминанта (`ricisResolveDet`).

    Отличие от v1 ровно одно: v1 применял `resolveRICIS` к самому узлу `det` (дескриптор
    «детерминант» оставался последним шагом редукции, см. `det_expansion_single_pass`),
    поэтому A6-пара не разрешалась никогда. Формулировка v1 опровергнута:
    `jacobian_v1_identity_refuted`. Здесь доказано то же по замыслу утверждение, но с
    опуском до уровня A6-пары. Внешнее утверждение о гипотезе Якобиана этим НЕ
    доказывается: это структурное тождество над AST. -/
theorem Jacobian_singularity_resolved (F G : RExpr) :
    ricisResolveDet (RExpr.zeroF F) RExpr.zero RExpr.zero (RExpr.infF G) =
      RExpr.sub (RExpr.mul F G) (RExpr.zeroF RExpr.zero) := by
  dsimp [ricisResolveDet]
  rw [A6_geometric_realization, A10_mul_zero]

-- ============================================================================
-- ЧАСТЬ 4. L1 (ИНВАРИАНТ ТОЖДЕСТВА) — СОХРАНЁН БЕЗ ИЗМЕНЕНИЙ
-- ============================================================================

/-- L1_IDENTITY: структурная редукция не меняет выражение там, где сингулярности нет. -/
theorem Jacobian_L1_identity (e : RExpr) : e = e := rfl

end RICIS_Jacobian
