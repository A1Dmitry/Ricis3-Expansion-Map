// ============================================================================
// QA AUTOMATION SUITE: TRACE-DRIVEN LEAN 4 MVVM SYNTHESIS
// Master System Instruction: RICIS-III v7.7 Analytical Engine
// Author: Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { LeanTraceViewModelFactory } from './viewModel/leanTraceViewModelFactory';
import { LeanTraceDocumentTemplate } from './view/leanTraceDocumentTemplate';
import { TraceDrivenLeanProofGenerator } from './application/traceDrivenLeanProofGenerator';
import { LeanPreambleProvider } from './domain/leanPreambleProvider';
import { verifyLeanProof } from '../../model/leanVerifier';
import type { ITraceDrivenLeanProofGenerator } from './contracts/leanMvvm.contracts';
import type { ProofStep } from '../../model/types';

describe('TraceDrivenLeanProofGenerator (MVVM & Real ProofStep Traces)', () => {
  let generator: ITraceDrivenLeanProofGenerator;

  beforeEach(() => {
    // Инстанцирование через Dependency Injection (ООП)
    const preambleProvider = new LeanPreambleProvider();
    const vmFactory = new LeanTraceViewModelFactory();
    const template = new LeanTraceDocumentTemplate(preambleProvider);
    generator = new TraceDrivenLeanProofGenerator(vmFactory, template);
  });

  it('QA-TR-01: трансформирует реальные шаги ProofStep[] в валидную ViewModel', () => {
    const mockSteps: ProofStep[] = [
      {
        phase: -1,
        name: 'Type Check and Locality',
        action: 'VERIFY_L1',
        expression: '0_4 * inf_7',
      },
      {
        phase: 2,
        name: 'Geometric Bridge Reduction',
        action: 'APPLY_AXIOM_A6',
        expression: '0_4 * inf_7',
      },
    ];

    const leanCode = generator.generateProofFromTrace({
      taskId: 'trace_a6_test',
      taskTitle: 'A6 Geometric Bridge Verification',
      initialExpression: '0_4 * inf_7',
      finalInvariant: '28',
      steps: mockSteps,
      verifiedAxioms: ['A6', 'L1'],
    });

    expect(leanCode).toBeDefined();
    expect(leanCode.split('\n').length).toBeGreaterThanOrEqual(150);
    expect(leanCode).toContain('inductive RExpr');
    expect(leanCode).toContain('RICIS.Step.a6_skew_bridge');
    expect(leanCode).toContain('theorem theorem_trace_a6_test');
    expect(leanCode).toContain('theorem_trace_a6_test_derivation');
    expect(leanCode).toContain('exact RICIS.Step.a6_skew_bridge');
    expect(leanCode).not.toContain('sorry');
  });

  it('QA-TR-02: сквозная интеграция с трассировкой редукции (0_5 * inf_3)', () => {
    const traceSteps: ProofStep[] = [
      {
        phase: -1,
        name: 'Type Check & Orthogonal Vector Setup',
        action: 'VERIFY_L1',
        expression: '0_5 * inf_3',
      },
      {
        phase: 2,
        name: 'Geometric Bridge Skew Product Resolution',
        action: 'APPLY_AXIOM_A6',
        expression: '0_5 * inf_3',
      },
    ];

    const leanCode = generator.generateProofFromTrace({
      taskId: 'reducer_a6_bridge',
      taskTitle: 'Real Reducer Trace Evaluation',
      initialExpression: '0_5 * inf_3',
      finalInvariant: '15',
      steps: traceSteps,
      verifiedAxioms: ['A6', 'L1'],
    });

    const verification = verifyLeanProof(leanCode, 'A6 Reducer Trace', '0_5 * inf_3');
    expect(verification.isValid).toBe(true);
    expect(verification.status).toBe('STATIC_CHECK_PASSED');
    expect(verification.errors.length).toBe(0);
  });

  it('QA-TR-03: сквозная интеграция для деления на ноль 10 / 0 по аксиоме A1', () => {
    const mockSteps: ProofStep[] = [
      {
        phase: 2,
        name: 'A1 Indexing Division by Zero',
        action: 'APPLY_AXIOM_A1',
        expression: '10 / 0',
      },
    ];

    const leanCode = generator.generateProofFromTrace({
      taskId: 'a1_div_zero_task',
      taskTitle: 'A1 Indexing Formal Proof',
      initialExpression: '10 / 0',
      finalInvariant: 'inf_{10}',
      steps: mockSteps,
      verifiedAxioms: ['A1'],
    });

    expect(leanCode).toContain('RICIS.Step.a1_div_zero');
    expect(leanCode).toContain('A1_Indexing');
    const verification = verifyLeanProof(leanCode, 'A1 Div Zero', '10 / 0');
    expect(verification.isValid).toBe(true);
  });
});
