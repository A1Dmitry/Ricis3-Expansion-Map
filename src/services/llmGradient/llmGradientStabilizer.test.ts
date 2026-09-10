// ============================================================================
// RICIS-III v7.7 LLM GRADIENT STABILIZER UNIT TESTS (QA AUTOMATION SUITE)
// Strict DRY / SOLID / DDD / L1_IDENTITY / Axiom A6 / Safety Protocols SP1-SP4
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  IGeometricBridgeEngine,
  IGeometricBridgeResolution,
} from '../geometricBridge/geometricBridge.contracts';
import { GeometricBridgeEngine } from '../geometricBridge/geometricBridgeEngine';
import type { IGradientStabilizer, IGradientStabilizationInputDto } from './contracts/llmGradient.contracts';
import { RicisLlmGradientStabilizer } from './domain/ricisLlmGradientStabilizer';
import {
  SimpleTextDocumentFormatter,
  JsonDocumentFormatter,
  LatexProofDocumentFormatter,
  LeanProofDocumentFormatter,
} from '../logging';

describe('RicisLlmGradientStabilizer (QA Automation Verification)', () => {
  let bridgeEngine: IGeometricBridgeEngine;
  let stabilizer: IGradientStabilizer;

  beforeEach(() => {
    bridgeEngine = new GeometricBridgeEngine();
    stabilizer = new RicisLlmGradientStabilizer(bridgeEngine);
  });

  describe('1. Позитивные сценарии (Стандартное обучение)', () => {
    it('должен вычислять шаг оптимизатора для номинальных значений eta и gradNorm', () => {
      const input: IGradientStabilizationInputDto = {
        learningRate: 0.001,
        gradientNorm: 25.0,
        gradientComponents: [15.0, 20.0],
        layerName: 'transformer.layers.24.self_attn.q_proj',
        epochStep: 1042,
      };

      const result = stabilizer.stabilize(input);

      expect(result.invariant.complexity).toBe('O(1)');
      expect(result.invariant.phaseAreaInvariant).toBeCloseTo(0.025, 6);
      expect(result.invariant.weightDeltaNorm).toBeCloseTo(0.025, 6);
      expect(result.classicalOutcome.status).toBe('STABLE');
      expect(result.classicalOutcome.hasLossSpike).toBe(false);
      expect(Number.isNaN(result.invariant.phaseAreaInvariant)).toBe(false);
      expect(Number.isFinite(result.invariant.phaseAreaInvariant)).toBe(true);
    });
  });

  describe('2. Сингулярные сценарии (Взрыв градиента и Аксиома A6)', () => {
    it('должен нейтрализовать сингулярность 0_eta x inf_nabla_L без NaN и Infinity', () => {
      // Искусственный предельный случай: eta -> 0, ||grad|| -> экстремальная величина
      const input: IGradientStabilizationInputDto = {
        learningRate: 0.0,
        gradientNorm: 1e18,
        gradientComponents: [1e18, 0],
        layerName: 'lm_head.weight',
        epochStep: 5000,
      };

      const result = stabilizer.stabilize(input);

      // В IEEE-754: 0.0 * 1e18 = 0 или при делении на ноль было бы NaN/Inf
      expect(Number.isNaN(result.invariant.phaseAreaInvariant)).toBe(false);
      expect(Number.isFinite(result.invariant.phaseAreaInvariant)).toBe(true);
      expect(result.invariant.complexity).toBe('O(1)');
      expect(result.isLossSpikeNeutralized).toBe(true);
      expect(result.geometricResolution.axiomApplied).toBe('A6_GENERAL_PRODUCT');
    });

    it('должен выявлять Loss Spike в классическом оптимизаторе, но сохранять RICIS инвариант', () => {
      // Ситуация Loss Spike: градиент взрывается выше порога устойчивости fp16/bf16
      const input: IGradientStabilizationInputDto = {
        learningRate: 0.01,
        gradientNorm: 1e6, // Всплеск градиента (Loss Spike)
        layerName: 'attention.dense',
      };

      const result = stabilizer.stabilize(input);

      expect(result.classicalOutcome.hasLossSpike).toBe(true);
      expect(result.classicalOutcome.status).toBe('LOSS_SPIKE');
      expect(result.isLossSpikeNeutralized).toBe(true);
      expect(result.invariant.phaseAreaInvariant).toBe(10000.0);
    });
  });

  describe('3. Проверка DRY (Использование IGeometricBridgeEngine)', () => {
    it('обязан делегировать сингулярное перемножение векторов через Geometric Bridge Engine', () => {
      const mockResolution: IGeometricBridgeResolution = {
        degenerateVectorU: { x: 0.01, y: 0, label: '0_eta' },
        infiniteVectorV: { x: 0, y: 42.0, label: 'inf_grad' },
        uVector: { x: 0.01, y: 0, label: '0_eta' },
        vVector: { x: 0, y: 42.0, label: 'inf_grad' },
        skewProductDeterminant: 0.42,
        exactInvariantArea: 0.42,
        areaInvariant: 0.42,
        isDiagonalTelescope: false,
        classicalComparison: {
          classicalOutcome: 'NaN',
          cauchyLimitRequired: false,
        },
        computationalComplexity: 'O(1)',
        complexity: 'O(1)',
        formulaLatex: '0_{eta} \\times \\infty_{grad} = 0.42',
        axiomApplied: 'A6_GENERAL_PRODUCT',
        geometricMeaning: 'Mocked invariant area',
      };

      const spyResolve = vi.spyOn(bridgeEngine, 'resolveGeometricBridge').mockReturnValue(mockResolution);

      const input: IGradientStabilizationInputDto = {
        learningRate: 0.01,
        gradientNorm: 42.0,
      };

      const result = stabilizer.stabilize(input);

      expect(spyResolve).toHaveBeenCalledTimes(1);
      expect(spyResolve).toHaveBeenCalledWith(0.01, 42.0, expect.any(String), expect.any(String));
      expect(result.geometricResolution.areaInvariant).toBe(0.42);
      expect(result.geometricResolution.axiomApplied).toBe('A6_GENERAL_PRODUCT');

      spyResolve.mockRestore();
    });
  });

  describe('4. L1_IDENTITY (X = X) и сохранение семантических типов', () => {
    it('должен сохранять идентичность градиентных компонент и семантического индекса SP4', () => {
      const input: IGradientStabilizationInputDto = {
        learningRate: 0.005,
        gradientNorm: 10.0,
        gradientComponents: [6.0, 8.0],
      };

      const result = stabilizer.stabilize(input);

      // Проверка семантического выражения SP4
      expect(result.geometricResolution.uVector?.label).toContain('eta');
      expect(result.geometricResolution.vVector?.label).toContain('nabla');
      expect(result.invariant.ricisNumber.semanticIndex).toContain('nabla L');
      expect(result.invariant.ricisNumber.state).toBe('STABLE_INVARIANT');
    });
  });

  describe('5. Журнал трансформаций (TransformationLog) и Lean 4 трассировка', () => {
    it('должен формировать непрерывную цепочку трансформаций по всем фазам от -1 до 6', () => {
      const input: IGradientStabilizationInputDto = {
        learningRate: 0.002,
        gradientNorm: 50.0,
      };

      const result = stabilizer.stabilize(input);

      expect(result.transformationTrace.length).toBeGreaterThanOrEqual(6);
      
      const actions = result.transformationTrace.map((t) => t.action);
      expect(actions.some((a) => a.includes('L1 Identity'))).toBe(true);
      expect(actions.some((a) => a.includes('SP4 Semantic Indexing'))).toBe(true);
      expect(actions.some((a) => a.includes('Axiom A6 Geometric Bridge'))).toBe(true);
      expect(actions.some((a) => a.includes('TCP Consistency'))).toBe(true);

      // Проверка модели доказательства Lean 4
      expect(result.proofTraceModel.proofType).toBe('LEAN_4');
      expect(result.proofTraceModel.theoremName).toContain('llm_gradient_stability');
      expect(result.proofTraceModel.steps.length).toBeGreaterThanOrEqual(6);
      expect(result.proofTraceModel.isFullyVerified).toBe(true);
    });

    it('должен фиксировать сбой в трэйс и выбрасывать RicisLogAssertionError при нарушении L1 ("throw лучше чем игнор")', () => {
      const invalidInput: IGradientStabilizationInputDto = {
        learningRate: NaN,
        gradientNorm: 100.0,
      };

      const logger = (stabilizer as RicisLlmGradientStabilizer).getTraceLogger();

      expect(() => {
        stabilizer.stabilize(invalidInput);
      }).toThrow('RICIS L1 Violation: learningRate must be a valid non-NaN number');

      const entries = logger.getEntries();
      expect(entries.length).toBeGreaterThanOrEqual(1);
      const fatalRecord = entries.find((e) => e.severity === 'FATAL');
      expect(fatalRecord).toBeDefined();
      expect(fatalRecord?.message).toContain('learningRate must be a valid non-NaN number');
    });

    it('должен экспортировать трэйс стабилизатора во все 4 формата документов через IDocumentFormatter', () => {
      const input: IGradientStabilizationInputDto = {
        learningRate: 0.001,
        gradientNorm: 1000.0,
        layerName: 'layers.0.mlp.gate_proj',
      };

      stabilizer.stabilize(input);
      const entries = (stabilizer as RicisLlmGradientStabilizer).getTraceLogger().getEntries();

      // 1. Simple Text
      const textFormatter = new SimpleTextDocumentFormatter();
      const textDoc = textFormatter.format(entries, { title: 'Stabilizer Trace' });
      expect(textDoc).toContain('=== Stabilizer Trace ===');
      expect(textDoc).toContain('Phase 2: Axiom A6');

      // 2. JSON
      const jsonFormatter = new JsonDocumentFormatter();
      const jsonDoc = jsonFormatter.format(entries);
      const parsedJson = JSON.parse(jsonDoc);
      expect(parsedJson.totalEntries).toBeGreaterThanOrEqual(5);

      // 3. LaTeX
      const latexFormatter = new LatexProofDocumentFormatter();
      const latexDoc = latexFormatter.format(entries, {
        title: 'LLM Gradient Invariant Derivation',
        author: 'Dmitry V. Aleinikov',
      });
      expect(latexDoc).toContain('\\section*{LLM Gradient Invariant Derivation}');
      expect(latexDoc).toContain('A6\\_GENERAL\\_PRODUCT');

      // 4. Lean 4
      const leanFormatter = new LeanProofDocumentFormatter();
      const leanDoc = leanFormatter.format(entries, {
        taskId: 'registry-118',
        taskTitle: 'LLM Gradient Stabilization',
      });
      expect(leanDoc).toContain('theorem');
      expect(leanDoc).not.toContain('sorry');
    });
  });
});
