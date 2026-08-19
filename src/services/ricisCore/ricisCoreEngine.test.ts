import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RicisFallbackEngine } from './RicisFallbackEngine';
import { RicisWasmBridge } from './RicisWasmBridge';
import { RicisEvaluationRequest } from './IRicisCoreEngine';

describe('RICIS-III Core Engine & Reference Bridge', () => {
  let engine: RicisFallbackEngine;

  beforeEach(() => {
    engine = new RicisFallbackEngine();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('L0 Continuity & Engine Status', () => {
    it('should not start the external runtime when the bridge is only constructed', () => {
      const bridge = new RicisWasmBridge();
      expect(bridge.status).toBe('uninitialized');
    });

    it('should return a controlled Core failure when no C# runtime is available', async () => {
      const bridge = new RicisWasmBridge();
      expect(bridge.status).toBe('uninitialized');

      const result = await bridge.evaluate({ expression: '0_5 * inf_3' });

      expect(result.success).toBe(false);
      if (result.success) throw new Error('Expected a controlled Core failure.');
      expect(result.code).toBe('CORE_UNAVAILABLE');
      expect(bridge.status).toBe('error');
    });

    it('should initialize successfully into ready state without throwing', async () => {
      await engine.initialize();
      expect(['ready_wasm', 'fallback_ts']).toContain(engine.status);
    });

    it('checks Core runtime status only on an explicit UI request and never invokes fallback', async () => {
      const fallbackSpy = vi.spyOn(RicisFallbackEngine.prototype, 'evaluate');
      vi.stubGlobal('window', {});
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ status: 'ready' }) }));

      const bridge = new RicisWasmBridge();
      expect(bridge.status).toBe('uninitialized');
      await expect(bridge.checkRuntimeStatus()).resolves.toBe('ready_api');
      expect(fallbackSpy).not.toHaveBeenCalled();
    });
  });

  describe('Strict Core bridge', () => {
    const healthReady = { ok: true, status: 200, json: async () => ({ status: 'ready' }) };

    it('does not invoke fallback when Core rejects a legacy monolith input', async () => {
      const fallbackSpy = vi.spyOn(RicisFallbackEngine.prototype, 'evaluate');
      vi.stubGlobal('window', {});
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce(healthReady)
        .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'Unexpected token', position: 1 }) }));

      const result = await new RicisWasmBridge().evaluate({ expression: '0_5 * inf_3' });

      expect(result.success).toBe(false);
      if (result.success) throw new Error('Expected CORE_INPUT_REJECTED.');
      expect(result.code).toBe('CORE_INPUT_REJECTED');
      expect(result.diagnostic.parserPosition).toBe(1);
      expect(fallbackSpy).not.toHaveBeenCalled();
    });

    it('returns a typed infrastructure failure for an invalid production endpoint without invoking fallback', async () => {
      const fallbackSpy = vi.spyOn(RicisFallbackEngine.prototype, 'evaluate');
      vi.stubEnv('VITE_RICIS_CORE_API_BASE_URL', 'http://insecure.example.test/api/ricis-core');
      vi.stubGlobal('window', {});
      vi.stubGlobal('fetch', vi.fn());

      const result = await new RicisWasmBridge().evaluate({ expression: 'x => 8 / 0' });

      expect(result.success).toBe(false);
      if (result.success) throw new Error('Expected CORE_INFRASTRUCTURE_ERROR.');
      expect(result.code).toBe('CORE_INFRASTRUCTURE_ERROR');
      expect(result.diagnostic.safeDetail).toContain('absolute HTTPS URL');
      expect(fallbackSpy).not.toHaveBeenCalled();
    });

    it('does not invoke fallback after a Core infrastructure error', async () => {
      const fallbackSpy = vi.spyOn(RicisFallbackEngine.prototype, 'evaluate');
      vi.stubGlobal('window', {});
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce(healthReady)
        .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ error: 'service unavailable' }) }));

      const result = await new RicisWasmBridge().evaluate({ expression: 'x => 8 / 0' });

      expect(result.success).toBe(false);
      if (result.success) throw new Error('Expected CORE_INFRASTRUCTURE_ERROR.');
      expect(result.code).toBe('CORE_INFRASTRUCTURE_ERROR');
      expect(fallbackSpy).not.toHaveBeenCalled();
    });

    it('rejects malformed successful payloads instead of accepting a false invariant', async () => {
      const fallbackSpy = vi.spyOn(RicisFallbackEngine.prototype, 'evaluate');
      vi.stubGlobal('window', {});
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce(healthReady)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ parsed: 'x => (8 / 0)' }) }));

      const result = await new RicisWasmBridge().evaluate({ expression: 'x => 8 / 0' });

      expect(result.success).toBe(false);
      if (result.success) throw new Error('Expected CORE_INVALID_RESPONSE.');
      expect(result.code).toBe('CORE_INVALID_RESPONSE');
      expect(fallbackSpy).not.toHaveBeenCalled();
    });

    it('retries Core discovery after a prior unavailable state without using fallback', async () => {
      const fallbackSpy = vi.spyOn(RicisFallbackEngine.prototype, 'evaluate');
      vi.stubGlobal('window', {});
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ status: 'unavailable' }) })
        .mockResolvedValueOnce(healthReady)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ricis: 'x => ∞_{8}' }) }));

      const bridge = new RicisWasmBridge();
      const first = await bridge.evaluate({ expression: 'x => 8 / 0' });
      expect(first.success).toBe(false);

      const recovered = await bridge.evaluate({ expression: 'x => 8 / 0' });
      expect(recovered.success).toBe(true);
      if (!recovered.success) throw new Error('Expected Core recovery to succeed.');
      expect(recovered.executionEngine).toBe('csharp_api');
      expect(fallbackSpy).not.toHaveBeenCalled();
    });

    it('accepts an explicit C# API result without creating fallback trace steps', async () => {
      const fallbackSpy = vi.spyOn(RicisFallbackEngine.prototype, 'evaluate');
      vi.stubGlobal('window', {});
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce(healthReady)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ricis: 'x => ∞_{8}' }) }));

      const result = await new RicisWasmBridge().evaluate({ expression: 'x => 8 / 0' });

      expect(result.success).toBe(true);
      if (!result.success) throw new Error('Expected a Core result.');
      expect(result.executionEngine).toBe('csharp_api');
      expect(result.invariant).toBe('x => ∞_{8}');
      expect(result.trace).toEqual([]);
      expect(fallbackSpy).not.toHaveBeenCalled();
    });
  });

  describe('Axiom A6: Geometric Bridge (0_F * inf_G = F * G)', () => {
    it('should resolve 0_5 * inf_3 to exact invariant 15 in O(1)', async () => {
      const request: RicisEvaluationRequest = {
        expression: '0_5 * inf_3',
        enableTracePhases: true,
      };
      const result = await engine.evaluate(request);

      expect(result.success).toBe(true);
      expect(result.invariant).toBe('15');
      expect(result.isSingular).toBe(true);
      expect(result.trace.length).toBeGreaterThanOrEqual(6);
      
      const phase2 = result.trace.find(t => t.phase.includes('Phase 2'));
      expect(phase2).toBeDefined();
      expect(phase2?.appliedAxiom).toBe('A6');
    });

    it('should resolve diagonal telescope 0_F * inf_F = F^2', async () => {
      const result = await engine.evaluate({ expression: '0_4 * inf_4' });
      expect(result.success).toBe(true);
      expect(result.invariant).toBe('16');
    });
  });

  describe('Axiom A4 & SP2/SP4: Zero Ratio (0_F / 0_G = F / G)', () => {
    it('should resolve 0_10 / 0_2 to 5', async () => {
      const result = await engine.evaluate({ expression: '0_10 / 0_2' });
      expect(result.success).toBe(true);
      expect(result.invariant).toBe('5');
    });

    it('should preserve L1 Identity: 0_F / 0_F = 1', async () => {
      const result = await engine.evaluate({ expression: '0_7 / 0_7' });
      expect(result.success).toBe(true);
      expect(result.invariant).toBe('1');
    });
  });

  describe('Axiom A1/A10 & A7: Singularity Indexing', () => {
    it('should convert scalar division F/0 into inf_F (A10)', async () => {
      const result = await engine.evaluate({ expression: '8 / 0' });
      expect(result.success).toBe(true);
      expect(result.invariant).toBe('inf_8');
    });

    it('should subtract infinities inf_F - inf_G = inf_(F-G) (A7)', async () => {
      const result = await engine.evaluate({ expression: 'inf_10 - inf_3' });
      expect(result.success).toBe(true);
      expect(result.invariant).toBe('inf_7');
    });
  });

  describe('L1 Identity Verification (X = X)', () => {
    it('should verify structural identity for identical expressions', async () => {
      const isIdentical = await engine.verifyIdentity('x^2 - 4', 'x^2 - 4');
      expect(isIdentical).toBe(true);
    });

    it('should reject identity for distinct semantic expressions', async () => {
      const isIdentical = await engine.verifyIdentity('0_F', '0_G');
      expect(isIdentical).toBe(false);
    });
  });

  describe('Formal Proof Generation & Verification', () => {
    it('should generate a formal proof via Geometric Bridge for 0_5 * inf_3', async () => {
      const proof = await engine.generateFormalProof('0_5 * inf_3', 'geometric_bridge');
      
      expect(proof.isVerified).toBe(true);
      expect(proof.method).toBe('geometric_bridge');
      expect(proof.conclusionInvariant).toBe('15');
      expect(proof.complexity).toBe('O(1)');
      expect(proof.steps.length).toBeGreaterThanOrEqual(4);
      
      const bridgeStep = proof.steps.find(s => s.justificationAxiom === 'A6');
      expect(bridgeStep).toBeDefined();
    });

    it('should generate a formal proof for L1 identity conservation (0_7 / 0_7 = 1)', async () => {
      const proof = await engine.generateFormalProof('0_7 / 0_7', 'identity_conservation');
      
      expect(proof.isVerified).toBe(true);
      expect(proof.conclusionInvariant).toBe('1');
      expect(proof.steps.some(s => s.justificationAxiom === 'L1')).toBe(true);
      expect(proof.steps.some(s => s.justificationAxiom === 'SP4')).toBe(true);
    });

    it('should generate a formal proof for singularity separation (SP1 / SP2)', async () => {
      const proof = await engine.generateFormalProof('(x-5)(x+5)/(x-5) at x=5', 'singularity_separation');
      
      expect(proof.isVerified).toBe(true);
      expect(proof.conclusionInvariant).toBe('10');
      expect(proof.steps.some(s => s.justificationAxiom === 'SP1')).toBe(true);
      expect(proof.steps.some(s => s.justificationAxiom === 'SP2')).toBe(true);
    });

    it('should verify valid proof chains through verifyProofChain', async () => {
      const proof = await engine.generateFormalProof('0_4 * inf_4', 'geometric_bridge');
      const verification = await engine.verifyProofChain(proof);
      
      expect(verification.valid).toBe(true);
      expect(verification.verifiedAxioms).toContain('A6');
    });

    it('should reject a proof chain with an unknown axiom after mutation', async () => {
      const proof = await engine.generateFormalProof('0_4 * inf_4', 'geometric_bridge');
      const mutated = {
        ...proof,
        steps: proof.steps.map((step, index) => index === 0 ? { ...step, justificationAxiom: 'A999' } : step),
      };

      const verification = await engine.verifyProofChain(mutated);

      expect(verification.valid).toBe(false);
      expect(verification.brokenStepIndex).toBe(0);
    });

    it('should reject a proof chain whose method lacks its required axiom', async () => {
      const proof = await engine.generateFormalProof('0_4 * inf_4', 'geometric_bridge');
      const mutated = { ...proof, method: 'identity_conservation' as const };

      const verification = await engine.verifyProofChain(mutated);

      expect(verification.valid).toBe(false);
      expect(verification.reason).toContain('A4');
    });

    it('should reject a proof chain with non-sequential step numbers', async () => {
      const proof = await engine.generateFormalProof('0_4 * inf_4', 'geometric_bridge');
      const mutated = {
        ...proof,
        steps: proof.steps.map((step, index) => index === 1 ? { ...step, stepNumber: 99 } : step),
      };

      const verification = await engine.verifyProofChain(mutated);

      expect(verification.valid).toBe(false);
      expect(verification.brokenStepIndex).toBe(1);
    });
  });

  describe('Lambda / String Serialization Proxy (lambdaToString & stringToLambda)', () => {
    it('should serialize arrow lambda functions to normalized strings', () => {
      const fn = (x: number) => x * 2;
      const str = engine.lambdaToString(fn);
      expect(str).toContain('x * 2');
    });

    it('should serialize standard function declarations to normalized strings', () => {
      function evaluateBridge(u: number, v: number) {
        return u * v;
      }
      const str = engine.lambdaToString(evaluateBridge);
      expect(str).toContain('u * v');
    });

    it('should compile string mathematical expressions to executable lambdas', () => {
      const lambda = engine.stringToLambda('x + y * 2');
      const result = lambda({ x: 3, y: 4 });
      expect(result).toBe(11);
    });

    it('should handle numeric and constant strings in stringToLambda', () => {
      const lambda = engine.stringToLambda('42');
      expect(lambda()).toBe(42);
    });
  });

  describe('Bracket Structure & Lean 4 Formal Verification (validateBrackets)', () => {
    it('should accept properly balanced brackets', () => {
      const code = '((a + b) * [c - d]) + {x: Type}';
      const result = engine.validateBrackets(code);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect mismatched closing brackets', () => {
      const code = 'theorem test : [x + y) := by';
      const result = engine.validateBrackets(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Несоответствие скобок') || e.includes('Mismatched'))).toBe(true);
    });

    it('should detect unclosed opening brackets', () => {
      const code = 'def foo := [(x + 1)';
      const result = engine.validateBrackets(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('незакрытая') || e.includes('Unclosed'))).toBe(true);
    });

    it('should detect unexpected closing brackets', () => {
      const code = 'x + y) := 10';
      const result = engine.validateBrackets(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('неожиданная') || e.includes('Лишняя') || e.includes('Unexpected'))).toBe(true);
    });
  });

  describe('Academic Proof Protocol (proveSystem)', () => {
    it('should resolve and prove a system of string premises matching expected goal', async () => {
      const premises = ['0_5 * inf_3', '0_7 / 0_7'];
      const expectedGoal = '15';
      
      const result = await engine.proveSystem(premises, expectedGoal, 'test-prob-1');
      
      expect(result.academicStatus).toBe('QED_VERIFIED');
      expect(result.goalMatched).toBe(true);
      expect(result.reducedInvariant).toBe('15');
      expect(result.complexity).toBe('O(1)');
      expect(result.steps.length).toBeGreaterThanOrEqual(4);
      expect(result.steps[0]?.phase).toContain('Phase -1');
    });

    it('should accept lambda functions as premises in proveSystem', async () => {
      const lambdaPremise = () => '0_10 / 0_2';
      const expectedGoal = '5';
      
      const result = await engine.proveSystem([lambdaPremise], expectedGoal, 'test-lambda-prob');
      
      expect(result.academicStatus).toBe('QED_VERIFIED');
      expect(result.goalMatched).toBe(true);
      expect(result.reducedInvariant).toBe('5');
    });

    it('should flag discrepancy when reduced invariant differs from expected goal', async () => {
      const premises = ['0_5 * inf_3'];
      const expectedGoal = '999'; // Intentionally wrong goal
      
      const result = await engine.proveSystem(premises, expectedGoal, 'test-discrepancy');
      
      expect(result.academicStatus).toBe('DISCREPANCY_DETECTED');
      expect(result.goalMatched).toBe(false);
      expect(result.reducedInvariant).toBe('15');
      expect(result.expectedGoal).toBe('999');
    });
  });
});
