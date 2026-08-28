import type { NodeState, Proof } from '../model/types';

export type CalculatorMode =
  | 'CDCC' | 'P_VS_NP' | 'COMPLEX_ANALYSIS' | 'RIEMANN' | 'BSD' | 'HODGE'
  | 'POINCARE' | 'MANDELBROT' | 'GRAVITATIONAL' | 'NAVIER_STOKES' | 'YANG_MILLS'
  | 'CHLADNI' | 'KINEMATIC' | 'LLM_GRADIENT';

const CALCULATOR_REPOSITORY = 'https://github.com/A1Dmitry/RICIS-7.7-online-calculator';
const CALCULATOR_COMMIT = '9806b7c97b57bd738301db459b8c8e72f73d1a23';
const LICENSE_LABEL = 'CC BY 4.0';

const ALLOWED_MODES: ReadonlySet<string> = new Set<CalculatorMode>([
  'CDCC', 'P_VS_NP', 'COMPLEX_ANALYSIS', 'RIEMANN', 'BSD', 'HODGE', 'POINCARE',
  'MANDELBROT', 'GRAVITATIONAL', 'NAVIER_STOKES', 'YANG_MILLS', 'CHLADNI', 'KINEMATIC',
  'LLM_GRADIENT',
]);

const SHA_256 = /^[a-f0-9]{64}$/;

type CatalogText = Readonly<{ ru: string; en: string }>;

export interface ImmutableSourceRef {
  readonly repositoryUrl: string;
  readonly commit: string;
  readonly sourcePath: string;
  readonly sourceId: string;
  readonly contentHash: string;
  readonly licenceLabel: string;
}

export interface CaseExample {
  readonly input: Readonly<Record<string, string | number | boolean>>;
  readonly expectedStructuralResult: string;
  /** Source navigation trace, not a synthesized Proof record. */
  readonly orderedRuleTrace: readonly string[];
}

export interface VisualizationSpec {
  readonly kind: 'STATIC_ASSET' | 'DECLARATIVE_LOCAL_COMPONENT' | 'EXTERNAL_CALCULATOR_LAUNCH';
  readonly altText: string;
  readonly description: string;
}

export interface SolutionMonolithDefinition {
  readonly id: string;
  readonly title: CatalogText;
  readonly category: CatalogText;
  readonly familyId: string;
  readonly sourceEvidence: {
    readonly kind: 'RICIS_SOURCE_SOLVED';
    readonly source: ImmutableSourceRef;
    readonly monolithType: string;
    readonly semanticIndexExpression: string;
    readonly derivationHistoryHash: string;
  };
  readonly calculator: {
    readonly mode: CalculatorMode;
    readonly preset: Readonly<Record<string, string | number | boolean>>;
    readonly presetHash: string;
  };
  readonly example: CaseExample;
  readonly visualization: VisualizationSpec;
}

export interface SolutionRelationDefinition {
  readonly id: string;
  readonly kind: 'SOLVED_HIERARCHY' | 'GROUNDS_DEPENDENT_TASK';
  readonly fromMonolithId: string;
  readonly toMonolithId?: string;
  readonly dependentNodeId?: string;
  readonly sourceRationale: string;
  readonly rationaleHash: string;
}

export interface ExistingNodeBinding {
  readonly monolithId: string;
  readonly nodeId: string;
}

export interface SolutionCatalogManifest {
  readonly schemaVersion: '1.0';
  readonly sourceRepositoryCommit: string;
  readonly monoliths: readonly SolutionMonolithDefinition[];
  readonly relations: readonly SolutionRelationDefinition[];
  readonly existingNodeBindings: readonly ExistingNodeBinding[];
}

export type GreenBasis =
  | 'NONE'
  | 'RICIS_SOURCE_SOLVED'
  | 'LEAN_KERNEL_VERIFIED'
  | 'RICIS_SOURCE_AND_LEAN_KERNEL_VERIFIED';

