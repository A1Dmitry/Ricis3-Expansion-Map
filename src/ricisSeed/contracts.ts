/**
 * RICIS SEED — контракты протокола саморасширения RICIS (мета-аксиома A11).
 *
 * Идея (формулировка автора, Д. В. Алейников):
 *
 *   RICIS — это не застывший список A1…A10, а СЕМЯ (seed):
 *
 *       RICIS(n+1) = Ric.ExpandTo( RICIS(n), Resolve(U(n)) )
 *
 *   где
 *       U(n)     — нерешённая структурная (сингулярная) проблема поколения n;
 *       Resolve  — РАЗРЕШИТЬ И ДОКАЗАТЬ (а не «подобрать ответ»);
 *       ExpandTo — допуск доказанного правила в аксиоматику (Commit).
 *
 * A11 — это НЕ одиннадцатая математическая аксиома рядом с A1…A10.
 * A11 — это МЕТА-АКСИОМА (протокол расширяемости), то есть правило,
 * разрешающее самой системе RICIS порождать новые доказанные правила.
 *
 * Ключевое ограничение (защита от туфты):
 *   ExpandTo НЕ равен Resolve. Resolve даёт доказательство,
 *   а ExpandTo — это отдельный акт допуска с независимыми воротами (admissibility gates).
 *   Никакое «просто посчитанное» утверждение не становится аксиомой автоматически.
 */

import type { AxiomFingerprint, SeedFingerprint } from './fingerprint';

// ---------------------------------------------------------------------------
// 1. Идентификаторы и слои аксиоматики
// ---------------------------------------------------------------------------

export type LawId = 'L0' | 'L1' | 'L1C1' | 'L1C2' | 'L1C3';
export type ProtocolId = 'SP1' | 'SP2' | 'SP3' | 'SP4' | 'SP5';
export type ProhibitionId = 'P1';
export type MathAxiomId = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7' | 'A8' | 'A9' | 'A10';
export type MetaAxiomId = 'A11';
export type ExpansionAxiomId = `A${number}` & string;

export type AxiomId = LawId | ProtocolId | ProhibitionId | MathAxiomId | MetaAxiomId;

/**
 * Слой аксиоматики:
 *  LAW        — абсолютный закон (не выводится, не пересматривается);
 *  PROTOCOL   — протокол безопасности/порядка применения;
 *  AXIOM      — математическое правило разрешения сингулярности;
 *  META_AXIOM — правило над самой системой правил (A11: расширяемость).
 */
export type AxiomLayer = 'LAW' | 'PROTOCOL' | 'AXIOM' | 'META_AXIOM';

/** Класс сингулярности / структурной формы, которую аксиома покрывает. */
export type SingularityClass =
  | 'ZERO_OVER_ZERO'
  | 'INF_OVER_INF'
  | 'ZERO_TIMES_INF'
  | 'INF_MINUS_INF'
  | 'ZERO_MINUS_ZERO'
  | 'SCALAR_OVER_ZERO'
  | 'SCALAR_TIMES_ZERO'
  | 'NESTED_SINGULAR_DIV'
  | 'MIXED_ZERO_INF_DIFF'
  | 'POWER_OF_SINGULAR';

/** Ядро зерна: не переопределяется никаким расширением. */
/**
 * Защищённое ядро зерна (СП9): законы, протоколы, запреты и сама A11.
 * Расширение не вправе переопределить ни один элемент этого списка.
 */
export const PROTECTED_CORE_IDS: readonly AxiomId[] = Object.freeze([
  'L0', 'L1', 'L1C1', 'L1C2', 'L1C3',
  'SP1', 'SP2', 'SP3', 'SP4', 'SP5',
  'P1',
  'A11',
]);

/**
 * Аксиомы, снятые в v7.7/v7.9. Они сохраняются в таблице как историческая запись,
 * но не входят в активное зерно R0 (см. `AXIOMS.deprecated` единого документа).
 */
export const DEPRECATED_AXIOM_IDS: readonly string[] = Object.freeze(['A3', 'A6_BYPASS']);

// ---------------------------------------------------------------------------
// 2. Доказательство (Resolve = разрешить + доказать)
// ---------------------------------------------------------------------------

