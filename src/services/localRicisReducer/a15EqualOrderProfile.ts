import type {
  StructuralBinaryExpression,
  StructuralExpression,
  StructuralSourceReference,
} from './contracts';
import type {
  A15OperandPair,
  ISemanticIndexValidator,
  ITypeConsistencyValidator,
} from './oopContracts';
import { BaseSingularityRule } from './oopRules';

/**
 * Exact Rational Number representation (BigInt numerator and denominator).
 */
export interface ExactRational {
  readonly num: bigint;
  readonly den: bigint;
}

const ZERO_BI = BigInt(0);
const ONE_BI = BigInt(1);
const MINUS_ONE_BI = BigInt(-1);

export function createRational(num: number | bigint, den: number | bigint = ONE_BI): ExactRational {
  let n = BigInt(num);
  let d = BigInt(den);
  if (d === ZERO_BI) throw new Error('Rational denominator cannot be zero');
  if (d < ZERO_BI) {
    n = -n;
    d = -d;
  }
  const g = gcdBigInt(absBigInt(n), d);
  return { num: n / g, den: d / g };
}

function gcdBigInt(a: bigint, b: bigint): bigint {
  while (b !== ZERO_BI) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function absBigInt(a: bigint): bigint {
  return a < ZERO_BI ? -a : a;
}

export function addRational(a: ExactRational, b: ExactRational): ExactRational {
  return createRational(a.num * b.den + b.num * a.den, a.den * b.den);
}

export function subRational(a: ExactRational, b: ExactRational): ExactRational {
  return createRational(a.num * b.den - b.num * a.den, a.den * b.den);
}

export function mulRational(a: ExactRational, b: ExactRational): ExactRational {
  return createRational(a.num * b.num, a.den * b.den);
}

export function divRational(a: ExactRational, b: ExactRational): ExactRational {
  return createRational(a.num * b.den, a.den * b.num);
}

export function formatRational(r: ExactRational): string {
  if (r.den === ONE_BI) {
    return String(r.num);
  }
  return `${r.num} / ${r.den}`;
}

export function toCanonicalRationalString(val: number | ExactRational): string {
  if (typeof val === 'object' && val !== null && 'num' in val && 'den' in val) {
    return formatRational(val);
  }
  if (Number.isInteger(val)) {
    return String(val);
  }
  const maxDen = 1000;
  let bestNum = Math.round(val);
  let bestDen = 1;
  let minErr = Math.abs(val - bestNum);

  for (let den = 1; den <= maxDen; den++) {
    const num = Math.round(val * den);
    const err = Math.abs(val - num / den);
    if (err < minErr - 1e-9) {
      minErr = err;
      bestNum = num;
      bestDen = den;
      if (err < 1e-12) break;
    }
  }

  if (minErr < 1e-5 && bestDen > 1) {
    const g = gcdBigInt(BigInt(Math.abs(bestNum)), BigInt(bestDen));
    const n = BigInt(bestNum) / g;
    const d = BigInt(bestDen) / g;
    if (d === ONE_BI) return String(n);
    return `${n} / ${d}`;
  }

  return String(Number(val.toFixed(6)));
}

/**
 * Symbolic AST node representation for exact structural power series expansion.
 */
export type SymbolicAstNode =
  | { kind: 'CONST'; value: ExactRational }
  | { kind: 'VAR'; name: string }
  | { kind: 'ADD'; left: SymbolicAstNode; right: SymbolicAstNode }
  | { kind: 'SUB'; left: SymbolicAstNode; right: SymbolicAstNode }
  | { kind: 'MUL'; left: SymbolicAstNode; right: SymbolicAstNode }
  | { kind: 'DIV'; left: SymbolicAstNode; right: SymbolicAstNode }
  | { kind: 'POW'; base: SymbolicAstNode; exp: number }
  | { kind: 'FN'; name: string; arg: SymbolicAstNode };

type Token =
  | { type: 'NUM'; value: number }
  | { type: 'ID'; value: string }
  | { type: 'OP'; value: string };

function tokenizeMathString(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(input[i + 1] ?? ''))) {
      let numStr = '';
      while (i < input.length && (/[0-9]/.test(input[i]) || input[i] === '.')) {
        numStr += input[i];
        i++;
      }
      tokens.push({ type: 'NUM', value: parseFloat(numStr) });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let idStr = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        idStr += input[i];
        i++;
      }
      tokens.push({ type: 'ID', value: idStr });
      continue;
    }
    if (['+', '-', '*', '/', '^', '(', ')', ','].includes(ch)) {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }
    i++;
  }
  return tokens;
}