export interface LeanEvidenceInput {
  readonly trustStatus: 'LEAN_VERIFIED' | 'TRUSTED_AXIOM' | 'REQUIRES_CORE_LEAN' | 'REJECTED' | 'ABSENT';
  readonly sourceHash?: string;
  readonly toolchain?: string;
  readonly command?: string;
  readonly compilerOutput?: string;
  readonly axiomReport?: string;
}

export interface GreenMonolithPresentation {
  readonly basis: GreenBasis;
  readonly color: '#22c55e' | null;
  readonly sourceSolvedVisible: boolean;
  readonly leanVerifiedVisible: boolean;
  readonly resolvedNodeStatePreserved: boolean;
  readonly evidenceLabels: readonly string[];
}

export interface CatalogValidationResult {
  readonly kind: 'VALID' | 'REJECTED';
  readonly reasons: readonly string[];
}

export interface CalculatorLaunchResult {
  readonly kind: 'READY' | 'UNCONFIGURED' | 'REJECTED';
  readonly href?: string;
  readonly reason?: 'calculator_base_url_missing' | 'invalid_base_url' | 'mode_not_allowlisted' | 'preset_not_static';
}

export interface MapNodeVisualStatus {
  readonly sphereColor: '#ef4444' | '#eab308' | '#22c55e' | '#a855f7' | '#6b7280' | '#22d3ee' | '#94a3b8';
  readonly greenBasis: GreenBasis;
  readonly ariaLabelSuffix: string;
  readonly greenByCatalog: boolean;
}

export interface SolutionMonolithCardView {
  readonly green: GreenMonolithPresentation;
  readonly source?: ImmutableSourceRef;
  readonly solution?: SolutionMonolithDefinition;
  readonly example?: CaseExample;
  readonly visualization?: VisualizationSpec;
  readonly proofDisclosure: {
    readonly summary: string;
    readonly steps: readonly string[];
    readonly sourceAvailable: boolean;
    readonly leanEvidenceAvailable: boolean;
  };
  readonly relations: readonly SolutionRelationDefinition[];
  readonly launch: CalculatorLaunchResult;
}

interface CatalogSeed {
  readonly mode: CalculatorMode;
  readonly id: string;
  readonly title: CatalogText;
  readonly category: CatalogText;
  readonly familyId: string;
  readonly sourcePath: string;
  readonly contentHash: string;
  readonly expectedStructuralResult: string;
  readonly semanticIndexExpression: string;
}

