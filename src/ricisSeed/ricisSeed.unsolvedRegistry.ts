/**
 * RICIS SEED — реестр нерешённых проблем и решателей для демонстрации протокола A11.
 *
 * ВАЖНО О ГРАНИЦЕ ДОВЕРИЯ:
 *  - РАСШИРЕНИЯ, помеченные `trust: 'STRUCTURAL_PROOF'`, выводятся ИСКЛЮЧИТЕЛЬНО
 *    из уже принятых аксиом зерна (A1–A11, SP1–SP4, L0/L1) и классической алгебры дробей.
 *    Это ПРОИЗВОДНЫЕ правила (теоремы), а не новые независимые допущения.
 *  - Локальная структурная проверка НЕ является запуском ядра Lean.
 *    Статус `LEAN_KERNEL` присваивается только при наличии внешнего kernel run
 *    (toolchain + compiler output + `#print axioms` + отсутствие `sorryAx`).
 *  - Сценарии с `trust: 'REJECTION_DEMO'` существуют для Challenger-проверки:
 *    они показывают, какие попытки «протащить» аксиому система обязана отвергнуть.
 */

import type {
  AxiomId,
  CandidateAxiom,
  ProofRule,
  ProofCertificate,
  ResolutionResult,
  RicisState,
  SingularityClass,
  UnsolvedProblemResolver,
  UnsolvedSingularProblem,
} from './contracts';

export type DemoTrust = 'STRUCTURAL_PROOF' | 'REJECTION_DEMO' | 'OPEN_NO_PROOF';

export interface DemoProblemView {
  readonly problem: UnsolvedSingularProblem;
  readonly title: string;
  readonly latex: string;
  readonly trust: DemoTrust;
  /** Ожидаемое поведение протокола (для UI и для Challenger-тестов). */
  readonly expectation: 'EXPANDS' | 'REJECTED';
  readonly expectationText: string;
}

function problem(
  id: string,
  inputForm: string,
  classes: readonly SingularityClass[],
  coverageClaim: readonly AxiomId[],
): UnsolvedSingularProblem {
  return Object.freeze({ id, statement: inputForm, inputForm, singularityClasses: Object.freeze([...classes]), coverageClaim: Object.freeze([...coverageClaim]) });
}

function certificate(
  strategy: ProofCertificate['strategy'],
  steps: ProofCertificate['steps'],
  conclusion: string,
): ProofCertificate {
  return Object.freeze({
    strategy,
    steps: Object.freeze([...steps]),
    conclusion,
    usesLimits: false,
    usesNumericApproximation: false,
  });
}

function candidate(
  id: string,
  problemForm: string,
  conclusion: string,
  covers: readonly SingularityClass[],
  consequences: readonly { readonly inputForm: string; readonly outputForm: string }[],
  guard?: string,
): CandidateAxiom {
  return Object.freeze({
    id,
    layer: 'AXIOM',
    statement: `${problemForm} = ${conclusion}`,
    guard,
    covers: Object.freeze([...covers]),
    consequences: Object.freeze(consequences.map(entry => Object.freeze({ ...entry }))),
  });
}

// ---------------------------------------------------------------------------
// Реестр проблем
// ---------------------------------------------------------------------------

export const UNSOLVED_PROBLEM_REGISTRY: readonly UnsolvedSingularProblem[] = Object.freeze([
  problem('U-NESTED-SINGULAR-DIV', '(0_F/0_G)/(0_H/0_K)', ['NESTED_SINGULAR_DIV', 'ZERO_OVER_ZERO'], ['SP2', 'SP3', 'A4']),
  problem('U-MIXED-ZERO-INF-DIFF', '0_F*(inf_G-inf_H)', ['MIXED_ZERO_INF_DIFF', 'INF_MINUS_INF', 'ZERO_TIMES_INF'], ['SP2', 'A6', 'A7']),
  problem('U-INF-SELF-DIFF', 'inf_F-inf_F', ['INF_MINUS_INF'], ['A2', 'A7']),
  problem('U-POWER-OF-SINGULAR', '(0_F)^(inf_G)', ['POWER_OF_SINGULAR'], ['A6']),
  problem('U-COMMUTED-ZERO-INF-PRODUCT', 'inf_F*0_G', ['ZERO_TIMES_INF'], ['A6']),
  problem('U-REVERSED-ZERO-QUOTIENT-PRODUCT', '(0_F/0_G)*(0_H/0_K)', ['NESTED_SINGULAR_DIV', 'ZERO_OVER_ZERO'], ['SP2', 'A4']),
  problem('U-IDENTITY-LAW-RESTATEMENT', '0_F/0_F', ['ZERO_OVER_ZERO'], ['L1']),
  problem('U-CONJUGATE-SINGULAR-PRODUCT', '0_F*inf_G', ['ZERO_TIMES_INF'], ['A6']),
  problem('U-INF-SELF-DIFF-WRONG-BRANCH', 'inf_G-inf_G', ['INF_MINUS_INF'], ['A7', 'A2']),
]);

