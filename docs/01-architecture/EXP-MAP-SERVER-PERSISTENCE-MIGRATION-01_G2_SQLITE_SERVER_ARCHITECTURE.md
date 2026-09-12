# EXP-MAP-SERVER-PERSISTENCE-MIGRATION-01 — G2: Server-Owned SQLite Architecture

**Status:** `ARCHITECTURE_ONLY — implementation requires G3 valid-red approval`
**Scope owner:** RICIS III / Ricis3-Expansion-Map
**Parent decision:** [`EXP-MAP-SERVER-PERSISTENCE-MIGRATION-01_G1_DECISION_2026-08-27.md`](../../../../ricis_review/EXP-MAP-SERVER-PERSISTENCE-MIGRATION-01_G1_DECISION_2026-08-27.md) (external continuity record)
**Published baseline:** `main` `df0f3665dfad1c63aeb8b0fbd217b43cd8c17d5d`
**Requested architecture:** browser persistence → server-owned workspace persistence, with SQLite as the selected first database engine.

## 1. Binding decision

> **The browser does not own the durable RICIS workspace after cutover.** It uses a high-level HTTPS application API. A separately deployed single Node/Express application server owns an SQLite file located on the same server-local durable volume. GitHub Pages continues to serve only the static user interface.

GitHub Pages publishes static HTML, CSS and JavaScript from repository content and is therefore not an execution location for a persistent server process or a database file.[1] SQLite is used only through an application server colocated with the database file. Browser clients never mount, download, open or issue generic SQL against the file. This follows SQLite’s documented application-server model and avoids its network-filesystem and one-writer limitations.[2]

This document defines contracts only. It creates **no** database driver, schema migration, SQLite file, server process, route, cookie, secret, deployment, browser transfer, background job, provider activation, account record, data retention or user-interface behavior.

## 2. Non-negotiable RICIS and authority invariants

The database is a durable representation boundary, not an ontology, proof engine or authority. It cannot reinterpret RICIS expressions, replace typed F/G, flatten parent expression indexes, invoke limit/L’Hôpital/NaN fallback, mutate a source artifact or decide proof truth.

| Invariant | Required treatment at the persistence boundary |
|---|---|
| **L0 / L1 identity** | Every stored source identifier, canonical SHA-128 node identity, alias, typed expression payload and provenance is preserved exactly. Neither storage nor migration derives identity from title, position, display text or a scalar projection. |
| **SP1–SP4 and A1/A4/A5/A6/A7/A10** | RICIS semantics stay in the existing domain/Core boundary. SQLite stores a validated snapshot; it never applies an algebraic or singularity operation. |
| **Source / proof / trust separation** | A stored proof/evidence projection retains its declared source and status without promotion, demotion or fabrication. Database success, import success and account ownership are not Lean kernel evidence, a mathematical proof or a trust/authority decision. |
| **Authority boundary** | Browser-provided account, role, workspace ownership, proof state, provider/model choice, resolver output or claimed entitlement is non-authoritative. The server resolves all access scope through injected ports. |
| **Fail closed** | Missing server, session, workspace scope, durable volume, transaction, schema, integrity or policy returns a typed unavailable/denied/conflict/rejected outcome. Post-cutover it never writes the same operation to IndexedDB, `localStorage` or in-memory fallback. |

## 3. Runtime topology and responsibility split

```text
Ricis3-Expansion-Map static browser client (GitHub Pages)
  │  opaque session credential + client-safe request DTO
  ▼
HTTPS Persistence API
  ▼
Server composition root
  ├─ ServerOwnedWorkspaceScopeResolver
  ├─ WorkspacePersistenceApplicationService
  ├─ SnapshotIntegrityValidator / canonical migration policy
  ├─ RedactedAuditSink
  └─ SqliteWorkspacePersistenceAdapter
          │
          ▼
  SQLite file on the same server-local durable volume
```

The composition root receives host/session infrastructure and injects ports. The persistence application service receives an already server-resolved account/workspace scope and never accepts a browser-provided account or ownership claim. The SQLite adapter is the only future module permitted to issue parameterized SQL. The browser retains a memory projection and explicit JSON download/export capability; it has no durable alternative write path after the server cutover.

