// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  createRicisSystem,
  createSeed,
  grow,
  type RicisSystem,
} from './ricisSeed.domain';
import { DEMO_RESOLVERS, HONEST_RESOLVERS, UNSOLVED_PROBLEM_REGISTRY } from './ricisSeed.unsolvedRegistry';
import { DEPRECATED_AXIOM_IDS, PROTECTED_CORE_IDS, type RicisState, type UnsolvedSingularProblem } from './contracts';

const root = process.cwd();
const baseDocument = JSON.parse(
  readFileSync(resolve(root, 'docs/01-architecture/ricis-unified-complete-document-7.9-vector.json'), 'utf8'),
).RICIS_Unified_Complete_Document;
const document = JSON.parse(
  readFileSync(resolve(root, 'docs/01-architecture/ricis-unified-complete-document-8.0-seed-expansion.json'), 'utf8'),
).RICIS_Unified_Complete_Document;

const [U_NESTED, U_MIXED, U_INF_SELF, U_POWER, U_SELF_CERT, U_CONTRADICTION, U_CORE, U_COVERED, U_WRONG_BRANCH] =
  UNSOLVED_PROBLEM_REGISTRY as readonly UnsolvedSingularProblem[];

const seed = createSeed();
const demo: RicisSystem = createRicisSystem({ resolvers: DEMO_RESOLVERS });
const growth = grow(createRicisSystem({ resolvers: HONEST_RESOLVERS }), [U_NESTED!, U_MIXED!, U_INF_SELF!]);

