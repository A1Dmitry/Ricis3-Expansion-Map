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
  A15OperandPair,
  ISingularityOperandExtractor,
  ISingularityPairValidator,
  IStructuralExpressionFactory,
  IStructuralEqualityService,
  SingularityPairValidationResult,
  ITypeConsistencyValidator,
  ISemanticIndexValidator,
} from './oopContracts';
import { HOMOGENEOUS_SCALAR_PRECONDITIONS } from './a6A7Homogeneous';
import { OrderProfileCalculator } from './orderProfileCalculator';
import {
  structuralToSymbolicAst,
  parseCanonicalStringToAst,
  computeSymbolicAstFingerprint,
  areSymbolicAstsIsomorphic,
} from './a15SeriesEngine';

/**
 * Доменный сервис извлечения операндов из бинарных выражений (DRY).
 */
export class SingularityOperandExtractor implements ISingularityOperandExtractor {
  private _defaultEquality?: IStructuralEqualityService;

  constructor(private readonly equalityService?: IStructuralEqualityService) {}

  private get equality(): IStructuralEqualityService {
    if (this.equalityService) return this.equalityService;
    if (!this._defaultEquality) this._defaultEquality = new StructuralEqualityService();
    return this._defaultEquality;
  }
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

  extractA15Pair(expression: StructuralBinaryExpression, evaluationPoint = 0): A15OperandPair | undefined {
    if (expression.kind !== 'BINARY' || expression.operator !== 'DIVIDE') {
      return undefined;
    }

    const left = expression.left;
    const right = expression.right;
    if (!left || !right) return undefined;

    // Identical indexed zeros are handled by A4; identical indexed infinities are handled by A5
    if (
      left.kind === 'INDEXED_ZERO' &&
      right.kind === 'INDEXED_ZERO' &&
      left.payload &&
      right.payload &&
      this.equality.areStructurallyEqual(left.payload, right.payload)
    ) {
      return undefined;
    }
    if (
      left.kind === 'INDEXED_INFINITY' &&
      right.kind === 'INDEXED_INFINITY' &&
      left.payload &&
      right.payload &&
      this.equality.areStructurallyEqual(left.payload, right.payload)
    ) {
      return undefined;
    }

    const numPayload = left.kind === 'INDEXED_ZERO' ? left.payload : left;
    const denPayload = right.kind === 'INDEXED_ZERO' ? right.payload : right;

    const numProfile = OrderProfileCalculator.computeOrderAndDerivative(numPayload, evaluationPoint);
    const denProfile = OrderProfileCalculator.computeOrderAndDerivative(denPayload, evaluationPoint);

    if (
      numProfile.isResolved &&
      denProfile.isResolved &&
      numProfile.order === denProfile.order &&
      numProfile.order > 0
    ) {
      return {
        numeratorPayload: numPayload,
        denominatorPayload: denPayload,
        order: numProfile.order,
        numDerivValue: numProfile.derivValue,
        denDerivValue: denProfile.derivValue,
        numProfileCoeff: numProfile.coeff,
        denProfileCoeff: denProfile.coeff,
        evalPoint: 0,
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

  validateA15Pair(
    pair: A15OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult {
    const { numeratorPayload, denominatorPayload } = pair;

    const leftTag = numeratorPayload.identity?.typeTag ?? 'scalar';
    const rightTag = denominatorPayload.identity?.typeTag ?? 'scalar';
    const compatibility = typeValidator.checkCompatibility(leftTag, rightTag);
    if (compatibility.requiresCompositeDeferral) {
      return { isValid: false, status: 'DEFERRED', reason: 'TCP_COMPOSITE_REQUIRED' };
    }

    if (!indexValidator.hasValidFiniteKeys(numeratorPayload) || !indexValidator.hasValidFiniteKeys(denominatorPayload)) {
      return { isValid: false, status: 'DEFERRED', reason: 'INVALID_FINITE_KEYS' };
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

  createA15ProfileQuotient(
    canonicalValue: string,
    sourceRef: StructuralSourceReference
  ): StructuralExpression {
    const source: StructuralSourceReference = {
      sourceHash: sourceRef.sourceHash,
      sourceCanonical: canonicalValue,
      sourceSpan: { start: 0, endExclusive: canonicalValue.length },
      origin: 'DERIVED_RICIS_RULE',
    };

    if (canonicalValue.includes('/')) {
      const parts = canonicalValue.split('/').map(s => s.trim());
      const numLexeme = parts[0]!;
      const denLexeme = parts[1]!;

      const left: StructuralExpression = Object.freeze({
        kind: 'FINITE_LITERAL',
        lexeme: numLexeme,
        identity: Object.freeze({
          structuralHash: `literal:${numLexeme}`,
          canonical: numLexeme,
          typeTag: 'scalar',
          source,
        }),
        semanticKeys: Object.freeze([]),
      });

      const right: StructuralExpression = Object.freeze({
        kind: 'FINITE_LITERAL',
        lexeme: denLexeme,
        identity: Object.freeze({
          structuralHash: `literal:${denLexeme}`,
          canonical: denLexeme,
          typeTag: 'scalar',
          source,
        }),
        semanticKeys: Object.freeze([]),
      });

      return Object.freeze({
        kind: 'BINARY',
        operator: 'DIVIDE',
        left,
        right,
        identity: Object.freeze({
          structuralHash: `a15:${canonicalValue}`,
          canonical: canonicalValue,
          typeTag: 'scalar',
          source,
        }),
        semanticKeys: Object.freeze([]),
      });
    }

    return Object.freeze({
      kind: 'FINITE_LITERAL',
      lexeme: canonicalValue,
      identity: Object.freeze({
        structuralHash: `a15:${canonicalValue}`,
        canonical: canonicalValue,
        typeTag: 'scalar',
        source,
      }),
      semanticKeys: Object.freeze([]),
    });
  }
}

/**
 * Сервис структурного/графового равенства по аксиоме L1.
 * Выполняет изоморфное сопоставление вычислительных графов (AST)
 * с учетом типов L1C2, коммутативности сложения/умножения и точных значений литералов.
 * Приоритет SP4 над числовым сравнением. Устраняет появление мусорных дубликатов.
 */
export class StructuralEqualityService implements IStructuralEqualityService {
  areStructurallyEqual(a: StructuralExpression, b: StructuralExpression): boolean {
    if (a === b) return true;

    // L1C2: Проверка совместимости типов
    if (a.identity.typeTag !== b.identity.typeTag) return false;

    // Проверка сингулярных узлов (INDEXED_ZERO, INDEXED_INFINITY)
    const aIsSingular = a.kind === 'INDEXED_ZERO' || a.kind === 'INDEXED_INFINITY';
    const bIsSingular = b.kind === 'INDEXED_ZERO' || b.kind === 'INDEXED_INFINITY';
    if (aIsSingular || bIsSingular) {
      if (a.kind !== b.kind) return false;
      const aSing = a as Extract<StructuralExpression, { kind: 'INDEXED_ZERO' | 'INDEXED_INFINITY' }>;
      const bSing = b as Extract<StructuralExpression, { kind: 'INDEXED_ZERO' | 'INDEXED_INFINITY' }>;
      if (!this.areStructurallyEqual(aSing.payload, bSing.payload)) return false;
      return this.haveEqualSemanticIndices(aSing.index, bSing.index, aSing.payload, bSing.payload);
    }

    // Быстрый структурный проход по StructuralExpression
    if (a.kind === b.kind) {
      switch (a.kind) {
        case 'IDENTIFIER': {
          const bId = b as Extract<StructuralExpression, { kind: 'IDENTIFIER' }>;
          return a.name === bId.name;
        }
        case 'FINITE_LITERAL': {
          const bLit = b as Extract<StructuralExpression, { kind: 'FINITE_LITERAL' }>;
          if (a.lexeme === bLit.lexeme && a.identity.canonical === bLit.identity.canonical) {
            return true;
          }
          if (a.identity.canonical && bLit.identity.canonical && a.identity.canonical !== bLit.identity.canonical) {
            const astA = parseCanonicalStringToAst(a.identity.canonical);
            const astB = parseCanonicalStringToAst(bLit.identity.canonical);
            if (astA && astB) {
              return areSymbolicAstsIsomorphic(astA, astB);
            }
            return false;
          }
          const numA = Number(a.lexeme);
          const numB = Number(bLit.lexeme);
          if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
            const aIsPlainNum = !a.identity.canonical || a.identity.canonical === a.lexeme;
            const bIsPlainNum = !bLit.identity.canonical || bLit.identity.canonical === bLit.lexeme;
            if (numA === numB && aIsPlainNum && bIsPlainNum) {
              return true;
            }
          }
          break;
        }
        case 'UNARY': {
          const bUn = b as Extract<StructuralExpression, { kind: 'UNARY' }>;
          if (a.operator === bUn.operator) {
            return this.areStructurallyEqual(a.operand, bUn.operand);
          }
          return false;
        }
        case 'BINARY': {
          const bBin = b as Extract<StructuralExpression, { kind: 'BINARY' }>;
          if (a.operator === bBin.operator) {
            if (a.operator === 'ADD' || a.operator === 'MULTIPLY') {
              const direct =
                this.areStructurallyEqual(a.left, bBin.left) &&
                this.areStructurallyEqual(a.right, bBin.right);
              if (direct) return true;
              const swapped =
                this.areStructurallyEqual(a.left, bBin.right) &&
                this.areStructurallyEqual(a.right, bBin.left);
              if (swapped) return true;
            } else {
              return (
                this.areStructurallyEqual(a.left, bBin.left) &&
                this.areStructurallyEqual(a.right, bBin.right)
              );
            }
          }
          break;
        }
      }
    }

    // Полное графовое сопоставление через Symbolic AST граф
    const astA = structuralToSymbolicAst(a);
    const astB = structuralToSymbolicAst(b);
    return areSymbolicAstsIsomorphic(astA, astB);
  }

  haveEqualSemanticIndices(
    a: StructuralIndex,
    b: StructuralIndex,
    aPayload?: StructuralExpression,
    bPayload?: StructuralExpression
  ): boolean {
    if (a === b) return true;
    if (a.basis !== b.basis) return false;
    if (a.payloadTypeTag !== b.payloadTypeTag) return false;

    if (aPayload && bPayload) {
      return this.areStructurallyEqual(aPayload, bPayload);
    }

    if (a.payloadCanonical && b.payloadCanonical) {
      if (a.payloadCanonical === b.payloadCanonical) return true;
      const astA = parseCanonicalStringToAst(a.payloadCanonical);
      const astB = parseCanonicalStringToAst(b.payloadCanonical);
      if (astA && astB) {
        return areSymbolicAstsIsomorphic(astA, astB);
      }
      return false;
    }

    return a.payloadHash === b.payloadHash && a.payloadCanonical === b.payloadCanonical;
  }

  getGraphFingerprint(expression: StructuralExpression): string {
    if (expression.kind === 'INDEXED_ZERO') {
      return `0_{${this.getGraphFingerprint(expression.payload)}}`;
    }
    if (expression.kind === 'INDEXED_INFINITY') {
      return `inf_{${this.getGraphFingerprint(expression.payload)}}`;
    }
    const ast = structuralToSymbolicAst(expression);
    return computeSymbolicAstFingerprint(ast);
  }

  areGraphIsomorphic(a: StructuralExpression, b: StructuralExpression): boolean {
    return this.areStructurallyEqual(a, b);
  }
}
