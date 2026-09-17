/**
 * Core immutability poka-yoke for RICIS-III.
 *
 * Enforcement half of `docs/00-governance/RICIS_IMMUTABILITY_MANIFEST.md`. The manifest states
 * that an admitted axiom is part of the system identity and is never rewritten retroactively
 * (§1), that semantics may only grow as `Core + Extension` (§17), that a changed Core must change
 * the version identity (§6, §13) and that every change carries provenance (§14). Until now those
 * were sentences in Markdown; this module turns them into exit codes.
 *
 * What is sealed: `docs/00-governance/core-identity.lock.json` records, per accepted Core version,
 * the source document, its sha256, a canonical `coreHash` and a per-entry hash map over the
 * normative sections (absolute foundations, safety protocols, axiom groups, the fundamental
 * logical structure). A rewrite of any sealed entry inside an already-accepted version is a
 * stop-the-line violation, not a diff to review casually.
 *
 * What this guard does NOT do (honest boundary, manifest §12, §16):
 * - It does not verify that the axioms are true, useful or Lean-verifiable. It compares bytes of
 *   declared semantics against a sealed snapshot.
 * - A green run is evidence of *structural continuity only*. It is not admission, not proof and
 *   not independent verification (`Proposal ≠ Verification ≠ Admission`, manifest §15).
 *
 * Design constraints (AGENTS.md / RCVAP):
 * - Pure functions over a repository root; no app runtime, no network, no Lean toolchain.
 * - Every rule must be falsifiable — `tools/coreImmutabilityGuard.test.ts` mutates a sealed Core
 *   in memory and requires the specific violation code. A guard that cannot fail is decoration.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Sealed identity registry. Hand-reviewed; `--seal` may append versions, never rewrite them. */
export const CORE_LOCK_PATH = 'docs/00-governance/core-identity.lock.json';

/** Normative manifest this guard enforces (referenced in every violation for traceability). */
export const CORE_MANIFEST_PATH = 'docs/00-governance/RICIS_IMMUTABILITY_MANIFEST.md';

/** Core documents under immutability control, in lineage order. */
export const CORE_DOCUMENT_PATHS = [
  'docs/01-architecture/ricis-unified-complete-document-7.9-vector.json',
  'docs/01-architecture/ricis-unified-complete-document-8.0-seed-expansion.json',
] as const;

/** Root key every Core document is wrapped in. */
export const CORE_DOCUMENT_ROOT_KEY = 'RICIS_Unified_Complete_Document';

/**
 * Axiom groups whose members are sealed individually.
 *
 * `deprecated` is included deliberately: manifest §1 forbids retroactive edits to *accepted*
 * axioms, and a deprecation record is part of the history that constitutes identity (§7).
 */
export const SEALED_AXIOM_GROUPS = [
  'core',
  'indeterminate_forms',
  'deprecated',
  'meta',
  'derived_by_seed_expansion',
] as const;

/**
 * Keys of `FUNDAMENTAL_LOGICAL_STRUCTURE` that carry semantics rather than prose navigation.
 * `layer_order` and `derivation_chain` define the order of rule application (manifest §2, item 5).
 */
export const SEALED_STRUCTURE_KEYS = [
  'absolute_root',
  'derivation_chain',
  'inviolable_rule',
  'layer_order',
  'seed_principle',
] as const;

/** Provenance fields required by manifest §14. Missing or placeholder values are a violation. */
export const REQUIRED_PROVENANCE_FIELDS = [
  'who',
  'when',
  'what',
  'from',
  'to',
  'why',
  'evidence',
  'proof',
  'admission',
] as const;

/**
 * Admission status of a sealed version record.
 *
 * - `ADMITTED`: the version passed `Candidate → Analysis → Proof → Audit → Admission → Commit`
 *   (manifest §5) and the provenance record points at that evidence.
 * - `SEALED_FROM_REPOSITORY_STATE`: baseline capture of a Core that already existed in the tree
 *   before this guard was introduced. It asserts *continuity from the sealing commit onwards* and
 *   explicitly does NOT reconstruct a historical admission that was never recorded (manifest §16:
 *   unknown stays unknown).
 */
