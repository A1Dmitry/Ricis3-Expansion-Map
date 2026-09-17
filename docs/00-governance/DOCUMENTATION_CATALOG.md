# Documentation Catalog — каноническая структура знаний

**Статус:** нормативный каталог документации для `Ricis3-Expansion-Map`.
**Корневой загрузочный файл:** [`README.md`](../../README.md).
**Machine/agent load contract:** [`AGENTS.md`](../../AGENTS.md) остаётся в корне repository, потому что его имя является стандартной точкой обнаружения для development agents.

## Назначение

Рабочие Markdown-документы собираются в `docs/`, чтобы корень repository содержал только внешний вход, автоматизированный agent contract и файлы, требуемые GitHub/инструментами. Нормативные правила, архитектура, активные спринты, evidence и история имеют отдельные неизменяемые разделы. Перенос сохраняет содержимое документов; изменение расположения не является переинтерпретацией их trust status.

> **Приоритет документов:** явные требования пользователя → [`RICIS_IMMUTABILITY_MANIFEST.md`](RICIS_IMMUTABILITY_MANIFEST.md) (неизменность Core) → `AGENTS.md` → current `README.md` и `docs/00-governance/*` → current architecture/sprint contracts → evidence → historical logs. Историческая запись не отменяет более новый нормативный контракт, но и новый контракт не даёт права переписать уже принятую аксиому задним числом.

| Каталог | Содержимое | Нормативность | Правило использования |
|---|---|---|---|
| `docs/00-governance/` | Strict Development Rules, **Манифест неизменности RICIS-III** (`RICIS_IMMUTABILITY_MANIFEST.md`), Work Patterns (P-01..P-12), RCVAP Autonomous Anti-Tukhta Agile Protocol, RICIS Proof Orchestration Template (2-layer pipeline), contribution/security policies, documentation catalog. | Высокая; манифест неизменности — высшая (не понижается процессными артефактами). | Читать до проектирования или изменения public/security/release boundary; перед любым изменением Core/аксиом — обязательно `RICIS_IMMUTABILITY_MANIFEST.md` и прогон `npm run core:gate`. |
| `docs/00-governance/core-identity.lock.json` | Машиночитаемый реестр идентичности принятых версий Core: `CoreVersion`, `CoreHash`, sha256 источника, хэш каждой аксиомы/протокола, родословная, происхождение, объявленные семантические изменения. | Нормативная фиксация идентичности; научных статусов не повышает. | Не править вручную ради прохождения гейта; новая версия добавляется только через `npm run core:seal` с заполненным происхождением. |
| `docs/00-governance/tps/` | Рабочий процесс по шаблону Toyota: машиночитаемая доска потока `board.json`, генерируемые `BOARD.md` (витрина) и `FINDINGS_DIGEST.md` (индекс находок и прогонов, источник — `artifacts/proofs/core-checks/kernel-findings.json`), A3 и хансей-заметки. Стандарт — `TOYOTA_TPS_WORKING_SYSTEM.md`. | Процессная нормативность, нулевая научная. | Сверять состояние потока перед началом карточки (`npm run tps:gate`); витрину не править руками; доска не меняет и не повышает trustStatus. |
| `docs/01-architecture/` | DDD/SOLID/DRY plans, structural-hash reports, design contracts. | Высокая после утверждения соответствующего шага. | Не начинать implementation по draft без явного user approval. |
| `docs/02-sprints/` | ЦЕЛЕВАЯ СТРУКТУРА (в дереве отсутствует): Active and planned sprint specifications, acceptance criteria, implementation dependencies. Фактически содержание живёт в `ACTIVE_TASKS.md` (корень), `docs/05-evidence/` и `artifacts/proofs/README.md`; каталог не создан. | Контекстно высокая. | Сопоставлять со статусом и датой; закрытый sprint не является current runtime fact. |
| `docs/03-quality/` | ЦЕЛЕВАЯ СТРУКТУРА (в дереве отсутствует): QA baselines, findings, regression/release evidence summaries. Фактически содержание живёт в `ACTIVE_TASKS.md` (корень), `docs/05-evidence/` и `artifacts/proofs/README.md`; каталог не создан. | Фактическая на дату проверки. | Не переносить исторический PASS на изменённый codebase. |
| `docs/04-history/` | ЦЕЛЕВАЯ СТРУКТУРА (в дереве отсутствует): Chronological task and agile logs. Фактически содержание живёт в `ACTIVE_TASKS.md` (корень), `docs/05-evidence/` и `artifacts/proofs/README.md`; каталог не создан. | Ненормативная история. | Использовать только для provenance, chronology и recovery of previous intent. |
| `docs/05-evidence/architecture/` | Audits, incident analysis, structural evidence. | Evidence, не implementation instruction. | Извлекать только подтверждённые факты и открытые ограничения. |
| `docs/05-evidence/proofs/` | Lean/Mathematical verification records. | Trust-bounded evidence. | Никогда не повышать claim status сверх явно записанного kernel/trusted evidence. |
| `docs/06-canonical-template/` | ЦЕЛЕВАЯ СТРУКТУРА (в дереве отсутствует): Compressed application blueprint и reusable checklists. Фактически содержание живёт в `ACTIVE_TASKS.md` (корень), `docs/05-evidence/` и `artifacts/proofs/README.md`; каталог не создан. | Шаблонный нормативный reference. | Использовать при создании нового приложения; адаптировать к domain, не копировать security claims без проверки. |

