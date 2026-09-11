// ============================================================================
// RICIS-III v7.7 TYPE CONSISTENCY PROTOCOL (TCP) & MONOLITH ENGINE
// Clean Architecture, DDD, SOLID, DRY
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type {
  ITypeConsistencyProtocol,
  IRicisTypeSignature,
  TcpCompatibilityRelation,
  ITcpOperationResult,
  IFractalUnfoldingNode,
  IMonolithStructure,
} from './typeConsistencyProtocol.contracts';

export class TypeConsistencyProtocolEngine implements ITypeConsistencyProtocol {
  /**
   * Checks compatibility under L1C2 (Type as Identity).
   */
  public checkCompatibility(
    typeA: IRicisTypeSignature,
    typeB: IRicisTypeSignature
  ): TcpCompatibilityRelation {
    if (typeA.kind === typeB.kind) {
      if (typeA.unit && typeB.unit && typeA.unit !== typeB.unit) {
        return 'INCOMPATIBLE';
      }
      return 'HOMOGENEOUS';
    }

    // Scalar promotes to polynomial/symbolic
    if (
      (typeA.kind === 'SCALAR_NUMERIC' && typeB.kind === 'POLYNOMIAL_SYMBOL') ||
      (typeB.kind === 'SCALAR_NUMERIC' && typeA.kind === 'POLYNOMIAL_SYMBOL')
    ) {
      return 'COMPATIBLE';
    }

    // Otherwise, different physical dimensions are strictly incompatible
    return 'INCOMPATIBLE';
  }

  /**
   * Promotes compatible types to broader type.
   */
  public promoteTypes(
    typeA: IRicisTypeSignature,
    typeB: IRicisTypeSignature
  ): IRicisTypeSignature {
    const relation = this.checkCompatibility(typeA, typeB);
    if (relation === 'HOMOGENEOUS') {
      return typeA;
    }
    if (relation === 'COMPATIBLE') {
      return typeA.kind === 'POLYNOMIAL_SYMBOL' ? typeA : typeB;
    }
    // Composite multi-dimensional type
    const dims = [
      ...(typeA.dimensions ?? [typeA.kind]),
      ...(typeB.dimensions ?? [typeB.kind]),
    ];
    return {
      kind: 'COMPOSITE_DIMENSION',
      dimensions: dims,
    };
  }

  /**
   * Creates an Order 0 Atomic Monolith.
   */
  public createAtomicMonolith(identity: string, type: IRicisTypeSignature): IMonolithStructure<string> {
    return {
      order: 0,
      typeSignature: type,
      elements: [identity],
      invariant: identity,
      isComposite: false,
    };
  }

  /**
   * Executes singular addition of infinities or zeros under TCP.
   */
  public executeSingularAddition(
    operandA: { index: string; type: IRicisTypeSignature; isInfinity: boolean },
    operandB: { index: string; type: IRicisTypeSignature; isInfinity: boolean }
  ): ITcpOperationResult<string> {
    const relation = this.checkCompatibility(operandA.type, operandB.type);
    const prefix = operandA.isInfinity ? '∞_' : '0_';

    if (relation === 'HOMOGENEOUS') {
      // Direct algebraic addition
      const numA = parseFloat(operandA.index);
      const numB = parseFloat(operandB.index);
      let resolvedIndex = `${operandA.index}+${operandB.index}`;
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
        resolvedIndex = `${numA + numB}`;
      }

      return {
        relation: 'HOMOGENEOUS',
        resultingType: operandA.type,
        isMonolithFormed: false,
        resolvedInvariant: `${prefix}${resolvedIndex}`,
      };
    }

    if (relation === 'COMPATIBLE') {
      const promoted = this.promoteTypes(operandA.type, operandB.type);
      const resolvedIndex = `(${operandA.index}+${operandB.index})`;
      return {
        relation: 'COMPATIBLE',
        resultingType: promoted,
        isMonolithFormed: false,
        resolvedInvariant: `${prefix}${resolvedIndex}`,
      };
    }

    // INCOMPATIBLE: Formation of composite multi-dimensional monolith (Order 1)
    const compositeType = this.promoteTypes(operandA.type, operandB.type);
    const compositeIndex = `(${operandA.index}, ${operandB.index})`;
    const monolith: IMonolithStructure<string> = {
      order: 1, // Line Monolith / Order 1
      typeSignature: compositeType,
      elements: [operandA.index, operandB.index],
      invariant: `${prefix}${compositeIndex}`,
      isComposite: true,
    };

    return {
      relation: 'INCOMPATIBLE',
      resultingType: compositeType,
      isMonolithFormed: true,
      monolith,
      resolvedInvariant: `${prefix}${compositeIndex}`,
    };
  }

  /**
   * Unfolds Fractal Law: R(Q) = { Q, T(Q), inf_Q, 0_Q, R(inf_Q), R(0_Q) }
   * with guaranteed O(1) bound or controlled recursion depth.
   */
  public unfoldFractalLaw(
    seedIdentity: string,
    seedType: IRicisTypeSignature,
    maxDepth = 2,
    currentDepth = 0
  ): IFractalUnfoldingNode {
    const zeroMonad = `0_${seedIdentity}`;
    const infiniteMonad = `∞_${seedIdentity}`;

    if (currentDepth >= maxDepth) {
      return {
        identity: seedIdentity,
        typeSignature: seedType,
        zeroMonad,
        infiniteMonad,
        recursiveDepth: currentDepth,
      };
    }

    return {
      identity: seedIdentity,
      typeSignature: seedType,
      zeroMonad,
      infiniteMonad,
      recursiveDepth: currentDepth,
      subUnfoldingInfinite: this.unfoldFractalLaw(
        infiniteMonad,
        seedType,
        maxDepth,
        currentDepth + 1
      ),
      subUnfoldingZero: this.unfoldFractalLaw(
        zeroMonad,
        seedType,
        maxDepth,
        currentDepth + 1
      ),
    };
  }
}