export type CoreAdmissionStatus = 'ADMITTED' | 'SEALED_FROM_REPOSITORY_STATE';

export interface CoreProvenance {
  readonly who: string;
  readonly when: string;
  readonly what: string;
  readonly from: string;
  readonly to: string;
  readonly why: string;
  readonly evidence: string;
  readonly proof: string;
  readonly admission: string;
}

/**
 * A cross-version semantic change that is NOT a conservative extension, declared explicitly.
 *
 * Manifest §6/§8: changing semantics is allowed only by creating a new version identity, and the
 * change must be visible. An undeclared non-additive change between versions is exactly the
 * semantic drift the manifest forbids, so it stops the line.
 */
export interface DeclaredSemanticChange {
  readonly entry: string;
  readonly kind: 'REWRITTEN' | 'REMOVED';
  readonly rationale: string;
}

export interface SealedCoreVersion {
  readonly coreVersion: string;
  readonly sourceFile: string;
  readonly sourceSha256: string;
  readonly coreHash: string;
  readonly previousVersion: string | null;
  readonly admissionStatus: CoreAdmissionStatus;
  readonly provenance: CoreProvenance;
  readonly entries: Readonly<Record<string, string>>;
  readonly declaredSemanticChanges?: readonly DeclaredSemanticChange[];
}

export interface CoreIdentityLock {
  readonly lockVersion: string;
  readonly manifest: string;
  readonly boundary: string;
  readonly versions: readonly SealedCoreVersion[];
}

export type CoreViolationSeverity = 'stop' | 'notice';

export interface CoreViolation {
  readonly code: string;
  readonly severity: CoreViolationSeverity;
  readonly coreVersion: string;
  readonly entry?: string;
  readonly message: string;
  readonly manifestClause: string;
}

export interface CoreIdentity {
  readonly coreVersion: string;
  readonly sourceFile: string;
  readonly sourceSha256: string;
  readonly coreHash: string;
  readonly previousVersion: string | null;
  readonly entries: Readonly<Record<string, string>>;
}

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Deterministic serialization: key order must not change a hash (manifest §13 identity stability). */
export function canonicalize(value: Json): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(value[key] as Json)}`).join(',')}}`;
}

export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

function hashEntry(value: Json): string {
  return sha256(canonicalize(value));
}

function isRecord(value: unknown): value is Record<string, Json> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Extract the sealed semantic surface of a Core document.
 *
 * Only normative sections are included. `EXAMPLES`, `QUICK_REFERENCE`, `VERIFICATION_STATUS` and
 * similar presentation sections are intentionally excluded: editing an example is documentation
 * work, while editing an axiom is an identity event, and conflating the two would make the guard
 * noisy enough to be routinely bypassed.
 */
export function computeCoreIdentity(sourceFile: string, raw: string): CoreIdentity {
  const parsed = JSON.parse(raw) as Json;
  if (!isRecord(parsed) || !isRecord(parsed[CORE_DOCUMENT_ROOT_KEY])) {
    throw new Error(`Core document ${sourceFile} has no ${CORE_DOCUMENT_ROOT_KEY} root object`);
  }
  const doc = parsed[CORE_DOCUMENT_ROOT_KEY];
  const entries: Record<string, string> = {};

  const foundations = doc.PART_1_ABSOLUTE_FOUNDATIONS;
  if (isRecord(foundations)) {
    for (const [key, value] of Object.entries(foundations)) {
      entries[`FOUNDATION:${key}`] = hashEntry(value);
    }
  }

  const protocols = doc.PART_2_SAFETY_PROTOCOLS;
  if (isRecord(protocols)) {
    for (const [key, value] of Object.entries(protocols)) {
      if (key === 'description') {
        continue;
      }
      entries[`PROTOCOL:${key}`] = hashEntry(value);
    }
  }

  const axioms = doc.AXIOMS;
  if (isRecord(axioms)) {
    for (const group of SEALED_AXIOM_GROUPS) {
      const groupValue = axioms[group];
      if (!isRecord(groupValue)) {
        continue;
      }
      for (const [key, value] of Object.entries(groupValue)) {
        entries[`AXIOM:${group}:${key}`] = hashEntry(value);
      }
    }
  }

  const structure = doc.FUNDAMENTAL_LOGICAL_STRUCTURE;
  if (isRecord(structure)) {
    for (const key of SEALED_STRUCTURE_KEYS) {
      if (key in structure) {
        entries[`STRUCTURE:${key}`] = hashEntry(structure[key]);
      }
    }
  }

  const coreVersion = typeof doc.document_version === 'string' ? doc.document_version : '';
  if (coreVersion === '') {
    throw new Error(`Core document ${sourceFile} declares no document_version`);
  }

  return {
    coreVersion,
    sourceFile,
    sourceSha256: sha256(raw),
    coreHash: sha256(canonicalize(entries as unknown as Json)),
    previousVersion: typeof doc.previous_version === 'string' ? doc.previous_version : null,
    entries,
  };
}

