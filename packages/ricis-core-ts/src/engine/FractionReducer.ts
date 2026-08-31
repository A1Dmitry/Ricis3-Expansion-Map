import { AST, Expression } from '../ast/ExpressionTypes';

export interface MixedFractionRepresentation {
  readonly whole: number;
  readonly numerator: number;
  readonly denominator: number;
  readonly isNegative: boolean;
  readonly isProper: boolean;
  readonly formatted: string;
}

export class FractionReducer {
  /**
   * Находит наибольший общий делитель (НОД) по алгоритму Евклида
   */
  static gcd(a: number, b: number): number {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));
    while (y !== 0) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x || 1;
  }

  /**
   * Преобразует пару (числитель, знаменатель) в смешанную дробь.
   * Примеры:
   *  100 / 3 -> 33 + 1/3
   *  -100 / 3 -> -(33 + 1/3)
   *  12 / 4 -> 3
   *  2 / 5 -> 2/5
   */
  static toMixedFraction(numerator: number, denominator: number): MixedFractionRepresentation {
    if (denominator === 0) {
      throw new Error("Denominator cannot be zero in fraction reduction");
    }

    const isNegative = (numerator < 0) !== (denominator < 0);
    const absNum = Math.abs(Math.round(numerator));
    const absDen = Math.abs(Math.round(denominator));

    const commonGcd = this.gcd(absNum, absDen);
    const redNum = absNum / commonGcd;
    const redDen = absDen / commonGcd;

    const whole = Math.floor(redNum / redDen);
    const remNum = redNum % redDen;

    let formatted = '';
    if (remNum === 0) {
      formatted = `${isNegative ? '-' : ''}${whole}`;
    } else if (whole === 0) {
      formatted = `${isNegative ? '-' : ''}${remNum}/${redDen}`;
    } else {
      const inner = `${whole} + ${remNum}/${redDen}`;
      formatted = isNegative ? `-(${inner})` : inner;
    }

    return {
      whole,
      numerator: remNum,
      denominator: redDen,
      isNegative,
      isProper: whole === 0,
      formatted
    };
  }

  /**
   * Преобразует деление констант A/B в AST узел смешанной дроби:
   * 100 / 3 -> Add(33, Div(1, 3))
   * 12 / 4 -> Const(3)
   * 2 / 5 -> Div(2, 5)
   */
  static simplifyDivisionToAst(numerator: number, denominator: number): Expression {
    const fraction = this.toMixedFraction(numerator, denominator);
    if (fraction.numerator === 0) {
      return AST.Const(fraction.isNegative ? -fraction.whole : fraction.whole);
    }
    if (fraction.whole === 0) {
      const div = AST.Div(AST.Const(fraction.numerator), AST.Const(fraction.denominator));
      return fraction.isNegative ? AST.Mul(AST.Const(-1), div) : div;
    }

    const mixed = AST.Add(
      AST.Const(fraction.whole),
      AST.Div(AST.Const(fraction.numerator), AST.Const(fraction.denominator))
    );
    return fraction.isNegative ? AST.Mul(AST.Const(-1), mixed) : mixed;
  }
}
