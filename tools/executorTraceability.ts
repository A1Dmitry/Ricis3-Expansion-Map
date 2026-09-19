/**
 * Executor traceability primitives ("ворота трассировки исполнителя").
 *
 * Normative source: docs/00-governance/EXECUTION_TRACEABILITY_GATES.md.
 * Registration file: docs/00-governance/EXECUTOR_KEY.md.
 *
 * An executor is identified only by an opaque deterministic SHA-256 key. The
 * underlying executor identity (model, provider, version) is never written
 * into the repository: these primitives accept and emit only the 64-hex key,
 * never the identity behind it.
 */

/** Registration file of the current executor key (relative to repository root). */
export const EXECUTOR_KEY_FILE = 'docs/00-governance/EXECUTOR_KEY.md';

/** Commit header rule: «исполнитель : <ключ>», key = 64 lowercase hex chars. */
const EXECUTOR_HEADER_PATTERN = /^исполнитель : ([0-9a-f]{64})(?:\s.*)?$/;

/** The literal prefix used to distinguish a malformed key from a missing header. */
const EXECUTOR_PREFIX_PATTERN = /^исполнитель\s*:/i;

/** Registered key line inside EXECUTOR_KEY.md (exact template, no extra fields). */
const REGISTERED_KEY_PATTERN = /^executor_key: ([0-9a-f]{64})$/m;

export type ExecutorHeaderCheck =
  | { readonly ok: true; readonly key: string }
  | {
      readonly ok: false;
      readonly code: 'EXECUTOR_HEADER_MISSING' | 'EXECUTOR_KEY_FORMAT';
      readonly message: string;
    };

/**
 * Parses a commit subject (header) against the §2 rule of
 * EXECUTION_TRACEABILITY_GATES.md: it must start with
 * «исполнитель : <ключ>», where <ключ> is 64 lowercase hex chars; a short
 * human summary may follow the key, details belong in the commit body.
 */
export function parseExecutorHeader(subject: string): ExecutorHeaderCheck {
  const trimmed = subject.trim();
  const match = EXECUTOR_HEADER_PATTERN.exec(trimmed);
  if (match !== null) {
    return { ok: true, key: match[1] };
  }
  if (EXECUTOR_PREFIX_PATTERN.test(trimmed)) {
    return {
      ok: false,
      code: 'EXECUTOR_KEY_FORMAT',
      message:
        `заголовок обязан иметь вид «исполнитель : <ключ>», где ключ — 64 строчных ` +
        `hex-символа; получено: «${trimmed}»; ${KEYLESS_COMMIT_EXCEPTION_TEXT}`,
    };
  }
  return {
    ok: false,
    code: 'EXECUTOR_HEADER_MISSING',
    message: `в заголовке нет префикса «исполнитель : <ключ>»; получено: «${trimmed}»; ${KEYLESS_COMMIT_EXCEPTION_TEXT}`,
  };
}

/**
 * Extracts the registered executor key from the EXECUTOR_KEY.md content.
 * Returns null when the file does not carry a syntactically valid key line.
 */
export function extractRegisteredKey(executorKeyMarkdown: string): string | null {
  const match = REGISTERED_KEY_PATTERN.exec(executorKeyMarkdown);
  return match === null ? null : match[1];
}

export type ForensicsPolicy = 'restudy' | 'reject';

export type ForensicsVerdict =
  | {
      readonly verdict: 'MANDATORY_DOCUMENTATION_STUDY';
      readonly executorKey: string;
      readonly report: readonly string[];
    }
  | {
      readonly verdict: 'REJECT';
      /** null when the offending commit carries no valid executor header. */
      readonly executorKey: string | null;
      readonly report: readonly string[];
    };

/**
 * Mandatory full-documentation study list issued with a
 * MANDATORY_DOCUMENTATION_STUDY verdict (G2, policy restudy).
 */
export const MANDATORY_STUDY_DOCUMENTS: readonly string[] = [
  'AGENTS.md',
  'docs/00-governance/RCVAP_AUTONOMOUS_ANTI_TUKHTA_AGILE_PROTOCOL.md',
  'docs/00-governance/WORK_PATTERNS.md',
  'docs/00-governance/TOYOTA_TPS_WORKING_SYSTEM.md',
  'docs/00-governance/RICIS_IMMUTABILITY_MANIFEST.md',
  'docs/00-governance/RICIS_SEMANTIC_AUTHORITY.md',
  'docs/00-governance/RICIS_EXTERNAL_EXECUTOR_PROTOCOL.md',
  'docs/00-governance/EXECUTION_TRACEABILITY_GATES.md',
  'docs/01-architecture/ricis-unified-complete-document-7.9-vector.json',
];

/**
 * Обязательный текст исключения, которым ворота (G1, G3) отклоняют коммит без
 * ключа: executor_key ещё не создан по протоколу. Отклоняющий обязан показать
 * исполнителю этот текст: создать ключ по протоколу и — лучше — пройти
 * обязательное обучение (полное изучение документации, §3 G2).
 */
export const KEYLESS_COMMIT_EXCEPTION_TEXT =
  'исключение: коммит без ключа отклонён — надо создать ключ по вышеописанному протоколу ' +
  '(docs/00-governance/EXECUTION_TRACEABILITY_GATES.md §1–§2, регистрация — ' +
  'docs/00-governance/EXECUTOR_KEY.md), а лучше еще и пройти обучение — обязательное ' +
  'изучение всей документации (перечень — MANDATORY_STUDY_DOCUMENTS и отчёт ворот G2)';

/**
 * Builds the G2 verdict for the first commit that broke functionality
 * (found by bisect over the GitHub history):
 *  - policy restudy → the offending executor key is sent to mandatory full
 *    documentation study; the corrective commit must acknowledge it with the
 *    trailer «documentation-restudy: <ключ>»;
 *  - policy reject, or an unattributable offender (no valid header) →
 *    immediate REJECT: the contribution is refused and the reliability
 *    minus of the key is recorded in the gate report.
 */
export function buildForensicsVerdict(input: {
  readonly badCommitSha: string;
  readonly badCommitSubject: string;
  readonly policy: ForensicsPolicy;
}): ForensicsVerdict {
  const header = parseExecutorHeader(input.badCommitSubject);
  const attribution = header.ok
    ? `исполнитель ключа ${header.key}`
    : 'исполнитель не идентифицирован (заголовок без валидного ключа)';
  const head = [
    `сломавший функционал коммит: ${input.badCommitSha} «${input.badCommitSubject}»`,
    `атрибуция: ${attribution}`,
  ];

  if (input.policy === 'reject' || !header.ok) {
    return {
      verdict: 'REJECT',
      executorKey: header.ok ? header.key : null,
      report: [
        ...head,
        header.ok
          ? `немедленный отказ: вклад исполнителя ${header.key} отклоняется, минус надёжности ключа фиксируется в отчёте ворот`
          : 'немедленный отказ: неатрибутируемый коммит-нарушитель отклоняется полностью',
        'повторный приём вкладов — только после принудительного изучения всей документации и повторной проверки ворот',
      ],
    };
  }

  return {
    verdict: 'MANDATORY_DOCUMENTATION_STUDY',
    executorKey: header.key,
    report: [
      ...head,
      `исполнитель ключа ${header.key} принудительно направляется на изучение всей документации:`,
      ...MANDATORY_STUDY_DOCUMENTS.map((document) => `  - ${document}`),
      `исправляющий коммит обязан нести trailer «documentation-restudy: ${header.key}» как подтверждение изучения`,
    ],
  };
}
