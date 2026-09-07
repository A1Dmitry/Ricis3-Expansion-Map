// ============================================================================
// QA AUTOMATION SUITE: LEAN AST CODE GENERATOR & DEEP EMBEDDING
// Master System Instruction: RICIS-III v7.7 Analytical Engine
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { LeanAstCodeGenerator } from './application/leanAstCodeGenerator';
import { LeanAstParser } from './application/leanAstParser';
import { LeanPreambleProvider } from './domain/leanPreambleProvider';
import { verifyLeanProof } from '../../model/leanVerifier';
import type { ILeanAstCodeGenerator } from './contracts/ILeanAstCodeGenerator';
import type { ProblemNode } from '../../model/types';

describe('LeanAstCodeGenerator: Deep Embedding, AST & OOP Architecture', () => {
  let generator: ILeanAstCodeGenerator;

  beforeEach(() => {
    // Инстанцирование по принципам ООП (Dependency Injection через конструктор)
    const preambleProvider = new LeanPreambleProvider();
    const astParser = new LeanAstParser();
    generator = new LeanAstCodeGenerator(preambleProvider, astParser);
  });

  it('QA-LEAN-01: генерирует глубокий автономный документ объемом > 150 строк без Mathlib', () => {
    const result = generator.generateProofDocument({
      nodeId: 'a6_bridge_test',
      title: 'A6 Geometric Bridge Singularity Resolution',
      initialExpr: '0_5 * inf_3',
      resolvedInvariant: '15',
    });

    expect(result.success).toBe(true);
    expect(result.lineCount).toBeGreaterThanOrEqual(150);
    expect(result.code).not.toContain('import Mathlib');
    expect(result.code).toContain('inductive RExpr');
    expect(result.code).toContain('inductive Step');
    expect(result.code).toContain('inductive Derivation');
    expect(result.code).toContain('theorem theorem_a6_bridge_test');
  });

  it('QA-LEAN-02: сгенерированный код категорически не содержит sorry, admit, NaN или undefined', () => {
    const result = generator.generateProofDocument({
      nodeId: 'sp1_test',
      title: 'SP1 Locality Rule Null Factor Reduction',
      initialExpr: '((x - 5) * (x + 5)) / (x - 5)',
      resolvedInvariant: '10',
    });

    expect(result.code).not.toMatch(/\bsorry\b/);
    expect(result.code).not.toMatch(/\badmit\b/);
    expect(result.code).not.toMatch(/\bsorryAx\b/);
    expect(result.code).not.toContain('NaN');
    expect(result.code).not.toContain('undefined');
  });

  it('QA-LEAN-03: баланс скобок (), [] и {} идеально соблюден во всем документе', () => {
    const result = generator.generateProofDocument({
      nodeId: 'syntax_balance_test',
      title: 'Bracket Balance Verification',
      initialExpr: '0_F * inf_G',
      resolvedInvariant: 'F * G',
    });

    let round = 0;
    let square = 0;
    let curly = 0;

    for (const char of result.code) {
      if (char === '(') round++;
      if (char === ')') round--;
      if (char === '[') square++;
      if (char === ']') square--;
      if (char === '{') curly++;
      if (char === '}') curly--;
    }

    expect(round).toBe(0);
    expect(square).toBe(0);
    expect(curly).toBe(0);
  });

  it('QA-LEAN-04: успешно проходит через встроенный верификатор verifyLeanProof', () => {
    const result = generator.generateProofDocument({
      nodeId: 'lean_verifier_check',
      title: 'Lean 4 Structural Verification',
      initialExpr: '10 / 0',
      resolvedInvariant: 'inf_{10}',
    });

    const verification = verifyLeanProof(result.code, 'Lean 4 Structural Verification', '10 / 0');
    expect(verification.isValid).toBe(true);
    expect(verification.status).toBe('STATIC_CHECK_PASSED');
    expect(verification.errors.length).toBe(0);
  });

  it('QA-LEAN-05: генерация из реального узла графа ProblemNode (math-singularity)', () => {
    const mockNode: ProblemNode = {
      id: 'math-singularity',
      title: 'Разрешение сингулярностей (Деление на ноль)',
      description: 'Базовое разрешение сингулярностей деления на ноль по аксиомам A1/A10',
      type: 'core_singularity',
      state: 'resolved',
      fractalDepth: 0,
      economic: {
        costUnresolved: 1000,
        costToSolve: 100,
        marketGain: 5000,
        riskLoss: 0,
      },
      zoneIds: ['zone-core'],
      targetFunction: 'F / 0 -> inf_F',
      singularityHint: 'A1 / A10 / Lean A1_div_zero',
      dependencyIds: [],
      dependentIds: [],
    };

    const result = generator.generateFromNode(mockNode);
    expect(result.success).toBe(true);
    expect(result.theoremName).toBe('theorem_math_singularity');
    expect(result.code).toContain('A1_Indexing');
    expect(result.lineCount).toBeGreaterThanOrEqual(150);
  });

  it('QA-LEAN-06: аксиома A6 Геометрического Моста генерирует ортогональный детерминант det(u, v) = F * G', () => {
    const result = generator.generateProofDocument({
      nodeId: 'skew_product_a6',
      title: 'Skew Product Geometric Invariant',
      initialExpr: '0_4 * inf_7',
      resolvedInvariant: '28',
    });

    expect(result.code).toContain('skewProduct');
    expect(result.code).toContain('A6_GeometricBridge');
    expect(result.code).toContain('det2D');
  });
});
