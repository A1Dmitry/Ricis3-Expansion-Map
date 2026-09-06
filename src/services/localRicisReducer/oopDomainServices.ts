import type {
  StructuralBinaryExpression,
  StructuralExpression,
  StructuralIndexedInfinity,
  StructuralIndexedZero,
  StructuralSourceReference,
  StructuralIndex,
} from './contracts';
import type {
  A4OperandPair,
  A5OperandPair,
  A6OperandPair,
  A7OperandPair,
  A1OperandPair,
  A10OperandPair,
  A8OperandPair,
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
  extractA4Pair(expression: StructuralBinaryExpression): A4OperandPair | undefined {
    if (expression.kind !== 'BINARY' || expression.operator !== 'DIVIDE') {
      return undefined;
    }

    if (expression.left?.kind === 'INDEXED_ZERO' && expression.right?.kind === 'INDEXED_ZERO') {
      return {
        numeratorZero: expression.left as StructuralIndexedZero,
        denominatorZero: expression.right as StructuralIndexedZero,
      };
    }
    return undefined;
  }

  extractA5Pair(expression: StructuralBinaryExpression): A5OperandPair | undefined {
    if (expression.kind !== 'BINARY' || expression.operator !== 'DIVIDE') {
      return undefined;
    }

    if (expression.left?.kind === 'INDEXED_INFINITY' && expression.right?.kind === 'INDEXED_INFINITY') {
      return {
        numeratorInfinity: expression.left as StructuralIndexedInfinity,
        denominatorInfinity: expression.right as StructuralIndexedInfinity,
      };
    }
    return undefined;
  }

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

  extractA1Pair(expression: StructuralBinaryExpression): A1OperandPair | undefined {
    if (expression.kind !== 'BINARY' || expression.operator !== 'DIVIDE') {
      return undefined;
    }

    const isZeroLiteral = (e: StructuralExpression | undefined): boolean => {
      if (!e) return false;
      if (e.kind === 'FINITE_LITERAL') {
        const val = e.lexeme.trim();
        return val === '0' || val === '0.0' || e.identity.canonical === '0';
      }
      return false;
    };

    // If both are zero, this is A4 (0/0), not A1
    if ((isZeroLiteral(expression.left) || expression.left?.kind === 'INDEXED_ZERO') &&
        (isZeroLiteral(expression.right) || expression.right?.kind === 'INDEXED_ZERO')) {
      return undefined;
    }

    if (isZeroLiteral(expression.right) && expression.left) {
      return {
        numeratorPayload: expression.left,
        zeroDenominator: expression.right,
      };
    }

    return undefined;
  }

  extractA10Pair(expression: StructuralBinaryExpression): A10OperandPair | undefined {
    if (expression.kind !== 'BINARY' || expression.operator !== 'MULTIPLY') {
      return undefined;
    }

    const isZeroLiteral = (e: StructuralExpression | undefined): boolean => {
      if (!e) return false;
      if (e.kind === 'FINITE_LITERAL') {
        const val = e.lexeme.trim();
        return val === '0' || val === '0.0' || e.identity.canonical === '0';
      }
      return false;
    };

    // If one is infinity, this is A6 (0 * inf), not A10
    if (expression.left?.kind === 'INDEXED_INFINITY' || expression.right?.kind === 'INDEXED_INFINITY') {
      return undefined;
    }

    if (isZeroLiteral(expression.right) && expression.left && !isZeroLiteral(expression.left)) {
      return {
        finitePayload: expression.left,
        zeroFactor: expression.right,
      };
    }

    if (isZeroLiteral(expression.left) && expression.right && !isZeroLiteral(expression.right)) {
      return {
        finitePayload: expression.right,
        zeroFactor: expression.left,
      };
    }

    return undefined;
  }

  extractA8Pair(expression: StructuralBinaryExpression): A8OperandPair | undefined {
    if (expression.kind !== 'BINARY' || expression.operator !== 'SUBTRACT') {
      return undefined;
    }

    if (expression.left?.kind === 'INDEXED_ZERO' && expression.right?.kind === 'INDEXED_ZERO') {
      return {
        leftZero: expression.left as StructuralIndexedZero,
        rightZero: expression.right as StructuralIndexedZero,
      };
    }
    return undefined;
  }
}

/**
 * Доменный сервис валидации пары сингулярных операндов (DRY + TCP).
 */
