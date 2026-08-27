# RICIS-LEAN-PASSPORT-ROUTE-B2-DATA-LIFECYCLE-01 — Durable Metadata-Only Passport Ledger — G2

**Статус:** `G2_APPROVED_DOCUMENTED_AWAITING_G3_APPROVAL`

**Дата:** 2026-08-27 (GMT+3)

**Решение владельца:** `B2 G2: A1; retention 12 months, reviewAt → fail-closed; tombstone none; export manual metadata-only JSON`

**Published prerequisite:** `RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01 v0.4.66`, `main` `0a0ece55ed88c280095b529f25db52e4845fd4ed`
**Основание:** `RICIS-LEAN-PASSPORT-ROUTE-B2-DATA-LIFECYCLE-01_STEP1_BUSINESS_SPEC.md` и `RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01_STEP1_BUSINESS_SPEC.md`.

## 1. Решение G2

Утверждён маршрут **B2-A / A1**: отдельный metadata-only Passport receipt ledger в составе приложения, с единой account/tenant boundary и server-side durable retention. Эта архитектура предназначена только для пользовательской навигации по собственным receipt metadata и их lifecycle. Она не создаёт второй источник истины для RICIS III, Lean, доказательств, source lock, map snapshot, trust/state/axiom policy или author-primary результата.

> **B2 G2 invariant:** запись ledger является закрытой ссылкой на уже существующую immutable source identity. Она никогда не является копией, заменой, проверкой или интерпретацией исходника, доказательства либо RICIS III результата.

В G2 фиксируется policy **12 календарных месяцев** с `createdAt` до `reviewAt`. В момент `reviewAt` ledger обязан стать **fail-closed**: запись больше не доступна для list/read/export/revoke через обычный lifecycle surface. Данные удаляются через server-side TTL/expiry capability не позднее `reviewAt`; если выбранный durable store не может доказуемо обеспечить этот предел, B2 G4 не допускается. Никакой browser-side timer, background agent, silently retained replica или общая map persistence не заменяет TTL boundary.

## 2. Bounded contexts и односторонняя зависимость

| Context | Допустимая ответственность | Явно не принадлежит context |
|---|---|---|
| Account/tenant authorization adapter | Выдать authenticated principal; установить account/tenant owner scope; fail-closed отказать при missing, malformed или unauthorized principal. | Не хранит Lean/source/proof bytes, не выполняет RICIS или Lean, не меняет map/proof/trust/state. |
| Passport receipt lifecycle application | Проверить exact owner scope и locked reference; применить closed lifecycle command; сформировать metadata-only export DTO. | Не выбирает identity provider, не создаёт source lock, не читает source bytes, не отправляет export. |
| Durable receipt ledger adapter | Сохранить только closed receipt envelope, enforce owner scope and TTL; вернуть typed availability/lifecycle result. | Не использует generic map snapshot, localStorage/IndexedDB, Proof/externalLean persistence или arbitrary JSON. |
| Existing source provenance reader | Отдать existing exact `nodeId + sourceFingerprint + sourceLocked: true` reference либо typed rejection. | Не получает ledger write/delete/revoke command. |
| Existing proof/trust/state policy | Сохраняет собственную authority boundary. | Не authorizes ledger receipt and не получает lifecycle side effect. |

Dependency direction remains strictly downstream:

```text
authenticated account/tenant authorization
                 │
                 ▼
Passport receipt lifecycle application ───► metadata-only durable ledger
                 ▲                                  │
                 │                                  ▼
existing exact source-lock reference          TTL/expiry enforcement

No arrow returns to map, Proof, externalLean, source lock, trust/state/axiom policy,
RICIS resolver, Lean/Core/WASM, browser storage or external delivery.
```

## 3. Closed durable receipt envelope

The future durable schema and every transport DTO may contain only the following fields. Field names and literals follow the published P1 domain contract. Unknown fields, source-shaped data and provider-specific identity payloads must be rejected before a ledger write.

```ts
type DurablePassportReceipt = Readonly<{
  receiptId: string;
  receiptVersion: 1;
  tenantId: string;
  accountId: string;
  nodeId: string;
  sourceFingerprint: string;
  sourceLocked: true;
  submittedAt: string;
  displayedTrustStatus: 'REQUIRES_CORE_LEAN' | 'LEAN_VERIFIED' | 'TRUSTED_AXIOM' | 'REJECTED';
  disclosureTier: 'REFERENCE_ONLY';
  retentionClass: 'ACCOUNT_MANAGED';
  createdAt: string;
  reviewAt: string;
  lifecycle: 'ACTIVE' | 'REVOKED' | 'DELETED';
}>;
```