| Layer | May do | Must not do |
|---|---|---|
| Browser UI/store | Render safe snapshot DTOs; make explicit read/write/import/export requests; hold unsaved in-memory edits. | Open SQLite; retain a server credential; infer owner; automatically upload legacy stores; fall back to durable browser write after a server failure. |
| HTTP adapter | Parse bounded DTO; map transport to typed application outcome; set/forward only the approved opaque session mechanism. | Embed business authorization; serialize raw cookie/credential into logs; expose SQL/schema diagnostics. |
| Scope resolver | Resolve authenticated account and selected workspace from server-owned session/context; return typed denial/unavailable. | Trust client `accountId`, role or workspace owner; construct proof status; call provider/Lean/Core. |
| Application service | Validate request shape; enforce workspace revision and migration policy; invoke persistence port exactly once; emit redacted audit intent/outcome. | Generate SQL; keep secret; change RICIS/proof authority; retry into a different storage path. |
| SQLite adapter | Atomically save/load a scope-bound workspace snapshot with parameterized statements and short transaction. | Be network-shared by clients; expose generic query API; decide authorization or RICIS semantics. |

## 4. Typed contract surface

The following are **architecture signatures**, not source files. Names are deliberately narrow so that future tests can enforce ownership and topology before implementation.

```ts
/** Server-only opaque brands; no browser value may create these. */
type AccountId = string & { readonly __brand: 'server-account-id' };
type WorkspaceId = string & { readonly __brand: 'server-workspace-id' };
type WorkspaceRevision = number & { readonly __brand: 'workspace-revision' };
type OpaqueSessionRef = string & { readonly __brand: 'opaque-session-ref' };

/** Existing source-preserving persistence payload, versioned at its envelope. */
type WorkspaceSnapshotV1 = PersistedSnapshot;

interface ServerOwnedWorkspaceScope {
  readonly accountId: AccountId;
  readonly workspaceId: WorkspaceId;
  readonly sessionRef: OpaqueSessionRef;
  readonly policyVersion: string;
}

type WorkspaceScopeResolution =
  | { readonly kind: 'resolved'; readonly scope: ServerOwnedWorkspaceScope }
  | { readonly kind: 'requires_authentication' | 'access_denied' | 'server_unavailable' };

interface ServerOwnedWorkspaceScopeResolver {
  resolve(input: Readonly<{ session: unknown; requestedWorkspace: unknown }>): Promise<WorkspaceScopeResolution>;
}

type WorkspaceLoadOutcome =
  | { readonly kind: 'loaded'; readonly revision: WorkspaceRevision; readonly snapshot: WorkspaceSnapshotV1 }
  | { readonly kind: 'not_found' | 'access_denied' | 'server_unavailable' | 'integrity_rejected' };

type WorkspaceCommitOutcome =
  | { readonly kind: 'committed'; readonly revision: WorkspaceRevision; readonly savedAt: string }
  | { readonly kind: 'revision_conflict'; readonly currentRevision: WorkspaceRevision }
  | { readonly kind: 'access_denied' | 'server_unavailable' | 'integrity_rejected' | 'migration_required' };

interface WorkspacePersistencePort {
  load(scope: ServerOwnedWorkspaceScope): Promise<WorkspaceLoadOutcome>;
  commit(input: Readonly<{
    scope: ServerOwnedWorkspaceScope;
    expectedRevision: WorkspaceRevision;
    snapshot: WorkspaceSnapshotV1;
    migrationReceipt: string | null;
  }>): Promise<WorkspaceCommitOutcome>;
}

interface ServerPersistenceAuditSink {
  record(event: Readonly<{
    action: 'workspace_load' | 'workspace_commit' | 'workspace_import';
    accountRef: string;
    workspaceRef: string;
    outcome: string;
    revision: number | null;
    correlationId: string;
  }>): void;
}
```

`PersistedSnapshot` remains the compatibility envelope already used by the application. It carries nodes, edges, zones, axioms, proofs, save time and aliases. It does **not** acquire an authoritative proof result by moving into SQLite. The server stores the envelope atomically only after the existing canonical identity and graph-integrity validation boundary reports an acceptable result.

