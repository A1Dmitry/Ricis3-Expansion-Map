import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const modulePath = join(here, 'sqliteFirstWorkspaceRepositoryTemplate.ts');
const moduleName = 'sqliteFirstWorkspaceRepositoryTemplate.ts';

function sourceIfImplemented(): string | null {
  return existsSync(modulePath) ? readFileSync(modulePath, 'utf8') : null;
}

describe('G3 topology — SQLite-first workspace repository template', () => {
  it('keeps the exact G3/G4 candidate path topology and requires the approved G4 module', () => {
    const sanctionedPaths = [
      'sqliteFirstWorkspaceRepositoryTemplate.test.ts',
      'sqliteFirstWorkspaceRepositoryTemplate.topology.test.ts',
      moduleName,
    ];

    expect(sanctionedPaths).toEqual([
      'sqliteFirstWorkspaceRepositoryTemplate.test.ts',
      'sqliteFirstWorkspaceRepositoryTemplate.topology.test.ts',
      moduleName,
    ]);
    expect(existsSync(modulePath)).toBe(true);
  });

  it('permits no runtime imports: the future template owns only local contracts and injected adapters', () => {
    const source = sourceIfImplemented();
    if (source === null) return;

    const importStatements = source.match(/^\s*import(?:\s+type)?\s+[^;]+;?\s*$/gm) ?? [];
    expect(importStatements).toEqual([]);
  });

  it('forbids browser persistence, browser capability detection and current client database ownership', () => {
    const source = sourceIfImplemented();
    if (source === null) return;

    expect(source).not.toMatch(/\bindexedDB\b|\blocalStorage\b|\bsessionStorage\b|\bopenDb\b|\bdbSaveMap\b|\bdbLoadMap\b|\bmemoryStores\b|\bpersistence\.ts\b/);
  });

  it('forbids SQLite package/driver, connection string, SQL, schema, filesystem and migration ownership', () => {
    const source = sourceIfImplemented();
    if (source === null) return;

    expect(source).not.toMatch(/\bbetter-sqlite3\b|\bsqlite3\b|\bnode:sqlite\b|\bCREATE\s+TABLE\b|\bINSERT\s+INTO\b|\bUPDATE\s+\w+\s+SET\b|\bSELECT\s+.+\s+FROM\b|\bPRAGMA\b|\bWAL\b|connectionString|databasePath|node:fs|writeFileSync|mkdirSync|migration/i);
  });

  it('forbids server route, transport, environment, network and composition ownership', () => {
    const source = sourceIfImplemented();
    if (source === null) return;

    expect(source).not.toMatch(/\bexpress\b|\brouter\b|\bHTTP\b|\bfetch\s*\(|XMLHttpRequest|WebSocket|process\.env|listen\s*\(|server\.ts|compose|composition/i);
  });

  it('forbids account, session, proof/trust authority and RICIS/Lean/Core ownership', () => {
    const source = sourceIfImplemented();
    if (source === null) return;

    expect(source).not.toMatch(/accountId|ownerId|role|sessionRef|proofStatus|LEAN_VERIFIED|resolved|trust|authority|Ricis\.Core|\bLean\b|resolveRicis|solveNodeLogic/i);
  });

  it('forbids retry, fallback, engine switching and in-memory production selection', () => {
    const source = sourceIfImplemented();
    if (source === null) return;

    expect(source).not.toMatch(/retry|fallback|postgres|mssql|mongo|memory|lastWriter|last-writer|defaultStorage|storageKind/i);
  });

  it('requires the G2 factory, repository and terminal result vocabulary once G4 creates the module', () => {
    const source = sourceIfImplemented();
    if (source === null) return;

    expect(source).toContain('createSqliteFirstWorkspaceRepositoryTemplate');
    expect(source).toContain('WorkspacePersistenceRepository');
    expect(source).toContain('SqliteConnectionAdapter');
    expect(source).toContain("kind: 'sqlite'");
    expect(source).toContain("kind: 'invalid_configuration'");
    expect(source).toContain("kind: 'server_unavailable'");
  });
});
