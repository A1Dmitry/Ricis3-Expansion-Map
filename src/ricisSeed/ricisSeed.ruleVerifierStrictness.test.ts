/**
 * Строгость RuleVerifier: метка правила без структурного верификатора не обосновывает переход.
 *
 * Основание (андон A-0013, такт 2026-09-18): прежняя реализация `checkRootRule` завершалась
 * `default: return true`, поэтому ЛЮБОЙ переход проходил под меткой протокола (SP1/SP2/SP4/SP5),
 * закона (L0, L1C1–L1C3), запрета (P1), мета-аксиомы (A11), снятой аксиомы (A3) или
 * непроверенного производного правила (A12+). Факт, воспроизведённый прогоном до ремонта:
 * кандидат `A77: 0_F*(inf_G-inf_H) = F*(G+H)` (знак подменён; честный результат A13 — `F*(G-H)`)
 * с единственным шагом под меткой `SP2` проходил ворота `SEMANTIC_RULE_VERIFIED`
 * и КОММИТИЛСЯ в R(n+1) — `ExpandTo` возвращал `EXPANDED`.
 *
 * Тесты ниже — не иллюстрация, а стражи класса:
 *  1) sweep по ЖИВОЙ таблице зерна (SEED_AXIOM_TABLE) + выращенным правилам: ни одна метка
 *     не пропускает заведомо ложный переход (эталон зелёный до мутации — A-0006);
 *  2) end-to-end атака через production entry point `Ric.ExpandTo` отклоняется, поколение не растёт;
 *  3) производные правила A12+ проверяются по реестру R(n), а не «по умолчанию»;
 *  4) отпечатки зерна и честный рост R0 → R3 не изменились (ядро R0 неприкосновенно, §11).
 *
 * AUDITOR: SELF (same-pipeline).
 */

import { describe, expect, it } from 'vitest';
import {
  classifyRule,
  expansionRuleSchemasOf,
  verifyProofChain,
  verifyProofStep,
} from './ruleVerifier';
import { SEED_AXIOM_TABLE } from './seedTable';
import { createRicisSystem, createSeed, grow } from './ricisSeed.domain';
import { DEMO_RESOLVERS, UNSOLVED_PROBLEM_REGISTRY } from './ricisSeed.unsolvedRegistry';
import type {
  AxiomId,
  CandidateAxiom,
  ProofCertificate,
  ProofRule,
  ResolutionResult,
  RicisState,
  SingularityClass,
  UnsolvedProblemResolver,
  UnsolvedSingularProblem,
} from './contracts';

/** Заведомо ложный переход: ни одно правило RICIS не превращает сумму в произведение. */
const ABSURD_FROM = 'F+G';
const ABSURD_TO = 'F*G';

/** Отпечатки, снятые фактическим прогоном ДО ремонта (эталон, который нельзя молча сдвинуть). */
const BASELINE = Object.freeze({
  r0Fingerprint: 'seed-v1:d0125a3c2f2e9c56',
  r3Fingerprint: 'seed-v1:3a88a50500d02e94',
  a12: 'axiom-v1:2b6b1a9ccadc044d',
  a13: 'axiom-v1:760ba974e3c4235d',
  a14: 'axiom-v1:e0cd9539ad318fbe',
});

function attackProblem(id: string, inputForm: string, classes: readonly SingularityClass[]): UnsolvedSingularProblem {
  const coverageClaim: readonly AxiomId[] = Object.freeze(['SP2', 'A6', 'A7']);
  return Object.freeze({
    id,
    statement: inputForm,
    inputForm,
    singularityClasses: Object.freeze([...classes]),
    coverageClaim,
  });
}

