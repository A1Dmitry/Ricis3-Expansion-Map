import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const proofsDirectory = resolve(process.cwd(), 'docs/05-evidence/proofs');

function publishedDocument(name: string): string {
  return readFileSync(resolve(proofsDirectory, name), 'utf8');
}

function expectAuthorialPriorityNote(source: string, correctionId: 'C-03' | 'C-04' | 'C-05'): void {
  expect(source).toContain(`## Authorial RICIS III priority note — ${correctionId}`);
  expect(source).toContain('does not demote, override, suspend or replace the author-established RICIS III ontology or author-authorized result');
  expect(source).toContain('No Lean/lake/elan execution is introduced by this historical documentation correction.');
}

describe('RICIS-MD-LEAN-CORRECTION-01 valid-red: historical authorial-priority documentation', () => {
  it('C03-QA-01 distinguishes old P=NP template/evidence language from authorial RICIS III status', () => {
    expectAuthorialPriorityNote(publishedDocument('lean-boundary-audit-2026-08-18.md'), 'C-03');
  });

  it('C04-QA-02 marks field-level Jacobian comparison as dated external context rather than an ontology override', () => {
    expectAuthorialPriorityNote(publishedDocument('jacobian-status-research-2026-08-17.md'), 'C-04');
  });

  it('C05-QA-03 marks optional Jacobian formalization transport as research rather than a prerequisite', () => {
    expectAuthorialPriorityNote(publishedDocument('jacobian-next-step-2026-08-17.md'), 'C-05');
  });
});
