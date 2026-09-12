import { describe, expect, it } from 'vitest';
import {
  createRicisSystem,
  createSeed,
  coveredFormsOf,
  grow,
  verifySeedInvariants,
  type RicisSystem,
} from './ricisSeed.domain';
import type { CandidateAxiom, ResolutionResult, RicisState, UnsolvedProblemResolver, UnsolvedSingularProblem } from './contracts';
import { DEMO_RESOLVERS, HONEST_RESOLVERS, UNSOLVED_PROBLEM_REGISTRY } from './ricisSeed.unsolvedRegistry';

const U_NESTED = UNSOLVED_PROBLEM_REGISTRY[0]!;
const U_MIXED = UNSOLVED_PROBLEM_REGISTRY[1]!;
const U_INF_SELF = UNSOLVED_PROBLEM_REGISTRY[2]!;
const U_POWER = UNSOLVED_PROBLEM_REGISTRY[3]!;
const U_SELF_CERT = UNSOLVED_PROBLEM_REGISTRY[4]!;
const U_CONTRADICTION = UNSOLVED_PROBLEM_REGISTRY[5]!;
const U_CORE = UNSOLVED_PROBLEM_REGISTRY[6]!;
const U_COVERED = UNSOLVED_PROBLEM_REGISTRY[7]!;

const Ric = createRicisSystem({ resolvers: DEMO_RESOLVERS });

function gateOutcome(result: { readonly trace: readonly { readonly gate: string; readonly outcome: string }[] }, gate: string): string {
  return result.trace.find(entry => entry.gate === gate)?.outcome ?? 'MISSING';
}

describe('RICIS SEED — протокол расширения R(n+1) = ExpandTo(R(n), Resolve(U(n)))', () => {
  it('разрешает и закрепляет новое правило, сохраняя исходное зерно (монотонность)', () => {
    const result = Ric.ExpandTo((x: RicisState) => x.Resolve(U_NESTED));

    expect(result.kind).toBe('EXPANDED');
    if (result.kind !== 'EXPANDED') return;

    expect(result.seed.generation).toBe(1);
    expect(result.axiom.id).toBe('A12');
    expect(result.axiom.origin).toBe('EXPANSION');
    expect(result.axiom.solvedProblemId).toBe(U_NESTED.id);
    expect(result.record.fromGeneration).toBe(0);
    expect(result.record.toGeneration).toBe(1);

    // R(n) ⊂ R(n+1): ни одна аксиома зерна не изменилась и не исчезла.
    const seedFingerprints = new Set(createSeed().axioms.map(axiom => axiom.fingerprint));
    for (const fingerprint of seedFingerprints) {
      expect(result.seed.axioms.some(axiom => axiom.fingerprint === fingerprint)).toBe(true);
    }
    expect(result.seed.axioms).toHaveLength(createSeed().axioms.length + 1);
    expect(verifySeedInvariants(result.seed).ok).toBe(true);
    // A11 (мета-аксиома) сохраняется без изменений.
    expect(result.seed.axioms.find(axiom => axiom.id === 'A11')?.fingerprint)
      .toBe(createSeed().axioms.find(axiom => axiom.id === 'A11')?.fingerprint);
  });

  it('растёт итеративно: R0 → R1 → R2 → R3 на цепочке нерешённых проблем', () => {
    const { system, results } = grow(Ric, [U_NESTED, U_MIXED, U_INF_SELF]);

    expect(results.map(entry => entry.kind)).toEqual(['EXPANDED', 'EXPANDED', 'EXPANDED']);
    expect(system.seed.generation).toBe(3);
    expect(system.seed.axioms.map(axiom => axiom.id)).toContain('A12');
    expect(system.seed.axioms.map(axiom => axiom.id)).toContain('A13');
    expect(system.seed.axioms.map(axiom => axiom.id)).toContain('A14');
    expect(system.seed.ledger).toHaveLength(3);
    expect(system.seed.ledger.map(record => record.sequence)).toEqual([0, 1, 2]);
    expect(verifySeedInvariants(system.seed).ok).toBe(true);
    expect(system.seed.generation).toBe(system.seed.ledger.length);
  });

  it('детерминирован: одинаковая цепочка расширений даёт одинаковый отпечаток поколения', () => {
    const left = grow(createRicisSystem({ resolvers: HONEST_RESOLVERS }), [U_NESTED, U_MIXED, U_INF_SELF]);
    const right = grow(createRicisSystem({ resolvers: HONEST_RESOLVERS }), [U_NESTED, U_MIXED, U_INF_SELF]);
    expect(left.system.seed.fingerprint).toBe(right.system.seed.fingerprint);
    expect(left.system.seed.fingerprint).not.toBe(createSeed().fingerprint);
  });

  it('раскрывает покрытие системы после расширения (новая форма теперь разрешается напрямую)', () => {
    const before = coveredFormsOf(createSeed().axioms);
    const result = Ric.ExpandTo((x: RicisState) => x.Resolve(U_MIXED));
    expect(result.kind).toBe('EXPANDED');
    if (result.kind !== 'EXPANDED') return;
    const after = coveredFormsOf(result.seed.axioms);
    expect(before).not.toContain('0_F*(inf_G-inf_H)');
    expect(after).toContain('0_F*(inf_G-inf_H)');
  });
});

