// ============================================================================
// RICIS-III LEAN TRACE VIEWMODEL FACTORY (MVVM)
// Transforms Real ProofStep[] into Typed Lean 4 AST Proof Steps
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type {
  ILeanTraceViewModelFactory,
  IProofTraceExecutionModel,
  ILeanTraceDocumentViewModel,
  ILeanStepViewModel,
} from '../contracts/leanMvvm.contracts';
import type { ProofStep } from '../../../model/types';

export class LeanTraceViewModelFactory implements ILeanTraceViewModelFactory {
  public createViewModel(model: IProofTraceExecutionModel): ILeanTraceDocumentViewModel {
    const rawId = (model.taskId || 'proof_task').replace(/[^a-zA-Z0-9_]/g, '_');
    const theoremName = model.theoremName?.trim() ? model.theoremName.trim() : `theorem_${rawId}`;
    const derivationTheoremName = `${theoremName}_derivation`;

    const rawInit = model.initialExpression.trim();
    const rawFinal = model.finalInvariant.trim();

    const stepViewModels: ILeanStepViewModel[] = [];
    const derivationChain: string[] = [];

    // Преобразуем реальные шаги ProofStep[] в тактики Lean 4
    if (model.steps && model.steps.length > 0) {
      model.steps.forEach((step, index) => {
        const stepVm = this.transformStep(step, index, rawId);
        stepViewModels.push(stepVm);
      });
    } else {
      // Fallback на базовую аксиому при пустом массиве шагов
      stepViewModels.push({
        stepIndex: 1,
        phaseTitle: 'Phase 2: Invariant Reduction',
        ruleConstructor: 'RICIS.AxiomRule.L1_Identity',
        beforeAstRepr: 'x',
        afterAstRepr: '1.0',
        tacticLine: 'exact RICIS.Step.l1_self_div x',
      });
    }

    derivationChain.push(`apply RICIS.Derivation.step (${theoremName})`);
    derivationChain.push('apply RICIS.Derivation.refl');

    return {
      theoremName,
      derivationTheoremName,
      taskId: model.taskId,
      taskTitle: model.taskTitle,
      initialExpr: rawInit,
      finalInvariant: rawFinal,
      initialAst: rawInit,
      finalAst: rawFinal,
      stepViewModels,
      derivationChain,
    };
  }

  private transformStep(
    step: ProofStep,
    index: number,
    rawId: string
  ): ILeanStepViewModel {
    const expr = step.expression || '';
    const action = step.action || '';
    const name = step.name || '';
    const combined = `${name} ${action} ${expr}`.toUpperCase();

    let ruleConstructor = 'RICIS.AxiomRule.L1_Identity';
    let tacticLine = 'exact RICIS.Step.l1_self_div x';

    if (combined.includes('A6') || (expr.includes('0_') && expr.includes('inf_'))) {
      ruleConstructor = 'RICIS.AxiomRule.A6_GeometricBridge';
      const a6Match = expr.match(/0_([a-zA-Z0-9.]+)\s*[*x×]\s*inf_([a-zA-Z0-9.]+)/i);
      const fVal = a6Match ? a6Match[1] : 'F';
      const gVal = a6Match ? a6Match[2] : 'G';
      const fNum = parseFloat(fVal || '1');
      const gNum = parseFloat(gVal || '1');

      tacticLine = `exact RICIS.Step.a6_skew_bridge origF_${rawId} origG_${rawId} (RICIS.RExpr.constVal ${isNaN(fNum) ? '1.0' : fNum.toFixed(1)}) (RICIS.RExpr.constVal ${isNaN(gNum) ? '1.0' : gNum.toFixed(1)})`;
    } else if (combined.includes('A4') || (expr.includes('0_') && expr.includes('/') && expr.includes('0_'))) {
      ruleConstructor = 'RICIS.AxiomRule.A4_ZeroRatio';
      tacticLine = `exact RICIS.Step.a4_zero_div origF_${rawId} origG_${rawId} (RICIS.RExpr.constVal 1.0) (RICIS.RExpr.constVal 1.0)`;
    } else if (combined.includes('A1') || (expr.includes('/') && expr.includes('0'))) {
      ruleConstructor = 'RICIS.AxiomRule.A1_Indexing';
      tacticLine = `exact RICIS.Step.a1_div_zero num orig_${rawId}`;
    } else if (combined.includes('SP1') || expr.includes('(x')) {
      ruleConstructor = 'RICIS.AxiomRule.SP1_FactorIsolation';
      tacticLine = 'exact RICIS.Step.sp1_clean_factor f h';
    }

    const numericPhase = typeof step.phase === 'number' ? step.phase : parseInt(String(step.phase), 10);
    const resolvedStepIndex = !isNaN(numericPhase) ? numericPhase : index + 1;

    return {
      stepIndex: resolvedStepIndex,
      phaseTitle: `${step.phase}: ${step.name}`,
      ruleConstructor,
      beforeAstRepr: expr,
      afterAstRepr: expr,
      tacticLine,
    };
  }
}

