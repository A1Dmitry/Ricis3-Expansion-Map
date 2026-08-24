import type {
  ILocalAnalysisApplicationService,
  LocalAnalysisCommand,
  LocalAnalysisResult,
  LocalExpressionNode,
  LocalSemanticIndexEntry,
  SourceExpression,
} from '../localRicisAnalyzer/contracts';
import type { CoreExecutionFailure } from '../ricisCore/IRicisCoreEngine';

export type StructuralTypeTag = 'scalar' | 'vector' | 'matrix';
export type StructuralOrigin = 'ANALYZER_AST' | 'DERIVED_RICIS_RULE';
export type StructuralOperator = 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE' | 'NEGATE';

export interface StructuralSourceReference {
  readonly sourceHash: string;
  readonly sourceCanonical: string;
  readonly sourceSpan: {
    readonly start: number;
    readonly endExclusive: number;
  };
  readonly origin: StructuralOrigin;
}

export interface StructuralIdentity {
  readonly structuralHash: string;
  readonly canonical: string;
  readonly typeTag: StructuralTypeTag;
  readonly source: StructuralSourceReference;
}

export interface FiniteStructuralKey {
  readonly key: string;
  readonly kind: 'ZERO_ORIGIN' | 'INFINITY_ORIGIN' | 'FACTOR' | 'RATIO';
  readonly sourceHash: string;
  readonly sourceCanonical: string;
}

export interface StructuralIndex {
  readonly basis: 'SP4_SOURCE_EXPRESSION';
  readonly payloadHash: string;
  readonly payloadCanonical: string;
  readonly payloadTypeTag: StructuralTypeTag;
  readonly sourceHash: string;
  readonly semanticKeys: readonly FiniteStructuralKey[];
}

interface StructuralExpressionBase {
  readonly identity: StructuralIdentity;
  readonly semanticKeys: readonly FiniteStructuralKey[];
}

export interface StructuralIdentifier extends StructuralExpressionBase {
  readonly kind: 'IDENTIFIER';
  readonly name: string;
}

export interface StructuralFiniteLiteral extends StructuralExpressionBase {
  readonly kind: 'FINITE_LITERAL';
  readonly lexeme: string;
}

export interface StructuralUnaryExpression extends StructuralExpressionBase {
  readonly kind: 'UNARY';
  readonly operator: Extract<StructuralOperator, 'NEGATE'>;
  readonly operand: StructuralExpression;
}

export interface StructuralBinaryExpression extends StructuralExpressionBase {
  readonly kind: 'BINARY';
  readonly operator: Exclude<StructuralOperator, 'NEGATE'>;
  readonly left: StructuralExpression;
  readonly right: StructuralExpression;
}

export interface StructuralIndexedZero extends StructuralExpressionBase {
  readonly kind: 'INDEXED_ZERO';
  readonly payload: StructuralExpression;
  readonly index: StructuralIndex;
}

export interface StructuralIndexedInfinity extends StructuralExpressionBase {
  readonly kind: 'INDEXED_INFINITY';
  readonly payload: StructuralExpression;
  readonly index: StructuralIndex;
}

export type StructuralExpression =
  | StructuralIdentifier
  | StructuralFiniteLiteral
  | StructuralUnaryExpression
  | StructuralBinaryExpression
  | StructuralIndexedZero
  | StructuralIndexedInfinity;

export type LocalStructuralRule =
  | 'L0_PAYLOAD_PRESERVATION'
  | 'L1_IDENTICAL_DIVISION'
  | 'SP2_DIVIDE_BY_UNIT'
  | 'SP2_EXACT_FACTOR_CANCELLATION'
  | 'SP2_ASSOCIATIVE_FACTOR_CANCELLATION'
  | 'A10_FINITE_TIMES_ZERO'
  | 'A1_FINITE_OVER_ZERO'
  | 'A4_INDEXED_ZERO_OVER_INDEXED_ZERO'
  | 'A5_INDEXED_INFINITY_OVER_INDEXED_INFINITY'
  | 'A6_ZERO_TIMES_INFINITY_DEFERRED'
  | 'A7_INFINITY_MINUS_INFINITY_DEFERRED'
  | 'SP3_EXACT_TYPE_AND_FINITE_KEY_CHECK'
  | 'SP4_SOURCE_EXPRESSION_INDEX';

export type LocalStructuralPhase =
  | 'L0'
  | 'L1'
  | 'SP2'
  | 'LOCAL_O1'
  | 'A1_A4_A10'
  | 'SP3'
  | 'SP4'
  | 'ALGEBRAIC_CLEANUP'
  | 'NON_DECISION';

export type StructuralPrecondition =
  | 'SOURCE_HASH_PRESERVED'
  | 'PAYLOAD_CHILDREN_REDUCED'
  | 'EXACT_TYPE_EQUALITY'
  | 'EXACT_STRUCTURAL_IDENTITY'
  | 'FINITE_SEMANTIC_KEYS'
  | 'SP4_SOURCE_INDEX_AVAILABLE'
  | 'NO_DEFERRED_TYPE_PROTOCOL';

export type StructuralRuleAuthority =
  | 'RICIS_III_EXPLICIT'
  | 'INHERITED_CLASSICAL_STRUCTURAL_ALGEBRA_GEOMETRY';

export interface StructuralDerivationStep {
  readonly sequence: number;
  readonly phase: LocalStructuralPhase;
  readonly rule: LocalStructuralRule;
  readonly authority: StructuralRuleAuthority;
  readonly outcome: 'APPLIED' | 'NOT_APPLICABLE' | 'DEFERRED';
  readonly inputHash: string;
  readonly outputHash: string;
  readonly prerequisites: readonly StructuralPrecondition[];
  readonly rationaleCode: string;
}