describe('RICIS SEED — ворота допуска отказывают там, где доказательства или новизны нет', () => {
  it('отказывает, если форма уже покрыта R(n) (запрет инфляции аксиом)', () => {
    const result = Ric.ExpandTo((x: RicisState) => x.Resolve(U_COVERED));
    expect(result.kind).toBe('REJECTED');
    if (result.kind !== 'REJECTED') return;
    expect(result.reason).toBe('PROBLEM_ALREADY_COVERED');
    expect(gateOutcome(result, 'PROBLEM_OPEN_IN_RICIS')).toBe('FAIL');
    expect(result.seed.fingerprint).toBe(createSeed().fingerprint);
  });

  it('отказывает, если класс открыт, но Resolve не дал доказательства', () => {
    const result = Ric.ExpandTo((x: RicisState) => x.Resolve(U_POWER));
    expect(result.kind).toBe('REJECTED');
    if (result.kind !== 'REJECTED') return;
    expect(result.reason).toBe('RESOLUTION_REQUIRED');
    expect(gateOutcome(result, 'RESOLUTION_PRESENT')).toBe('FAIL');
  });

  it('отказывает при самосертификации: доказательство ссылается на вводимую аксиому', () => {
    const result = Ric.ExpandTo((x: RicisState) => x.Resolve(U_SELF_CERT));
    expect(result.kind).toBe('REJECTED');
    if (result.kind !== 'REJECTED') return;
    expect(result.reason).toBe('SELF_CERTIFICATION');
    expect(gateOutcome(result, 'NO_SELF_CERTIFICATION')).toBe('FAIL');
  });

  it('отказывает кандидату, который переопределяет уже доказанную форму', () => {
    const result = Ric.ExpandTo((x: RicisState) => x.Resolve(U_CONTRADICTION));
    expect(result.kind).toBe('REJECTED');
    if (result.kind !== 'REJECTED') return;
    expect(result.reason).toBe('CONTRADICTS_EXISTING_AXIOM');
    expect(gateOutcome(result, 'CONSISTENCY_TABLE')).toBe('FAIL');
    expect(result.detail).toContain('0_F/0_G');
  });

  it('отказывает переопределять защищённое ядро, даже если цепочка доказательства формально верна', () => {
    const result = Ric.ExpandTo((x: RicisState) => x.Resolve(U_CORE));
    expect(result.kind).toBe('REJECTED');
    if (result.kind !== 'REJECTED') return;
    expect(result.reason).toBe('PROTECTED_CORE_MUTATION');
    expect(gateOutcome(result, 'CORE_PROTECTED')).toBe('FAIL');
  });

  it('не даёт закрепить аксиому с уже существующим идентификатором (повторный коммит)', () => {
    const duplicateResolver: UnsolvedProblemResolver = Object.freeze({
      resolverId: 'test/duplicate-id',
      supportedProblemIds: ['U-DUPLICATE-ID'] as const,
      resolve(problem: UnsolvedSingularProblem, _state: RicisState): ResolutionResult {
        const candidate: CandidateAxiom = Object.freeze({
          id: 'A6',
          layer: 'AXIOM',
          statement: 'inf_F*inf_G = F*G',
          covers: [] as const,
          consequences: [Object.freeze({ inputForm: 'inf_F*inf_G', outputForm: 'F*G' })] as const,
        });
        return {
          kind: 'RESOLVED',
          resolution: {
            problem,
            candidate,
            proof: Object.freeze({
              strategy: 'RICIS_STRUCTURAL',
              steps: [Object.freeze({ rule: 'A5', from: 'inf_F*inf_G', to: 'F*G' })] as const,
              conclusion: 'F*G',
              usesLimits: false,
              usesNumericApproximation: false,
            }),
          },
        };
      },
    });
    const system = createRicisSystem({ resolvers: [duplicateResolver] });
    const problem: UnsolvedSingularProblem = Object.freeze({
      id: 'U-DUPLICATE-ID',
      statement: 'inf_F*inf_G',
      inputForm: 'inf_F*inf_G',
      singularityClasses: ['INF_OVER_INF'] as const,
      coverageClaim: ['A5'] as const,
    });

    const result = system.ExpandTo((x: RicisState) => x.Resolve(problem));
    expect(result.kind).toBe('REJECTED');
    if (result.kind !== 'REJECTED') return;
    expect(result.reason).toBe('DUPLICATE_AXIOM');
    expect(gateOutcome(result, 'NO_DUPLICATE_AXIOM')).toBe('FAIL');
  });

  it('отказывает доказательству с пределом Коши или численным порогом', () => {
    const limitResolver: UnsolvedProblemResolver = Object.freeze({
      resolverId: 'test/limit-semantics',
      supportedProblemIds: ['U-LIMIT'] as const,
      resolve(problem: UnsolvedSingularProblem, _state: RicisState): ResolutionResult {
        return {
          kind: 'RESOLVED',
          resolution: {
            problem,
            candidate: Object.freeze({
              id: 'A30',
              layer: 'AXIOM',
              statement: 'inf_F-inf_F = 0',
              covers: [] as const,
              consequences: [Object.freeze({ inputForm: 'inf_F-inf_F', outputForm: '0' })] as const,
            }),
            proof: Object.freeze({
              strategy: 'RICIS_STRUCTURAL',
              steps: [Object.freeze({ rule: 'A7', from: 'inf_F-inf_F', to: '0' })] as const,
              conclusion: '0',
              usesLimits: true,
              usesNumericApproximation: false,
            }),
          },
        };
      },
    });
    const system = createRicisSystem({ resolvers: [limitResolver] });
    const problem: UnsolvedSingularProblem = Object.freeze({
      id: 'U-LIMIT',
      statement: 'inf_F-inf_F',
      inputForm: 'inf_F-inf_F',
      singularityClasses: ['INF_MINUS_INF'] as const,
      coverageClaim: ['A7'] as const,
    });

    const result = system.ExpandTo((x: RicisState) => x.Resolve(problem));
    expect(result.kind).toBe('REJECTED');
    if (result.kind !== 'REJECTED') return;
    expect(result.reason).toBe('FORBIDDEN_NON_RICIS_SEMANTICS');
    expect(gateOutcome(result, 'NO_FORBIDDEN_SEMANTICS')).toBe('FAIL');
  });

  it('требует подтверждённый kernel run для стратегии LEAN_KERNEL', () => {
    const leanResolver: UnsolvedProblemResolver = Object.freeze({
      resolverId: 'test/lean-claim',
      supportedProblemIds: ['U-LEAN'] as const,
      resolve(problem: UnsolvedSingularProblem, _state: RicisState): ResolutionResult {
        return {
          kind: 'RESOLVED',
          resolution: {
            problem,
            candidate: Object.freeze({
              id: 'A31',
              layer: 'AXIOM',
              statement: '0_F*0_G = 0_(F*G)',
              covers: [] as const,
              consequences: [Object.freeze({ inputForm: '0_F*0_G', outputForm: '0_(F*G)' })] as const,
            }),
            proof: Object.freeze({
              strategy: 'LEAN_KERNEL',
              steps: [Object.freeze({ rule: 'LEAN_KERNEL', from: '0_F*0_G', to: '0_(F*G)' })] as const,
              conclusion: '0_(F*G)',
              usesLimits: false,
              usesNumericApproximation: false,
            }),
          },
        };
      },
    });
    const system = createRicisSystem({ resolvers: [leanResolver] });
    const problem: UnsolvedSingularProblem = Object.freeze({
      id: 'U-LEAN',
      statement: '0_F*0_G',
      inputForm: '0_F*0_G',
      singularityClasses: ['ZERO_TIMES_INF'] as const,
      coverageClaim: ['A6'] as const,
    });

    const result = system.ExpandTo((x: RicisState) => x.Resolve(problem));
    expect(result.kind).toBe('REJECTED');
    if (result.kind !== 'REJECTED') return;
    expect(result.reason).toBe('FORBIDDEN_NON_RICIS_SEMANTICS');
    expect(result.detail).toContain('kernel run');
  });

  it('оставляет зерно неизменным при любом отказе (отказ не портит состояние)', () => {
    for (const problem of [U_POWER, U_SELF_CERT, U_CONTRADICTION, U_CORE, U_COVERED]) {
      const rejected = Ric.ExpandTo((x: RicisState) => x.Resolve(problem));
      expect(rejected.kind).toBe('REJECTED');
      expect(rejected.seed.fingerprint).toBe(createSeed().fingerprint);
      expect(rejected.seed.generation).toBe(0);
      expect(rejected.seed.ledger).toHaveLength(0);
    }
  });

  it('публикует полный след ворот: все проверки присутствуют и однозначно помечены', () => {
    const expanded = Ric.ExpandTo((x: RicisState) => x.Resolve(U_MIXED));
    if (expanded.kind !== 'EXPANDED') throw new Error('expected expansion');
    expect(expanded.trace.filter(entry => entry.outcome === 'PASS')).toHaveLength(expanded.trace.length);
    expect(expanded.trace.map(entry => entry.gate)).toEqual([
      'RESOLUTION_PRESENT',
      'CORE_PROTECTED',
      'NO_FORBIDDEN_SEMANTICS',
      'NO_SELF_CERTIFICATION',
      'RULE_SET_CLOSED',
      'PROOF_CHAIN_CONNECTED',
      'PROBLEM_OPEN_IN_RICIS',
      'NO_DUPLICATE_AXIOM',
      'CONSISTENCY_TABLE',
      'MONOTONIC_COMMIT',
    ]);
  });
});

