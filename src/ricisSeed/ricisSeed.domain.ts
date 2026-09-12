/**
 * RICIS SEED — домен протокола саморасширения (A11).
 *
 *   R0 = RICIS SEED
 *   R(n+1) = Ric.ExpandTo( R(n), Resolve(U(n)) )
 *
 * Разделение уровней (принципиально):
 *   Resolve  — разрешить И доказать (движок/решатель, внешний порт);
 *   ExpandTo — допустить доказанное правило в аксиоматику (независимые ворота).
 *
 * ВоротаExist для того, чтобы вычисленное утверждение НЕ становилось аксиомой автоматически.
 * Каждое расширение обязано пройти проверки RESOLUTION → PROOF → OPENNESS →
 * UNIQUENESS → CORE PROTECTION → CONSISTENCY → MONOTONIC COMMIT.
 */

import {
  PROTECTED_CORE_IDS,
  type AxiomId,
  type CandidateAxiom,
  type ExpansionProgram,
  type ExpansionRecord,
  type ExpansionRejection,
  type ExpansionResult,
  type ExternalKernelEvidence,
  type GateCheck,
  type GateId,
  type ProofCertificate,
  type ProofRule,
  type Resolution,
  type ResolutionResult,
  type RicisAxiom,
  type RicisSeedState,
  type RicisState,
  type UnsolvedProblemResolver,
  type UnsolvedSingularProblem,
} from './contracts';
import { canonicalizeForm, identityExpectation, indexSymbolsOf, substituteSymbol } from './canonicalForm';
import { axiomFingerprint, seedFingerprint, type SeedFingerprint } from './fingerprint';
import { SEED_AXIOM_TABLE, type SeedAxiomDefinition } from './seedTable';

const LOCAL_RULES: readonly ProofRule[] = ['LOCAL_STRUCTURAL_REDUCTION'];

// ---------------------------------------------------------------------------
// Построение зерна
// ---------------------------------------------------------------------------

export function axiomFromDefinition(definition: SeedAxiomDefinition): RicisAxiom {
  return Object.freeze({
    id: definition.id,
    layer: definition.layer,
    statement: definition.statement,
    fingerprint: axiomFingerprint({
      id: definition.id,
      layer: definition.layer,
      statement: definition.statement,
      guard: definition.guard,
      covers: definition.covers,
      consequences: definition.consequences,
    }),
    origin: 'SEED' as const,
    guard: definition.guard,
    covers: Object.freeze([...definition.covers]),
    consequences: Object.freeze(definition.consequences.map(entry => Object.freeze({ ...entry }))),
  });
}

export function createSeedAxioms(): readonly RicisAxiom[] {
  // Снятые аксиомы (A3, A6_BYPASS) остаются в таблице как история, но не входят в активное зерно R0.
  return Object.freeze(SEED_AXIOM_TABLE.filter(entry => entry.deprecated !== true).map(axiomFromDefinition));
}

export function computeSeedFingerprint(generation: number, axioms: readonly RicisAxiom[]): SeedFingerprint {
  return seedFingerprint(generation, axioms.map(axiom => axiom.fingerprint));
}

export function createSeed(): RicisSeedState {
  const axioms = createSeedAxioms();
  return Object.freeze({
    generation: 0,
    axioms,
    ledger: Object.freeze([]) as readonly ExpansionRecord[],
    fingerprint: computeSeedFingerprint(0, axioms),
  });
}

/** Канонические входные формы, которые система уже разрешает напрямую (таблица O(1)-редукции). */
export function coveredFormsOf(axioms: readonly RicisAxiom[]): readonly string[] {
  const forms = new Set<string>();
  for (const axiom of axioms) {
    for (const consequence of axiom.consequences) forms.add(consequence.inputForm);
  }
  return Object.freeze([...forms].sort());
}

/** Классы сингулярностей, покрытые системой (для UI и диагностики). */
export function coveredClassesOf(axioms: readonly RicisAxiom[]): readonly string[] {
  const classes = new Set<string>();
  for (const axiom of axioms) for (const entry of axiom.covers) classes.add(entry);
  return Object.freeze([...classes].sort());
}

