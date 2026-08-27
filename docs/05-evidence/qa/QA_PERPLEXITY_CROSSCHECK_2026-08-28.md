# QA-сверка анализа Perplexity — 2026-08-28

## Объект проверки

Проверены актуальный `main` ветки `A1Dmitry/Ricis3-Expansion-Map` на commit `089b923`, файл `QA_RECURSIVE_AUDIT_EVIDENCE.json`, исходник `tools/recursiveProductionAudit.ts`, связанный репозиторий `A1Dmitry/RICIS-III-Lean4-Kernel`, а также внешние записи Zenodo.

## Матрица утверждений

| Утверждение анализа | Статус QA | Доказательство или уточнение |
|---|---|---|
| Версия приложения `v0.4.69` | Подтверждено | `package.json` содержит `0.4.69`. |
| В репозитории есть `app/`, `runtime/ricis-core/`, `public/`, `docs/`, `artifacts/`, `import-patches/` | Подтверждено | Каталоги присутствуют в актуальном `main`. |
| В `runtime/ricis-core/` есть Ricis.Core, Console и WebApi | Подтверждено | Присутствуют DLL, XML, runtimeconfig и исполняемые файлы. Наличие бинарников не доказывает факт их использования GitHub Pages. |
| QA evidence содержит 31 узел, 12 рёбер, 21 proof, 0 valid proofs и 0 Lean-verified proofs | Подтверждено | Значения совпадают с `QA_RECURSIVE_AUDIT_EVIDENCE.json`. |
| Все 21 proof отклонены из-за отсутствия ссылки на Lean DOI | Подтверждено как результат текущего audit tool | `recursiveProductionAudit.ts` вызывает `auditProofContent`; это application audit, а не Lean-kernel verification. |
| `10.5281/zenodo.21836220` является Lean-спецификацией | Не подтверждено; найдено несоответствие | DOI `21836220` ведёт на публикацию v6 с PDF/LaTeX по Navier–Stokes и указывает Lean kernel как related software. Фактическая software-запись Lean kernel — `10.5281/zenodo.21529989`. [1] [2] |
| Lean repository содержит только одну теорему и базовые определения | Не подтверждено; анализ занижает объём | В shallow clone обнаружено 1103 строки Lean в модульном ядре, включая `Foundation`, `Identity`, `Index`, `Monolith`, `Reduction`, `Operations`, `Specification`, `Fractal`, `ProtocolEvidence`, audit scripts и release aggregators. Это не доказывает полноту доказательств Millennium Problems, но опровергает формулировку «только одно доказательство» как описание всего репозитория. |
| Ни одна из семи Millennium Problems не имеет Lean-верифицированного proof в приложении | Подтверждено в пределах приложения | QA evidence показывает `leanVerifiedProofs: 0`; это не является независимым математическим заключением о внешних публикациях. |
| Анализ содержит статистику 278 узлов / 159 resolved / 4 available / 115 locked | Требует отдельной сверки | Эти числа не содержатся в `QA_RECURSIVE_AUDIT_EVIDENCE.json`, который описывает отдельный audit input на 31 узел. Нельзя смешивать runtime map statistics и recursive audit statistics без указания источника и снимка данных. |
| Корневой и отдельные node IDs в тексте анализа | Не принимать без live/source cross-check | В проекте действует SHA-128 identity migration; переходы должны использовать canonical node ID. Названия и текст не являются допустимым источником разрешения узла. |

## Проверенный Lean-контракт

Связанный репозиторий содержит официальный `ricis-build-contract.json` с `canonicalTarget: RICIS3_Kernel`, набором bounded contexts и запретом `sorryAx`/`admitAx` для перечисленных аудитов. Скрипты `verify_lean_build_contract.sh`, `verify_modular_kernel_contract.sh` и `verify_canonical_source_contract.sh` завершились успешно. Фактическая команда `lake build` в текущем sandbox невозможна, поскольку Lean/Lake не установлены; поэтому статус machine build здесь не повышается выше `REQUIRES_CI_RUN`.

## Выявленная задача P1

В приложении и доказательных шаблонах присутствует DOI `10.5281/zenodo.21836220` как «Lean 4 Specification», хотя внешняя запись описывает публикацию Navier–Stokes v6. Правильная Lean software-запись — `10.5281/zenodo.21529989`. Нельзя автоматически подменять DOI в доказательствах: сначала требуется решить, должен ли audit проверять ссылку на software release, commit/branch и воспроизводимое kernel evidence. Простая замена URL без изменения критерия доверия была бы косметической и не создала бы Lean-верификацию.

## Итог QA

Анализ Perplexity полезен как список направлений, но не является готовым доказательством. Подтверждены честные границы приложения: текущий recursive audit фиксирует 0 valid и 0 Lean-verified proofs. Одновременно обнаружено DOI-несоответствие и смешение метрик общего графа с метриками audit subset. Следующие работы должны идти по приоритету: исправить provenance Lean reference, отделить application evidence от kernel evidence, затем сделать ID-only связки решений с калькулятором через отдельный согласованный contract.

## References

[1]: https://doi.org/10.5281/zenodo.21836220 — Zenodo v6: RICIS-III publication / Navier–Stokes PDF and LaTeX.

[2]: https://doi.org/10.5281/zenodo.21529989 — Zenodo software: A1Dmitry/RICIS-III-Lean4-Kernel v1.0.0.