describe('RICIS SEED — семантика Resolve', () => {
  it('Resolve отвечает UNRESOLVED для уже покрытой формы (нового знания нет)', () => {
    const result = Ric.state.Resolve(U_COVERED);
    expect(result).toEqual({ kind: 'UNRESOLVED', problemId: U_COVERED.id, reason: 'ALREADY_COVERED_BY_RICIS' });
  });

  it('Resolve отвергает проблему, ссылающуюся на несуществующую аксиому в coverageClaim', () => {
    const bogus: UnsolvedSingularProblem = Object.freeze({
      ...U_NESTED,
      id: 'U-BOGUS-CLAIM',
      coverageClaim: ['A99' as never] as const,
    });
    expect(Ric.state.Resolve(bogus)).toEqual({ kind: 'UNRESOLVED', problemId: 'U-BOGUS-CLAIM', reason: 'UNKNOWN_PROBLEM' });
  });

  it('после расширения форма проблемы считается покрытой системой', () => {
    const result = Ric.ExpandTo((x: RicisState) => x.Resolve(U_NESTED));
    if (result.kind !== 'EXPANDED') throw new Error('expected expansion');
    const next: RicisSystem = Ric.from(result.seed);
    expect(next.state.covers(U_NESTED)).toBe(true);
    expect(next.state.Resolve(U_NESTED).kind).toBe('UNRESOLVED');
  });
});
