// Existing public surface (kept for backward compatibility — R-01: do not redesign).
export * from './ast/ExpressionTypes';
export * from './engine/RicisEngineContracts';
export * from './engine/IRicisReductionEngine';
export * from './engine/RicisTypeScriptEngine';
export * from './engine/AlgebraicSimplifier';
export * from './engine/SemanticIndexer';
export * from './engine/SymbolicDifferentiator';
export * from './engine/FractionReducer';
export * from './engine/AstSubstitution';
export * from './evaluator/AstCompiler';
export * from './evaluator/AstEvaluator';
export * from './parser/LambdaParser';

// DDD domain layer (R-02 … R-07)
export * from './domain/Canonicalizer';
export * from './domain/Identity';
export * from './domain/InstanceId';
export * from './domain/SemanticType';
export * from './domain/Provenance';
export * from './domain/SemanticIndex';
export * from './domain/Monolith';

// Operations metadata layer (R-08 / R-09) — declarative catalog, no duplicated logic
export * from './operations/ResolutionPriority';
export * from './operations/ResolutionCatalog';

// Kernel (R-01 orchestration — reuses existing engine + SemanticIndexer + AlgebraicSimplifier SP2)
export * from './kernel/RicisKernel';

// Audit framework (closing principle: three independent layers)
export * from './audit/ThreeLayerAudit';
export * from './audit/ImplementationConveniences';
