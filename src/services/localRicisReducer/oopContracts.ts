import type {
  FiniteStructuralKey,
  StructuralExpression,
  StructuralIndex,
  StructuralTypeTag,
  LocalStructuralRule,
  LocalStructuralPhase,
  StructuralRuleAuthority,
  StructuralPrecondition,
  StructuralIndexedZero,
  StructuralIndexedInfinity,
  StructuralBinaryExpression,
  StructuralSourceReference,
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
 * Результат проверки совместимости типов по протоколу TCP (L1C2).
 */
export interface TypeCompatibilityResult {
  readonly isCompatible: boolean;
  readonly resultTag?: StructuralTypeTag;
  readonly requiresCompositeDeferral: boolean;
  readonly rationale?: string;
}

/**
 * Извлеченная пара операндов для деления нулей A4 (0_F / 0_G).
 */
export interface A4OperandPair {
  readonly numeratorZero: StructuralIndexedZero;
  readonly denominatorZero: StructuralIndexedZero;
}

/**
 * Извлеченная пара операндов для деления бесконечностей A5 (inf_F / inf_G).
 */
export interface A5OperandPair {
  readonly numeratorInfinity: StructuralIndexedInfinity;
  readonly denominatorInfinity: StructuralIndexedInfinity;
}

/**
 * Извлеченная пара операндов для деления на нуль A1 (F / 0 -> inf_F).
 */
export interface A1OperandPair {
  readonly numeratorPayload: StructuralExpression;
  readonly zeroDenominator: StructuralExpression;
}

/**
 * Извлеченная пара операндов для умножения на нуль A10 (F * 0 -> 0_F или 0 * F -> 0_F).
 */
export interface A10OperandPair {
  readonly finitePayload: StructuralExpression;
  readonly zeroFactor: StructuralExpression;
}

/**
 * Извлеченная пара операндов для разности нулей A8 (0_F - 0_G -> 0_{F - G}).
 */
export interface A8OperandPair {
  readonly leftZero: StructuralIndexedZero;
  readonly rightZero: StructuralIndexedZero;
}

/**
 * Извлеченная пара операндов для геометрического произведения A6 (0_F x inf_G).
 */
export interface A6OperandPair {
  readonly zero: StructuralIndexedZero;
  readonly infinity: StructuralIndexedInfinity;
}

/**
 * Извлеченная пара операндов для разности бесконечностей A7 (inf_F - inf_G).
 */
export interface A7OperandPair {
  readonly leftInfinity: StructuralIndexedInfinity;
  readonly rightInfinity: StructuralIndexedInfinity;
}

/**
 * Статус валидации пары операндов для применения сингулярной аксиомы.
 */
export type SingularityPairValidationResult =
  | {
      readonly isValid: true;
      readonly preconditions: readonly StructuralPrecondition[];
    }
  | {
      readonly isValid: false;
      readonly status: 'DEFERRED';
      readonly reason: 'TCP_COMPOSITE_REQUIRED' | 'SP4_SOURCE_MISMATCH' | 'INVALID_FINITE_KEYS';
    }
  | {
      readonly isValid: false;
      readonly status: 'NOT_APPLICABLE';
      readonly reason: string;
    };

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
  ): TypeCompatibilityResult;
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
 * Доменный сервис извлечения операндов из бинарного дерева (устраняет дублирование pattern-matching).
 */
export interface ISingularityOperandExtractor {
  extractA4Pair(expression: StructuralBinaryExpression): A4OperandPair | undefined;
  extractA5Pair(expression: StructuralBinaryExpression): A5OperandPair | undefined;
  extractA6Pair(expression: StructuralBinaryExpression): A6OperandPair | undefined;
  extractA7Pair(expression: StructuralBinaryExpression): A7OperandPair | undefined;
  extractA1Pair(expression: StructuralBinaryExpression): A1OperandPair | undefined;
  extractA10Pair(expression: StructuralBinaryExpression): A10OperandPair | undefined;
  extractA8Pair(expression: StructuralBinaryExpression): A8OperandPair | undefined;
}

/**
 * Доменный сервис валидации пары сингулярных операндов (единая точка валидации SP4 + TCP).
 */
export interface ISingularityPairValidator {
  validateA4Pair(
    pair: A4OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult;

  validateA5Pair(
    pair: A5OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult;

  validateA6Pair(
    pair: A6OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult;

  validateA7Pair(
    pair: A7OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult;

  validateA1Pair(
    pair: A1OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult;

  validateA10Pair(
    pair: A10OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult;

  validateA8Pair(
    pair: A8OperandPair,
    indexValidator: ISemanticIndexValidator,
    typeValidator: ITypeConsistencyValidator
  ): SingularityPairValidationResult;
}

/**
 * Фабрика создания редуцированных выражений с детерминированным расчетом
 * идентичности, происхождения, канонических строковых представлений и семантических ключей.
 */
export interface IStructuralExpressionFactory {
  createA4Quotient(
    numeratorPayload: StructuralExpression,
    denominatorPayload: StructuralExpression,
    sourceRef: StructuralSourceReference
  ): StructuralExpression;

  createA5Quotient(
    numeratorPayload: StructuralExpression,
    denominatorPayload: StructuralExpression,
    sourceRef: StructuralSourceReference
  ): StructuralExpression;

  createA6Product(
    zeroPayload: StructuralExpression,
    infinityPayload: StructuralExpression,
    sourceRef: StructuralSourceReference
  ): StructuralExpression;

  createA7Difference(
    leftPayload: StructuralExpression,
    rightPayload: StructuralExpression,
    sourceRef: StructuralSourceReference
  ): StructuralIndexedInfinity;

  createA1Infinity(
    numeratorPayload: StructuralExpression,
    sourceRef: StructuralSourceReference
  ): StructuralIndexedInfinity;

  createA10Zero(
    finitePayload: StructuralExpression,
    sourceRef: StructuralSourceReference
  ): StructuralIndexedZero;

  createA8Difference(
    leftPayload: StructuralExpression,
    rightPayload: StructuralExpression,
    sourceRef: StructuralSourceReference
  ): StructuralIndexedZero;
}

/**
 * Сервис структурного равенства по аксиоме L1.
 * Приоритет совпадения семантических индексов (SP4) над численным сравнением.
 */
export interface IStructuralEqualityService {
  areStructurallyEqual(a: StructuralExpression, b: StructuralExpression): boolean;
  haveEqualSemanticIndices(a: StructuralIndex, b: StructuralIndex): boolean;
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
