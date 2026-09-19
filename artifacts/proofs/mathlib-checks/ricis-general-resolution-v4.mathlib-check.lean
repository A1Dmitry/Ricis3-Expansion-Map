-- ============================================================================
-- RICIS-III: общая параметризованная сингулярность — ВЕРСИЯ 4 (TASK-03 + TASK-04)
-- Новая версия доказательства. Неизменяемые внешние исходники
-- `artifacts/proofs/ricis-general-resolution.lean` (v2) и
-- `artifacts/proofs/ricis-general-resolution-v3.lean` (v3) не изменены ни на байт
-- (AGENTS.md §7); этот файл замещает их как рабочая версия.
-- ============================================================================
--
-- ГРАНИЦА ДОВЕРИЯ (F-09 / F-10 / F-11), в самом исходнике, а не только в метаданных:
--
--  1) НУЛЬ ОБЪЯВЛЕННЫХ АКСИОМ. В v2 контракты были `axiom ax_A4_general` и
--     `axiom ax_SP1_general` — то есть УРАВНЕНИЯ между выражениями синтаксического
--     типа `RicisExpr`:
--         div (zero F) (zero G) = val (F a / G a)          (A4)
--         div (zero f) (zero f) = val 1                    (SP1)
--     В свободной индуктивной модели такие равенства НЕ верны: `div` и `val` —
--     разные конструкторы, и равенство между ними ОПРОВЕРЖИМО (см.
--     `RicisExpr_div_ne_val`, `no_universal_a4_equation`). Аксиома такого вида
--     делала бы теорию противоречивой (из неё выводится False), поэтому режим
--     «аксиома-уравнение» устранён: контракты выражены НОРМАТИВНЫМ ОТНОШЕНИЕМ
--     переписывания `RicisContract` (конструкторы `a4` / `sp1`), ровно как в
--     `ricis3.ExtendedKernel` («RICIS axioms are normative contracts, not theorems
--     derivable from classical field arithmetic»).
--  2) ЯВНАЯ МАРКИРОВКА. Контракты видны как конструкторы отношения, а не как
--     доказанные леммы; каждое их использование стоит в тексте теоремы/доказательства.
--  3) ПЕРЕИМЕНОВАНИЕ. Имя `ricis_equals_classical_limit` из v2 не перенесено: оно
--     обещало совпадение с классическим пределом, которого в файле нет и не может
--     быть (P1 запрещает пределы внутри Resolve_RICIS). Вместо него —
--     `ricis_eval_value_form` (форма вычисления значения, без заявления о пределе).
--  4) РЕДУКЦИЯ ↔ ВЫЧИСЛЕНИЕ (F-09/F-11). Функция `ricis_reduce` (та, что реально
--     сокращает (z−a)^min(m,n)) входит и в формулировки, и в доказательства:
--     `ricis_reduce_at_center_eq_eval`, `ricis_resolution_bridge`. Сингулярность
--     предъявлена явно: `singularity_is_zero_over_zero` (N a = 0 ∧ D a = 0 при
--     положительных порядках).
-- ============================================================================

import Mathlib.Data.Complex.Basic
import Mathlib.Tactic.Ring
import Mathlib.Data.Nat.Basic

open Complex

-- ============================================================================
-- ЧАСТЬ 1: RICIS Core (синтаксический слой)
-- ============================================================================

def IndexSpace := ℂ → ℂ

inductive RicisExpr where
  | val : ℂ → RicisExpr
  | zero : IndexSpace → RicisExpr
  | inf : IndexSpace → RicisExpr
  | div : RicisExpr → RicisExpr → RicisExpr

-- ============================================================================
-- ЧАСТЬ 2: Общая параметризация мероморфной сингулярности
-- ============================================================================

structure MeromorphicSingularity where
  N : ℂ → ℂ
  D : ℂ → ℂ
  a : ℂ
  m : ℕ
  n : ℕ
  N_tilde : ℂ → ℂ
  D_tilde : ℂ → ℂ
  hN : ∀ z, N z = (z - a)^m * N_tilde z
  hD : ∀ z, D z = (z - a)^n * D_tilde z
  hN_ne_zero : N_tilde a ≠ 0
  hD_ne_zero : D_tilde a ≠ 0