| Field family | Rule | Prohibited additions |
|---|---|---|
| Owner scope | `tenantId` and `accountId` originate only from authenticated principal; client command cannot set or override them. | Name, email, profile, access token, session/cookie value, provider claims, anonymous fallback. |
| Source reference | Exact existing `nodeId`, canonical `sourceFingerprint`, literal `sourceLocked: true` and existing `submittedAt`. | `latex`, `proofLatex`, `currentProof`, `leanSource`, source bytes/name/length, kernel/provider output. |
| Existing display label | `displayedTrustStatus` is opaque reference metadata only. | New trust assertion, `resolved` decision, human decision or verification transition. |
| Retention/lifecycle | `createdAt`, exact `reviewAt`, lifecycle and receipt ID/version. | Hidden analytics, arbitrary payload, open JSON, public URL, externally routable destination. |

`LEAN_VERIFIED` and `TRUSTED_AXIOM` are therefore display literals only. Their presence in a receipt cannot call or imply Lean/lake/elan, Core/WASM, `AuthoritativeProofStatePolicy`, `acceptVerifiedExternalLeanProof`, `submitExternalLeanProof`, `updateProof`, `updateNode` or any proof-state action.

## 4. Retention and expiry policy

| Moment | Ledger policy | Permitted observable result | Forbidden behavior |
|---|---|---|---|
| Create | Explicit authenticated user command validates an existing exact source lock; ledger sets `createdAt` and immutable `reviewAt = createdAt + 12 calendar months`. | `CREATED`, `IDEMPOTENT_REPLAY`, conflict or typed failure. | Implicit write on source lock/submission; inherited browser/map persistence; source read/copy. |
| Before `reviewAt` | Owner-scoped list/read/manual export and explicit revoke/delete may operate under the closed envelope. | Metadata-only result or typed fail-closed failure. | Cross-tenant existence reveal; background export/delivery; authority mutation. |
| At or after `reviewAt` | Server-side durable TTL/expiry boundary removes receipt data no later than `reviewAt`. Remaining access returns a generic non-enumerating fail-closed unavailable/not-found outcome. | No receipt data available through normal ledger commands. | Silent indefinite retention; renewal by default; browser-side delay; automatic transfer to another storage. |
| Revoke before expiry | Lifecycle becomes `REVOKED`; the receipt remains metadata-only until its same `reviewAt`, unless explicitly deleted earlier. | Owner-scoped non-authoritative lifecycle outcome. | Change to source lock, proof, externalLean, trust/state/axiom or RICIS result. |
| Delete before expiry | Ledger removes receipt data immediately. | Non-enumerating owner-scoped result. | Tombstone, shadow log, hidden audit record or upstream deletion. |

There is **no automatic renewal** in this G2. Any later renewal capability would alter the retention decision and requires a new G1/G2 scope. This preserves the approved finite 12-month policy and prevents an implicit indefinite retention loop.

A durable provider is implementation-eligible only if it supports per-record expiry/TTL bound to `reviewAt`, owner-scoped query enforcement, atomic idempotency handling and immediate deletion without residual user-visible tombstone. Provider selection, credentials, deployment and schema code are deliberately outside G2.

## 5. Lifecycle command contract

The persisted lifecycle vocabulary remains compatible with the published P1 contract. Expiry is not a new stored authority state; it is a storage-availability boundary enforced by retention policy.

| Command | Preconditions | Owner-scope behavior | Result | Non-negotiable side effects excluded |
|---|---|---|---|---|
| Create | Authenticated principal; exact locked reference; explicit user gesture; valid closed DTO; `now < reviewAt`. | Scope derives only from principal. | Create/replay/conflict/typed failure. | Source submission, re-hash, proof/map write, verification. |
| List | Authenticated principal; before `reviewAt`. | Query always includes exact account and tenant. | Own metadata only or typed unavailable. | Cross-tenant counts or fuzzy discovery. |
| Read | Authenticated principal; receipt in exact scope; before expiry. | Out-of-scope and absent do not reveal distinction. | Own metadata only or generic non-enumerating failure. | Source/proof display or B1/Lean/Core invocation. |
| Manual JSON export | Authenticated principal; before expiry; explicit user command. | Export query includes exact owner scope. | Closed metadata-only JSON as an in-process response. | Email, webhook, upload, cloud handoff, clipboard/download implementation in G2. |
| Revoke | Authenticated principal; exact scope; `ACTIVE`; before expiry. | Transition includes exact owner scope and idempotency key. | `REVOKED` or typed non-authoritative outcome. | Upstream source/proof/state/trust change. |
| Delete | Authenticated principal; exact scope; explicit `confirmed: true`; before expiry. | Transition/delete includes exact owner scope and idempotency key. | Immediate physical deletion/no tombstone or generic scoped result. | Any audit shadow copy, generic-map delete or source/proof deletion. |

## 6. Export boundary

