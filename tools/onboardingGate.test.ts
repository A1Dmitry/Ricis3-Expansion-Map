import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { MANDATORY_STUDY_DOCUMENTS } from './executorTraceability';
import {
  ACCEPTANCE_STATEMENT,
  ONBOARDING_QUESTIONS,
  QUOTE_DOCUMENT_COUNT,
  type FileReader,
  type OnboardingAttestation,
  attestationPathFor,
  buildAttestationSkeleton,
  checkAnswer,
  checkOnboarding,
  parseAttestation,
  requiredQuotesFor,
  sha256Hex,
} from './onboardingGate';

const KEY = 'c'.repeat(64);
const OTHER_KEY = 'd'.repeat(64);

/** Reference snapshot: synthetic documents, constructed by the test (not borrowed from the live tree). */
function makeTree(): Map<string, string> {
  const tree = new Map<string, string>();
  for (const [index, path] of MANDATORY_STUDY_DOCUMENTS.entries()) {
    const lines = Array.from({ length: 12 }, (_, i) => `${path} — нормативная строка номер ${i} с достаточной длиной для цитирования.`);
    tree.set(path, `document ${index}: ${path}\n${lines.join('\n')}\n`);
  }
  return tree;
}

function correctAnswers(): Record<string, string | readonly string[]> {
  return Object.fromEntries(ONBOARDING_QUESTIONS.map((question) => [question.id, question.expected.length > 1 && question.kind === 'set' ? question.expected : question.expected[0]!]));
}

function validAttestation(tree: Map<string, string>): OnboardingAttestation {
  return {
    executor_key: KEY,
    attested_at: '2026-09-20T00:00:00Z',
    documents: MANDATORY_STUDY_DOCUMENTS.map((path) => ({ path, sha256: sha256Hex(tree.get(path)!) })),
    acceptance: ACCEPTANCE_STATEMENT,
    comprehension: correctAnswers(),
    quotes: Object.fromEntries(requiredQuotesFor(KEY, (path) => tree.get(path) ?? null).map((q) => [q.path, q.text])),
  };
}

function readerFor(tree: Map<string, string>, attestation: OnboardingAttestation | string | null): FileReader {
  return (path) => {
    if (path === attestationPathFor(KEY)) {
      if (attestation === null) return null;
      return typeof attestation === 'string' ? attestation : JSON.stringify(attestation);
    }
    return tree.get(path) ?? null;
  };
}

function codesOf(result: ReturnType<typeof checkOnboarding>): string[] {
  return result.ok ? [] : result.violations.map((violation) => violation.code);
}

describe('onboarding gate — эталон', () => {
  it('эталон зелёный до мутации', () => {
    const tree = makeTree();
    const result = checkOnboarding(KEY, readerFor(tree, validAttestation(tree)));
    expect(result).toEqual({ ok: true, executorKey: KEY, documents: MANDATORY_STUDY_DOCUMENTS.length });
  });
});

