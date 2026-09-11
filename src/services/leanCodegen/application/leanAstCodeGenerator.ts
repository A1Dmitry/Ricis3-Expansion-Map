/**
 * src/services/leanCodegen/application/leanAstCodeGenerator.ts
 * Сервис генерации компилируемого Lean 4 кода на базе глубокого AST и аксиом RICIS-III
 * Реализация принципов SOLID, DRY, ООП (инкапсуляция, полиморфизм через интерфейсы)
 * Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
 */

import type {
  ILeanAstCodeGenerator,
  ILeanPreambleProvider,
  ILeanAstParser,
  GenerateLeanProofInput,
  LeanCodegenOptions,
  LeanCodegenResult,
} from '../contracts/ILeanAstCodeGenerator';
import type { ProblemNode } from '../../../model/types';
import type { LeanExprAst } from '../contracts/leanAst.types';

export class LeanAstCodeGenerator implements ILeanAstCodeGenerator {
  constructor(
    private readonly preambleProvider: ILeanPreambleProvider,
    private readonly astParser: ILeanAstParser
  ) {}

  public generateProofDocument(
    input: GenerateLeanProofInput,
    options?: LeanCodegenOptions
  ): LeanCodegenResult {
    const includePreamble = options?.includeFullPreamble !== false;
    const derivation = this.astParser.synthesizeDerivation(input);

    const preamble = includePreamble ? this.preambleProvider.getDeepEmbeddingPreamble() : '';
    const proofBody = this.renderProof(input, derivation);

    const fullCode = includePreamble ? `${preamble}\n${proofBody}` : proofBody;
    const lines = fullCode.split('\n');

    // Проверка баланса скобок
    const validationErrors: string[] = [];
    if (options?.validateSyntax !== false) {
      const balanceErrors = this.validateBrackets(fullCode);
      if (balanceErrors.length > 0) {
        validationErrors.push(...balanceErrors);
      }
    }

    const preambleLines = preamble ? preamble.split('\n').length : 0;
    const proofLines = proofBody.split('\n').length;

    return {
      success: validationErrors.length === 0,
      code: fullCode,
      lineCount: lines.length,
      theoremName: derivation.theoremName,
      derivation,
      preambleLines,
      proofLines,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    };
  }

  public generateFromNode(
    node: ProblemNode,
    options?: LeanCodegenOptions
  ): LeanCodegenResult {
    const input: GenerateLeanProofInput = {
      nodeId: node.id,
      title: node.title,
      targetFunction: node.targetFunction,
      singularityHint: node.singularityHint,
      initialExpr: node.targetFunction,
      resolvedInvariant: node.singularityHint,
    };
    return this.generateProofDocument(input, options);
  }

