import { Expression, AST } from '../ast/ExpressionTypes';

export class LambdaParser {
  static parse(input: string): { parameterName: string, body: Expression } {
    // Basic parser for "x => ..." format. Keep the boundary strict: silently
    // accepting a suffix would make an audit attest a different expression.
    if (typeof input !== 'string') throw new Error("Invalid lambda format");
    const parts = input.split('=>').map(s => s.trim());
    if (parts.length !== 2 || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(parts[0]!) || parts[1]!.length === 0) {
      throw new Error("Invalid lambda format");
    }
    const parameterName = parts[0]!;
    const bodyStr = parts[1]!;

    // Bounded parser for the existing RICIS expression grammar.
    const tokens = this.tokenize(bodyStr);
    let pos = 0;

    function parseExpression(): Expression {
      return parseAddSub();
    }

    function parseAddSub(): Expression {
      let left = parseMulDiv();
      while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
        const op = tokens[pos++];
        const right = parseMulDiv();
        left = op === '+' ? AST.Add(left, right) : AST.Sub(left, right);
      }
      return left;
    }

    function parseMulDiv(): Expression {
      let left = parsePower();
      while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
        const op = tokens[pos++];
        const right = parsePower();
        left = op === '*' ? AST.Mul(left, right) : AST.Div(left, right);
      }
      return left;
    }

    function parsePower(): Expression {
      let left = parsePrimary();
      while (pos < tokens.length && tokens[pos] === '^') {
        pos++;
        const right = parsePrimary();
        left = AST.Pow(left, right);
      }
      return left;
    }

    function parsePrimary(): Expression {
      if (pos >= tokens.length) throw new Error("Unexpected end of input");
      const token = tokens[pos++]!;
      
      if (token === '-') {
        const next = parsePrimary();
        return AST.Mul(AST.Const(-1), next);
      }

      if (token === '+') {
        return parsePrimary();
      }

      if (token === '(') {
        const expr = parseExpression();
        if (tokens[pos++] !== ')') throw new Error("Expected ')'");
        return expr;
      }
      
      // Indexed singularity literals are part of the RICIS source grammar and
      // are intentionally structural, never JavaScript numeric Infinity/NaN.
      // This check must precede parseFloat: parseFloat('0_F') is 0.
      const zeroMatch = token.match(/^0_([A-Za-z_][A-Za-z0-9_]*)$/);
      if (zeroMatch) return AST.Zero(AST.Var(zeroMatch[1]!));
      const infinityMatch = token.match(/^(?:inf|infinity|∞)_([A-Za-z_][A-Za-z0-9_]*)$/i);
      if (infinityMatch) return AST.Inf(AST.Var(infinityMatch[1]!));

      if (!isNaN(parseFloat(token))) {
        return AST.Const(parseFloat(token));
      }

      if (token === parameterName || token === 'pi') {
        if (token === 'pi') return AST.Fn('pi', []); // or Const(Math.PI)
        return AST.Var(token);
      }

      // Check if it's a function call
      if (pos < tokens.length && tokens[pos] === '(') {
        const fnName = token;
        pos++; // skip '('
        const args: Expression[] = [];
        if (tokens[pos] !== ')') {
          args.push(parseExpression());
          while (tokens[pos] === ',') {
            pos++; // skip ','
            args.push(parseExpression());
          }
        }
        if (tokens[pos++] !== ')') throw new Error(`Expected ')' after function ${fnName} args`);
        return AST.Fn(fnName, args);
      }

      throw new Error(`Unexpected token: ${token}`);
    }

    const body = parseExpression();
    if (pos !== tokens.length) {
      throw new Error(`Unexpected token: ${tokens[pos]}`);
    }
    return { parameterName, body };
  }

  private static tokenize(input: string): string[] {
    // Indexed literals must precede the generic number/identifier branches,
    // otherwise `0_F` would be tokenised as `0`, `_F`.
    const regex = /\s*(0_[A-Za-z_][A-Za-z0-9_]*|(?:inf|infinity|∞)_[A-Za-z_][A-Za-z0-9_]*|[A-Za-z_][A-Za-z0-9_]*|[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?|\S)\s*/gu;
    const tokens: string[] = [];
    let match;
    let consumed = 0;
    while ((match = regex.exec(input)) !== null) {
      consumed = regex.lastIndex;
      tokens.push(match[1]!);
    }
    if (consumed !== input.length) throw new Error('Invalid token');
    return tokens;
  }
}
