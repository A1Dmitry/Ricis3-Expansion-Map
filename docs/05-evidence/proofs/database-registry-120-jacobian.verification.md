# Lean verification: database record `registry-120` — Jacobian Conjecture

## Source record

Источник: `RICIS3.core.typescript/src/model/initialMap.ts`, запись `registry-120`.

```text
nodeId: registry-120
title: Jacobian Conjecture
targetFunction: Resolve()
phase -1: L1_IDENTITY — T(Resolve())
phase 2: RICIS transform — Axiom A6 — 0_F * infinity_G = F * G
finalResult: Axiom Extracted: registry-120_resolved
```

Ricis.Core также содержит `RicisJacobianSingularityExpression<T>` и regression suite `RicisJacobianSingularitySuite`, где проверяются сохранение индексированного determinant-zero, применение A6 к inverse payload и покомпонентная обработка payload entries.

## Generated output

Expansion вызвал `RicisFallbackEngine.generateFormalProof` для claim:

```text
0_det(J) * inf_Inv(J)
```

Получены:

```text
invariant: det(J) * Inv(J)
verified axioms: L1, SP4, A6, L0
```

Сгенерированный renderer snippet сохранён отдельно в `database-registry-120-jacobian.generated.lean`.

## Lean verification

Проверенный standalone-файл — `database-registry-120-jacobian.standalone.lean`. Его ключевая теорема:

```lean
theorem jacobian_registry120_a6_bridge :
    Derivation
      (.mul (.zero jacobianDet detKeys) (.inf jacobianInverseEntry inverseKeys))
      (.mul jacobianDet jacobianInverseEntry) := by
  exact Derivation.single
    (Rewrite.a6 jacobianDet jacobianInverseEntry detKeys inverseKeys)
```

Результат Lean:

```text
jacobian_registry120_a6_bridge does not depend on any axioms
jacobian_registry120_indices_valid depends on axioms: [propext]
```

Проверка выполнена командой:

```bash
lake env lean database-registry-120-jacobian.standalone.lean
```

## Ограничение утверждения

Эта проверка подтверждает **RICIS-III структурный переход A6** для записи якобиан-сингулярности: индексированный determinant-zero умножается на индексированный inverse payload и преобразуется в структурное произведение payload-выражений. Она не является доказательством полной классической Jacobian Conjecture о полиномиальных автоморфизмах и глобальной обратимости. Запись базы называет задачу `Jacobian Conjecture`, но содержит только два шага — L1 identity и A6; поэтому более сильное утверждение нельзя выдавать за доказанное на основании этой записи.
