import { LambdaParser } from './src/parser/LambdaParser';
import { AlgebraicSimplifier } from './src/engine/AlgebraicSimplifier';
import { SemanticIndexer } from './src/engine/SemanticIndexer';
import { RicisTypeScriptEngine } from './src/engine/RicisTypeScriptEngine';

const parsed = LambdaParser.parse("x => (1 - cos(x)) / (x*x)");
const simplified = AlgebraicSimplifier.simplify(parsed.body);
const indexed = SemanticIndexer.indexAtPoint(simplified, parsed.parameterName, 0);
const reducedBasis = AlgebraicSimplifier.simplifySingularityBasis(indexed);
const engine = new RicisTypeScriptEngine();
const result = engine.reduce(reducedBasis);

console.log(JSON.stringify(result.reduced, null, 2));
