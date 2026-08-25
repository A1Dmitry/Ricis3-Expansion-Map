type Fingerprint = `sha256:v1:${string}`;

type AdvisoryKind = 'RICIS_ASSESSMENT' | 'NON_APPLICABLE' | 'REQUIRES_CORE_OR_LEAN';
type RuleOutcome = 'APPLIED' | 'NOT_APPLICABLE' | 'BLOCKED';
type Rule =
  | 'L0'
  | 'L1'
  | 'SP2'
  | 'LOCAL_STRUCTURAL_REDUCTION'
  | 'A1_OR_A4'
  | 'SP3'
  | 'SP4'
  | 'A5_OR_A6_OR_A7'
  | 'TYPE_AND_FRACTAL_CLOSURE';

type RejectionReason =
  | 'INVALID_SOURCE_BOUND_WITNESS'
  | 'RICIS_RULE_TRACE_INVALID'
  | 'FORBIDDEN_NON_RICIS_SEMANTIC'
  | 'ASSESSMENT_PREMISE_INCOMPLETE'
  | 'CONFLICT_VIEW_UNTRUSTED';

type UnavailableReason = 'UNAVAILABLE_READ_PORT';

interface StructuralWitness {
  readonly sourceFingerprint: Fingerprint;
  readonly witnessFingerprint: Fingerprint;
  readonly semanticType: string;
  readonly sourceKind: string;
  readonly certifiedSingularityKeys: readonly string[];
  readonly premises: Readonly<{ l0: boolean; l1: boolean; sp2: boolean; sp4: boolean }>;
}

interface RuleTraceStep {
  readonly rule: Rule;
  readonly outcome: RuleOutcome;
}

interface StructuralAdvisory {
  readonly kind: AdvisoryKind;
  readonly authority: 'NON_AUTHORITATIVE';
  readonly sourceFingerprint: Fingerprint;
  readonly witnessFingerprint: Fingerprint;
  readonly semanticType: string;
  readonly sourceKind: string;
  readonly certifiedSingularityKeys: readonly string[];
  readonly trace: readonly RuleTraceStep[];
}

type AdvisoryResult =
  | Readonly<{ kind: 'ADVISORY_READY'; advisory: StructuralAdvisory }>
  | Readonly<{ kind: 'ADVISORY_REJECTED'; reason: RejectionReason }>
  | Readonly<{ kind: 'ADVISORY_UNAVAILABLE'; sourceFingerprint: Fingerprint; witnessFingerprint: Fingerprint; reason: UnavailableReason }>
  | Readonly<{ kind: 'COMPETENCE_QUARANTINE_VIEW'; conflict: Readonly<{ advisoryFingerprint: Fingerprint; kernelFingerprint: Fingerprint; competenceState: 'TRAINING_REQUIRED'; effective: false }> }>;

const RULES: readonly Rule[] = Object.freeze([
  'L0',
  'L1',
  'SP2',
  'LOCAL_STRUCTURAL_REDUCTION',
  'A1_OR_A4',
  'SP3',
  'SP4',
  'A5_OR_A6_OR_A7',
  'TYPE_AND_FRACTAL_CLOSURE',
]);

