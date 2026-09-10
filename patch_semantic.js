const fs = require('fs');
const file = 'packages/ricis-core-ts/src/engine/SemanticIndexer.ts';

const content = `import { Expression, AST, BinaryExpression, FunctionExpression } from '../ast/ExpressionTypes';
import { AstSubstitution } from './AstSubstitution';
import { AlgebraicSimplifier } from './AlgebraicSimplifier';

export class SemanticIndexer {
  /**
   * Phase 0.5: Semantic Indexing (SP4).
   * Exact Symbolic Runtime: replaces heuristic numeric evaluation
   * with structural substitution and strict algebraic folding.
   */
  static indexAtPoint(node: Expression, parameterName: string, value: number): Expression {
    // 1. Symbolically substitute
    const substituted = AstSubstitution.substitute(node, parameterName, AST.Const(value));
    
    // 2. Fold exact constants
    const folded = AlgebraicSimplifier.foldConstants(substituted);
    
    // 3. Topology decision
    if (folded.nodeType === 'Constant') {
      const val = (folded as any).value;
      if (val === 0) return AST.Zero(node); // Index original structure
      if (!isFinite(val)) return AST.Inf(node);
      return AST.Const(val);
    }
    
    // 4. Recursive descent for unresolved composites (e.g. 0/0)
    if (node.nodeType === 'Function') {
      const fnNode = node as FunctionExpression;
      const indexedArgs = fnNode.args.map(arg => this.indexAtPoint(arg, parameterName, value));
      return { nodeType: 'Function', name: fnNode.name, args: indexedArgs } as FunctionExpression;
    }
    
    if ('left' in node && 'right' in node) {
      const binNode = node as BinaryExpression;
      const leftIndexed = this.indexAtPoint(binNode.left, parameterName, value);
      const rightIndexed = this.indexAtPoint(binNode.right, parameterName, value);
      
      if (binNode.nodeType === 'Divide' && leftIndexed.nodeType === 'SingularityZero' && rightIndexed.nodeType === 'SingularityZero') {
         return AST.Div(leftIndexed, rightIndexed);
      }
      
      if (leftIndexed.nodeType === 'Constant' && rightIndexed.nodeType === 'Constant') {
          // If both children are constant but the parent didn't fold into a single constant,
          // it might be because of Infinity or NaN.
          // Try folding just one more time.
          const localFold = AlgebraicSimplifier.foldConstants({ ...binNode, left: leftIndexed, right: rightIndexed } as Expression);
          if (localFold.nodeType === 'Constant') {
              const val = (localFold as any).value;
              if (val === 0) return AST.Zero(node);
              if (!isFinite(val)) return AST.Inf(node);
              return AST.Const(val);
          }
      }
      
      return { ...binNode, left: leftIndexed, right: rightIndexed } as Expression;
    }
    
    return node;
  }
}
`;

fs.writeFileSync(file, content);
