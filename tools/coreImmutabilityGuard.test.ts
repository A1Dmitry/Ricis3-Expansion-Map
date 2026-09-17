// @vitest-environment node
/**
 * Guards for the Core immutability layer (docs/00-governance/RICIS_IMMUTABILITY_MANIFEST.md).
 *
 * Two halves, both mandatory (same discipline as tools/tpsStandardWork.test.ts):
 * 1. Positive: the real repository state matches the sealed identity registry.
 * 2. Mutation: every rule is proven falsifiable by rewriting an accepted axiom in memory and
 *    requiring exactly the violation code that must fire. RCVAP forbids a verifier that cannot
 *    fail — a green guard nobody can redden is decoration, not evidence.
 *
 * The mutation half works on temporary copies of the repository layout; the real Core documents
 * are never written to, because the guard's own tests must not be able to edit the Core.
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  CORE_DOCUMENT_PATHS,
  CORE_LOCK_PATH,
  REQUIRED_PROVENANCE_FIELDS,
  canonicalize,
  computeCoreIdentity,
  isConservativeExtension,
  loadLock,
  readCoreEntryValues,
  sha256,
  stopViolations,
  validateCoreImmutability,
  validateLockIntegrity,
  validateSealedVersion,
  validateSemanticContinuity,
  type CoreIdentityLock,
  type SealedCoreVersion,
} from './coreImmutabilityGuard';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function codesOf(violations: readonly { code: string }[]): string[] {
  return [...new Set(violations.map((violation) => violation.code))].sort();
}

/** Materialize a throwaway repository containing only what the guard reads. */
function withSandbox(mutate: (root: string) => void): ReturnType<typeof validateCoreImmutability> {
  const root = mkdtempSync(join(tmpdir(), 'ricis-core-guard-'));
  try {
    for (const relativePath of [...CORE_DOCUMENT_PATHS, CORE_LOCK_PATH]) {
      const target = join(root, relativePath);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(join(repositoryRoot, relativePath), 'utf8'), 'utf8');
    }
    mutate(root);
    return validateCoreImmutability(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function readJson(root: string, relativePath: string): Record<string, any> {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8')) as Record<string, any>;
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  writeFileSync(join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const SEED_DOCUMENT = CORE_DOCUMENT_PATHS[1];
const VECTOR_DOCUMENT = CORE_DOCUMENT_PATHS[0];

describe('canonicalization and hashing', () => {
  it('is independent of key order, so formatting cannot change a Core identity', () => {
    expect(canonicalize({ b: 1, a: [1, { d: 2, c: 3 }] })).toBe(canonicalize({ a: [1, { c: 3, d: 2 }], b: 1 }));
    expect(sha256(canonicalize({ b: 1, a: 2 }))).toBe(sha256(canonicalize({ a: 2, b: 1 })));
  });

  it('distinguishes a rewritten statement from the original', () => {
    expect(canonicalize({ statement: 'X = X' })).not.toBe(canonicalize({ statement: 'X = Y' }));
  });
});

describe('conservative extension predicate (manifest §17)', () => {
  it('accepts added keys and appended list items', () => {
    expect(isConservativeExtension({ a: 1 }, { a: 1, b: 2 })).toBe(true);
    expect(isConservativeExtension({ list: ['x'] }, { list: ['x', 'y'] })).toBe(true);
  });

  it('rejects a replaced value, a removed key, a truncated list and a reordered list', () => {
    expect(isConservativeExtension({ a: 1 }, { a: 2 })).toBe(false);
    expect(isConservativeExtension({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    expect(isConservativeExtension({ list: ['x', 'y'] }, { list: ['x'] })).toBe(false);
    expect(isConservativeExtension({ list: ['x', 'y'] }, { list: ['y', 'x'] })).toBe(false);
  });
});

describe('repository state (positive half)', () => {
  it('seals every Core document present in the tree', () => {
    const { lock, error } = loadLock(repositoryRoot);
    expect(error).toBe('');
    expect(lock).not.toBeNull();
    const sealed = new Set((lock as CoreIdentityLock).versions.map((record) => record.coreVersion));
    for (const relativePath of CORE_DOCUMENT_PATHS) {
      const identity = computeCoreIdentity(relativePath, readFileSync(join(repositoryRoot, relativePath), 'utf8'));
      expect(sealed.has(identity.coreVersion)).toBe(true);
    }
  });

  it('reports no stop-violations for the current repository', () => {
    const report = validateCoreImmutability(repositoryRoot);
    expect(stopViolations(report.violations)).toEqual([]);
    expect(report.checkedVersions.length).toBe(CORE_DOCUMENT_PATHS.length);
  });

  it('seals the protected foundations, protocols and axioms rather than prose sections', () => {
    const identity = computeCoreIdentity(SEED_DOCUMENT, readFileSync(join(repositoryRoot, SEED_DOCUMENT), 'utf8'));
    const keys = Object.keys(identity.entries);
    expect(keys).toContain('FOUNDATION:L1_IDENTITY');
    expect(keys).toContain('PROTOCOL:SP9_CORE_IMMUTABILITY');
    expect(keys).toContain('AXIOM:core:A1_INDEXING');
    expect(keys).toContain('AXIOM:meta:A11_EXPANDABILITY');
    expect(keys.some((key) => key.startsWith('EXAMPLES'))).toBe(false);
  });

  it('records complete provenance for every sealed version (manifest §14)', () => {
    const { lock } = loadLock(repositoryRoot);
    for (const record of (lock as CoreIdentityLock).versions) {
      for (const field of REQUIRED_PROVENANCE_FIELDS) {
        expect(record.provenance[field].trim().length).toBeGreaterThan(0);
        expect(record.provenance[field].trim()).not.toMatch(/^(TODO|TBD|FIXME|UNKNOWN)$/i);
      }
    }
  });

  it('does not overstate admission status: baseline seals stay SEALED_FROM_REPOSITORY_STATE (manifest §16)', () => {
    const { lock } = loadLock(repositoryRoot);
    for (const record of (lock as CoreIdentityLock).versions) {
      expect(['ADMITTED', 'SEALED_FROM_REPOSITORY_STATE']).toContain(record.admissionStatus);
      if (record.admissionStatus === 'ADMITTED') {
        expect(record.provenance.admission).not.toMatch(/SEALED_FROM_REPOSITORY_STATE/);
      }
    }
  });
});

describe('mutation half: rewriting an accepted axiom must stop the line', () => {
  it('CORE_ENTRY_MUTATED — an accepted axiom is edited in place (manifest §1)', () => {
    const report = withSandbox((root) => {
      const doc = readJson(root, SEED_DOCUMENT);
      doc.RICIS_Unified_Complete_Document.AXIOMS.core.A1_INDEXING = 'F/0 -> 0 (удобнее для доказательства)';
      writeJson(root, SEED_DOCUMENT, doc);
    });
    expect(codesOf(stopViolations(report.violations))).toContain('CORE_ENTRY_MUTATED');
  });

  it('CORE_ENTRY_MUTATED — L1_IDENTITY, the ontological root, is weakened', () => {
    const report = withSandbox((root) => {
      const doc = readJson(root, VECTOR_DOCUMENT);
      doc.RICIS_Unified_Complete_Document.PART_1_ABSOLUTE_FOUNDATIONS.L1_IDENTITY.statement = 'X ~ X';
      writeJson(root, VECTOR_DOCUMENT, doc);
    });
    expect(codesOf(stopViolations(report.violations))).toContain('CORE_ENTRY_MUTATED');
  });

  it('CORE_ENTRY_REMOVED — a fundamental protocol is deleted (manifest §1)', () => {
    const report = withSandbox((root) => {
      const doc = readJson(root, SEED_DOCUMENT);
      delete doc.RICIS_Unified_Complete_Document.PART_2_SAFETY_PROTOCOLS.SP9_CORE_IMMUTABILITY;
      writeJson(root, SEED_DOCUMENT, doc);
    });
    expect(codesOf(stopViolations(report.violations))).toContain('CORE_ENTRY_REMOVED');
  });

  it('CORE_ENTRY_ADDED_WITHOUT_SEAL — a new axiom is injected into an accepted version (manifest §5)', () => {
    const report = withSandbox((root) => {
      const doc = readJson(root, SEED_DOCUMENT);
      doc.RICIS_Unified_Complete_Document.AXIOMS.core.A99_CONVENIENT = 'anything -> desired result';
      writeJson(root, SEED_DOCUMENT, doc);
    });
    expect(codesOf(stopViolations(report.violations))).toContain('CORE_ENTRY_ADDED_WITHOUT_SEAL');
  });

  it('CORE_LINEAGE_REWRITTEN — the declared ancestor of a version is changed (manifest §7)', () => {
    const report = withSandbox((root) => {
      const doc = readJson(root, SEED_DOCUMENT);
      doc.RICIS_Unified_Complete_Document.previous_version = '7.7_legacy';
      writeJson(root, SEED_DOCUMENT, doc);
    });
    expect(codesOf(stopViolations(report.violations))).toContain('CORE_LINEAGE_REWRITTEN');
  });

  it('CORE_VERSION_UNSEALED — semantics change while the version name stays the same (manifest §6)', () => {
    const report = withSandbox((root) => {
      const doc = readJson(root, SEED_DOCUMENT);
      doc.RICIS_Unified_Complete_Document.document_version = '8.1_unsealed';
      writeJson(root, SEED_DOCUMENT, doc);
    });
    expect(codesOf(stopViolations(report.violations))).toContain('CORE_VERSION_UNSEALED');
  });

  it('CORE_DOCUMENT_MISSING — an accepted version disappears from the tree (manifest §7)', () => {
    const report = withSandbox((root) => {
      rmSync(join(root, VECTOR_DOCUMENT));
    });
    expect(codesOf(stopViolations(report.violations))).toContain('CORE_DOCUMENT_MISSING');
  });

  it('CORE_LOCK_UNAVAILABLE — the identity registry itself is deleted', () => {
    const report = withSandbox((root) => {
      rmSync(join(root, CORE_LOCK_PATH));
    });
    expect(codesOf(stopViolations(report.violations))).toContain('CORE_LOCK_UNAVAILABLE');
  });

  it('CORE_SOURCE_DRIFT is only a notice when non-normative sections change', () => {
    const report = withSandbox((root) => {
      const doc = readJson(root, SEED_DOCUMENT);
      doc.RICIS_Unified_Complete_Document.EXAMPLES.basic = { added_for_documentation: '1/0 -> infinity_1' };
      writeJson(root, SEED_DOCUMENT, doc);
    });
    expect(stopViolations(report.violations)).toEqual([]);
    expect(codesOf(report.violations)).toContain('CORE_SOURCE_DRIFT');
  });
});

describe('mutation half: the registry cannot certify itself', () => {
  const baseRecord = (): SealedCoreVersion => {
    const { lock } = loadLock(repositoryRoot);
    return JSON.parse(JSON.stringify((lock as CoreIdentityLock).versions[1])) as SealedCoreVersion;
  };

  it('CORE_PROVENANCE_INCOMPLETE — a placeholder provenance field is rejected (manifest §14)', () => {
    const record = baseRecord();
    const broken = { ...record, provenance: { ...record.provenance, why: 'TODO' } };
    const violations = validateLockIntegrity({ lockVersion: '1', manifest: '', boundary: '', versions: [broken] });
    expect(codesOf(violations)).toContain('CORE_PROVENANCE_INCOMPLETE');
  });

  it('CORE_HASH_INCONSISTENT — a hand-edited coreHash does not match its own entry map (manifest §13)', () => {
    const record = baseRecord();
    const broken = { ...record, coreHash: sha256('convenient') };
    const violations = validateLockIntegrity({ lockVersion: '1', manifest: '', boundary: '', versions: [broken] });
    expect(codesOf(violations)).toContain('CORE_HASH_INCONSISTENT');
  });

  it('CORE_VERSION_IDENTITY_REUSED — the same name is sealed with a different Core (manifest §13)', () => {
    const record = baseRecord();
    const twin = { ...record, entries: { ...record.entries, 'AXIOM:core:A1_INDEXING': sha256('other') } };
    const violations = validateLockIntegrity({
      lockVersion: '1',
      manifest: '',
      boundary: '',
      versions: [record, twin],
    });
    expect(codesOf(violations)).toContain('CORE_VERSION_IDENTITY_REUSED');
  });

  it('CORE_LINEAGE_BROKEN — a version claims an ancestor that was never sealed (manifest §7)', () => {
    const record = baseRecord();
    const orphan = { ...record, previousVersion: 'never_sealed_version' };
    const violations = validateLockIntegrity({ lockVersion: '1', manifest: '', boundary: '', versions: [orphan] });
    expect(codesOf(violations)).toContain('CORE_LINEAGE_BROKEN');
  });
});

describe('mutation half: semantic drift across versions (manifest §8, §17)', () => {
  const record = (): SealedCoreVersion => {
    const { lock } = loadLock(repositoryRoot);
    return (lock as CoreIdentityLock).versions[1];
  };

  it('accepts a purely additive next version', () => {
    const previous = { 'AXIOM:core:A1': { statement: 'F/0 -> infinity_F' } };
    const next = { 'AXIOM:core:A1': { statement: 'F/0 -> infinity_F', note: 'clarified' } };
    expect(validateSemanticContinuity(previous, next, record())).toEqual([]);
  });

  it('CORE_UNDECLARED_SEMANTIC_CHANGE — a rule is silently rewritten in the next version', () => {
    const previous = { 'AXIOM:core:A1': { statement: 'F/0 -> infinity_F' } };
    const next = { 'AXIOM:core:A1': { statement: 'F/0 -> 0' } };
    expect(codesOf(validateSemanticContinuity(previous, next, record()))).toEqual([
      'CORE_UNDECLARED_SEMANTIC_CHANGE',
    ]);
  });

  it('CORE_UNDECLARED_SEMANTIC_CHANGE — a rule silently disappears in the next version', () => {
    const previous = { 'AXIOM:core:A1': { statement: 'F/0 -> infinity_F' } };
    expect(codesOf(validateSemanticContinuity(previous, {}, record()))).toEqual([
      'CORE_UNDECLARED_SEMANTIC_CHANGE',
    ]);
  });

  it('CORE_DECLARATION_WITHOUT_RATIONALE — a declared change with an empty justification is rejected', () => {
    const declaring: SealedCoreVersion = {
      ...record(),
      declaredSemanticChanges: [{ entry: 'AXIOM:core:A1', kind: 'REWRITTEN', rationale: 'ok' }],
    };
    const previous = { 'AXIOM:core:A1': { statement: 'F/0 -> infinity_F' } };
    const next = { 'AXIOM:core:A1': { statement: 'F/0 -> 0' } };
    expect(codesOf(validateSemanticContinuity(previous, next, declaring))).toContain(
      'CORE_DECLARATION_WITHOUT_RATIONALE',
    );
  });

  it('every declared change in the real lock corresponds to an actual difference', () => {
    const { lock } = loadLock(repositoryRoot);
    const rawByVersion = new Map<string, string>();
    for (const relativePath of CORE_DOCUMENT_PATHS) {
      const raw = readFileSync(join(repositoryRoot, relativePath), 'utf8');
      rawByVersion.set(computeCoreIdentity(relativePath, raw).coreVersion, raw);
    }
    for (const sealed of (lock as CoreIdentityLock).versions) {
      for (const change of sealed.declaredSemanticChanges ?? []) {
        const currentRaw = rawByVersion.get(sealed.coreVersion);
        const previousRaw = rawByVersion.get(sealed.previousVersion ?? '');
        expect(currentRaw).toBeDefined();
        expect(previousRaw).toBeDefined();
        const previousValue = readCoreEntryValues(previousRaw as string)[change.entry];
        const currentValue = readCoreEntryValues(currentRaw as string)[change.entry];
        // A declaration that describes no real change is documentation noise: it would let a
        // future genuine rewrite hide behind a pre-approved entry name.
        expect(canonicalize(previousValue ?? null)).not.toBe(canonicalize(currentValue ?? null));
      }
    }
  });
});

describe('sealed-version comparison is order independent', () => {
  it('re-serializing a Core document with different key order keeps every hash', () => {
    const raw = readFileSync(join(repositoryRoot, SEED_DOCUMENT), 'utf8');
    const identity = computeCoreIdentity(SEED_DOCUMENT, raw);
    const shuffleKeys = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map((item) => shuffleKeys(item));
      }
      if (typeof value === 'object' && value !== null) {
        const entries = Object.entries(value as Record<string, unknown>).reverse();
        return Object.fromEntries(entries.map(([key, item]) => [key, shuffleKeys(item)]));
      }
      return value;
    };
    const reordered = JSON.stringify(shuffleKeys(JSON.parse(raw)), null, 2);
    const reorderedIdentity = computeCoreIdentity(SEED_DOCUMENT, reordered);
    expect(reorderedIdentity.coreHash).toBe(identity.coreHash);
    const { lock } = loadLock(repositoryRoot);
    const sealed = (lock as CoreIdentityLock).versions.find(
      (candidate) => candidate.coreVersion === identity.coreVersion,
    ) as SealedCoreVersion;
    expect(stopViolations(validateSealedVersion(sealed, reorderedIdentity))).toEqual([]);
  });
});
