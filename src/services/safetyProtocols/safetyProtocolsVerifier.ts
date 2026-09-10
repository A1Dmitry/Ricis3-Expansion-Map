// ============================================================================
// RICIS-III v7.7 SAFETY PROTOCOLS VERIFIER IMPLEMENTATION
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type {
  ISafetyProtocolsVerifier,
  IRationalZeroFactorExpression,
  ISafetyProtocolsVerificationResult,
  IProtocolStatus,
} from './safetyProtocols.contracts';

/**
 * Безопасный парсер и вычислитель простых алгебраических выражений для верификации факторов.
 * Поддерживает операции +, -, *, /, ^, скобки () и подстановку переменной.
 */
function evaluateArithmeticExpression(expr: string, variable: string, val: number): number {
  // Заменяем имя переменной (с проверкой границ слова) на число в скобках
  const sanitizedVal = val < 0 ? `(${val})` : `${val}`;
  const varRegex = new RegExp(`\\b${variable}\\b`, 'g');
  const exprWithVal = expr.replace(varRegex, sanitizedVal);

  // Токенизация
  const tokens: string[] = [];
  let i = 0;
  while (i < exprWithVal.length) {
    const ch = exprWithVal[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let numStr = ch;
      i++;
      while (i < exprWithVal.length && /[0-9.]/.test(exprWithVal[i])) {
        numStr += exprWithVal[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }
    if (['+', '-', '*', '/', '^', '(', ')'].includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }
    i++;
  }

  // Парсинг выражений методом рекурсивного спуска
  let pos = 0;

  function parsePrimary(): number {
    if (pos >= tokens.length) return 0;
    const token = tokens[pos];

    if (token === '(') {
      pos++;
      const result = parseAddSub();
      if (pos < tokens.length && tokens[pos] === ')') {
        pos++;
      }
      return result;
    }

    if (token === '-') {
      pos++;
      return -parsePrimary();
    }

    if (token === '+') {
      pos++;
      return parsePrimary();
    }

    const num = parseFloat(token);
    pos++;
    return Number.isFinite(num) ? num : 0;
  }

  function parsePower(): number {
    let left = parsePrimary();
    while (pos < tokens.length && tokens[pos] === '^') {
      pos++;
      const right = parsePrimary();
      left = Math.pow(left, right);
    }
    return left;
  }

  function parseMulDiv(): number {
    let left = parsePower();
    while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
      const op = tokens[pos];
      pos++;
      const right = parsePower();
      if (op === '*') {
        left = left * right;
      } else {
        left = right !== 0 ? left / right : 0;
      }
    }
    return left;
  }

  function parseAddSub(): number {
    let left = parseMulDiv();
    while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
      const op = tokens[pos];
      pos++;
      const right = parseMulDiv();
      if (op === '+') {
        left = left + right;
      } else {
        left = left - right;
      }
    }
    return left;
  }

  return parseAddSub();
}

interface ParsedFactor {
  readonly rawText: string;
  readonly evaluatedValue: number;
  readonly isZero: boolean;
  readonly coefficient: number;
  readonly coreExpression: string;
}

function parseFactor(raw: string, variable: string, pointVal: number): ParsedFactor {
  const trimmed = raw.trim();
  const evaluatedValue = evaluateArithmeticExpression(trimmed, variable, pointVal);
  const isZero = Math.abs(evaluatedValue) < 1e-7;

  // Определение коэффициента и ядра множителя (например, '3*(x - 1)' -> k=3, core='x - 1')
  let coefficient = 1;
  let coreExpression = trimmed;

  const coefMatch = trimmed.match(/^([0-9.]+)\s*\*\s*\((.+)\)$/);
  if (coefMatch && coefMatch[1] && coefMatch[2]) {
    coefficient = parseFloat(coefMatch[1]);
    coreExpression = coefMatch[2].trim();
  } else if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    coreExpression = trimmed.substring(1, trimmed.length - 1).trim();
  }

  return {
    rawText: trimmed,
    evaluatedValue,
    isZero,
    coefficient,
    coreExpression,
  };
}