export type ProofRule = AxiomId | 'LOCAL_STRUCTURAL_REDUCTION' | 'CLASSICAL' | 'LEAN_KERNEL';

export interface ProofStep {
  /** Правило, применённое на шаге. Обязано существовать в R(n) либо быть внешне подтверждённым. */
  readonly rule: ProofRule;
  readonly from: string;
  readonly to: string;
}

export type ProofStrategy =
  /** Доказательство средствами структурной алгебры RICIS (без пределов и без численных порогов). */
  | 'RICIS_STRUCTURAL'
  /** Шаг унаследован из классической алгебры и явно помечен как классический. */
  | 'INHERITED_CLASSICAL'
  /** Внешнее доказательство ядром Lean (нужны toolchain + compiler output + #print axioms). */
  | 'LEAN_KERNEL'
  /** Кандидат без доказательства. НИКОГДА не проходит ворота допуска. */
  | 'UNPROVEN';

export interface ExternalKernelEvidence {
  readonly toolchain: string;
  readonly command: string;
  readonly compilerOutput: string;
  readonly printAxiomsOutput: string;
  readonly kernelRunOk: boolean;
  readonly sorryFree: boolean;
}

export interface ProofCertificate {
  readonly strategy: ProofStrategy;
  readonly steps: readonly ProofStep[];
  /** Финальное утверждение. Обязано совпадать с statement кандидата (иначе вывод не доказан). */
  readonly conclusion: string;
  /** Применены ли пределы Коши (lim). В RICIS запрещены. */
  readonly usesLimits: boolean;
  /** Применены ли численные приближения/пороги (Math.abs < eps). В RICIS запрещены. */
  readonly usesNumericApproximation: boolean;
  readonly externalEvidence?: ExternalKernelEvidence;
}

// ---------------------------------------------------------------------------
// 3. Проблема, кандидат, разрешение
// ---------------------------------------------------------------------------

export interface UnsolvedSingularProblem {
  readonly id: string;
  /** Человекочитаемая постановка класса задач. */
  readonly statement: string;
  /** Каноническая входная форма, по которой проверяется «уже покрыто / не покрыто». */
  readonly inputForm: string;
  readonly singularityClasses: readonly SingularityClass[];
  /** Аксиомы, которых (по заявлению) недостаточно для покрытия формы. */
  readonly coverageClaim: readonly AxiomId[];
}

export interface CandidateAxiom {
  readonly id: string;
  readonly layer: Extract<AxiomLayer, 'AXIOM' | 'PROTOCOL'>;
  readonly statement: string;
  readonly guard?: string;
  /** Канонические следствия: входная форма → выходная форма (таблица O(1)-редукции). */
  readonly consequences: readonly { readonly inputForm: string; readonly outputForm: string }[];
  readonly covers: readonly SingularityClass[];
}

export interface Resolution {
  readonly problem: UnsolvedSingularProblem;
  readonly candidate: CandidateAxiom;
  readonly proof: ProofCertificate;
}

export type UnresolvedReason =
  | 'NO_PROOF'
  | 'PROOF_INCOMPLETE'
  | 'FORBIDDEN_LIMIT_SEMANTICS'
  | 'UNKNOWN_PROBLEM'
  | 'ALREADY_COVERED_BY_RICIS';

export type ResolutionResult =
  | { readonly kind: 'RESOLVED'; readonly resolution: Resolution }
  | { readonly kind: 'UNRESOLVED'; readonly problemId: string; readonly reason: UnresolvedReason };

// ---------------------------------------------------------------------------
// 4. Аксиома и поколение системы
// ---------------------------------------------------------------------------

export type AxiomOrigin = 'SEED' | 'EXPANSION';

export interface RicisAxiom {
  readonly id: AxiomId;
  readonly layer: AxiomLayer;
  readonly statement: string;
  /**
   * Ограничение применимости по тождеству (L1/SP2).
   * Например, A7 не применяется, когда индексы структурно идентичны:
   * сначала работает тождество X - X = 0.
   */
  readonly guard?: string;
  readonly fingerprint: AxiomFingerprint;
  readonly origin: AxiomOrigin;
  readonly covers: readonly SingularityClass[];
  readonly consequences: readonly { readonly inputForm: string; readonly outputForm: string }[];
  /** Для origin = 'EXPANSION': какая проблема была разрешена и чем доказана. */
  readonly solvedProblemId?: string;
  readonly proof?: ProofCertificate;
}