const CATALOG_SEEDS: readonly CatalogSeed[] = [
  { mode: 'CDCC', id: 'calculator-cdcc', title: { ru: 'Континуум CDCC', en: 'CDCC Continuum' }, category: { ru: 'Основания', en: 'Foundations' }, familyId: 'foundations', sourcePath: 'src/components/CDCCSingularity.tsx', contentHash: '5e105e40464d27ea40696ad88f0c5def10bf47e5df4f93cc550576ed7b97372c', expectedStructuralResult: 'Континуум представлен как линейный RICIS-монолит.', semanticIndexExpression: 'CDCC(E)' },
  { mode: 'P_VS_NP', id: 'calculator-p_vs_np', title: { ru: 'P=NP вычислительный монолит', en: 'P=NP Computational Monolith' }, category: { ru: 'Вычислительная сложность', en: 'Computational Complexity' }, familyId: 'foundations', sourcePath: 'src/components/PVsNPSingularity.tsx', contentHash: 'a9c0eeef58cb8737b2e23d9d40014c14ada67e2f12fabac8a75cfb0162dee123', expectedStructuralResult: 'P_RICIS = NP_RICIS.', semanticIndexExpression: 'MersenneRingReduction(P, NP)' },
  { mode: 'COMPLEX_ANALYSIS', id: 'calculator-complex_analysis', title: { ru: 'Существенная комплексная сингулярность', en: 'Essential Complex Singularity' }, category: { ru: 'Комплексный анализ', en: 'Complex Analysis' }, familyId: 'analytic-geometric', sourcePath: 'src/components/ComplexSingularity.tsx', contentHash: '8c75c953c6cf996f2912605f9e507be444301dd860dbfaf920f30f19065351c5', expectedStructuralResult: 'Комплексное поле раскрыто как типизированный монолит.', semanticIndexExpression: 'exp(1/z)' },
  { mode: 'RIEMANN', id: 'calculator-riemann', title: { ru: 'Мономолит дзета-функции Римана', en: 'Riemann Zeta Monolith' }, category: { ru: 'Аналитическая теория чисел', en: 'Analytic Number Theory' }, familyId: 'analytic-geometric', sourcePath: 'src/components/RiemannSingularity.tsx', contentHash: '338441ad279352ab8629cf4dd4d92ea6e9410fee86b45b0c4d4718f94ab40189', expectedStructuralResult: 'Полюс и нули раскрыты в source-bound RICIS case.', semanticIndexExpression: 'zeta(s)' },
  { mode: 'BSD', id: 'calculator-bsd', title: { ru: 'Мономолит Бирча—Свиннертон-Дайера', en: 'Birch–Swinnerton-Dyer Monolith' }, category: { ru: 'Арифметическая геометрия', en: 'Arithmetic Geometry' }, familyId: 'analytic-geometric', sourcePath: 'src/components/BSDSingularity.tsx', contentHash: '778414cc66fb56d4dfd2f443a04b49072a9bc0d5682c33561ac3507b49c261eb', expectedStructuralResult: 'BSD case доступен как source-bound RICIS disclosure.', semanticIndexExpression: 'L(E, s)' },
  { mode: 'HODGE', id: 'calculator-hodge', title: { ru: 'Мономолит циклов Ходжа', en: 'Hodge Cycle Monolith' }, category: { ru: 'Алгебраическая геометрия', en: 'Algebraic Geometry' }, familyId: 'analytic-geometric', sourcePath: 'src/components/HodgeSingularity.tsx', contentHash: 'e2c789cadd2f36be374da1fd8670c61f5ee6ff0574528929552189d0e27d4df6', expectedStructuralResult: 'Hodge case раскрыт в source-bound RICIS карте.', semanticIndexExpression: 'H^{p,p}(X)' },
  { mode: 'POINCARE', id: 'calculator-poincare', title: { ru: 'Мономолит Пуанкаре и потока Риччи', en: 'Poincaré and Ricci-Flow Monolith' }, category: { ru: 'Топология', en: 'Topology' }, familyId: 'analytic-geometric', sourcePath: 'src/components/PoincareSingularity.tsx', contentHash: 'b23f896a31dbdee8c732a9a483b2eb662e24eb86caa8d0d403bf90b96fb6eadd', expectedStructuralResult: 'Топологический case раскрыт без limit-surgery.', semanticIndexExpression: 'RicciFlow(M)' },
  { mode: 'MANDELBROT', id: 'calculator-mandelbrot', title: { ru: 'Фрактальный мономолит Мандельброта', en: 'Mandelbrot Fractal Monolith' }, category: { ru: 'Фрактальная динамика', en: 'Fractal Dynamics' }, familyId: 'analytic-geometric', sourcePath: 'src/components/MandelbrotSingularity.tsx', contentHash: 'bec5e7c1a42cfaf04b14d9826fde531bd33dea5d8a22293832e5e4580b599278', expectedStructuralResult: 'Фрактальная сингулярность раскрыта source-bound case.', semanticIndexExpression: 'z_{n+1}=z_n^2+c' },
  { mode: 'GRAVITATIONAL', id: 'calculator-gravitational', title: { ru: 'Гравитационный мономолит Шварцшильда', en: 'Schwarzschild Gravitational Monolith' }, category: { ru: 'Физические поля', en: 'Physical Fields' }, familyId: 'physical-fields', sourcePath: 'src/components/GravitationalSingularity.tsx', contentHash: '69f054a6828f5656040ba071ef0a5b004ddff6c1aec4cda0f6f117771741e893', expectedStructuralResult: 'Гравитационная сингулярность представлена в RICIS case.', semanticIndexExpression: 'r=0' },
  { mode: 'NAVIER_STOKES', id: 'calculator-navier_stokes', title: { ru: 'Мономолит Навье—Стокса', en: 'Navier–Stokes Monolith' }, category: { ru: 'Физические поля', en: 'Physical Fields' }, familyId: 'physical-fields', sourcePath: 'src/components/NavierStokesSingularity.tsx', contentHash: 'd4f301b62910dff21a3d0d904ccd92d51b52fee4c49f8cd9c3313b8a8779818f', expectedStructuralResult: 'Вихревой поток раскрыт как source-bound RICIS case.', semanticIndexExpression: 'u(x,t)' },
  { mode: 'YANG_MILLS', id: 'calculator-yang_mills', title: { ru: 'Мономолит Янга—Миллса', en: 'Yang–Mills Monolith' }, category: { ru: 'Физические поля', en: 'Physical Fields' }, familyId: 'physical-fields', sourcePath: 'src/components/YangMillsSingularity.tsx', contentHash: 'd9372843bb92908401da261c1c5ce142b7672552e13efb5ed29f67977391f4c7', expectedStructuralResult: 'Калибровочный case доступен в source-bound раскрытии.', semanticIndexExpression: 'F_{mu nu}' },
  { mode: 'CHLADNI', id: 'calculator-chladni', title: { ru: 'Резонансный мономолит Хладни', en: 'Chladni Resonance Monolith' }, category: { ru: 'Физические поля', en: 'Physical Fields' }, familyId: 'physical-fields', sourcePath: 'src/components/ChladniSingularity.tsx', contentHash: 'f6dfa8b33b43a22e0447882d6f96f74cb6c756d68e95a8fe5dbd731bb6bf76da', expectedStructuralResult: 'Волновой case раскрыт в RICIS source.', semanticIndexExpression: 'WavePlate(x,y,t)' },
  { mode: 'KINEMATIC', id: 'calculator-kinematic', title: { ru: 'Кинематический мономолит манипулятора', en: 'Robot Manipulator Kinematic Monolith' }, category: { ru: 'Прикладная геометрия и управление', en: 'Applied Geometry and Control' }, familyId: 'physical-fields', sourcePath: 'src/components/KinematicSingularity.tsx', contentHash: '1e3ddc630dd8b4878cc278d4b2f251a35b315ec1d458d9ee877e56743261d3a3', expectedStructuralResult: 'Jacobian манипулятора раскрыт отдельно от Jacobian Conjecture.', semanticIndexExpression: 'J(q)' },
  { mode: 'LLM_GRADIENT', id: 'calculator-llm_gradient', title: { ru: 'Мономолит стабильности градиента LLM', en: 'LLM Gradient Stability Monolith' }, category: { ru: 'Прикладные вычисления', en: 'Applied Computation' }, familyId: 'foundations', sourcePath: 'src/components/LLMGradientSingularity.tsx', contentHash: 'fed8addd966c5e4fa6d2d1ea09f6eef2b8b2ac6546ac10feed1d3ddf8d294483', expectedStructuralResult: 'Градиентный case раскрыт как RICIS source-bound монолит.', semanticIndexExpression: 'nabla L' },
] as const;

