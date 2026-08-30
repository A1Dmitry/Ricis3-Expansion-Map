import { describe, it, expect, beforeEach } from 'vitest';
import { AST } from '../ast/ExpressionTypes';
import { IRicisReductionEngine } from './IRicisReductionEngine';
import { RicisTypeScriptEngine } from './RicisTypeScriptEngine';

describe('RICIS-III TypeScript Resident Engine', () => {
  let engine: IRicisReductionEngine;

  beforeEach(() => {
    engine = new RicisTypeScriptEngine();
  });

  describe('L1_IDENTITY: Structural Equality', () => {
    it('должен возвращать true для структурно идентичных выражений (A = A)', () => {
      const expr1 = AST.Add(AST.Var('x'), AST.Const(5));
      const expr2 = AST.Add(AST.Var('x'), AST.Const(5));
      
      expect(engine.areEqual(expr1, expr2)).toBe(true);
    });

    it('должен возвращать false для различающихся выражений (A != B)', () => {
      const expr1 = AST.Add(AST.Var('x'), AST.Const(5));
      const expr2 = AST.Add(AST.Var('x'), AST.Const(6));
      
      expect(engine.areEqual(expr1, expr2)).toBe(false);
    });
  });

  describe('Phase 1 / L1: Deterministic O(1) Reduction', () => {
    it('должен сокращать F / F = 1 без вычисления', () => {
      const expr = AST.Div(
        AST.Sub(AST.Var('x'), AST.Const(2)), 
        AST.Sub(AST.Var('x'), AST.Const(2))
      );
      
      const result = engine.reduce(expr);
      expect(result.reduced.nodeType).toBe('Constant');
      expect((result.reduced as any).value).toBe(1);
      
      // Проверяем наличие следа L1
      const l1Trace = result.trace.find(t => t.ruleFamily === 'L1');
      expect(l1Trace).toBeDefined();
    });
  });

  describe('Phase 2 / A4: Zero Ratio Resolution (0_F / 0_F)', () => {
    it('должен разрешать 0_F / 0_F = 1 (Axiom A4)', () => {
      const basis = AST.Sub(AST.Var('x'), AST.Const(5)); // (x-5)
      const expr = AST.Div(AST.Zero(basis), AST.Zero(basis));
      
      const result = engine.reduce(expr);
      expect(result.reduced.nodeType).toBe('Constant');
      expect((result.reduced as any).value).toBe(1);
      expect(result.isFullyResolved).toBe(true);
      
      const a4Trace = result.trace.find(t => t.ruleFamily === 'A4');
      expect(a4Trace).toBeDefined();
    });
  });

  describe('Phase 2 / A6: General Product (0_F * infty_G)', () => {
    it('должен разрешать 0_F * \\infty_G = F * G (Axiom A6)', () => {
      const f = AST.Var('F');
      const g = AST.Var('G');
      const expr = AST.Mul(AST.Zero(f), AST.Inf(g));
      
      const result = engine.reduce(expr);
      
      // Ожидаем Mul(F, G)
      expect(result.reduced.nodeType).toBe('Multiply');
      expect((result.reduced as any).left).toEqual(f);
      expect((result.reduced as any).right).toEqual(g);
      
      const a6Trace = result.trace.find(t => t.ruleFamily === 'A6');
      expect(a6Trace).toBeDefined();
    });
  });

  describe('Safety & Paradox Prevention', () => {
    it('НЕ должен выбрасывать DivideByZeroException или возвращать NaN', () => {
      // Пытаемся поделить 5 на 0_F
      const basis = AST.Var('F');
      const expr = AST.Div(AST.Const(5), AST.Zero(basis));
      
      // Должно вернуть бесконечность \infty_F * 5, а не упасть!
      const result = engine.reduce(expr);
      expect(result.reduced.nodeType).toBe('Multiply'); // или сразу SingularityInfinity в зависимости от упрощения
      expect(result.isFullyResolved).toBe(true);
    });
  });
});
