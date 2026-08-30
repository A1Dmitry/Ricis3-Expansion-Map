import { describe, it, expect } from 'vitest';
import { LambdaParser } from '../src/parser/LambdaParser';
import { AstEvaluator } from '../src/evaluator/AstEvaluator';
import { RicisTypeScriptEngine } from '../src/engine/RicisTypeScriptEngine';
import { AST, Expression } from '../src/ast/ExpressionTypes';
import { AlgebraicSimplifier } from '../src/engine/AlgebraicSimplifier';
import { SemanticIndexer } from '../src/engine/SemanticIndexer';

// These are directly taken from the C# ExampleCatalog.cs
const examples = [
  {"id":"L0","input":"x => 10 / (x - 2)"},
  {"id":"L1","input":"x => (x^2 - 25) / (x - 5)","singularity":5,"expected":10},
  {"id":"L2","input":"x => 1 / (2*x - 6)"},
  {"id":"L3","input":"x => 1 / (x^2 - 4)"},
  {"id":"L5","input":"x => sin(x) / cos(x)"},
  {"id":"L6","input":"x => sin(x) / x","singularity":0,"expected":1},
  {"id":"L7","input":"x => sin(2*x) / cos(2*x)"},
  {"id":"L8","input":"x => (x*x*x*x - 1) / (x - 1)","singularity":1,"expected":4},
  {"id":"L9","input":"x => 1 / log(x)"},
  {"id":"L10","input":"x => (exp(x) - 1) / x","singularity":0,"expected":1},
  {"id":"L11","input":"x => (1 - cos(x)) / (x*x)","singularity":0,"expected":0.5},
  {"id":"L12","input":"x => tan(x) / x","singularity":0,"expected":1},
  {"id":"L13","input":"x => 1 / (x * (x + 1))"},
  {"id":"L14","input":"x => 1 / (1 - x*x)"},
  {"id":"L15","input":"x => exp(1 / x)"},
  {"id":"L16","input":"x => 1 / x"},
  {"id":"L17","input":"x => 1 / (x*x)"},
  {"id":"L18","input":"x => log(x)"},
  {"id":"L19","input":"x => sin(x) / x"},
  {"id":"L20","input":"x => exp(1 / x)"},
  {"id":"L21","input":"x => 1 / x"},
  {"id":"L22","input":"x => 1 / (1 - x)"},
  {"id":"L23","input":"x => 1 / (1 - x)"},
  {"id":"L24","input":"x => x / (x*x)"},
  {"id":"L25","input":"x => 1 / (cos(x) * sinh(x) - 1)"},
  {"id":"L26","input":"x => 1 / (pow(x, 4) - 1)"},
  {"id":"L27","input":"x => 1 / (x*x*x)"},
  {"id":"L28","input":"x => (pow(x, 3) - 8) / (x - 2)"},
  {"id":"L29","input":"x => 1 / (x*x*(x - 1))"},
  {"id":"L30","input":"x => sqrt(x)"},
  {"id":"L31","input":"x => sin(pi*x) / x"},
  {"id":"L32","input":"x => sqrt(2 / (pi*x)) * cos(x - pi/4)"},
  {"id":"L33","input":"x => exp(pow(x, 1.5))"},
  {"id":"L34","input":"x => 1 / (x - 1) + log(abs(x))"},
  {"id":"L35","input":"x => log(1 + exp(-1 / x)) / x"},
  {"id":"L36","input":"x => 1 / pow(1 - x, 2.0/3)"},
  {"id":"L37","input":"x => 1 / sqrt(abs(x) + 2.220446049250313e-16)"},
  {"id":"L38","input":"x => 1 / (1 - 2 / x)"},
  {"id":"L39","input":"x => exp(-8 * pi * pi / x)"},
  {"id":"L40","input":"x => 1 / (12 * x)"},
  {"id":"L41","input":"x => 1 / sqrt(x*x + 2.220446049250313e-16)"},
  {"id":"L42","input":"x => (x - sin(x)) / pow(x, 3)"},
  {"id":"L43","input":"x => (sinh(x) - x) / pow(x, 3)"},
  {"id":"L44","input":"x => 1 / (x*x + 1)"},
  {"id":"L45","input":"x => 1 / (1 - tan(x))"},
  {"id":"L46","input":"x => 1 / (exp(x*x) - 1)"},
  {"id":"L47","input":"x => 1 / log(x)"},
  {"id":"L48","input":"x => log(x) / (1 / x)"},
  {"id":"L49","input":"x => 1 / (pow(x, 5) - 32)"},
  {"id":"L50","input":"x => 1 / ((x - 1) * (x - 1.0000001))"},
  {"id":"L51","input":"x => derivative(x ^ 3)"},
  {"id":"L52","input":"x => integral(x + 1, 5)"},
  {"id":"L53","input":"x => sum(x, 1)"},
  {"id":"L54","input":"x => compoundInterest(100, 10, 2)"},
  {"id":"L55","input":"x => min(x, 0)"},
  {"id":"L56","input":"x => positivePart(x)"},
  {"id":"L57","input":"x => negativePart(x)"},
  {"id":"L58","input":"x => distance(x, 5)"},
  {"id":"L59","input":"x => max(x, 5)"},
  {"id":"L60","input":"x => clamp(x, -1, 1)"},
  {"id":"L61","input":"x => cosh(x)"},
  {"id":"L62","input":"x => tanh(x)"},
  {"id":"L63","input":"x => log10(abs(x) + 1)"},
  {"id":"L64","input":"x => sign(x)"},
  {"id":"L65","input":"x => mod(x, 2)"},
  {"id":"L66","input":"x => pow(x, 3)"}
];

describe('Ricis Console Regression Tests', () => {
  const engine = new RicisTypeScriptEngine();

  examples.forEach(({ id, input, singularity, expected }) => {
    it(`should parse and process ${id}: ${input}`, () => {
      const parsed = LambdaParser.parse(input);
      expect(parsed.parameterName).toBe('x');
      expect(parsed.body).toBeDefined();

      if (singularity !== undefined && expected !== undefined) {
         // evaluate numerically slightly off to check classic limit
         const fnClassic = AstEvaluator.compile(parsed.parameterName, parsed.body);
         const approx = fnClassic(singularity + 1e-5);
         expect(Math.abs(approx - expected)).toBeLessThan(1e-4);

         // Phase 1: SP2 (Algebraic simplification)
         const simplified = AlgebraicSimplifier.simplify(parsed.body);

         // Phase 0.5: SP4 (Semantic Indexing at singularity point)
         const indexed = SemanticIndexer.indexAtPoint(simplified, parsed.parameterName, singularity);

         // Phase 1.5: Transcendental reduction inside Singularity Zeroes
         const reducedBasis = AlgebraicSimplifier.simplifySingularityBasis(indexed);

         // Phase 2-6: RICIS Axiom Application
         const result = engine.reduce(reducedBasis);
         
         // Assert the outcome
         expect(result.reduced.nodeType).toBe('Constant');
         expect((result.reduced as any).value).toBeCloseTo(expected);
      }
    });
  });
});

