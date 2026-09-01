import type {
  FiniteStructuralKey,
  StructuralExpression,
  StructuralIndex,
  StructuralTypeTag,
  LocalStructuralRule,
  LocalStructuralPhase,
  StructuralRuleAuthority,
  StructuralPrecondition,
} from './contracts';

/**
 * Обобщенный тип истории преобразований (Transformation Log).
 * Сохраняет полную трассировку переходов выражений согласно L1C1.
 */
export interface TransformationLog<T> {
  readonly sequence: number;
  readonly phase: LocalStructuralPhase;
  readonly rule: LocalStructuralRule;
  readonly authority: StructuralRuleAuthority;
  readonly input: T;
  readonly output: T;
  readonly rationaleCode: string;
}

/**
 * Структурное число RICIS (RicisNumber), связывающее значение
 * с его онтологической историей и типом по аксиоме L1.
 */
export interface RicisNumber<T> {
  readonly value: T;
  readonly typeTag: StructuralTypeTag;
  readonly history: readonly TransformationLog<T>[];
  readonly identityHash: string;
}

/**
 * Контракт для протокола совместимости типов (Type Consistency Protocol - TCP).
 * Осуществляет проверку совместимости типов по правилам L1C2.
 */
export interface ITypeConsistencyValidator {
  /**
   * Проверяет совместимость типов левого и правого операндов.
   */
  checkCompatibility(
    leftTag: StructuralTypeTag,
    rightTag: StructuralTypeTag
  ): {
    readonly isCompatible: boolean;
    readonly resultTag?: StructuralTypeTag;
    readonly requiresCompositeDeferral: boolean;
  };
}

/**
 * Контракт для проверки семантических индексов (SP4) и ключей (Semantic Index & Key Validator).
 */
export interface ISemanticIndexValidator {
  /**
   * Проверяет, является ли семантический ключ конечным и валидным.
   */
  isKeyValid(key: FiniteStructuralKey): boolean;

  /**
   * Проверяет, что выражение содержит только валидные и конечные семантические ключи.
   */
  hasValidFiniteKeys(expression: StructuralExpression): boolean;

  /**
   * Проверяет соответствие индекса SP4 порождающему payload выражению.
   */
  isIndexMatching(index: StructuralIndex, payload: StructuralExpression): boolean;
}

/**
 * Обобщенный результат применения правила редукции.
 */
export type RuleApplicationResult =
  | {
      readonly status: 'APPLIED';
      readonly reduced: StructuralExpression;
      readonly preconditions: readonly StructuralPrecondition[];
      readonly rule: LocalStructuralRule;
      readonly phase: LocalStructuralPhase;
    }
  | {
      readonly status: 'NOT_APPLICABLE';
      readonly reason: string;
    }
  | {
      readonly status: 'DEFERRED';
      readonly reason: string;
    };

/**
 * Контракт отдельного правила редукции сингулярностей (Axiom / Reduction Rule).
 * Каждое правило изолировано (SOLID, SRP) и внедряется через DI.
 */
export interface ISingularityRule {
  readonly ruleName: LocalStructuralRule;
  readonly phase: LocalStructuralPhase;
  readonly authority: StructuralRuleAuthority;

  /**
   * Проверяет применимость правила к выражению и вычисляет результат в O(1).
   */
  evaluate(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): RuleApplicationResult;
}

/**
 * Реестр правил редукции сингулярностей (Rule Registry).
 * Используется для DI оркестрации правил вместо жестких if/else условий.
 */
export interface ISingularityRuleRegistry {
  /**
   * Регистрирует новое правило редукции.
   */
  register(rule: ISingularityRule): void;

  /**
   * Возвращает все зарегистрированные правила.
   */
  getRules(): readonly ISingularityRule[];

  /**
   * Находит применимое правило для выражения.
   */
  findApplicableRule(
    expression: StructuralExpression,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): ISingularityRule | undefined;
}
