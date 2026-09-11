// ============================================================================
// RICIS-III v7.7 LLM GRADIENT STABILIZER CONTRACTS (DDD / SOLID / DRY / OOP)
// DOI: 10.5281/zenodo.21491712 (Gradient Explosion Regularization in LLMs)
// Master Registry DOI: 10.5281/zenodo.21517353 | Node: registry-118
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import type {
  IGeometricBridgeEngine,
  IGeometricBridgeResolution,
  IRicisVector2D,
} from '../../geometricBridge/geometricBridge.contracts';
import type {
  TransformationLog,
  RicisNumber,
} from '../../localRicisReducer/oopContracts';
import type { IProofTraceExecutionModel } from '../../leanCodegen/contracts/leanMvvm.contracts';

/**
 * Статус классического оптимизатора (SGD, Adam, RMSprop) при сингулярности.
 */
export type ClassicalOptimizerStatus =
  | 'STABLE'
  | 'LOSS_SPIKE'
  | 'GRADIENT_EXPLOSION_NAN'
  | 'VANISHING_GRADIENT_STALL';

/**
 * Value Object: Параметр скорости обучения (Learning Rate).
 * Инкапсулирует вырожденный отрезок нулевой толщины: u = (eta, 0) в R^2_RICIS.
 */
export interface ILearningRateVo {
  readonly value: number;
  readonly isZeroSingular: boolean;
  readonly semanticIndexExpression: string; // e.g. "0_eta(t)"
  toRicisVector(): IRicisVector2D;
}

/**
 * Value Object: Градиентный вектор функции потерь.
 * Инкапсулирует бесконечную полосу градиента: v = (0, ||nabla L||) в R^2_RICIS.
 */
export interface IGradientVectorVo {
  readonly norm: number;
  readonly components: readonly number[];
  readonly isInfiniteSingular: boolean;
  readonly semanticIndexExpression: string; // e.g. "inf_nabla_L"
  toRicisVector(): IRicisVector2D;
}

/**
 * Журнал преобразований градиентного шага
 */
export interface IGradientTransformationLogItem {
  readonly sequence: number;
  readonly phase: string | number;
  readonly action: string;
  readonly stateBefore: string;
  readonly stateAfter: string;
  readonly axiomUsed: string;
  readonly rationaleCode?: string;
  readonly input?: number;
  readonly output?: number;
}

/**
 * Структурное число RICIS для градиентного инварианта
 */
export interface IGradientRicisNumber<T = number> {
  readonly value: T;
  readonly typeTag: string;
  readonly state: 'STABLE_INVARIANT' | 'SINGULAR_RESOLVED' | 'SINGULAR_DEFERRED';
  readonly semanticIndex: string;
  readonly identityHash: string;
  readonly history?: readonly any[];
}

/**
 * Value Object: Топологический инвариант шага обновления весов (Аксиома A6).
 */
export interface IGradientStepInvariantVo {
  readonly weightDeltaNorm: number;
  readonly phaseAreaInvariant: number; // det(u, v) = eta * ||nabla L||
  readonly complexity: 'O(1)';
  readonly formulaLatex: string;
  readonly ricisNumber: IGradientRicisNumber<number>;
}

/**
 * DTO: Входные данные для оптимизационного шага.
 */
export interface IGradientStabilizationInputDto {
  readonly learningRate: number;
  readonly gradientNorm: number;
  readonly gradientComponents?: readonly number[];
  readonly layerName?: string;
  readonly epochStep?: number;
}

/**
 * DTO: Результат стабилизации и сопоставления с классическим оптимизатором.
 */
export interface IGradientStabilizationResultDto {
  readonly input: IGradientStabilizationInputDto;
  readonly invariant: IGradientStepInvariantVo;
  readonly geometricResolution: IGeometricBridgeResolution;
  readonly classicalOutcome: {
    readonly status: ClassicalOptimizerStatus;
    readonly rawFloatProduct: number; // может быть NaN / Infinity в IEEE-754
    readonly hasLossSpike: boolean;
    readonly diagnosticMessage: string;
  };
  readonly transformationTrace: readonly IGradientTransformationLogItem[];
  readonly proofTraceModel: IProofTraceExecutionModel;
  readonly isLossSpikeNeutralized: boolean;
  readonly timestamp: number;
}

