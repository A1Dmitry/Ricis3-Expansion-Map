/**
 * Onboarding gate primitives («ворота допуска исполнителя», G0).
 *
 * Normative source: docs/00-governance/EXECUTION_TRACEABILITY_GATES.md §0.
 * Attestation files: docs/00-governance/onboarding/<executor_key>.json.
 *
 * An executor is admitted to work only after it has attested that it has read
 * and accepted every mandatory document — in the exact revision (sha256) that
 * is present in the tree — and has answered the comprehension questions
 * derived from those documents. The gate is pure: it receives a file reader
 * so that the same check runs against the working tree (G0) and against any
 * historical commit (`git show <sha>:<path>`, G1).
 *
 * Honest boundary: a hash + questionnaire proves that the executor had the
 * documents in front of it and could extract their normative content; it does
 * not prove understanding. That residual is the job of the CHALLENGER roles
 * and external review (RCVAP §5, §13), not of this gate.
 */

import { createHash } from 'node:crypto';

import { MANDATORY_STUDY_DOCUMENTS } from './executorTraceability';

/** Directory of attestation files (relative to repository root). */
export const ONBOARDING_DIR = 'docs/00-governance/onboarding';

/** Exact acceptance sentence; any deviation is a missing acceptance. */
export const ACCEPTANCE_STATEMENT =
  'Я прочитал(а) все обязательные документы в редакциях с указанными sha256, принимаю их как ' +
  'обязательные нормы этой работы и подтверждаю, что нарушение классифицируется как TUKHTA и ' +
  'основание для отклонения вклада.';

export interface OnboardingQuestion {
  readonly id: string;
  readonly question: string;
  readonly source: string;
  /** Accepted normalized answers; for `set` kind — the exact expected set. */
  readonly expected: readonly string[];
  readonly kind: 'exact' | 'set';
  /** Answers that reveal a classical/NaN reflex; matching one is a hard failure even if paired with a correct fragment. */
  readonly forbidden?: readonly string[];
}

/**
 * Comprehension questions. Answers are derived from the documents themselves,
 * so a change of the normative content must be mirrored here (guarded by
 * tools/onboardingGate.test.ts, which checks each expected value against the
 * source document text).
 */
