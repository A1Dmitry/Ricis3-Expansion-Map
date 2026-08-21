# Documentation Catalog — каноническая структура знаний

**Статус:** нормативный каталог документации для `Ricis3-Expansion-Map`.
**Корневой загрузочный файл:** [`README.md`](../../README.md).
**Machine/agent load contract:** [`AGENTS.md`](../../AGENTS.md) остаётся в корне repository, потому что его имя является стандартной точкой обнаружения для development agents.

## Назначение

Рабочие Markdown-документы собираются в `docs/`, чтобы корень repository содержал только внешний вход, автоматизированный agent contract и файлы, требуемые GitHub/инструментами. Нормативные правила, архитектура, активные спринты, evidence и история имеют отдельные неизменяемые разделы. Перенос сохраняет содержимое документов; изменение расположения не является переинтерпретацией их trust status.

> **Приоритет документов:** явные требования пользователя → `AGENTS.md` → current `README.md` и `docs/00-governance/*` → current architecture/sprint contracts → evidence → historical logs. Историческая запись не отменяет более новый нормативный контракт.

| Каталог | Содержимое | Нормативность | Правило использования |
|---|---|---|---|
| `docs/00-governance/` | Strict Development Rules, Work Patterns, contribution/security policies, documentation catalog. | Высокая. | Читать до проектирования или изменения public/security/release boundary. |
| `docs/01-architecture/` | DDD/SOLID/DRY plans, structural-hash reports, design contracts. | Высокая после утверждения соответствующего шага. | Не начинать implementation по draft без явного user approval. |
| `docs/02-sprints/` | Active and planned sprint specifications, acceptance criteria, implementation dependencies. | Контекстно высокая. | Сопоставлять со статусом и датой; закрытый sprint не является current runtime fact. |
| `docs/03-quality/` | QA baselines, findings, regression/release evidence summaries. | Фактическая на дату проверки. | Не переносить исторический PASS на изменённый codebase. |
| `docs/04-history/` | Chronological task and agile logs. | Ненормативная история. | Использовать только для provenance, chronology и recovery of previous intent. |
| `docs/05-evidence/architecture/` | Audits, incident analysis, structural evidence. | Evidence, не implementation instruction. | Извлекать только подтверждённые факты и открытые ограничения. |
| `docs/05-evidence/proofs/` | Lean/Mathematical verification records. | Trust-bounded evidence. | Никогда не повышать claim status сверх явно записанного kernel/trusted evidence. |
| `docs/06-canonical-template/` | Compressed application blueprint и reusable checklists. | Шаблонный нормативный reference. | Использовать при создании нового приложения; адаптировать к domain, не копировать security claims без проверки. |

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

## Проверка завершения

Каталог считается готовым, только если выполнены все условия:

- корень содержит только `README.md` и `AGENTS.md` из Markdown corpus;
- каждый прежний Markdown file доступен ровно по одному versioned path в `docs/`;
- `git diff --check`, Markdown-link validation, TypeScript lint/test/build не имеют regressions;
- root loader приводит пользователя к catalog и Strict Development Rules;
- canonical template включает identity, consent, session, payment/entitlement, document export, feature tiers, audit, observability, privacy and security boundaries.
