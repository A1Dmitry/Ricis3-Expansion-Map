# Strict Development Rules — anti-hallucination contract

**Статус:** обязательный reusable normative template.
**Назначение:** заставить систему разработки явно отличать факт, предположение, статус, доказательство, runtime result и непройденную проверку.
**Источник:** сжатие project governance, work patterns, DDD plan и trust policy.[1] [2] [3] [4]

> Эти правила уменьшают риск галлюцинаций через проверяемые контракты и evidence gates. Они **не** являются обещанием математической, security или business correctness без фактического запуска независимых проверок.

## 1. Иерархия источников и состояния

| Приоритет | Источник | Правило |
|---|---|---|
| 1 | Явно подтверждённое требование пользователя | Имеет приоритет, если не нарушает безопасность или непротиворечивый contract. |
| 2 | `AGENTS.md` и active security policy | Определяют lifecycle, runtime, trust и secret boundaries. |
| 3 | Current code, tests, lockfile, executed command output | Единственный источник факта о текущем состоянии системы. |
| 4 | Approved architecture/specification | Определяет целевой contract, но не доказывает, что он реализован. |
| 5 | Evidence/report | Доказывает только явно указанную область, command и дату. |
| 6 | Historical log, backlog, draft | Не является current fact и не может молча отменять более новый contract. |

Любое существенное утверждение получает одно из явных состояний: `verified`, `implemented_unverified`, `specified`, `hypothesis`, `blocked`, `rejected` или domain-specific trust status. Нельзя выводить отсутствие ошибки из отсутствия сообщения, а implementation — из существования design document.

## 2. Четыре обязательных gates разработки

| Gate | Допустимый output | Запрещённый переход |
|---|---|---|
| **G1 — Business analysis** | User story, vocabulary, bounded scope, risks, migration effect, acceptance criteria. | Код, dependency change или claim «готово» до approval. |
| **G2 — Architecture** | DDD boundaries, DTO, ports, dependencies, persistence/security model, compatibility contract. | Runtime implementation или direct provider/DB/UI coupling до approval. |
| **G3 — QA design** | Executable positive, negative, boundary, replay, failure and regression tests. | «Тесты потом» или coverage only happy path. |
| **G4 — Implementation and release** | Minimal implementation, passing quality gate, version/release evidence, explicit residual risks. | Promotion of untested code, hidden fallback, silent deletion or unproved status. |

После G1, G2 и G3 необходима явная пользовательская команда **«ОК»** или правки. Следующий gate не начинается от предположения о согласии.[1] [4]

## 3. Contract-first and type-first rules

1. Domain invariant записывается как value object, typed status, discriminated union или explicit precondition; stringly-typed success state запрещён.
2. Каждый public method имеет direct tests на success, rejection, boundary and mutation-protection scenario. Новый public API не добавляется без regression test.
3. `null`, `undefined`, `NaN`, broad `any`, implicit default, raw exception и placeholder не могут означать domain success.
4. Незнакомый input отклоняется controlled typed result; система не исполняет user code, произвольный expression tree или unbounded provider payload.
5. Один canonical derivation/snapshot порождает verification, JSON, academic text, LaTeX and export. Renderer не вправе пересчитывать, исправлять или повышать trust state.[4]
6. Duplicated behavior устраняется через value object, pure service, port or composition. Inheritance разрешено только при доказанном LSP/DDD invariant; similarity alone не является основанием.[3]

## 4. Dependency and side-effect rules

```text
UI / transport / CLI
  -> application use cases
      -> domain aggregates, policies, value objects
          -> ports
              -> infrastructure adapters (database, HTTP, OAuth, filesystem, Core, payment)
```

Domain и application layers не импортируют React, Express, browser storage, provider SDK, SQL driver, global singleton или process environment. Infrastructure adapters получают secrets/configuration только в composition root. Любая side effect имеет port, timeout, redacted failure model и observable audit event.

## 5. Evidence and trust rules

| Status | Допустимо утверждать | Нельзя утверждать |
|---|---|---|
| `LEAN_VERIFIED` | Есть current reproducible kernel evidence. | Что доказаны связанные более широкие claims. |
| `TRUSTED_AXIOM` | Immutable external source принят как explicitly named trusted contract. | Что это self-generated kernel theorem. |
| `REQUIRES_CORE_LEAN` | Есть structural/Core result без current kernel evidence. | `resolved` или формальную теорему. |
| `STATIC_CHECK_PASSED` | Пройдена статическая/структурная проверка. | Runtime, security или kernel correctness. |
| `HYPOTHESIS` | Есть исследовательская формулировка. | Verified conclusion. |
| `REJECTED` | Input/evidence unsupported, malformed или invalid. | Partial promotion до positive result. |