## 5. Client-safe API contracts

Routes are specified here only to control future implementation. The HTTP adapter may expose equivalent versioned routes, but it may not widen fields or introduce a generic SQL endpoint.

| Operation | Client-safe request | Server-owned inputs | Response / failure |
|---|---|---|---|
| `GET /api/workspaces/current/snapshot` | Optional selected-workspace reference with bounded syntax only. | Opaque session → account/workspace scope. | `loaded` snapshot + revision; `requires_authentication`, `access_denied`, `not_found` or `server_unavailable`. |
| `PUT /api/workspaces/current/snapshot` | `expectedRevision`, `snapshot`, client correlation ID. | Session/account/workspace, policy, canonical validation and transaction. | `committed` revision or typed conflict/rejection; never raw SQL error. |
| `POST /api/workspaces/current/imports` | Explicit import intent, snapshot, expected target revision and client correlation ID. | Session/account/workspace, consent/migration policy, validation and transaction. | Typed `imported`, `revision_conflict`, `integrity_rejected`, `migration_required` or availability/authorization result. |
| `GET /api/workspaces/current/export` | No proof/authority override; explicit user action only. | Server-resolved scope and snapshot projection. | Safe portable snapshot; no token, cookie, key, raw audit or hidden server field. |

The browser must omit `accountId`, `ownerId`, entitlement, role, source/proof state override, provider/model configuration, raw SQL, storage path, retention flag and server migration status from these requests. Any unknown top-level field is rejected. Request validation is bounded for bytes, collection sizes, nesting and strings before resolution or persistence.

## 6. SQLite representation and transaction contract

The future physical schema stays internal to the adapter, but its ownership and transaction constraints are contractual.

| Conceptual record | Minimum fields | Integrity / lifecycle |
|---|---|---|
| `workspace_snapshot` | server `workspace_id`, server `account_id`, numeric `revision`, envelope schema version, canonical snapshot payload, `saved_at`, integrity digest | Exactly one current revision per workspace; compare-and-commit with `expectedRevision`; save is atomic. |
| `workspace_migration_receipt` | opaque receipt ID, workspace reference, source schema, target schema, redacted counts, timestamps and outcome | Append-only observational migration evidence; not proof/trust authority. |
| `workspace_audit_event` | opaque account/workspace references, action, outcome code, revision, correlation ID, time | Redacted, no raw snapshot, provider token, cookie/session value, credential, private proof payload or SQL text. |
| `workspace_tombstone` | opaque workspace reference, lifecycle/deletion time and policy reference | Explicit owner/policy process only; no silent deletion. |

The adapter runs a short transaction for commit/import: resolve expected revision, validate the server-side scope, write one new snapshot revision plus a redacted event/receipt, then commit; any failure rolls back the full transaction. SQLite’s one-writer characteristic is handled by this single server-process model, short writes and typed conflict/unavailable outcomes—not by a client-side write retry or a second browser store.[2]

## 7. Hydration, migration and rollback

Current client hydration is `IndexedDB → legacy localStorage → canonical seed + SHA-128 migration/audit`. The new lifecycle separates historic recovery input from authoritative server persistence:

```text
pre-cutover browser IndexedDB / explicit JSON file
  → explicit user-visible import consent
  → server-owned session and workspace resolution
  → structural-envelope validation
  → SHA-128 canonical identity reconciliation + graph integrity audit
  → single SQLite transaction + revisioned migration receipt
  → safe server snapshot response
  → browser memory projection
```

No browser-resident database is automatically uploaded, deleted or made a parallel writer. During a bounded owner-defined migration window it is an explicit read-only recovery source. An imported snapshot that conflicts, has unknown identity/migration version, violates structural integrity, contains an unapproved field or fails validation is rejected without partial server write. The UI can offer explicit JSON export before and after migration as a user-controlled backup transport, but export cannot be treated as a server restore, durable migration receipt or proof authority.

Rollback means restoring a previously verified server snapshot/revision through an explicit server policy and an auditable transaction. It never silently reactivates IndexedDB/localStorage, overwrites a newer workspace revision or rebuilds structural identity from display properties. Backup medium, encryption, retention schedule and recovery operator are outside this G2 and must be selected before G4.2 adapter deployment.