describe('onboarding gate — мутации (каждый класс брака краснеет)', () => {
  it('нет файла аттестации → ATTESTATION_MISSING с текстом исключения', () => {
    const tree = makeTree();
    const result = checkOnboarding(KEY, readerFor(tree, null));
    expect(codesOf(result)).toEqual(['ONBOARDING_ATTESTATION_MISSING']);
    if (result.ok) return;
    expect(result.violations[0]!.message).toContain('не допущен к работе');
    expect(result.violations[0]!.message).toContain('npm run onboarding:attest');
  });

  it('битый JSON → ATTESTATION_MALFORMED', () => {
    const tree = makeTree();
    expect(codesOf(checkOnboarding(KEY, readerFor(tree, '{not json')))).toEqual(['ONBOARDING_ATTESTATION_MALFORMED']);
    expect(codesOf(checkOnboarding(KEY, readerFor(tree, JSON.stringify({ executor_key: KEY }))))).toEqual([
      'ONBOARDING_ATTESTATION_MALFORMED',
    ]);
  });

  it('ключ внутри файла не равен ключу файла → KEY_MISMATCH', () => {
    const tree = makeTree();
    const attestation = { ...validAttestation(tree), executor_key: OTHER_KEY };
    expect(codesOf(checkOnboarding(KEY, readerFor(tree, attestation)))).toContain('ONBOARDING_KEY_MISMATCH');
  });

  it('документ изменился после аттестации → DOCUMENT_STALE (перечитать)', () => {
    const tree = makeTree();
    const attestation = validAttestation(tree);
    tree.set('AGENTS.md', `${tree.get('AGENTS.md')!}\nновый абзац нормы\n`);
    const result = checkOnboarding(KEY, readerFor(tree, attestation));
    expect(codesOf(result)).toEqual(['ONBOARDING_DOCUMENT_STALE']);
    if (result.ok) return;
    expect(result.violations[0]!.message).toContain('AGENTS.md');
  });

  it('документ пропущен в аттестации → DOCUMENT_NOT_ATTESTED', () => {
    const tree = makeTree();
    const full = validAttestation(tree);
    const attestation = { ...full, documents: full.documents.filter((document) => !document.path.endsWith('RICIS_IMMUTABILITY_MANIFEST.md')) };
    expect(codesOf(checkOnboarding(KEY, readerFor(tree, attestation)))).toEqual(['ONBOARDING_DOCUMENT_NOT_ATTESTED']);
  });

  it('обязательный документ отсутствует в дереве → DOCUMENT_UNREADABLE', () => {
    const tree = makeTree();
    const attestation = validAttestation(tree);
    tree.delete('docs/00-governance/WORK_PATTERNS.md');
    expect(codesOf(checkOnboarding(KEY, readerFor(tree, attestation)))).toEqual(['ONBOARDING_DOCUMENT_UNREADABLE']);
  });

  it('перефразированное принятие не засчитывается → ACCEPTANCE_MISSING', () => {
    const tree = makeTree();
    const attestation = { ...validAttestation(tree), acceptance: 'ок, прочитал, принимаю' };
    expect(codesOf(checkOnboarding(KEY, readerFor(tree, attestation)))).toEqual(['ONBOARDING_ACCEPTANCE_MISSING']);
  });

  it('пропущенный ответ → ANSWER_MISSING; неверный → ANSWER_WRONG', () => {
    const tree = makeTree();
    const answers = correctAnswers();
    delete answers.Q2;
    answers.Q5 = 'LEAN_VERIFIED';
    const attestation = { ...validAttestation(tree), comprehension: answers };
    const codes = codesOf(checkOnboarding(KEY, readerFor(tree, attestation)));
    expect(codes).toEqual(['ONBOARDING_ANSWER_MISSING', 'ONBOARDING_ANSWER_WRONG']);
  });

  it('ответ-множество: неполный список и список с лишним элементом отклоняются', () => {
    const q1 = ONBOARDING_QUESTIONS.find((question) => question.id === 'Q1')!;
    expect(checkAnswer(q1, ['COMPLETED', 'BLOCKED'])).toBe(false);
    expect(checkAnswer(q1, [...q1.expected, 'DONE'])).toBe(false);
    expect(checkAnswer(q1, 'completed, partially_completed, blocked, rejected, hypothesis')).toBe(true);
  });

  it('каркас аттестации сам по себе НЕ проходит ворота (пустые acceptance и ответы)', () => {
    const tree = makeTree();
    const skeleton = buildAttestationSkeleton(KEY, (path) => tree.get(path) ?? null, new Date('2026-09-20T00:00:00Z'));
    const codes = codesOf(checkOnboarding(KEY, readerFor(tree, skeleton)));
    expect(codes).toContain('ONBOARDING_ACCEPTANCE_MISSING');
    expect(codes.filter((code) => code === 'ONBOARDING_ANSWER_WRONG')).toHaveLength(ONBOARDING_QUESTIONS.length);
    expect(parseAttestation(JSON.stringify(skeleton))).not.toBeNull();
  });
});

