import { describe, expect, it } from 'vitest';
import {
  LocalAnalysisApplicationService,
  LocalAnalysisTraceFactory,
  LocalExpressionNormalizer,
  LocalExpressionParser,
  LocalPatternClassifier,
  LocalRicisAnalyzer,
  LocalSemanticIndexer,
  LocalStructuralIdentityComparator,
  SourceExpressionFactory,
  DEFAULT_LOCAL_ANALYZER_LIMITS,
} from '../localRicisAnalyzer/localRicisAnalyzer';
import type { CoreExecutionFailure } from '../ricisCore/IRicisCoreEngine';
import type { LocalStructuralReducerDependencies } from './contracts';
import {
  LocalStructuralReductionApplicationService,
  StructuralExpressionMapper,
  StructuralReductionAdmissionPolicy,
  StructuralReducer,
} from './index';

const FIXED_TIME = 1_735_689_600_000;
const analyzerLimits = {
  ...DEFAULT_LOCAL_ANALYZER_LIMITS,
  maxInputCharacters: 128,
  maxTokenCount: 64,
  maxAstDepth: 16,
  maxTraceEntries: 64,
};
const reducerLimits = {
  maxStructuralDepth: 16,
  maxDerivationSteps: 64,
  maxSemanticKeysPerExpression: 32,
  maxFactorsPerProduct: 16,
};

function analyzer() {
  return new LocalRicisAnalyzer({
    parser: new LocalExpressionParser(),
    normalizer: new LocalExpressionNormalizer(),
    identityComparator: new LocalStructuralIdentityComparator(),
    semanticIndexer: new LocalSemanticIndexer(),
    patternClassifier: new LocalPatternClassifier(),
    traceFactory: new LocalAnalysisTraceFactory(),
    clock: { now: () => FIXED_TIME },
    limits: analyzerLimits,
  });
}

function analysisApplication() {
  return new LocalAnalysisApplicationService(new SourceExpressionFactory(), analyzer(), analyzerLimits);
}

function mapper() {
  return new StructuralExpressionMapper(reducerLimits);
}

function reducer() {
  return new StructuralReducer(reducerLimits);
}

function dependencies(): LocalStructuralReducerDependencies {
  return {
    analysisApplication: analysisApplication(),
    mapper: mapper(),
    reducer: reducer(),
    admissionPolicy: new StructuralReductionAdmissionPolicy(),
    limits: reducerLimits,
  };
}

function failure(code: CoreExecutionFailure['code']): CoreExecutionFailure {
  return {
    success: false,
    code,
    userMessage: 'Core result is intentionally unavailable in this test fixture.',
    diagnostic: {
      origin: 'terminal',
      runtime: 'not_ready',
      retryable: true,
      occurredAt: FIXED_TIME,
    },
  };
}

describe('RCVAP: Real Execution Graph Integration Test (P0)', () => {
  it('должен проходить через production entry point и фиксировать derivation journal для L1', async () => {
    const dependencySet = dependencies();
    const service = new LocalStructuralReductionApplicationService(dependencySet);

    // Testing x / x => L1 Identical Division (since SP2 requires * which we avoid by just providing variables directly or +)
    const result = await service.reduceExplicitly({
      rawText: '(x + x) / (x + x)',
      origin: 'explicit_user_action',
      requestedLocale: 'en-US',
      correlationId: 'INTEGRATION_01',
      coreRecovery: failure('CORE_UNAVAILABLE'),
    }, new AbortController().signal);

    expect(result.status).toBe('LOCAL_STRUCTURAL_ASSESSMENT');
    if (result.status === 'LOCAL_STRUCTURAL_ASSESSMENT') {
      const derivation = result.derivation;
      const appliedRules = derivation.filter(d => d.outcome === 'APPLIED').map(d => d.rule);
      expect(appliedRules).toContain('L1_IDENTICAL_DIVISION');
    }
  });

  it('должен проходить через production entry point и применять A15 только если флаг включен', async () => {
    const dependencySet = dependencies();
    const service = new LocalStructuralReductionApplicationService(dependencySet);

    // Without flag A15_ENABLED
    const resultDisabled = await service.reduceExplicitly({
      rawText: '(x + x) / (x + x + x)',
      origin: 'explicit_user_action',
      requestedLocale: 'en-US',
      correlationId: 'INTEGRATION_A15_DISABLED',
      coreRecovery: failure('CORE_UNAVAILABLE'),
      enableA15: false,
    }, new AbortController().signal);

    expect(resultDisabled.status).toBe('LOCAL_STRUCTURAL_ASSESSMENT');
    if (resultDisabled.status === 'LOCAL_STRUCTURAL_ASSESSMENT') {
      const derivation = resultDisabled.derivation;
      const appliedRules = derivation.filter(d => d.outcome === 'APPLIED').map(d => d.rule);
      expect(appliedRules).not.toContain('A15_EQUAL_ORDER_STRUCTURAL_PROFILE');
    }

    // With flag A15_ENABLED
    const resultEnabled = await service.reduceExplicitly({
      rawText: '(x + x) / (x + x + x)',
      origin: 'explicit_user_action',
      requestedLocale: 'en-US',
      correlationId: 'INTEGRATION_A15_ENABLED',
      coreRecovery: failure('CORE_UNAVAILABLE'),
      enableA15: true,
    }, new AbortController().signal);

    expect(resultEnabled.status).toBe('LOCAL_STRUCTURAL_ASSESSMENT');
    if (resultEnabled.status === 'LOCAL_STRUCTURAL_ASSESSMENT') {
      const derivation = resultEnabled.derivation;
      const appliedRules = derivation.filter(d => d.outcome === 'APPLIED').map(d => d.rule);
      expect(appliedRules).toContain('A15_EQUAL_ORDER_STRUCTURAL_PROFILE');
      
      const a15Step = derivation.find(d => d.rule === 'A15_EQUAL_ORDER_STRUCTURAL_PROFILE');
      expect(a15Step).toBeDefined();
      // Should result in 2 / 3
      expect(resultEnabled.reduced.identity.canonical).toBe('2 / 3');
    }
  });
});