## 8. Failure taxonomy and no-fallback rules

| Event | Required external outcome | Prohibited substitute |
|---|---|---|
| Static Pages has no reachable persistence server | `server_unavailable` | Save to browser durable storage while presenting success. |
| No opaque session or invalid session | `requires_authentication` / `access_denied` | Browser identity, email/display name or client role fallback. |
| Scope resolver cannot determine ownership | `access_denied` / `server_unavailable` | First/default workspace selection or client-supplied owner. |
| Revision differs | `revision_conflict` with safe current revision only | Last-writer-wins overwrite or silent merge. |
| Snapshot/identity validation fails | `integrity_rejected` / `migration_required` | Coercion, title-based deduplication or source/proof rewriting. |
| SQLite or durable volume fails | `server_unavailable` | In-memory acceptance, browser database fallback or retry to another unapproved store. |
| Audit sink fails | Fixed redacted non-authoritative audit outcome; persistence policy must decide fail-closed requirement in G3 | Logging raw snapshot, credential or proof payload. |

## 9. Explicit exclusions and dependencies

This G2 does not authorize the following: SQLite npm package/driver, SQL strings, migrations, an Express route, HTTP client, cookie/session implementation, account table, authentication provider, CORS config, deployment platform, server volume, backup, secret, encryption key, CI secret, user-data transfer, browser UI, automatic local data cleanup, provider call, Agent Gateway resolver, Ricis.Core/WASM/Lean modification or proof/trust/authority state change.

The existing durable-auth draft remains the separate prerequisite for production opaque sessions, accounts, entitlement and protected token storage. Its rules for server-only secret paths, opaque browser session references and no silent browser fallback are adopted here, not duplicated or relaxed.[3]

## 10. Required G3 test-only contract

A separate approval may create **only** the G3 QA specification/tests and, if necessary, a narrow OIR admission for their exact paths. It must establish a valid-red state before any production module exists and must test all of the following:

| QA class | Required assertion |
|---|---|
| Topology | No browser persistence implementation/import is reachable from the future server persistence service; SQLite adapter is server-only; no generic SQL, provider, Lean/Core, proof-authority or browser fallback import. |
| Ownership | Client `accountId`, role, workspace owner, entitlement and proof status cannot reach the resolver or persistence port. Resolver-produced scope is passed with exact identity. |
| Availability | Static host, missing session, missing resolver, missing durable store and transaction failure yield typed terminal outcomes; no retry/fallback/parallel write. |
| Concurrency | Exact `expectedRevision` conflict prevents overwrite; no last-writer-wins. |
| Identity | Snapshot/aliases/canonical SHA-128 relationships are not regenerated from labels; invalid/mixed identity input causes no write. |
| Authority | Save/import/load cannot promote/demote `resolved`, `LEAN_VERIFIED`, proof or trust state, and cannot claim Lean execution. |
| Migration | No auto-upload; explicit import intent is required; server validates before transaction; failure leaves no partial record. |
| Redaction | Audits/DTO/errors omit cookie, token, raw snapshot/proof content, SQL and secret material. |

## 11. Next approval gate

The next permitted work is test-only and requires separate owner authorization:

```text
OK EXP-MAP-SERVER-PERSISTENCE-MIGRATION-01 G3-SQLITE-SERVER-QA
```

That approval does **not** authorize a database, server, storage volume, SQL driver, route, user-data import, deployment or client cutover. Those are later separately gated increments.

## References

[1]: [GitHub Docs — What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
[2]: [SQLite — Appropriate Uses for SQLite](https://sqlite.org/whentouse.html)
[3]: [Ricis.Auth durable persistence business specification](https://github.com/A1Dmitry/Ricis3-Expansion-Map/blob/main/docs/02-sprints/SPRINT_AUTH_DURABLE_PERSISTENCE_STEP1_BUSINESS_SPEC.md)
[4]: [Current client persistence module](https://github.com/A1Dmitry/Ricis3-Expansion-Map/blob/main/src/model/persistence.ts)
