# Аудит Git branches и worktrees — 2026-08-26

**Baseline:** `main = origin/main = GitHub API main = e4a721cf629efe828ae57a921e9a2bcedb5ebb7d`
**Статус main:** clean
**Цель:** выполнить пользовательский запрос на publication-first и проверить, существуют ли актуальные незамерженные ветви.

## 1. Публикационный результат до branch audit

На момент аудита в `main` уже опубликованы все verified repository changes: последний опубликованный commit — `e4a721c` (`merge: CI history baseline checkout`). Main worktree чист, а `HEAD`, `origin/main` и GitHub API имеют одинаковый SHA. В repository нет текущего staged или uncommitted change, который можно безопасно коммитить без создания нового scope.

Внешние G1 документы в `/home/ubuntu/ricis_review` намеренно не входят в repository и не были скопированы/staged: они остаются continuity evidence. Их publication требует отдельного недвусмысленного решения о включении external review records в исходный repository.

## 2. Branch topology

После `fetch --all --prune` нет локальных или remote branches, которые `--no-merged origin/main` классифицирует как незамерженные. Все named feature/integration branches находятся позади `main`; их commits уже доступны через опубликованную историю.

| Группа ветвей | Примеры | Статус |
|---|---|---|
| OIR-03 | `oir-03-source-preserving-audit`, `integration/oir-03-v0.4.52` | Полностью merged, historical only. |
| CALC-EXP-02 | `feature/calc-exp-02-v0.4.53`, `integration/calc-exp-02-v0.4.53` | Полностью merged, historical only. |
| EDU-VIS-01 | `edu-vis-01-monolith-guided-trail`, `integration/edu-vis-01-v0.4.54` | Полностью merged, historical only. |
| COMMUNITY-READINESS-01 | `community-readiness-01-route-a`, `integration/community-readiness-01-v0.4.55` | Полностью merged, historical only. |
| P-10A | `p10a-mobile-layout-coverage`, `integration/p10a-mobile-layout-coverage` | Полностью merged, historical only. |
| CI-HISTORY | `ci-history-baseline-fetch-depth`, `integration/ci-history-baseline-fetch-depth` | Полностью merged, historical only. |

**Решение:** дополнительный merge не нужен и был бы повторным merge уже опубликованных commits.

## 3. Dirty detached worktrees

| Worktree | Baseline / состояние | Classification | Decision |
|---|---|---|---|
| `/home/ubuntu/ricis3-p10a-g3` | detached `1a70ec8`; mobile-layout test byte-identical published feature `8a8624f`; audit test differs only because later CI-HISTORY allowlist is published. | **OBSOLETE_PUBLISHED_COPY** | Не коммитить, не мержить. |
| `/home/ubuntu/ricis3-community-readiness-g3` | detached `b6025c0`; uncommitted early Route A test/domain precursor predates published community feature/integration/main. | **OBSOLETE_PRECURSOR** | Не коммитить, не мержить. |
| `/home/ubuntu/ricis3-expansion-map` | detached `ed5f239`; untracked migration provenance test. Its old assertion expects default audit repair, whereas published OIR-03 counterpart preserves source identity by default. | **STALE_SEMANTIC_CONFLICT** | Не коммитить, не мержить. Requires separately scoped re-evaluation if ever reused. |
| `/home/ubuntu/ricis3-lean-passport-g4` | detached `f8c8260` (2026-08-25); untracked legacy `src/leanPassport/` capture/persistence/source-session code plus stale release metadata. No historical branch contains those files. | **SUPERSEDED_QUARANTINED** | Не коммитить, не мержить. It conflicts with current incident-safe G1: Route B requires a new separate data-ownership/consent scope. |

No worktree was reset, removed, deleted, committed, force-pushed or merged during this audit.

## 4. Follow-up gate

The only unfinished backlog item remains `RICIS-LEAN-PASSPORT-01`, now at `G1_COMPLETE_DECISION_REQUIRED`. Its new G1 offers Route A read-only disclosure or a separate Route B G1. The old dirty Passport worktree is not an eligible starting point.
