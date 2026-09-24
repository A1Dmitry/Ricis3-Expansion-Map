import { ICanonicalReport } from '../../model/governance';

/**
 * Utility for generating and validating the 12-point canonical report structure
 * as defined in the RCVAP protocol (AGENTS.md).
 */
export class CanonicalReportGenerator {
  /**
   * Generates a structured report from provided data, ensuring all 12 sections are addressed.
   */
  public static generate(data: Partial<ICanonicalReport>): ICanonicalReport {
    const report: ICanonicalReport = {
      originalGoal: data.originalGoal || 'NOT_SPECIFIED',
      result: data.result || 'NOT_SPECIFIED',
      verification: data.verification || 'SELF_REPORTED',
      positiveResults: data.positiveResults || [],
      negativeResults: data.negativeResults || [],
      tukhtaFound: data.tukhtaFound || [],
      rootCauses: data.rootCauses || [],
      repairs: data.repairs || [],
      remainingRisks: data.remainingRisks || [],
      evidence: data.evidence || [],
      finalStatus: data.finalStatus || 'HYPOTHESIS',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0,
    };

    this.validate(report);
    return report;
  }

  /**
   * Validates that the report adheres to the 12-point structure.
   * Throws an error if mandatory fields are missing or logically inconsistent.
   */
  public static validate(report: ICanonicalReport): void {
    const errors: string[] = [];

    if (!report.originalGoal || report.originalGoal === 'NOT_SPECIFIED') errors.push('1. ORIGINAL_GOAL is mandatory');
    if (!report.result || report.result === 'NOT_SPECIFIED') errors.push('2. RESULT is mandatory');
    if (!report.verification || report.verification === 'NOT_SPECIFIED') errors.push('3. VERIFICATION is mandatory');
    
    // Check that lists are present (even if empty)
    if (!Array.isArray(report.positiveResults)) errors.push('4. POSITIVE_RESULTS must be an array');
    if (!Array.isArray(report.negativeResults)) errors.push('5. NEGATIVE_RESULTS must be an array');
    if (!Array.isArray(report.tukhtaFound)) errors.push('6. TUKHTA_FOUND must be an array');
    if (!Array.isArray(report.rootCauses)) errors.push('7. ROOT_CAUSES must be an array');
    if (!Array.isArray(report.repairs)) errors.push('8. REPAIRS must be an array');
    if (!Array.isArray(report.remainingRisks)) errors.push('9. REMAINING_RISKS must be an array');
    if (!Array.isArray(report.evidence)) errors.push('10. EVIDENCE must be an array');

    if (!report.finalStatus) errors.push('11. FINAL_STATUS is mandatory');
    if (typeof report.confidence !== 'number') errors.push('12. CONFIDENCE must be a number');

    // Anti-Tukhta check: if repairs are listed but no root causes, or vice versa
    if (report.repairs.length > 0 && report.rootCauses.length === 0) {
      errors.push('REPAIRS require documented ROOT_CAUSES (Anti-Tukhta Law)');
    }

    if (report.finalStatus === 'COMPLETED' && report.confidence < 0.9) {
      errors.push('COMPLETED status requires confidence >= 0.9');
    }

    if (errors.length > 0) {
      throw new Error(`Canonical Report Validation Failed: ${errors.join('; ')}`);
    }
  }

  /**
   * Formats the report as a human-readable text block.
   */
  public static formatToText(report: ICanonicalReport): string {
    return [
      `1. ORIGINAL GOAL: ${report.originalGoal}`,
      `2. RESULT: ${report.result}`,
      `3. VERIFICATION: ${report.verification}`,
      `4. POSITIVE RESULTS: ${report.positiveResults.join(', ') || 'None'}`,
      `5. NEGATIVE RESULTS: ${report.negativeResults.join(', ') || 'None'}`,
      `6. TUKHTA FOUND: ${report.tukhtaFound.join(', ') || 'None'}`,
      `7. ROOT CAUSES: ${report.rootCauses.join(', ') || 'None'}`,
      `8. REPAIRS: ${report.repairs.join(', ') || 'None'}`,
      `9. REMAINING RISKS: ${report.remainingRisks.join(', ') || 'None'}`,
      `10. EVIDENCE: ${report.evidence.join(', ') || 'None'}`,
      `11. FINAL STATUS: ${report.finalStatus}`,
      `12. CONFIDENCE: ${(report.confidence * 100).toFixed(1)}%`,
    ].join('\n');
  }
}