-- ============================================================================
-- ЧАСТЬ 3: Контракты A4 и SP1 как НОРМАТИВНОЕ ОТНОШЕНИЕ (0 аксиом)
-- ============================================================================

/-- Нормативный контракт RICIS: `RicisContract src dst` означает «правило RICIS
    разрешает переписать `src` в `dst`». Это отношение, а не равенство:
    в синтаксической модели `div …` и `val …` — разные конструкторы, поэтому
    уравнение-версия того же контракта опровержима (см. `no_universal_a4_equation`),
    а отношение — нет: у него есть конструкторы-свидетели. -/
inductive RicisContract : RicisExpr → RicisExpr → Prop where
  /-- A4: частное двух индексированных нулей переписывается в значение F(a)/G(a)
      при ненулевых регулярных частях (доверенный нормативный вход, не теорема). -/
  | a4 (F G : IndexSpace) (a : ℂ) (hF : F a ≠ 0) (hG : G a ≠ 0) :
      RicisContract (RicisExpr.div (RicisExpr.zero F) (RicisExpr.zero G))
                    (RicisExpr.val (F a / G a))
  /-- SP1: частное одинаковых индексированных нулей положительного порядка
      переписывается в единицу (доверенный нормативный вход, не теорема). -/
  | sp1 (a : ℂ) (k : ℕ) (hk : k > 0) :
      RicisContract (RicisExpr.div (RicisExpr.zero (fun z => (z - a)^k))
                                   (RicisExpr.zero (fun z => (z - a)^k)))
                    (RicisExpr.val 1)

/-- Конструкторы `div` и `val` несовместимы: соответствующие выражения различны. -/
theorem RicisExpr_div_ne_val (x y : RicisExpr) (c : ℂ) :
    RicisExpr.div x y ≠ RicisExpr.val c := by
  intro h
  cases h

/-- Уравнение-форма A4 (то, что стояло аксиомой в v2) опровержимо уже для одной пары:
    `div (zero F) (zero G) ≠ val (F a / G a)` — это разные конструкторы. -/
theorem a4_equation_form_is_refutable (F G : IndexSpace) (a : ℂ) :
    RicisExpr.div (RicisExpr.zero F) (RicisExpr.zero G) ≠ RicisExpr.val (F a / G a) :=
  RicisExpr_div_ne_val _ _ _

/-- Следствие: универсальной аксиомы-уравнения A4 не существует. Именно поэтому
    контракт живёт в виде отношения: уравнение делало бы модель противоречивой. -/
theorem no_universal_a4_equation :
    ¬ (∀ (F G : IndexSpace) (a : ℂ),
        RicisExpr.div (RicisExpr.zero F) (RicisExpr.zero G) = RicisExpr.val (F a / G a)) := by
  intro h
  exact a4_equation_form_is_refutable (fun _ => 0) (fun _ => 0) 0 (h (fun _ => 0) (fun _ => 0) 0)

/-- Отношение контрактов не пусто: свидетели предъявляются конструкторами.
    (В отличие от уравнения-аксиомы, отношение не вносит противоречия.) -/
theorem ricis_contract_inhabited (S : MeromorphicSingularity) :
    ∃ (src dst : RicisExpr), RicisContract src dst := by
  exact ⟨RicisExpr.div (RicisExpr.zero S.N_tilde) (RicisExpr.zero S.D_tilde),
         RicisExpr.val (S.N_tilde S.a / S.D_tilde S.a),
         RicisContract.a4 S.N_tilde S.D_tilde S.a S.hN_ne_zero S.hD_ne_zero⟩

-- ============================================================================
-- ЧАСТЬ 4: Редукция и вычисление (F-09/F-11: связь теперь есть)
-- ============================================================================

/-- Структурная редукция сингулярности: сокращение общего множителя (z − a)^min(m,n). -/
noncomputable def ricis_reduce (S : MeromorphicSingularity) : ℂ → ℂ :=
  if S.m ≥ S.n then
    let k := S.m - S.n
    fun z => (z - S.a)^k * S.N_tilde z / S.D_tilde z
  else
    let k := S.n - S.m
    fun z => S.N_tilde z / ((z - S.a)^k * S.D_tilde z)

