import { describe, it, expect } from 'vitest';
import type {
  StructuralExpression,
  StructuralIndexedZero,
  StructuralIndexedInfinity,
  StructuralBinaryExpression,
  StructuralIndex,
  FiniteStructuralKey,
  StructuralSourceReference,
} from './contracts';
import type {
  A6OperandPair,
  A7OperandPair,
  ISingularityOperandExtractor,
  ISingularityPairValidator,
  IStructuralExpressionFactory,
  IStructuralEqualityService,
  TransformationLog,
  RicisNumber,
} from './oopContracts';
import {
  TypeConsistencyValidator,
  SemanticIndexValidator,
} from './oopImplementation';

// Вспомогательные конструкторы AST узлов для тестов
function createSourceRef(hash: string, canonical: string): StructuralSourceReference {
  return Object.freeze({
    sourceHash: hash,
    sourceCanonical: canonical,
    sourceSpan: { start: 0, endExclusive: canonical.length },
    origin: 'ANALYZER_AST' as const,
  });
}

function createScalar(value: number, canonical: string, hash: string): StructuralExpression {
  return Object.freeze({
    kind: 'FINITE_LITERAL' as const,
    lexeme: String(value),
    identity: Object.freeze({
      structuralHash: hash,
      canonical,
      typeTag: 'scalar' as const,
      source: createSourceRef(hash, canonical),
    }),
    semanticKeys: Object.freeze([
      Object.freeze({
        kind: 'FACTOR' as const,
        key: canonical,
        sourceHash: hash,
        sourceCanonical: canonical,
      }),
    ]),
  });
}

function createIndexedZero(payload: StructuralExpression): StructuralIndexedZero {
  return Object.freeze({
    kind: 'INDEXED_ZERO' as const,
    index: Object.freeze({
      basis: 'SP4_SOURCE_EXPRESSION' as const,
      payloadHash: payload.identity.structuralHash,
      payloadCanonical: payload.identity.canonical,
      payloadTypeTag: payload.identity.typeTag,
      sourceHash: payload.identity.source.sourceHash,
      semanticKeys: payload.semanticKeys,
    }),
    payload,
    identity: Object.freeze({
      structuralHash: `zero:${payload.identity.structuralHash}`,
      canonical: `0_{${payload.identity.canonical}}`,
      typeTag: payload.identity.typeTag,
      source: payload.identity.source,
    }),
    semanticKeys: payload.semanticKeys,
  });
}

function createIndexedInfinity(payload: StructuralExpression): StructuralIndexedInfinity {
  return Object.freeze({
    kind: 'INDEXED_INFINITY' as const,
    index: Object.freeze({
      basis: 'SP4_SOURCE_EXPRESSION' as const,
      payloadHash: payload.identity.structuralHash,
      payloadCanonical: payload.identity.canonical,
      payloadTypeTag: payload.identity.typeTag,
      sourceHash: payload.identity.source.sourceHash,
      semanticKeys: payload.semanticKeys,
    }),
    payload,
    identity: Object.freeze({
      structuralHash: `inf:${payload.identity.structuralHash}`,
      canonical: `inf_{${payload.identity.canonical}}`,
      typeTag: payload.identity.typeTag,
      source: payload.identity.source,
    }),
    semanticKeys: payload.semanticKeys,
  });
}

