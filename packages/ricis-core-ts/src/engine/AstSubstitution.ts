import {
  Expression,
  BinaryExpression,
  FunctionExpression,
  SingularityExpression,
  DerivativeExpression
} from '../ast/ExpressionTypes';

export class AstSubstitution {
  /**
   * Recursively substitutes occurrences of a specific variable (targetVar)
   * with the provided replacement expression.
   * 
   * Implements Structural Sharing (DAG) by strictly returning original node
   * references if no substitution occurred in their subtree.
   */
  static substitute(tree: Expression, targetVar: string, replacement: Expression): Expression {
    if (tree.nodeType === 'Parameter' && (tree as any).name === targetVar) {
      return replacement;
    }

    if (tree.nodeType === 'Constant' || tree.nodeType === 'Parameter') {
      return tree;
    }

    if (tree.nodeType === 'Function') {
      const fn = tree as FunctionExpression;
      let changed = false;
      const args = fn.args.map(arg => {
        const newArg = this.substitute(arg, targetVar, replacement);
        if (newArg !== arg) changed = true;
        return newArg;
      });
      return changed ? { ...fn, args } as FunctionExpression : tree;
    }

    if ('left' in tree && 'right' in tree) {
      const bin = tree as BinaryExpression;
      const left = this.substitute(bin.left, targetVar, replacement);
      const right = this.substitute(bin.right, targetVar, replacement);
      if (left !== bin.left || right !== bin.right) {
        return { ...bin, left, right } as BinaryExpression;
      }
      return tree;
    }

    if (tree.nodeType === 'Derivative') {
      const d = tree as DerivativeExpression;
      if (d.variable === targetVar) {
        // Shadowing: the bound variable shadows the targetVar, so we stop substituting inside.
        return tree;
      }
      const expr = this.substitute(d.expression, targetVar, replacement);
      if (expr !== d.expression) {
        return { ...d, expression: expr } as DerivativeExpression;
      }
      return tree;
    }

    if (tree.nodeType === 'SingularityZero' || tree.nodeType === 'SingularityInfinity') {
      const sing = tree as SingularityExpression;
      const basis = this.substitute(sing.basis, targetVar, replacement);
      if (basis !== sing.basis) {
        return { ...sing, basis } as SingularityExpression;
      }
      return tree;
    }

    return tree;
  }
}
