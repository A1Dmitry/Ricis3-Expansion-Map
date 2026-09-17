# Починка дрейфа витрины TPS для PR #59

Патч: `tps-board-drift-fix.patch`
Целевая ветка: `arena/01a0abc2-ricis3-expansion-map` (PR #59)

## Как применить

```bash
git checkout arena/01a0abc2-ricis3-expansion-map
git pull
git apply /path/to/tps-board-drift-fix.patch
npm ci
npm run tps:gate && npm run tps:board:check && npm run tps:digest:check
git add -A
git commit -m "chore(tps): regenerate board after id collision repair with main"
git push origin arena/01a0abc2-ricis3-expansion-map
```

## Что было не так

`tps:board:check` падал не потому, что кто-то правил `BOARD.md` руками.
`board.json` в PR #59 отстал от `main`: в него не попали записи из
смерженного PR #60 (security lockfile), а в `BOARD.md` они присутствовали —
приехали текстовым слиянием Markdown. Витрина оказалась полнее источника.

Плюс настоящая коллизия идентификаторов: `main` и PR #59 независимо
заняли `TPS-0012`, `K-0014` и `A-0011` под разные работы.

Простая перегенерация `npm run tps:board` на ветке PR давала diff **−19 строк**,
то есть зелёный чек ценой удаления из витрины карточки security,
кайдзена `K-0014`, метрики `security:check` и закрытого андона `A-0011`
(факт, 5 почему, корень, контрмера, 4 ёкотэна).

## Что сделано

`board.json` пересобран поверх версии из `main` (она сохранена целиком),
а собственные записи PR #59 добавлены со сдвигом нумерации:

| было в PR #59 | стало | содержание |
|---|---|---|
| `TPS-0012` | `TPS-0013` | P12: kernel-покрытие 3 артефактов |
| `TPS-0013` | `TPS-0014` | ремонт эпилога генератора, run 35145205870 |
| `K-0014` | `K-0015` | Lean-токены: код против прозы |
| `K-0015` | `K-0016` | квалификация имён по скоупу |
| `A-0011` | `A-0012` | неквалифицированная аксиома внутри неймспейса |

Записи из `main` (`TPS-0012` security lockfile, `K-0014` advisories как
PR-стоп, `A-0011` уязвимый lockfile, метрика `security:check`) остались
на своих номерах и в витрине.

Перекрёстные ссылки на `A-0011` обновлены на `A-0012` в:
`ACTIVE_TASKS.md`, `artifacts/proofs/README.md`,
`artifacts/proofs/core-checks/kernel-findings.json`,
`artifacts/proofs/jacobian-counterexample-full.json`,
`docs/05-evidence/proofs/lean-core-checks-run-2026-09-14.md`,
`scripts/generateLeanCoreChecks.ts`, `scripts/generateLeanMathlibChecks.ts`,
`tools/leanMathlibChecks.test.ts`.

`BOARD.md` и `FINDINGS_DIGEST.md` — только перегенерация
(`npm run tps:board`, `npm run tps:digest`), руками не тронуты.
Workflow и `tps:board:check` не изменялись.

## Прогоны на пропатченном дереве PR #59

| команда | результат |
|---|---|
| `npm run tps:gate` | exit 0 |
| `npm run tps:board:check` | витрина синхронна |
| `npm run tps:digest:check` | сводка синхронна |
| `npm run lint` | exit 0 |
| `npm run release:check` | exit 0 |
| `npm run security:check` | exit 0 |
| `npx vitest run tools/{leanMathlibChecks,leanKernelCoreChecks,tpsStandardWork,findingsDigest}.test.ts` | 78/78 |

Полный `npm test` не прогонялся — его исполнит CI.
