# RICIS3-Expansion-Map Documentation Catalog

Подробная Markdown knowledge base находится в этом каталоге. Начинайте с корневого [`README.md`](../README.md) для публичного overview и с [`AGENTS.md`](../AGENTS.md) для обязательного machine-readable development contract.

| Раздел | Содержимое | Когда читать |
|---|---|---|
| [`00-governance/`](./00-governance/) | Documentation catalog, contribution/security policy, strict requirements and reusable work patterns. | Перед любым изменением, dependency/security/release decision. |
| [`01-architecture/`](./01-architecture/) | DDD/SOLID/DRY designs and approved/draft architecture contracts. | После business analysis и до QA/implementation. |
| [`02-sprints/`](./02-sprints/) | Active/planned sprint specifications and acceptance criteria. | Для определения next approved work item. |
| [`03-quality/`](./03-quality/) | QA baseline and findings. | Перед регрессией или trust/status promotion. |
| [`04-history/`](./04-history/) | Chronological task and agile logs. | Только для provenance/recovery, не как current norm. |
| [`05-evidence/`](./05-evidence/) | Architecture and proof evidence with explicit boundaries. | Для проверяемого claim/evidence reading. |
| [`06-canonical-template/`](./06-canonical-template/) | Reusable application blueprint and strict anti-hallucination rules. | При создании нового приложения или нового bounded context. |

> **Navigation rule:** current user requirement → `AGENTS.md` → governance → approved contract → evidence → history. A historical log or draft never silently upgrades a claim or overrides a current rule.

## Start here

1. [`00-governance/DOCUMENTATION_CATALOG.md`](./00-governance/DOCUMENTATION_CATALOG.md) — document status and migration invariants.
2. [`06-canonical-template/STRICT_DEVELOPMENT_RULES.md`](./06-canonical-template/STRICT_DEVELOPMENT_RULES.md) — mandatory implementation gates and anti-hallucination contract.
3. [`06-canonical-template/CANONICAL_APPLICATION_BLUEPRINT.md`](./06-canonical-template/CANONICAL_APPLICATION_BLUEPRINT.md) — reusable modules, feature tiers, authentication, consent, monetization and export model.