function stableHashSeed(seed: CatalogSeed): string {
  return seed.contentHash;
}

function toDefinition(seed: CatalogSeed): SolutionMonolithDefinition {
  return {
    id: seed.id,
    title: seed.title,
    category: seed.category,
    familyId: seed.familyId,
    sourceEvidence: {
      kind: 'RICIS_SOURCE_SOLVED',
      source: {
        repositoryUrl: CALCULATOR_REPOSITORY,
        commit: CALCULATOR_COMMIT,
        sourcePath: seed.sourcePath,
        sourceId: seed.id,
        contentHash: seed.contentHash,
        licenceLabel: LICENSE_LABEL,
      },
      monolithType: 'typed_recursive_monolith',
      semanticIndexExpression: seed.semanticIndexExpression,
      derivationHistoryHash: stableHashSeed(seed),
    },
    calculator: {
      mode: seed.mode,
      preset: Object.freeze({}),
      presetHash: stableHashSeed(seed),
    },
    example: {
      input: Object.freeze({ case: seed.mode }),
      expectedStructuralResult: seed.expectedStructuralResult,
      orderedRuleTrace: Object.freeze([
        'Source-bound case identity retained.',
        'Typed monolith and semantic index are disclosed.',
        'Open immutable calculator source for the full case record and visualisation.',
      ]),
    },
    visualization: {
      kind: 'EXTERNAL_CALCULATOR_LAUNCH',
      altText: `${seed.title.en}: source-bound calculator visualisation`,
      description: 'The external calculator visualisation is opened only by an explicit user action and is not Lean/Core evidence.',
    },
  };
}