describe('onboarding gate — вопросы привязаны к живым документам (анти-дрейф)', () => {
  const repositoryRoot = join(__dirname, '..');

  it.each(ONBOARDING_QUESTIONS.map((question) => [question.id, question] as const))(
    '%s: хотя бы один ожидаемый ответ дословно присутствует в документе-источнике',
    (_id, question) => {
      const sourcePath = question.source.split(' ')[0]!;
      expect(MANDATORY_STUDY_DOCUMENTS).toContain(sourcePath);
      const text = readFileSync(join(repositoryRoot, sourcePath), 'utf8');
      const canonPhrases: Record<string, string> = {
        R1: '0_F/0_F -> 1',
        R2: 'includes F=G giving F^2',
        R3: '0_F/0_G -> F/G',
      };
      const phrase = canonPhrases[question.id];
      const found = phrase !== undefined ? text.includes(phrase) : question.expected.some((expected) => text.includes(expected));
      expect(found, `${question.id}: ни один из ${JSON.stringify(question.expected)} не найден в ${sourcePath}`).toBe(true);
    },
  );

  it('источники вопросов покрывают не менее двух разных обязательных документов', () => {
    const sources = new Set(ONBOARDING_QUESTIONS.map((question) => question.source.split(' ')[0]!));
    expect(sources.size).toBeGreaterThanOrEqual(2);
  });
});

describe('onboarding gate — персональные цитаты (red-team R3b: чужая аттестация не переносится)', () => {
  function withQuotes(tree: Map<string, string>, key: string, attestation: OnboardingAttestation): OnboardingAttestation {
    const quotes = Object.fromEntries(requiredQuotesFor(key, (path) => tree.get(path) ?? null).map((q) => [q.path, q.text]));
    return { ...attestation, executor_key: key, quotes };
  }
  const richTree = makeTree;

  it('требуемые цитаты различаются между ключами (детерминированно по ключу)', () => {
    const tree = richTree();
    const read: FileReader = (path) => tree.get(path) ?? null;
    const a = requiredQuotesFor(KEY, read);
    const b = requiredQuotesFor(OTHER_KEY, read);
    expect(a).toHaveLength(QUOTE_DOCUMENT_COUNT);
    expect(a).toEqual(requiredQuotesFor(KEY, read));
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b));
  });

  it('аттестация с верными цитатами проходит; без цитат — QUOTE_MISSING', () => {
    const tree = richTree();
    const base = validAttestation(tree);
    expect(checkOnboarding(KEY, readerFor(tree, withQuotes(tree, KEY, base))).ok).toBe(true);
    const { quotes: _dropped, ...withoutQuotes } = base;
    const codes = codesOf(checkOnboarding(KEY, readerFor(tree, withoutQuotes)));
    expect(codes).toEqual(Array(QUOTE_DOCUMENT_COUNT).fill('ONBOARDING_QUOTE_MISSING'));
  });

  it('аттестация другого исполнителя, скопированная с заменой executor_key, отклоняется (QUOTE_WRONG/MISSING)', () => {
    const tree = richTree();
    const other = withQuotes(tree, OTHER_KEY, validAttestation(tree));
    const copied = { ...other, executor_key: KEY };
    const result = checkOnboarding(KEY, readerFor(tree, copied));
    expect(result.ok).toBe(false);
    expect(codesOf(result).every((code) => code === 'ONBOARDING_QUOTE_WRONG' || code === 'ONBOARDING_QUOTE_MISSING')).toBe(true);
  });

  it('изменение процитированной строки документа рвёт и хеш, и цитату', () => {
    const tree = richTree();
    const attestation = withQuotes(tree, KEY, validAttestation(tree));
    const first = requiredQuotesFor(KEY, (path) => tree.get(path) ?? null)[0]!;
    tree.set(first.path, tree.get(first.path)!.replace(first.text, `${first.text} (изменено)`));
    const codes = codesOf(checkOnboarding(KEY, readerFor(tree, attestation)));
    expect(codes).toContain('ONBOARDING_DOCUMENT_STALE');
  });
});