export const ONBOARDING_QUESTIONS: readonly OnboardingQuestion[] = [
  // Первые три вопроса — предметные (RICIS-III), два уровня строго разделены:
  //   тождественный индекс (a = a):  0_a/0_a = 1 (L1; Lean divSelf_one / L1_identity, LEAN_VERIFIED),
  //                                  0_a * inf_a = a^2 (A6, случай F = G);
  //   разные индексы (NF(F) ≠ NF(G)): 0_F/0_G = F/G (A4), 0_F * inf_G = F*G (A6).
  // Смешение уровней — ошибка исполнителя (две мои редакции R1 её содержали: «0/0=1? — НЕТ»,
  // затем «1 (L1), 0_F/0_G = F/G» — F/G к тождественному a не относится; штраф, 2026-09-20).
  // Классический рефлекс «NaN/неопределённость» выдаёт исполнителя, не открывавшего канон.
  {
    id: 'R1',
    question:
      'RICIS-III, a = 0 (тождество a = a). Чему равно 0_a/0_a? Форма: «1 (L1)». ' +
      'Классические ответы NaN/неопределённость и подстановка A4 (F/G) для тождественного индекса — отказ.',
    source: 'docs/01-architecture/ricis-unified-complete-document-7.9-vector.json L1_IDENTITY / SP1 (0_F/0_F -> 1)',
    expected: ['1 (L1)', '1, L1', '1 L1', '0_A/0_A = 1 (L1)'],
    kind: 'exact',
    forbidden: ['NAN', 'НЕОПРЕДЕЛЕН', 'НЕОПРЕДЕЛЕННОСТЬ', 'НЕОПРЕДЕЛЁННОСТЬ', 'НЕТ', 'NO', '0', 'INF', '∞', 'F/G', 'A/A', 'ОШИБКА', 'ERROR'],
  },
  {
    id: 'R2',
    question: 'RICIS-III, тот же a = 0. Чему равно 0_a * inf_a? (A6_GENERAL, случай F = G).',
    source: 'docs/01-architecture/ricis-unified-complete-document-7.9-vector.json A6_GENERAL (includes F=G giving F^2)',
    expected: ['A^2', 'A²', 'A*A', 'A·A'],
    kind: 'exact',
    forbidden: ['0', '1', 'INF', '∞', 'NAN', 'НЕОПРЕДЕЛЕН', 'НЕОПРЕДЕЛЕННОСТЬ', 'НЕОПРЕДЕЛЁННОСТЬ', 'F*G', 'F/G'],
  },
  {
    id: 'R3',
    question: 'RICIS-III, РАЗНЫЕ индексы, NF(F) ≠ NF(G): чему равно 0_F/0_G (A4) и 0_F * inf_G (A6)? Форма: «F/G, F*G».',
    source: 'docs/01-architecture/ricis-unified-complete-document-7.9-vector.json A4_0DIV0 / A6_GENERAL',
    expected: ['F/G, F*G', 'F/G; F*G', 'F/G F*G'],
    kind: 'exact',
    forbidden: ['1', '0', 'NAN', 'INF', '∞', 'НЕОПРЕДЕЛЕН'],
  },
  {
    id: 'Q1',
    question: 'Перечислите пять терминальных состояний RCVAP (список).',
    source: 'docs/00-governance/RCVAP_AUTONOMOUS_ANTI_TUKHTA_AGILE_PROTOCOL.md §4',
    expected: ['COMPLETED', 'PARTIALLY_COMPLETED', 'BLOCKED', 'REJECTED', 'HYPOTHESIS'],
    kind: 'set',
  },
  {
    id: 'Q2',
    question: 'Путь единственного реестра, без записи в котором утверждение о Lean-артефакте не имеет силы.',
    source: 'AGENTS.md §12',
    expected: ['artifacts/proofs/core-checks/kernel-findings.json'],
    kind: 'exact',
  },
  {
    id: 'Q3',
    question: 'Обязательный префикс поля informalExternalClaim у узла карты с открытой внешней задачей.',
    source: 'AGENTS.md §13',
    expected: ['INFORMAL:'],
    kind: 'exact',
  },
  {
    id: 'Q4',
    question: 'Два допустимых маркера аудитора по правилу No Self-Certification (список).',
    source: 'AGENTS.md §1',
    expected: ['AUDITOR: EXTERNAL', 'AUDITOR: SELF (same-pipeline)'],
    kind: 'set',
  },
  {
    id: 'Q5',
    question: 'Метка, которой помечается утверждение о компилируемости, полученное статическим чтением, а не прогоном ядра.',
    source: 'AGENTS.md §12.2',
    expected: ['UNVERIFIED_PREDICTION'],
    kind: 'exact',
  },
  {
    id: 'Q6',
    question: 'Как называется результат, удовлетворяющий метрике/тесту/отчёту, но не решающий исходную задачу?',
    source: 'docs/00-governance/RCVAP_AUTONOMOUS_ANTI_TUKHTA_AGILE_PROTOCOL.md §1',
    expected: ['TUKHTA', 'ТУФТА'],
    kind: 'exact',
  },
  {
    id: 'Q7',
    question: 'Статус, до которого внешний Lean-исходник может быть повышен ТОЛЬКО успешным kernel run без compiler error и без sorryAx.',
    source: 'AGENTS.md §7',
    expected: ['TRUSTED_AXIOM'],
    kind: 'exact',
  },
];

export interface AttestedDocument {
  readonly path: string;
  readonly sha256: string;
}