/-- Значение, выдаваемое RICIS-вычислением в центре сингулярности. -/
noncomputable def ricis_eval_general (S : MeromorphicSingularity) : ℂ :=
  if S.m ≥ S.n then
    let k := S.m - S.n
    if k = 0 then S.N_tilde S.a / S.D_tilde S.a else 0
  else
    0

/-- F-09/F-11: значение в центре совпадает с редуцированной функцией — вычисление и
    редукция больше не разъединены. `ricis_reduce` входит и в формулировку, и в
    доказательство. -/
theorem ricis_reduce_at_center_eq_eval (S : MeromorphicSingularity)
    (h_m_ge_n : S.m ≥ S.n) :
    ricis_reduce S S.a = ricis_eval_general S := by
  by_cases h_eq : S.m = S.n
  · have h_sub : S.m - S.n = 0 := by omega
    simp [ricis_reduce, ricis_eval_general, h_m_ge_n, h_sub]
  · have h_sub_pos : 0 < S.m - S.n := by omega
    have h_sub_ne : S.m - S.n ≠ 0 := Nat.ne_of_gt h_sub_pos
    simp [ricis_reduce, ricis_eval_general, h_m_ge_n, h_sub_ne]

/-- Объект разрешения предъявлен явно: при положительных порядках N(a) = 0 и D(a) = 0,
    то есть представленная пара действительно является сингулярностью 0/0 в точке a. -/
theorem singularity_is_zero_over_zero (S : MeromorphicSingularity)
    (hm : S.m > 0) (hn : S.n > 0) :
    S.N S.a = 0 ∧ S.D S.a = 0 := by
  constructor
  · rw [S.hN]
    simp [Nat.ne_of_gt hm]
  · rw [S.hD]
    simp [Nat.ne_of_gt hn]

-- ============================================================================
-- ЧАСТЬ 5: Явные зависимости от контрактов (A4/SP1 как доверенные входы)
-- ============================================================================

/-- A4 — фактическая (видимая) зависимость для частного регулярных частей. -/
theorem regular_factor_quotient_uses_A4 (S : MeromorphicSingularity) :
    RicisContract (RicisExpr.div (RicisExpr.zero S.N_tilde) (RicisExpr.zero S.D_tilde))
                  (RicisExpr.val (S.N_tilde S.a / S.D_tilde S.a)) := by
  exact RicisContract.a4 S.N_tilde S.D_tilde S.a S.hN_ne_zero S.hD_ne_zero

/-- SP1 — фактическая (видимая) зависимость для сокращения одинакового нулевого множителя. -/
theorem common_zero_factor_uses_SP1 (S : MeromorphicSingularity) (k : ℕ) (hk : k > 0) :
    RicisContract (RicisExpr.div (RicisExpr.zero (fun z => (z - S.a)^k))
                                 (RicisExpr.zero (fun z => (z - S.a)^k)))
                  (RicisExpr.val 1) := by
  exact RicisContract.sp1 S.a k hk

-- ============================================================================
-- ЧАСТЬ 6: Форма вычисления значения (переименование v2)
-- ============================================================================

/-- Значение RICIS-вычисления в форме «Ñ(a)/D̃(a) при m = n, иначе 0».

    ПЕРЕИМЕНОВАНО (TASK-04): в v2 это утверждение называлось
    `ricis_equals_classical_limit` и читалось как доказанное совпадение с классическим
    пределом. Совпадения здесь нет и быть не может: предельное выражение в файле не
    определяется, а P1 запрещает пределы внутри Resolve_RICIS. Это определение
    значения в другой форме, и имя теперь говорит ровно это. -/
theorem ricis_eval_value_form (S : MeromorphicSingularity) :
  S.m ≥ S.n →
  ricis_eval_general S =
    (if S.m = S.n then S.N_tilde S.a / S.D_tilde S.a else 0) := by
  intro h_m_ge_n
  dsimp only [ricis_eval_general]
  by_cases h_eq : S.m = S.n
  · have h_k_zero : S.m - S.n = 0 := by omega
    simp [h_k_zero, h_eq]
  · have h_k_ne_zero : S.m - S.n ≠ 0 := by omega
    simp [h_k_ne_zero]
    omega

