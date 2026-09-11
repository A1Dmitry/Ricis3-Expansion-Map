import { Expression, AST, BinaryExpression, FunctionExpression, SingularityExpression, DerivativeExpression } from '../ast/ExpressionTypes';

export class AlgebraicSimplifier {
  /**
   * Evaluates constant expressions purely symbolically.
   */
  static foldConstants(node: Expression): Expression {
    if (node.nodeType === 'Function') {
      const fnNode = node as FunctionExpression;
      const args = fnNode.args.map(a => this.foldConstants(a));
      
      // Known exact identities
      if ((fnNode.name === 'sin' || fnNode.name === 'sinh') && args[0]!.nodeType === 'Constant' && (args[0] as any).value === 0) {
        return AST.Const(0);
      }
      if (fnNode.name === 'cos' && args[0]!.nodeType === 'Constant' && (args[0] as any).value === 0) {
        return AST.Const(1);
      }
      if (fnNode.name === 'tan' && args[0]!.nodeType === 'Constant' && (args[0] as any).value === 0) {
        return AST.Const(0);
      }
      if (fnNode.name === 'exp' && args[0]!.nodeType === 'Constant' && (args[0] as any).value === 0) {
        return AST.Const(1);
      }
      if ((fnNode.name === 'log' || fnNode.name === 'ln') && args[0]!.nodeType === 'Constant' && (args[0] as any).value === 1) {
        return AST.Const(0);
      }
      
      if (fnNode.name.toLowerCase() === 'pow' && args[0]!.nodeType === 'Constant' && args[1] && args[1]!.nodeType === 'Constant') {
        const base = (args[0] as any).value;
        const exp = (args[1] as any).value;
        const res = Math.pow(base, exp);
        if (Number.isSafeInteger(base) && Number.isSafeInteger(exp) && Number.isSafeInteger(res)) {
           return AST.Const(res);
        }
        if (res === 0) {
           return AST.Const(0);
        }
      }

      return { nodeType: 'Function', name: fnNode.name, args } as FunctionExpression;
    }
    
    if ('left' in node && 'right' in node) {
      const binNode = node as BinaryExpression;
      const left = this.foldConstants(binNode.left);
      const right = this.foldConstants(binNode.right);

      if (left.nodeType === 'Constant' && right.nodeType === 'Constant') {
        const l = (left as any).value;
        const r = (right as any).value;
        let res = NaN;
        switch (node.nodeType) {
          case 'Add': res = l + r; break;
          case 'Subtract': res = l - r; break;
          case 'Multiply': res = l * r; break;
          case 'Divide': res = l / r; break;
          case 'Power': res = Math.pow(l, r); break;
        }
        // Only fold if the result is a safe integer to avoid float inaccuracies
        if (Number.isSafeInteger(l) && Number.isSafeInteger(r) && Number.isSafeInteger(res)) {
           return AST.Const(res);
        }
        // If they are floats but EXACTLY zero (e.g. 5.5 - 5.5)
        if (res === 0) {
           return AST.Const(0);
        }
      }

      // Symbolic reductions for 0 and 1
      if (node.nodeType === 'Multiply') {
         if (left.nodeType === 'Constant' && (left as any).value === 0) return AST.Const(0);
         if (right.nodeType === 'Constant' && (right as any).value === 0) return AST.Const(0);
         if (left.nodeType === 'Constant' && (left as any).value === 1) return right;
         if (right.nodeType === 'Constant' && (right as any).value === 1) return left;
      }
      if (node.nodeType === 'Add') {
         if (left.nodeType === 'Constant' && (left as any).value === 0) return right;
         if (right.nodeType === 'Constant' && (right as any).value === 0) return left;
      }
      if (node.nodeType === 'Subtract') {
         if (right.nodeType === 'Constant' && (right as any).value === 0) return left;
         // X - X = 0
         if (this.areEqual(left, right)) return AST.Const(0);
      }
      if (node.nodeType === 'Divide') {
         if (left.nodeType === 'Constant' && (left as any).value === 0 && (right.nodeType !== 'Constant' || (right as any).value !== 0)) return AST.Const(0);
         if (right.nodeType === 'Constant' && (right as any).value === 1) return left;
         // X / X = 1
         if (this.areEqual(left, right) && (left.nodeType !== 'Constant' || (left as any).value !== 0)) return AST.Const(1);
      }
      if (node.nodeType === 'Power') {
         if (right.nodeType === 'Constant' && (right as any).value === 0) return AST.Const(1);
         if (right.nodeType === 'Constant' && (right as any).value === 1) return left;
      }

      return { ...binNode, left, right } as Expression;
    }

    if (node.nodeType === 'SingularityZero' || node.nodeType === 'SingularityInfinity') {
      const sing = node as SingularityExpression;
      return { ...sing, basis: this.foldConstants(sing.basis) } as Expression;
    }

    return node;
  }

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
            
