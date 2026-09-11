// ============================================================================
// RICIS-III v7.7 GEOMETRIC BRIDGE (CORE COMPUTATIONAL MECHANIC) CONTRACTS
// Space: R^2_RICIS | 0_F x inf_G = det(u, v) = F * G | 0_F / 0_G = F / G
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

/**
 * 2D vector representation in R^2_RICIS.
 */
export interface IRicisVector2D {
  readonly x: number;
  readonly y: number;
  readonly label: string;
}

export type GeometricBridgeOperationType =
  | 'A6_PRODUCT_0_INF'
  | 'A4_RATIO_0_0'
  | 'A5_RATIO_INF_INF'
  | 'A7_SUBTRACTION_INF_INF'
  | 'A8_SUBTRACTION_0_0';

export type GeometricInvariantKind =
  | 'AREA_INVARIANT'
  | 'SCALE_INVARIANT'
  | 'VECTOR_SHIFT_INVARIANT';

/**
 * Geometric Bridge Computation Result:
 * u = (F, 0) - Degenerate object (segment of length F with 0 thickness)
 * v = (0, G) - Infinite object (infinite strip of width G)
 * det(u, v) = u_x * v_y - u_y * v_x = F * G
 */
export interface IGeometricBridgeResolution {
  readonly operation?: GeometricBridgeOperationType;
  readonly invariantKind?: GeometricInvariantKind;
  readonly degenerateVectorU: IRicisVector2D;
  readonly infiniteVectorV: IRicisVector2D;
  readonly uVector?: IRicisVector2D;          // Alias for degenerateVectorU
  readonly vVector?: IRicisVector2D;          // Alias for infiniteVectorV
  readonly skewProductDeterminant: number;     // F * G or scale determinant
  readonly exactInvariantArea: number;         // Primary numeric invariant value
  readonly areaInvariant?: number;             // Alias for exactInvariantArea
  readonly invariantValue?: number;            // Primary numeric invariant
  readonly isDiagonalTelescope: boolean;       // F == G => F^2 or L1_IDENTITY
  readonly isIdentitySatisfied?: boolean;      // X = X preserved
  readonly classicalComparison: {
    readonly classicalOutcome: 'NaN' | 'UNDEFINED_LIMIT' | 'INDETERMINATE_FORM';
    readonly cauchyLimitRequired: false;
    readonly explanation?: string;
  };
  readonly computationalComplexity: 'O(1)';
  readonly complexity?: 'O(1)';               // Alias
  readonly formulaLatex: string;
  readonly axiomApplied?: string;              // e.g. 'A6_GENERAL_PRODUCT'
  readonly geometricMeaning?: string;
}

export interface IGeometricBridgeEngine {
  /**
   * Resolves 0_F x inf_G via 2D Skew Product Determinant (A6).
   */
  resolveGeometricBridge(
    factorF: number,
    factorG: number,
    labelF?: string,
    labelG?: string
  ): IGeometricBridgeResolution;

  /**
   * Resolves 0_F / 0_G via collinear degenerate vector scaling in R^2_RICIS (A4).
   */
  resolveZeroRatioGeometric(
    factorF: number,
    factorG: number,
    labelF?: string,
    labelG?: string
  ): IGeometricBridgeResolution;

  /**
   * Resolves inf_F / inf_G via collinear infinite strip scaling in R^2_RICIS (A5).
   */
  resolveInfinityRatioGeometric(
    factorF: number,
    factorG: number,
    labelF?: string,
    labelG?: string
  ): IGeometricBridgeResolution;

  /**
   * Resolves inf_F - inf_G via vertical vector subtraction in R^2_RICIS (A7).
   */
  resolveInfinitySubtractionGeometric(
    factorF: number,
    factorG: number,
    labelF?: string,
    labelG?: string
  ): IGeometricBridgeResolution;

  /**
   * Resolves 0_F - 0_G via horizontal vector subtraction in R^2_RICIS (A8).
   */
  resolveZeroSubtractionGeometric(
    factorF: number,
    factorG: number,
    labelF?: string,
    labelG?: string
  ): IGeometricBridgeResolution;

  /**
   * Universal resolver for any singularity operation in R^2_RICIS.
   */
  resolveOperation(
    op: GeometricBridgeOperationType,
    factorF: number,
    factorG: number,
    labelF?: string,
    labelG?: string
  ): IGeometricBridgeResolution;
}
