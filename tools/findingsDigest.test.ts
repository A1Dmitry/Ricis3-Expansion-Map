// @vitest-environment node
/**
 * Стражи генерируемой сводки находок (scripts/generateFindingsDigest.ts).
 *
 * Смысл проверок — не «файл существует», а три утверждения, ради которых сводка и заведена:
 *  1) отчёт воспроизводим из реестров байт-в-байт (иначе он снова пересказ, а не индекс);
 *  2) отчёт не умнее реестра: ни один токен доверия не появляется в нём сам по себе
 *     (класс дефекта F-02: «статус без прогона» начинается именно с добавленного слова);
 *  3) связи «карточка ↔ находка» совпадают с доской, а не с текстом находок.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderFindingsDigest, DIGEST_PATH } from '../scripts/generateFindingsDigest';
import { isFindingRecordedClosed, type FindingsRegistry, type TpsBoard } from './tpsStandardWork';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const TRUST_TOKENS = [
  'LEAN_VERIFIED_AXIOM_FREE',
  'LEAN_VERIFIED_WITH_STANDARD_AXIOMS',
  'TRUSTED_AXIOM',
  'REQUIRES_CORE_LEAN',
  'STRUCTURALLY_VALIDATED',
  'REJECTED_SORRYAX',
  'EXPECTED_FAIL',
] as const;

const registryText = readFileSync(
  join(repositoryRoot, 'artifacts/proofs/core-checks/kernel-findings.json'),
  'utf8',
);
const registry = JSON.parse(registryText) as FindingsRegistry;
const board = JSON.parse(
  readFileSync(join(repositoryRoot, 'docs/00-governance/tps/board.json'), 'utf8'),
) as TpsBoard;
const committed = readFileSync(join(repositoryRoot, DIGEST_PATH), 'utf8');

describe('generated findings digest', () => {
  it('is byte-identical to a fresh generation from the registries', () => {
    expect(renderFindingsDigest(repositoryRoot)).toBe(committed);
  });

  it('is deterministic: two renders of the same input agree', () => {
    expect(renderFindingsDigest(repositoryRoot)).toBe(renderFindingsDigest(repositoryRoot));
  });

  it('carries no generation timestamp, so freshness can be checked byte-wise', () => {
    expect(committed).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/u);
  });

  it('indexes every finding of the registry, including the ones nobody wants to see', () => {
    const ids = (registry.findings ?? []).map((finding) => finding.id ?? '');
    expect(ids.length).toBeGreaterThanOrEqual(10);
    for (const id of ids) {
      expect(committed, `finding ${id} must appear in the digest`).toContain(`| ${id} |`);
    }
  });

  it('never says more about trust than the registry itself does', () => {
    for (const token of TRUST_TOKENS) {
      const inDigest = committed.includes(token);
      const inRegistry = registryText.includes(token);
      if (inDigest) {
        expect(inRegistry, `digest mentions ${token} while the registry does not — invented status`).toBe(true);
      }
    }
  });

  it('reports closure exactly as the pull rule computes it', () => {
    const rows = committed.split('\n').filter((line) => /^\| F-\d\d \|/u.test(line));
    const byId = new Map((registry.findings ?? []).map((finding) => [finding.id ?? '', finding]));
    expect(rows.length).toBeGreaterThanOrEqual((registry.findings ?? []).length);
    for (const row of rows) {
      const id = row.split('|')[1]?.trim() ?? '';
      const finding = byId.get(id);
      if (!finding) continue;
      const closed = isFindingRecordedClosed(finding);
      const saysClosed = row.includes('закрыто (поле');
      expect(saysClosed, `digest disagrees with the gate about ${id}`).toBe(closed);
    }
  });

  it('links cards to findings exactly as the board does', () => {
    const referenced = new Map<string, string[]>();
    for (const card of board.cards) {
      const haystack = `${card.title} ${card.originalGoal} ${(card.acceptanceCriteria ?? []).join(' ')}`;
      for (const match of haystack.matchAll(/\bF-\d{2}\b/gu)) {
        const bucket = referenced.get(match[0]) ?? [];
        bucket.push(card.id);
        referenced.set(match[0], bucket);
      }
    }
    for (const [id, cards] of referenced) {
      const row = committed.split('\n').find((line) => line.startsWith(`| ${id} |`));
      expect(row, `missing digest row for ${id}`).toBeDefined();
      for (const cardId of cards) {
        expect(row!, `digest row for ${id} must list ${cardId}`).toContain(cardId);
      }
    }
    for (const id of ['F-99', 'F-77']) {
      if (!referenced.has(id)) {
        expect(committed.split('\n').some((line) => line.startsWith(`| ${id} |`))).toBe(false);
      }
    }
  });

  it('keeps the prose out of the index (a copied sentence is a new drift channel)', () => {
    // Long registry prose must not be duplicated into the digest.
    for (const finding of registry.findings ?? []) {
      const prose = (finding.resolution ?? '').trim();
      if (prose.length > 120) {
        expect(committed, `digest copied registry prose for ${finding.id}`).not.toContain(prose.slice(0, 120));
      }
    }
  });
});