export function parseCanonicalStringToAst(input: string): SymbolicAstNode | undefined {
  const cleaned = input
    .replace(/0_\{([^}]+)\}/g, '($1)')
    .replace(/inf_\{([^}]+)\}/g, '($1)');

  const tokens = tokenizeMathString(cleaned);
  let pos = 0;

  function peek(): Token | undefined {
    return tokens[pos];
  }

  function consume(): Token | undefined {
    return tokens[pos++];
  }

  function parseExpr(): SymbolicAstNode | undefined {
    return parseSub();
  }

  function parseSub(): SymbolicAstNode | undefined {
    let left = parseMul();
    if (!left) return undefined;

    while (peek()?.type === 'OP' && (peek()?.value === '+' || peek()?.value === '-')) {
      const op = consume()!.value;
      const right = parseMul();
      if (!right) return undefined;
      left = op === '+' ? { kind: 'ADD', left, right } : { kind: 'SUB', left, right };
    }
    return left;
  }

  function parseMul(): SymbolicAstNode | undefined {
    let left = parsePow();
    if (!left) return undefined;

    while (peek()?.type === 'OP' && (peek()?.value === '*' || peek()?.value === '/')) {
      const op = consume()!.value;
      const right = parsePow();
      if (!right) return undefined;
      left = op === '*' ? { kind: 'MUL', left, right } : { kind: 'DIV', left, right };
    }
    return left;
  }

  function parsePow(): SymbolicAstNode | undefined {
    let left = parsePrimary();
    if (!left) return undefined;

    if (peek()?.type === 'OP' && peek()?.value === '^') {
      consume();
      const right = parsePrimary();
      if (!right) return undefined;
      let expVal = 1;
      if (right.kind === 'CONST') {
        expVal = Number(right.value.num / right.value.den);
      }
      left = { kind: 'POW', base: left, exp: expVal };
    }
    return left;
  }

  function parsePrimary(): SymbolicAstNode | undefined {
    const tok = peek();
    if (!tok) return undefined;

    if (tok.type === 'OP' && tok.value === '-') {
      consume();
      const operand = parsePrimary();
      if (!operand) return undefined;
      return { kind: 'SUB', left: { kind: 'CONST', value: createRational(0) }, right: operand };
    }

    if (tok.type === 'NUM') {
      consume();
      if (Number.isInteger(tok.value)) {
        return { kind: 'CONST', value: createRational(tok.value) };
      }
      const parts = String(tok.value).split('.');
      if (parts.length === 2) {
        const dec = parts[1]!;
        const den = Math.pow(10, dec.length);
        const n = Math.round(tok.value * den);
        return { kind: 'CONST', value: createRational(n, den) };
      }
      return { kind: 'CONST', value: createRational(Math.round(tok.value)) };
    }

    if (tok.type === 'ID') {
      consume();
      const name = tok.value;
      if (peek()?.type === 'OP' && peek()?.value === '(') {
        consume(); // '('
        if (name === 'pow') {
          const base = parseExpr();
          if (peek()?.type === 'OP' && peek()?.value === ',') {
            consume(); // ','
          }
          const expNode = parseExpr();
          if (peek()?.type === 'OP' && peek()?.value === ')') {
            consume(); // ')'
          }
          let expVal = 1;
          if (expNode?.kind === 'CONST') expVal = Number(expNode.value.num / expNode.value.den);
          return base ? { kind: 'POW', base, exp: expVal } : undefined;
        }

        const arg = parseExpr();
        if (peek()?.type === 'OP' && peek()?.value === ')') {
          consume(); // ')'
        }
        return arg ? { kind: 'FN', name, arg } : undefined;
      }
      return { kind: 'VAR', name };
    }

    if (tok.type === 'OP' && tok.value === '(') {
      consume();
      const expr = parseExpr();
      if (peek()?.type === 'OP' && peek()?.value === ')') {
        consume();
      }
      return expr;
    }

    return undefined;
  }

  try {
    return parseExpr();
  } catch {
    return undefined;
  }
}