/**
 * Raw value of a sealed entry, needed for the conservative-extension test across versions.
 * Hashes prove that something changed; only the values can show whether it *grew*.
 */
export function readCoreEntryValues(raw: string): Record<string, Json> {
  const doc = (JSON.parse(raw) as Record<string, Json>)[CORE_DOCUMENT_ROOT_KEY];
  const values: Record<string, Json> = {};
  if (!isRecord(doc)) {
    return values;
  }
  const foundations = doc.PART_1_ABSOLUTE_FOUNDATIONS;
  if (isRecord(foundations)) {
    for (const [key, value] of Object.entries(foundations)) {
      values[`FOUNDATION:${key}`] = value;
    }
  }
  const protocols = doc.PART_2_SAFETY_PROTOCOLS;
  if (isRecord(protocols)) {
    for (const [key, value] of Object.entries(protocols)) {
      if (key !== 'description') {
        values[`PROTOCOL:${key}`] = value;
      }
    }
  }
  const axioms = doc.AXIOMS;
  if (isRecord(axioms)) {
    for (const group of SEALED_AXIOM_GROUPS) {
      const groupValue = axioms[group];
      if (isRecord(groupValue)) {
        for (const [key, value] of Object.entries(groupValue)) {
          values[`AXIOM:${group}:${key}`] = value;
        }
      }
    }
  }
  const structure = doc.FUNDAMENTAL_LOGICAL_STRUCTURE;
  if (isRecord(structure)) {
    for (const key of SEALED_STRUCTURE_KEYS) {
      if (key in structure) {
        values[`STRUCTURE:${key}`] = structure[key];
      }
    }
  }
  return values;
}

/**
 * `Core + Extension` test (manifest §17).
 *
 * A newer version may ADD keys to an entry and APPEND to its lists, but every value that existed
 * before must survive byte-identically and in the same order. Replacing a statement, reordering
 * consequences or dropping a clause is a rewrite, not growth, and must be declared as such.
 */
export function isConservativeExtension(previous: Json, next: Json): boolean {
  if (previous === null || typeof previous !== 'object') {
    return canonicalize(previous) === canonicalize(next);
  }
  if (Array.isArray(previous)) {
    if (!Array.isArray(next) || next.length < previous.length) {
      return false;
    }
    return previous.every((item, index) => canonicalize(item) === canonicalize(next[index] as Json));
  }
  if (!isRecord(next)) {
    return false;
  }
  return Object.entries(previous).every(
    ([key, value]) => key in next && isConservativeExtension(value, (next as Record<string, Json>)[key]),
  );
}

