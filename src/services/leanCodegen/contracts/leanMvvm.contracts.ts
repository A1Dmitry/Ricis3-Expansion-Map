// ============================================================================
// RICIS-III MVVM LEAN 4 TRACE-DRIVEN CONTRACTS
// Strictly Reusing Existing ProofStep & AST Core (DRY, Clean Architecture)
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type { ProofStep } from '../../../model/types';

// ----------------------------------------------------------------------------
// 1. MODEL DTO (Существующие типы ядра)
// ----------------------------------------------------------------------------

/** Входная доменная модель трассировки для синтеза доказательства */
export interface IProofTraceExecutionModel {
  readonly taskId: string;
  readonly taskTitle: string;
  readonly initialExpression: string;
  readonly finalInvariant: string;
  readonly steps: readonly ProofStep[];
  readonly verifiedAxioms?: readonly string[];
  readonly complexity?: string; // O(1)
}

// ----------------------------------------------------------------------------
// 2. VIEWMODEL (Трансформация шагов ProofStep в тактики Lean 4 AST)
// ----------------------------------------------------------------------------

/** Представление отдельного шага деривации для Lean 4 шаблона */
export interface ILeanStepViewModel {
  readonly stepIndex: number;
  readonly phaseTitle: string;
  readonly ruleConstructor: string; // e.g. "RICIS.Step.a6_skew_bridge", "RICIS.Step.a4_zero_div"
  readonly beforeAstRepr: string;
  readonly afterAstRepr: string;
  readonly tacticLine: string;
}

/** Итоговая ViewModel, подготовленная для связывания с шаблоном */
export interface ILeanTraceDocumentViewModel {
  readonly theoremName: string;
  readonly derivationTheoremName: string;
  readonly taskId: string;
  readonly taskTitle: string;
  readonly initialExpr: string;
  readonly finalInvariant: string;
  readonly initialAst: string;
  readonly finalAst: string;
  readonly stepViewModels: readonly ILeanStepViewModel[];
  readonly derivationChain: readonly string[];
}

/** Интерфейс фабрики ViewModel */
export interface ILeanTraceViewModelFactory {
  createViewModel(model: IProofTraceExecutionModel): ILeanTraceDocumentViewModel;
}

// ----------------------------------------------------------------------------
// 3. VIEW / TEMPLATE (Связывание шаблона ядра с ViewModel)
// ----------------------------------------------------------------------------

export interface ILeanTraceDocumentTemplate {
  /** Связывает ViewModel с ядром AST Lean 4 и генерирует автономный файл */
  render(viewModel: ILeanTraceDocumentViewModel): string;
}

// ----------------------------------------------------------------------------
// 4. ОРКЕСТРАТОР MVVM СИНТЕЗА LEAN 4
// ----------------------------------------------------------------------------

export interface ITraceDrivenLeanProofGenerator {
  generateProofFromTrace(model: IProofTraceExecutionModel): string;
}
