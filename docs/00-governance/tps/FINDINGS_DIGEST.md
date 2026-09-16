# Сводка находок и ядерных прогонов — генерируемый индекс

> **Не редактировать руками.** Источник: `artifacts/proofs/core-checks/kernel-findings.json`, `artifacts/proofs/core-checks/manifest.json`,
> `docs/00-governance/tps/board.json`. Перегенерация: `npm run tps:digest`; проверка дрейфа: `npm run tps:digest:check`.
>
> **Граница.** Это индекс, а не доказательство: отчёт ничего не повышает, не понижает и не
> интерпретирует. Проза реестра сюда не копируется — копирование создало бы ещё один пересказ
> и новый канал дрейфа. Если строки отчёта и реестра расходятся, бракованной считается попытка
> править этот файл руками. AUDITOR: SELF (same-pipeline).

**Реестр:** Реестр фактов ядрового прогона Lean 4.33.1 по core-check производным · `registryVersion` 2
**Toolchain прогонов:** lean 4.33.1 (pinned via elan, GitHub Actions ubuntu-latest) · команда: `lean +4.33.1 <artifact>` · генератор производных: `scripts/generateLeanCoreChecks.ts`

## Классификация статусов (дословно из реестра)

- `COMPILED_WITH_ERRORS` — Файл компилировался с ошибками: часть деклараций не создана. Теоремы такого файла не могут считаться проверенными, даже если #print axioms для других имён успешен.
- `LEAN_VERIFIED_AXIOM_FREE` — Ядро приняло доказательство; #print axioms: does not depend on any axioms.
- `LEAN_VERIFIED_WITH_STANDARD_AXIOMS` — Ядро приняло доказательство; зависимость только от стандартных аксиом Lean (propext / Classical.choice / Quot.sound), sorryAx отсутствует.
- `REJECTED_SORRYAX` — В доказательстве присутствует sorryAx — утверждение НЕ доказано. Обычно это каскад: декларация не elaborировалась из-за более ранней ошибки.

## Находки