function provenanceViolations(record: SealedCoreVersion): CoreViolation[] {
  const violations: CoreViolation[] = [];
  for (const field of REQUIRED_PROVENANCE_FIELDS) {
    const value = record.provenance?.[field];
    if (typeof value !== 'string' || value.trim() === '' || /^(TODO|TBD|FIXME|UNKNOWN)$/i.test(value.trim())) {
      violations.push({
        code: 'CORE_PROVENANCE_INCOMPLETE',
        severity: 'stop',
        coreVersion: record.coreVersion,
        entry: field,
        message: `provenance.${field} отсутствует или является заглушкой: изменение Core без происхождения неотличимо от подмены`,
        manifestClause: '§14 Агент обязан сохранять происхождение',
      });
    }
  }
  return violations;
}

export function loadLock(repositoryRoot: string): { lock: CoreIdentityLock | null; error: string } {
  const path = join(repositoryRoot, CORE_LOCK_PATH);
  if (!existsSync(path)) {
    return { lock: null, error: `${CORE_LOCK_PATH} не найден` };
  }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as CoreIdentityLock;
    if (!Array.isArray(parsed.versions)) {
      return { lock: null, error: `${CORE_LOCK_PATH}: поле versions отсутствует или не является массивом` };
    }
    return { lock: parsed, error: '' };
  } catch (cause) {
    return { lock: null, error: `${CORE_LOCK_PATH}: ${(cause as Error).message}` };
  }
}

/** Validate the sealed registry itself: duplicate identities, lineage, provenance. */
export function validateLockIntegrity(lock: CoreIdentityLock): CoreViolation[] {
  const violations: CoreViolation[] = [];
  const byVersion = new Map<string, SealedCoreVersion>();

  for (const record of lock.versions) {
    const existing = byVersion.get(record.coreVersion);
    if (existing !== undefined) {
      violations.push({
        code: 'CORE_VERSION_IDENTITY_REUSED',
        severity: 'stop',
        coreVersion: record.coreVersion,
        message:
          existing.coreHash === record.coreHash
            ? 'версия запечатана дважды: идентичность должна быть уникальной записью'
            : `одно имя версии при различном Core (${existing.coreHash.slice(0, 12)} ≠ ${record.coreHash.slice(0, 12)})`,
        manifestClause: '§13 Core должен иметь неизменяемую идентичность',
      });
      continue;
    }
    byVersion.set(record.coreVersion, record);
    violations.push(...provenanceViolations(record));

    const recomputed = sha256(canonicalize(record.entries as unknown as Json));
    if (recomputed !== record.coreHash) {
      violations.push({
        code: 'CORE_HASH_INCONSISTENT',
        severity: 'stop',
        coreVersion: record.coreVersion,
        message: `coreHash не соответствует собственной карте записей (ожидался ${recomputed.slice(0, 12)})`,
        manifestClause: '§13 Core должен иметь неизменяемую идентичность',
      });
    }
  }

  for (const record of lock.versions) {
    if (record.previousVersion !== null && !byVersion.has(record.previousVersion)) {
      violations.push({
        code: 'CORE_LINEAGE_BROKEN',
        severity: 'stop',
        coreVersion: record.coreVersion,
        message: `предыдущая версия "${record.previousVersion}" не запечатана: история является частью идентичности`,
        manifestClause: '§7 История является частью идентичности',
      });
    }
  }

  return violations;
}

