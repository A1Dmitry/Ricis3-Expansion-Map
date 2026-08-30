import { Expression, AST, BinaryExpression, FunctionExpression, SingularityExpression } from '../ast/ExpressionTypes';

export class AlgebraicSimplifier {
  /**
   * Phase 1 (SP2): Factorize and simplify algebraically.
   * This runs BEFORE semantic indexing.
   */
  static simplify(node: Expression): Expression {
    if ('left' in node && 'right' in node) {
      const binNode = node as BinaryExpression;
      const left = this.simplify(binNode.left);
      const right = this.simplify(binNode.right);

      if (binNode.nodeType === 'Divide') {
        // x^2 - y^2 / x - y  => x + y
        if (left.nodeType === 'Subtract' && right.nodeType === 'Subtract') {
          const lSub = left as BinaryExpression;
          const rSub = right as BinaryExpression;

          if (rSub.left.nodeType === 'Parameter' || rSub.left.nodeType === 'Function') {
            const xNode = rSub.left;
            
            // Check for x^n - a^n
            if (lSub.left.nodeType === 'Power' && (lSub.left as BinaryExpression).left.nodeType === xNode.nodeType) {
               const nNode = (lSub.left as BinaryExpression).right;
               if (nNode.nodeType === 'Constant') {
                  const n = (nNode as any).value;
                  const lRight = lSub.right;
                  const rRight = rSub.right; // 'a'
                  
                  if (rRight.nodeType === 'Constant' && lRight.nodeType === 'Constant') {
                     const a = (rRight as any).value;
                     const an = (lRight as any).value;
                     if (Math.abs(Math.pow(a, n) - an) < 1e-10) {
                        // Factorize!
                        return this.buildPolynomialSum(xNode, a, n);
                     }
                  } else if (lRight.nodeType === 'Constant' && (lRight as any).value === 1 && rRight.nodeType === 'Constant' && (rRight as any).value === 1) {
                     // (x^n - 1) / (x - 1)
                     return this.buildPolynomialSum(xNode, 1, n);
                  }
               }
            } else if (lSub.left.nodeType === 'Multiply') {
                // (x*x*x*x - 1) / (x - 1)
                // We'll skip complex arbitrary parsing and stick to standard Pow for now, but handle L8
                let count = this.countMultiplyChain(lSub.left, (xNode as any).name);
                if (count > 1 && lSub.right.nodeType === 'Constant' && rSub.right.nodeType === 'Constant') {
                     const a = (rSub.right as any).value;
                     const an = (lSub.right as any).value;
                     if (Math.abs(Math.pow(a, count) - an) < 1e-10) {
                        return this.buildPolynomialSum(xNode, a, count);
                     }
                }
            }
          }
        }
        
        // (A / B) / C
        if (left.nodeType === 'Divide') {
            const lDiv = left as BinaryExpression;
            if (this.areEqual(lDiv.left, right)) {
                // (A / B) / A  => 1 / B
                return AST.Div(AST.Const(1), lDiv.right);
            }
        }
      }

      return { ...binNode, left, right } as Expression;
    }
    
    if (node.nodeType === 'Function') {
      const fnNode = node as FunctionExpression;
      return { nodeType: 'Function', name: fnNode.name, args: fnNode.args.map(a => this.simplify(a)) } as FunctionExpression;
    }

    return node;
  }

  private static countMultiplyChain(node: Expression, varName: string): number {
      if (node.nodeType === 'Parameter' && (node as any).name === varName) return 1;
      if (node.nodeType === 'Multiply') {
          return this.countMultiplyChain((node as BinaryExpression).left, varName) + this.countMultiplyChain((node as BinaryExpression).right, varName);
      }
      return 0;
  }

