/**
 * src/services/leanCodegen/contracts/ILeanAstCodeGenerator.ts
 * Контракты входных параметров, результатов и сервиса генерации Lean 4
 * Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
 */

import type { ProblemNode, ProofStep } from '../../../model/types';
import type { LeanExprAst, LeanProofDerivation } from './leanAst.types';

/** Входные DTO для генерации доказательства */
export interface GenerateLeanProofInput {
  readonly nodeId: string;
  readonly title: string;
  readonly targetFunction?: string;
  readonly singularityHint?: string;
  readonly initialExpr?: string;
  readonly resolvedInvariant?: string;
  readonly steps?: readonly ProofStep[];
  readonly authorOrcid?: string;
  readonly doiRecord?: string;
}

/** Опции форматирования и структуры вывода */
export interface LeanCodegenOptions {
  /** Включать ли полную глубокую формализацию ядра (Preamble ~150 строк) */
  readonly includeFullPreamble?: boolean;
  /** Проводить ли валидацию баланса скобок и синтаксиса перед возвратом */
  readonly validateSyntax?: boolean;
}

/** Результат генерации автономного документа Lean 4 */
export interface LeanCodegenResult {
  readonly success: boolean;
  readonly code: string;
  readonly lineCount: number;
  readonly theoremName: string;
  readonly derivation: LeanProofDerivation;
  readonly preambleLines: number;
  readonly proofLines: number;
  readonly validationErrors?: readonly string[];
}

/** Сервис синтаксического анализа и генерации AST Lean */
export interface ILeanAstParser {
  parseExpr(expression: string, originHint?: string): LeanExprAst;
  synthesizeDerivation(input: GenerateLeanProofInput): LeanProofDerivation;
}

/** Сервис поставки эталонного ядра (Preamble) */
export interface ILeanPreambleProvider {
  /** Возвращает 150+ строк автономного формального фундамента Lean 4 */
  getDeepEmbeddingPreamble(): string;
}

/** Главный контракт генератора компилируемого Lean 4 кода */
export interface ILeanAstCodeGenerator {
  generateProofDocument(
    input: GenerateLeanProofInput,
    options?: LeanCodegenOptions
  ): LeanCodegenResult;

  generateFromNode(
    node: ProblemNode,
    options?: LeanCodegenOptions
  ): LeanCodegenResult;
}