export const DEMO_PROBLEM_CATALOG: readonly DemoProblemView[] = Object.freeze([
  {
    problem: UNSOLVED_PROBLEM_REGISTRY[0]!,
    title: 'Вложенное сингулярное деление',
    latex: '\\frac{0_F/0_G}{0_H/0_K}',
    trust: 'STRUCTURAL_PROOF',
    expectation: 'EXPANDS',
    expectationText: 'Форма не покрыта R(n) напрямую. A4 + A4 + классическая алгебра дробей дают доказанноеderived rule A12.',
  },
  {
    problem: UNSOLVED_PROBLEM_REGISTRY[1]!,
    title: 'Смешанная форма: ноль на разность бесконечностей',
    latex: '0_F \\times (\\infty_G - \\infty_H)',
    trust: 'STRUCTURAL_PROOF',
    expectation: 'EXPANDS',
    expectationText: 'Чистое RICIS-доказательство без классических шагов: A7 → A6. Даёт A13.',
  },
  {
    problem: UNSOLVED_PROBLEM_REGISTRY[2]!,
    title: 'Вычитание бесконечности из самой себя',
    latex: '\\infty_F - \\infty_F',
    trust: 'STRUCTURAL_PROOF',
    expectation: 'EXPANDS',
    expectationText:
      'inf_F - inf_F — это X - X, а не сингулярная разность: по тождеству L1 (SP2 — сначала чистка) ' +
      'результат 0. Даёт A14 = 0; ветка A7 → inf_0 → A2 → 1 тождество нарушает и отклоняется.',
  },
  {
    problem: UNSOLVED_PROBLEM_REGISTRY[3]!,
    title: 'Возведение индексированного нуля в индексированную бесконечность',
    latex: '(0_F)^{\\infty_G}',
    trust: 'OPEN_NO_PROOF',
    expectation: 'REJECTED',
    expectationText: 'Класс действительно открыт, но доказательства нет: ExpandTo обязан отказать (RESOLUTION_REQUIRED).',
  },
  {
    problem: UNSOLVED_PROBLEM_REGISTRY[4]!,
    title: 'Самосертификация: кандидат ссылается сам на себя',
    latex: '\\infty_F \\times 0_G',
    trust: 'REJECTION_DEMO',
    expectation: 'REJECTED',
    expectationText: 'Шаг доказательства ссылается на аксиому A15, которую это доказательство и вводит: SELF_CERTIFICATION.',
  },
  {
    problem: UNSOLVED_PROBLEM_REGISTRY[5]!,
    title: 'Кандидат, ломающий таблицу согласованности',
    latex: '\\frac{0_F}{0_G} \\cdot \\frac{0_H}{0_K}',
    trust: 'REJECTION_DEMO',
    expectation: 'REJECTED',
    expectationText: 'Цепочка формально связана, но кандидат переопределяет уже доказанную форму 0_F/0_G: CONTRADICTS_EXISTING_AXIOM.',
  },
  {
    problem: UNSOLVED_PROBLEM_REGISTRY[6]!,
    title: 'Попытка переопределить закон тождества L1',
    latex: '\\frac{0_F}{0_F}',
    trust: 'REJECTION_DEMO',
    expectation: 'REJECTED',
    expectationText: 'Ядро зерна (L0, L1, L1C1, L1C2, SP1–SP4, A11) не переопределяется расширениями: PROTECTED_CORE_MUTATION.',
  },
  {
    problem: UNSOLVED_PROBLEM_REGISTRY[8]!,
    title: 'Нарушение тождества: цепочка A7 → inf_0 → A2 даёт 1 вместо 0',
    latex: '\infty_F - \\infty_F \\xrightarrow{A7,A2} 1',
    trust: 'REJECTION_DEMO',
    expectation: 'REJECTED',
    expectationText:
      'Цепочка формально корректна (все правила есть в R(n)), но результат 1 нарушает тождество X - X = 0. ' +
      'Ворота IDENTITY_COHERENCE отклоняют кандидата: тождество применяется до аксиом сингулярностей.',
  },
  {
    problem: UNSOLVED_PROBLEM_REGISTRY[7]!,
    title: 'Форма, уже покрытая аксиомой A6',
    latex: '0_F \\times \\infty_G',
    trust: 'REJECTION_DEMO',
    expectation: 'REJECTED',
    expectationText: 'Запрет инфляции аксиом: то, что R(n) уже разрешает, не порождает новую аксиому (PROBLEM_ALREADY_COVERED).',
  },
]);

