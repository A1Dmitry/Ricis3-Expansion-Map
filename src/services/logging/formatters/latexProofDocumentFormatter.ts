/**
 * RICIS-III LaTeX Proof Document Formatter
 * Formats mathematical proof steps (Phases -1...6) into academic LaTeX specification.
 */

import type { ProofStep } from '../../../model/types';
import type {
  IDocumentFormatter,
  ILogRecord,
  IProofDocumentMetadata,
} from '../contracts/ricisLog.contracts';

export class LatexProofDocumentFormatter
  implements IDocumentFormatter<ProofStep, string, IProofDocumentMetadata>
{
  public format(
    entries: readonly ILogRecord<ProofStep>[],
    metadata?: IProofDocumentMetadata
  ): string {
    const meta = metadata ?? {};
    const title = meta.title ?? 'RICIS-III Proof Specification';
    const author = meta.author ?? 'Dmitry V. Aleinikov';
    const orcid = meta.orcid ? ` (ORCID: ${meta.orcid})` : '';
    const doi = meta.doi ?? '10.5281/zenodo.21517353';
    const targetFunction = meta.targetFunction ?? '';
    const finalInvariant = meta.finalInvariant ?? '';

    const lines: string[] = [
      `\\section*{${title}}`,
      `\\textbf{Author:} ${author}${orcid}`,
      `\\textbf{DOI:} \\href{https://doi.org/${doi}}{${doi}}`,
    ];

    if (targetFunction) {
      lines.push(`\\textbf{Target Function:} $${targetFunction}$`);
    }

    lines.push('\\vspace{0.5em}');

    for (const record of entries) {
      const step = record.data;
      if (!step) continue;

      const ruleStr = step.rule ?? step.action ?? 'RICIS_RULE';
      const titleStr = step.title ?? step.name ?? 'Step';
      const escapedRule = ruleStr.replace(/_/g, '\\_');
      lines.push(`\\subsection*{${titleStr}}`);
      lines.push(`\\textbf{Axiom / Rule:} \\texttt{${escapedRule}}`);
      if (step.expression) {
        lines.push(`\\[ ${step.expression} \\]`);
      }
      if (step.description) {
        lines.push(`${step.description}\\\\`);
      }
    }

    if (finalInvariant) {
      lines.push('\\vspace{0.5em}');
      lines.push(`\\textbf{Final Invariant:} $${finalInvariant}$`);
    }

    return lines.join('\n');
  }
}
