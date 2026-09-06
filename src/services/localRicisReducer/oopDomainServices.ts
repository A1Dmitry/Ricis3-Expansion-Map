import type {
  StructuralBinaryExpression,
  StructuralExpression,
  StructuralIndexedInfinity,
  StructuralIndexedZero,
  StructuralSourceReference,
  StructuralIndex,
} from './contracts';
import type {
  A6OperandPair,
  A7OperandPair,
  ISingularityOperandExtractor,
  ISingularityPairValidator,
  IStructuralExpressionFactory,
  IStructuralEqualityService,
  SingularityPairValidationResult,
  ITypeConsistencyValidator,
  ISemanticIndexValidator,
} from './oopContracts';
import { HOMOGENEOUS_SCALAR_PRECONDITIONS } from './a6A7Homogeneous';

/**
 * Доменный сервис извлечения операндов из бинарных выражений (DRY).
 */
export class SingularityOperandExtractor implements ISingularityOperandExtractor {
  extractA6Pair(expression: StructuralBinaryExpression): A6OperandPair | undefined {
    if (expression.kind !== 'BINARY' || expression.operator !== 'MULTIPLY') {
      return undefined;
    }

    const isZero = (e: StructuralExpression): e is StructuralIndexedZero => e?.kind === 'INDEXED_ZERO';
    const isInf = (e: StructuralExpression): e is StructuralIndexedInfinity => e?.kind === 'INDEXED_INFINITY';

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

    if (zero && infinity) {
      return { zero, infinity };
    }
    return undefined;
  }

  extractA7Pair(expression: StructuralBinaryExpression): A7OperandPair | undefined {
    if (expression.kind !== 'BINARY' || expression.operator !== 'SUBTRACT') {
      return undefined;
    }

    if (expression.left?.kind === 'INDEXED_INFINITY' && expression.right?.kind === 'INDEXED_INFINITY') {
      return {
        leftInfinity: expression.left as StructuralIndexedInfinity,
        rightInfinity: expression.right as StructuralIndexedInfinity,
      };
    }
    return undefined;
  }
}

/**
 * Доменный сервис валидации пары сингулярных операндов (DRY + TCP).
 */