const FINGERPRINT = /^sha256:v1:[a-f0-9]{64}$/;
const OUTCOMES: readonly RuleOutcome[] = Object.freeze(['APPLIED', 'NOT_APPLICABLE', 'BLOCKED']);
const ADVISORY_KINDS: readonly AdvisoryKind[] = Object.freeze(['RICIS_ASSESSMENT', 'NON_APPLICABLE', 'REQUIRES_CORE_OR_LEAN']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFingerprint(value: unknown): value is Fingerprint {
  return typeof value === 'string' && FINGERPRINT.test(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function rejected(reason: RejectionReason): AdvisoryResult {
  return Object.freeze({ kind: 'ADVISORY_REJECTED', reason });
}

function parseWitness(value: unknown): StructuralWitness | undefined {
  if (!isRecord(value) || !hasOnlyKeys(value, ['sourceFingerprint', 'witnessFingerprint', 'semanticType', 'sourceKind', 'certifiedSingularityKeys', 'premises'])) return undefined;
  if (!isFingerprint(value.sourceFingerprint) || !isFingerprint(value.witnessFingerprint) || typeof value.semanticType !== 'string' || value.semanticType.length === 0 || typeof value.sourceKind !== 'string' || value.sourceKind.length === 0 || !Array.isArray(value.certifiedSingularityKeys) || value.certifiedSingularityKeys.length === 0 || !value.certifiedSingularityKeys.every((key) => typeof key === 'string' && key.length > 0) || !isRecord(value.premises) || !hasOnlyKeys(value.premises, ['l0', 'l1', 'sp2', 'sp4']) || typeof value.premises.l0 !== 'boolean' || typeof value.premises.l1 !== 'boolean' || typeof value.premises.sp2 !== 'boolean' || typeof value.premises.sp4 !== 'boolean') return undefined;
  return Object.freeze({
    sourceFingerprint: value.sourceFingerprint,
    witnessFingerprint: value.witnessFingerprint,
    semanticType: value.semanticType,
    sourceKind: value.sourceKind,
    certifiedSingularityKeys: Object.freeze([...value.certifiedSingularityKeys]),
    premises: Object.freeze({ l0: value.premises.l0, l1: value.premises.l1, sp2: value.premises.sp2, sp4: value.premises.sp4 }),
  });
}

function parseTrace(value: unknown): readonly RuleTraceStep[] | undefined {
  if (!Array.isArray(value) || value.length !== RULES.length) return undefined;
  const trace: RuleTraceStep[] = [];
  for (let index = 0; index < RULES.length; index += 1) {
    const step = value[index];
    if (!isRecord(step) || !hasOnlyKeys(step, ['rule', 'outcome']) || step.rule !== RULES[index] || !OUTCOMES.includes(step.outcome as RuleOutcome)) return undefined;
    trace.push(Object.freeze({ rule: RULES[index], outcome: step.outcome as RuleOutcome }));
  }
  return Object.freeze(trace);
}

function hasForbiddenSemantic(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const serialised = JSON.stringify(value);
  return /limit|l['’]?hopital|\b0\/0\b|nan|classicalfallback|sorry|phase\s*\d|p\s*=\s*np|generic\s*(lean|a6)/i.test(serialised);
}

function isBlocked(trace: readonly RuleTraceStep[], rule: Rule): boolean {
  return trace.find((step) => step.rule === rule)?.outcome === 'BLOCKED';
}

function advisoryReady(witness: StructuralWitness, kind: AdvisoryKind, trace: readonly RuleTraceStep[]): AdvisoryResult {
  const advisory: StructuralAdvisory = Object.freeze({
    kind,
    authority: 'NON_AUTHORITATIVE',
    sourceFingerprint: witness.sourceFingerprint,
    witnessFingerprint: witness.witnessFingerprint,
    semanticType: witness.semanticType,
    sourceKind: witness.sourceKind,
    certifiedSingularityKeys: witness.certifiedSingularityKeys,
    trace,
  });
  return Object.freeze({ kind: 'ADVISORY_READY', advisory });
}

export function normalizeStructuralAdvisory(input: unknown): AdvisoryResult {
  if (!isRecord(input)) return rejected('INVALID_SOURCE_BOUND_WITNESS');
  if (hasForbiddenSemantic(input)) return rejected('FORBIDDEN_NON_RICIS_SEMANTIC');
  if (!hasOnlyKeys(input, ['witness', 'advisory'])) return rejected('INVALID_SOURCE_BOUND_WITNESS');
  const witness = parseWitness(input.witness);
  if (witness === undefined) return rejected('INVALID_SOURCE_BOUND_WITNESS');
  if (!isRecord(input.advisory) || !hasOnlyKeys(input.advisory, ['kind', 'authority', 'trace']) || !ADVISORY_KINDS.includes(input.advisory.kind as AdvisoryKind) || input.advisory.authority !== 'NON_AUTHORITATIVE') return rejected('INVALID_SOURCE_BOUND_WITNESS');
  const trace = parseTrace(input.advisory.trace);
  if (trace === undefined) return rejected('RICIS_RULE_TRACE_INVALID');
  const kind = input.advisory.kind as AdvisoryKind;
  const foundationsBlocked = !witness.premises.l0 || !witness.premises.l1 || !witness.premises.sp2 || !witness.premises.sp4 || isBlocked(trace, 'L0') || isBlocked(trace, 'L1') || isBlocked(trace, 'SP2') || isBlocked(trace, 'SP4');
  if (kind === 'RICIS_ASSESSMENT' && foundationsBlocked) return rejected('ASSESSMENT_PREMISE_INCOMPLETE');
  if (kind !== 'REQUIRES_CORE_OR_LEAN' && foundationsBlocked) return rejected('ASSESSMENT_PREMISE_INCOMPLETE');
  return advisoryReady(witness, kind, trace);
}

export function createUnavailableAdvisory(input: unknown): AdvisoryResult {
  if (!isRecord(input) || !isFingerprint(input.sourceFingerprint) || !isFingerprint(input.witnessFingerprint)) return rejected('INVALID_SOURCE_BOUND_WITNESS');
  return Object.freeze({ kind: 'ADVISORY_UNAVAILABLE', sourceFingerprint: input.sourceFingerprint, witnessFingerprint: input.witnessFingerprint, reason: 'UNAVAILABLE_READ_PORT' });
}

export function projectCompetenceConflict(input: unknown): AdvisoryResult {
  if (!isRecord(input) || !hasOnlyKeys(input, ['advisoryFingerprint', 'kernelFingerprint', 'competenceState', 'effective']) || !isFingerprint(input.advisoryFingerprint) || !isFingerprint(input.kernelFingerprint) || input.competenceState !== 'TRAINING_REQUIRED' || input.effective !== false) return rejected('CONFLICT_VIEW_UNTRUSTED');
  return Object.freeze({ kind: 'COMPETENCE_QUARANTINE_VIEW', conflict: Object.freeze({ advisoryFingerprint: input.advisoryFingerprint, kernelFingerprint: input.kernelFingerprint, competenceState: 'TRAINING_REQUIRED', effective: false }) });
}

export function inspectAgentRicisTopology(): Readonly<{ imports: readonly string[]; capabilities: readonly string[] }> {
  return Object.freeze({ imports: Object.freeze([]), capabilities: Object.freeze([]) });
}
