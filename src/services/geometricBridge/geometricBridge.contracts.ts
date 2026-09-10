// ============================================================================
// RICIS-III v7.7 GEOMETRIC BRIDGE (CORE COMPUTATIONAL MECHANIC) CONTRACTS
// Space: R^2_RICIS | 0_F x inf_G = det(u, v) = F * G
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

/**
 * Geometric Bridge Computation Result:
 * u = (F, 0) - Degenerate object (segment of length F with 0 thickness)
 * v = (0, G) - Infinite object (infinite strip of width G)
 * det(u, v) = u_x * v_y - u_y * v_x = F * G
 */
export interface IGeometricBridgeResolution {
  readonly degenerateVectorU: IRicisVector2D; // (F, 0)
  readonly infiniteVectorV: IRicisVector2D;   // (0, G)
  readonly uVector?: IRicisVector2D;          // Alias for degenerateVectorU
  readonly vVector?: IRicisVector2D;          // Alias for infiniteVectorV
  readonly skewProductDeterminant: number;     // F * G
  readonly exactInvariantArea: number;         // Area in R^2_RICIS
  readonly areaInvariant?: number;             // Alias for exactInvariantArea
  readonly isDiagonalTelescope: boolean;       // F == G => F^2
  readonly classicalComparison: {
    readonly classicalOutcome: 'NaN' | 'UNDEFINED_LIMIT';
    readonly cauchyLimitRequired: false;
  };
  readonly computationalComplexity: 'O(1)';
  readonly complexity?: 'O(1)';               // Alias
  readonly formulaLatex: string;
  readonly axiomApplied?: string;              // e.g. 'A6_GENERAL_PRODUCT'
  readonly geometricMeaning?: string;
}

export interface IGeometricBridgeEngine {
  resolveGeometricBridge(
    factorF: number,
    factorG: number,
    labelF?: string,
    labelG?: string
  ): IGeometricBridgeResolution;
}