export function findDemoProblem(id: string): DemoProblemView | null {
  return DEMO_PROBLEM_CATALOG.find(entry => entry.problem.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Решатели
// ---------------------------------------------------------------------------

/**
 * Честный решатель: строит доказательство ТОЛЬКО из аксиом текущего поколения
 * и явно помеченных классических шагов. Никаких пределов и никаких численных порогов.
 */
const derivedRuleResolver: UnsolvedProblemResolver = Object.freeze({
  resolverId: 'ricis-seed/derived-rule-resolver',
  supportedProblemIds: Object.freeze([
    'U-NESTED-SINGULAR-DIV',
    'U-MIXED-ZERO-INF-DIFF',
    'U-INF-SELF-DIFF',
    'U-CONJUGATE-SINGULAR-PRODUCT',
  ]),
  resolve(problem: UnsolvedSingularProblem, _state: RicisState): ResolutionResult {
    switch (problem.id) {
      case 'U-NESTED-SINGULAR-DIV': {
        const conclusion = '(F*K)/(G*H)';
        return {
          kind: 'RESOLVED',
          resolution: {
            problem,
            candidate: candidate('A12', problem.inputForm, conclusion, ['NESTED_SINGULAR_DIV'], [
              { inputForm: problem.inputForm, outputForm: conclusion },
            ]),
            proof: certificate('INHERITED_CLASSICAL', [
              { rule: 'A4', from: '(0_F/0_G)/(0_H/0_K)', to: '(F/G)/(0_H/0_K)' },
              { rule: 'A4', from: '(F/G)/(0_H/0_K)', to: '(F/G)/(H/K)' },
              { rule: 'CLASSICAL', from: '(F/G)/(H/K)', to: '(F*K)/(G*H)' },
            ], conclusion),
          },
        };
      }
      case 'U-MIXED-ZERO-INF-DIFF': {
        const conclusion = 'F*(G-H)';
        return {
          kind: 'RESOLVED',
          resolution: {
            problem,
            candidate: candidate('A13', problem.inputForm, conclusion, ['MIXED_ZERO_INF_DIFF'], [
              { inputForm: problem.inputForm, outputForm: conclusion },
            ]),
            proof: certificate('RICIS_STRUCTURAL', [
              { rule: 'A7', from: '0_F*(inf_G-inf_H)', to: '0_F*inf_(G-H)' },
              { rule: 'A6', from: '0_F*inf_(G-H)', to: 'F*(G-H)' },
            ], conclusion),
          },
        };
      }
      case 'U-INF-SELF-DIFF': {
        // ТОЖДЕСТВО ПРЕЖДЕ АКСИОМ (L1 + SP2): inf_F - inf_F — это X - X, а не сингулярная разность.
        // Цепочка A7 -> inf_(F-F) -> inf_0 -> A2 -> 1 НАРУШАЕТ тождество и системой отклоняется
        // (см. отдельный Challenger-сценарий U-INF-SELF-DIFF-WRONG-BRANCH).
        const conclusion = '0';
        return {
          kind: 'RESOLVED',
          resolution: {
            problem,
            candidate: candidate(
              'A14',
              problem.inputForm,
              conclusion,
              ['INF_MINUS_INF'],
              [{ inputForm: problem.inputForm, outputForm: conclusion }],
              'Тождество L1: X - X = 0. Применяется до A7 (SP2); A7 работает только при NF(F) != NF(G).',
            ),
            proof: certificate('RICIS_STRUCTURAL', [
              { rule: 'L1', from: 'inf_F-inf_F', to: '0' },
            ], conclusion),
          },
        };
      }
      default:
        // Сюда попадает в том числе U-CONJUGATE-SINGULAR-PRODUCT: форма уже покрыта R(n),
        // но если покрытие снято вручную, решатель обязан честно сказать, что нового знания нет.
        return { kind: 'UNRESOLVED', problemId: problem.id, reason: 'ALREADY_COVERED_BY_RICIS' };
    }
  },
});

/**
 * Challenger-решатель: намеренно неправильные стратегии расширения.
 * Нужен, чтобы показать, что ворота действительно закрыты, а не декоративны.
 */
const adversarialResolver: UnsolvedProblemResolver = Object.freeze({
  resolverId: 'ricis-seed/adversarial-resolver',
  supportedProblemIds: Object.freeze([
    'U-POWER-OF-SINGULAR',
    'U-COMMUTED-ZERO-INF-PRODUCT',
    'U-REVERSED-ZERO-QUOTIENT-PRODUCT',
    'U-IDENTITY-LAW-RESTATEMENT',
    'U-INF-SELF-DIFF-WRONG-BRANCH',
  ]),
  resolve(problem: UnsolvedSingularProblem, _state: RicisState): ResolutionResult {
    switch (problem.id) {
      case 'U-POWER-OF-SINGULAR':
        // Класс открыт, но доказательства нет. Никакой «подгонки под ответ».
        return { kind: 'UNRESOLVED', problemId: problem.id, reason: 'NO_PROOF' };
      case 'U-COMMUTED-ZERO-INF-PRODUCT': {
        const conclusion = 'F*G';
        return {
          kind: 'RESOLVED',
          resolution: {
            problem,
            candidate: candidate('A15', problem.inputForm, conclusion, ['ZERO_TIMES_INF'], [
              { inputForm: problem.inputForm, outputForm: conclusion },
            ]),
            // НАМЕРЕННАЯ ОШИБКА СЦЕНАРИЯ: шаг ссылается на аксиому A15, которую это
            // доказательство само и вводит. Приведение типа необходимо, потому что
            // A15 заведомо отсутствует в R(n) — именно это ловят ворота NO_SELF_CERTIFICATION.
            proof: certificate('RICIS_STRUCTURAL', [
              { rule: 'A15' as unknown as ProofRule, from: 'inf_F*0_G', to: 'F*G' },
            ], conclusion),
          },
        };
      }
      case 'U-REVERSED-ZERO-QUOTIENT-PRODUCT': {
        const conclusion = '(G*K)/(F*H)';
        return {
          kind: 'RESOLVED',
          resolution: {
            problem,
            candidate: candidate('A16', problem.inputForm, conclusion, ['NESTED_SINGULAR_DIV'], [
              { inputForm: '0_F/0_G', outputForm: 'G/F' },
              { inputForm: problem.inputForm, outputForm: conclusion },
            ]),
            proof: certificate('INHERITED_CLASSICAL', [
              { rule: 'CLASSICAL', from: '(0_F/0_G)*(0_H/0_K)', to: '(G/F)*(K/H)' },
              { rule: 'CLASSICAL', from: '(G/F)*(K/H)', to: '(G*K)/(F*H)' },
            ], conclusion),
          },
        };
      }
      case 'U-INF-SELF-DIFF-WRONG-BRANCH': {
        // НАМЕРЕННО НЕВЕРНАЯ ВЕТКА (историческая ошибка): A7 -> inf_(F-F) -> inf_0 -> A2 -> 1.
        // Формально цепочка связана и правила существуют в R(n), но результат 1 противоречит
        // тождеству X - X = 0. Ворота IDENTITY_COHERENCE обязаны это перехватить.
        const conclusion = '1';
        return {
          kind: 'RESOLVED',
          resolution: {
            problem,
            candidate: candidate('A17', problem.inputForm, conclusion, ['INF_MINUS_INF'], [
              { inputForm: problem.inputForm, outputForm: conclusion },
            ]),
            proof: certificate('RICIS_STRUCTURAL', [
              { rule: 'A7', from: 'inf_G-inf_G', to: 'inf_(G-G)' },
              { rule: 'LOCAL_STRUCTURAL_REDUCTION', from: 'inf_(G-G)', to: 'inf_0' },
              { rule: 'A2', from: 'inf_0', to: '1' },
            ], conclusion),
          },
        };
      }
      case 'U-IDENTITY-LAW-RESTATEMENT': {
        const conclusion = '1';
        return {
          kind: 'RESOLVED',
          resolution: {
            problem,
            candidate: candidate('L1', problem.inputForm, conclusion, ['ZERO_OVER_ZERO'], [
              { inputForm: problem.inputForm, outputForm: conclusion },
            ]),
            proof: certificate('RICIS_STRUCTURAL', [{ rule: 'L1', from: '0_F/0_F', to: '1' }], conclusion),
          },
        };
      }
      default:
        return { kind: 'UNRESOLVED', problemId: problem.id, reason: 'UNKNOWN_PROBLEM' };
    }
  },
});

export const DEMO_RESOLVERS: readonly UnsolvedProblemResolver[] = Object.freeze([derivedRuleResolver, adversarialResolver]);

export const HONEST_RESOLVERS: readonly UnsolvedProblemResolver[] = Object.freeze([derivedRuleResolver]);
