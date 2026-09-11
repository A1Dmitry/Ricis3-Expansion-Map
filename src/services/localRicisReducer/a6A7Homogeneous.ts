import type {
  FiniteStructuralKey,
  StructuralExpression,
  StructuralIndex,
} from './contracts';
import { TypeConsistencyValidator, SemanticIndexValidator } from './oopImplementation';

export const HOMOGENEOUS_SCALAR_PRECONDITIONS = Object.freeze([
  'PAYLOAD_CHILDREN_REDUCED',
  'EXACT_TYPE_EQUALITY',
  'FINITE_SEMANTIC_KEYS',
  'SP4_SOURCE_INDEX_AVAILABLE',
] as const);

type HomogeneousScalarPrecondition = typeof HOMOGENEOUS_SCALAR_PRECONDITIONS[number];

type HomogeneousScalarPlan =
  | {
    readonly status: 'APPLY_A6';
    readonly zeroPayload: StructuralExpression;
    readonly infinityPayload: StructuralExpression;
    readonly typeTag: 'scalar';
    readonly preconditions: readonly HomogeneousScalarPrecondition[];
  }
  | {
    readonly status: 'APPLY_A7';
    readonly leftPayload: StructuralExpression;
    readonly rightPayload: StructuralExpression;
    readonly typeTag: 'scalar';
    readonly preconditions: readonly HomogeneousScalarPrecondition[];
  }
  | {
    readonly status: 'DEFER_TYPE_COMPOSITE';
    readonly reason: 'TYPE_PROMOTION_OR_COMPOSITE_DEFERRED';
  }
  | {
    readonly status: 'NOT_APPLICABLE';
    readonly reason: 'UNSUPPORTED_SHAPE' | 'SP4_INDEX_INVALID' | 'SEMANTIC_KEYS_INVALID';
  };

type IndexedOperand = Extract<StructuralExpression, {
  readonly kind: 'INDEXED_ZERO' | 'INDEXED_INFINITY';
}>;

function freeze<T>(value: T): T {
  return Object.freeze(value);
}

const semanticValidator = new SemanticIndexValidator();
const typeValidator = new TypeConsistencyValidator();

function hasSourceExpressionIndex(operand: IndexedOperand): boolean {
  const { index, payload } = operand;
  return index.basis === 'SP4_SOURCE_EXPRESSION' &&
    semanticValidator.isIndexMatching(index, payload);
}

function isIndexed(expression: StructuralExpression, kind: IndexedOperand['kind']): expression is IndexedOperand {
  return expression.kind === kind;
}

function needsTypeCompositeDeferral(left: IndexedOperand, right: IndexedOperand): boolean {
  return typeValidator.checkCompatibility(left.payload.identity.typeTag, right.payload.identity.typeTag).requiresCompositeDeferral;
}

function validateIndexedPair(left: IndexedOperand, right: IndexedOperand): HomogeneousScalarPlan | undefined {
  if (needsTypeCompositeDeferral(left, right)) {
    return freeze({ status: 'DEFER_TYPE_COMPOSITE', reason: 'TYPE_PROMOTION_OR_COMPOSITE_DEFERRED' });
  }
  if (!hasSourceExpressionIndex(left) || !hasSourceExpressionIndex(right)) {
    return freeze({ status: 'NOT_APPLICABLE', reason: 'SP4_INDEX_INVALID' });
  }
  if (!semanticValidator.hasValidFiniteKeys(left.payload) || !semanticValidator.hasValidFiniteKeys(right.payload)) {
    return freeze({ status: 'NOT_APPLICABLE', reason: 'SEMANTIC_KEYS_INVALID' });
  }
  return undefined;
}

export function planHomogeneousScalarA6A7(input: StructuralExpression): HomogeneousScalarPlan {
  if (input.kind === 'BINARY' && input.operator === 'MULTIPLY') {
    const zero = isIndexed(input.left, 'INDEXED_ZERO')
      ? input.left
      : isIndexed(input.right, 'INDEXED_ZERO')
        ? input.right
        : undefined;
    const infinity = isIndexed(input.left, 'INDEXED_INFINITY')
      ? input.left
      : isIndexed(input.right, 'INDEXED_INFINITY')
        ? input.right
        : undefined;
    if (zero && infinity) {
      const validation = validateIndexedPair(zero, infinity);
      if (validation) return validation;
      return freeze({
        status: 'APPLY_A6',
        zeroPayload: zero.payload,
        infinityPayload: infinity.payload,
        typeTag: 'scalar',
        preconditions: HOMOGENEOUS_SCALAR_PRECONDITIONS,
      });
    }
  }

  if (input.kind === 'BINARY' && input.operator === 'SUBTRACT' &&
    isIndexed(input.left, 'INDEXED_INFINITY') && isIndexed(input.right, 'INDEXED_INFINITY')) {
    const validation = validateIndexedPair(input.left, input.right);
    if (validation) return validation;
    return freeze({
      status: 'APPLY_A7',
      leftPayload: input.left.payload,
      rightPayload: input.right.payload,
      typeTag: 'scalar',
      preconditions: HOMOGENEOUS_SCALAR_PRECONDITIONS,
    });
  }

  return freeze({ status: 'NOT_APPLICABLE', reason: 'UNSUPPORTED_SHAPE' });
}