export class SingularityPairValidator implements ISingularityPairValidator {
  validateA4Pair(
    pair: A4OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult {
    const { numeratorZero, denominatorZero } = pair;

    if (numeratorZero.payload && denominatorZero.payload) {
      const leftTag = numeratorZero.payload.identity?.typeTag ?? 'scalar';
      const rightTag = denominatorZero.payload.identity?.typeTag ?? 'scalar';
      const compatibility = typeValidator.checkCompatibility(leftTag, rightTag);
      if (compatibility.requiresCompositeDeferral) {
        return { isValid: false, status: 'DEFERRED', reason: 'TCP_COMPOSITE_REQUIRED' };
      }

      if (numeratorZero.index && !indexValidator.isIndexMatching(numeratorZero.index, numeratorZero.payload)) {
        return { isValid: false, status: 'DEFERRED', reason: 'SP4_SOURCE_MISMATCH' };
      }
      if (denominatorZero.index && !indexValidator.isIndexMatching(denominatorZero.index, denominatorZero.payload)) {
        return { isValid: false, status: 'DEFERRED', reason: 'SP4_SOURCE_MISMATCH' };
      }

      if (!indexValidator.hasValidFiniteKeys(numeratorZero.payload) || !indexValidator.hasValidFiniteKeys(denominatorZero.payload)) {
        return { isValid: false, status: 'DEFERRED', reason: 'INVALID_FINITE_KEYS' };
      }
    }

    return {
      isValid: true,
      preconditions: [...HOMOGENEOUS_SCALAR_PRECONDITIONS],
    };
  }

  validateA5Pair(
    pair: A5OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult {
    const { numeratorInfinity, denominatorInfinity } = pair;

    if (numeratorInfinity.payload && denominatorInfinity.payload) {
      const leftTag = numeratorInfinity.payload.identity?.typeTag ?? 'scalar';
      const rightTag = denominatorInfinity.payload.identity?.typeTag ?? 'scalar';
      const compatibility = typeValidator.checkCompatibility(leftTag, rightTag);
      if (compatibility.requiresCompositeDeferral) {
        return { isValid: false, status: 'DEFERRED', reason: 'TCP_COMPOSITE_REQUIRED' };
      }

      if (numeratorInfinity.index && !indexValidator.isIndexMatching(numeratorInfinity.index, numeratorInfinity.payload)) {
        return { isValid: false, status: 'DEFERRED', reason: 'SP4_SOURCE_MISMATCH' };
      }
      if (denominatorInfinity.index && !indexValidator.isIndexMatching(denominatorInfinity.index, denominatorInfinity.payload)) {
        return { isValid: false, status: 'DEFERRED', reason: 'SP4_SOURCE_MISMATCH' };
      }

      if (!indexValidator.hasValidFiniteKeys(numeratorInfinity.payload) || !indexValidator.hasValidFiniteKeys(denominatorInfinity.payload)) {
        return { isValid: false, status: 'DEFERRED', reason: 'INVALID_FINITE_KEYS' };
      }
    }

    return {
      isValid: true,
      preconditions: [...HOMOGENEOUS_SCALAR_PRECONDITIONS],
    };
  }

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

  validateA1Pair(
    pair: A1OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult {
    const { numeratorPayload } = pair;

    const leftTag = numeratorPayload.identity?.typeTag ?? 'scalar';
    const compatibility = typeValidator.checkCompatibility(leftTag, 'scalar');
    if (compatibility.requiresCompositeDeferral) {
      return { isValid: false, status: 'DEFERRED', reason: 'TCP_COMPOSITE_REQUIRED' };
    }

    if (!indexValidator.hasValidFiniteKeys(numeratorPayload)) {
      return { isValid: false, status: 'DEFERRED', reason: 'INVALID_FINITE_KEYS' };
    }

    return {
      isValid: true,
      preconditions: [...HOMOGENEOUS_SCALAR_PRECONDITIONS],
    };
  }

  validateA10Pair(
    pair: A10OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult {
    const { finitePayload } = pair;

    const leftTag = finitePayload.identity?.typeTag ?? 'scalar';
    const compatibility = typeValidator.checkCompatibility(leftTag, 'scalar');
    if (compatibility.requiresCompositeDeferral) {
      return { isValid: false, status: 'DEFERRED', reason: 'TCP_COMPOSITE_REQUIRED' };
    }

    if (!indexValidator.hasValidFiniteKeys(finitePayload)) {
      return { isValid: false, status: 'DEFERRED', reason: 'INVALID_FINITE_KEYS' };
    }

    return {
      isValid: true,
      preconditions: [...HOMOGENEOUS_SCALAR_PRECONDITIONS],
    };
  }

  validateA8Pair(
    pair: A8OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult {
    const { leftZero, rightZero } = pair;

    if (leftZero.payload && rightZero.payload) {
      const leftTag = leftZero.payload.identity?.typeTag ?? 'scalar';
      const rightTag = rightZero.payload.identity?.typeTag ?? 'scalar';
      const compatibility = typeValidator.checkCompatibility(leftTag, rightTag);
      if (compatibility.requiresCompositeDeferral) {
        return { isValid: false, status: 'DEFERRED', reason: 'TCP_COMPOSITE_REQUIRED' };
      }

      if (leftZero.index && !indexValidator.isIndexMatching(leftZero.index, leftZero.payload)) {
        return { isValid: false, status: 'DEFERRED', reason: 'SP4_SOURCE_MISMATCH' };
      }
      if (rightZero.index && !indexValidator.isIndexMatching(rightZero.index, rightZero.payload)) {
        return { isValid: false, status: 'DEFERRED', reason: 'SP4_SOURCE_MISMATCH' };
      }

      if (!indexValidator.hasValidFiniteKeys(leftZero.payload) || !indexValidator.hasValidFiniteKeys(rightZero.payload)) {
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
  createA4Quotient(
    numeratorPayload: StructuralExpression,
    denominatorPayload: StructuralExpression,
    sourceRef: StructuralSourceReference
  ): StructuralExpression {
    const needsParens = (expr: StructuralExpression): boolean => {
      if (expr.kind === 'BINARY') return true;
      const canon = expr.identity.canonical.trim();
      if (canon.startsWith('(') && canon.endsWith(')')) return false;
      return /[+\-*/]|\s/.test(canon);
    };

    const leftCanon = needsParens(numeratorPayload)
      ? `(${numeratorPayload.identity.canonical})`
      : numeratorPayload.identity.canonical;
    const rightCanon = needsParens(denominatorPayload)
      ? `(${denominatorPayload.identity.canonical})`
      : denominatorPayload.identity.canonical;
    const canonical = `${leftCanon} / ${rightCanon}`;

    const structuralHash = `a4:${numeratorPayload.identity.structuralHash}:${denominatorPayload.identity.structuralHash}`;
    const source: StructuralSourceReference = {
      sourceHash: sourceRef.sourceHash || numeratorPayload.identity.source.sourceHash,
      sourceCanonical: canonical,
      sourceSpan: { start: 0, endExclusive: canonical.length },
      origin: 'DERIVED_RICIS_RULE',
    };

    return Object.freeze({
      kind: 'BINARY',
      operator: 'DIVIDE',
      left: numeratorPayload,
      right: denominatorPayload,
      identity: Object.freeze({
        structuralHash,
        canonical,
        typeTag: 'scalar',
        source,
      }),
      semanticKeys: Object.freeze([
        ...numeratorPayload.semanticKeys,
        ...denominatorPayload.semanticKeys,
      ]),
    });
  }

  createA5Quotient(
    numeratorPayload: StructuralExpression,
    denominatorPayload: StructuralExpression,
    sourceRef: StructuralSourceReference
  ): StructuralExpression {
    const needsParens = (expr: StructuralExpression): boolean => {
      if (expr.kind === 'BINARY') return true;
      const canon = expr.identity.canonical.trim();
      if (canon.startsWith('(') && canon.endsWith(')')) return false;
      return /[+\-*/]|\s/.test(canon);
    };

    const leftCanon = needsParens(numeratorPayload)
      ? `(${numeratorPayload.identity.canonical})`
      : numeratorPayload.identity.canonical;
    const rightCanon = needsParens(denominatorPayload)
      ? `(${denominatorPayload.identity.canonical})`
      : denominatorPayload.identity.canonical;
    const canonical = `${leftCanon} / ${rightCanon}`;

    const structuralHash = `a5:${numeratorPayload.identity.structuralHash}:${denominatorPayload.identity.structuralHash}`;
    const source: StructuralSourceReference = {
      sourceHash: sourceRef.sourceHash || numeratorPayload.identity.source.sourceHash,
      sourceCanonical: canonical,
      sourceSpan: { start: 0, endExclusive: canonical.length },
      origin: 'DERIVED_RICIS_RULE',
    };

    return Object.freeze({
      kind: 'BINARY',
      operator: 'DIVIDE',
      left: numeratorPayload,
      right: denominatorPayload,
      identity: Object.freeze({
        structuralHash,
        canonical,
        typeTag: 'scalar',
        source,
      }),
      semanticKeys: Object.freeze([
        ...numeratorPayload.semanticKeys,
        ...denominatorPayload.semanticKeys,
      ]),
    });
  }

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

  createA1Infinity(
    numeratorPayload: StructuralExpression,
    sourceRef: StructuralSourceReference
  ): StructuralIndexedInfinity {
    const canonicalInf = `inf_{${numeratorPayload.identity.canonical}}`;
    const structuralHash = `a1:inf:${numeratorPayload.identity.structuralHash}`;
    const source: StructuralSourceReference = {
      sourceHash: sourceRef.sourceHash || numeratorPayload.identity.source.sourceHash,
      sourceCanonical: canonicalInf,
      sourceSpan: { start: 0, endExclusive: canonicalInf.length },
      origin: 'DERIVED_RICIS_RULE',
    };

    const index: StructuralIndex = Object.freeze({
      basis: 'SP4_SOURCE_EXPRESSION',
      payloadHash: numeratorPayload.identity.structuralHash,
      payloadCanonical: numeratorPayload.identity.canonical,
      payloadTypeTag: numeratorPayload.identity.typeTag,
      sourceHash: source.sourceHash,
      semanticKeys: numeratorPayload.semanticKeys,
    });

    return Object.freeze({
      kind: 'INDEXED_INFINITY',
      index,
      payload: numeratorPayload,
      identity: Object.freeze({
        structuralHash,
        canonical: canonicalInf,
        typeTag: numeratorPayload.identity.typeTag,
        source,
      }),
      semanticKeys: numeratorPayload.semanticKeys,
    });
  }

  createA10Zero(
    finitePayload: StructuralExpression,
    sourceRef: StructuralSourceReference
  ): StructuralIndexedZero {
    const canonicalZero = `0_{${finitePayload.identity.canonical}}`;
    const structuralHash = `a10:zero:${finitePayload.identity.structuralHash}`;
    const source: StructuralSourceReference = {
      sourceHash: sourceRef.sourceHash || finitePayload.identity.source.sourceHash,
      sourceCanonical: canonicalZero,
      sourceSpan: { start: 0, endExclusive: canonicalZero.length },
      origin: 'DERIVED_RICIS_RULE',
    };

    const index: StructuralIndex = Object.freeze({
      basis: 'SP4_SOURCE_EXPRESSION',
      payloadHash: finitePayload.identity.structuralHash,
      payloadCanonical: finitePayload.identity.canonical,
      payloadTypeTag: finitePayload.identity.typeTag,
      sourceHash: source.sourceHash,
      semanticKeys: finitePayload.semanticKeys,
    });

    return Object.freeze({
      kind: 'INDEXED_ZERO',
      index,
      payload: finitePayload,
      identity: Object.freeze({
        structuralHash,
        canonical: canonicalZero,
        typeTag: finitePayload.identity.typeTag,
        source,
      }),
      semanticKeys: finitePayload.semanticKeys,
    });
  }

  createA8Difference(
    leftPayload: StructuralExpression,
    rightPayload: StructuralExpression,
    sourceRef: StructuralSourceReference
  ): StructuralIndexedZero {
    const canonicalDiff = `${leftPayload.identity.canonical} - ${rightPayload.identity.canonical}`;
    const structuralHash = `a8:${leftPayload.identity.structuralHash}:${rightPayload.identity.structuralHash}`;
    const canonicalZero = `0_{${canonicalDiff}}`;

    const source: StructuralSourceReference = {
      sourceHash: sourceRef.sourceHash || leftPayload.identity.source.sourceHash,
      sourceCanonical: canonicalZero,
      sourceSpan: { start: 0, endExclusive: canonicalZero.length },
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
      kind: 'INDEXED_ZERO',
      index,
      payload: diffPayload,
      identity: Object.freeze({
        structuralHash,
        canonical: canonicalZero,
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