export interface OnboardingAttestation {
  readonly executor_key: string;
  readonly attested_at: string;
  readonly documents: readonly AttestedDocument[];
  readonly acceptance: string;
  readonly comprehension: Readonly<Record<string, string | readonly string[]>>;
  /**
   * Per-executor verbatim quotes (red-team R3b, 2026-09-20): the gate derives from the
   * executor key WHICH line of WHICH mandatory documents must be quoted. Copying another
   * executor's attestation cannot satisfy this: the required lines differ per key, so the
   * only way to fill it is to open the document at that line.
   */
  readonly quotes?: Readonly<Record<string, string>>;
}

/** Number of documents each executor must quote from. */
export const QUOTE_DOCUMENT_COUNT = 3;
/** Minimal length of a quotable line (avoids trivial headings / blank lines). */
export const QUOTE_MIN_LINE_LENGTH = 60;

export interface RequiredQuote {
  readonly path: string;
  readonly lineNumber: number;
  readonly text: string;
}

function keyedIndex(executorKey: string, salt: string, modulo: number): number {
  const digest = sha256Hex(`${executorKey}:${salt}`);
  return Number.parseInt(digest.slice(0, 12), 16) % modulo;
}

function quotableLines(content: string): ReadonlyArray<{ readonly lineNumber: number; readonly text: string }> {
  return content
    .split('\n')
    .map((text, index) => ({ lineNumber: index + 1, text: text.trim() }))
    .filter((line) => line.text.length >= QUOTE_MIN_LINE_LENGTH && !line.text.startsWith('```'));
}

/**
 * Derives the executor-specific set of required quotes from the documents as present in
 * the snapshot. Deterministic in (key, document bytes): a document change moves the line
 * and thereby also invalidates the quote, consistent with ONBOARDING_DOCUMENT_STALE.
 */
export function requiredQuotesFor(executorKey: string, read: FileReader): readonly RequiredQuote[] {
  const candidates = MANDATORY_STUDY_DOCUMENTS.filter((path) => !path.endsWith('.json'));
  const chosen: string[] = [];
  let attempt = 0;
  while (chosen.length < Math.min(QUOTE_DOCUMENT_COUNT, candidates.length)) {
    const path = candidates[keyedIndex(executorKey, `doc:${attempt}`, candidates.length)]!;
    if (!chosen.includes(path)) chosen.push(path);
    attempt += 1;
  }
  const result: RequiredQuote[] = [];
  for (const path of chosen) {
    const content = read(path);
    if (content === null) continue;
    const lines = quotableLines(content.toString());
    if (lines.length === 0) continue;
    const line = lines[keyedIndex(executorKey, `line:${path}`, lines.length)]!;
    result.push({ path, lineNumber: line.lineNumber, text: line.text });
  }
  return result;
}

export type OnboardingViolationCode =
  | 'ONBOARDING_ATTESTATION_MISSING'
  | 'ONBOARDING_ATTESTATION_MALFORMED'
  | 'ONBOARDING_KEY_MISMATCH'
  | 'ONBOARDING_DOCUMENT_NOT_ATTESTED'
  | 'ONBOARDING_DOCUMENT_STALE'
  | 'ONBOARDING_DOCUMENT_UNREADABLE'
  | 'ONBOARDING_ACCEPTANCE_MISSING'
  | 'ONBOARDING_ANSWER_MISSING'
  | 'ONBOARDING_ANSWER_WRONG'
  | 'ONBOARDING_QUOTE_MISSING'
  | 'ONBOARDING_QUOTE_WRONG';

export interface OnboardingViolation {
  readonly code: OnboardingViolationCode;
  readonly message: string;
}

export type OnboardingCheck =
  | { readonly ok: true; readonly executorKey: string; readonly documents: number }
  | { readonly ok: false; readonly executorKey: string; readonly violations: readonly OnboardingViolation[] };

/** Reader abstraction: returns file content or null when the file does not exist. */
export type FileReader = (path: string) => string | Buffer | null;

