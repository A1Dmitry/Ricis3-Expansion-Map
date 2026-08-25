import type {
  FiniteStructuralKey,
  StructuralExpression,
  StructuralIndex,
} from './contracts';

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

function hasFiniteKey(key: FiniteStructuralKey): boolean {
  return key.key.length > 0 && key.key.length <= 512 &&
    key.sourceHash.length > 0 && key.sourceCanonical.length > 0;
}

function hasFiniteKeys(expression: StructuralExpression): boolean {
  if (expression.semanticKeys.length === 0 || !expression.semanticKeys.every(hasFiniteKey)) return false;
  switch (expression.kind) {
    case 'UNARY':
      return hasFiniteKeys(expression.operand);
    case 'BINARY':
      return hasFiniteKeys(expression.left) && hasFiniteKeys(expression.right);
    case 'INDEXED_ZERO':
    case 'INDEXED_INFINITY':
      return expression.index.semanticKeys.length > 0 &&
        expression.index.semanticKeys.every(hasFiniteKey) && hasFiniteKeys(expression.payload);
    default:
      return true;
  }
}

function hasSourceExpressionIndex(operand: IndexedOperand): boolean {
  const { index, payload } = operand;
  return index.basis === 'SP4_SOURCE_EXPRESSION' &&
    hasMatchingIndex(index, payload);
}

function hasMatchingIndex(index: StructuralIndex, payload: StructuralExpression): boolean {
  return index.payloadHash === payload.identity.structuralHash &&
    index.payloadCanonical === payload.identity.canonical &&
    index.payloadTypeTag === payload.identity.typeTag &&
    index.sourceHash === payload.identity.source.sourceHash;
}

function isIndexed(expression: StructuralExpression, kind: IndexedOperand['kind']): expression is IndexedOperand {
  return expression.kind === kind;
}

function needsTypeCompositeDeferral(left: IndexedOperand, right: IndexedOperand): boolean {
  return left.payload.identity.typeTag !== 'scalar' || right.payload.identity.typeTag !== 'scalar';
}

function validateIndexedPair(left: IndexedOperand, right: IndexedOperand): HomogeneousScalarPlan | undefined {
  if (needsTypeCompositeDeferral(left, right)) {
    return freeze({ status: 'DEFER_TYPE_COMPOSITE', reason: 'TYPE_PROMOTION_OR_COMPOSITE_DEFERRED' });
  }
  if (!hasSourceExpressionIndex(left) || !hasSourceExpressionIndex(right)) {
    return freeze({ status: 'NOT_APPLICABLE', reason: 'SP4_INDEX_INVALID' });
  }
  if (!hasFiniteKeys(left.payload) || !hasFiniteKeys(right.payload)) {
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
