import { LocalStructuralReductionApplicationService, StructuralExpressionMapper, StructuralReducer, StructuralReductionAdmissionPolicy } from './src/services/localRicisReducer/index.js';
import { LocalAnalysisApplicationService, LocalAnalysisTraceFactory, LocalExpressionNormalizer, LocalExpressionParser, LocalPatternClassifier, LocalRicisAnalyzer, LocalSemanticIndexer, LocalStructuralIdentityComparator, SourceExpressionFactory, DEFAULT_LOCAL_ANALYZER_LIMITS } from './src/services/localRicisAnalyzer/localRicisAnalyzer.js';

const FIXED_TIME = 1_735_689_600_000;
const limits = { ...DEFAULT_LOCAL_ANALYZER_LIMITS, maxInputCharacters: 128, maxTokenCount: 64, maxAstDepth: 16, maxTraceEntries: 64 };
const rlimits = { maxStructuralDepth: 16, maxDerivationSteps: 64, maxSemanticKeysPerExpression: 32, maxFactorsPerProduct: 16 };

const analyzer = new LocalRicisAnalyzer({
  parser: new LocalExpressionParser(), normalizer: new LocalExpressionNormalizer(), identityComparator: new LocalStructuralIdentityComparator(), semanticIndexer: new LocalSemanticIndexer(), patternClassifier: new LocalPatternClassifier(), traceFactory: new LocalAnalysisTraceFactory(), clock: { now: () => FIXED_TIME }, limits
});
const app = new LocalAnalysisApplicationService(new SourceExpressionFactory(), analyzer, limits);
const mapper = new StructuralExpressionMapper(rlimits);
const reducer = new StructuralReducer(rlimits);
const policy = new StructuralReductionAdmissionPolicy();

const service = new LocalStructuralReductionApplicationService({ analysisApplication: app, mapper, reducer, admissionPolicy: policy, limits: rlimits });

service.reduceExplicitly({
  rawText: 'x / 0', origin: 'explicit_user_action', requestedLocale: 'en-US', correlationId: 'TEST', coreRecovery: { success: false, code: 'CORE_UNAVAILABLE', userMessage: 'x', diagnostic: { origin: 'terminal', runtime: 'not_ready', retryable: true, occurredAt: FIXED_TIME } }
}, new AbortController().signal).then(r => console.log(JSON.stringify(r, null, 2)));