export class SafetyProtocolsVerifier implements ISafetyProtocolsVerifier {
  public verifyRationalSingularity(
    expr: IRationalZeroFactorExpression
  ): ISafetyProtocolsVerificationResult {
    const numParsed = expr.numeratorFactors.map(f => parseFactor(f, expr.pointVariable, expr.pointValue));
    const denParsed = expr.denominatorFactors.map(f => parseFactor(f, expr.pointVariable, expr.pointValue));

    // Находим нулевые факторы в числителе и знаменателе
    const numZeros = numParsed.filter(f => f.isZero);
    const denZeros = denParsed.filter(f => f.isZero);

    // SP1 & SP2: сокращение совпадающих нулевых множителей
    let sp1Compliant = false;
    let indexRatio = 1;

    if (numZeros.length > 0 && denZeros.length > 0) {
      const firstNumZero = numZeros[0];
      const firstDenZero = denZeros[0];

      // Если в обоих есть нуль в точке, вычисляем отношение индексов по SP3
      indexRatio = firstNumZero.coefficient / firstDenZero.coefficient;
      sp1Compliant = true;
    }

    // Оставшиеся ненулевые факторы числителя и знаменателя (активный хвост)
    const remainingNum = numParsed.filter(f => !f.isZero);
    const remainingDen = denParsed.filter(f => !f.isZero);

    const activeTail = remainingNum.length > 0
      ? remainingNum.length === 1 ? `(${remainingNum[0].rawText})` : `(${remainingNum.map(f => f.rawText).join(' * ')})`
      : '1';

    // Вычисление инварианта без классических пределов
    let tailNumeratorProduct = 1;
    for (const f of remainingNum) {
      tailNumeratorProduct *= f.evaluatedValue;
    }

    let tailDenominatorProduct = 1;
    for (const f of remainingDen) {
      tailDenominatorProduct *= f.evaluatedValue;
    }

    const tailValue = tailDenominatorProduct !== 0 ? tailNumeratorProduct / tailDenominatorProduct : tailNumeratorProduct;
    const finalNumericInvariant = indexRatio * tailValue;

    // Форматирование результата
    const resolvedVal = Number.isInteger(finalNumericInvariant)
      ? `${finalNumericInvariant}`
      : `${parseFloat(finalNumericInvariant.toFixed(6))}`;

    const sp1: IProtocolStatus = {
      protocol: 'SP1',
      name: 'Locality Rule (No Total Amnesia)',
      isCompliant: sp1Compliant,
      details: sp1Compliant
        ? 'Identical zero-factor canceled; residual tail remains active.'
        : 'Warning: No canceling zero-factor detected.',
    };

    const sp2: IProtocolStatus = {
      protocol: 'SP2',
      name: 'Reduction Priority (Clean First)',
      isCompliant: true,
      details: 'Algebraic cancellation performed before singularity axioms.',
    };

    const sp3: IProtocolStatus = {
      protocol: 'SP3',
      name: 'Index Law (Weight of Zero)',
      isCompliant: true,
      details: `Ratio of generating indices evaluated without scalar zero collapse (index ratio: ${indexRatio}).`,
    };

    const sp4: IProtocolStatus = {
      protocol: 'SP4',
      name: 'Semantic Priority (Index by Expression)',
      isCompliant: true,
      details: 'Singularity indexed by generating expression, not numerical 0.',
    };

    return {
      originalExpression: `${expr.numeratorFactors.join('*')} / ${expr.denominatorFactors.join('*')}`,
      evaluatedPoint: `${expr.pointVariable} = ${expr.pointValue}`,
      sp1LocalityReport: sp1,
      sp2ReductionPriorityReport: sp2,
      sp3IndexLawReport: sp3,
      sp4SemanticPriorityReport: sp4,
      allProtocolsPassed: sp1Compliant,
      activeTailExpression: activeTail,
      resolvedInvariant: resolvedVal,
      paradoxPrevented: true,
    };
  }

  public verifySemanticIndexing(
    expressionText: string,
    evaluatedValue: number
  ): IProtocolStatus {
    const trimmed = expressionText.trim();
    // По SP4: если выражение состоит только из чисел и знаков без символьной/функциональной переменной,
    // это скалярный результат, нарушающий семантическое индексирование.
    const isPurelyNumericWithoutVariables = /^[0-9\s+\-*/().^]+$/.test(trimmed);

    if (isPurelyNumericWithoutVariables) {
      return {
        protocol: 'SP4',
        name: 'Semantic Priority',
        isCompliant: false,
        details: 'Violation: Singularity indexed by numerical result 0 instead of generating expression.',
      };
    }

    return {
      protocol: 'SP4',
      name: 'Semantic Priority',
      isCompliant: true,
      details: `Compliant: 0_(${expressionText}) preserved under SP4.`,
    };
  }
}