export function structuralToSymbolicAst(expr: StructuralExpression): SymbolicAstNode {
  if (expr.kind === 'FINITE_LITERAL') {
    const text = expr.lexeme.trim();
    const parsed = parseCanonicalStringToAst(text);
    if (parsed) return parsed;
    if (text === 't' || text === 'x') {
      return { kind: 'VAR', name: text };
    }
    const num = Number(text);
    if (!isNaN(num)) {
      if (Number.isInteger(num)) {
        return { kind: 'CONST', value: createRational(num) };
      }
      const parts = text.split('.');
      if (parts.length === 2) {
        const dec = parts[1]!;
        const den = Math.pow(10, dec.length);
        const n = Math.round(num * den);
        return { kind: 'CONST', value: createRational(n, den) };
      }
    }
    return { kind: 'VAR', name: text };
  }

  if (expr.kind === 'IDENTIFIER') {
    return { kind: 'VAR', name: expr.name };
  }

  if (expr.kind === 'INDEXED_ZERO' || expr.kind === 'INDEXED_INFINITY') {
    return structuralToSymbolicAst(expr.payload);
  }

  if (expr.kind === 'UNARY') {
    if (expr.operator === 'NEGATE') {
      return { kind: 'SUB', left: { kind: 'CONST', value: createRational(0) }, right: structuralToSymbolicAst(expr.operand) };
    }
  }

  if (expr.kind === 'BINARY') {
    const left = structuralToSymbolicAst(expr.left);
    const right = structuralToSymbolicAst(expr.right);
    if (expr.operator === 'ADD') return { kind: 'ADD', left, right };
    if (expr.operator === 'SUBTRACT') return { kind: 'SUB', left, right };
    if (expr.operator === 'MULTIPLY') return { kind: 'MUL', left, right };
    if (expr.operator === 'DIVIDE') return { kind: 'DIV', left, right };
  }

  const canon = expr.identity?.canonical ?? '';
  if (canon) {
    const parsed = parseCanonicalStringToAst(canon);
    if (parsed) return parsed;
  }

  return { kind: 'CONST', value: createRational(0) };
}

/**
 * Symbolic Series Engine: computes exact rational power series maps (Map<number, ExactRational>)
 * directly from symbolic AST representation without limits or numerical approximations.
 */
export class SymbolicSeriesEngine {
  public static expandAst(
    node: SymbolicAstNode,
    evalPoint = 0,
    maxDegree = 20
  ): Map<number, ExactRational> {
    const zeroRatio = createRational(0);
    const result = new Map<number, ExactRational>();

    const setTerm = (deg: number, val: ExactRational) => {
      if (deg > maxDegree) return;
      const existing = result.get(deg) ?? zeroRatio;
      const nextVal = addRational(existing, val);
      if (nextVal.num !== ZERO_BI) {
        result.set(deg, nextVal);
      } else {
        result.delete(deg);
      }
    };

    switch (node.kind) {
      case 'CONST': {
        setTerm(0, node.value);
        return result;
      }
      case 'VAR': {
        if (evalPoint === 0) {
          setTerm(1, createRational(1));
        } else {
          setTerm(0, createRational(evalPoint));
          setTerm(1, createRational(1));
        }
        return result;
      }
      case 'ADD': {
        const s1 = this.expandAst(node.left, evalPoint, maxDegree);
        const s2 = this.expandAst(node.right, evalPoint, maxDegree);
        return this.addSeries(s1, s2, maxDegree);
      }
      case 'SUB': {
        const s1 = this.expandAst(node.left, evalPoint, maxDegree);
        const s2 = this.expandAst(node.right, evalPoint, maxDegree);
        return this.subSeries(s1, s2, maxDegree);
      }
      case 'MUL': {
        const s1 = this.expandAst(node.left, evalPoint, maxDegree);
        const s2 = this.expandAst(node.right, evalPoint, maxDegree);
        return this.mulSeries(s1, s2, maxDegree);
      }
      case 'DIV': {
        const s1 = this.expandAst(node.left, evalPoint, maxDegree);
        const s2 = this.expandAst(node.right, evalPoint, maxDegree);
        return this.divSeries(s1, s2, maxDegree);
      }
      case 'POW': {
        const base = this.expandAst(node.base, evalPoint, maxDegree);
        return this.powSeries(base, node.exp, maxDegree);
      }
      case 'FN': {
        const argSeries = this.expandAst(node.arg, evalPoint, maxDegree);
        return this.applyFunctionSeries(node.name.toLowerCase(), argSeries, maxDegree);
      }
    }
  }