export function findAxiom(seed: RicisSeedState, id: AxiomId): RicisAxiom | null {
  return seed.axioms.find(axiom => axiom.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Проверка инвариантов зерна (используется воротами MONOTONIC_COMMIT и тестами)
// ---------------------------------------------------------------------------

export interface SeedInvariantReport {
  readonly ok: boolean;
  readonly violations: readonly string[];
}

export function verifySeedInvariants(seed: RicisSeedState): SeedInvariantReport {
  const violations: string[] = [];

  const ids = new Set<string>();
  const fingerprints = new Set<string>();
  for (const axiom of seed.axioms) {
    if (ids.has(axiom.id)) violations.push(`duplicate axiom id: ${axiom.id}`);
    if (fingerprints.has(axiom.fingerprint)) violations.push(`duplicate axiom fingerprint: ${axiom.fingerprint}`);
    ids.add(axiom.id);
    fingerprints.add(axiom.fingerprint);
  }

  const expectedFingerprint = computeSeedFingerprint(seed.generation, seed.axioms);
  if (seed.fingerprint !== expectedFingerprint) {
    violations.push(`seed fingerprint mismatch: stored=${seed.fingerprint} expected=${expectedFingerprint}`);
  }

  if (seed.generation !== seed.ledger.length) {
    violations.push(`generation/ledger drift: generation=${seed.generation} ledger=${seed.ledger.length}`);
  }

  for (const [index, record] of seed.ledger.entries()) {
    if (record.sequence !== index) violations.push(`ledger sequence broken at ${index}`);
    if (record.toGeneration !== index + 1) violations.push(`ledger generation broken at ${index}`);
    if (!ids.has(record.axiomId)) violations.push(`ledger record ${record.problemId} has no committed axiom`);
  }

  // Ядро зерна обязано сохраняться без изменений на всех поколениях (L0 / L1).
  for (const id of PROTECTED_CORE_IDS) {
    const current = findAxiom(seed, id);
    const original = SEED_AXIOM_TABLE.find(entry => entry.id === id);
    if (!current || !original) {
      violations.push(`protected core axiom missing: ${id}`);
      continue;
    }
    const expected = axiomFromDefinition(original);
    if (current.fingerprint !== expected.fingerprint) {
      violations.push(`protected core axiom mutated: ${id}`);
    }
  }

  // Монотонность: аксиомы расширений идут после аксиом зерна в порядке журнала.
  const expansionAxioms = seed.axioms.filter(axiom => axiom.origin === 'EXPANSION');
  if (expansionAxioms.length !== seed.ledger.length) {
    violations.push('expansion axiom count does not match ledger length');
  }

  return Object.freeze({ ok: violations.length === 0, violations: Object.freeze(violations) });
}

// ---------------------------------------------------------------------------
// Состояние x и система Ric
// ---------------------------------------------------------------------------

function isWellFormedProblem(problem: UnsolvedSingularProblem | null | undefined): problem is UnsolvedSingularProblem {
  if (!problem) return false;
  return (
    typeof problem.id === 'string' &&
    problem.id.length > 0 &&
    typeof problem.inputForm === 'string' &&
    problem.inputForm.length > 0 &&
    Array.isArray(problem.singularityClasses) &&
    problem.singularityClasses.length > 0
  );
}

function isWellFormedCandidate(candidate: CandidateAxiom | null | undefined): candidate is CandidateAxiom {
  if (!candidate) return false;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    (candidate.layer === 'AXIOM' || candidate.layer === 'PROTOCOL') &&
    typeof candidate.statement === 'string' &&
    candidate.statement.length > 0
  );
}

export interface RicisSystem {
  readonly seed: RicisSeedState;
  readonly state: RicisState;
  /** `Ric.ExpandTo((x) => x.Resolve(U))` */
  ExpandTo(program: ExpansionProgram): ExpansionResult;
  /** Продолжить рост от нового поколения: `Ric.from(result.seed)`. */
  from(seed: RicisSeedState): RicisSystem;
}

export interface RicisSystemOptions {
  readonly seed?: RicisSeedState;
  readonly resolvers: readonly UnsolvedProblemResolver[];
}

export function createRicisState(seed: RicisSeedState, resolvers: readonly UnsolvedProblemResolver[]): RicisState {
  const coveredForms = coveredFormsOf(seed.axioms);
  const solvedProblemIds = Object.freeze(seed.ledger.map(record => record.problemId));
  const knownIds = new Set(seed.axioms.map(axiom => axiom.id));

  const resolveProblem = (problem: UnsolvedSingularProblem): ResolutionResult => {
    // Идентификатор извлекается ДО сужения типа: guard `isWellFormedProblem`
    // сужает отрицательную ветку до never, поэтому обращаться к problem.id там нельзя.
    const problemId: string = problem && typeof problem.id === 'string' ? problem.id : 'unknown';
    if (!isWellFormedProblem(problem)) {
      return { kind: 'UNRESOLVED', problemId, reason: 'UNKNOWN_PROBLEM' };
    }
    // Resolve ничего не «решает» повторно: уже покрытая форма — это не новое знание (запрет инфляции аксиом).
    if (coveredForms.includes(problem.inputForm) || solvedProblemIds.includes(problem.id)) {
      return { kind: 'UNRESOLVED', problemId: problem.id, reason: 'ALREADY_COVERED_BY_RICIS' };
    }
    for (const claim of problem.coverageClaim) {
      if (!knownIds.has(claim)) {
        return { kind: 'UNRESOLVED', problemId: problem.id, reason: 'UNKNOWN_PROBLEM' };
      }
    }
    const resolver = resolvers.find(entry => entry.supportedProblemIds.includes(problem.id));
    if (!resolver) {
      return { kind: 'UNRESOLVED', problemId: problem.id, reason: 'UNKNOWN_PROBLEM' };
    }
    return resolver.resolve(problem, stateFacade);
  };

  const stateFacade: RicisState = Object.freeze({
    generation: seed.generation,
    axioms: seed.axioms,
    coveredForms,
    solvedProblemIds,
    hasAxiom: (id: AxiomId) => knownIds.has(id),
    covers: (problem: UnsolvedSingularProblem) =>
      isWellFormedProblem(problem) &&
      (coveredForms.includes(problem.inputForm) || solvedProblemIds.includes(problem.id)),
    Resolve: resolveProblem,
  });

  return stateFacade;
}

export function createRicisSystem(options: RicisSystemOptions): RicisSystem {
  const seed = options.seed ?? createSeed();
  const state = createRicisState(seed, options.resolvers);

  const from = (nextSeed: RicisSeedState): RicisSystem => createRicisSystem({ seed: nextSeed, resolvers: options.resolvers });

  return Object.freeze({
    seed,
    state,
    ExpandTo: (program: ExpansionProgram) => expandTo(seed, state, program),
    from,
  });
}

/** Последовательный рост: R0 → R1 → … → Rk по списку нерешённых проблем. */
export function grow(
  system: RicisSystem,
  problems: readonly UnsolvedSingularProblem[],
): { readonly system: RicisSystem; readonly results: readonly ExpansionResult[] } {
  let current = system;
  const results: ExpansionResult[] = [];
  for (const problem of problems) {
    const result = current.ExpandTo((x: RicisState) => x.Resolve(problem));
    results.push(result);
    if (result.kind === 'EXPANDED') current = current.from(result.seed);
  }
  return Object.freeze({ system: current, results: Object.freeze(results) });
}

// ---------------------------------------------------------------------------
// Ворота допуска
// ---------------------------------------------------------------------------

interface GateRun {
  readonly trace: readonly GateCheck[];
  readonly rejection: { readonly reason: ExpansionRejection; readonly detail: string } | null;
}

class GateRunner {
  private readonly checks: GateCheck[] = [];
  private rejection: { readonly reason: ExpansionRejection; readonly detail: string } | null = null;
  private readonly failedGates = new Set<GateId>();

  pass(gate: GateId, detail: string): void {
    this.checks.push({ gate, outcome: 'PASS', detail });
  }

  skip(gate: GateId, detail: string): void {
    this.checks.push({ gate, outcome: 'SKIPPED', detail });
  }

  fail(gate: GateId, reason: ExpansionRejection, detail: string): void {
    this.failedGates.add(gate);
    this.checks.push({ gate, outcome: 'FAIL', detail });
    if (!this.rejection) this.rejection = { reason, detail: `${gate}: ${detail}` };
  }

  hasFailed(gate: GateId): boolean {
    return this.failedGates.has(gate);
  }

  finish(remaining: readonly GateId[]): GateRun {
    for (const gate of remaining) {
      if (!this.checks.some(check => check.gate === gate)) this.skip(gate, 'не выполнено: предыдущие ворота закрыты');
    }
    return Object.freeze({ trace: Object.freeze(this.checks), rejection: this.rejection });
  }
}

const ALL_GATES: readonly GateId[] = Object.freeze([
  'RESOLUTION_PRESENT',
  'CORE_PROTECTED',
  'NO_FORBIDDEN_SEMANTICS',
  'NO_SELF_CERTIFICATION',
  'RULE_SET_CLOSED',
  'PROOF_CHAIN_CONNECTED',
  'PROBLEM_OPEN_IN_RICIS',
  'NO_DUPLICATE_AXIOM',
  'CONSISTENCY_TABLE',
  'IDENTITY_COHERENCE',
  'MONOTONIC_COMMIT',
]);

function kernelEvidenceOk(evidence: ExternalKernelEvidence | undefined): boolean {
  return Boolean(evidence && evidence.kernelRunOk && evidence.sorryFree && evidence.printAxiomsOutput.length > 0);
}

function allowedRulesFor(proof: ProofCertificate): readonly ProofRule[] {
  switch (proof.strategy) {
    case 'RICIS_STRUCTURAL':
      return [...LOCAL_RULES];
    case 'INHERITED_CLASSICAL':
      return [...LOCAL_RULES, 'CLASSICAL'];
    case 'LEAN_KERNEL':
      return [...LOCAL_RULES, 'CLASSICAL', 'LEAN_KERNEL'];
    case 'UNPROVEN':
      return [];
    default:
      return [];
  }
}

function hasForbiddenSemantics(proof: ProofCertificate): string | null {
  if (proof.usesLimits) return 'доказательство использует предельный переход (lim) — запрещено в RICIS';
  if (proof.usesNumericApproximation) return 'доказательство использует численное приближение/порог (eps) — запрещено в RICIS';
  if (proof.strategy === 'LEAN_KERNEL' && !kernelEvidenceOk(proof.externalEvidence)) {
    return 'заявлен LEAN_KERNEL, но нет подтверждённого kernel run (compiler output / #print axioms / sorry-free)';
  }
  return null;
}

function checkConsistency(seed: RicisSeedState, candidate: CandidateAxiom): string | null {
  const table = new Map<string, { readonly outputForm: string; readonly axiomId: string }>();
  for (const axiom of seed.axioms) {
    for (const consequence of axiom.consequences) {
      const existing = table.get(consequence.inputForm);
      if (existing && existing.outputForm !== consequence.outputForm) {
        // Внутреннее противоречие самого зерна фиксируется, но не маскируется.
        return `внутреннее противоречие в R(${seed.generation}): ${consequence.inputForm} → ${existing.outputForm} и ${consequence.outputForm}`;
      }
      table.set(consequence.inputForm, { outputForm: consequence.outputForm, axiomId: axiom.id });
    }
  }
  const local = new Map<string, string>();
  for (const consequence of candidate.consequences) {
    const own = local.get(consequence.inputForm);
    if (own && own !== consequence.outputForm) {
      return `кандидат сам себе противоречит на форме ${consequence.inputForm}`;
    }
    local.set(consequence.inputForm, consequence.outputForm);
    const existing = table.get(consequence.inputForm);
    if (existing && existing.outputForm !== consequence.outputForm) {
      return `форма ${consequence.inputForm} уже разрешена аксиомой ${existing.axiomId} как ${existing.outputForm}, кандидат даёт ${consequence.outputForm}`;
    }
  }
  return null;
}

/**
 * Все подстановки отождествления индексных символов (включая тождественную).
 * Для n <= 4 перебираются все отображения (n^n), иначе — попарные отождествления:
 * цель — проверить случаи, когда индексы совпадают, а не построить полную унификацию.
 */
function identityInstantiations(symbols: readonly string[]): readonly (readonly string[])[] {
  const unique = [...new Set(symbols)].sort();
  if (unique.length === 0) return Object.freeze([Object.freeze([])]);
  if (unique.length ** unique.length <= 512) {
    const maps: (readonly string[])[] = [];
    const build = (position: number, current: string[]): void => {
      if (position === unique.length) {
        maps.push(Object.freeze([...current]));
        return;
      }
      for (const target of unique) build(position + 1, [...current, target]);
    };
    build(0, []);
    return Object.freeze(maps);
  }
  const maps: (readonly string[])[] = [Object.freeze(unique.map(symbol => symbol))];
  for (const from of unique) {
    for (const to of unique) {
      if (from === to) continue;
      maps.push(Object.freeze(unique.map(symbol => (symbol === from ? to : symbol))));
    }
  }
  return Object.freeze(maps);
}

function applyInstantiation(form: string, symbols: readonly string[], targets: readonly string[]): string {
  let result = form;
  for (const [index, symbol] of symbols.entries()) {
    const target = targets[index];
    if (!target || target === symbol) continue;
    result = substituteSymbol(result, symbol, target);
  }
  return result;
}

/**
 * Ворота ТОЖДЕСТВА (L1): структура вида E - E обязана дать 0, а E / E — 1,
 * причём ДО аксиом сингулярностей (SP2). Проверка выполняется для самой формы
 * кандидата и для всех отождествлений его индексных символов, потому что
 * таблица следствий сравнивает формы как строки и не видит совпадения индексов.
 */
export function identityCoherenceViolation(
  consequences: readonly { readonly inputForm: string; readonly outputForm: string }[],
): string | null {
  for (const consequence of consequences) {
    const symbols = [...new Set([
      ...indexSymbolsOf(consequence.inputForm),
      ...indexSymbolsOf(consequence.outputForm),
    ])].sort();

    for (const targets of identityInstantiations(symbols)) {
      const inputForm = applyInstantiation(consequence.inputForm, symbols, targets);
      const outputForm = applyInstantiation(consequence.outputForm, symbols, targets);
      const expected = identityExpectation(inputForm);
      if (expected === null) continue;
      const actual = canonicalizeForm(outputForm);
      if (actual !== expected) {
        return (
          `при совпадении операндов форма ${inputForm} обязана дать ${expected} по тождеству L1 ` +
          `(X ${expected === '0' ? '-' : '/'} X = ${expected}), а кандидат даёт ${actual}. ` +
          'Тождество применяется до A4/A5/A7 (SP2) и не нарушается никаким расширением.'
        );
      }
    }
  }
  return null;
}

export function expandTo(seed: RicisSeedState, state: RicisState, program: ExpansionProgram): ExpansionResult {
  const gates = new GateRunner();

  // --- выполнение программы расширения ------------------------------------
  let produced: ResolutionResult;
  try {
    produced = program(state);
  } catch (error) {
    gates.fail('RESOLUTION_PRESENT', 'RESOLUTION_REQUIRED', `программа расширения завершилась ошибкой: ${String(error)}`);
    return {
      kind: 'REJECTED',
      seed,
      reason: 'RESOLUTION_REQUIRED',
      detail: gates.finish(ALL_GATES).rejection?.detail ?? 'RESOLUTION_PRESENT',
      trace: gates.finish(ALL_GATES).trace,
    };
  }

  const resolution: Resolution | null =
    produced && produced.kind === 'RESOLVED' ? produced.resolution : null;

  if (!resolution || !isWellFormedProblem(resolution.problem) || !isWellFormedCandidate(resolution.candidate) || !resolution.proof) {
    const reason: ExpansionRejection = produced && produced.kind === 'UNRESOLVED' && produced.reason === 'ALREADY_COVERED_BY_RICIS'
      ? 'PROBLEM_ALREADY_COVERED'
      : produced && produced.kind === 'UNRESOLVED' && produced.reason === 'UNKNOWN_PROBLEM'
        ? 'INVALID_PROBLEM'
        : 'RESOLUTION_REQUIRED';
    const detail =
      produced && produced.kind === 'UNRESOLVED'
        ? `Resolve вернул UNRESOLVED (${produced.reason}) для проблемы ${produced.problemId}`
        : 'программа расширения не вернула доказанное разрешение';
    gates.fail('RESOLUTION_PRESENT', reason, detail);
    // Независимая фиксация причины: даже если доказательства нет, ворота открытости
    // обязаны явно зафиксировать, что форма уже покрыта R(n) (запрет инфляции аксиом).
    if (reason === 'PROBLEM_ALREADY_COVERED') {
      gates.fail('PROBLEM_OPEN_IN_RICIS', 'PROBLEM_ALREADY_COVERED', detail);
    }
    const run = gates.finish(ALL_GATES);
    return { kind: 'REJECTED', seed, reason, detail: run.rejection?.detail ?? detail, trace: run.trace };
  }

  const proof = resolution.proof;
  const problem = resolution.problem;
  const candidate = resolution.candidate;

  if (proof.strategy === 'UNPROVEN' || proof.steps.length === 0) {
    gates.fail('RESOLUTION_PRESENT', 'RESOLUTION_REQUIRED', 'нет доказательства: strategy=UNPROVEN или пустая цепочка шагов');
  } else {
    gates.pass('RESOLUTION_PRESENT', `Resolve(U=${problem.id}) вернул доказательство: стратегия ${proof.strategy}, шагов ${proof.steps.length}`);
  }

  // Защита ядра: законы, протоколы и сама A11 не переопределяются расширениями.
  if ((PROTECTED_CORE_IDS as readonly string[]).includes(candidate.id)) {
    gates.fail('CORE_PROTECTED', 'PROTECTED_CORE_MUTATION', `${candidate.id} принадлежит защищённому ядру зерна`);
  } else {
    gates.pass('CORE_PROTECTED', 'кандидат не затрагивает защищённое ядро');
  }

  const forbidden = hasForbiddenSemantics(proof);
  if (forbidden) gates.fail('NO_FORBIDDEN_SEMANTICS', 'FORBIDDEN_NON_RICIS_SEMANTICS', forbidden);
  else gates.pass('NO_FORBIDDEN_SEMANTICS', 'пределы Коши и численные приближения не использованы');

  // Самосертификация: доказательство не вправе ссылаться на аксиому, которую само и вводит.
  const selfCiting = proof.steps.filter(step => step.rule === candidate.id);
  if (selfCiting.length > 0) {
    gates.fail('NO_SELF_CERTIFICATION', 'SELF_CERTIFICATION', `шаги доказательства ссылаются на вводимую аксиому ${candidate.id}`);
  } else if (!gates.hasFailed('RESOLUTION_PRESENT')) {
    gates.pass('NO_SELF_CERTIFICATION', `доказательство не ссылается на ${candidate.id}`);
  } else {
    gates.skip('NO_SELF_CERTIFICATION', 'нет доказательства для проверки');
  }

  // Замкнутость множества правил: каждый шаг обязан опираться на уже существующую аксиому R(n).
  const allowed = allowedRulesFor(proof);
  const knownIds = new Set(seed.axioms.map(axiom => axiom.id));
  const unknownRule = proof.steps.find(step => !allowed.includes(step.rule) && !knownIds.has(step.rule as AxiomId));
  if (unknownRule) {
    gates.fail('RULE_SET_CLOSED', 'PROOF_RULE_UNKNOWN', `шаг ссылается на правило ${unknownRule.rule}, отсутствующее в R(${seed.generation})`);
  } else if (!gates.hasFailed('RESOLUTION_PRESENT')) {
    gates.pass('RULE_SET_CLOSED', 'все правила шагов принадлежат R(n) или явно разрешены стратегией');
  } else {
    gates.skip('RULE_SET_CLOSED', 'нет доказательства для проверки');
  }

  // Связность цепочки и совпадение вывода с формулировкой кандидата.
  let chainProblem: { readonly reason: ExpansionRejection; readonly detail: string } | null = null;
  if (proof.steps.length > 0) {
    const first = proof.steps[0]!;
    if (first.from !== problem.inputForm) {
      chainProblem = { reason: 'PROOF_CHAIN_BROKEN', detail: `цепочка начинается с ${first.from}, а не с формы проблемы ${problem.inputForm}` };
    } else {
      for (let index = 1; index < proof.steps.length; index += 1) {
        const previous = proof.steps[index - 1]!;
        const current = proof.steps[index]!;
        if (previous.to !== current.from) {
          chainProblem = { reason: 'PROOF_CHAIN_BROKEN', detail: `разрыв цепочки на шаге ${index + 1}: ${previous.to} ≠ ${current.from}` };
          break;
        }
      }
      const last = proof.steps[proof.steps.length - 1]!;
      if (!chainProblem && last.to !== proof.conclusion) {
        chainProblem = { reason: 'PROOF_CONCLUSION_MISMATCH', detail: `последний шаг даёт ${last.to}, а conclusion = ${proof.conclusion}` };
      }
      const expectedStatement = `${problem.inputForm} = ${proof.conclusion}`;
      if (!chainProblem && candidate.statement !== expectedStatement) {
        chainProblem = {
          reason: 'PROOF_CONCLUSION_MISMATCH',
          detail: `statement кандидата (${candidate.statement}) ≠ доказанному утверждению (${expectedStatement})`,
        };
      }
    }
  }
  if (chainProblem) gates.fail('PROOF_CHAIN_CONNECTED', chainProblem.reason, chainProblem.detail);
  else if (!gates.hasFailed('RESOLUTION_PRESENT')) gates.pass('PROOF_CHAIN_CONNECTED', 'цепочка связана и завершается формулировкой кандидата');
  else gates.skip('PROOF_CHAIN_CONNECTED', 'нет доказательства для проверки');

  // Открытость проблемы: нельзя вводить аксиому там, где R(n) уже разрешает форму.
  if (state.covers(problem)) {
    gates.fail('PROBLEM_OPEN_IN_RICIS', 'PROBLEM_ALREADY_COVERED', `форма ${problem.inputForm} уже разрешается R(${seed.generation}) — новой аксиомы не требуется`);
  } else {
    gates.pass('PROBLEM_OPEN_IN_RICIS', `форма ${problem.inputForm} не покрыта R(${seed.generation})`);
  }

  // Уникальность: ни идентификатор, ни математическое содержание не должны повторяться.
  const fingerprint = axiomFingerprint({
    id: candidate.id,
    layer: candidate.layer,
    statement: candidate.statement,
    guard: candidate.guard,
    covers: candidate.covers,
    consequences: candidate.consequences,
  });
  const sameId = seed.axioms.find(axiom => axiom.id === candidate.id);
  const sameFingerprint = seed.axioms.find(axiom => axiom.fingerprint === fingerprint);
  if (sameId) gates.fail('NO_DUPLICATE_AXIOM', 'DUPLICATE_AXIOM', `идентификатор ${candidate.id} уже занят в R(${seed.generation})`);
  else if (sameFingerprint) gates.fail('NO_DUPLICATE_AXIOM', 'DUPLICATE_AXIOM', `такое же математическое содержание уже есть у ${sameFingerprint.id}`);
  else gates.pass('NO_DUPLICATE_AXIOM', 'идентификатор и содержание уникальны');

  // Согласованность: одинаковая входная форма не может иметь два разных результата.
  const inconsistency = checkConsistency(seed, candidate);
  if (inconsistency) gates.fail('CONSISTENCY_TABLE', 'CONTRADICTS_EXISTING_AXIOM', inconsistency);
  else gates.pass('CONSISTENCY_TABLE', 'таблица следствий кандидата согласована с R(n)');

  // Тождество: E - E = 0 и E / E = 1 при любом отождествлении индексов (L1 до аксиом сингулярностей).
  const identityViolation = identityCoherenceViolation([
    { inputForm: problem.inputForm, outputForm: proof.conclusion },
    ...candidate.consequences,
  ]);
  if (identityViolation) gates.fail('IDENTITY_COHERENCE', 'IDENTITY_VIOLATION', identityViolation);
  else gates.pass('IDENTITY_COHERENCE', 'тождество L1 (X - X = 0, X / X = 1) не нарушается ни при одном отождествлении индексов');

  const run = gates.finish(ALL_GATES);
  if (run.rejection) {
    return { kind: 'REJECTED', seed, reason: run.rejection.reason, detail: run.rejection.detail, trace: run.trace };
  }

  // --- Commit -------------------------------------------------------------
  const axiom: RicisAxiom = Object.freeze({
    id: candidate.id as AxiomId,
    layer: candidate.layer,
    statement: candidate.statement,
    fingerprint,
    origin: 'EXPANSION',
    guard: candidate.guard,
    covers: Object.freeze([...candidate.covers]),
    consequences: Object.freeze(candidate.consequences.map(entry => Object.freeze({ ...entry }))),
    solvedProblemId: problem.id,
    proof: Object.freeze({ ...proof, steps: Object.freeze([...proof.steps]) }),
  });

  const nextAxioms = Object.freeze([...seed.axioms, axiom]);
  const nextGeneration = seed.generation + 1;
  const nextFingerprint = computeSeedFingerprint(nextGeneration, nextAxioms);

  const record: ExpansionRecord = Object.freeze({
    sequence: seed.ledger.length,
    fromGeneration: seed.generation,
    toGeneration: nextGeneration,
    problemId: problem.id,
    problemInputForm: problem.inputForm,
    axiomId: candidate.id,
    axiomFingerprint: fingerprint,
    seedFingerprintBefore: seed.fingerprint,
    seedFingerprintAfter: nextFingerprint,
    proofStrategy: proof.strategy,
    proofStepCount: proof.steps.length,
  });

  const nextSeed: RicisSeedState = Object.freeze({
    generation: nextGeneration,
    axioms: nextAxioms,
    ledger: Object.freeze([...seed.ledger, record]),
    fingerprint: nextFingerprint,
  });

  const invariants = verifySeedInvariants(nextSeed);
  const baseTrace = run.trace.filter(entry => entry.gate !== 'MONOTONIC_COMMIT');
  const commitCheck: GateCheck = invariants.ok
    ? Object.freeze({ gate: 'MONOTONIC_COMMIT', outcome: 'PASS', detail: `R(${seed.generation}) ⊂ R(${nextGeneration}); отпечаток ${nextFingerprint}` })
    : Object.freeze({ gate: 'MONOTONIC_COMMIT', outcome: 'FAIL', detail: invariants.violations.join('; ') });
  const trace: readonly GateCheck[] = Object.freeze([...baseTrace, commitCheck]);

  if (!invariants.ok) {
    return {
      kind: 'REJECTED',
      seed,
      reason: 'INVALID_CANDIDATE',
      detail: `MONOTONIC_COMMIT: ${invariants.violations.join('; ')}`,
      trace,
    };
  }

  return { kind: 'EXPANDED', seed: nextSeed, axiom, record, trace };
}