describe('Единый документ RICIS v8.0 (seed expansion)', () => {
  it('сохраняет все разделы v7.9 без переписывания (консервативное расширение)', () => {
    for (const key of Object.keys(baseDocument)) {
      expect(document, `missing section ${key}`).toHaveProperty(key);
    }
    // Содержимое v7.9 не переписано: ключевые формулировки совпадают дословно.
    expect(document.AXIOMS.core).toEqual(baseDocument.AXIOMS.core);
    expect(document.AXIOMS.indeterminate_forms).toEqual(baseDocument.AXIOMS.indeterminate_forms);
    expect(document.AXIOMS.deprecated).toEqual(baseDocument.AXIOMS.deprecated);
    expect(document.PART_2_SAFETY_PROTOCOLS.SP1_LOCALITY_RULE).toEqual(baseDocument.PART_2_SAFETY_PROTOCOLS.SP1_LOCALITY_RULE);
    expect(document.PART_2_SAFETY_PROTOCOLS.SP5_TRIGONOMETRIC_PRE_NORMALIZATION).toEqual(
      baseDocument.PART_2_SAFETY_PROTOCOLS.SP5_TRIGONOMETRIC_PRE_NORMALIZATION,
    );
    expect(document.PART_2_SAFETY_PROTOCOLS.P1_NO_RECURSIVE_LIMITS_OR_LHOPITAL).toEqual(
      baseDocument.PART_2_SAFETY_PROTOCOLS.P1_NO_RECURSIVE_LIMITS_OR_LHOPITAL,
    );
    expect(document.VECTOR_AXIOM_LAYER.principle).toBe(baseDocument.VECTOR_AXIOM_LAYER.principle);
    expect(document.VECTOR_AXIOM_LAYER.coordinatewise_lift.A6).toBe(baseDocument.VECTOR_AXIOM_LAYER.coordinatewise_lift.A6);
    expect(document.COMPUTATION_ALGORITHM.phases.slice(0, 10)).toEqual(baseDocument.COMPUTATION_ALGORITHM.phases);
  });

  it('фиксирует новую версию, происхождение и статус', () => {
    expect(document.document_version).toBe('8.0_seed_expansion');
    expect(document.previous_version).toBe('7.9_vector_multidimensional_extension');
    expect(document.created_from).toContain('v7.9_vector_multidimensional_extension');
    expect(document.created_from).toContain('seed_expansion_protocol_A11');
    expect(document.status).toContain('SELF_EXPANDING');
  });

  it('описывает A11 как мета-аксиому с канонической записью Ric.ExpandTo((x) => x.Resolve(U))', () => {
    const a11 = document.AXIOMS.meta.A11_EXPANDABILITY;
    expect(a11.level).toContain('META_AXIOM');
    expect(a11.statement).toBe('R_(k+1) = Ric.ExpandTo(R_k, Resolve(U_k))');
    expect(a11.program_notation).toBe('Ric.ExpandTo((x) => x.Resolve(UnsolvedSingularProblem))');
    expect(a11.resolve_is.toLowerCase()).toContain('prove');
    expect(document.PART_7_SEED_EXPANSION_PROTOCOL.canonical_notation).toBe(a11.program_notation);
    expect(PROTECTED_CORE_IDS).toContain('A11');
  });

  it('содержит A12–A14 ровно в том виде, в каком их реально выпустил протокол', () => {
    const derived = document.AXIOMS.derived_by_seed_expansion;
    expect(Object.keys(derived).sort()).toEqual(['A12', 'A13', 'A14']);

    const committed = growth.results.filter(entry => entry.kind === 'EXPANDED');
    expect(committed).toHaveLength(3);
    for (const result of committed) {
      if (result.kind !== 'EXPANDED') continue;
      const entry = derived[result.axiom.id];
      expect(entry, result.axiom.id).toBeDefined();
      expect(entry.statement).toBe(result.axiom.statement);
      expect(entry.fingerprint).toBe(result.axiom.fingerprint);
      expect(entry.generation_committed).toBe(result.record.toGeneration);
      expect(entry.solved_problem_id).toBe(result.record.problemId);
      expect(entry.proof.steps).toEqual(result.axiom.proof?.steps.map(step => ({ rule: step.rule, from: step.from, to: step.to })));
      // Производные правила не выдаются за независимые допущения и не за проверку ядром Lean.
      expect(entry.verification_status.lean_kernel).toBe('REQUIRES_CORE_LEAN');
      expect(entry.verification_status.structural_proof_local).toBe('PASS');
    }
  });

  it('фиксирует A14 как тождество и ворота IDENTITY_COHERENCE в документе', () => {
    const a14 = document.AXIOMS.derived_by_seed_expansion.A14;
    expect(a14.statement).toBe('inf_F-inf_F = 0');
    const gates = document.PART_7_SEED_EXPANSION_PROTOCOL.admissibility_gates.map((gate: { gate: string }) => gate.gate);
    expect(gates).toContain('IDENTITY_COHERENCE');
    expect(document.PART_2_SAFETY_PROTOCOLS.SP2_REDUCTION_PRIORITY).toEqual(
      baseDocument.PART_2_SAFETY_PROTOCOLS.SP2_REDUCTION_PRIORITY,
    );
    expect(document.PART_7_SEED_EXPANSION_PROTOCOL.trust_boundary.identity_rule).toContain('X - X = 0');
  });

  it('ведёт журнал поколений с отпечатками, совпадающими с фактическим прогоном', () => {
    const ledger = document.PART_8_EXPANSION_LEDGER;
    expect(ledger.generations.R0).toBe(seed.fingerprint);
    expect(ledger.final_generation).toBe(`R${growth.system.seed.generation}`);
    expect(ledger.final_axiom_count).toBe(growth.system.seed.axioms.length);

    const actual = growth.system.seed.ledger;
    expect(ledger.ledger).toHaveLength(actual.length);
    for (const [index, record] of actual.entries()) {
      const entry = ledger.ledger[index];
      expect(entry.axiom_id).toBe(record.axiomId);
      expect(entry.axiom_fingerprint).toBe(record.axiomFingerprint);
      expect(entry.seed_fingerprint_before).toBe(record.seedFingerprintBefore);
      expect(entry.seed_fingerprint_after).toBe(record.seedFingerprintAfter);
      expect(entry.to_generation).toBe(`R${record.toGeneration}`);
    }
  });

  it('реестр отказов документа совпадает с фактическими отказами ворот', () => {
    const registry = document.AXIOMS.rejected_candidate_patterns;
    const cases: Array<[UnsolvedSingularProblem, string]> = [
      [U_POWER!, 'RESOLUTION_REQUIRED'],
      [U_SELF_CERT!, 'SELF_CERTIFICATION'],
      [U_CONTRADICTION!, 'CONTRADICTS_EXISTING_AXIOM'],
      [U_CORE!, 'PROTECTED_CORE_MUTATION'],
      [U_COVERED!, 'PROBLEM_ALREADY_COVERED'],
      [U_WRONG_BRANCH!, 'IDENTITY_VIOLATION'],
    ];

    for (const [problem, expected] of cases) {
      const result = demo.ExpandTo((x: RicisState) => x.Resolve(problem));
      expect(result.kind, problem.id).toBe('REJECTED');
      if (result.kind !== 'REJECTED') continue;
      expect(registry[problem.id].rejection_reason, problem.id).toBe(expected);
      expect(result.reason, problem.id).toBe(expected);
      expect(registry[problem.id].seed_fingerprint_unchanged, problem.id).toBe(true);
    }
  });

  it('сохраняет ядро зерна: защищённый список документа равен списку кода, A3 в R0 не входит', () => {
    const core = document.PART_7_SEED_EXPANSION_PROTOCOL.seed_core_R0;
    expect([...core.protected_core].sort()).toEqual([...PROTECTED_CORE_IDS].sort());
    expect([...core.deprecated_not_in_R0].sort()).toEqual([...DEPRECATED_AXIOM_IDS].sort());
    expect(core.fingerprint).toBe(seed.fingerprint);
    expect(core.axiom_count).toBe(seed.axioms.length);
    expect(core.mathematical_axioms).not.toContain('A3');
    expect(core.meta_axiom).toEqual(['A11']);
  });

  it('описывает ворота допуска в том же составе и порядке, в каком их исполняет код', () => {
    const gates = document.PART_7_SEED_EXPANSION_PROTOCOL.admissibility_gates.map((gate: { gate: string }) => gate.gate);
    const result = demo.ExpandTo((x: RicisState) => x.Resolve(U_MIXED!));
    if (result.kind !== 'EXPANDED') throw new Error('expected expansion');
    expect(gates).toEqual(result.trace.map(entry => entry.gate));
  });

  it('не заявляет проверку ядром Lean и явно фиксирует известные ограничения', () => {
    const boundary = document.PART_7_SEED_EXPANSION_PROTOCOL.trust_boundary;
    expect(boundary.lean_kernel_verification).toContain('REQUIRES_CORE_LEAN');
    expect(boundary.known_limitation.length).toBeGreaterThan(20);
    expect(document.VERIFICATION_STATUS.seed_expansion_run.lean_kernel_verification).toContain('REQUIRES_CORE_LEAN');
  });

  it('расширяет вычислительный алгоритм фазами развёртывания семени и новыми запретами', () => {
    const phases = document.COMPUTATION_ALGORITHM.phases;
    expect(phases.length).toBe(baseDocument.COMPUTATION_ALGORITHM.phases.length + 4);
    expect(phases.slice(-4).map((phase: { name: string }) => phase.name)).toEqual([
      'OPEN_CLASS_DETECTION',
      'RESOLVE_AND_PROVE',
      'ADMISSIBILITY_GATES',
      'EXPANSION_COMMIT',
    ]);
    const prohibitions: string[] = document.COMPUTATION_ALGORITHM.prohibitions;
    expect(prohibitions).toContain('No commit of an unproved candidate (SP6/P2)');
    expect(prohibitions).toContain('No self-certifying proof (SP7)');
    expect(prohibitions).toContain('No axiom for an already covered form (SP8)');
    expect(prohibitions).toContain('No redefinition of the protected core, including A11 itself (SP9)');
    expect(prohibitions).toContain('No nondeterministic or environment-dependent expansion (SP11)');
  });

  it('поднимает протокол развёртывания на векторный слой покомпонентно', () => {
    const lift = document.VECTOR_AXIOM_LAYER.seed_expansion_lift;
    expect(lift.expandto_vector).toBe('R^(n)_(k+1) = Ric.ExpandTo(R^(n)_k, Resolve_vec(U_vec_k))');
    expect(lift.commit_rule.toLowerCase()).toContain('all components');
    expect(lift.conservativity.toLowerCase()).toContain('n=1');
    expect(document.VECTOR_AXIOM_LAYER.coordinatewise_lift.A12).toContain('F_1*K_1');
    expect(document.VECTOR_AXIOM_LAYER.coordinatewise_lift.A14).toContain('1, ..., 1');
  });

  it('помещает открытый класс без доказательства в uncommitted, а не в аксиомы', () => {
    const open = document.AXIOMS.open_classes_uncommitted.POWER_OF_SINGULAR;
    expect(open.status).toBe('OPEN_UNPROVEN');
    expect(open.decision).toBe('NOT COMMITTED');
    expect(Object.keys(document.AXIOMS.derived_by_seed_expansion)).not.toContain('A15');
  });
});
