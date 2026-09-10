// ============================================================================
// RICIS-III v7.7 GEOMETRIC BRIDGE ENGINE (CORE COMPUTATIONAL MECHANIC)
// Space: R^2_RICIS | 0_F x inf_G = det(u, v) = u_x * v_y - u_y * v_x = F * G
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type {
  GeometricBridgeOperationType,
  IGeometricBridgeEngine,
  IGeometricBridgeResolution,
} from './geometricBridge.contracts';

export class GeometricBridgeEngine implements IGeometricBridgeEngine {
  /**
   * Resolves the classical indeterminate form 0_F x inf_G via the Skew Product
   * (Determinant) of two orthogonal vectors in R^2_RICIS:
   *   u = (F, 0) : Degenerate object (segment of length F with 0 thickness)
   *   v = (0, G) : Infinite object (infinite strip of width G)
   *
   * det(u, v) = u_x * v_y - u_y * v_x = F * G - 0 * 0 = F * G
   *
   * Computational Complexity: O(1)
   */
  public resolveGeometricBridge(
    factorF: number,
    factorG: number,
    labelF = `${factorF}`,
    labelG = `${factorG}`
  ): IGeometricBridgeResolution {
    const u_x = factorF;
    const u_y = 0;
    const v_x = 0;
    const v_y = factorG;

    // Skew Product Determinant in R^2_RICIS:
    const det = u_x * v_y - u_y * v_x; // F * G - 0 * 0 = F * G
    const isDiagonalTelescope = factorF === factorG;

    const formulaLatex = isDiagonalTelescope
      ? `0_{${labelF}} \\times \\infty_{${labelG}} = \\det(u, v) = ${labelF}^2 = ${det}`
      : `0_{${labelF}} \\times \\infty_{${labelG}} = \\det(u, v) = ${labelF} \\cdot ${labelG} = ${det}`;

    const u = {
      x: u_x,
      y: u_y,
      label: `0_${labelF} (length ${labelF}, thickness 0)`,
    };
    const v = {
      x: v_x,
      y: v_y,
      label: `∞_${labelG} (width ${labelG})`,
    };

    return {
      operation: 'A6_PRODUCT_0_INF',
      invariantKind: 'AREA_INVARIANT',
      degenerateVectorU: u,
      infiniteVectorV: v,
      uVector: u,
      vVector: v,
      skewProductDeterminant: det,
      exactInvariantArea: det,
      areaInvariant: det,
      invariantValue: det,
      isDiagonalTelescope,
      isIdentitySatisfied: isDiagonalTelescope,
      classicalComparison: {
        classicalOutcome: 'NaN',
        cauchyLimitRequired: false,
        explanation: 'Classical analysis returns NaN / indeterminate form requiring limit approximations.',
      },
      computationalComplexity: 'O(1)',
      complexity: 'O(1)',
      formulaLatex,
      axiomApplied: 'A6_GENERAL_PRODUCT',
      geometricMeaning: 'Invariant Area in R^2_RICIS resolved via 2D Skew Product Determinant',
    };
  }