The approved export is **manual metadata-only JSON**. A later implementation may produce an in-process JSON value only after an explicit account-owner command, exact scope validation and pre-expiry retention check. It cannot send, upload, copy to clipboard, generate a public URL, prefill an external service, trigger a popup, use email/webhook or retain a secondary export copy.

The JSON must consist only of `DurablePassportReceipt` values in the owner scope. It must not include account provider payload, identity token, raw source, proof body, kernel/provider transcript, map snapshot, node graph, trust/state/axiom decision or hidden lifecycle analytics.

## 7. Security and failure semantics

| Threat / failure | Required architecture response |
|---|---|
| Missing/unauthorized/malformed principal | Fail closed before a source-reference or ledger call; no anonymous fallback. |
| Tenant or account mismatch | Return generic non-enumerating failure; never reveal whether a receipt ID exists elsewhere. |
| Missing/mismatched/unlocked source reference | Fail closed; never create a receipt and never read source bytes. |
| Extra/source-shaped receipt field | Reject at closed DTO boundary; do not persist partial metadata. |
| Idempotency replay/conflict | Return typed result from atomic owner-scoped ledger operation; do not duplicate receipts or lifecycle events. |
| Ledger/authorization outage | Return typed unavailable; do not fall back to generic map persistence, browser storage or volatile local cache as a durable substitute. |
| TTL capability missing | B2 G4 is blocked; an implementation cannot substitute silent retention or a client timer. |
| Expired receipt access | Return generic scoped fail-closed unavailable/not-found result; do not restore or disclose the record. |

## 8. Required G3 QA valid-red contract

A later G3 begins only after separate approval. It must be test-only and valid-red against a fresh published baseline, without database/provider/UI implementation. At minimum, its contracts must require absent approved modules to demonstrate:

1. account/tenant scope derives from principal and cannot be supplied by a command;
2. every ledger operation receives both account and tenant scope;
3. no cross-tenant list/read/export/lifecycle enumeration is possible;
4. only the exact closed receipt envelope is accepted;
5. locked reference mismatch/unavailability and source-shaped input fail closed without write;
6. `reviewAt` enforces finite 12-month expiry and generic fail-closed result;
7. delete removes a receipt with no tombstone; revoke affects receipt metadata only;
8. manual export returns only closed metadata JSON before expiry and performs no delivery;
9. replay/conflict/outage remain typed, idempotent and non-authoritative; and
10. no map/proof/source/trust/state/axiom/RICIS/Lean/Core/browser-storage/external-transport dependency or write is introduced.

G3 test paths, candidate inventory and OIR allowlist additions must be separately reviewed. G2 does not authorize those tests, production modules, an identity provider, database schema/migration, server route, UI or any publication of a later implementation.

## 9. Explicit non-claims and exclusions

This architecture decision implements nothing. It adds no code, test, dependency, account provider, OAuth configuration, secret, database/table/schema/migration, server endpoint, UI, browser storage, export delivery, scheduler, webhook, connector, third-party API, Lean/Core/WASM execution, AI/agent action or raw source/proof display.

It preserves RICIS III v7.7 as author-primary and immutable: L0/L1, SP1–SP4, A1/A4/A5/A6/A7/A10, typed F/G semantics, Monoliths, Fractal Law and the owner-authorized P=NP result are not ledger fields, commands or outcomes. No application QA or ledger policy is a mathematical, proof or Lean-kernel verdict.

The quarantined `/home/ubuntu/ricis3-lean-passport-g4` worktree remains prohibited as an implementation, copy, merge, test or design source.

## 10. Next gate

**G2 is documented and approved.** The next permitted activity is a separately approved **G3 QA-first valid-red specification** for this exact A1/12-month/no-tombstone/manual-JSON architecture. It remains test-only. No B2 implementation may start until both G3 and a later G4 have separately passed their gates.

## References

[1]: `docs/02-sprints/passport/RICIS-LEAN-PASSPORT-ROUTE-B2-DATA-LIFECYCLE-01_STEP1_BUSINESS_SPEC.md` — B2-A decision and lifecycle invariants.

[2]: `docs/02-sprints/passport/RICIS-PASSPORT-ACCOUNT-OWNERSHIP-01_STEP1_BUSINESS_SPEC.md` — account/tenant ownership, closed metadata and authority separation.

[3]: `src/passportAccountOwnership/passportAccountOwnership.domain.ts` and `src/passportAccountOwnership/passportAccountOwnership.application.ts` — published `v0.4.66` pure provider-neutral prerequisite boundary.

[4]: `docs/01-architecture/passport/RICIS-LEAN-PASSPORT-ROUTE-B1-01_STEP2_ARCHITECTURE.md` — published B1 ephemeral baseline and non-persistence boundary.