            // Check for x^n - a^n (Power or Function 'pow')
            let powBase: Expression | null = null;
            let powExp: number | null = null;

            if (lSub.left.nodeType === 'Power') {
              powBase = (lSub.left as BinaryExpression).left;
              const expNode = (lSub.left as BinaryExpression).right;
              if (expNode.nodeType === 'Constant') powExp = (expNode as any).value;
            } else if (lSub.left.nodeType === 'Function' && (lSub.left as FunctionExpression).name.toLowerCase() === 'pow') {
              const fnArgs = (lSub.left as FunctionExpression).args;
              if (fnArgs.length >= 2) {
                powBase = fnArgs[0]!;
                if (fnArgs[1]!.nodeType === 'Constant') powExp = (fnArgs[1] as any).value;
              }
            }

            if (powBase && powExp !== null && this.areEqual(powBase, xNode)) {
              const n = powExp;
              const lRight = lSub.right;
              const rRight = rSub.right; // 'a'
              
              if (rRight.nodeType === 'Constant' && lRight.nodeType === 'Constant') {
                 const a = (rRight as any).value;
                 const an = (lRight as any).value;
                 if (Math.pow(a, n) === an) {
                    // Factorize!
                    return this.buildPolynomialSum(xNode, a, n);
                 }
              } else if (lRight.nodeType === 'Constant' && (lRight as any).value === 1 && rRight.nodeType === 'Constant' && (rRight as any).value === 1) {
                 // (x^n - 1) / (x - 1)
                 return this.buildPolynomialSum(xNode, 1, n);
              }
            } else if (lSub.left.nodeType === 'Multiply') {
                // (x*x*x*x - 1) / (x - 1)
                // We'll skip complex arbitrary parsing and stick to standard Pow for now, but handle L8
                let count = this.countMultiplyChain(lSub.left, (xNode as any).name);
                if (count > 1 && lSub.right.nodeType === 'Constant' && rSub.right.nodeType === 'Constant') {
                     const a = (rSub.right as any).value;
                     const an = (lSub.right as any).value;
                     if (Math.pow(a, count) === an) {
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

  public static areEqual(a: Expression, b: Expression): boolean {
    if (a.nodeType !== b.nodeType) return false;
    
    switch (a.nodeType) {
      case 'Constant':
        return (a as any).value === (b as any).value;
      case 'Parameter':
        return (a as any).name === (b as any).name;
      case 'Add':
      case 'Multiply': {
        const binA = a as BinaryExpression;
        const binB = b as BinaryExpression;
        return (this.areEqual(binA.left, binB.left) && this.areEqual(binA.right, binB.right)) ||
               (this.areEqual(binA.left, binB.right) && this.areEqual(binA.right, binB.left));
      }
      case 'Subtract':
      case 'Divide':
      case 'Power': {
        const binA = a as BinaryExpression;
        const binB = b as BinaryExpression;
        return this.areEqual(binA.left, binB.left) && this.areEqual(binA.right, binB.right);
      }
      case 'Function': {
        const fnA = a as FunctionExpression;
        const fnB = b as FunctionExpression;
        if (fnA.name !== fnB.name || fnA.args.length !== fnB.args.length) return false;
        return fnA.args.every((arg, idx) => this.areEqual(arg, fnB.args[idx]!));
      }
      case 'SingularityZero':
      case 'SingularityInfinity': {
        const singA = a as SingularityExpression;
        const singB = b as SingularityExpression;
        return this.areEqual(singA.basis, singB.basis);
      }
      case 'Derivative': {
        const derA = a as DerivativeExpression;
        const derB = b as DerivativeExpression;
        return derA.variable === derB.variable && this.areEqual(derA.expression, derB.expression);
      }
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
   * Phase 1.5: SP5 Trigonometric Polar Pre-normalization.
   * Runs AFTER semantic indexing, looks for SingularityZero nodes.
   * MUST NOT use Taylor approximations. Only exact structural mappings.
   */
  static applySP5PolarPrenormalization(node: Expression): Expression {
    if (node.nodeType === 'SingularityZero') {
      const sing = node as SingularityExpression;
      const newBasis = this.applySP5ToBasis(sing.basis);
      return AST.Zero(newBasis);
    }
    
    if (node.nodeType === 'Function') {
      const fnNode = node as FunctionExpression;
      return { nodeType: 'Function', name: fnNode.name, args: fnNode.args.map(a => this.applySP5PolarPrenormalization(a)) } as FunctionExpression;
    }

    if ('left' in node && 'right' in node) {
      const binNode = node as BinaryExpression;
      return { ...binNode, left: this.applySP5PolarPrenormalization(binNode.left), right: this.applySP5PolarPrenormalization(binNode.right) } as Expression;
    }

    return node;
  }

  private static applySP5ToBasis(basis: Expression): Expression {
    if (basis.nodeType === 'Function') {
      const fnNode = basis as FunctionExpression;
      const fnName = fnNode.name.toLowerCase();
      const arg = fnNode.args[0]!;
      // SP5 Exact Identity: sin(0_x) ≡ 0_x, tan(0_x) ≡ 0_x, sinh(0_x) ≡ 0_x
      if (fnName === 'sin' || fnName === 'tan' || fnName === 'sinh') {
        return this.applySP5ToBasis(arg);
      }
      // Exact logarithm mapping: ln(1 + u) structurally maps to u
      if (fnName === 'log' || fnName === 'ln') {
        if (arg.nodeType === 'Add') {
          const add = arg as BinaryExpression;
          if (add.left.nodeType === 'Constant' && (add.left as any).value === 1) {
            return this.applySP5ToBasis(add.right);
          }
          if (add.right.nodeType === 'Constant' && (add.right as any).value === 1) {
            return this.applySP5ToBasis(add.left);
          }
        }
        // ln(x) around 1 -> x - 1
        if (arg.nodeType === 'Parameter') {
          return AST.Sub(arg, AST.Const(1));
        }
      }
    }
    
    if (basis.nodeType === 'Subtract') {
      const sub = basis as BinaryExpression;
      // exp(x) - 1 maps to x
      if (sub.left.nodeType === 'Function' && (sub.left as FunctionExpression).name.toLowerCase() === 'exp') {
         if (sub.right.nodeType === 'Constant' && (sub.right as any).value === 1) {
            return this.applySP5ToBasis((sub.left as FunctionExpression).args[0]!);
         }
      }
      // Exact Identity: 1 - cos(x) = 2 sin^2(x/2) => 2 * (x/2)^2 = x^2 / 2
      if (sub.left.nodeType === 'Constant' && (sub.left as any).value === 1) {
         if (sub.right.nodeType === 'Function' && (sub.right as FunctionExpression).name.toLowerCase() === 'cos') {
            const arg = (sub.right as FunctionExpression).args[0]!;
            const reducedArg = this.applySP5ToBasis(arg);
            return AST.Div(AST.Mul(reducedArg, reducedArg), AST.Const(2));
         }
      }
      
      // Removed Taylor approximations for x - sin(x) and sinh(x) - x and tan(x) - x.
      // In strict RICIS SP5, sin(0_x) = 0_x, so 0_x - 0_{sin(x)} evaluates to 0_x - 0_x = 0_0.
    }

    if ('left' in basis && 'right' in basis) {
      const binNode = basis as BinaryExpression;
      return { ...binNode, left: this.applySP5ToBasis(binNode.left), right: this.applySP5ToBasis(binNode.right) } as Expression;
    }

    return basis;
  }
}