  public static addSeries(
    s1: Map<number, ExactRational>,
    s2: Map<number, ExactRational>,
    maxDegree: number
  ): Map<number, ExactRational> {
    const res = new Map<number, ExactRational>();
    const allDegs = new Set([...s1.keys(), ...s2.keys()]);
    for (const d of allDegs) {
      if (d > maxDegree) continue;
      const v1 = s1.get(d) ?? createRational(0);
      const v2 = s2.get(d) ?? createRational(0);
      const sum = addRational(v1, v2);
      if (sum.num !== ZERO_BI) res.set(d, sum);
    }
    return res;
  }

  public static subSeries(
    s1: Map<number, ExactRational>,
    s2: Map<number, ExactRational>,
    maxDegree: number
  ): Map<number, ExactRational> {
    const res = new Map<number, ExactRational>();
    const allDegs = new Set([...s1.keys(), ...s2.keys()]);
    for (const d of allDegs) {
      if (d > maxDegree) continue;
      const v1 = s1.get(d) ?? createRational(0);
      const v2 = s2.get(d) ?? createRational(0);
      const diff = subRational(v1, v2);
      if (diff.num !== ZERO_BI) res.set(d, diff);
    }
    return res;
  }

  public static mulSeries(
    s1: Map<number, ExactRational>,
    s2: Map<number, ExactRational>,
    maxDegree: number
  ): Map<number, ExactRational> {
    const res = new Map<number, ExactRational>();
    for (const [d1, v1] of s1.entries()) {
      for (const [d2, v2] of s2.entries()) {
        const deg = d1 + d2;
        if (deg > maxDegree) continue;
        const prod = mulRational(v1, v2);
        const existing = res.get(deg) ?? createRational(0);
        const nextVal = addRational(existing, prod);
        if (nextVal.num !== ZERO_BI) {
          res.set(deg, nextVal);
        } else {
          res.delete(deg);
        }
      }
    }
    return res;
  }

  public static divSeries(
    numSeries: Map<number, ExactRational>,
    denSeries: Map<number, ExactRational>,
    maxDegree: number
  ): Map<number, ExactRational> {
    let minDenDeg = Infinity;
    let leadingDenCoeff: ExactRational | undefined;
    for (const [d, v] of denSeries.entries()) {
      if (v.num !== ZERO_BI && d < minDenDeg) {
        minDenDeg = d;
        leadingDenCoeff = v;
      }
    }

    if (!leadingDenCoeff || minDenDeg === Infinity) {
      return new Map();
    }

    const shift = minDenDeg;
    const res = new Map<number, ExactRational>();

    for (let k = 0; k <= maxDegree; k++) {
      const numDeg = k + shift;
      const numVal = numSeries.get(numDeg) ?? createRational(0);

      let subSum = createRational(0);
      for (let j = 0; j < k; j++) {
        const cj = res.get(j) ?? createRational(0);
        const bDeg = k - j + shift;
        const bj = denSeries.get(bDeg) ?? createRational(0);
        subSum = addRational(subSum, mulRational(cj, bj));
      }

      const ck = divRational(subRational(numVal, subSum), leadingDenCoeff);
      if (ck.num !== ZERO_BI) {
        res.set(k, ck);
      }
    }
    return res;
  }