External source не переписывается для «починки». Его hash, provenance, toolchain, executed command, compiler output and axiom report образуют immutable evidence set.[1] [4]

## 6. Security, identity and consent rules

1. Secret, access token, refresh token, private key, biometric data, personal API key и raw sensitive claim не попадают в browser bundle, Git, logs, report payload, error body or telemetry.
2. OAuth sign-in, identity linking, service connection, payment consent and document-data prefill — независимые capabilities; один факт входа не разрешает другой.
3. Face ID-capable login реализуется как WebAuthn/passkey local user verification. Server хранит public credential material and lifecycle metadata only; biometric template и private key не пересекают устройство.
4. Provider profile fields запрашиваются только после explicit, field-scoped, revocable consent. Prefill создаёт editable review-required draft and never automatically writes academic authorship, proof, publication or SEO claim.
5. Payment provider webhook, entitlement issuance and feature enforcement выполняются server-side, idempotently and auditably. UI payment confirmation не является entitlement.
6. Country, locale and provider profile are independent: report culture выбирается explicitly by the user or client-side policy; provider claim does not silently determine academic language.[5]

## 7. Quality, change and release rules

| Изменение | Обязательная проверка |
|---|---|
| Public contract | Direct regression tests, compatibility assessment, API/schema version decision. |
| Functional behavior | Patch version review, lock/version metadata synchronization, changelog/task evidence. |
| Dependency | Registry/engines/peer/vulnerability check, clean install, audit, lint, test, build; never `--force`/`--legacy-peer-deps`. |
| Security-sensitive capability | Threat model, negative/replay/authorization tests, secret scan, redaction verification, manual deployment gate. |
| Documentation structure | Git-preserving move, relative-link validation, no trust-status rewrite. |
| Proof pipeline | Release build, full regressions, API smoke checks and actual Lean evidence where relevant. |

`git commit`, `git push`, a green UI or successful static typing do not prove the underlying domain claim. Quality report records exact command, actual outcome, date, version and remaining limitation.[2] [4]

## 8. Forbidden shortcuts

- Нельзя тихо удалять public members, code or evidence because it appears unused; first create or identify direct coverage and obtain approval for a breaking removal.
- Нельзя convert exception, timeout, missing backend, unsupported provider, Core unavailability or unknown state into successful fallback.
- Нельзя describe a sample, stub, mock, synthetic output or local static parser as external verified fact.
- Нельзя use `TODO`, hardcoded public user text, arbitrary provider scopes, silent account merge by email/name, or price/entitlement inference from UI state.
- Нельзя continue a closed reasoning branch only to generate more text; close it with verified invariant, typed rejection or explicit external-check requirement.[2]

## 9. Completion record

Every completed increment leaves a compact machine- and human-readable record:

```text
requirement -> approved contract -> direct tests -> implementation -> exact quality commands
-> result/status -> version/commit -> residual risk or blocked external prerequisite
```

If any segment is absent, the status is `incomplete`, not `done`.

## References

[1]: [`AGENTS.md`](../../AGENTS.md) — master lifecycle, TypeScript, RICIS and evidence contract.
[2]: [`WORK_PATTERNS.md`](../00-governance/WORK_PATTERNS.md) — reproducible context, validation, release and stop criteria.
[3]: [`DDD_REFACTOR_PLAN.md`](../01-architecture/DDD_REFACTOR_PLAN.md) — dependency direction, SOLID, DRY and structural-hash boundaries.
[4]: [`MD_REVIEW_REQUIREMENTS_2026-08-20.md`](../00-governance/MD_REVIEW_REQUIREMENTS_2026-08-20.md) — reconciled Core/Expansion trust and quality invariants.
[5]: [`SPRINT_AUTH_LIBRARY_STEP2_ARCHITECTURE.md`](../01-architecture/SPRINT_AUTH_LIBRARY_STEP2_ARCHITECTURE.md) — identity, consent, passkey and document-prefill boundaries.