| ID | Тяжесть | Класс | Закрытость (по правилу гейта) | Затронутые артефакты | Карточки, ссылающиеся на находку |
|---|---|---|---|---|---|
| F-01 | CRITICAL | TUKHTA | закрыто (поле `resolution`/`status` начинается с маркера закрытия) | artifacts/proofs/ricis-jacobian-conjecture.json (verification.trustStatus = TRUSTED_AXIOM), src/model/initialMap.ts (proofs[registry-120].externalLean.trustStatus = TRUSTED_AXIOM), src/model/jacobianProof.test.ts (QA-1 проверяет лишь ТЕКСТОВОЕ присутствие строки `theorem Jacobian_singularity_resolved`, QA-2/QA-3 утверждают сам статус) | — |
| F-02 | HIGH | TUKHTA | открыто или закрыто частично — см. реестр | src/model/initialMap.ts, artifacts/proofs/*.json, src/model/ricisV79Monolith.test.ts, src/model/riemannZetaProof.test.ts | TPS-0010 (done) |
| F-03 | MEDIUM | PRECISION | открыто или закрыто частично — см. реестр | — | TPS-0010 (done) |
| F-04 | MEDIUM | EVIDENCE_DEFECT | закрыто (поле `resolution`/`status` начинается с маркера закрытия) | — | — |
| F-05 | HIGH | SEMANTIC_BOUNDARY | открыто или закрыто частично — см. реестр | — | TPS-0005 (waiting_owner); TPS-0010 (done) |
| F-06 | MEDIUM | PROOF_SCRIPT_DEFECT | закрыто (поле `resolution`/`status` начинается с маркера закрытия) | ricis-v79-monolith | — |
| F-07 | HIGH | MISSING_INSTANCE | закрыто (поле `resolution`/`status` начинается с маркера закрытия) | ricis-kernel-ast-sp5 | — |
| F-08 | MEDIUM | REPAIR_DEFECT | закрыто (поле `resolution`/`status` начинается с маркера закрытия) | ricis-seed-expansion-a11 | TPS-0002 (done, закрыто вне потока); TPS-0009 (done); TPS-0010 (done) |
| F-09 | HIGH | — | открыто или закрыто частично — см. реестр | — | TPS-0004 (waiting_owner) |
| F-10 | HIGH | — | открыто или закрыто частично — см. реестр | — | TPS-0004 (waiting_owner) |
| F-11 | MEDIUM | — | открыто или закрыто частично — см. реестр | — | TPS-0004 (waiting_owner) |
| F-12 | MEDIUM | — | закрыто (поле `resolution`/`status` начинается с маркера закрытия) | — | — |
| F-13 | MEDIUM | — | открыто или закрыто частично — см. реестр | — | — |
| F-14 | HIGH | — | открыто или закрыто частично — см. реестр | — | TPS-0007 (waiting_owner) |

> Класс закрытости вычисляется той же функцией `isFindingRecordedClosed`, что и правило
> `CARD_FINDING_ALREADY_CLOSED`: доска и отчёт не могут расходиться, потому что проверка одна.
> Полный текст основания и требуемое решение — только в реестре.

## Артефакты: фактические исходы ядерных прогонов

| Артефакт | Исход | Exit | Ошибок | Теорем | Проверяемый файл |
|---|---|---|---|---|---|
| database-a6-0_5_inf_3 | LEAN_VERIFIED | 0 | 0 | 19 | `artifacts/proofs/core-checks/database-a6-0_5_inf_3.standalone.core-check.lean` |
| database-a6-minimal-core-check | LEAN_VERIFIED | 0 | 0 | 1 | `artifacts/proofs/database-a6-minimal-core-check.lean` |
| database-registry-120-jacobian | LEAN_VERIFIED | 0 | 0 | 19 | `artifacts/proofs/core-checks/database-registry-120-jacobian.standalone.core-check.lean` |
| ricis-backend-exact-reduction | LEAN_VERIFIED | 0 | 0 | 22 | `artifacts/proofs/core-checks/ricis-backend-exact-reduction.standalone.core-check.lean` |
| ricis-chatbot-monetization | LEAN_VERIFIED | 0 | 0 | 2 | `artifacts/proofs/core-checks/ricis-chatbot-monetization.core-check.lean` |
| ricis-general-resolution | LEAN_VERIFIED | 0 | 0 | 3 | `artifacts/proofs/mathlib-checks/ricis-general-resolution.mathlib-check.lean` |
| ricis-jacobian-conjecture | NOT_VERIFIED_CORE_ONLY | 1 | 1 | 2 | `artifacts/proofs/core-checks/ricis-jacobian-conjecture.standalone.core-check.lean` |
| ricis-kernel-ast-sp5 | LEAN_VERIFIED | 0 | 0 | 2 | `artifacts/proofs/core-checks/ricis-kernel-ast-sp5.standalone.core-check.lean` |
| ricis-navier-stokes-ast-bridge | LEAN_VERIFIED | 0 | 0 | 2 | `artifacts/proofs/core-checks/ricis-navier-stokes-ast-bridge.standalone.core-check.lean` |
| ricis-riemann-zeta-ast-bridge | LEAN_VERIFIED | 0 | 0 | 2 | `artifacts/proofs/core-checks/ricis-riemann-zeta-ast-bridge.standalone.core-check.lean` |
| ricis-seed-expansion-a11 | LEAN_VERIFIED | 0 | 0 | 6 | `artifacts/proofs/core-checks/ricis-seed-expansion-a11.core-check.lean` |
| ricis-universal-orchestration-template | LEAN_VERIFIED | 0 | 0 | 27 | `artifacts/proofs/core-checks/ricis-universal-orchestration-template.core-check.lean` |
| ricis-v79-monolith | LEAN_VERIFIED | 0 | 0 | 31 | `artifacts/proofs/core-checks/ricis-v79-monolith.standalone.core-check.lean` |

> `outcome` — единственное, что даёт право на статус; `trustBoundary` и `rootCause` каждого
> артефакта читаются в реестре и сюда не переносятся.

## Политика CI: ожидаемые отказы и ожидающие прогоны

- `ciPolicy.expectedFailures` (падение этих целей не рвёт прогон, потому что первопричина зафиксирована): `ricis-jacobian-conjecture`
- ожидает прогона: `ricis-general-resolution-v3` · job `mathlib-kernel-check` · статус PENDING_KERNEL_RUN
- ожидает прогона: `ricis-yang-mills` · job `mathlib-kernel-check` · статус PENDING_KERNEL_RUN
- `sorryAx` в скопилированном файле рвёт прогон всегда — ожидаемый отказ его не легализует.

## Что этот отчёт не делает

- не повышает и не понижает ни один `trustStatus`, `outcome` или статус узла карты;
- не содержит выводов о классических гипотезах (Риман, Навье–Стокс, якобиан) — прогон ядра
  подтверждает структурные теоремы производной, и граница записана в реестре;
- не заменяет `ACTIVE_TASKS.md` и `artifacts/proofs/README.md`: он даёт сверяемый индекс,
  чтобы этим документам не приходилось пересказывать машиночитаемые поля.
