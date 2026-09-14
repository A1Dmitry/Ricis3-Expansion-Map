import type { StructuralExpression } from './contracts';

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
  const tokens = tokenizeMathString(input);
  if (tokens.length === 0) return undefined;
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];
  const consume = (): Token | undefined => tokens[pos++];

  function parseExpression(): SymbolicAstNode | undefined {
    let left = parseTerm();
    if (!left) return undefined;

    while (peek() && peek()?.type === 'OP' && (peek()?.value === '+' || peek()?.value === '-')) {
      const op = consume()!.value;
      const right = parseTerm();
      if (!right) return undefined;
      left = op === '+' ? { kind: 'ADD', left, right } : { kind: 'SUB', left, right };
    }
    return left;
  }

  function parseTerm(): SymbolicAstNode | undefined {
    let left = parseFactor();
    if (!left) return undefined;

    while (peek() && peek()?.type === 'OP' && (peek()?.value === '*' || peek()?.value === '/')) {
      const op = consume()!.value;
      const right = parseFactor();
      if (!right) return undefined;
      left = op === '*' ? { kind: 'MUL', left, right } : { kind: 'DIV', left, right };
    }
    return left;
  }

  function parseFactor(): SymbolicAstNode | undefined {
    let base = parsePrimary();
    if (!base) return undefined;

    if (peek() && peek()?.type === 'OP' && peek()?.value === '^') {
      consume(); // ^
      const expToken = consume();
      if (expToken && expToken.type === 'NUM') {
        base = { kind: 'POW', base, exp: Math.floor(expToken.value) };
      }
    }
    return base;
  }

  function parsePrimary(): SymbolicAstNode | undefined {
    const tok = consume();
    if (!tok) return undefined;

    if (tok.type === 'NUM') {
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
      return { kind: 'CONST', value: createRational(tok.value) };
    }

    if (tok.type === 'OP' && tok.value === '-') {
      const operand = parsePrimary();
      if (!operand) return undefined;
      return { kind: 'SUB', left: { kind: 'CONST', value: createRational(0) }, right: operand };
    }

    if (tok.type === 'OP' && tok.value === '(') {
      const expr = parseExpression();
      if (peek() && peek()?.type === 'OP' && peek()?.value === ')') {
        consume();
      }
      return expr;
    }

    if (tok.type === 'ID') {
      if (['sin', 'cos', 'sinh', 'cosh', 'tan', 'exp', 'log', 'ln'].includes(tok.value.toLowerCase())) {
        if (peek() && peek()?.type === 'OP' && peek()?.value === '(') {
          consume(); // (
          const arg = parseExpression();
          if (peek() && peek()?.type === 'OP' && peek()?.value === ')') {
            consume(); // )
          }
          if (arg) return { kind: 'FN', name: tok.value.toLowerCase(), arg };
        }
      }
      return { kind: 'VAR', name: tok.value };
    }

    return undefined;
  }

  try {
    return parseExpression();
  } catch {
    return undefined;
  }
}

