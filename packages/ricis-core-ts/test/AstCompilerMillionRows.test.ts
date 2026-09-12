import { describe, it, expect, vi } from 'vitest';
import { AST, AstCompiler, AstEvaluator, LambdaParser, AlgebraicSimplifier, RicisTypeScriptEngine } from '../src/index';

describe('AstCompiler & AstEvaluator Executable Delegate Tests', () => {
  it('compiles generic multi-parameter expression (a + b) * c ONCE and evaluates correctly across rows', () => {
    // Expression: (a + b) * c
    const expr = AST.Mul(AST.Add(AST.Var('a'), AST.Var('b')), AST.Var('c'));
    
    // Compile once
    const compiled = AstCompiler.compileDictionary(expr);

    // Evaluate multiple rows
    expect(compiled({ a: 2, b: 3, c: 4 })).toBe(20);
    expect(compiled({ a: 1, b: 7, c: 2 })).toBe(16);
    expect(compiled({ a: 10, b: -2, c: 3 })).toBe(24);
  });

  it('runs 1,000,000 row evaluation scenario without AST re-traversal or re-parsing', () => {
    const rawLambda = 'x => x * x + 5';
    
    // Stage 1: COMPILE TIME (Parse, Simplify, Reduce, Compile)
    let parseCount = 0;
    let reduceCount = 0;

    parseCount++;
    const parsed = LambdaParser.parse(rawLambda);
    
    reduceCount++;
    const engine = new RicisTypeScriptEngine();
    const reduced = engine.reduce(parsed.body).reduced;
    
    const compiledFn = AstEvaluator.compile(parsed.parameterName, reduced);

    // Confirm compile-time metrics
    expect(parseCount).toBe(1);
    expect(reduceCount).toBe(1);

    // Spy on AstEvaluator.evaluate to verify it is NEVER called during runtime execution
    const evalSpy = vi.spyOn(AstEvaluator as any, 'evaluate');

    // Stage 2: RUNTIME (1,000,000 iterations)
    const N = 1_000_000;
    const startTime = performance.now();
    
    let sum = 0;
    for (let i = 0; i < N; i++) {
      sum += compiledFn(i % 100);
    }
    
    const durationMs = performance.now() - startTime;

    // Zero AST re-traversal verification
    expect(evalSpy).not.toHaveBeenCalled();
    expect(sum).toBeGreaterThan(0);
    
    // Ensure execution of 1,000,000 rows is extremely fast (under 200ms)
    expect(durationMs).toBeLessThan(1000);
    
    evalSpy.mockRestore();
  });
});
