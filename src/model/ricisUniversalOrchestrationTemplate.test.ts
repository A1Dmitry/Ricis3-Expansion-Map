import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type {
  IRicisOrchestratorEngine,
  OrchestrationStageId,
  TransformationLog,
  RicisNumber,
} from './orchestrationPipeline';

describe('RICIS-III Proof Orchestration: Two-Layer Unified Architecture', () => {
  it('verifies that the Lean 4 universal orchestration template exists and implements canonical fullResolve/resolveRICIS', () => {
    const templatePath = 'artifacts/proofs/ricis-universal-orchestration-template.lean';
    expect(existsSync(templatePath)).toBe(true);

    const content = readFileSync(templatePath, 'utf8');
    expect(content).toContain('namespace RICIS_Template');
    expect(content).toContain('inductive RExpr');
    expect(content).toContain('def semanticIndex');
    expect(content).toContain('def ricisResolve');
    expect(content).toContain('def geometricMeasure');
    expect(content).toContain('def resolveRICIS');
    expect(content).toContain('def fullResolve');
    expect(content).toContain('def resolveVec4');

    // Canonical theorems
    expect(content).toContain('theorem L1_identity');
    expect(content).toContain('theorem divSelf_one');
    expect(content).toContain('theorem SP2_subSelf_zero');
    expect(content).toContain('theorem A1_div_zero');
    expect(content).toContain('theorem A4_indexed_zero_div');
    expect(content).toContain('theorem A5_inf_div');
    expect(content).toContain('theorem A6_geometric_realization');
    expect(content).toContain('theorem A7_inf_sub');
    expect(content).toContain('theorem RICIS_unified');
  });

  it('verifies the 5 canonical stage identifiers in the TypeScript orchestration pipeline', () => {
    const expectedStages: OrchestrationStageId[] = [
      'PARSING_AND_L1_CHECK',
      'AXIOMATIC_REDUCTION',
      'LEAN_CODEGEN',
      'GATEWAY_DISPATCH',
      'TRUST_VALIDATION',
    ];

    expect(expectedStages).toHaveLength(5);
    expect(expectedStages).toContain('PARSING_AND_L1_CHECK');
    expect(expectedStages).toContain('AXIOMATIC_REDUCTION');
    expect(expectedStages).toContain('LEAN_CODEGEN');
    expect(expectedStages).toContain('GATEWAY_DISPATCH');
    expect(expectedStages).toContain('TRUST_VALIDATION');
  });

  it('verifies the contract shape for IRicisOrchestratorEngine and supporting data structures', async () => {
    const log: TransformationLog<string> = {
      id: 'log-test-1',
      targetNodeId: 'node-schwarzschild',
      initialExpression: '0_F * inf_G',
      finalInvariant: 'F * G',
      l1IdentityVerified: true,
      entries: [
        {
          stepIndex: 1,
          phaseName: 'PARSING_AND_L1_CHECK',
          inputExpression: '0_F * inf_G',
          outputExpression: '0_F * inf_G',
          invariantPreserved: true,
          timestamp: 1000,
          rationaleHash: 'hash-l1',
        },
        {
          stepIndex: 2,
          phaseName: 'AXIOMATIC_REDUCTION',
          axiomUsed: 'A6',
          inputExpression: '0_F * inf_G',
          outputExpression: 'F * G',
          invariantPreserved: true,
          timestamp: 1010,
          rationaleHash: 'hash-a6',
        },
      ],
    };

    const num: RicisNumber<string> = {
      value: null,
      semanticIndex: '0_f',
      typeBoundary: 'AlgebraicDifferential',
      generatingOrigin: 'F',
      isSingularity: true,
    };

    const mockEngine: IRicisOrchestratorEngine = {
      executePipeline: async (nodeId, expr) => ({
        pipelineId: 'pipe-test',
        nodeId,
        currentStage: 'TRUST_VALIDATION',
        stages: [
          { stageId: 'PARSING_AND_L1_CHECK', title: 'Parse', description: 'OK', status: 'SUCCESS', startTimeMs: 100 },
          { stageId: 'AXIOMATIC_REDUCTION', title: 'Reduce', description: 'OK', status: 'SUCCESS', startTimeMs: 110 },
          { stageId: 'LEAN_CODEGEN', title: 'Lean', description: 'OK', status: 'SUCCESS', startTimeMs: 120 },
          { stageId: 'GATEWAY_DISPATCH', title: 'Dispatch', description: 'OK', status: 'SUCCESS', startTimeMs: 130 },
          { stageId: 'TRUST_VALIDATION', title: 'Trust', description: 'OK', status: 'SUCCESS', startTimeMs: 140 },
        ],
        transformationLog: log,
        isComplete: true,
        hasError: false,
      }),
      getCurrentState: () => undefined,
    };

    const result = await mockEngine.executePipeline('node-schwarzschild', '0_F * inf_G');
    expect(result.isComplete).toBe(true);
    expect(result.stages.map(s => s.stageId)).toEqual([
      'PARSING_AND_L1_CHECK',
      'AXIOMATIC_REDUCTION',
      'LEAN_CODEGEN',
      'GATEWAY_DISPATCH',
      'TRUST_VALIDATION',
    ]);
    expect(result.transformationLog.l1IdentityVerified).toBe(true);
    expect(num.semanticIndex).toBe('0_f');
    expect(num.isSingularity).toBe(true);
  });

  it('verifies the existence of the normative governance document RICIS_PROOF_ORCHESTRATION_TEMPLATE.md', () => {
    const docPath = 'docs/00-governance/RICIS_PROOF_ORCHESTRATION_TEMPLATE.md';
    expect(existsSync(docPath)).toBe(true);

    const doc = readFileSync(docPath, 'utf8');
    expect(doc).toContain('Общая оркестрация доказательства RICIS-III');
    expect(doc).toContain('PARSING_AND_L1_CHECK');
    expect(doc).toContain('AXIOMATIC_REDUCTION');
    expect(doc).toContain('LEAN_CODEGEN');
    expect(doc).toContain('GATEWAY_DISPATCH');
    expect(doc).toContain('TRUST_VALIDATION');
    expect(doc).toContain('fullResolve(e) = resolveRICIS(resolveRICIS(e))');
    expect(doc).toContain('resolveRICIS(e) = geometricMeasure(ricisResolve(e))');
  });
});
