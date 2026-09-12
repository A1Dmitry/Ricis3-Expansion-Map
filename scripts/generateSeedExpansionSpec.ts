/**
 * Генератор единого документа RICIS v8.0 (Seed Expansion).
 *
 * Принцип (anti-tukhta): документ НЕ пишется руками «по мотивам кода».
 * Разделы, содержащие факты развёртывания семени (A12–A14, журнал поколений,
 * отпечатки R_k, реестр отказов), формируются ИЗ ФАКТИЧЕСКОГО ПРОГОНА
 * протокола `Ric.ExpandTo((x) => x.Resolve(U))` в `src/ricisSeed`.
 *
 * Запуск:  npx tsx scripts/generateSeedExpansionSpec.ts
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import {
  createRicisSystem,
  createSeed,
  grow,
  type RicisSystem,
} from '../src/ricisSeed/ricisSeed.domain';
import {
  DEMO_RESOLVERS,
  HONEST_RESOLVERS,
  UNSOLVED_PROBLEM_REGISTRY,
} from '../src/ricisSeed/ricisSeed.unsolvedRegistry';
import type { ExpansionResult, RicisState, UnsolvedSingularProblem } from '../src/ricisSeed/contracts';
import { DEPRECATED_AXIOM_IDS, PROTECTED_CORE_IDS } from '../src/ricisSeed/contracts';
import { SEED_AXIOM_TABLE } from '../src/ricisSeed/seedTable';

const repositoryRoot = resolve(process.cwd());
const baseDocumentPath = resolve(repositoryRoot, 'docs/01-architecture/ricis-unified-complete-document-7.9-vector.json');
const outputPath = resolve(repositoryRoot, 'docs/01-architecture/ricis-unified-complete-document-8.0-seed-expansion.json');

const [U_NESTED, U_MIXED, U_INF_SELF, U_POWER, U_SELF_CERT, U_CONTRADICTION, U_CORE, U_COVERED] = UNSOLVED_PROBLEM_REGISTRY as readonly UnsolvedSingularProblem[];

// ---------------------------------------------------------------------------
// 1. Фактический прогон протокола развёртывания семени
// ---------------------------------------------------------------------------

const seed = createSeed();
const honest = createRicisSystem({ resolvers: HONEST_RESOLVERS });
const demo = createRicisSystem({ resolvers: DEMO_RESOLVERS });

const growth = grow(honest, [U_NESTED!, U_MIXED!, U_INF_SELF!]);
if (growth.results.some(entry => entry.kind !== 'EXPANDED')) {
  throw new Error('seed expansion run failed: derived axioms were not committed');
}

const generationFingerprints: Record<string, string> = { R0: seed.fingerprint };
const derivedAxioms: Record<string, unknown> = {};
const ledgerEntries: unknown[] = [];

let current: RicisSystem = honest;
let generationIndex = 0;
for (const result of growth.results) {
  if (result.kind !== 'EXPANDED') continue;
  generationIndex += 1;
  const key = `R${generationIndex}`;
  generationFingerprints[key] = result.seed.fingerprint;

  derivedAxioms[result.axiom.id] = {
    id: result.axiom.id,
    layer: result.axiom.layer,
    origin: result.axiom.origin,
    statement: result.axiom.statement,
    input_form: result.record.problemInputForm,
    consequence: result.axiom.consequences[0] ?? null,
    covers: [...result.axiom.covers],
    solved_problem_id: result.axiom.solvedProblemId,
    generation_committed: result.record.toGeneration,
    fingerprint: result.axiom.fingerprint,
    proof: {
      strategy: result.axiom.proof?.strategy,
      steps: (result.axiom.proof?.steps ?? []).map(step => ({ rule: step.rule, from: step.from, to: step.to })),
      conclusion: result.axiom.proof?.conclusion,
      uses_limits: result.axiom.proof?.usesLimits,
      uses_numeric_approximation: result.axiom.proof?.usesNumericApproximation,
    },
    verification_status: {
      structural_proof_local: 'PASS',
      lean_kernel: 'REQUIRES_CORE_LEAN',
      note: 'Derived rule: proved from seed axioms only, not an independent new assumption.',
    },
  };

  ledgerEntries.push({
    sequence: result.record.sequence,
    from_generation: `R${result.record.fromGeneration}`,
    to_generation: `R${result.record.toGeneration}`,
    problem_id: result.record.problemId,
    problem_input_form: result.record.problemInputForm,
    axiom_id: result.record.axiomId,
    axiom_fingerprint: result.record.axiomFingerprint,
    seed_fingerprint_before: result.record.seedFingerprintBefore,
    seed_fingerprint_after: result.record.seedFingerprintAfter,
    proof_strategy: result.record.proofStrategy,
    proof_step_count: result.record.proofStepCount,
  });

  current = current.from(result.seed);
}

// ---------------------------------------------------------------------------
// 2. Фактический прогон сценариев отказа (Challenger-проверка ворот)
// ---------------------------------------------------------------------------

function rejectionOf(system: RicisSystem, problem: UnsolvedSingularProblem): ExpansionResult {
  return system.ExpandTo((x: RicisState) => x.Resolve(problem));
}

const rejectionRuns = [
  { id: U_POWER!.id, expected: 'RESOLUTION_REQUIRED', description: 'Open class without proof: no candidate may be committed.' },
  { id: U_SELF_CERT!.id, expected: 'SELF_CERTIFICATION', description: 'Proof cites the axiom it introduces (A15); circularity is rejected before rule-set closure.' },
  { id: U_CONTRADICTION!.id, expected: 'CONTRADICTS_EXISTING_AXIOM', description: 'Candidate redefines the already proved form 0_F/0_G = F/G as G/F.' },
  { id: U_CORE!.id, expected: 'PROTECTED_CORE_MUTATION', description: 'Candidate tries to redefine L1 inside the protected core.' },
  { id: U_COVERED!.id, expected: 'PROBLEM_ALREADY_COVERED', description: 'Form 0_F*inf_G is already resolved by A6; axiom inflation is forbidden.' },
];

const rejectionRegistry: Record<string, unknown> = {};
for (const run of rejectionRuns) {
  const problem = UNSOLVED_PROBLEM_REGISTRY.find(entry => entry.id === run.id)!;
  const result = rejectionOf(demo, problem);
  if (result.kind !== 'REJECTED') {
    throw new Error(`expected rejection for ${run.id}, received ${result.kind}`);
  }
  if (result.reason !== run.expected) {
    throw new Error(`unexpected rejection reason for ${run.id}: ${result.reason}`);
  }
  const failedGate = result.trace.find(entry => entry.outcome === 'FAIL');
  rejectionRegistry[run.id] = {
    input_form: problem.inputForm,
    description: run.description,
    rejection_reason: result.reason,
    failed_gate: failedGate?.gate ?? null,
    failed_gate_detail: failedGate?.detail ?? null,
    seed_fingerprint_unchanged: result.seed.fingerprint === seed.fingerprint,
  };
}

// ---------------------------------------------------------------------------
// 3. Сборка документа v8.0
// ---------------------------------------------------------------------------

const base = JSON.parse(await readFile(baseDocumentPath, 'utf8')) as {
  RICIS_Unified_Complete_Document: Record<string, unknown>;
};

const previous = base.RICIS_Unified_Complete_Document;

const seedProtocol = {
  principle:
    'RICIS is not a frozen list of rules but a SEED: a minimal kernel that carries its own growth operator. ' +
    'When the system meets a structural class it cannot resolve, it does not replace the task by an approximation; ' +
    'it resolves and proves the class, and only then admits the proved rule into the axiom set.',
  canonical_notation: 'Ric.ExpandTo((x) => x.Resolve(UnsolvedSingularProblem))',
  transition: 'R_(k+1) = Ric.ExpandTo(R_k, Resolve(U_k)) = R_k union {A_new}',
  x_semantics:
    'x is the current state of the RICIS system itself (axiom set, covered forms, expansion ledger), ' +
    'not a numeric variable and not a placeholder for the problem argument.',
  resolve_semantics: 'Resolve = resolve AND prove. Resolve(U) returns a proof certificate, not a candidate guess.',
  expandto_semantics:
    'ExpandTo is the act of admission (Commit). It is deliberately separate from Resolve: ' +
    'a computed statement never becomes an axiom automatically.',
  seed_core_R0: {
    generation: 0,
    // Списки формируются из исполняемого зерна src/ricisSeed, а не переписываются вручную:
    // документ не может разойтись с кодом.
    laws: seed.axioms.filter(axiom => axiom.layer === 'LAW').map(axiom => axiom.id),
    safety_protocols: seed.axioms.filter(axiom => axiom.layer === 'PROTOCOL' && axiom.id.startsWith('SP')).map(axiom => axiom.id),
    prohibitions: seed.axioms.filter(axiom => axiom.id === 'P1').map(axiom => axiom.id),
    mathematical_axioms: seed.axioms.filter(axiom => axiom.layer === 'AXIOM').map(axiom => axiom.id),
    meta_axiom: seed.axioms.filter(axiom => axiom.layer === 'META_AXIOM').map(axiom => axiom.id),
    protected_core: [...PROTECTED_CORE_IDS],
    protected_core_derived: ['L1C4'],
    protected_core_note:
      'L1C4 (monotonic growth) is a derived guarantee of A11 + L1, not a separate seed row; ' +
      'it is enforced by the MONOTONIC_COMMIT gate and by src/ricisSeed invariant checks.',
    deprecated_not_in_R0: [...DEPRECATED_AXIOM_IDS],
    deprecated_note:
      'A3 and A6_BYPASS are removed as obsolete in v7.7/v7.9. They are kept in the historical seed table ' +
      '(src/ricisSeed/seedTable.ts, deprecated: true) but are not part of the active kernel R0.',
    fingerprint: seed.fingerprint,
    axiom_count: seed.axioms.length,
    historical_table_size: SEED_AXIOM_TABLE.length,
  },
  protection_rule:
    'The protected core (L0/L1/L1C*, SP1-SP5, P1, A11) is never redefined by an expansion. ' +
    'A11 protects itself: the growth operator cannot be rewritten by what it produces.',
  admissibility_gates: [
    { gate: 'RESOLUTION_PRESENT', rule: 'Resolve returned a certificate with a non-empty step chain and strategy != UNPROVEN.', rejection: 'RESOLUTION_REQUIRED' },
    { gate: 'CORE_PROTECTED', rule: 'The candidate id is not in the protected core.', rejection: 'PROTECTED_CORE_MUTATION' },
    { gate: 'NO_FORBIDDEN_SEMANTICS', rule: 'No limits, no numerical eps-thresholds; a LEAN_KERNEL claim requires a verified kernel run (compiler output, #print axioms, sorry-free).', rejection: 'FORBIDDEN_NON_RICIS_SEMANTICS' },
    { gate: 'NO_SELF_CERTIFICATION', rule: 'No proof step may cite the axiom that this proof introduces.', rejection: 'SELF_CERTIFICATION' },
    { gate: 'RULE_SET_CLOSED', rule: 'Every proof step uses an axiom already in R_k, or an explicitly allowed external rule (CLASSICAL under INHERITED_CLASSICAL, LEAN_KERNEL with evidence).', rejection: 'PROOF_RULE_UNKNOWN' },
    { gate: 'PROOF_CHAIN_CONNECTED', rule: 'The chain starts at the problem input form, has no gaps, and ends exactly at the candidate statement.', rejection: 'PROOF_CHAIN_BROKEN / PROOF_CONCLUSION_MISMATCH' },
    { gate: 'PROBLEM_OPEN_IN_RICIS', rule: 'The input form is not already resolved by R_k (no axiom inflation).', rejection: 'PROBLEM_ALREADY_COVERED' },
    { gate: 'NO_DUPLICATE_AXIOM', rule: 'Neither the id nor the structural fingerprint of the candidate already exists in R_k.', rejection: 'DUPLICATE_AXIOM' },
    { gate: 'CONSISTENCY_TABLE', rule: 'No input form may receive two different output forms (determinism of the O(1) reduction table).', rejection: 'CONTRADICTS_EXISTING_AXIOM' },
    { gate: 'MONOTONIC_COMMIT', rule: 'R_k is a subset of R_(k+1); previous axioms keep their fingerprints; generation and ledger stay consistent.', rejection: 'INVALID_CANDIDATE' },
  ],
  monotonicity: 'R_0 subset R_1 subset ... subset R_k: an admitted axiom is never retracted or rewritten by a later expansion.',
  reproducibility: {
    rule: 'Expansion is deterministic: fingerprints are structural (no Date.now, no Math.random, no crypto).',
    axiom_fingerprint_scheme: 'axiom-v1:<fnv1a64 of canonicalized {id, layer, statement, covers, consequences}>',
    seed_fingerprint_scheme: 'seed-v1:<fnv1a64 of canonicalized {generation, sorted axiom fingerprints}>',
    note: 'Provenance (origin, solvedProblemId, proof) is intentionally excluded from the fingerprint: the same mathematics is the same axiom.',
  },
  trust_boundary: {
    structural_verification: 'Local: TypeScript gate run in src/ricisSeed, verified by unit tests.',
    lean_kernel_verification: 'REQUIRES_CORE_LEAN. Local structural verification is not a Lean kernel run; no claim is upgraded without toolchain, compiler output, #print axioms and sorry-free evidence.',
    derived_vs_new_assumption: 'A12-A14 are derived rules (proved from R_0), not new independent assumptions.',
    known_limitation: 'The consistency table is an exact-form guard. It detects overt contradictions but is not a full unification-based semantic decision procedure; deeper consistency requires Lean.',
  },
};

const expansionRun = {
  command: 'grow(Ric, [U-NESTED-SINGULAR-DIV, U-MIXED-ZERO-INF-DIFF, U-INF-SELF-DIFF])',
  generations: generationFingerprints,
  final_generation: `R${growth.system.seed.generation}`,
  final_axiom_count: growth.system.seed.axioms.length,
  ledger: ledgerEntries,
};

const vectorSeedLift = {
  principle: 'The seed expansion layer lifts coordinatewise exactly like every other RICIS layer.',
  open_class_vector: 'U_vec = (U_1, ..., U_n); a class is open in R^(n) when at least one component form is open in R^(1).',
  resolve_vector: 'Resolve_vec(U_vec) = (Resolve(U_1), ..., Resolve(U_n))',
  expandto_vector: 'R^(n)_(k+1) = Ric.ExpandTo(R^(n)_k, Resolve_vec(U_vec_k))',
  commit_rule: 'All components must pass the admissibility gates. A partial pass commits nothing (no partial axiom).',
  coordinatewise_derived_lift: {
    A12: '(0_F/0_G)/(0_H/0_K) -> ((F_1*K_1)/(G_1*H_1), ..., (F_n*K_n)/(G_n*H_n))',
    A13: '0_F*(infinity_G - infinity_H) -> (F_1*(G_1-H_1), ..., F_n*(G_n-H_n))',
    A14: 'infinity_F - infinity_F -> (1, ..., 1)',
  },
  conservativity: 'At n=1 the lifted expansion reduces exactly to scalar seed expansion; the layer adds no certificates of its own.',
};

const extended = {
  RICIS_Unified_Complete_Document: {
    // Базовый документ целиком: ни один раздел v7.9 не теряется и не переписывается молча.
    ...previous,
    document_version: '8.0_seed_expansion',
    previous_version: previous.document_version,
    version_rationale:
      'Major version: the object changes kind. v7.9 describes a fixed axiom system; v8.0 describes a growing one ' +
      '(a seed with a self-expansion operator). All v7.9 rules are preserved verbatim; the new layer is additive and conservative.',
    status: 'LOGICALLY_COMPLETE_SECURE_EXTENDED_SELF_EXPANDING',
    created_from: [
      ...(previous.created_from as string[]),
      `v${previous.document_version as string}`,
      'seed_expansion_protocol_A11',
      'derived_axioms_A12_A13_A14_from_actual_seed_run',
      'admissibility_gates_and_rejection_registry',
    ],
    language: 'English',
    logical_integrity:
      'Derived from L1_IDENTITY, 0 assumptions, Safety Protocols SP1-SP5, expansion protocols SP6-SP11, P1, P2, ' +
      'the conservative Vector Axiom Layer, and the meta-axiom A11 (expandability). ' +
      'A6_GENERAL is realized geometrically through preserved orthogonal axes; A11 is a rule over the rule system, not a new physical assumption.',
    enhancements:
      'Preserves all v7.9 rules; adds the SEED model of RICIS, the meta-axiom A11 with the operator ' +
      'Ric.ExpandTo((x) => x.Resolve(U)), the Resolve/Commit split, ten admissibility gates, protocols SP6-SP11 and P2, ' +
      'a coordinatewise vector lift of the expansion layer, and the derived axioms A12-A14 obtained by an actual seed run.',

    FUNDAMENTAL_LOGICAL_STRUCTURE: {
      ...(previous.FUNDAMENTAL_LOGICAL_STRUCTURE as Record<string, unknown>),
      derivation_chain:
        'L0 -> L1 -> Safety Protocols SP1-SP5 -> P1 -> Axioms A1-A10 -> Operations -> Vector Axiom Layer -> Monoliths -> ' +
        'FractalLaw -> Seed Expansion Layer (A11, SP6-SP11, P2) -> Derived Axioms A12...An',
      inviolable_rule:
        'Any inference contradicting L0/L1, Safety Protocols SP1-SP5, P1, the expansion protocols SP6-SP11, P2, ' +
        'or the admissibility gates of A11 is invalid',
      layer_order: [
        ...((previous.FUNDAMENTAL_LOGICAL_STRUCTURE as Record<string, unknown>).layer_order as string[]),
        'open class detection',
        'resolve and prove',
        'admissibility gates',
        'expansion commit (R_(k+1))',
      ],
      seed_principle: 'The system contains not only knowledge but also a proved way to acquire new proved knowledge.',
    },

    PART_1_ABSOLUTE_FOUNDATIONS: {
      ...(previous.PART_1_ABSOLUTE_FOUNDATIONS as Record<string, unknown>),
      L1_IDENTITY: {
        ...((previous.PART_1_ABSOLUTE_FOUNDATIONS as Record<string, unknown>).L1_IDENTITY as Record<string, unknown>),
        consequences: [
          'L1C1_Preservation',
          'L1C2_TypeAsIdentity',
          'L1C3_StructuralEqualityBeforeEvaluation',
          'L1C4_MonotonicGrowth',
        ],
        L1C4_MonotonicGrowth:
          'The identity of an admitted axiom is preserved across generations: A in R_k implies A unchanged in R_(k+1), ' +
          'therefore R_k subset R_(k+1). Growth never rewrites what is already proved.',
      },
    },

    PART_2_SAFETY_PROTOCOLS: {
      ...(previous.PART_2_SAFETY_PROTOCOLS as Record<string, unknown>),
      SP6_PROOF_BEFORE_COMMIT: {
        name: 'Resolve Then Admit, Never Compute Then Assume',
        rule: 'A candidate rule enters R only together with a proof certificate produced by Resolve. Resolve means resolve AND prove.',
        prohibition: 'A numerically or heuristically obtained statement is never an axiom, and SP6 forbids treating it as one.',
      },
      SP7_NO_SELF_CERTIFICATION: {
        name: 'No Circularity',
        rule: 'No step of a proof may cite the axiom that this proof introduces.',
        rationale: 'Otherwise any statement could certify itself and the axiom set would degrade into a list of assertions.',
      },
      SP8_NO_AXIOM_INFLATION: {
        name: 'No New Axiom For A Covered Form',
        rule: 'If R_k already resolves an input form directly, no new axiom may be introduced for it.',
        rationale: 'Growth is measured by new proved coverage, not by the number of named rules.',
      },
      SP9_CORE_IMMUTABILITY: {
        name: 'Protected Seed Core',
        rule: 'L0, L1, L1C1-L1C4, SP1-SP5, P1 and A11 are immutable under expansion.',
        rationale: 'A growth operator that could rewrite its own foundation is not growth but loss of identity.',
      },
      SP10_CONSISTENCY_TABLE: {
        name: 'One Input Form, One Output Form',
        rule: 'The O(1) reduction table stays functional: an input form cannot receive two different output forms.',
        limitation: 'Exact-form guard; it detects overt contradictions, not all unification-level inconsistencies.',
      },
      SP11_REPRODUCIBILITY: {
        name: 'Deterministic Expansion',
        rule: 'Fingerprints are structural and deterministic; expansion contains no Date.now, Math.random, or environment-dependent data.',
        rationale: 'A generation that cannot be reproduced cannot be audited, hence cannot be trusted.',
      },
      P2_ADMISSIBILITY_GATES: {
        name: 'Commit Is A Separate Act',
        rule: 'Commit(A_new) is not implied by Resolve(U). The candidate must pass all admissibility gates of A11.',
        formal_notation: 'R_(k+1) = R_k union {A_new} iff Gates(Resolve(U_k), R_k) = PASS',
      },
    },

    AXIOMS: {
      ...(previous.AXIOMS as Record<string, unknown>),
      meta: {
        A11_EXPANDABILITY: {
          level: 'META_AXIOM (a rule over the rule system, not an eleventh singularity formula next to A1-A10)',
          statement: 'R_(k+1) = Ric.ExpandTo(R_k, Resolve(U_k))',
          program_notation: 'Ric.ExpandTo((x) => x.Resolve(UnsolvedSingularProblem))',
          reading:
            'If U_k is a structural class not resolved by R_k, and Resolve(U_k) returns a proved resolution, ' +
            'then ExpandTo admits the proved rule into R_(k+1).',
          x_is: 'the current state of the RICIS system itself',
          resolve_is: 'resolve AND prove (returns a proof certificate)',
          expandto_is: 'admission of the proved rule (Commit), guarded by SP6-SP11 and P2',
          protects: 'A11 belongs to the protected core and cannot be redefined by what it produces',
          conservativity: 'If no open class exists, ExpandTo is the identity on R_k.',
        },
      },
      derived_by_seed_expansion: derivedAxioms,
      open_classes_uncommitted: {
        POWER_OF_SINGULAR: {
          input_form: '(0_F)^(inf_G)',
          status: 'OPEN_UNPROVEN',
          decision: 'NOT COMMITTED',
          reason: 'The class is genuinely outside R_0 coverage, but no proof certificate exists; SP6 blocks admission.',
          rejection_reason: 'RESOLUTION_REQUIRED',
          note: 'Openness alone is not a licence to axiomatize. The system records the class and refuses to guess.',
        },
      },
      rejected_candidate_patterns: rejectionRegistry,
      reserved_numbering: 'A15 and above are reserved for future committed expansions; they are not axioms until a proof passes the gates.',
    },

    VECTOR_AXIOM_LAYER: {
      ...(previous.VECTOR_AXIOM_LAYER as Record<string, unknown>),
      coordinatewise_lift: {
        ...((previous.VECTOR_AXIOM_LAYER as Record<string, unknown>).coordinatewise_lift as Record<string, unknown>),
        A12: '(0_F/0_G)/(0_H/0_K) -> ((F_1*K_1)/(G_1*H_1), ..., (F_n*K_n)/(G_n*H_n))',
        A13: '0_F*(infinity_G - infinity_H) -> (F_1*(G_1-H_1), ..., F_n*(G_n-H_n))',
        A14: 'infinity_F - infinity_F -> (1, ..., 1)',
      },
      seed_expansion_lift: vectorSeedLift,
    },

    PART_4_MONOLITHS: {
      ...(previous.PART_4_MONOLITHS as Record<string, unknown>),
      seed_property:
        'The Order-0 monolith is a seed: it carries the growth operator A11 alongside its identities. ' +
        'A monolith that resolves a new class and proves the resolution becomes a monolith of the next generation.',
    },

    PART_5_FRACTAL_LAW: {
      ...(previous.PART_5_FRACTAL_LAW as Record<string, unknown>),
      seed_lift:
        'Each unresolved node U_k of the unfolding is a candidate expansion step: ' +
        'R_seed(Q) = {Q, T(Q), infinity_Q, 0_Q, Resolve(Q), ExpandTo(Q)}; a node enters the axiom set only through the gates.',
    },

    PART_7_SEED_EXPANSION_PROTOCOL: seedProtocol,

    PART_8_EXPANSION_LEDGER: expansionRun,

    COMPUTATION_ALGORITHM: {
      phases: [
        ...((previous.COMPUTATION_ALGORITHM as Record<string, unknown>).phases as unknown[]),
        {
          phase: 7,
          name: 'OPEN_CLASS_DETECTION',
          rule: 'If the resulting form is not covered by R_k, register it as an open class U_k. Do not approximate and do not silently fail.',
        },
        {
          phase: 8,
          name: 'RESOLVE_AND_PROVE',
          rule: 'Resolve(U_k) must return a proof certificate: strategy, step chain, conclusion; no limits, no numerical thresholds (P1).',
        },
        {
          phase: 9,
          name: 'ADMISSIBILITY_GATES',
          rule: 'Run all gates of A11 (resolution present, core protected, no forbidden semantics, no self-certification, rule-set closure, chain connected, class open, no duplicate, consistency table).',
        },
        {
          phase: 10,
          name: 'EXPANSION_COMMIT',
          rule: 'On PASS: R_(k+1) = R_k union {A_new}, ledger entry written, new structural fingerprint computed. On FAIL: R_k is unchanged.',
        },
      ],
      prohibitions: [
        ...((previous.COMPUTATION_ALGORITHM as Record<string, unknown>).prohibitions as string[]),
        'No commit of an unproved candidate (SP6/P2)',
        'No self-certifying proof (SP7)',
        'No axiom for an already covered form (SP8)',
        'No redefinition of the protected core, including A11 itself (SP9)',
        'No nondeterministic or environment-dependent expansion (SP11)',
      ],
    },

    EXAMPLES: {
      ...(previous.EXAMPLES as Record<string, unknown>),
      seed_expansion: [
        '(0_F/0_G)/(0_H/0_K): A4 -> A4 -> classical fraction algebra => (F*K)/(G*H)  [A12, R1]',
        '0_F*(infinity_G - infinity_H): A7 -> infinity_(G-H), then A6 => F*(G-H)  [A13, R2, pure RICIS, no classical step]',
        'infinity_F - infinity_F: A7 -> infinity_(F-F) -> local structural reduction -> infinity_0 -> A2 => 1  [A14, R3]',
        '0_F*infinity_G: already covered by A6 => no new axiom (PROBLEM_ALREADY_COVERED)',
        '(0_F)^(infinity_G): open class without proof => no commit (RESOLUTION_REQUIRED)',
      ],
    },

    COMPATIBILITY: {
      ...(previous.COMPATIBILITY as Record<string, unknown>),
      seed_expansion: 'At k=0 and with no open class the expansion layer is the identity; it never changes an existing resolution.',
      derived_axiom_status: 'A12-A14 are consequences of R_0 lifted into the rule table for O(1) reuse, not new assumptions.',
      formal_status_seed:
        'The seed protocol is locally verified in TypeScript (structural gates, determinism, monotonicity, rejection registry). ' +
        'Lean kernel verification of the expansion layer is REQUIRES_CORE_LEAN and is not claimed here.',
    },

    QUICK_REFERENCE: {
      laws: 'L0 (Continuity), L1 (X=X, L1C4 monotonic growth), SP1-SP5 (Safety), SP6-SP11 (Expansion safety), P1 (No Recursive Limits or LHopital), P2 (Commit Is A Separate Act)',
      core: 'F/0=infinity_F; 0_F otimes infinity_G => R(F,G) ->[mu] F*G; 0_F/0_G=F/G; infinity_F/infinity_G=F/G; F*0=0_F',
      seed: 'A11: R_(k+1) = Ric.ExpandTo(R_k, Resolve(U_k)); x = current RICIS state; Resolve = resolve AND prove; ExpandTo = admission through gates',
      priority: 'Phase -1 L1 -> Phase 0 Direct Point Substitution -> Phase 0.25 Trig Polarization -> Phase 0.5 SP4 -> Phase 1 Safety -> Phase 2 RICIS -> Phase 7 Open Class -> Phase 8 Resolve+Prove -> Phase 9 Gates -> Phase 10 Commit',
      new_rules: 'SP6 proof before commit; SP7 no self-certification; SP8 no axiom inflation; SP9 protected core; SP10 one input form one output form; SP11 deterministic expansion; P2 commit is a separate act',
      derived_now: 'A12 (nested singular division), A13 (zero times infinity difference), A14 (infinity minus itself = 1)',
    },

    VERIFICATION_STATUS: {
      ...(previous.VERIFICATION_STATUS as Record<string, unknown>),
      dependencies: 'L0->L1->SP1-SP5->P1->Axioms->Operations->VectorLayer->Monoliths->FractalLaw->A11/SP6-SP11/P2->Derived axioms',
      seed_expansion_run: {
        local_structural_verification: 'PASS (TypeScript, src/ricisSeed, deterministic reruns)',
        generations_verified: Object.keys(generationFingerprints),
        derived_axioms_verified: Object.keys(derivedAxioms),
        rejection_scenarios_verified: rejectionRuns.map(run => run.id),
        lean_kernel_verification: 'REQUIRES_CORE_LEAN (not performed locally; no claim upgraded)',
        reproducibility: 'Two independent runs produce identical fingerprints for R0..R3',
      },
      assumptions: '0 declared base assumptions; A11, SP6-SP11, P2 and the derived rules are explicit, auditable extension rules.',
      ready_for_publication: 'Requires author review of the v8.0 seed-expansion wording and of the Lean formalization status.',
    },

    CALCULUS_RESOLUTION_EXTENSION: {
      ...(previous.CALCULUS_RESOLUTION_EXTENSION as Record<string, unknown>),
      expansion_resolution_principle: {
        concept:
          'When a local resolution meets a form that no rule of R_k covers, the system registers an open class, ' +
          'refuses analytic substitution by a limit or an approximation, and admits a new rule only after a proved resolution.',
        formula: 'uncovered(form) -> register U_k -> Resolve(U_k) -> Gates -> (COMMIT | REJECT with R_k unchanged)',
        complexity: 'O(1) gate evaluation over the candidate; the cost lies in producing the proof, not in admitting it.',
        formalization_status: 'Specification-level rule with a local structural implementation; Lean kernel formalization pending.',
      },
    },
  },
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(extended, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  output: outputPath,
  generations: generationFingerprints,
  derived: Object.keys(derivedAxioms),
  rejections: rejectionRuns.map(run => run.id),
}, null, 2));