function attackResolver(
  resolverId: string,
  problem: UnsolvedSingularProblem,
  axiomId: string,
  rule: ProofRule,
  conclusion: string,
  covers: readonly SingularityClass[],
): UnsolvedProblemResolver {
  const candidate: CandidateAxiom = Object.freeze({
    id: axiomId,
    layer: 'AXIOM',
    statement: `${problem.inputForm} = ${conclusion}`,
    covers: Object.freeze([...covers]),
    consequences: Object.freeze([{ inputForm: problem.inputForm, outputForm: conclusion }]),
  });
  const proof: ProofCertificate = Object.freeze({
    strategy: 'RICIS_STRUCTURAL',
    steps: Object.freeze([{ rule, from: problem.inputForm, to: conclusion }]),
    conclusion,
    usesLimits: false,
    usesNumericApproximation: false,
  });
  return Object.freeze({
    resolverId,
    supportedProblemIds: Object.freeze([problem.id]),
    resolve(resolvedProblem: UnsolvedSingularProblem): ResolutionResult {
      return {
        kind: 'RESOLVED',
        resolution: { problem: resolvedProblem, candidate, proof },
      };
    },
  });
}

describe('RuleVerifier — строгость меток правила (A-0013)', () => {
  it('эталон зелёный до мутации: честные переходы зерна по-прежнему проходят', () => {
    expect(verifyProofStep({ rule: 'A6', from: '0_F*inf_G', to: 'F*G' }).valid).toBe(true);
    expect(verifyProofStep({ rule: 'A4', from: '0_F/0_G', to: 'F/G' }).valid).toBe(true);
    expect(verifyProofStep({ rule: 'A7', from: 'inf_F-inf_G', to: 'inf_(F-G)' }).valid).toBe(true);
    expect(verifyProofStep({ rule: 'L1', from: 'inf_F-inf_F', to: '0' }).valid).toBe(true);
    expect(verifyProofStep({ rule: 'A14', from: 'inf_F-inf_F', to: '0' }).valid).toBe(true);
    expect(verifyProofStep({ rule: 'SP3', from: '0_F/0_G', to: 'F/G' }).valid).toBe(true);
  });

  it('sweep по живой таблице зерна: ни одна метка не пропускает заведомо ложный переход', () => {
    const seedIds = SEED_AXIOM_TABLE.map(entry => entry.id);
    expect(seedIds.length).toBeGreaterThanOrEqual(20); // sweep обязан жить на реальном реестре, а не на примере

    for (const id of seedIds) {
      const category = classifyRule(id);
      const result = verifyProofStep({ rule: id, from: ABSURD_FROM, to: ABSURD_TO });

      if (category === 'EXTERNAL') {
        // Внешний слой: шаг принимается, но честно помечен как НЕ структурная проверка RICIS.
        expect(result.valid, `${id}: внешний слой`).toBe(true);
        expect(result.external, `${id}: внешний шаг обязан быть помечен`).toBe(true);
        continue;
      }

      expect(result.valid, `${id} (${category}) не вправе обосновывать ${ABSURD_FROM} -> ${ABSURD_TO}`).toBe(false);
      expect(result.failure, `${id}: отказ обязан быть типизированным`).toBeDefined();

      if (category === 'NON_REWRITE') expect(result.failure).toBe('RULE_CATEGORY_NOT_A_REWRITE');
      if (category === 'DEPRECATED') expect(result.failure).toBe('RULE_DEPRECATED');
    }
  });

  it('протоколы/законы/запреты — не правила переписывания (категориальная ошибка, а не «непроверено»)', () => {
    for (const rule of ['SP1', 'SP2', 'SP4', 'SP5', 'L0', 'L1C1', 'L1C2', 'L1C3', 'P1', 'A11'] as const) {
      const result = verifyProofStep({ rule, from: '0_F*(inf_G-inf_H)', to: 'F*(G+H)' });
      expect(result.valid, rule).toBe(false);
      expect(result.failure, rule).toBe('RULE_CATEGORY_NOT_A_REWRITE');
    }
  });

  it('снятая аксиома A3 не может обосновать переход (историческая запись, не активное зерно)', () => {
    const result = verifyProofStep({ rule: 'A3', from: '0_F/0_G', to: 'F/G' });
    expect(result.valid).toBe(false);
    expect(result.failure).toBe('RULE_DEPRECATED');
  });

  it('нераспознанная метка отклоняется fail-safe, а не пропускается', () => {
    // A0 формально валиден как ExpansionAxiomId, но не принадлежит ни зерну, ни реестру расширения.
    const result = verifyProofStep({ rule: 'A0', from: ABSURD_FROM, to: ABSURD_TO });
    expect(result.valid).toBe(false);
    expect(result.failure).toBe('RULE_VERIFIER_NOT_IMPLEMENTED');
  });

  it('SP3 проверяется структурно: закон индексов проходит, произвольный переход — нет', () => {
    // Одно применение в корне.
    expect(verifyProofStep({ rule: 'SP3', from: '0_F/0_G', to: 'F/G' }).valid).toBe(true);
    // Одно применение в контексте (вторая сторона шага не меняется):
    // двойное раскрытие `(0_F/0_G)/(0_H/0_K) -> (F/G)/(H/K)` — это ДВА шага, а не один.
    expect(verifyProofStep({ rule: 'SP3', from: '(0_F/0_G)/0_K', to: '(F/G)/0_K' }).valid).toBe(true);
    expect(verifyProofStep({ rule: 'SP3', from: '(0_F/0_G)/(0_H/0_K)', to: '(F/G)/(H/K)' }).valid).toBe(false);
    const forged = verifyProofStep({ rule: 'SP3', from: 'x/y', to: 'x+y' });
    expect(forged.valid).toBe(false);
    expect(forged.failure).toBe('RULE_PATTERN_MISMATCH');
  });

  it('производное правило A12+ без реестра поколения не проверяемо (отказ, а не пропуск)', () => {
    const result = verifyProofStep({ rule: 'A12', from: '(0_F/0_G)/(0_H/0_K)', to: '(F*K)/(G*H)' });
    expect(result.valid).toBe(false);
    expect(result.failure).toBe('RULE_NOT_IN_REGISTRY');
  });

  it('производное правило проверяется по зарегистрированной схеме R(n), включая подстановку индексов', () => {
    const { system } = grow(createRicisSystem({ resolvers: DEMO_RESOLVERS }), [
      UNSOLVED_PROBLEM_REGISTRY[0]!,
    ]);
    const context = { expansionRules: expansionRuleSchemasOf(system.seed.axioms) };
    expect(context.expansionRules.map(schema => schema.id)).toContain('A12');

    // Точная схема правила.
    expect(
      verifyProofStep({ rule: 'A12', from: '(0_F/0_G)/(0_H/0_K)', to: '(F*K)/(G*H)' }, context).valid,
    ).toBe(true);
    // Та же схема с другими индексными символами (связное сопоставление F->X, G->Y, H->Z, K->W):
    // (0_F/0_G)/(0_H/0_K) = (F*K)/(G*H)  =>  (0_X/0_Y)/(0_Z/0_W) = (X*W)/(Y*Z).
    expect(
      verifyProofStep({ rule: 'A12', from: '(0_X/0_Y)/(0_Z/0_W)', to: '(X*W)/(Y*Z)' }, context).valid,
    ).toBe(true);
    // Перестановка индексов в результате — уже не применение схемы (K и H не взаимозаменяемы).
    expect(
      verifyProofStep({ rule: 'A12', from: '(0_X/0_Y)/(0_Z/0_W)', to: '(X*Z)/(Y*W)' }, context).valid,
    ).toBe(false);
    // Подмена результата при верной левой части — не применение правила.
    const forged = verifyProofStep({ rule: 'A12', from: '(0_F/0_G)/(0_H/0_K)', to: '(F+K)/(G+H)' }, context);
    expect(forged.valid).toBe(false);
    expect(forged.failure).toBe('RULE_SCHEMA_MISMATCH');
    // Чужая форма под меткой A12 — тоже не применение правила.
    expect(verifyProofStep({ rule: 'A12', from: '0_F*inf_G', to: 'F*G' }, context).valid).toBe(false);
  });

  it('верификатор честно разделяет структурную проверку и внешний слой', () => {
    const classical = verifyProofStep({ rule: 'CLASSICAL', from: '(F/G)/(H/K)', to: '(F*K)/(G*H)' });
    expect(classical.valid).toBe(true);
    expect(classical.external).toBe(true);

    const structural = verifyProofStep({ rule: 'A6', from: '0_F*inf_G', to: 'F*G' });
    expect(structural.valid).toBe(true);
    expect(structural.external).toBeFalsy();
  });

  it('цепочка доказательства наследует строгость: шаг под протоколом рвёт всю цепочку', () => {
    const chain = verifyProofChain([
      { rule: 'A7', from: '0_F*(inf_G-inf_H)', to: '0_F*inf_(G-H)' },
      { rule: 'SP2', from: '0_F*inf_(G-H)', to: 'F*(G+H)' },
    ]);
    expect(chain.valid).toBe(false);
    expect(chain.failedStepIndex).toBe(1);
    expect(chain.stepResults[1]?.failure).toBe('RULE_CATEGORY_NOT_A_REWRITE');
  });
});