export interface LocalStructuralProvenance {
  readonly producer: 'LOCAL_TYPED_STRUCTURAL_REDUCER';
  readonly sourceHash: string;
  readonly analysisContractVersion: 'v1';
  readonly reducerContractVersion: 'v1';
  readonly localOnly: true;
  readonly coreResultCreated: false;
  readonly leanEvidenceCreated: false;
  readonly proofCreated: false;
  readonly trustStateChanged: false;
}

export type LocalStructuralNonApplicabilityReason =
  | 'ANALYZER_INPUT_REJECTED'
  | 'ANALYZER_AST_MISSING'
  | 'LABEL_ONLY_INDEXED_OPERAND'
  | 'UNSUPPORTED_SYNTAX_OR_NODE'
  | 'TYPE_TAG_UNSUPPORTED'
  | 'TYPE_TAG_MISMATCH'
  | 'SEMANTIC_KEY_INVALID'
  | 'STRUCTURAL_LIMIT_REACHED';

export type LocalStructuralExternalRequirement =
  | 'A5_INFINITY_OVER_INFINITY_DEFERRED'
  | 'A6_ZERO_TIMES_INFINITY_DEFERRED'
  | 'A7_INFINITY_MINUS_INFINITY_DEFERRED'
  | 'TYPE_PROMOTION_OR_COMPOSITE_DEFERRED'
  | 'UNSUPPORTED_RICIS_OPERATION';

export interface LocalStructuralAssessment {
  readonly status: 'LOCAL_STRUCTURAL_ASSESSMENT';
  readonly source: SourceExpression;
  readonly input: StructuralExpression;
  readonly reduced: StructuralExpression;
  readonly derivation: readonly StructuralDerivationStep[];
  readonly provenance: LocalStructuralProvenance;
}

export interface LocalStructuralNonApplicable {
  readonly status: 'NON_APPLICABLE';
  readonly source: SourceExpression;
  readonly reason: LocalStructuralNonApplicabilityReason;
  readonly derivation: readonly StructuralDerivationStep[];
  readonly provenance: LocalStructuralProvenance;
}

export interface LocalStructuralRequiresCoreOrLean {
  readonly status: 'REQUIRES_CORE_OR_LEAN';
  readonly source: SourceExpression;
  readonly requirement: LocalStructuralExternalRequirement;
  readonly preservedExpression: StructuralExpression;
  readonly derivation: readonly StructuralDerivationStep[];
  readonly provenance: LocalStructuralProvenance;
}

export interface LocalStructuralNotAdmitted {
  readonly status: 'NOT_ADMITTED';
  readonly correlationId: string;
  readonly reason: 'CORE_RECOVERY_NOT_ADMITTED';
  readonly provenance: Omit<LocalStructuralProvenance, 'sourceHash'> & {
    readonly sourceHash: 'not-admitted';
  };
}

export type LocalStructuralReductionResult =
  | LocalStructuralAssessment
  | LocalStructuralNonApplicable
  | LocalStructuralRequiresCoreOrLean
  | LocalStructuralNotAdmitted;

export interface LocalStructuralReducerLimits {
  readonly maxStructuralDepth: number;
  readonly maxDerivationSteps: number;
  readonly maxSemanticKeysPerExpression: number;
  readonly maxFactorsPerProduct: number;
}

export interface StructuralMappingInput {
  readonly source: SourceExpression;
  readonly ast: LocalExpressionNode;
  readonly semanticIndex: readonly LocalSemanticIndexEntry[];
}

export type StructuralMappingResult =
  | {
    readonly status: 'MAPPED';
    readonly expression: StructuralExpression;
  }
  | {
    readonly status: 'NON_APPLICABLE';
    readonly reason: Extract<
      LocalStructuralNonApplicabilityReason,
      'LABEL_ONLY_INDEXED_OPERAND' | 'UNSUPPORTED_SYNTAX_OR_NODE' | 'TYPE_TAG_UNSUPPORTED' | 'SEMANTIC_KEY_INVALID' | 'STRUCTURAL_LIMIT_REACHED'
    >;
  };

export interface StructuralReductionRequest {
  readonly source: SourceExpression;
  readonly input: StructuralExpression;
}

export interface IStructuralExpressionMapper {
  map(input: StructuralMappingInput): StructuralMappingResult;
}

export interface ILocalStructuralReducer {
  reduce(input: StructuralReductionRequest): LocalStructuralReductionResult;
}

export interface IStructuralReductionAdmissionPolicy {
  permits(failure: CoreExecutionFailure, origin: 'explicit_user_action'): boolean;
}

export interface LocalStructuralReductionCommand extends Pick<LocalAnalysisCommand,
  'rawText' | 'requestedLocale' | 'correlationId'> {
  readonly origin: 'explicit_user_action';
  readonly coreRecovery: CoreExecutionFailure;
}

export interface ILocalStructuralReductionApplicationService {
  reduceExplicitly(
    command: LocalStructuralReductionCommand,
    cancellation: AbortSignal,
  ): Promise<LocalStructuralReductionResult>;
}

export interface LocalStructuralReducerDependencies {
  readonly analysisApplication: ILocalAnalysisApplicationService;
  readonly mapper: IStructuralExpressionMapper;
  readonly reducer: ILocalStructuralReducer;
  readonly admissionPolicy: IStructuralReductionAdmissionPolicy;
  readonly limits: LocalStructuralReducerLimits;
}

export type LocalStructuralAnalysisInput = Pick<LocalAnalysisResult,
  'source' | 'ast' | 'semanticIndex' | 'status' | 'provenance'>;