export const INITIAL_CALCULATOR_MONOLITHS: readonly SolutionMonolithDefinition[] = Object.freeze(CATALOG_SEEDS.map(toDefinition));

const relation = (
  id: string,
  fromMonolithId: string,
  toMonolithId: string,
  sourceRationale: string,
): SolutionRelationDefinition => ({
  id,
  kind: 'SOLVED_HIERARCHY',
  fromMonolithId,
  toMonolithId,
  sourceRationale,
  rationaleHash: INITIAL_CALCULATOR_MONOLITHS.find(item => item.id === fromMonolithId)?.sourceEvidence.source.contentHash ?? '',
});

const grounding = (
  id: string,
  fromMonolithId: string,
  dependentNodeId: string,
  sourceRationale: string,
): SolutionRelationDefinition => ({
  id,
  kind: 'GROUNDS_DEPENDENT_TASK',
  fromMonolithId,
  dependentNodeId,
  sourceRationale,
  rationaleHash: INITIAL_CALCULATOR_MONOLITHS.find(item => item.id === fromMonolithId)?.sourceEvidence.source.contentHash ?? '',
});

/** Navigation hierarchy only; these relations do not replace individual source derivations. */
export const INITIAL_SOLUTION_RELATIONS: readonly SolutionRelationDefinition[] = Object.freeze([
  relation('hierarchy-cdcc-to-pnp', 'calculator-cdcc', 'calculator-p_vs_np', 'Approved initial navigation hierarchy: continuum to computational monolith.'),
  relation('hierarchy-cdcc-to-complex', 'calculator-cdcc', 'calculator-complex_analysis', 'Approved initial navigation hierarchy: continuum to analytic/geometric monoliths.'),
  relation('hierarchy-complex-to-riemann', 'calculator-complex_analysis', 'calculator-riemann', 'Approved initial navigation hierarchy: complex field to zeta monolith.'),
  relation('hierarchy-riemann-to-bsd', 'calculator-riemann', 'calculator-bsd', 'Approved initial navigation hierarchy: analytic number theory to arithmetic geometry.'),
  relation('hierarchy-riemann-to-hodge', 'calculator-riemann', 'calculator-hodge', 'Approved initial navigation hierarchy: analytic/geometric navigation relation.'),
  relation('hierarchy-hodge-to-poincare', 'calculator-hodge', 'calculator-poincare', 'Approved initial navigation hierarchy: algebraic geometry to topology.'),
  relation('hierarchy-complex-to-mandelbrot', 'calculator-complex_analysis', 'calculator-mandelbrot', 'Approved initial navigation hierarchy: complex analysis to fractal dynamics.'),
  relation('hierarchy-gravity-to-navier', 'calculator-gravitational', 'calculator-navier_stokes', 'Approved initial navigation hierarchy: physical field monoliths.'),
  relation('hierarchy-navier-to-yang', 'calculator-navier_stokes', 'calculator-yang_mills', 'Approved initial navigation hierarchy: physical field monoliths.'),
  relation('hierarchy-yang-to-chladni', 'calculator-yang_mills', 'calculator-chladni', 'Approved initial navigation hierarchy: field to resonance monolith.'),
  relation('hierarchy-chladni-to-kinematic', 'calculator-chladni', 'calculator-kinematic', 'Approved initial navigation hierarchy: resonance to applied control monolith.'),
  relation('hierarchy-pnp-to-llm', 'calculator-p_vs_np', 'calculator-llm_gradient', 'Approved initial navigation hierarchy: computational to applied LLM monolith.'),
  grounding('grounds-pnp-existing-node', 'calculator-p_vs_np', 'informatics-complexity', 'Exact owner-approved binding to the existing P=NP map node.'),
  grounding('grounds-cdcc-existing-node', 'calculator-cdcc', 'registry-115', 'Exact owner-approved binding to the existing CDCC map node.'),
  grounding('grounds-navier-existing-node', 'calculator-navier_stokes', 'registry-117', 'Exact owner-approved binding to the existing Navier–Stokes map node.'),
  grounding('grounds-llm-existing-node', 'calculator-llm_gradient', 'registry-118', 'Exact owner-approved binding to the existing LLM gradient map node.'),
]);