## Корневой минимум

После миграции в корне остаются:

| Файл | Причина |
|---|---|
| `README.md` | Единственный публичный и human-readable загрузочный файл; он ведёт в `docs/`. |
| `AGENTS.md` | Основной machine-readable development contract и точка автоматического обнаружения. |
| `LICENSE`, `CITATION.cff`, `package.json`, lockfile и CI configuration | Platform/release metadata, а не рабочая documentation corpus. |

`README.md` указывает, что все подробные Markdown-документы находятся в [`docs/`](../../README.md#документация-и-строгие-правила-разработки), а `AGENTS.md` ссылается на current governance/documentation catalog. Дублирующих root-level copies не остаётся.

## Миграционные инварианты

1. Любой перемещённый документ сохраняет историю Git через `git mv`; удаление и массовое переписывание текста запрещены.
2. Все internal Markdown links обновляются на относительные new locations; проверка broken links обязательна до commit.
3. `AGENTS.md` и `README.md` не перемещаются. Их ссылки обновляются минимально и не меняют semantic project claims.
4. Proof evidence не редактируется по существу при каталогизации. Source hashes, toolchain, compiler output и trust labels сохраняются.
5. Untracked current sprint documents входят в catalog как новые files; они не смешиваются с historical logs.
6. `docs/06-canonical-template/` не объявляет конкретный provider, price, proof or deployment fact; он задаёт only capabilities, contracts, acceptance criteria и explicit implementation gates.

> **Пока-ёке каталога (с 2026-09-15, андон A-0001):** строки вида `` `docs/…/` `` сверяются с деревом машиной — `npm run tps:gate` (`tools/tpsStandardWork.ts`). Путь, которого нет, обязан нести маркер `ЦЕЛЕВАЯ СТРУКТУРА`, иначе CI падает: каталог не может описывать несуществующее как фактическое. Тот же гейт проверяет все относительные markdown-ссылки репозитория (битая ссылка = падение, андон A-0002).

## Проверка завершения

Каталог считается готовым, только если выполнены все условия:

- корень содержит только `README.md` и `AGENTS.md` из Markdown corpus;
- каждый прежний Markdown file доступен ровно по одному versioned path в `docs/`;
- `git diff --check`, Markdown-link validation, TypeScript lint/test/build не имеют regressions;
- root loader приводит пользователя к catalog и Strict Development Rules;
- canonical template включает identity, consent, session, payment/entitlement, document export, feature tiers, audit, observability, privacy and security boundaries.
