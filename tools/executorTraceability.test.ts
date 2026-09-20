import { describe, expect, it } from 'vitest';

import {
  KEYLESS_COMMIT_EXCEPTION_TEXT,
  MANDATORY_STUDY_DOCUMENTS,
  buildForensicsVerdict,
  extractRegisteredKey,
  parseExecutorHeader,
} from './executorTraceability';

const KEY_A = 'a73af5ede6cbdf70f161c7cf493597f967745c80fc005a1de497121218f88c21';
const KEY_B = 'b'.repeat(64);

const REGISTERED_FILE = `# Executor Key\n\nexecutor_key: ${KEY_A}\n\ncreated_at: 2026-09-19T18:19:33Z\n\npurpose: GitHub execution traceability\n`;

describe('parseExecutorHeader', () => {
  it('принимает точный заголовок «исполнитель : <ключ>»', () => {
    const result = parseExecutorHeader(`исполнитель : ${KEY_A}`);
    expect(result).toEqual({ ok: true, key: KEY_A });
  });

  it('принимает краткое уточнение после ключа', () => {
    const result = parseExecutorHeader(`исполнитель : ${KEY_A} фикс ядра`);
    expect(result).toEqual({ ok: true, key: KEY_A });
  });

  it('отклоняет заголовок без префикса «исполнитель :» с обязательным текстом исключения', () => {
    const result = parseExecutorHeader('feat: обычный коммит без ключа');
    expect(result).toMatchObject({ ok: false, code: 'EXECUTOR_HEADER_MISSING' });
    if (result.ok) return;
    expect(result.message).toContain('надо создать ключ по вышеописанному протоколу');
    expect(result.message).toContain('а лучше еще и пройти обучение');
  });

  it('отклоняет ключ не из 64 строчных hex-символов с тем же текстом исключения', () => {
    expect(parseExecutorHeader(`исполнитель : ${KEY_A.toUpperCase()}`)).toMatchObject({
      ok: false,
      code: 'EXECUTOR_KEY_FORMAT',
    });
    expect(parseExecutorHeader(`исполнитель : ${'a'.repeat(63)}`)).toMatchObject({
      ok: false,
      code: 'EXECUTOR_KEY_FORMAT',
    });
    const malformed = parseExecutorHeader('исполнитель : не-ключ');
    expect(malformed).toMatchObject({ ok: false, code: 'EXECUTOR_KEY_FORMAT' });
    if (malformed.ok) return;
    expect(malformed.message).toContain('надо создать ключ по вышеописанному протоколу');
    expect(malformed.message).toContain('а лучше еще и пройти обучение');
  });

  it('не зависит от концевых пробелов заголовка', () => {
    const result = parseExecutorHeader(`  исполнитель : ${KEY_B}  `);
    expect(result).toEqual({ ok: true, key: KEY_B });
  });
});

describe('extractRegisteredKey', () => {
  it('извлекает ключ из канонического шаблона EXECUTOR_KEY.md', () => {
    expect(extractRegisteredKey(REGISTERED_FILE)).toBe(KEY_A);
  });

  it('возвращает null без строки executor_key или с искажённым ключом', () => {
    expect(extractRegisteredKey('# Executor Key\n\npurpose: GitHub execution traceability\n')).toBeNull();
    expect(extractRegisteredKey(`executor_key: ${'z'.repeat(64)}\n`)).toBeNull();
    expect(extractRegisteredKey(`executor_key: ${KEY_A.toUpperCase()}\n`)).toBeNull();
  });
});

describe('KEYLESS_COMMIT_EXCEPTION_TEXT', () => {
  it('требует создать ключ по протоколу и предписывает обучение с указанием документов', () => {
    expect(KEYLESS_COMMIT_EXCEPTION_TEXT).toContain('надо создать ключ по вышеописанному протоколу');
    expect(KEYLESS_COMMIT_EXCEPTION_TEXT).toContain('а лучше еще и пройти обучение');
    expect(KEYLESS_COMMIT_EXCEPTION_TEXT).toContain('docs/00-governance/EXECUTION_TRACEABILITY_GATES.md');
    expect(KEYLESS_COMMIT_EXCEPTION_TEXT).toContain('docs/00-governance/EXECUTOR_KEY.md');
    expect(KEYLESS_COMMIT_EXCEPTION_TEXT).toContain('MANDATORY_STUDY_DOCUMENTS');
  });
});

describe('buildForensicsVerdict', () => {
  const badSha = 'a'.repeat(40);
  const badSubject = `исполнитель : ${KEY_A} сломал тест`;

  it('policy restudy: направляет исполнителя на принудительное изучение всей документации', () => {
    const verdict = buildForensicsVerdict({ badCommitSha: badSha, badCommitSubject: badSubject, policy: 'restudy' });
    expect(verdict.verdict).toBe('MANDATORY_DOCUMENTATION_STUDY');
    if (verdict.verdict !== 'MANDATORY_DOCUMENTATION_STUDY') return;
    expect(verdict.executorKey).toBe(KEY_A);
    for (const document of MANDATORY_STUDY_DOCUMENTS) {
      expect(verdict.report.join('\n')).toContain(document);
    }
    expect(verdict.report.join('\n')).toContain(`documentation-restudy: ${KEY_A}`);
  });

  it('policy restudy: неатрибутируемый нарушитель получает немедленный отказ', () => {
    const verdict = buildForensicsVerdict({
      badCommitSha: badSha,
      badCommitSubject: 'feat: без ключа',
      policy: 'restudy',
    });
    expect(verdict).toMatchObject({ verdict: 'REJECT', executorKey: null });
  });

  it('policy reject: немедленный отказ с фиксацией минуса ключа', () => {
    const verdict = buildForensicsVerdict({ badCommitSha: badSha, badCommitSubject: badSubject, policy: 'reject' });
    expect(verdict.verdict).toBe('REJECT');
    if (verdict.verdict !== 'REJECT') return;
    expect(verdict.executorKey).toBe(KEY_A);
    expect(verdict.report.join('\n')).toContain(KEY_A);
  });
});