  private static areEqual(a: Expression, b: Expression): boolean {
    if (a.nodeType !== b.nodeType) return false;
    
    switch (a.nodeType) {
      case 'Constant':
        return (a as any).value === (b as any).value;
      case 'Parameter':
        return (a as any).name === (b as any).name;
      case 'Add':
      case 'Subtract':
      case 'Multiply':
      case 'Divide':
      case 'Power':
        const binA = a as BinaryExpression;
        const binB = b as BinaryExpression;
        return this.areEqual(binA.left, binB.left) && this.areEqual(binA.right, binB.right);
      case 'Function':
        const fnA = a as FunctionExpression;
        const fnB = b as FunctionExpression;
        if (fnA.name !== fnB.name || fnA.args.length !== fnB.args.length) return false;
        return fnA.args.every((arg, idx) => this.areEqual(arg, fnB.args[idx]!));
      case 'SingularityZero':
      case 'SingularityInfinity':
        const singA = a as SingularityExpression;
        const singB = b as SingularityExpression;
        return this.areEqual(singA.basis, singB.basis);
      default:
        return false;
    }
  }

  private static buildPolynomialSum(xNode: Expression, a: number, n: number): Expression {
    // build: sum_{i=0}^{n-1} x^(n-1-i) * a^i
    let sumNode: Expression | null = null;
    for (let i = 0; i < n; i++) {
        const powerX = n - 1 - i;
        const coeff = Math.pow(a, i);
        
        let term: Expression;
        if (powerX === 0) {
            term = AST.Const(coeff);
        } else if (powerX === 1) {
            term = coeff === 1 ? xNode : AST.Mul(AST.Const(coeff), xNode);
        } else {
            const powNode = AST.Pow(xNode, AST.Const(powerX));
            term = coeff === 1 ? powNode : AST.Mul(AST.Const(coeff), powNode);
        }

        if (sumNode === null) sumNode = term;
        else sumNode = AST.Add(sumNode, term);
    }
    return sumNode || AST.Const(0);
  }

  /**
   * Phase 1.5: Transcendental reduction inside singularities (Taylor approx).
   * Runs AFTER semantic indexing, looks for SingularityZero nodes.
   */
  static simplifySingularityBasis(node: Expression): Expression {
    if (node.nodeType === 'SingularityZero') {
      const sing = node as SingularityExpression;
      const newBasis = this.reduceBasis(sing.basis);
      return AST.Zero(newBasis);
    }
    
    if (node.nodeType === 'Function') {
      const fnNode = node as FunctionExpression;
      return { nodeType: 'Function', name: fnNode.name, args: fnNode.args.map(a => this.simplifySingularityBasis(a)) } as FunctionExpression;
    }

    if ('left' in node && 'right' in node) {
      const binNode = node as BinaryExpression;
      return { ...binNode, left: this.simplifySingularityBasis(binNode.left), right: this.simplifySingularityBasis(binNode.right) } as Expression;
    }

    return node;
  }

  private static reduceBasis(basis: Expression): Expression {
    if (basis.nodeType === 'Function') {
      const fnNode = basis as FunctionExpression;
      const arg = fnNode.args[0]!;
      // sin(x) ≈ x
      if (fnNode.name === 'sin') return this.reduceBasis(arg);
      // tan(x) ≈ x
      if (fnNode.name === 'tan') return this.reduceBasis(arg);
      // exp(x) - 1 ≈ x  -- handled if basis is Sub(exp(x), 1)
      // sinh(x) ≈ x
      if (fnNode.name === 'sinh') return this.reduceBasis(arg);
    }
    
    if (basis.nodeType === 'Subtract') {
      const sub = basis as BinaryExpression;
      // exp(x) - 1 ≈ x
      if (sub.left.nodeType === 'Function' && (sub.left as FunctionExpression).name === 'exp') {
         if (sub.right.nodeType === 'Constant' && (sub.right as any).value === 1) {
            return this.reduceBasis((sub.left as FunctionExpression).args[0]!);
         }
      }
      // 1 - cos(x) ≈ x^2 / 2
      if (sub.left.nodeType === 'Constant' && (sub.left as any).value === 1) {
         if (sub.right.nodeType === 'Function' && (sub.right as FunctionExpression).name === 'cos') {
            const arg = (sub.right as FunctionExpression).args[0]!;
            return AST.Div(AST.Mul(arg, arg), AST.Const(2));
         }
      }
    }

    return basis;
  }
}

