// ============================================================================
// RICIS-III LEAN TRACE DOCUMENT TEMPLATE (MVVM VIEW)
// Binds Deep Embedding AST Core Preamble with Synthesized Theorem ViewModel
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type { ILeanPreambleProvider } from '../contracts/ILeanAstCodeGenerator';
import type {
  ILeanTraceDocumentTemplate,
  ILeanTraceDocumentViewModel,
} from '../contracts/leanMvvm.contracts';

export class LeanTraceDocumentTemplate implements ILeanTraceDocumentTemplate {
  constructor(private readonly preambleProvider: ILeanPreambleProvider) {}

  public render(vm: ILeanTraceDocumentViewModel): string {
    const preamble = this.preambleProvider.getDeepEmbeddingPreamble();
    const theoremBlock = this.renderTheorem(vm);

    return `${preamble}\n${theoremBlock}`;
  }

  private renderTheorem(vm: ILeanTraceDocumentViewModel): string {
    const thName = vm.theoremName;
    const derivName = vm.derivationTheoremName;
    const primaryStep = vm.stepViewModels[vm.stepViewModels.length - 1] || vm.stepViewModels[0];
    const rule = primaryStep ? primaryStep.ruleConstructor : 'RICIS.AxiomRule.L1_Identity';

    const header = `-- ----------------------------------------------------------------------------
-- TRACE-DRIVEN FORMAL PROOF: ${thName}
-- Task ID: ${vm.taskId}
-- Claim: ${vm.taskTitle}
-- Initial Expression: ${vm.initialExpr}
-- Resolved Invariant: ${vm.finalInvariant}
-- Verified Steps Trace Count: ${vm.stepViewModels.length}
-- Provenance: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
-- ----------------------------------------------------------------------------`;

    let theoremSignature = '';

    if (rule.includes('A6_GeometricBridge')) {
      const a6Match = vm.initialExpr.match(/0_([a-zA-Z0-9.]+)\s*\*\s*inf_([a-zA-Z0-9.]+)/);
      const fVal = a6Match ? a6Match[1] : 'F';
      const gVal = a6Match ? a6Match[2] : 'G';
      const fNum = parseFloat(fVal || '1');
      const gNum = parseFloat(gVal || '1');

      theoremSignature = `def origF_${vm.taskId} : RICIS.IndexOrigin := { symbol := "${fVal}", originalExpr := "0_{${fVal}}", evaluationPoint := "singular_cut" }
def origG_${vm.taskId} : RICIS.IndexOrigin := { symbol := "${gVal}", originalExpr := "inf_{${gVal}}", evaluationPoint := "singular_cut" }

theorem ${thName} (F G : Float) :
    RICIS.Step (RICIS.RExpr.monadMul (RICIS.RExpr.zeroMonad origF_${vm.taskId}) (RICIS.RExpr.infMonad origG_${vm.taskId}))
               (RICIS.RExpr.mul (RICIS.RExpr.constVal ${isNaN(fNum) ? '1.0' : fNum.toFixed(1)}) (RICIS.RExpr.constVal ${isNaN(gNum) ? '1.0' : gNum.toFixed(1)}))
               RICIS.AxiomRule.A6_GeometricBridge := by
  ${primaryStep?.tacticLine || 'rfl'}

theorem ${derivName} (F G : Float) :
    RICIS.Derivation (RICIS.RExpr.monadMul (RICIS.RExpr.zeroMonad origF_${vm.taskId}) (RICIS.RExpr.infMonad origG_${vm.taskId}))
                     (RICIS.RExpr.mul (RICIS.RExpr.constVal ${isNaN(fNum) ? '1.0' : fNum.toFixed(1)}) (RICIS.RExpr.constVal ${isNaN(gNum) ? '1.0' : gNum.toFixed(1)})) := by
  apply RICIS.Derivation.step (${thName} F G)
  apply RICIS.Derivation.refl`;
    } else if (rule.includes('A1_Indexing')) {
      theoremSignature = `def orig_${vm.taskId} : RICIS.IndexOrigin := { symbol := "F", originalExpr := "${vm.initialExpr.replace(/"/g, '')}", evaluationPoint := "zero_pole" }

theorem ${thName} (num : RICIS.RExpr RICIS.Ty.scalar) :
    RICIS.Step (RICIS.RExpr.scalarDivZero num orig_${vm.taskId})
               (RICIS.RExpr.infMonad orig_${vm.taskId})
               RICIS.AxiomRule.A1_Indexing := by
  ${primaryStep?.tacticLine || 'rfl'}

theorem ${derivName} (num : RICIS.RExpr RICIS.Ty.scalar) :
    RICIS.Derivation (RICIS.RExpr.scalarDivZero num orig_${vm.taskId})
                     (RICIS.RExpr.infMonad orig_${vm.taskId}) := by
  apply RICIS.Derivation.step (${thName} num)
  apply RICIS.Derivation.refl`;
    } else {
      theoremSignature = `theorem ${thName} (x : RICIS.RExpr RICIS.Ty.scalar) :
    RICIS.Step (RICIS.RExpr.div x x) (RICIS.RExpr.constVal 1.0)
               RICIS.AxiomRule.L1_Identity := by
  exact RICIS.Step.l1_self_div x

theorem ${derivName} (x : RICIS.RExpr RICIS.Ty.scalar) :
    RICIS.Derivation (RICIS.RExpr.div x x) (RICIS.RExpr.constVal 1.0) := by
  apply RICIS.Derivation.step (${thName} x)
  apply RICIS.Derivation.refl`;
    }

    return `${header}\n\n${theoremSignature}\n`;
  }
}
