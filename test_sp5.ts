import { LambdaParser, AlgebraicSimplifier, SemanticIndexer, RicisTypeScriptEngine } from './packages/ricis-core-ts/src';
const parsed = LambdaParser.parse('x => (x - sin(x)) / pow(x, 3)');
const simplified = AlgebraicSimplifier.simplify(parsed.body);
const indexed = SemanticIndexer.indexAtPoint(simplified, parsed.parameterName, 0);
const reducedBasis = AlgebraicSimplifier.applySP5PolarPrenormalization(indexed);
console.log("Reduced Basis AST:", JSON.stringify(reducedBasis, null, 2));
const engine = new RicisTypeScriptEngine();
const result = engine.reduce(reducedBasis);
console.log("Final Result AST:", JSON.stringify(result.reduced, null, 2));