/**
 * Интерфейс оптимизатора (Dependency Inversion).
 */
export interface IGradientStabilizer {
  stabilize(input: IGradientStabilizationInputDto): IGradientStabilizationResultDto;
}

import type { ILog } from '../../logging/contracts/ricisLog.contracts';
import { createRicisLogger } from '../../logging';
import type { ProofStep } from '../../../model/types';

/**
 * Базовый абстрактный класс (Шаблонный метод / Template Method)
 * Обеспечивает строгий порядок фаз RICIS-III (Phases -1 ... 6).
 */
export abstract class AbstractGradientStabilizer implements IGradientStabilizer {
  protected readonly logger: ILog<string, ProofStep>;

  public constructor(
    protected readonly bridgeEngine: IGeometricBridgeEngine,
    traceLogger?: ILog<string, ProofStep>
  ) {
    this.logger = traceLogger ?? createRicisLogger<string, ProofStep>('GradientStabilizer');
  }

  public getTraceLogger(): ILog<string, ProofStep> {
    return this.logger;
  }

  /**
   * Шаблонный метод выполнения пайплайна стабилизации
   */
  public stabilize(input: IGradientStabilizationInputDto): IGradientStabilizationResultDto {
    this.logger.clear();

    // Phase -1: L1 Identity & Type Boundary
    this.assertL1IdentityAndTypes(input);

    // Phase 0: Elimination of Cauchy limits and NaNs
    this.eliminateLimits(input);

    // Phase 0.5: Semantic Indexing SP4
    const { lrVo, gradVo } = this.createSemanticValueObjects(input);

    // Phase 1: Safety Protocols & Algebraic Reduction SP2
    this.applySafetyReductions(lrVo, gradVo);

    // Phase 2: RICIS Transform via Axiom A6 Geometric Bridge (DRY delegation)
    const geometricResolution = this.bridgeEngine.resolveGeometricBridge(
      lrVo.value,
      gradVo.norm,
      lrVo.semanticIndexExpression,
      gradVo.semanticIndexExpression
    );

    // Phase 3 & 4: Invariant calculation and TCP verification
    const invariantVo = this.computeInvariant(geometricResolution, lrVo, gradVo);

    // Phase 5: Classical comparison baseline
    const classicalComparison = this.evaluateClassicalBaseline(input);

    // Phase 6: L1 Verification & Trace Assembly
    return this.assembleStabilizationResult(
      input,
      invariantVo,
      geometricResolution,
      classicalComparison
    );
  }

  protected abstract assertL1IdentityAndTypes(input: IGradientStabilizationInputDto): void;
  protected abstract eliminateLimits(input: IGradientStabilizationInputDto): void;
  protected abstract createSemanticValueObjects(
    input: IGradientStabilizationInputDto
  ): { lrVo: ILearningRateVo; gradVo: IGradientVectorVo };
  protected abstract applySafetyReductions(lr: ILearningRateVo, grad: IGradientVectorVo): void;
  protected abstract computeInvariant(
    geo: IGeometricBridgeResolution,
    lr: ILearningRateVo,
    grad: IGradientVectorVo
  ): IGradientStepInvariantVo;
  protected abstract evaluateClassicalBaseline(
    input: IGradientStabilizationInputDto
  ): IGradientStabilizationResultDto['classicalOutcome'];
  protected abstract assembleStabilizationResult(
    input: IGradientStabilizationInputDto,
    invariant: IGradientStepInvariantVo,
    geo: IGeometricBridgeResolution,
    classical: IGradientStabilizationResultDto['classicalOutcome']
  ): IGradientStabilizationResultDto;
}