export function sha256Hex(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

export function attestationPathFor(executorKey: string): string {
  return `${ONBOARDING_DIR}/${executorKey}.json`;
}

/** Normalizes an answer: trims, collapses whitespace, upper-cases, strips trailing punctuation. */
export function normalizeAnswer(answer: string): string {
  return answer
    .replace(/\s+/gu, ' ')
    .trim()
    .replace(/[.;,]+$/u, '')
    .toUpperCase();
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function parseAttestation(json: string): OnboardingAttestation | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  if (typeof record.executor_key !== 'string') return null;
  if (typeof record.attested_at !== 'string') return null;
  if (typeof record.acceptance !== 'string') return null;
  if (!Array.isArray(record.documents)) return null;
  const documents: AttestedDocument[] = [];
  for (const entry of record.documents) {
    if (typeof entry !== 'object' || entry === null) return null;
    const document = entry as Record<string, unknown>;
    if (typeof document.path !== 'string' || typeof document.sha256 !== 'string') return null;
    documents.push({ path: document.path, sha256: document.sha256 });
  }
  if (typeof record.comprehension !== 'object' || record.comprehension === null) return null;
  const comprehension: Record<string, string | readonly string[]> = {};
  for (const [id, answer] of Object.entries(record.comprehension as Record<string, unknown>)) {
    if (typeof answer === 'string') comprehension[id] = answer;
    else if (isStringArray(answer)) comprehension[id] = answer;
    else return null;
  }
  let quotes: Record<string, string> | undefined;
  if (record.quotes !== undefined) {
    if (typeof record.quotes !== 'object' || record.quotes === null) return null;
    quotes = {};
    for (const [path, text] of Object.entries(record.quotes as Record<string, unknown>)) {
      if (typeof text !== 'string') return null;
      quotes[path] = text;
    }
  }
  return {
    executor_key: record.executor_key,
    attested_at: record.attested_at,
    documents,
    acceptance: record.acceptance,
    comprehension,
    ...(quotes === undefined ? {} : { quotes }),
  };
}

export function checkAnswer(question: OnboardingQuestion, answer: string | readonly string[] | undefined): boolean {
  if (answer === undefined) return false;
  if (question.kind === 'set') {
    const given = (typeof answer === 'string' ? answer.split(/[,;\n]/u) : answer)
      .map(normalizeAnswer)
      .filter((item) => item !== '');
    const expected = question.expected.map(normalizeAnswer);
    if (given.length !== expected.length) return false;
    const expectedSet = new Set(expected);
    return given.every((item) => expectedSet.has(item)) && new Set(given).size === expected.length;
  }
  const given = normalizeAnswer(typeof answer === 'string' ? answer : answer.join(' '));
  if (question.forbidden !== undefined) {
    const head = given.split(/[,;:\s]/u)[0] ?? '';
    if (question.forbidden.map(normalizeAnswer).includes(head)) return false;
  }
  return question.expected.map(normalizeAnswer).includes(given);
}

/**
 * G0 check for one executor key against a snapshot (working tree or commit).
 * Every mandatory document must be attested with the sha256 of its content in
 * THIS snapshot: a changed document invalidates the attestation until re-read.
 */
export function checkOnboarding(executorKey: string, read: FileReader): OnboardingCheck {
  const violations: OnboardingViolation[] = [];
  const path = attestationPathFor(executorKey);
  const raw = read(path);
  if (raw === null) {
    return {
      ok: false,
      executorKey,
      violations: [
        {
          code: 'ONBOARDING_ATTESTATION_MISSING',
          message: `нет аттестации ${path}: ${ONBOARDING_EXCEPTION_TEXT}`,
        },
      ],
    };
  }
  const attestation = parseAttestation(raw.toString());
  if (attestation === null) {
    return {
      ok: false,
      executorKey,
      violations: [{ code: 'ONBOARDING_ATTESTATION_MALFORMED', message: `${path} не соответствует схеме аттестации` }],
    };
  }
  if (attestation.executor_key !== executorKey) {
    violations.push({
      code: 'ONBOARDING_KEY_MISMATCH',
      message: `executor_key внутри ${path} (${attestation.executor_key}) не равен ключу файла`,
    });
  }

  const attested = new Map(attestation.documents.map((document) => [document.path, document.sha256]));
  for (const documentPath of MANDATORY_STUDY_DOCUMENTS) {
    const content = read(documentPath);
    if (content === null) {
      violations.push({ code: 'ONBOARDING_DOCUMENT_UNREADABLE', message: `обязательный документ отсутствует: ${documentPath}` });
      continue;
    }
    const actual = sha256Hex(content);
    const declared = attested.get(documentPath);
    if (declared === undefined) {
      violations.push({ code: 'ONBOARDING_DOCUMENT_NOT_ATTESTED', message: `документ не аттестован: ${documentPath}` });
    } else if (declared !== actual) {
      violations.push({
        code: 'ONBOARDING_DOCUMENT_STALE',
        message: `документ изменился после аттестации: ${documentPath} (аттестовано ${declared.slice(0, 12)}…, в дереве ${actual.slice(0, 12)}…) — перечитать и переаттестовать`,
      });
    }
  }

  if (attestation.acceptance.trim() !== ACCEPTANCE_STATEMENT) {
    violations.push({ code: 'ONBOARDING_ACCEPTANCE_MISSING', message: 'принятие норм не выражено точной формулой ACCEPTANCE_STATEMENT' });
  }

  for (const question of ONBOARDING_QUESTIONS) {
    const answer = attestation.comprehension[question.id];
    if (answer === undefined) {
      violations.push({ code: 'ONBOARDING_ANSWER_MISSING', message: `нет ответа на ${question.id} (${question.source})` });
    } else if (!checkAnswer(question, answer)) {
      violations.push({ code: 'ONBOARDING_ANSWER_WRONG', message: `неверный ответ на ${question.id}: перечитать ${question.source}` });
    }
  }

  for (const required of requiredQuotesFor(executorKey, read)) {
    const given = attestation.quotes?.[required.path];
    if (given === undefined || given.trim() === '') {
      violations.push({
        code: 'ONBOARDING_QUOTE_MISSING',
        message: `нет дословной цитаты из ${required.path} (строка ${required.lineNumber}) — открыть документ и процитировать`,
      });
    } else if (given.replace(/\s+/gu, ' ').trim() !== required.text.replace(/\s+/gu, ' ')) {
      violations.push({
        code: 'ONBOARDING_QUOTE_WRONG',
        message: `цитата из ${required.path} не совпадает со строкой ${required.lineNumber} этой редакции документа`,
      });
    }
  }

  return violations.length === 0
    ? { ok: true, executorKey, documents: MANDATORY_STUDY_DOCUMENTS.length }
    : { ok: false, executorKey, violations };
}

/** Builds an attestation skeleton: hashes filled, acceptance and answers left for the executor. */
export function buildAttestationSkeleton(executorKey: string, read: FileReader, now: Date): OnboardingAttestation {
  return {
    executor_key: executorKey,
    attested_at: now.toISOString(),
    documents: MANDATORY_STUDY_DOCUMENTS.map((path) => {
      const content = read(path);
      return { path, sha256: content === null ? '' : sha256Hex(content) };
    }),
    acceptance: '',
    comprehension: Object.fromEntries(ONBOARDING_QUESTIONS.map((question) => [question.id, ''])),
    quotes: Object.fromEntries(
      requiredQuotesFor(executorKey, read).map((required) => [required.path, `<дословно строка ${required.lineNumber}>`]),
    ),
  };
}

export const ONBOARDING_EXCEPTION_TEXT =
  'исключение: исполнитель не допущен к работе — сначала обязательное изучение документации ' +
  '(MANDATORY_STUDY_DOCUMENTS), затем аттестация `npm run onboarding:attest` (заполнить acceptance ' +
  'и ответы на вопросы) и проверка `npm run onboarding:gate` (docs/00-governance/EXECUTION_TRACEABILITY_GATES.md §0)';