/** Compare one live Core document against its sealed record. */
export function validateSealedVersion(sealed: SealedCoreVersion, current: CoreIdentity): CoreViolation[] {
  const violations: CoreViolation[] = [];

  for (const [entry, hash] of Object.entries(sealed.entries)) {
    const currentHash = current.entries[entry];
    if (currentHash === undefined) {
      violations.push({
        code: 'CORE_ENTRY_REMOVED',
        severity: 'stop',
        coreVersion: sealed.coreVersion,
        entry,
        message: 'запечатанное правило удалено из принятой версии',
        manifestClause: '§1 Аксиома, однажды созданная и принятая, не изменяется',
      });
      continue;
    }
    if (currentHash !== hash) {
      violations.push({
        code: 'CORE_ENTRY_MUTATED',
        severity: 'stop',
        coreVersion: sealed.coreVersion,
        entry,
        message:
          'запечатанное правило изменено внутри уже принятой версии — требуется новая версия или ветвь, а не правка задним числом',
        manifestClause: '§1 / §6 Новое правило не переписывает старое',
      });
    }
  }

  for (const entry of Object.keys(current.entries)) {
    if (!(entry in sealed.entries)) {
      violations.push({
        code: 'CORE_ENTRY_ADDED_WITHOUT_SEAL',
        severity: 'stop',
        coreVersion: sealed.coreVersion,
        entry,
        message: 'новое правило добавлено в принятую версию без Admission: Resolve не равен Commit',
        manifestClause: '§5 Resolve не равен Commit',
      });
    }
  }

  if (current.coreHash !== sealed.coreHash && violations.length === 0) {
    violations.push({
      code: 'CORE_HASH_DRIFT',
      severity: 'stop',
      coreVersion: sealed.coreVersion,
      message: `coreHash изменился (${sealed.coreHash.slice(0, 12)} → ${current.coreHash.slice(0, 12)}) при совпадающих записях`,
      manifestClause: '§13 Core должен иметь неизменяемую идентичность',
    });
  }

  if (current.sourceSha256 !== sealed.sourceSha256) {
    violations.push({
      code: 'CORE_SOURCE_DRIFT',
      severity: 'notice',
      coreVersion: sealed.coreVersion,
      message:
        'файл версии изменён вне запечатанных нормативных секций (примеры, справочник, статусы) — семантика Core не затронута',
      manifestClause: '§7 История является частью идентичности',
    });
  }

  if (current.previousVersion !== sealed.previousVersion) {
    violations.push({
      code: 'CORE_LINEAGE_REWRITTEN',
      severity: 'stop',
      coreVersion: sealed.coreVersion,
      message: `объявленный предок изменён: "${sealed.previousVersion ?? 'null'}" → "${current.previousVersion ?? 'null'}"`,
      manifestClause: '§7 История является частью идентичности',
    });
  }

  return violations;
}

/**
 * Anti-drift check between consecutive versions (manifest §8, §17).
 *
 * A new version is allowed to extend the previous Core. Anything that is not a conservative
 * extension must be enumerated in `declaredSemanticChanges`, so that a chain of small silent
 * edits cannot turn RICIS-III into a different system while keeping the name.
 */
export function validateSemanticContinuity(
  previousValues: Record<string, Json>,
  currentValues: Record<string, Json>,
  record: SealedCoreVersion,
): CoreViolation[] {
  const violations: CoreViolation[] = [];
  const declared = new Map((record.declaredSemanticChanges ?? []).map((change) => [change.entry, change]));

  for (const [entry, previousValue] of Object.entries(previousValues)) {
    const currentValue = currentValues[entry];
    const declaredChange = declared.get(entry);

    if (currentValue === undefined) {
      if (declaredChange?.kind !== 'REMOVED') {
        violations.push({
          code: 'CORE_UNDECLARED_SEMANTIC_CHANGE',
          severity: 'stop',
          coreVersion: record.coreVersion,
          entry,
          message: 'правило исчезло по сравнению с предыдущей версией и не объявлено как удалённое',
          manifestClause: '§8 Запрет семантического дрейфа',
        });
      }
      continue;
    }

    if (canonicalize(previousValue) === canonicalize(currentValue)) {
      continue;
    }

    if (isConservativeExtension(previousValue, currentValue)) {
      continue;
    }

    if (declaredChange?.kind !== 'REWRITTEN') {
      violations.push({
        code: 'CORE_UNDECLARED_SEMANTIC_CHANGE',
        severity: 'stop',
        coreVersion: record.coreVersion,
        entry,
        message:
          'правило переписано (не расширено) относительно предыдущей версии без явного объявления: развитие допускается как Core + Extension',
        manifestClause: '§17 RICIS-III развивается расширением, а не саморазрушением',
      });
    }
  }

  for (const change of record.declaredSemanticChanges ?? []) {
    if (typeof change.rationale !== 'string' || change.rationale.trim().length < 12) {
      violations.push({
        code: 'CORE_DECLARATION_WITHOUT_RATIONALE',
        severity: 'stop',
        coreVersion: record.coreVersion,
        entry: change.entry,
        message: 'объявленное семантическое изменение не содержит содержательного обоснования',
        manifestClause: '§14 Агент обязан сохранять происхождение',
      });
    }
  }

  return violations;
}

