// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const committedDocumentPath = join(
  repositoryRoot,
  'docs/01-architecture/ricis-unified-complete-document-8.0-seed-expansion.json',
);

/**
 * Защита от рассинхрона после обрыва работы: задокументированные факты развёртывания
 * (A12–A14, отпечатки поколений, реестр отказов) обязаны быть байт-в-байт равны
 * результату повторного прогона протокола. Иначе документ — это текст «по мотивам кода».
 */
describe('свежесть сгенерированного документа семени', () => {
  it('документ v8.0 совпадает с повторной генерацией из текущего кода', () => {
    const directory = mkdtempSync(join(tmpdir(), 'ricis-seed-'));
    const generatedPath = join(directory, 'seed-expansion.json');

    execFileSync(
      'npx',
      ['tsx', 'scripts/generateSeedExpansionSpec.ts', '--out', generatedPath],
      { cwd: repositoryRoot, encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'] },
    );

    const generated = readFileSync(generatedPath, 'utf8');
    const committed = readFileSync(committedDocumentPath, 'utf8');

    expect(generated).toBe(committed);
  }, 120_000);

  it('состояние задачи машины восстановления заполнено и машиночитаемо', () => {
    const statePath = join(repositoryRoot, 'docs/01-architecture/seed-expansion-task-state.json');
    const state = JSON.parse(readFileSync(statePath, 'utf8')) as {
      readonly task: string;
      readonly resume: readonly string[];
      readonly steps: readonly { readonly id: string; readonly verify: string; readonly status: string }[];
    };

    expect(state.task.length).toBeGreaterThan(10);
    expect(state.resume.length).toBeGreaterThan(0);
    expect(state.steps.length).toBeGreaterThan(0);
    for (const step of state.steps) {
      expect(step.verify.length, step.id).toBeGreaterThan(0);
      expect(['pending', 'done', 'blocked']).toContain(step.status);
    }
  });
});
