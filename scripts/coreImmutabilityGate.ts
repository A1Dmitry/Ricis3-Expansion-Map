/**
 * Core immutability gate (andon lamp for `docs/00-governance/RICIS_IMMUTABILITY_MANIFEST.md`).
 *
 * Commands:
 *   tsx scripts/coreImmutabilityGate.ts            # verify every Core document against the seal; exit 1 on stop-violations
 *   tsx scripts/coreImmutabilityGate.ts --seal     # append NEW, not-yet-sealed versions to the lock (never rewrites a sealed one)
 *
 * Stop-the-line semantics: a non-zero exit is the andon lamp. `--seal` deliberately refuses to
 * update an existing record — manifest §1/§6 allow a new version identity, never a retroactive
 * edit of an accepted one, so re-sealing must be a reviewed human act on a new version entry.
 *
 * Boundary (manifest §12, §16): this gate compares declared semantics against a sealed snapshot.
 * A green run proves structural continuity only. It is not proof, not admission and not
 * independent verification of any axiom.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CORE_DOCUMENT_PATHS,
  CORE_LOCK_PATH,
  CORE_MANIFEST_PATH,
  computeCoreIdentity,
  loadLock,
  stopViolations,
  validateCoreImmutability,
  type CoreViolation,
  type SealedCoreVersion,
} from '../tools/coreImmutabilityGuard';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));

function printViolations(title: string, violations: readonly CoreViolation[]): void {
  if (violations.length === 0) {
    console.log(`${title}: чисто`);
    return;
  }
  console.log(`${title}: ${violations.length}`);
  for (const violation of violations) {
    const entry = violation.entry === undefined ? '' : ` ${violation.entry}`;
    console.log(`  [${violation.code}] ${violation.coreVersion}${entry}`);
    console.log(`      ${violation.message}`);
    console.log(`      манифест: ${violation.manifestClause}`);
  }
}

if (args.has('--seal')) {
  const { lock, error } = loadLock(repositoryRoot);
  if (lock === null) {
    console.error(`ANDON: ${error}`);
    process.exit(1);
  }
  const sealedVersions = new Set(lock.versions.map((record) => record.coreVersion));
  const added: SealedCoreVersion[] = [];

  for (const relativePath of CORE_DOCUMENT_PATHS) {
    const raw = readFileSync(join(repositoryRoot, relativePath), 'utf8');
    const identity = computeCoreIdentity(relativePath, raw);
    if (sealedVersions.has(identity.coreVersion)) {
      console.log(`уже запечатано, пропуск: ${identity.coreVersion}`);
      continue;
    }
    added.push({
      coreVersion: identity.coreVersion,
      sourceFile: identity.sourceFile,
      sourceSha256: identity.sourceSha256,
      coreHash: identity.coreHash,
      previousVersion: identity.previousVersion,
      admissionStatus: 'SEALED_FROM_REPOSITORY_STATE',
      provenance: {
        who: 'TODO — заполнить до коммита',
        when: new Date().toISOString(),
        what: `seal of Core ${identity.coreVersion}`,
        from: identity.previousVersion ?? '(нет предшественника)',
        to: identity.coreVersion,
        why: 'TODO — заполнить до коммита',
        evidence: 'TODO — заполнить до коммита',
        proof: 'TODO — заполнить до коммита',
        admission: 'TODO — заполнить до коммита',
      },
      entries: identity.entries,
    });
  }

  if (added.length === 0) {
    console.log('новых версий для запечатывания нет — реестр полон.');
    process.exit(0);
  }

  const next = { ...lock, versions: [...lock.versions, ...added] };
  writeFileSync(join(repositoryRoot, CORE_LOCK_PATH), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  console.log(`запечатано новых версий: ${added.length} (${added.map((record) => record.coreVersion).join(', ')})`);
  console.log('ВНИМАНИЕ: поля provenance содержат TODO — гейт останется красным, пока происхождение не заполнено (манифест §14).');
  process.exit(0);
}

const report = validateCoreImmutability(repositoryRoot);
const stops = stopViolations(report.violations);
const notices = report.violations.filter((violation) => violation.severity === 'notice');

console.log(`НЕИЗМЕННОСТЬ CORE RICIS-III · реестр ${CORE_LOCK_PATH}`);
console.log(`нормативный источник: ${CORE_MANIFEST_PATH}`);
console.log('');
console.log(`проверено версий: ${report.checkedVersions.length}${report.checkedVersions.length > 0 ? ` (${report.checkedVersions.join(', ')})` : ''}`);
console.log('');
printViolations('стоп-нарушения', stops);
printViolations('замечания (не останавливают линию)', notices);
console.log('');

if (stops.length > 0) {
  console.log('ИТОГ: линия остановлена — принятый Core изменён задним числом либо изменение не оформлено.');
  console.log('Разрешённые действия: отклонить изменение ИЛИ оформить новую версию/ветвь с собственной идентичностью (манифест §6).');
  process.exit(1);
}

console.log('ИТОГ: запечатанный Core совпадает с деревом (структурная непрерывность).');
console.log('Граница: это не доказательство истинности аксиом и не Admission (манифест §12, §15, §16).');