  /**
   * Resolves 0_F / 0_G via collinear degenerate vector scaling in R^2_RICIS (A4 / SP3 / SP4).
   * Ratio of lengths of horizontal degenerate segments:
   *   u1 = (F, 0)
   *   u2 = (G, 0)
   * scale(u1, u2) = F / G  (with L1_IDENTITY = 1 when F = G, even if 0/0).
   */
  public resolveZeroRatioGeometric(
    factorF: number,
    factorG: number,
    labelF = `${factorF}`,
    labelG = `${factorG}`
  ): IGeometricBridgeResolution {
    const isIdentity = factorF === factorG || (labelF === labelG && labelF !== '');
    const ratio = isIdentity ? 1 : (factorG !== 0 ? factorF / factorG : (factorF === 0 ? 1 : factorF));

    const u = {
      x: factorF,
      y: 0,
      label: `0_${labelF} (numerator segment)`,
    };
    const v = {
      x: factorG,
      y: 0,
      label: `0_${labelG} (denominator segment)`,
    };

    const formulaLatex = `\\frac{0_{${labelF}}}{0_{${labelG}}} = \\frac{${labelF}}{${labelG}} = ${ratio}`;

    return {
      operation: 'A4_RATIO_0_0',
      invariantKind: 'SCALE_INVARIANT',
      degenerateVectorU: u,
      infiniteVectorV: v,
      uVector: u,
      vVector: v,
      skewProductDeterminant: ratio,
      exactInvariantArea: ratio,
      areaInvariant: ratio,
      invariantValue: ratio,
      isDiagonalTelescope: isIdentity,
      isIdentitySatisfied: isIdentity,
      classicalComparison: {
        classicalOutcome: 'INDETERMINATE_FORM',
        cauchyLimitRequired: false,
        explanation: 'Classical analysis treats 0/0 as undefined, violating L1 Identity (X=X => X/X=1).',
      },
      computationalComplexity: 'O(1)',
      complexity: 'O(1)',
      formulaLatex,
      axiomApplied: 'A4_ZERO_RATIO',
      geometricMeaning: 'Linear Scale Invariant along Degenerate X-axis in R^2_RICIS',
    };
  }

  /**
   * Resolves inf_F / inf_G via collinear infinite strip scaling in R^2_RICIS (A5).
   * Ratio of widths of vertical infinite strips:
   *   v1 = (0, F)
   *   v2 = (0, G)
   * scale(v1, v2) = F / G  (with L1_IDENTITY = 1 when F = G).
   */
  public resolveInfinityRatioGeometric(
    factorF: number,
    factorG: number,
    labelF = `${factorF}`,
    labelG = `${factorG}`
  ): IGeometricBridgeResolution {
    const isIdentity = factorF === factorG || (labelF === labelG && labelF !== '');
    const ratio = isIdentity ? 1 : (factorG !== 0 ? factorF / factorG : (factorF === 0 ? 1 : factorF));

    const u = {
      x: 0,
      y: factorF,
      label: `∞_${labelF} (numerator strip)`,
    };
    const v = {
      x: 0,
      y: factorG,
      label: `∞_${labelG} (denominator strip)`,
    };

    const formulaLatex = `\\frac{\\infty_{${labelF}}}{\\infty_{${labelG}}} = \\frac{${labelF}}{${labelG}} = ${ratio}`;

    return {
      operation: 'A5_RATIO_INF_INF',
      invariantKind: 'SCALE_INVARIANT',
      degenerateVectorU: u,
      infiniteVectorV: v,
      uVector: u,
      vVector: v,
      skewProductDeterminant: ratio,
      exactInvariantArea: ratio,
      areaInvariant: ratio,
      invariantValue: ratio,
      isDiagonalTelescope: isIdentity,
      isIdentitySatisfied: isIdentity,
      classicalComparison: {
        classicalOutcome: 'INDETERMINATE_FORM',
        cauchyLimitRequired: false,
        explanation: 'Classical analysis treats ∞/∞ as undefined form requiring L\'Hôpital rule.',
      },
      computationalComplexity: 'O(1)',
      complexity: 'O(1)',
      formulaLatex,
      axiomApplied: 'A5_INFINITY_RATIO',
      geometricMeaning: 'Strip Width Scale Invariant along Infinite Y-axis in R^2_RICIS',
    };
  }

