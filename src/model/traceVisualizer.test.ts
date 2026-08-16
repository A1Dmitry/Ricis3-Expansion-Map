import { describe, it, expect } from 'vitest';
import type { ITransformationLogDTO, ITraceStepDTO, ITypeConsistencyProtocol } from './traceVisualizer.types';

describe('Trace Visualizer DTO and Protocol Tests', () => {
  it('должен правильно валидировать L1 Identity по TCP протоколу', () => {
    const tcp: ITypeConsistencyProtocol = {
      verifyL1Identity: (originalExpression: string, reducedInvariant: string) => {
        // Заглушка для теста: проверяет, не потерян ли структурный смысл.
        return originalExpression !== '' && reducedInvariant !== 'NaN' && reducedInvariant !== 'undefined';
      },
      assertSemanticIndexPreserved: (originalIndex: string, trace: ITransformationLogDTO) => {
        return trace.semanticIndex === originalIndex;
      }
    };

    const isL1Preserved = tcp.verifyL1Identity('0_F/0_F', '1');
    expect(isL1Preserved).toBe(true);

    const isInvalid = tcp.verifyL1Identity('0_F/0_F', 'NaN');
    expect(isInvalid).toBe(false);
  });

  it('объект ITransformationLogDTO должен корректно хранить шаги истории', () => {
    const mockStep: ITraceStepDTO = {
      phaseIdentifier: 2,
      phaseBadgeLabel: '[Phase 2]',
      title: 'Apply Axiom A6',
      inputState: '0_F * \\infty_G',
      outputState: 'F \\cdot G',
      appliedAxiom: 'A6',
      complexity: 'O(1)',
      isAxiomApplied: true,
      requiresL1Verification: false
    };

    const log: ITransformationLogDTO = {
      evaluationId: 'test-eval',
      targetExpression: '0_F * \\infty_G',
      finalInvariant: 'F \\cdot G',
      isSingular: true,
      semanticIndex: 'F, G',
      steps: [mockStep]
    };

    expect(log.steps).toHaveLength(1);
    expect(log.steps[0]?.complexity).toBe('O(1)');
    expect(log.steps[0]?.isAxiomApplied).toBe(true);
  });
});
