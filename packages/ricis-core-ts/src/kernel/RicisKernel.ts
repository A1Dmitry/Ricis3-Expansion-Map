import { Expression, AST } from '../ast/ExpressionTypes';
import { SemanticIndex, ISemanticIndex } from '../domain/SemanticIndex';
import { Monolith } from '../domain/Monolith';
import { IIdentityProvider, IdentityProvider } from '../domain/Identity';
import { IRicisReductionEngine } from '../engine/IRicisReductionEngine';
import { RicisTypeScriptEngine } from '../engine/RicisTypeScriptEngine';
import { SemanticIndexer } from '../engine/SemanticIndexer';
import { AlgebraicSimplifier } from '../engine/AlgebraicSimplifier';
import { resolutionRulesOrdered, ResolutionRuleMeta } from '../operations/ResolutionCatalog';

export type BinaryOp = 'Add' | 'Subtract' | 'Multiply' | 'Divide';

/**
 * R-01 — оркестрация существующей поведенческой цепочки (НЕ перепроектируем):
 *
 *   Expr
 *     ↓  algSimplify / SP2   (существующий AlgebraicSimplifier.simplify — ЕДИНСТВЕННЫЙ SP2)
 *   Identity
 *     ↓  computeIdentity
 *   Index
 *     ↓  SemanticIndex (Identity + InstanceId + Expr + name + SemanticType + Provenance)
 *   Monolith
 *     ↓  хранение состояний
 *   RICIS operation
 *     ↓  RicisTypeScriptEngine (ЕДИНСТВЕННЫЙ исполнитель аксиом — без дублирования)
 *   new Expr / new Index / new Monolith
 *
 * Бритва Оккама / DRY: НИКАКОЙ параллельной реализации. SP4 — существующий
 * `SemanticIndexer.indexAtPoint`; аксиомы — существующий `RicisTypeScriptEngine`;
 * SP2 — существующий `AlgebraicSimplifier.simplify`. RICIS имеет СВОИ правила
 * (пределы и Лопиталь запрещены): (x²-4)/(x-2) редуцируется СТРУКТУРНОЙ SP2-отменой,
 * а не классической алгеброй/пределом. Поэтому мы НЕ добавляем классические
 * тождества (вроде разности квадратов) — это были бы conveniences вне аксиом Main (R-09).
 */
export class RicisKernel {
  private readonly monolith = new Monolith();

  constructor(
    private readonly engine: IRicisReductionEngine = new RicisTypeScriptEngine(),
    private readonly idProvider: IIdentityProvider = new IdentityProvider(),
  ) {}

  /** Expr → algSimplify (SP2, существующий) → Identity → Index → Monolith (атомарный лист). */
  index(expr: Expression, name: string): SemanticIndex {
    // Единственный SP2 — существующий AlgebraicSimplifier.simplify (структурная отмена/фактор xⁿ−aⁿ).
    const simplified = AlgebraicSimplifier.simplify(expr);
    const idx = SemanticIndex.atomic(simplified, name, this.idProvider);
    this.monolith.add(idx);
    return idx;
  }

  /** RICIS operation: редукция (через ЕДИНЫЙ движок) → порождение НОВОГО целого индекса (R-06) с explicit provenance (R-07). */
  combine(left: ISemanticIndex, right: ISemanticIndex, op: BinaryOp): ISemanticIndex {
    // Fallback/structural: Expr₁ ⊗ Expr₂, затем редукция единственным движком
    // (применяет A6/A4/A10/A7 и conveniences классической алгебры RICIS).
    const structural = this.compose(left.expr, right.expr, op);
    const resolved = this.engine.reduce(structural).reduced;

    const newIndex = left.combine(right, resolved, opSymbol(op), this.idProvider);
    this.monolith.add(newIndex);
    return newIndex;
  }

  /** R-12 — SP4 через существующий SemanticIndexer (индексирует 0_f, не 0_(f-a)). */
  resolveLimit(expr: Expression, parameter: string, at: number): Expression {
    return SemanticIndexer.indexAtPoint(expr, parameter, at);
  }

  get monolithStates(): readonly ISemanticIndex[] {
    return this.monolith.all();
  }

  /** Интроспекция зарегистрированных правил (метаданные, R-08/R-09). */
  rules(): readonly ResolutionRuleMeta[] {
    return resolutionRulesOrdered();
  }

  private compose(l: Expression, r: Expression, op: BinaryOp): Expression {
    switch (op) {
      case 'Add':
        return AST.Add(l, r);
      case 'Subtract':
        return AST.Sub(l, r);
      case 'Multiply':
        return AST.Mul(l, r);
      case 'Divide':
        return AST.Div(l, r);
    }
  }
}

function opSymbol(op: BinaryOp): string {
  switch (op) {
    case 'Add':
      return '+';
    case 'Subtract':
      return '-';
    case 'Multiply':
      return '*';
    case 'Divide':
      return '/';
  }
}