describe('Шаг 3: QA Тестирование контрактов рефакторинга RICIS-III (DRY / DDD / SOLID / L1)', () => {
  const typeValidator = new TypeConsistencyValidator();
  const indexValidator = new SemanticIndexValidator();

  describe('Сценарий 1: Извлечение операндов без дублирования (SingularityOperandExtractor)', () => {
    it('должен извлекать A6 пару при прямом порядке (0 * inf)', async () => {
      const { SingularityOperandExtractor } = await import('./oopDomainServices');
      const extractor: ISingularityOperandExtractor = new SingularityOperandExtractor();

      const zero = createIndexedZero(createScalar(0, 'x', 'hash_x'));
      const inf = createIndexedInfinity(createScalar(1, 'y', 'hash_y'));
      const expr: StructuralBinaryExpression = {
        kind: 'BINARY',
        operator: 'MULTIPLY',
        left: zero,
        right: inf,
        identity: zero.identity,
        semanticKeys: [],
      };

      const pair = extractor.extractA6Pair(expr);
      expect(pair).toBeDefined();
      expect(pair?.zero.kind).toBe('INDEXED_ZERO');
      expect(pair?.infinity.kind).toBe('INDEXED_INFINITY');
    });

    it('должен извлекать A6 пару при обратном коммутативном порядке (inf * 0)', async () => {
      const { SingularityOperandExtractor } = await import('./oopDomainServices');
      const extractor: ISingularityOperandExtractor = new SingularityOperandExtractor();

      const zero = createIndexedZero(createScalar(0, 'x', 'hash_x'));
      const inf = createIndexedInfinity(createScalar(1, 'y', 'hash_y'));
      const expr: StructuralBinaryExpression = {
        kind: 'BINARY',
        operator: 'MULTIPLY',
        left: inf,
        right: zero,
        identity: inf.identity,
        semanticKeys: [],
      };

      const pair = extractor.extractA6Pair(expr);
      expect(pair).toBeDefined();
      expect(pair?.zero.kind).toBe('INDEXED_ZERO');
      expect(pair?.infinity.kind).toBe('INDEXED_INFINITY');
    });

    it('должен извлекать A7 пару для разности бесконечностей (inf_F - inf_G)', async () => {
      const { SingularityOperandExtractor } = await import('./oopDomainServices');
      const extractor: ISingularityOperandExtractor = new SingularityOperandExtractor();

      const inf1 = createIndexedInfinity(createScalar(1, 'F', 'hash_f'));
      const inf2 = createIndexedInfinity(createScalar(2, 'G', 'hash_g'));
      const expr: StructuralBinaryExpression = {
        kind: 'BINARY',
        operator: 'SUBTRACT',
        left: inf1,
        right: inf2,
        identity: inf1.identity,
        semanticKeys: [],
      };

      const pair = extractor.extractA7Pair(expr);
      expect(pair).toBeDefined();
      expect(pair?.leftInfinity.kind).toBe('INDEXED_INFINITY');
      expect(pair?.rightInfinity.kind).toBe('INDEXED_INFINITY');
    });
  });

  describe('Сценарий 2: Унифицированная валидация операндов (SingularityPairValidator - DRY)', () => {
    it('позитивный сценарий A6: корректная однородная пара операндов (0_F * inf_G)', async () => {
      const { SingularityPairValidator } = await import('./oopDomainServices');
      const validator: ISingularityPairValidator = new SingularityPairValidator();

      const zero = createIndexedZero(createScalar(0, 'F', 'hash_F'));
      const inf = createIndexedInfinity(createScalar(1, 'G', 'hash_G'));

      const result = validator.validateA6Pair({ zero, infinity: inf }, indexValidator, typeValidator);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.preconditions).toContain('SP4_SOURCE_INDEX_AVAILABLE');
        expect(result.preconditions).toContain('EXACT_TYPE_EQUALITY');
      }
    });

    it('негативный сценарий TCP: несовместимые типы вызывают DEFERRED (TCP_COMPOSITE_REQUIRED)', async () => {
      const { SingularityPairValidator } = await import('./oopDomainServices');
      const validator: ISingularityPairValidator = new SingularityPairValidator();

      const zeroPayload = {
        ...createScalar(0, 'F', 'hash_F'),
        identity: { ...createScalar(0, 'F', 'hash_F').identity, typeTag: 'vector' as const },
      };
      const infPayload = createScalar(1, 'G', 'hash_G');

      const zero = createIndexedZero(zeroPayload as StructuralExpression);
      const inf = createIndexedInfinity(infPayload);

      const result = validator.validateA6Pair({ zero, infinity: inf }, indexValidator, typeValidator);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.status).toBe('DEFERRED');
        expect(result.reason).toBe('TCP_COMPOSITE_REQUIRED');
      }
    });

    it('негативный сценарий SP4: несовпадение индекса и payload порождает SP4_SOURCE_MISMATCH', async () => {
      const { SingularityPairValidator } = await import('./oopDomainServices');
      const validator: ISingularityPairValidator = new SingularityPairValidator();

      const payload = createScalar(0, 'F', 'hash_F');
      const corruptedZero = {
        ...createIndexedZero(payload),
        index: {
          ...createIndexedZero(payload).index,
          payloadHash: 'mismatched_hash',
        },
      };

      const inf = createIndexedInfinity(createScalar(1, 'G', 'hash_G'));

      const result = validator.validateA6Pair({ zero: corruptedZero, infinity: inf }, indexValidator, typeValidator);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.status).toBe('DEFERRED');
        expect(result.reason).toBe('SP4_SOURCE_MISMATCH');
      }
    });
  });

  describe('Сценарий 3: Фабрика выражений и сохранение идентичности L1 (StructuralExpressionFactory)', () => {
    it('A6 Product: должен детерминированно формировать результат без мок-значений', async () => {
      const { StructuralExpressionFactory } = await import('./oopDomainServices');
      const factory: IStructuralExpressionFactory = new StructuralExpressionFactory();

      const f = createScalar(5, 'x - 1', 'hash_f');
      const g = createScalar(10, 'y + 2', 'hash_g');
      const srcRef = createSourceRef('src_root', '(x-1)*(y+2)');

      const result = factory.createA6Product(f, g, srcRef);

      expect(result.kind).toBe('BINARY');
      if (result.kind === 'BINARY') {
        expect(result.operator).toBe('MULTIPLY');
        expect(result.left).toBe(f);
        expect(result.right).toBe(g);
        expect(result.identity.canonical).toBe('(x - 1) * (y + 2)');
        expect(result.identity.structuralHash).toBe('a6:hash_f:hash_g');
        expect(result.identity.typeTag).toBe('scalar');
        expect(result.identity.source.origin).toBe('DERIVED_RICIS_RULE');
        expect(result.semanticKeys.length).toBe(f.semanticKeys.length + g.semanticKeys.length);
      }
    });

    it('A7 Difference: должен формировать StructuralIndexedInfinity без моков', async () => {
      const { StructuralExpressionFactory } = await import('./oopDomainServices');
      const factory: IStructuralExpressionFactory = new StructuralExpressionFactory();

      const f = createScalar(7, 'F', 'hash_f');
      const g = createScalar(3, 'G', 'hash_g');
      const srcRef = createSourceRef('src_root', 'inf_F - inf_G');

      const result = factory.createA7Difference(f, g, srcRef);

      expect(result.kind).toBe('INDEXED_INFINITY');
      expect(result.index.basis).toBe('SP4_SOURCE_EXPRESSION');
      expect(result.identity.canonical).toBe('inf_{F - G}');
      expect(result.identity.structuralHash).toBe('a7:hash_f:hash_g');
      expect(result.identity.typeTag).toBe('scalar');
      expect(result.identity.source.origin).toBe('DERIVED_RICIS_RULE');
    });
  });

  describe('Сценарий 4: Структурное равенство с приоритетом SP4 над числовым значением (L1_IDENTITY)', () => {
    it('должен подтверждать равенство при совпадении структуры и семантических индексов', async () => {
      const { StructuralEqualityService } = await import('./oopDomainServices');
      const equality: IStructuralEqualityService = new StructuralEqualityService();

      const a = createScalar(5, 'x', 'hash_x');
      const b = createScalar(5, 'x', 'hash_x');

      expect(equality.areStructurallyEqual(a, b)).toBe(true);
    });

    it('должен отвергать равенство при одинаковом численном значении, но разном происхождении (SP4 priority)', async () => {
      const { StructuralEqualityService } = await import('./oopDomainServices');
      const equality: IStructuralEqualityService = new StructuralEqualityService();

      // 0, порожденный выражением (x^2 - 4)|x=2
      const zero1 = createIndexedZero(createScalar(0, 'x^2 - 4', 'hash_expr1'));
      // 0, порожденный выражением (x - 2)|x=2
      const zero2 = createIndexedZero(createScalar(0, 'x - 2', 'hash_expr2'));

      expect(equality.areStructurallyEqual(zero1, zero2)).toBe(false);
      expect(equality.haveEqualSemanticIndices(zero1.index, zero2.index)).toBe(false);
    });
  });

  describe('Сценарий 5: Аудит чистоты кода (Отсутствие моков и стабов в правилах A6/A7)', () => {
    it('A6GeometricBridgeRule не должен возвращать хардкод kind: SCALAR, value: 1', async () => {
      const { A6GeometricBridgeRule } = await import('./oopRules');
      const rule = new A6GeometricBridgeRule();

      const f = createScalar(3, 'x', 'hash_x');
      const g = createScalar(4, 'y', 'hash_y');
      const zero = createIndexedZero(f);
      const inf = createIndexedInfinity(g);

      const expr: StructuralBinaryExpression = {
        kind: 'BINARY',
        operator: 'MULTIPLY',
        left: zero,
        right: inf,
        identity: zero.identity,
        semanticKeys: [],
      };

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('APPLIED');
      if (result.status === 'APPLIED') {
        // Проверяем, что нет хардкода value: 1 или a6-hash
        expect((result.reduced as any).value).not.toBe(1);
        expect(result.reduced.identity.structuralHash).not.toBe('a6-hash');
        expect(result.reduced.kind).toBe('BINARY');
        expect(result.reduced.identity.canonical).toContain('x * y');
      }
    });

    it('A7InfinitySubtractionRule не должен возвращать мок a7-hash', async () => {
      const { A7InfinitySubtractionRule } = await import('./oopRules');
      const rule = new A7InfinitySubtractionRule();

      const f = createScalar(10, 'F', 'hash_F');
      const g = createScalar(5, 'G', 'hash_G');
      const infF = createIndexedInfinity(f);
      const infG = createIndexedInfinity(g);

      const expr: StructuralBinaryExpression = {
        kind: 'BINARY',
        operator: 'SUBTRACT',
        left: infF,
        right: infG,
        identity: infF.identity,
        semanticKeys: [],
      };

      const result = rule.evaluate(expr, indexValidator, typeValidator);
      expect(result.status).toBe('APPLIED');
      if (result.status === 'APPLIED') {
        expect(result.reduced.identity.structuralHash).not.toBe('a7-hash');
        expect(result.reduced.identity.canonical).toBe('inf_{F - G}');
      }
    });
  });

  describe('Сценарий 6: Протокол истории трансформаций (TransformationLog / RicisNumber)', () => {
    it('должен корректно типизировать историю перехода и структурное число L1', () => {
      const logEntry: TransformationLog<string> = {
        sequence: 1,
        phase: 'A1_A4_A10',
        rule: 'A6_HOMOGENEOUS_SCALAR_PRODUCT',
        authority: 'RICIS_III_EXPLICIT',
        input: '0_x * inf_y',
        output: 'x * y',
        rationaleCode: 'GEOMETRIC_BRIDGE_O1',
      };

      const ricisNum: RicisNumber<string> = {
        value: 'x * y',
        typeTag: 'scalar',
        history: [logEntry],
        identityHash: 'ricis:hash:123',
      };

      expect(ricisNum.history.length).toBe(1);
      expect(ricisNum.history[0].rule).toBe('A6_HOMOGENEOUS_SCALAR_PRODUCT');
      expect(ricisNum.identityHash).toBe('ricis:hash:123');
    });
  });
});
