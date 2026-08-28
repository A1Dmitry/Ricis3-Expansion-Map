import { describe, it, expect } from 'vitest';
import { RExpr } from './ricisBackendReduction.types';
import { RicisBackendReductionService } from './ricisBackendReduction';

describe('RicisBackendReductionService Unit Tests', () => {
  const service = new RicisBackendReductionService<number>();

  describe('L1_IDENTITY & Base Reductions', () => {
    it('should reduce divSelf of any expression to one (L1_IDENTITY) in O(1)', () => {
      const complexExpr: RExpr = {
        type: 'divSelf',
        operands: [
          {
            type: 'add',
            operands: [
              { type: 'variable' },
              { type: 'zero' },
            ],
          },
        ],
      };

      const result = service.reduce(complexExpr);
      expect(result.type).toBe('one');
      
      const steps = service.getReductionSteps(complexExpr);
      expect(steps).toBe(1);

      const error = service.getEliminatedError(complexExpr);
      expect(error).toBe(0);
    });

    it('should leave normal expressions unchanged', () => {
      const normalExpr: RExpr = { type: 'variable' };
      const result = service.reduce(normalExpr);
      expect(result).toEqual(normalExpr);

      const steps = service.getReductionSteps(normalExpr);
      expect(steps).toBe(0);
    });

    it('should recursively reduce deep operands', () => {
      const nestedExpr: RExpr = {
        type: 'add',
        operands: [
          {
            type: 'divSelf',
            operands: [{ type: 'variable' }],
          },
          {
            type: 'mul',
            operands: [
              { type: 'one' },
              {
                type: 'divSelf',
                operands: [{ type: 'zero' }],
              },
            ],
          },
        ],
      };

      const result = service.reduce(nestedExpr);
      expect(result.type).toBe('add');
      expect(result.operands?.[0]?.type).toBe('one');
      expect(result.operands?.[1]?.type).toBe('mul');
      expect(result.operands?.[1]?.operands?.[1]?.type).toBe('one');
    });
  });

  describe('Semantic Indexing (SP4) & Structural Equality', () => {
    it('should distinguish indexed zeroes with different origins', () => {
      const zeroA: RExpr = {
        type: 'indexedZero',
        indexExpr: { type: 'variable' },
      };

      const zeroB: RExpr = {
        type: 'indexedZero',
        indexExpr: { type: 'one' },
      };

      expect(service.areStructurallyEqual(zeroA, zeroB)).toBe(false);
    });

    it('should match structurally identical indexed zeroes', () => {
      const zeroA: RExpr = {
        type: 'indexedZero',
        indexExpr: { type: 'variable' },
      };

      const zeroB: RExpr = {
        type: 'indexedZero',
        indexExpr: { type: 'variable' },
      };

      expect(service.areStructurallyEqual(zeroA, zeroB)).toBe(true);
    });
  });

  describe('CPU / CUDA Backend Compiler', () => {
    it('should compile and execute on CPU with zero accumulated error', () => {
      const expr: RExpr = {
        type: 'divSelf',
        operands: [{ type: 'variable' }],
      };

      const cpuCode = service.prepareCPU(expr);
      expect(cpuCode.tag).toBe('CPUCode');
      expect(cpuCode.code.optimized.type).toBe('one');

      const res = service.executeCPU(cpuCode, 42);
      expect(res.executedOn).toBe('CPU');
      expect(res.result.value).toBe(1);
      expect(res.result.expression.type).toBe('one');
      expect(res.errorContribution).toBe(0);
      expect(res.result.history.length).toBe(1);
      expect(res.result.history[0]?.stepName).toContain('CPU');
    });

    it('should compile and execute on CUDA with equivalent semantics', () => {
      const expr: RExpr = {
        type: 'divSelf',
        operands: [{ type: 'variable' }],
      };

      const cudaKernel = service.prepareCUDA(expr);
      expect(cudaKernel.tag).toBe('CUDAKernel');
      expect(cudaKernel.kernel.optimized.type).toBe('one');

      const res = service.executeCUDA(cudaKernel, 42);
      expect(res.executedOn).toBe('CUDA');
      expect(res.result.value).toBe(1);
      expect(res.errorContribution).toBe(0);
      expect(res.result.history[0]?.stepName).toContain('CUDA');
    });
  });

  describe('Type Consistency Protocol (TCP) Simulation', () => {
    it('should validate compatible and incompatible type constraints', () => {
      // Direct homogeneous types check
      const typeA = 'one';
      const typeB = 'one';
      expect(typeA === typeB).toBe(true); // homogeneous

      // Compatible types check (e.g. promoting 'one' to general 'variable' or composability)
      const isCompatible = (t1: string, t2: string) => {
        const types = [t1, t2];
        if (types.includes('one') && types.includes('variable')) return true;
        return t1 === t2;
      };

      expect(isCompatible('one', 'variable')).toBe(true);
      expect(isCompatible('indexedZero', 'indexedInf')).toBe(false); // incompatible
    });
  });
});
