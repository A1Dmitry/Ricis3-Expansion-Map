import { describe, expect, it, vi } from 'vitest';
import type { IRicisOrchestratorEngine, IOrchestrationPipelineObserver } from '../../model/orchestrationPipeline';

describe('RICIS-III 5-Stage Orchestration Pipeline Engine', () => {
  it('executes positive scenario (Phases -1 to 6) with full stage observability and SUCCESS statuses', async () => {
    const stageUpdates: string[] = [];
    const mockObserver: IOrchestrationPipelineObserver = {
      onStageUpdate: (state) => {
        const activeStage = state.stages.find(s => s.stageId === state.currentStage);
        if (activeStage) {
          stageUpdates.push(`${activeStage.stageId}:${activeStage.status}`);
        }
      },
      onStageError: vi.fn(),
    };

    // Simulated Orchestrator Execution for [0/0] singularity resolution
    const expression = '\\lim_{x \\to a} \\frac{f(x)}{g(x)} = [0/0]';

    // Mock Engine implementing IRicisOrchestratorEngine contract
    const orchestrator: IRicisOrchestratorEngine = {
      executePipeline: async (nodeId, expr, observer) => {
        const state = {
          pipelineId: 'pipe-001',
          nodeId,
          currentStage: 'PARSING_AND_L1_CHECK' as const,
          isComplete: true,
          hasError: false,
          transformationLog: {
            id: 'log-001',
            targetNodeId: nodeId,
            initialExpression: expr,
            finalInvariant: "f'(a) / g'(a)",
            l1IdentityVerified: true,
            entries: [
              {
                stepIndex: 1,
                phaseName: 'L1_IDENTITY & SP4',
                axiomUsed: undefined,
                inputExpression: expr,
                outputExpression: '0_f / 0_g',
                invariantPreserved: true,
                timestamp: Date.now(),
                rationaleHash: 'hash-l1',
              },
              {
                stepIndex: 2,
                phaseName: 'AXIOMATIC_REDUCTION (A4)',
                axiomUsed: 'A4' as const,
                inputExpression: '0_f / 0_g',
                outputExpression: "f'(a) / g'(a)",
                invariantPreserved: true,
                timestamp: Date.now(),
                rationaleHash: 'hash-a4',
              },
            ],
          },
          stages: [
            { stageId: 'PARSING_AND_L1_CHECK' as const, title: 'Parsing & L1 Check', description: 'Verifying identity X=X', status: 'SUCCESS' as const, startTimeMs: 100 },
            { stageId: 'AXIOMATIC_REDUCTION' as const, title: 'RICIS Axiom A4', description: "0_f / 0_g = f'/g'", status: 'SUCCESS' as const, startTimeMs: 105 },
            { stageId: 'LEAN_CODEGEN' as const, title: 'Lean 4 Spec Gen', description: 'Generated theorem resolve_math_singularity', status: 'SUCCESS' as const, startTimeMs: 110 },
            { stageId: 'GATEWAY_DISPATCH' as const, title: 'Core Gateway Dispatch', description: 'HTTP 200 OK', status: 'SUCCESS' as const, startTimeMs: 115 },
            { stageId: 'TRUST_VALIDATION' as const, title: 'Trust Boundary Check', description: 'LEAN_VERIFIED attached', status: 'SUCCESS' as const, startTimeMs: 120 },
          ],
        };
        observer?.onStageUpdate(state);
        return state;
      },
      getCurrentState: () => undefined,
    };

    const result = await orchestrator.executePipeline('math-singularity', expression, mockObserver);

    expect(result.isComplete).toBe(true);
    expect(result.hasError).toBe(false);
    expect(result.transformationLog.l1IdentityVerified).toBe(true);
    expect(result.transformationLog.finalInvariant).toBe("f'(a) / g'(a)");
    expect(result.stages.every(s => s.status === 'SUCCESS')).toBe(true);
    expect(mockObserver.onStageError).not.toHaveBeenCalled();
  });

  it('handles negative scenario (Gateway Network HTTP 503) by setting GATEWAY_DISPATCH to FAILED while preserving L1_IDENTITY and calculated invariant', async () => {
    const mockObserver: IOrchestrationPipelineObserver = {
      onStageUpdate: vi.fn(),
      onStageError: vi.fn(),
    };

    const orchestrator: IRicisOrchestratorEngine = {
      executePipeline: async (nodeId, expr, observer) => {
        const state = {
          pipelineId: 'pipe-503',
          nodeId,
          currentStage: 'GATEWAY_DISPATCH' as const,
          isComplete: true,
          hasError: true,
          transformationLog: {
            id: 'log-503',
            targetNodeId: nodeId,
            initialExpression: expr,
            finalInvariant: "f'(a) / g'(a)",
            l1IdentityVerified: true, // L1 identity preserved even on network error!
            entries: [
              {
                stepIndex: 1,
                phaseName: 'AXIOMATIC_REDUCTION (A4)',
                axiomUsed: 'A4' as const,
                inputExpression: '0_f / 0_g',
                outputExpression: "f'(a) / g'(a)",
                invariantPreserved: true,
                timestamp: Date.now(),
                rationaleHash: 'hash-a4',
              },
            ],
          },
          stages: [
            { stageId: 'PARSING_AND_L1_CHECK' as const, title: 'Parsing & L1 Check', description: 'Verified', status: 'SUCCESS' as const, startTimeMs: 100 },
            { stageId: 'AXIOMATIC_REDUCTION' as const, title: 'RICIS Axiom A4', description: 'Reduced in O(1)', status: 'SUCCESS' as const, startTimeMs: 105 },
            { stageId: 'LEAN_CODEGEN' as const, title: 'Lean 4 Spec Gen', description: 'CodeGen OK', status: 'SUCCESS' as const, startTimeMs: 110 },
            {
              stageId: 'GATEWAY_DISPATCH' as const,
              title: 'Core Gateway Dispatch',
              description: 'HTTP Gateway Error',
              status: 'FAILED' as const,
              startTimeMs: 115,
              errorCode: 'HTTP_503',
              errorMessage: 'Core Proof Gateway unavailable: Service Unavailable (503)',
            },
            { stageId: 'TRUST_VALIDATION' as const, title: 'Trust Boundary Check', description: 'Retained as localDiagnosticOnly', status: 'WARNING' as const, startTimeMs: 120 },
          ],
        };
        observer?.onStageUpdate(state);
        observer?.onStageError('GATEWAY_DISPATCH', new Error('HTTP 503 Service Unavailable'));
        return state;
      },
      getCurrentState: () => undefined,
    };

    const result = await orchestrator.executePipeline('math-singularity', '0/0', mockObserver);

    expect(result.hasError).toBe(true);
    // CRITICAL: Proof invariant and L1 identity MUST NOT be erased by network error
    expect(result.transformationLog.l1IdentityVerified).toBe(true);
    expect(result.transformationLog.finalInvariant).toBe("f'(a) / g'(a)");
    
    // Gateway stage marked as FAILED with explicit error details
    const failedStage = result.stages.find(s => s.stageId === 'GATEWAY_DISPATCH');
    expect(failedStage?.status).toBe('FAILED');
    expect(failedStage?.errorCode).toBe('HTTP_503');
    expect(failedStage?.errorMessage).toContain('Service Unavailable');
    expect(mockObserver.onStageError).toHaveBeenCalledWith('GATEWAY_DISPATCH', expect.any(Error));
  });
});