describe('Ворота SEMANTIC_RULE_VERIFIED — end-to-end через Ric.ExpandTo (A-0013)', () => {
  it('отклоняет математически ложную аксиому, «доказанную» протоколом SP2', () => {
    // Факт до ремонта: этот кандидат КОММИТИЛСЯ (ExpandTo -> EXPANDED, поколение росло).
    const problem = attackProblem('U-ATTACK-PROTOCOL-LABEL', '0_F*(inf_G-inf_H)', ['MIXED_ZERO_INF_DIFF']);
    const system = createRicisSystem({
      resolvers: [attackResolver('attack/protocol-labelled', problem, 'A77', 'SP2', 'F*(G+H)', ['MIXED_ZERO_INF_DIFF'])],
    });

    const result = system.ExpandTo((state: RicisState) => state.Resolve(problem));

    expect(result.kind).toBe('REJECTED');
    if (result.kind === 'REJECTED') {
      expect(result.reason).toBe('SEMANTIC_RULE_INVALID');
      expect(result.detail).toContain('не правило переписывания');
      const gate = result.trace.find(check => check.gate === 'SEMANTIC_RULE_VERIFIED');
      expect(gate?.outcome).toBe('FAIL');
    }
    expect(result.seed.generation).toBe(system.seed.generation);
    expect(result.seed.axioms.some(axiom => axiom.id === 'A77')).toBe(false);
  });

  it('отклоняет кандидата, «доказанного» чужим выращенным правилом A14', () => {
    const base = grow(createRicisSystem({ resolvers: DEMO_RESOLVERS }), [
      UNSOLVED_PROBLEM_REGISTRY[0]!,
      UNSOLVED_PROBLEM_REGISTRY[1]!,
      UNSOLVED_PROBLEM_REGISTRY[2]!,
    ]);
    expect(base.system.seed.axioms.map(axiom => axiom.id)).toContain('A14');

    const problem = attackProblem('U-ATTACK-GROWN-RULE', 'inf_F*0_G', ['ZERO_TIMES_INF']);
    const system = createRicisSystem({
      seed: base.system.seed,
      resolvers: [attackResolver('attack/grown-rule-labelled', problem, 'A78', 'A14', '0', ['ZERO_TIMES_INF'])],
    });

    const result = system.ExpandTo((state: RicisState) => state.Resolve(problem));

    expect(result.kind).toBe('REJECTED');
    if (result.kind === 'REJECTED') {
      expect(result.reason).toBe('SEMANTIC_RULE_INVALID');
      expect(result.detail).toContain('A14');
    }
    expect(result.seed.axioms.some(axiom => axiom.id === 'A78')).toBe(false);
  });

  it('честный рост R0 -> R3 не изменился: отпечатки зерна и производных правил прежние', () => {
    expect(createSeed().fingerprint).toBe(BASELINE.r0Fingerprint);

    const { system } = grow(createRicisSystem({ resolvers: DEMO_RESOLVERS }), [
      UNSOLVED_PROBLEM_REGISTRY[0]!,
      UNSOLVED_PROBLEM_REGISTRY[1]!,
      UNSOLVED_PROBLEM_REGISTRY[2]!,
    ]);

    expect(system.seed.generation).toBe(3);
    expect(system.seed.fingerprint).toBe(BASELINE.r3Fingerprint);
    const fingerprints = new Map(system.seed.axioms.map(axiom => [axiom.id, axiom.fingerprint]));
    expect(fingerprints.get('A12')).toBe(BASELINE.a12);
    expect(fingerprints.get('A13')).toBe(BASELINE.a13);
    expect(fingerprints.get('A14')).toBe(BASELINE.a14);
  });
});
