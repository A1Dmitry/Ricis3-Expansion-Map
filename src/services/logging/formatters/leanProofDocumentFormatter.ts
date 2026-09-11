/**
 * RICIS-III Lean 4 Proof Document Formatter
 * Translates logged ProofStep records into formal Lean 4 code using TraceDrivenLeanProofGenerator.
 */

import type { ProofStep } from '../../../model/types';
import type {
  IDocumentFormatter,
  ILogRecord,
  IProofDocumentMetadata,
} from '../contracts/ricisLog.contracts';
import { createTraceDrivenLeanProofGenerator } from '../../leanCodegen';
import type { IProofTraceExecutionModel } from '../../leanCodegen/contracts/leanMvvm.contracts';

export class LeanProofDocumentFormatter
  implements IDocumentFormatter<ProofStep, string, IProofDocumentMetadata>
{
  private readonly leanGenerator = createTraceDrivenLeanProofGenerator();

  public format(
    entries: readonly ILogRecord<ProofStep>[],
    metadata?: IProofDocumentMetadata
  ): string {
    const steps: ProofStep[] = [];
    for (const rec of entries) {
      if (rec.data) {
        steps.push(rec.data);
      }
    }

    const taskId = (metadata?.taskId as string) || 'registry-118';
    const taskTitle = (metadata?.taskTitle as string) || 'RICIS Proof Derivation';
    const theoremName = (metadata?.theoremName as string) || 'ricis_proof_theorem';
    const initialExpression = (metadata?.initialExpression as string) || '0_F * inf_G';
    const finalInvariant = (metadata?.finalInvariant as string) || 'F * G';

    const verifiedAxioms = Array.from(
      new Set(steps.map((s) => s.rule ?? s.action).filter((r): r is string => Boolean(r)))
    );

    const model: IProofTraceExecutionModel = {
      taskId,
      taskTitle,
      theoremName,
      initialExpression,
      finalInvariant,
      verifiedAxioms,
      steps,
      complexity: 'O(1)',
    };

    return this.leanGenerator.generateProofFromTrace(model);
  }
}
