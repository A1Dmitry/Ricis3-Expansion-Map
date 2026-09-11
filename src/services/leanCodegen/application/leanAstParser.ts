/**
 * src/services/leanCodegen/application/leanAstParser.ts
 * Парсер математических выражений и синтезатор деривации RICIS-III в AST Lean
 * Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
 */

import type {
  ILeanAstParser,
  GenerateLeanProofInput,
} from '../contracts/ILeanAstCodeGenerator';
import type {
  LeanExprAst,
  LeanProofDerivation,
  LeanDerivationStep,
  LeanRewriteRule,
} from '../contracts/leanAst.types';

export class LeanAstParser implements ILeanAstParser {
  public parseExpr(expression: string, originHint?: string): LeanExprAst {
    const trimmed = (expression || '').trim();

    // 0_F * inf_G (A6)
    const a6Match = trimmed.match(/0_([a-zA-Z0-9.]+)\s*\*\s*inf_([a-zA-Z0-9.]+)/);
    if (a6Match) {
      const f = a6Match[1]!;
      const g = a6Match[2]!;
      return {
        kind: 'Mul',
        left: { kind: 'ZeroMonad', origin: { symbol: f, originalExpr: `0_{${f}}` } },
        right: { kind: 'InfMonad', origin: { symbol: g, originalExpr: `inf_{${g}}` } },
      };
    }

    // 0_F / 0_G (A4)
    const a4Match = trimmed.match(/0_([a-zA-Z0-9.]+)\s*\/\s*0_([a-zA-Z0-9.]+)/);
    if (a4Match) {
      const f = a4Match[1]!;
      const g = a4Match[2]!;
      return {
        kind: 'Div',
        left: { kind: 'ZeroMonad', origin: { symbol: f, originalExpr: `0_{${f}}` } },
        right: { kind: 'ZeroMonad', origin: { symbol: g, originalExpr: `0_{${g}}` } },
      };
    }

    // Числовая константа
    const num = parseFloat(trimmed);
    if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
      return { kind: 'Const', value: num };
    }

    // Общий строковый атом
    return { kind: 'Const', value: trimmed || originHint || 'X' };
  }

  public synthesizeDerivation(input: GenerateLeanProofInput): LeanProofDerivation {
    const rawId = (input.nodeId || 'unknown_node').replace(/[^a-zA-Z0-9_]/g, '_');
    const theoremName = `theorem_${rawId}`;
    const claimTitle = input.title || 'RICIS Invariant Resolution';

    const rawInitial = input.initialExpr || input.targetFunction || '0_F * inf_G';
    const rawFinal = input.resolvedInvariant || 'F * G';

    const initialExpr = this.parseExpr(rawInitial, 'initial');
    const finalInvariant = this.parseExpr(rawFinal, 'final');

    let rule: LeanRewriteRule = 'A6_GeometricBridge';
    let explanation = 'Applied A6 Geometric Bridge skew product reduction det(u, v) = F * G';

    if (rawInitial.includes('/') && rawInitial.includes('0')) {
      if (rawInitial.includes('0_') && rawInitial.split('/').length === 2 && rawInitial.split('/')[1]?.includes('0_')) {
        rule = 'A4_ZeroRatio';
        explanation = 'Applied A4 Zero Ratio reduction: 0_F / 0_G = F / G';
      } else {
        rule = 'A1_Indexing';
        explanation = 'Applied A1 Indexing / A10 Scalar Division: F / 0 -> inf_F';
      }
    } else if (rawInitial.includes('(x -') || rawInitial.includes('(x +')) {
      rule = 'SP1_Locality';
      explanation = 'Applied SP1 Locality and SP2 Precedence cancellation of identical factors';
    }

    const steps: LeanDerivationStep[] = [
      {
        stepIndex: 1,
        phaseName: 'Phase 2 - Singular Reduction',
        rule,
        sourceState: initialExpr,
        targetState: finalInvariant,
        explanation,
      },
    ];

    return {
      theoremName,
      claimTitle,
      initialExpr,
      finalInvariant,
      steps,
    };
  }
}