export function structuralToSymbolicAst(expr: StructuralExpression): SymbolicAstNode {
  if (expr.kind === 'FINITE_LITERAL') {
    if (expr.identity?.canonical && expr.identity.canonical !== expr.lexeme) {
      const parsedCanonical = parseCanonicalStringToAst(expr.identity.canonical.trim());
      if (parsedCanonical) return parsedCanonical;
    }
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
    if (!expr.payload || !expr.index) {
      return { kind: 'CONST', value: createRational(0) };
    }
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
        const vName = node.name.toLowerCase();
        if (vName === 't' || vName === 'x') {
          if (evalPoint === 0) {
            setTerm(1, createRational(1));
          } else {
            setTerm(0, createRational(evalPoint));
            setTerm(1, createRational(1));
          }
        } else {
          setTerm(0, createRational(1));
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

    const constTerm = arg.get(0);
    if (constTerm && constTerm.num !== ZERO_BI) {
      if (['sin', 'cos', 'sinh', 'cosh', 'tan', 'exp', 'log', 'ln'].includes(fnName)) {
        return res;
      }
    }

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

function collectAssociativeChildren(node: SymbolicAstNode, kind: 'ADD' | 'MUL'): SymbolicAstNode[] {
  const result: SymbolicAstNode[] = [];
  function recurse(n: SymbolicAstNode) {
    if (n.kind === kind) {
      recurse(n.left);
      recurse(n.right);
    } else {
      result.push(n);
    }
  }
  recurse(node);
  return result;
}

/**
 * Computes a deterministic canonical graph fingerprint of a symbolic AST node.
 * Associative and commutative operations (ADD, MUL) are flattened and sorted,
 * ensuring graph isomorphism yields identical string fingerprints without garbage duplicates.
 */
export function computeSymbolicAstFingerprint(node: SymbolicAstNode): string {
  switch (node.kind) {
    case 'CONST':
      return `C(${node.value.num}/${node.value.den})`;
    case 'VAR':
      return `V(${node.name.toLowerCase()})`;
    case 'ADD': {
      const terms = collectAssociativeChildren(node, 'ADD');
      const fps = terms.map(t => computeSymbolicAstFingerprint(t)).sort();
      return `ADD(${fps.join(',')})`;
    }
    case 'MUL': {
      const factors = collectAssociativeChildren(node, 'MUL');
      const fps = factors.map(f => computeSymbolicAstFingerprint(f)).sort();
      return `MUL(${fps.join(',')})`;
    }
    case 'SUB':
      return `SUB(${computeSymbolicAstFingerprint(node.left)},${computeSymbolicAstFingerprint(node.right)})`;
    case 'DIV':
      return `DIV(${computeSymbolicAstFingerprint(node.left)},${computeSymbolicAstFingerprint(node.right)})`;
    case 'POW':
      return `POW(${computeSymbolicAstFingerprint(node.base)},${node.exp})`;
    case 'FN':
      return `FN:${node.name.toLowerCase()}(${computeSymbolicAstFingerprint(node.arg)})`;
  }
}

/**
 * Checks whether two symbolic AST nodes represent isomorphic computational graphs.
 * Takes into account associativity and commutativity of ADD and MUL, and exact rational identity for CONST.
 */
export function areSymbolicAstsIsomorphic(a: SymbolicAstNode, b: SymbolicAstNode): boolean {
  if (a === b) return true;
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'CONST': {
      const bConst = b as Extract<SymbolicAstNode, { kind: 'CONST' }>;
      return a.value.num === bConst.value.num && a.value.den === bConst.value.den;
    }
    case 'VAR': {
      const bVar = b as Extract<SymbolicAstNode, { kind: 'VAR' }>;
      return a.name.toLowerCase() === bVar.name.toLowerCase();
    }
    case 'ADD': {
      const termsA = collectAssociativeChildren(a, 'ADD');
      const termsB = collectAssociativeChildren(b, 'ADD');
      if (termsA.length !== termsB.length) return false;
      const fpsA = termsA.map(t => computeSymbolicAstFingerprint(t)).sort();
      const fpsB = termsB.map(t => computeSymbolicAstFingerprint(t)).sort();
      return fpsA.every((fp, idx) => fp === fpsB[idx]);
    }
    case 'MUL': {
      const factorsA = collectAssociativeChildren(a, 'MUL');
      const factorsB = collectAssociativeChildren(b, 'MUL');
      if (factorsA.length !== factorsB.length) return false;
      const fpsA = factorsA.map(f => computeSymbolicAstFingerprint(f)).sort();
      const fpsB = factorsB.map(f => computeSymbolicAstFingerprint(f)).sort();
      return fpsA.every((fp, idx) => fp === fpsB[idx]);
    }
    case 'SUB': {
      const bSub = b as Extract<SymbolicAstNode, { kind: 'SUB' }>;
      return areSymbolicAstsIsomorphic(a.left, bSub.left) && areSymbolicAstsIsomorphic(a.right, bSub.right);
    }
    case 'DIV': {
      const bDiv = b as Extract<SymbolicAstNode, { kind: 'DIV' }>;
      return areSymbolicAstsIsomorphic(a.left, bDiv.left) && areSymbolicAstsIsomorphic(a.right, bDiv.right);
    }
    case 'POW': {
      const bPow = b as Extract<SymbolicAstNode, { kind: 'POW' }>;
      return a.exp === bPow.exp && areSymbolicAstsIsomorphic(a.base, bPow.base);
    }
    case 'FN': {
      const bFn = b as Extract<SymbolicAstNode, { kind: 'FN' }>;
      return a.name.toLowerCase() === bFn.name.toLowerCase() && areSymbolicAstsIsomorphic(a.arg, bFn.arg);
    }
  }
}