  public static powSeries(
    base: Map<number, ExactRational>,
    exp: number,
    maxDegree: number
  ): Map<number, ExactRational> {
    if (exp === 0) {
      const res = new Map<number, ExactRational>();
      res.set(0, createRational(1));
      return res;
    }
    if (exp === 1) return new Map(base);
    let current = new Map(base);
    for (let i = 2; i <= exp; i++) {
      current = this.mulSeries(current, base, maxDegree);
    }
    return current;
  }

  public static applyFunctionSeries(
    fnName: string,
    arg: Map<number, ExactRational>,
    maxDegree: number
  ): Map<number, ExactRational> {
    const res = new Map<number, ExactRational>();
    const factorial = (n: number): bigint => {
      let f = ONE_BI;
      for (let i = 2; i <= n; i++) f *= BigInt(i);
      return f;
    };

    if (fnName === 'sin') {
      for (let n = 0; 2 * n + 1 <= maxDegree; n++) {
        const power = 2 * n + 1;
        const uPow = this.powSeries(arg, power, maxDegree);
        const coeff = createRational(n % 2 === 0 ? ONE_BI : MINUS_ONE_BI, factorial(power));
        for (const [d, v] of uPow.entries()) {
          if (d <= maxDegree) {
            const added = mulRational(v, coeff);
            const cur = res.get(d) ?? createRational(0);
            const nextVal = addRational(cur, added);
            if (nextVal.num !== ZERO_BI) res.set(d, nextVal); else res.delete(d);
          }
        }
      }
      return res;
    }

    if (fnName === 'cos') {
      for (let n = 0; 2 * n <= maxDegree; n++) {
        const power = 2 * n;
        const uPow = this.powSeries(arg, power, maxDegree);
        const coeff = createRational(n % 2 === 0 ? ONE_BI : MINUS_ONE_BI, factorial(power));
        for (const [d, v] of uPow.entries()) {
          if (d <= maxDegree) {
            const added = mulRational(v, coeff);
            const cur = res.get(d) ?? createRational(0);
            const nextVal = addRational(cur, added);
            if (nextVal.num !== ZERO_BI) res.set(d, nextVal); else res.delete(d);
          }
        }
      }
      return res;
    }

    if (fnName === 'sinh') {
      for (let n = 0; 2 * n + 1 <= maxDegree; n++) {
        const power = 2 * n + 1;
        const uPow = this.powSeries(arg, power, maxDegree);
        const coeff = createRational(ONE_BI, factorial(power));
        for (const [d, v] of uPow.entries()) {
          if (d <= maxDegree) {
            const added = mulRational(v, coeff);
            const cur = res.get(d) ?? createRational(0);
            const nextVal = addRational(cur, added);
            if (nextVal.num !== ZERO_BI) res.set(d, nextVal); else res.delete(d);
          }
        }
      }
      return res;
    }

    if (fnName === 'cosh') {
      for (let n = 0; 2 * n <= maxDegree; n++) {
        const power = 2 * n;
        const uPow = this.powSeries(arg, power, maxDegree);
        const coeff = createRational(ONE_BI, factorial(power));
        for (const [d, v] of uPow.entries()) {
          if (d <= maxDegree) {
            const added = mulRational(v, coeff);
            const cur = res.get(d) ?? createRational(0);
            const nextVal = addRational(cur, added);
            if (nextVal.num !== ZERO_BI) res.set(d, nextVal); else res.delete(d);
          }
        }
      }
      return res;
    }

    if (fnName === 'tan') {
      const sinS = this.applyFunctionSeries('sin', arg, maxDegree);
      const cosS = this.applyFunctionSeries('cos', arg, maxDegree);
      return this.divSeries(sinS, cosS, maxDegree);
    }

    if (fnName === 'exp') {
      for (let n = 0; n <= maxDegree; n++) {
        const uPow = this.powSeries(arg, n, maxDegree);
        const coeff = createRational(ONE_BI, factorial(n));
        for (const [d, v] of uPow.entries()) {
          if (d <= maxDegree) {
            const added = mulRational(v, coeff);
            const cur = res.get(d) ?? createRational(0);
            const nextVal = addRational(cur, added);
            if (nextVal.num !== ZERO_BI) res.set(d, nextVal); else res.delete(d);
          }
        }
      }
      return res;
    }

    if (fnName === 'log' || fnName === 'ln') {
      for (let n = 1; n <= maxDegree; n++) {
        const uPow = this.powSeries(arg, n, maxDegree);
        const coeff = createRational(n % 2 === 1 ? ONE_BI : MINUS_ONE_BI, BigInt(n));
        for (const [d, v] of uPow.entries()) {
          if (d <= maxDegree) {
            const added = mulRational(v, coeff);
            const cur = res.get(d) ?? createRational(0);
            const nextVal = addRational(cur, added);
            if (nextVal.num !== ZERO_BI) res.set(d, nextVal); else res.delete(d);
          }
        }
      }
      return res;
    }

    return res;
  }
}