  private renderProof(input: GenerateLeanProofInput, derivation: typeof this.astParser extends { synthesizeDerivation: (...args: any[]) => infer R } ? R : any): string {
    const thName = derivation.theoremName;
    const rawInit = input.initialExpr || input.targetFunction || '0_F * inf_G';
    const rawFinal = input.resolvedInvariant || 'F * G';

    const header = `-- ----------------------------------------------------------------------------
-- PROOF THEOREM: ${thName}
-- Claim: ${input.title}
-- Initial Expression: ${rawInit}
-- Resolved Invariant: ${rawFinal}
-- Provenance: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
-- ----------------------------------------------------------------------------`;

    // Генерация специализированных конструкций в зависимости от характера сингулярности
    let theoremDef = '';

    if (rawInit.includes('0_') && rawInit.includes('inf_')) {
      const a6Match = rawInit.match(/0_([a-zA-Z0-9.]+)\s*\*\s*inf_([a-zA-Z0-9.]+)/);
      const fVal = a6Match ? a6Match[1] : 'F';
      const gVal = a6Match ? a6Match[2] : 'G';
      const fNum = parseFloat(fVal || '1');
      const gNum = parseFloat(gVal || '1');
      const invNum = isNaN(fNum) || isNaN(gNum) ? `${fVal} * ${gVal}` : `${fNum * gNum}`;

      theoremDef = `def origF_${thName} : RICIS.IndexOrigin := { symbol := "${fVal}", originalExpr := "0_{${fVal}}", evaluationPoint := "singular_cut" }
def origG_${thName} : RICIS.IndexOrigin := { symbol := "${gVal}", originalExpr := "inf_{${gVal}}", evaluationPoint := "singular_cut" }

def term_${thName}_src : RICIS.RExpr RICIS.Ty.monad :=
  RICIS.RExpr.zeroMonad origF_${thName}

def term_${thName}_dst : RICIS.RExpr RICIS.Ty.monad :=
  RICIS.RExpr.infMonad origG_${thName}

theorem ${thName} (F G : Float) :
    RICIS.Step (RICIS.RExpr.monadMul (RICIS.RExpr.zeroMonad origF_${thName}) (RICIS.RExpr.infMonad origG_${thName}))
               (RICIS.RExpr.mul (RICIS.RExpr.constVal ${isNaN(fNum) ? '1.0' : fNum.toFixed(1)}) (RICIS.RExpr.constVal ${isNaN(gNum) ? '1.0' : gNum.toFixed(1)}))
               RICIS.AxiomRule.A6_GeometricBridge := by
  exact RICIS.Step.a6_skew_bridge origF_${thName} origG_${thName}
    (RICIS.RExpr.constVal ${isNaN(fNum) ? '1.0' : fNum.toFixed(1)})
    (RICIS.RExpr.constVal ${isNaN(gNum) ? '1.0' : gNum.toFixed(1)})

theorem ${thName}_derivation (F G : Float) :
    RICIS.Derivation (RICIS.RExpr.monadMul (RICIS.RExpr.zeroMonad origF_${thName}) (RICIS.RExpr.infMonad origG_${thName}))
                     (RICIS.RExpr.mul (RICIS.RExpr.constVal ${isNaN(fNum) ? '1.0' : fNum.toFixed(1)}) (RICIS.RExpr.constVal ${isNaN(gNum) ? '1.0' : gNum.toFixed(1)})) := by
  apply RICIS.Derivation.step (${thName} F G)
  apply RICIS.Derivation.refl`;
    } else if (rawInit.includes('/') && rawInit.includes('0')) {
      theoremDef = `def orig_${thName} : RICIS.IndexOrigin := { symbol := "F", originalExpr := "${rawInit.replace(/"/g, '')}", evaluationPoint := "zero_pole" }

theorem ${thName} (num : RICIS.RExpr RICIS.Ty.scalar) :
    RICIS.Step (RICIS.RExpr.scalarDivZero num orig_${thName})
               (RICIS.RExpr.infMonad orig_${thName})
               RICIS.AxiomRule.A1_Indexing := by
  exact RICIS.Step.a1_div_zero num orig_${thName}

theorem ${thName}_derivation (num : RICIS.RExpr RICIS.Ty.scalar) :
    RICIS.Derivation (RICIS.RExpr.scalarDivZero num orig_${thName})
                     (RICIS.RExpr.infMonad orig_${thName}) := by
  apply RICIS.Derivation.step (${thName} num)
  apply RICIS.Derivation.refl`;
    } else {
      theoremDef = `theorem ${thName} (f h : RICIS.RExpr RICIS.Ty.scalar) :
    RICIS.Step (RICIS.RExpr.div (RICIS.RExpr.mul f h) f) h
               RICIS.AxiomRule.SP1_FactorIsolation := by
  exact RICIS.Step.sp1_clean_factor f h

theorem ${thName}_derivation (f h : RICIS.RExpr RICIS.Ty.scalar) :
    RICIS.Derivation (RICIS.RExpr.div (RICIS.RExpr.mul f h) f) h := by
  apply RICIS.Derivation.step (${thName} f h)
  apply RICIS.Derivation.refl`;
    }

    return `${header}\n\n${theoremDef}\n`;
  }

  private validateBrackets(code: string): string[] {
    const errors: string[] = [];
    let round = 0;
    let square = 0;
    let curly = 0;

    for (let i = 0; i < code.length; i++) {
      const ch = code[i];
      if (ch === '(') round++;
      if (ch === ')') round--;
      if (ch === '[') square++;
      if (ch === ']') square--;
      if (ch === '{') curly++;
      if (ch === '}') curly--;

      if (round < 0) errors.push(`Unmatched ')' at index ${i}`);
      if (square < 0) errors.push(`Unmatched ']' at index ${i}`);
      if (curly < 0) errors.push(`Unmatched '}' at index ${i}`);
    }

    if (round !== 0) errors.push(`Unbalanced parentheses: ${round}`);
    if (square !== 0) errors.push(`Unbalanced brackets: ${square}`);
    if (curly !== 0) errors.push(`Unbalanced curly braces: ${curly}`);

    return errors;
  }
}