export class SingularityPairValidator implements ISingularityPairValidator {
  validateA6Pair(
    pair: A6OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult {
    const { zero, infinity } = pair;

    if (zero.payload && infinity.payload) {
      const leftTag = zero.payload.identity?.typeTag ?? 'scalar';
      const rightTag = infinity.payload.identity?.typeTag ?? 'scalar';
      const compatibility = typeValidator.checkCompatibility(leftTag, rightTag);
      if (compatibility.requiresCompositeDeferral) {
        return { isValid: false, status: 'DEFERRED', reason: 'TCP_COMPOSITE_REQUIRED' };
      }

      if (zero.index && !indexValidator.isIndexMatching(zero.index, zero.payload)) {
        return { isValid: false, status: 'DEFERRED', reason: 'SP4_SOURCE_MISMATCH' };
      }
      if (infinity.index && !indexValidator.isIndexMatching(infinity.index, infinity.payload)) {
        return { isValid: false, status: 'DEFERRED', reason: 'SP4_SOURCE_MISMATCH' };
      }

      if (!indexValidator.hasValidFiniteKeys(zero.payload) || !indexValidator.hasValidFiniteKeys(infinity.payload)) {
        return { isValid: false, status: 'DEFERRED', reason: 'INVALID_FINITE_KEYS' };
      }
    }

    return {
      isValid: true,
      preconditions: [...HOMOGENEOUS_SCALAR_PRECONDITIONS],
    };
  }

  validateA7Pair(
    pair: A7OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult {
    const { leftInfinity, rightInfinity } = pair;

    if (leftInfinity.payload && rightInfinity.payload) {
      const leftTag = leftInfinity.payload.identity?.typeTag ?? 'scalar';
      const rightTag = rightInfinity.payload.identity?.typeTag ?? 'scalar';
      const compatibility = typeValidator.checkCompatibility(leftTag, rightTag);
      if (compatibility.requiresCompositeDeferral) {
        return { isValid: false, status: 'DEFERRED', reason: 'TCP_COMPOSITE_REQUIRED' };
      }

      if (leftInfinity.index && !indexValidator.isIndexMatching(leftInfinity.index, leftInfinity.payload)) {
        return { isValid: false, status: 'DEFERRED', reason: 'SP4_SOURCE_MISMATCH' };
      }
      if (rightInfinity.index && !indexValidator.isIndexMatching(rightInfinity.index, rightInfinity.payload)) {
        return { isValid: false, status: 'DEFERRED', reason: 'SP4_SOURCE_MISMATCH' };
      }

      if (!indexValidator.hasValidFiniteKeys(leftInfinity.payload) || !indexValidator.hasValidFiniteKeys(rightInfinity.payload)) {
        return { isValid: false, status: 'DEFERRED', reason: 'INVALID_FINITE_KEYS' };
      }
    }

    return {
      isValid: true,
      preconditions: [...HOMOGENEOUS_SCALAR_PRECONDITIONS],
    };
  }
}

/**
 * Доменная фабрика для создания редуцированных выражений без моков (L1 / L1C1).
 */
export class StructuralExpressionFactory implements IStructuralExpressionFactory {
  createA6Product(
    zeroPayload: StructuralExpression,
    infinityPayload: StructuralExpression,
    sourceRef: StructuralSourceReference
  ): StructuralExpression {
    const needsParens = (expr: StructuralExpression): boolean => {
      if (expr.kind === 'BINARY') return true;
      const canon = expr.identity.canonical.trim();
      if (canon.startsWith('(') && canon.endsWith(')')) return false;
      return /[+\-*/]|\s/.test(canon);
    };

    const leftCanon = needsParens(zeroPayload)
      ? `(${zeroPayload.identity.canonical})`
      : zeroPayload.identity.canonical;
    const rightCanon = needsParens(infinityPayload)
      ? `(${infinityPayload.identity.canonical})`
      : infinityPayload.identity.canonical;
    const canonical = `${leftCanon} * ${rightCanon}`;

    const structuralHash = `a6:${zeroPayload.identity.structuralHash}:${infinityPayload.identity.structuralHash}`;
    const source: StructuralSourceReference = {
      sourceHash: sourceRef.sourceHash || zeroPayload.identity.source.sourceHash,
      sourceCanonical: canonical,
      sourceSpan: { start: 0, endExclusive: canonical.length },
      origin: 'DERIVED_RICIS_RULE',
    };

    return Object.freeze({
      kind: 'BINARY',
      operator: 'MULTIPLY',
      left: zeroPayload,
      right: infinityPayload,
      identity: Object.freeze({
        structuralHash,
        canonical,
        typeTag: 'scalar',
        source,
      }),
      semanticKeys: Object.freeze([
        ...zeroPayload.semanticKeys,
        ...infinityPayload.semanticKeys,
      ]),
    });
  }

  createA7Difference(
    leftPayload: StructuralExpression,
    rightPayload: StructuralExpression,
    sourceRef: StructuralSourceReference
  ): StructuralIndexedInfinity {
    const canonicalDiff = `${leftPayload.identity.canonical} - ${rightPayload.identity.canonical}`;
    const structuralHash = `a7:${leftPayload.identity.structuralHash}:${rightPayload.identity.structuralHash}`;
    const canonicalInf = `inf_{${canonicalDiff}}`;

    const source: StructuralSourceReference = {
      sourceHash: sourceRef.sourceHash || leftPayload.identity.source.sourceHash,
      sourceCanonical: canonicalInf,
      sourceSpan: { start: 0, endExclusive: canonicalInf.length },
      origin: 'DERIVED_RICIS_RULE',
    };

    const diffPayload: StructuralExpression = Object.freeze({
      kind: 'BINARY',
      operator: 'SUBTRACT',
      left: leftPayload,
      right: rightPayload,
      identity: Object.freeze({
        structuralHash: `diff:${leftPayload.identity.structuralHash}:${rightPayload.identity.structuralHash}`,
        canonical: canonicalDiff,
        typeTag: 'scalar',
        source,
      }),
      semanticKeys: Object.freeze([
        ...leftPayload.semanticKeys,
        ...rightPayload.semanticKeys,
      ]),
    });

    const index: StructuralIndex = Object.freeze({
      basis: 'SP4_SOURCE_EXPRESSION',
      payloadHash: diffPayload.identity.structuralHash,
      payloadCanonical: diffPayload.identity.canonical,
      payloadTypeTag: 'scalar',
      sourceHash: source.sourceHash,
      semanticKeys: diffPayload.semanticKeys,
    });

    return Object.freeze({
      kind: 'INDEXED_INFINITY',
      index,
      payload: diffPayload,
      identity: Object.freeze({
        structuralHash,
        canonical: canonicalInf,
        typeTag: 'scalar',
        source,
      }),
      semanticKeys: diffPayload.semanticKeys,
    });
  }
}

/**
 * Сервис структурного равенства по аксиоме L1 с приоритетом SP4 над числовым сравнением.
 */
export class StructuralEqualityService implements IStructuralEqualityService {
  areStructurallyEqual(a: StructuralExpression, b: StructuralExpression): boolean {
    if (a === b) return true;
    if (a.kind !== b.kind) return false;
    if (a.identity.typeTag !== b.identity.typeTag) return false;
    if (a.identity.structuralHash !== b.identity.structuralHash) return false;

    // Проверка SP4 для индексированных объектов
    if ((a.kind === 'INDEXED_ZERO' || a.kind === 'INDEXED_INFINITY') &&
        (b.kind === 'INDEXED_ZERO' || b.kind === 'INDEXED_INFINITY')) {
      if (!this.haveEqualSemanticIndices(a.index, b.index)) {
        return false;
      }
    }

    return true;
  }

  haveEqualSemanticIndices(a: StructuralIndex, b: StructuralIndex): boolean {
    if (a === b) return true;
    return a.basis === b.basis &&
      a.payloadHash === b.payloadHash &&
      a.payloadCanonical === b.payloadCanonical;
  }
}