  /**
   * Resolves inf_F - inf_G via vertical vector subtraction in R^2_RICIS (A7).
   * v1 - v2 = (0, F - G) => inf_{F - G}.
   */
  public resolveInfinitySubtractionGeometric(
    factorF: number,
    factorG: number,
    labelF = `${factorF}`,
    labelG = `${factorG}`
  ): IGeometricBridgeResolution {
    const diff = factorF - factorG;
    const isIdentity = factorF === factorG;

    const u = {
      x: 0,
      y: factorF,
      label: `∞_${labelF}`,
    };
    const v = {
      x: 0,
      y: factorG,
      label: `∞_${labelG}`,
    };

    const formulaLatex = `\\infty_{${labelF}} - \\infty_{${labelG}} = \\infty_{${labelF} - ${labelG}} = \\infty_{${diff}}`;

    return {
      operation: 'A7_SUBTRACTION_INF_INF',
      invariantKind: 'VECTOR_SHIFT_INVARIANT',
      degenerateVectorU: u,
      infiniteVectorV: v,
      uVector: u,
      vVector: v,
      skewProductDeterminant: diff,
      exactInvariantArea: diff,
      areaInvariant: diff,
      invariantValue: diff,
      isDiagonalTelescope: isIdentity,
      isIdentitySatisfied: isIdentity,
      classicalComparison: {
        classicalOutcome: 'INDETERMINATE_FORM',
        cauchyLimitRequired: false,
        explanation: 'Classical analysis loses index information in ∞ - ∞ and claims undefined.',
      },
      computationalComplexity: 'O(1)',
      complexity: 'O(1)',
      formulaLatex,
      axiomApplied: 'A7_INFINITY_SUBTRACTION',
      geometricMeaning: 'Vector Shift Invariant along Infinite Y-axis in R^2_RICIS',
    };
  }

  /**
   * Resolves 0_F - 0_G via horizontal vector subtraction in R^2_RICIS (A8).
   * u1 - u2 = (F - G, 0) => 0_{F - G}.
   */
  public resolveZeroSubtractionGeometric(
    factorF: number,
    factorG: number,
    labelF = `${factorF}`,
    labelG = `${factorG}`
  ): IGeometricBridgeResolution {
    const diff = factorF - factorG;
    const isIdentity = factorF === factorG;

    const u = {
      x: factorF,
      y: 0,
      label: `0_${labelF}`,
    };
    const v = {
      x: factorG,
      y: 0,
      label: `0_${labelG}`,
    };

    const formulaLatex = `0_{${labelF}} - 0_{${labelG}} = 0_{${labelF} - ${labelG}} = 0_{${diff}}`;

    return {
      operation: 'A8_SUBTRACTION_0_0',
      invariantKind: 'VECTOR_SHIFT_INVARIANT',
      degenerateVectorU: u,
      infiniteVectorV: v,
      uVector: u,
      vVector: v,
      skewProductDeterminant: diff,
      exactInvariantArea: diff,
      areaInvariant: diff,
      invariantValue: diff,
      isDiagonalTelescope: isIdentity,
      isIdentitySatisfied: isIdentity,
      classicalComparison: {
        classicalOutcome: 'INDETERMINATE_FORM',
        cauchyLimitRequired: false,
        explanation: 'Classical analysis collapses all zeros to scalar 0, losing topological generating origin.',
      },
      computationalComplexity: 'O(1)',
      complexity: 'O(1)',
      formulaLatex,
      axiomApplied: 'A8_ZERO_SUBTRACTION',
      geometricMeaning: 'Vector Shift Invariant along Degenerate X-axis in R^2_RICIS',
    };
  }

  /**
   * Universal resolver for any singularity operation in R^2_RICIS.
   */
  public resolveOperation(
    op: GeometricBridgeOperationType,
    factorF: number,
    factorG: number,
    labelF = `${factorF}`,
    labelG = `${factorG}`
  ): IGeometricBridgeResolution {
    switch (op) {
      case 'A6_PRODUCT_0_INF':
        return this.resolveGeometricBridge(factorF, factorG, labelF, labelG);
      case 'A4_RATIO_0_0':
        return this.resolveZeroRatioGeometric(factorF, factorG, labelF, labelG);
      case 'A5_RATIO_INF_INF':
        return this.resolveInfinityRatioGeometric(factorF, factorG, labelF, labelG);
      case 'A7_SUBTRACTION_INF_INF':
        return this.resolveInfinitySubtractionGeometric(factorF, factorG, labelF, labelG);
      case 'A8_SUBTRACTION_0_0':
        return this.resolveZeroSubtractionGeometric(factorF, factorG, labelF, labelG);
      default:
        return this.resolveGeometricBridge(factorF, factorG, labelF, labelG);
    }
  }
}