export const EXISTING_NODE_BINDINGS: readonly ExistingNodeBinding[] = Object.freeze([
  { monolithId: 'calculator-p_vs_np', nodeId: 'informatics-complexity' },
  { monolithId: 'calculator-cdcc', nodeId: 'registry-115' },
  { monolithId: 'calculator-navier_stokes', nodeId: 'registry-117' },
  { monolithId: 'calculator-llm_gradient', nodeId: 'registry-118' },
]);

export const INITIAL_SOLUTION_CATALOG: SolutionCatalogManifest = Object.freeze({
  schemaVersion: '1.0',
  sourceRepositoryCommit: CALCULATOR_COMMIT,
  monoliths: INITIAL_CALCULATOR_MONOLITHS,
  relations: INITIAL_SOLUTION_RELATIONS,
  existingNodeBindings: EXISTING_NODE_BINDINGS,
});

function isCompleteLeanVerification(leanEvidence: LeanEvidenceInput): boolean {
  return leanEvidence.trustStatus === 'LEAN_VERIFIED'
    && Boolean(leanEvidence.sourceHash && SHA_256.test(leanEvidence.sourceHash))
    && Boolean(leanEvidence.toolchain?.trim())
    && Boolean(leanEvidence.command?.trim())
    && Boolean(leanEvidence.compilerOutput?.trim())
    && Boolean(leanEvidence.axiomReport?.trim())
    && !/sorryAx/i.test(leanEvidence.axiomReport ?? '');
}

export function validateSolutionCatalogManifest(manifest: SolutionCatalogManifest): CatalogValidationResult {
  const reasons = new Set<string>();
  const ids = new Set<string>();
  const modes = new Set<string>();

  for (const item of manifest.monoliths) {
    if (ids.has(item.id)) reasons.add('duplicate_monolith_id');
    ids.add(item.id);
    if (modes.has(item.calculator.mode)) reasons.add('duplicate_calculator_mode');
    modes.add(item.calculator.mode);
    if (!ALLOWED_MODES.has(item.calculator.mode)) reasons.add('mode_not_allowlisted');
    if (item.sourceEvidence.source.commit !== manifest.sourceRepositoryCommit) reasons.add('source_commit_mismatch');
    if (!SHA_256.test(item.sourceEvidence.source.contentHash)) reasons.add('source_hash_required');
    if (!SHA_256.test(item.sourceEvidence.derivationHistoryHash)) reasons.add('derivation_history_hash_required');
    if (!SHA_256.test(item.calculator.presetHash)) reasons.add('preset_hash_required');
    if (!item.sourceEvidence.semanticIndexExpression.trim()) reasons.add('semantic_index_required');
    if (!item.example.expectedStructuralResult.trim()) reasons.add('example_result_required');
    if (item.example.orderedRuleTrace.length === 0) reasons.add('rule_trace_required');
    if (!item.visualization.altText.trim()) reasons.add('visualization_alt_text_required');
    if (!item.visualization.description.trim()) reasons.add('visualization_description_required');
  }

  for (const relationItem of manifest.relations) {
    if (!relationItem.sourceRationale.trim()) reasons.add('relation_rationale_required');
    if (!SHA_256.test(relationItem.rationaleHash)) reasons.add('relation_rationale_hash_required');
    if (/keyword\s+match|fuzzy|title\s+match/i.test(relationItem.sourceRationale)) reasons.add('relation_requires_explicit_owner_rationale');
    if (!ids.has(relationItem.fromMonolithId)) reasons.add('relation_endpoint_unknown');
    if (relationItem.kind === 'SOLVED_HIERARCHY' && (!relationItem.toMonolithId || !ids.has(relationItem.toMonolithId))) reasons.add('relation_endpoint_unknown');
    if (relationItem.kind === 'GROUNDS_DEPENDENT_TASK' && !relationItem.dependentNodeId?.trim()) reasons.add('relation_endpoint_unknown');
  }

  for (const binding of manifest.existingNodeBindings) {
    if (!ids.has(binding.monolithId) || !binding.nodeId.trim()) reasons.add('binding_endpoint_unknown');
  }

  return reasons.size === 0
    ? { kind: 'VALID', reasons: [] }
    : { kind: 'REJECTED', reasons: [...reasons].sort() };
}