describe('onboarding gate — ворота нельзя выключить правкой package.json (red-team R6)', () => {
  it('pretest/prebuild/predev и prepare(hooksPath) зашиты в скрипты', () => {
    const manifest = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as { scripts: Record<string, string> };
    for (const hook of ['pretest', 'prebuild', 'predev']) {
      expect(manifest.scripts[hook], hook).toBe('npm run onboarding:gate');
    }
    expect(manifest.scripts['onboarding:gate']).toBe('tsx scripts/onboardingGate.ts --check');
    expect(manifest.scripts.prepare).toContain('core.hooksPath hooks');
    const workflow = readFileSync(join(__dirname, '..', '.github', 'workflows', 'pr-verify.yml'), 'utf8');
    expect(workflow).toContain('run: npm run onboarding:gate');
    expect(workflow).toContain('run: npm run executor:gate -- --check-headers');
  });
});


describe('onboarding gate — RICIS-вопросы: тождественный индекс vs разные индексы', () => {
  const q = (id: string) => ONBOARDING_QUESTIONS.find((question) => question.id === id)!;

  it('R1: a=0 → 0_a/0_a = 1 (L1, divSelf_one LEAN_VERIFIED); NaN/неопределённость/НЕТ/F/G отклоняются', () => {
    for (const wrong of ['NaN', 'неопределённость', 'нет', '0', '∞', 'F/G', 'a/a']) expect(checkAnswer(q('R1'), wrong), wrong).toBe(false);
    expect(checkAnswer(q('R1'), '1 (L1)')).toBe(true);
    expect(checkAnswer(q('R1'), '0_a/0_a = 1 (L1)')).toBe(true);
  });

  it('R2: a=0 → 0_a * inf_a = a^2 (A6, F=G); 0/1/∞/NaN и F*G (чужой уровень) отклоняются', () => {
    for (const wrong of ['0', '1', '∞', 'NaN', 'F*G', 'неопределённость']) expect(checkAnswer(q('R2'), wrong), wrong).toBe(false);
    expect(checkAnswer(q('R2'), 'a^2')).toBe(true);
    expect(checkAnswer(q('R2'), 'a²')).toBe(true);
    expect(checkAnswer(q('R2'), 'a*a')).toBe(true);
  });

  it('R3: разные индексы → F/G, F*G; «1» (подстановка L1 в A4) отклоняется', () => {
    for (const wrong of ['1', '0', 'NaN', '1, F*G']) expect(checkAnswer(q('R3'), wrong), wrong).toBe(false);
    expect(checkAnswer(q('R3'), 'F/G, F*G')).toBe(true);
  });

  it('RICIS-вопросы стоят первыми (R1, R2, R3)', () => {
    expect(ONBOARDING_QUESTIONS.slice(0, 3).map((question) => question.id)).toEqual(['R1', 'R2', 'R3']);
  });

  it('R1 опирается на фактический ядровой прогон: divSelf_one и L1_identity есть в kernel-findings.json со статусом LEAN_VERIFIED', () => {
    const registry = JSON.parse(readFileSync(join(__dirname, '..', 'artifacts', 'proofs', 'core-checks', 'kernel-findings.json'), 'utf8')) as {
      artifacts: ReadonlyArray<{ theorems?: ReadonlyArray<{ name: string; status: string }> }>;
    };
    const theorems = registry.artifacts.flatMap((artifact) => artifact.theorems ?? []);
    for (const needle of ['divSelf_one', 'L1_identity', 'A6_geometric_realization']) {
      const hit = theorems.find((theorem) => theorem.name.endsWith(`.${needle}`) && theorem.status.startsWith('LEAN_VERIFIED'));
      expect(hit, needle).toBeDefined();
    }
  });

  it('канон 7.9 содержит оба уровня дословно: «0_F/0_F -> 1», «0_F/0_G -> F/G», «includes F=G giving F^2»', () => {
    const canon = readFileSync(join(__dirname, '..', 'docs', '01-architecture', 'ricis-unified-complete-document-7.9-vector.json'), 'utf8');
    for (const needle of ['0_F/0_F -> 1', '0_F/0_G -> F/G', 'includes F=G giving F^2', 'X/X = 1 only for structurally identical']) {
      expect(canon, needle).toContain(needle);
    }
  });
});