-- ============================================================================
-- ЧАСТЬ 7: Сводная bridge-теорема
-- ============================================================================

/-- Аудируемая связка (F-09/F-10/F-11) в одном утверждении: сингулярность 0/0
    предъявлена, значение редукции в центре равно RICIS-вычислению, а оба контракта
    A4/SP1 входят ВИДИМЫМИ зависимостями как элементы нормативного отношения.
    Противоречивых аксиом в файле нет: контракты — конструкторы `RicisContract`. -/
theorem ricis_resolution_bridge (S : MeromorphicSingularity)
    (hm : S.m > 0) (hn : S.n > 0) (h_m_ge_n : S.m ≥ S.n) :
    (S.N S.a = 0 ∧ S.D S.a = 0) ∧
    ricis_reduce S S.a = ricis_eval_general S ∧
    RicisContract (RicisExpr.div (RicisExpr.zero S.N_tilde) (RicisExpr.zero S.D_tilde))
                  (RicisExpr.val (S.N_tilde S.a / S.D_tilde S.a)) ∧
    RicisContract (RicisExpr.div (RicisExpr.zero (fun z => (z - S.a)^S.n))
                                 (RicisExpr.zero (fun z => (z - S.a)^S.n)))
                  (RicisExpr.val 1) := by
  exact ⟨singularity_is_zero_over_zero S hm hn,
    ricis_reduce_at_center_eq_eval S h_m_ge_n,
    regular_factor_quotient_uses_A4 S,
    common_zero_factor_uses_SP1 S S.n hn⟩

/-! ===== GENERATED KERNEL-CHECK EPILOGUE (mathlib, additive only) =====

  Generator   : scripts/generateLeanMathlibChecks.ts (детерминированный; побайтовое совпадение при повторной генерации проверяет tools/leanMathlibChecks.test.ts)
  Source      : artifacts/proofs/ricis-general-resolution-v4.lean
  Source hash : sha256 1e89cbc83d2c06a8abffcf5e59b4d88b83a02bf35909ce59306660cace0be3a3
  Transform   : НЕТ. Тело скопировано байт-в-байт, включая строки import Mathlib.
                Любая подстановка, удаление или перестановка строк запрещены §7:
                проверяется ровно та формулировка, которую предоставил владелец.
  Basis       : НОВАЯ версия (TASK-03/TASK-04, F-09/F-10/F-11): контракты A4/SP1 переведены из axiom-уравнений (опровержимых в свободной модели — опровержение доказано в самом файле) в нормативное отношение RicisContract; в файле 0 объявленных аксиом. Связь редукции и вычисления (ricis_reduce_at_center_eq_eval использует ricis_reduce и в формулировке, и в доказательстве), явно предъявленная сингулярность 0/0 (singularity_is_zero_over_zero) и переименование ricis_equals_classical_limit → ricis_eval_value_form. Тело использует ℂ, omega и арифметику Nat — прогон только на тулчейне Mathlib (lake env lean, предустановленные oleans).
  Purpose     : дать закреплённому прогону ядра (job mathlib-kernel-check) возможность вывести #print axioms для каждой теоремы и каждого объявленного контракта (axiom).
  Boundary    : прогон проверяет только структурные теоремы этого артефакта. Он НЕ подтверждает эмпирические утверждения узла карты и не превращает объявленный axiom в доказанную лемму.
                Ниже — инспекционные команды, они не участвуют в доказательстве.

  ============================================================================-/
#print axioms RicisExpr_div_ne_val
#print axioms a4_equation_form_is_refutable
#print axioms no_universal_a4_equation
#print axioms ricis_contract_inhabited
#print axioms ricis_reduce_at_center_eq_eval
#print axioms singularity_is_zero_over_zero
#print axioms regular_factor_quotient_uses_A4
#print axioms common_zero_factor_uses_SP1
#print axioms ricis_eval_value_form
#print axioms ricis_resolution_bridge