/**
 * Calculates exact structural order of vanishing ord_a(f) and structural profile leading coefficient
 * via pure symbolic AST series expansion (NO limits, NO finite differences, NO floating point approximations).
 */
export class OrderProfileCalculator {
  public static computeOrderAndDerivative(
    expression: StructuralExpression | string,
    evalPoint = 0,
    maxOrder = 20
  ): { order: number; derivValue: number; coeff: ExactRational } | undefined {
    let ast: SymbolicAstNode | undefined;
    if (typeof expression === 'string') {
      ast = parseCanonicalStringToAst(expression);
    } else {
      ast = structuralToSymbolicAst(expression);
    }

    if (!ast) return undefined;

    const series = SymbolicSeriesEngine.expandAst(ast, evalPoint, maxOrder);
    for (let order = 0; order <= maxOrder; order++) {
      const coeff = series.get(order);
      if (coeff && coeff.num !== ZERO_BI) {
        const floatVal = Number(coeff.num) / Number(coeff.den);
        return { order, derivValue: floatVal, coeff };
      }
    }
    return undefined;
  }
}

/**
 * A15 Equal-Order Structural Profile Rule:
 * Resolve([F/G], a) := D^d F(a) / D^d G(a) when ord_a(F) = ord_a(G) = d.
 */
export class A15EqualOrderRule extends BaseSingularityRule {
  readonly ruleName = 'A15_EQUAL_ORDER_STRUCTURAL_PROFILE';
  readonly phase = 'A1_A4_A10';
  readonly authority = 'RICIS_III_EXPLICIT';

  protected checkApplicability(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): { isApplicable: boolean; reason?: string } {
    if (expression.kind !== 'BINARY' || expression.operator !== 'DIVIDE') {
      return { isApplicable: false, reason: 'Must be a binary division expression' };
    }

    const pair = this.extractor.extractA15Pair(expression);
    if (!pair) {
      return { isApplicable: false, reason: 'Expression is not an A15 equal-order candidate' };
    }

    const validation = this.pairValidator.validateA15Pair(pair, indexValidator, typeValidator);
    if (!validation.isValid) {
      return { isApplicable: false, reason: validation.reason };
    }

    return { isApplicable: true };
  }

  protected executeReduction(expression: StructuralExpression): { success: true; reduced: StructuralExpression } | { success: false; reason: string } {
    if (expression.kind !== 'BINARY') {
      return { success: false, reason: 'Invalid expression shape for A15 reduction' };
    }
    const pair = this.extractor.extractA15Pair(expression);
    if (!pair) {
      return { success: false, reason: 'Operands not found for A15 reduction' };
    }

    const defaultSource = this.getDefaultSource(expression);
    let canonicalStr: string;

    if (pair.numProfileCoeff && pair.denProfileCoeff) {
      const ratioCoeff = divRational(pair.numProfileCoeff, pair.denProfileCoeff);
      canonicalStr = formatRational(ratioCoeff);
    } else {
      const ratio = pair.numDerivValue / pair.denDerivValue;
      canonicalStr = toCanonicalRationalString(ratio);
    }

    return {
      success: true,
      reduced: this.factory.createA15ProfileQuotient(canonicalStr, defaultSource),
    };
  }
}
