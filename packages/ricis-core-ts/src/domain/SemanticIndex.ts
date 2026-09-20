import { Expression } from '../ast/ExpressionTypes';
import { Identity, IIdentityProvider, IdentityProvider } from './Identity';
import { InstanceId } from './InstanceId';
import { SemanticType, deriveSemanticType } from './SemanticType';
import { Provenance, atomicProvenance, explicitProvenance } from './Provenance';

/**
 * R-05 — `Index` является ФАКТИЧЕСКИМ носителем монолитной семантики.
 * Связка:
 *   что        (Identity)
 *   + какой экземпляр (InstanceId)
 *   + из какого выражения (Expr)
 *   + какого типа (SemanticType)
 *   + как обозначается (name)
 *   + происхождение (Provenance)
 *
 * DDD: это Aggregate Root монолита. Иммутабельный объект.
 */
export interface ISemanticIndex {
  readonly identity: Identity;
  readonly instanceId: InstanceId;
  readonly expr: Expression;
  readonly name: string;
  readonly semanticType: SemanticType;
  readonly provenance: Provenance;
  /** R-06/R-07 — порождает новый целый индекс с explicit provenance. */
  combine(
    other: ISemanticIndex,
    combinedExpr: Expression,
    opName: string,
    idProvider?: IIdentityProvider,
  ): ISemanticIndex;
  sameIdentity(other: ISemanticIndex): boolean;
  restoreExpr(): Expression;
}

export interface SemanticIndexParts {
  identity: Identity;
  instanceId: InstanceId;
  expr: Expression;
  name: string;
  semanticType?: SemanticType;
  provenance?: Provenance;
}

export class SemanticIndex implements ISemanticIndex {
  readonly identity: Identity;
  readonly instanceId: InstanceId;
  readonly expr: Expression;
  readonly name: string;
  readonly semanticType: SemanticType;
  readonly provenance: Provenance;

  constructor(parts: SemanticIndexParts) {
    this.identity = parts.identity;
    this.instanceId = parts.instanceId;
    this.expr = parts.expr;
    this.name = parts.name;
    this.semanticType = parts.semanticType ?? deriveSemanticType(parts.expr);
    this.provenance = parts.provenance ?? atomicProvenance(parts.expr);
  }

  /** Фабрика атомарного индекса (лист монолита). */
  static atomic(
    expr: Expression,
    name: string,
    idProvider: IIdentityProvider = new IdentityProvider(),
  ): SemanticIndex {
    return new SemanticIndex({
      identity: idProvider.computeIdentity(expr),
      instanceId: InstanceId.fresh(),
      expr,
      name,
    });
  }

  /**
   * R-06 — `Index.combine` рекурсивно порождает ЦЕЛЫЙ новый объект.
   * НЕ мутирует ни один из родителей. Новый объект несёт:
   *   - свеже-вычисленную Identity объединённого Expr,
   *   - свежий InstanceId,
   *   - EXPLICIT provenance с обоими родителями (R-07),
   *   - результирующее Expr как structural provenance.
   */
  combine(
    other: ISemanticIndex,
    combinedExpr: Expression,
    opName: string,
    idProvider: IIdentityProvider = new IdentityProvider(),
  ): ISemanticIndex {
    const parents: [InstanceId, InstanceId] = [this.instanceId, other.instanceId];
    return new SemanticIndex({
      identity: idProvider.computeIdentity(combinedExpr),
      instanceId: InstanceId.fresh(),
      expr: combinedExpr,
      name: `${this.name}${opName}${other.name}`,
      provenance: explicitProvenance(combinedExpr, parents),
    });
  }

  /** R-04: равенство по Identity ≠ равенству по InstanceId. */
  sameIdentity(other: ISemanticIndex): boolean {
    return this.identity.hash === other.identity.hash;
  }

  /** «identity-preserving restoreExpr» из аудита (уже хорошо): канонический Expr за индексом. */
  restoreExpr(): Expression {
    return this.expr;
  }
}