export interface CoreImmutabilityReport {
  readonly violations: readonly CoreViolation[];
  readonly checkedVersions: readonly string[];
  readonly unsealedDocuments: readonly string[];
}

/** Full repository check: sealed registry + every Core document + lineage continuity. */
export function validateCoreImmutability(repositoryRoot: string): CoreImmutabilityReport {
  const { lock, error } = loadLock(repositoryRoot);
  if (lock === null) {
    return {
      violations: [
        {
          code: 'CORE_LOCK_UNAVAILABLE',
          severity: 'stop',
          coreVersion: '(нет)',
          message: `реестр идентичности недоступен — ${error}`,
          manifestClause: '§13 Core должен иметь неизменяемую идентичность',
        },
      ],
      checkedVersions: [],
      unsealedDocuments: [],
    };
  }

  const violations: CoreViolation[] = [...validateLockIntegrity(lock)];
  const checkedVersions: string[] = [];
  const unsealedDocuments: string[] = [];
  const rawByVersion = new Map<string, string>();

  for (const relativePath of CORE_DOCUMENT_PATHS) {
    const absolute = join(repositoryRoot, relativePath);
    if (!existsSync(absolute)) {
      violations.push({
        code: 'CORE_DOCUMENT_MISSING',
        severity: 'stop',
        coreVersion: relativePath,
        message: 'документ принятой версии отсутствует в дереве',
        manifestClause: '§7 История является частью идентичности',
      });
      continue;
    }
    const raw = readFileSync(absolute, 'utf8');
    let identity: CoreIdentity;
    try {
      identity = computeCoreIdentity(relativePath, raw);
    } catch (cause) {
      violations.push({
        code: 'CORE_DOCUMENT_UNREADABLE',
        severity: 'stop',
        coreVersion: relativePath,
        message: (cause as Error).message,
        manifestClause: '§13 Core должен иметь неизменяемую идентичность',
      });
      continue;
    }

    rawByVersion.set(identity.coreVersion, raw);
    const sealed = lock.versions.find((candidate) => candidate.coreVersion === identity.coreVersion);
    if (sealed === undefined) {
      unsealedDocuments.push(relativePath);
      violations.push({
        code: 'CORE_VERSION_UNSEALED',
        severity: 'stop',
        coreVersion: identity.coreVersion,
        message: `версия присутствует в дереве, но не запечатана в ${CORE_LOCK_PATH}`,
        manifestClause: '§5 Resolve не равен Commit',
      });
      continue;
    }

    if (sealed.sourceFile !== relativePath) {
      violations.push({
        code: 'CORE_SOURCE_RELOCATED',
        severity: 'notice',
        coreVersion: identity.coreVersion,
        message: `запечатанный путь ${sealed.sourceFile} не совпадает с фактическим ${relativePath}`,
        manifestClause: '§7 История является частью идентичности',
      });
    }

    checkedVersions.push(identity.coreVersion);
    violations.push(...validateSealedVersion(sealed, identity));
  }

  for (const record of lock.versions) {
    if (record.previousVersion === null) {
      continue;
    }
    const currentRaw = rawByVersion.get(record.coreVersion);
    const previousRaw = rawByVersion.get(record.previousVersion);
    if (currentRaw === undefined || previousRaw === undefined) {
      continue;
    }
    violations.push(
      ...validateSemanticContinuity(readCoreEntryValues(previousRaw), readCoreEntryValues(currentRaw), record),
    );
  }

  return { violations, checkedVersions, unsealedDocuments };
}

export function stopViolations(violations: readonly CoreViolation[]): CoreViolation[] {
  return violations.filter((violation) => violation.severity === 'stop');
}
