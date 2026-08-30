import { Expression, AST, BinaryExpression, FunctionExpression } from '../ast/ExpressionTypes';
import { AstEvaluator } from '../evaluator/AstEvaluator';

export class SemanticIndexer {
  /**
   * Phase 0.5: Semantic Indexing (SP4).
   * Evaluates the expression tree at a specific point.
   * If a node evaluates to 0, it is replaced with SingularityZero(node).
   * If a node evaluates to Infinity (e.g. division by 0), it becomes SingularityInfinity(node).
   * Otherwise, it becomes a Constant with the evaluated value.
   */
  static indexAtPoint(node: Expression, parameterName: string, value: number): Expression {
    // Phase 0.5: SP4 Semantic Indexing
    // Recursively evaluate bottom-up
    if (node.nodeType === 'Constant' || node.nodeType === 'Parameter') {
      const val = this.evaluateNumeric(node, parameterName, value);
      if (Math.abs(val) < 1e-14) return AST.Zero(node);
      return AST.Const(val);
    }

    if (node.nodeType === 'Function') {
      const fnNode = node as FunctionExpression;
      const val = this.evaluateNumeric(node, parameterName, value);
      if (isNaN(val)) {
        // If NaN, index arguments individually
        const indexedArgs = fnNode.args.map(arg => this.indexAtPoint(arg, parameterName, value));
        return { nodeType: 'Function', name: fnNode.name, args: indexedArgs } as FunctionExpression;
      }
      if (Math.abs(val) < 1e-14) return AST.Zero(node);
      if (!isFinite(val)) return AST.Inf(node);
      return AST.Const(val);
    }

    if ('left' in node && 'right' in node) {
      const binNode = node as BinaryExpression;
      
      const numVal = this.evaluateNumeric(node, parameterName, value);
      if (isNaN(numVal)) {
         // evaluate children
         const leftIndexed = this.indexAtPoint(binNode.left, parameterName, value);
         const rightIndexed = this.indexAtPoint(binNode.right, parameterName, value);
         if (binNode.nodeType === 'Divide' && leftIndexed.nodeType === 'SingularityZero' && rightIndexed.nodeType === 'SingularityZero') {
            return AST.Div(leftIndexed, rightIndexed);
         }
         return { ...binNode, left: leftIndexed, right: rightIndexed } as Expression;
      }
      
      if (Math.abs(numVal) < 1e-14) return AST.Zero(node);
      if (!isFinite(numVal)) return AST.Inf(node);
      
      // otherwise, evaluate children just in case we need their structures (but generally it's non-singular here)
      const leftIndexed = this.indexAtPoint(binNode.left, parameterName, value);
      const rightIndexed = this.indexAtPoint(binNode.right, parameterName, value);
      
      if (leftIndexed.nodeType === 'Constant' && rightIndexed.nodeType === 'Constant') {
          return AST.Const(numVal);
      }
      return { ...binNode, left: leftIndexed, right: rightIndexed } as Expression;
    }

    return node;
  }

  private static evaluateNumeric(node: Expression, parameterName: string, x: number): number {
    const fn = AstEvaluator.compile(parameterName, node);
    return fn(x);
  }
}