export function presentGreenMonolith(input: {
  readonly solution?: SolutionMonolithDefinition;
  readonly leanEvidence: LeanEvidenceInput;
  readonly nodeState: NodeState;
}): GreenMonolithPresentation {
  const sourceSolvedVisible = input.solution?.sourceEvidence.kind === 'RICIS_SOURCE_SOLVED';
  const leanVerifiedVisible = isCompleteLeanVerification(input.leanEvidence);
  const basis: GreenBasis = sourceSolvedVisible && leanVerifiedVisible
    ? 'RICIS_SOURCE_AND_LEAN_KERNEL_VERIFIED'
    : sourceSolvedVisible
      ? 'RICIS_SOURCE_SOLVED'
      : leanVerifiedVisible
        ? 'LEAN_KERNEL_VERIFIED'
        : 'NONE';

  const labels = [
    ...(sourceSolvedVisible ? ['RICIS III solved'] : []),
    ...(leanVerifiedVisible ? ['Lean kernel verified'] : []),
  ];

  return {
    basis,
    color: basis === 'NONE' ? null : '#22c55e',
    sourceSolvedVisible,
    leanVerifiedVisible,
    resolvedNodeStatePreserved: input.nodeState === input.nodeState,
    evidenceLabels: Object.freeze(labels),
  };
}

export function presentMapNodeVisualStatus(input: {
  readonly nodeId: string;
  readonly nodeState: NodeState;
  readonly proof?: Readonly<Proof>;
  readonly hasSorry: boolean;
  readonly isDerivative: boolean;
  readonly isOnPath: boolean;
  readonly isLocked: boolean;
}): MapNodeVisualStatus {
  const solution = getSolutionForNodeId(input.nodeId);
  const green = presentGreenMonolith({
    solution,
    leanEvidence: leanEvidenceFromProof(input.proof),
    nodeState: input.nodeState,
  });

  if (input.isOnPath) {
    return {
      sphereColor: input.isLocked ? '#94a3b8' : '#22d3ee',
      greenBasis: green.basis,
      ariaLabelSuffix: 'navigation path highlighted',
      greenByCatalog: green.basis !== 'NONE',
    };
  }
  if (input.isDerivative) {
    return {
      sphereColor: '#a855f7',
      greenBasis: green.basis,
      ariaLabelSuffix: 'derivative claim',
      greenByCatalog: green.basis !== 'NONE',
    };
  }
  if (!input.hasSorry && green.color === '#22c55e') {
    return {
      sphereColor: '#22c55e',
      greenBasis: green.basis,
      ariaLabelSuffix: green.evidenceLabels.join(', '),
      greenByCatalog: true,
    };
  }
  if (input.nodeState === 'resolved' && !input.hasSorry) {
    return { sphereColor: '#22c55e', greenBasis: 'NONE', ariaLabelSuffix: 'resolved state', greenByCatalog: false };
  }
  if (input.nodeState === 'partial' || input.hasSorry) {
    return { sphereColor: '#eab308', greenBasis: 'NONE', ariaLabelSuffix: 'partial state', greenByCatalog: false };
  }
  if (input.isLocked) {
    return { sphereColor: '#6b7280', greenBasis: 'NONE', ariaLabelSuffix: 'locked state', greenByCatalog: false };
  }
  return { sphereColor: '#ef4444', greenBasis: 'NONE', ariaLabelSuffix: 'unresolved state', greenByCatalog: false };
}

