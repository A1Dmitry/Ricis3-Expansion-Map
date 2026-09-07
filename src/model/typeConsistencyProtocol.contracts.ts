// ============================================================================
// RICIS-III v7.7 TYPE CONSISTENCY PROTOCOL (TCP) & MONOLITH CONTRACTS
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

/**
 * Ontological domain type under L1C2 (Type as Identity).
 */
export type RicisOntologyKind =
  | 'SCALAR_NUMERIC'     // e.g., 5, 3.14
  | 'POLYNOMIAL_SYMBOL'  // e.g., 2x, x^2 - 4
  | 'PHYSICAL_TIME'      // e.g., seconds, dt
  | 'PHYSICAL_SPACE'     // e.g., meters, dx
  | 'PHYSICAL_VELOCITY'  // e.g., m/s
  | 'GEOMETRIC_ORIENTATION' // e.g., rad, azimuth
  | 'COMPOSITE_DIMENSION';  // Incompatible union, e.g. (Time, Space)

export interface IRicisTypeSignature {
  readonly kind: RicisOntologyKind;
  readonly unit?: string;
  readonly dimensions?: readonly string[];
}

export type TcpCompatibilityRelation =
  | 'HOMOGENEOUS'   // T(F) == T(G): Direct algebraic operation
  | 'COMPATIBLE'    // T(F) ⊂ T(G): Promotion to broader type
  | 'INCOMPATIBLE'; // Incompatible: Composite multi-dimensional Monolith

export type MonolithOrder = 0 | 1 | 2 | 3;

/**
 * Order 0: Atomic Monolith (Point / pure identity F, 0_F, inf_F)
 * Order 1: Line Monolith (Composition closed under RICIS operations)
 * Order 2: Plane Monolith (Interconnected 0-1 systems with non-limiting transitions)
 * Order 3: Volume Monolith (Autonomous self-navigating system)
 */
export interface IMonolithStructure<T = unknown> {
  readonly order: MonolithOrder;
  readonly typeSignature: IRicisTypeSignature;
  readonly elements: readonly T[];
  readonly invariant: string;
  readonly isComposite: boolean;
}

/**
 * Fractal Law: R(Q) = { Q, T(Q), inf_Q, 0_Q, R(inf_Q), R(0_Q) }
 */
export interface IFractalUnfoldingNode {
  readonly identity: string;
  readonly typeSignature: IRicisTypeSignature;
  readonly zeroMonad: string;     // 0_Q
  readonly infiniteMonad: string; // inf_Q
  readonly recursiveDepth: number;
  readonly subUnfoldingInfinite?: IFractalUnfoldingNode;
  readonly subUnfoldingZero?: IFractalUnfoldingNode;
}

export interface ITcpOperationResult<T = unknown> {
  readonly relation: TcpCompatibilityRelation;
  readonly resultingType: IRicisTypeSignature;
  readonly isMonolithFormed: boolean;
  readonly monolith?: IMonolithStructure<T>;
  readonly resolvedInvariant: string;
}

export interface ITypeConsistencyProtocol {
  checkCompatibility(typeA: IRicisTypeSignature, typeB: IRicisTypeSignature): TcpCompatibilityRelation;
  promoteTypes(typeA: IRicisTypeSignature, typeB: IRicisTypeSignature): IRicisTypeSignature;
  executeSingularAddition(
    operandA: { index: string; type: IRicisTypeSignature; isInfinity: boolean },
    operandB: { index: string; type: IRicisTypeSignature; isInfinity: boolean }
  ): ITcpOperationResult;
  unfoldFractalLaw(
    seedIdentity: string,
    seedType: IRicisTypeSignature,
    maxDepth?: number
  ): IFractalUnfoldingNode;
}
