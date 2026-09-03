import {
  StructuralExpression,
  StructuralIndexedZero,
  StructuralIndexedInfinity,
} from './contracts';
import {
  ITypeConsistencyValidator,
  ISemanticIndexValidator,
  ISingularityRule,
  RuleApplicationResult,
} from './oopContracts';
import { HOMOGENEOUS_SCALAR_PRECONDITIONS } from './a6A7Homogeneous';

export class A6HomogeneousScalarProductRule implements ISingularityRule {
  readonly ruleName = 'A6_HOMOGENEOUS_SCALAR_PRODUCT';
  readonly phase = 'A1_A4_A10';
  readonly authority = 'RICIS_III_EXPLICIT';

  evaluate(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): RuleApplicationResult {
    if (expression.kind !== 'BINARY' || expression.operator !== 'MULTIPLY') {
      return { status: 'NOT_APPLICABLE', reason: 'Must be multiplication' };
    }

    const isZero = (e: StructuralExpression): e is StructuralIndexedZero => e.kind === 'INDEXED_ZERO';
    const isInf = (e: StructuralExpression): e is StructuralIndexedInfinity => e.kind === 'INDEXED_INFINITY';

    const zero = isZero(expression.left)
      ? expression.left
      : isZero(expression.right)
        ? expression.right
        : undefined;

    const infinity = isInf(expression.left)
      ? expression.left
      : isInf(expression.right)
        ? expression.right
        : undefined;

    if (!zero || !infinity) {
      return { status: 'NOT_APPLICABLE', reason: 'Requires INDEXED_ZERO and INDEXED_INFINITY' };
    }

    if (!indexValidator.isIndexMatching(zero.index, zero.payload) || !indexValidator.isIndexMatching(infinity.index, infinity.payload)) {
      return { status: 'DEFERRED', reason: 'SP4_SOURCE_MISMATCH' };
    }

    if (!indexValidator.hasValidFiniteKeys(zero.payload) || !indexValidator.hasValidFiniteKeys(infinity.payload)) {
      return { status: 'DEFERRED', reason: 'INVALID_FINITE_KEYS' };
    }

    const compatibility = typeValidator.checkCompatibility(zero.payload.identity.typeTag, infinity.payload.identity.typeTag);
    if (compatibility.requiresCompositeDeferral) {
      return { status: 'DEFERRED', reason: 'TCP_COMPOSITE_REQUIRED' };
    }

    const canonical = `${zero.payload.identity.canonical} * ${infinity.payload.identity.canonical}`;
    const reduced: StructuralExpression = {
      kind: 'BINARY',
      operator: 'MULTIPLY',
      left: zero.payload,
      right: infinity.payload,
      identity: {
        structuralHash: `a6:${zero.payload.identity.structuralHash}:${infinity.payload.identity.structuralHash}`,
        canonical,
        typeTag: 'scalar',
        source: {
          sourceHash: zero.identity.source.sourceHash,
          sourceCanonical: canonical,
          sourceSpan: { start: 0, endExclusive: canonical.length },
          origin: 'DERIVED_RICIS_RULE'
        }
      },
      semanticKeys: [...zero.payload.semanticKeys, ...infinity.payload.semanticKeys]
    };

    return {
      status: 'APPLIED',
      reduced,
      preconditions: [...HOMOGENEOUS_SCALAR_PRECONDITIONS],
      rule: this.ruleName,
      phase: this.phase
    };
  }
}

