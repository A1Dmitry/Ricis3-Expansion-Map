# Инцидент: RICIS-аудит R-01..R-12 не был связан с существующим ядром

**Дата:** 2026-09-20
**Область:** `packages/ricis-core-ts`
**Историческая задача:** `feat(ricis-core-ts): RICIS-аудит R-01..R-12` (`0.4.227`)
**Текущая версия исправления:** определяется корневым `package.json`
**AUDITOR: SELF (same-pipeline)**

## 1. ORIGINAL GOAL

Добавить предметную модель RICIS-аудита R-01..R-12 и оркестрацию, которая использует существующие `LambdaParser`, `SemanticIndexer`, `AlgebraicSimplifier` и `RicisTypeScriptEngine`. Аудит должен сохранять исходник и трассу, не создавать второй редуктор и не превращать локальный структурный результат в доказательство Lean.

## 2. RESULT

В bounded context `packages/ricis-core-ts/src/audit/` добавлены:

- типизированные контракты отчёта, диагностик, evidence и двенадцати правил;
- каталог правил `R-01`…`R-12`;
- `RicisAuditOrchestrator` с этапами input → parse → SP4 index → Core reduction → report;
- детерминированный fingerprint без сетевых вызовов и без зависимости от времени;
- публичные entry points `audit`, `domain/RicisAudit` и `orchestration/RicisAuditOrchestrator`.

Парсер получил строгую проверку полного потребления входа и поддержку структурных литералов `0_F` и `inf_G`. Никакой JavaScript `Infinity` для индексированной бесконечности не создаётся.

## 3. VERIFICATION

Профильный прогон:

```text
npx tsc --noEmit -p packages/ricis-core-ts/tsconfig.json — PASS
npx vitest run packages/ricis-core-ts — 8 files / 118 tests PASS
```

Новый suite покрывает A4, A6, malformed/trailing input, single Core invocation, immutability, stable fingerprint и отказ для JS `Infinity`.

## 4. POSITIVE RESULTS

- В одном запуске оркестратора `reduce` вызывается ровно один раз.
- `fallbackInvocationCount` фиксирован как `0`.
- `0_F / 0_G` и `0_F * inf_G` проходят через трассу существующего ядра (`A4`/`A6`).
- Отчёт содержит ровно 12 результатов в порядке `R-01`…`R-12`.
- `STRUCTURAL_ONLY` и `leanVerified: false` являются частью модели, а не только текстом документа.
- Источник, нормализованный AST, индексированный AST, результат и trace включены в immutable evidence.

## 5. NEGATIVE RESULTS

Аудит не утверждает наличие kernel/Lean-доказательства. Отсутствие точки SP4 или отсутствие применимого паттерна не маскируется успехом: соответствующие правила получают `SKIPPED`. Некорректный lambda и хвост после корректного выражения отклоняются до обращения к Core.

## 6. TUKHTA FOUND

Обнаружена опасная подмена: наличие интерфейса оркестрации и тестовых mock-объектов могло выглядеть как реализованный аудит, хотя production-доменной модели и реального вызова существующего редуктора не было. Дополнительная подмена — считать JS `Infinity` структурной бесконечностью. Обе лазейки закрыты контрактами и тестами.

## 7. ROOT CAUSES

1. `src/model/orchestrationPipeline.ts` содержал DTO/интерфейсы, но не имел связывающей реализации.
2. Пакет ядра имел редуктор, parser и SP4 indexer отдельно, без bounded-context API для аудита.
3. Парсер мог принять неразобранный хвост, что разрушало source identity.
4. Структурные литералы `0_F`/`inf_G` отсутствовали в parser boundary.

## 8. REPAIRS

- Создана единая модель `RicisAuditRequest` → `RicisAuditEvidence` → `RicisAuditReport`.
- Оркестратор принимает `IRicisReductionEngine`, по умолчанию подключает `RicisTypeScriptEngine`, и не содержит копии правил редукции.
- Введены frozen DTO/arrays, stable FNV-1a-64 fingerprints и безопасные resource-key diagnostics.
- Строгий parser boundary проверяет lambda, токены и полное потребление выражения.
- Добавлены прямые тесты R-01..R-12 и A4/A6 execution paths.

## 9. REMAINING RISKS

- TypeScript Core audit остаётся структурной диагностикой; он не заменяет C# Core или Lean kernel.
- Внешний proof gateway и immutable proof snapshot API не входят в этот bounded context.
- Независимый внешний аудит данного отчёта не выполнялся.

## 10. EVIDENCE

- `packages/ricis-core-ts/src/audit/RicisAuditContracts.ts`
- `packages/ricis-core-ts/src/audit/RicisAuditRules.ts`
- `packages/ricis-core-ts/src/audit/RicisAuditOrchestrator.ts`
- `packages/ricis-core-ts/src/audit/RicisAuditOrchestrator.test.ts`
- `packages/ricis-core-ts/src/parser/LambdaParser.ts`
- `packages/ricis-core-ts/src/engine/RicisEngineContracts.ts`

Команды и результаты приведены в разделе 3; они являются self-pipeline evidence, а не внешней сертификацией.

## 11. FINAL STATUS

`COMPLETED` для локальной задачи доменной модели и оркестрации. `LEAN_VERIFIED` не заявляется.

## 12. CONFIDENCE

`HIGH` для заявленного TypeScript-контракта: типы, профильные тесты и компиляция прошли. `LOW` для любых математических или Lean-утверждений, поскольку они находятся за пределами данного локального аудита.
