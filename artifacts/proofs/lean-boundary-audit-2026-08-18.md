# Lean boundary audit

**Версия:** 0.4.20
**Дата:** 2026-08-18
**Цель:** установить проверяемую границу между Lean kernel, статическим анализом TypeScript, независимой символьной проверкой и RICIS-черновиком.

## Релиз v0.4.20

Manus-подобный desktop rail для right task panel является UI-композицией и не меняет `LEAN_VERIFIED`, `TRUSTED_AXIOM`, `REQUIRES_CORE_LEAN` или Core-first policy. Все вычислительные trust boundaries остаются прежними.

## Итоговая классификация

| Артефакт или путь | Проверка в текущей среде | Корректный статус |
|---|---|---|
| `database-a6-minimal-core-check.lean` | Lean 4.33.0 компилирует файл; `#print axioms database_a6_bridge` сообщает, что теорема не зависит от аксиом | `LEAN_VERIFIED` **только для минимального typed A6 rewrite** |
| `database-a6-0_5_inf_3.standalone.lean` | Исторический файл требует `Mathlib`; прямой `lean` не может его импортировать в текущей среде | `REQUIRES_CORE_LEAN` локально; предыдущий verification report остаётся историческим evidence, а не текущим run |
| `database-registry-120-jacobian.standalone.lean` | Та же отсутствующая Mathlib-зависимость | `REQUIRES_CORE_LEAN` локально |
| `jacobian-counterexample-full.lean` | Та же Mathlib-зависимость; полный воспроизводимый запуск в sandbox не завершён | `REQUIRES_CORE_LEAN` локально |
| Jacobian determinant и collision witnesses | Независимый SymPy audit ранее подтвердил реальные partial derivatives, determinant `-2` и совпадение образов рациональных witness points | `INDEPENDENT_SYMBOLIC_CHECK`; это не Lean kernel result |
| `trusted_full_jacobian_contract` | В исходнике объявлен явный Lean axiom | `TRUSTED_AXIOM`; downstream theorem обязан показывать эту зависимость |
| Canonical RICIS proof text | TypeScript может проверить форму, placeholder и RICIS-маркеры, но не запускает Lean | `REQUIRES_CORE_LEAN` |

## Исправленные ошибки модулей

### 1. Статический parser не является Lean kernel

`verifyLeanProof` раньше возвращал `isValid: true` для синтаксически корректного текста Lean, и два потребителя могли автоматически переводить node в `resolved`. Теперь `LeanAuditResult` содержит `status`:

| Status | Значение |
|---|---|
| `NOT_LEAN` | Текст не является Lean code |
| `STATIC_CHECK_FAILED` | Локальный parser нашёл ошибку/`sorry` |
| `STATIC_CHECK_PASSED` | Прошёл только локальный text/structure audit |
| `LEAN_VERIFIED` | Зарезервирован для отдельного воспроизводимого kernel run; статический parser никогда его не создаёт |

`logic.ts` и `mapStore.ts` считают node resolved только при `LEAN_VERIFIED`. При `STATIC_CHECK_PASSED` node остаётся `partial` с явным предупреждением. Editor показывает это же ограничение пользователю.

### 2. Canonical proof больше не подделывает Lean status

`buildCanonicalRicisProofLatex` создаёт `RICIS-III структурный черновик` c `REQUIRES_CORE_LEAN`. Он не создаёт Lean theorem и не публикует неподтверждённый statement `P = NP`; тематический текст P-vs-NP имеет `HYPOTHESIS`.

## Воспроизводимость

В sandbox установлен Lean 4.33.0 и Lake 5.0.0. Полная Mathlib cache не поместилась в доступное дисковое пространство: временная загрузка заняла около 4.9 GB и была удалена. Поэтому итоговый локальный status Mathlib-dependent файлов намеренно не повышен.

Чтобы повысить конкретный файл до `LEAN_VERIFIED`, нужен отдельный pin-нутый Lake project с совместимыми `lean-toolchain`, `Mathlib` revision, успешной командой `lake env lean <file>` и сохранённым `#print axioms` output. До этого UI и API должны показывать только `REQUIRES_CORE_LEAN` или `TRUSTED_AXIOM`.

## Контроль

После module fixes успешно выполнены `npm run lint` и Lean-boundary unit test suite (`leanVerifier`, `ricisCoreRules`, `logic`, `mapStore`): 24 tests passed.