export function projectSolutionRelations(input: {
  readonly manifest: SolutionCatalogManifest;
  readonly existingNodeIds: readonly string[];
}): readonly SolutionRelationDefinition[] {
  const validation = validateSolutionCatalogManifest(input.manifest);
  if (validation.kind === 'REJECTED') return Object.freeze([]);
  const existing = new Set(input.existingNodeIds);
  return Object.freeze(input.manifest.relations.filter(item => item.kind !== 'GROUNDS_DEPENDENT_TASK' || existing.has(item.dependentNodeId ?? '')));
}

export function buildCalculatorLaunchLink(input: {
  readonly baseUrl?: string;
  readonly definition: SolutionMonolithDefinition;
}): CalculatorLaunchResult {
  if (!input.baseUrl?.trim() || input.baseUrl.trim() === 'about:blank') return { kind: 'UNCONFIGURED', reason: 'calculator_base_url_missing' };
  let baseUrl: URL;
  try {
    baseUrl = new URL(input.baseUrl);
  } catch {
    return { kind: 'REJECTED', reason: 'invalid_base_url' };
  }
  if (baseUrl.protocol !== 'https:') return { kind: 'REJECTED', reason: 'invalid_base_url' };
  if (!ALLOWED_MODES.has(input.definition.calculator.mode)) return { kind: 'REJECTED', reason: 'mode_not_allowlisted' };
  if (!SHA_256.test(input.definition.calculator.presetHash)) return { kind: 'REJECTED', reason: 'preset_not_static' };

  const orderedPreset = Object.fromEntries(Object.entries(input.definition.calculator.preset).sort(([left], [right]) => left.localeCompare(right)));
  baseUrl.search = '';
  baseUrl.searchParams.set('mode', input.definition.calculator.mode);
  baseUrl.searchParams.set('state', JSON.stringify(orderedPreset));
  return { kind: 'READY', href: baseUrl.toString() };
}

export function toSolutionMonolithCardView(input: {
  readonly solution?: SolutionMonolithDefinition;
  readonly relations: readonly SolutionRelationDefinition[];
  readonly green: GreenMonolithPresentation;
  readonly leanEvidence: LeanEvidenceInput;
  readonly launch: CalculatorLaunchResult;
}): SolutionMonolithCardView {
  const sourceAvailable = input.solution !== undefined;
  const leanEvidenceAvailable = isCompleteLeanVerification(input.leanEvidence);
  return {
    green: input.green,
    source: input.solution?.sourceEvidence.source,
    solution: input.solution,
    example: input.solution?.example,
    visualization: input.solution?.visualization,
    proofDisclosure: {
      summary: sourceAvailable
        ? 'Source-bound RICIS III case disclosure. Review the immutable calculator source and the ordered case trace below.'
        : leanEvidenceAvailable
          ? 'Lean kernel verification evidence is available for this task.'
          : 'No source-bound proof disclosure is available for this task.',
      steps: input.solution?.example.orderedRuleTrace ?? [],
      sourceAvailable,
      leanEvidenceAvailable,
    },
    relations: Object.freeze([...input.relations]),
    launch: input.launch,
  };
}

export function getSolutionForNodeId(nodeId: string): SolutionMonolithDefinition | undefined {
  const binding = EXISTING_NODE_BINDINGS.find(item => item.nodeId === nodeId);
  return binding ? INITIAL_CALCULATOR_MONOLITHS.find(item => item.id === binding.monolithId) : undefined;
}

export function leanEvidenceFromProof(proof?: Readonly<Proof>): LeanEvidenceInput {
  const externalLean = proof?.externalLean;
  if (!externalLean) return { trustStatus: 'ABSENT' };
  const evidence = externalLean.kernelEvidence;
  return {
    trustStatus: externalLean.trustStatus,
    sourceHash: externalLean.sourceHash,
    toolchain: evidence?.toolchain,
    command: evidence?.command,
    compilerOutput: evidence?.compilerOutput,
    axiomReport: evidence?.axiomReport,
  };
}