export interface ExpansionRecord {
  readonly sequence: number;
  readonly fromGeneration: number;
  readonly toGeneration: number;
  readonly problemId: string;
  readonly problemInputForm: string;
  readonly axiomId: string;
  readonly axiomFingerprint: AxiomFingerprint;
  readonly seedFingerprintBefore: SeedFingerprint;
  readonly seedFingerprintAfter: SeedFingerprint;
  readonly proofStrategy: ProofStrategy;
  readonly proofStepCount: number;
}

export interface RicisSeedState {
  readonly generation: number;
  readonly axioms: readonly RicisAxiom[];
  readonly ledger: readonly ExpansionRecord[];
  readonly fingerprint: SeedFingerprint;
}

// ---------------------------------------------------------------------------
// 5. Состояние x в записи (x) => x.Resolve(U)
// ---------------------------------------------------------------------------

/**
 * `x` в `(x) => x.Resolve(UnsolvedSingularProblem)` — это НЕ число и НЕ переменная задачи.
 * Это текущее состояние самой системы RICIS: её аксиомы, покрытие и история.
 */
export interface RicisState {
  readonly generation: number;
  readonly axioms: readonly RicisAxiom[];
  readonly coveredForms: readonly string[];
  readonly solvedProblemIds: readonly string[];
  hasAxiom(id: AxiomId): boolean;
  covers(problem: UnsolvedSingularProblem): boolean;
  Resolve(problem: UnsolvedSingularProblem): ResolutionResult;
}

/** Программа расширения: `(x) => x.Resolve(U)`. */
export type ExpansionProgram = (state: RicisState) => ResolutionResult;

// ---------------------------------------------------------------------------
// 6. Ворота допуска (Admissibility / Commit)
// ---------------------------------------------------------------------------

export type GateId =
  | 'RESOLUTION_PRESENT'
  | 'RULE_SET_CLOSED'
  | 'NO_SELF_CERTIFICATION'
  | 'PROOF_CHAIN_CONNECTED'
  | 'NO_FORBIDDEN_SEMANTICS'
  | 'PROBLEM_OPEN_IN_RICIS'
  | 'NO_DUPLICATE_AXIOM'
  | 'CORE_PROTECTED'
  | 'CONSISTENCY_TABLE'
  | 'IDENTITY_COHERENCE'
  | 'MONOTONIC_COMMIT';

export type GateOutcome = 'PASS' | 'FAIL' | 'SKIPPED';

export interface GateCheck {
  readonly gate: GateId;
  readonly outcome: GateOutcome;
  readonly detail: string;
}

export type ExpansionRejection =
  | 'RESOLUTION_REQUIRED'
  | 'PROBLEM_ALREADY_COVERED'
  | 'DUPLICATE_AXIOM'
  | 'SELF_CERTIFICATION'
  | 'PROOF_RULE_UNKNOWN'
  | 'PROOF_CONCLUSION_MISMATCH'
  | 'PROOF_CHAIN_BROKEN'
  | 'PROTECTED_CORE_MUTATION'
  | 'CONTRADICTS_EXISTING_AXIOM'
  | 'IDENTITY_VIOLATION'
  | 'FORBIDDEN_NON_RICIS_SEMANTICS'
  | 'INVALID_PROBLEM'
  | 'INVALID_CANDIDATE';

export type ExpansionResult =
  | {
      readonly kind: 'EXPANDED';
      readonly seed: RicisSeedState;
      readonly axiom: RicisAxiom;
      readonly record: ExpansionRecord;
      readonly trace: readonly GateCheck[];
    }
  | {
      readonly kind: 'REJECTED';
      readonly seed: RicisSeedState;
      readonly reason: ExpansionRejection;
      readonly detail: string;
      readonly trace: readonly GateCheck[];
    };

// ---------------------------------------------------------------------------
// 7. Порт решателя (Resolve — внешний по отношению к чистой математике движок)
// ---------------------------------------------------------------------------

export interface UnsolvedProblemResolver {
  readonly resolverId: string;
  readonly supportedProblemIds: readonly string[];
  resolve(problem: UnsolvedSingularProblem, state: RicisState): ResolutionResult;
}
