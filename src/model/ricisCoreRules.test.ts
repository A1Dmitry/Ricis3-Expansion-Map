import { describe, it, expect } from 'vitest';
import {
  buildCanonicalRicisProofLatex,
  containsSorry,
  transformCauchyToRicisBridge,
  auditProofContent
} from './ricisCoreRules';

describe('ricisCoreRules Unit Tests', () => {
  describe('buildCanonicalRicisProofLatex', () => {
    it('should generate canonical RICIS-III proof LaTeX for given title, function, and id', () => {
      const latex = buildCanonicalRicisProofLatex('Test Singularity', '0_5 * inf_3', 'test-node');
      expect(latex).toContain('RICIS-III Аналитическое доказательство');
      expect(latex).toContain('0_5 * inf_3');
      expect(latex).toContain('A6');
      expect(latex).toContain('Geometric Bridge');
    });
  });

  describe('containsSorry', () => {
    it('should detect sorry in proof text', () => {
      expect(containsSorry('theorem foo : X = X := by sorry')).toBe(true);
      expect(containsSorry('theorem foo : X = X := by rfl')).toBe(false);
    });

    it('should handle undefined or null safely', () => {
      expect(containsSorry(undefined)).toBe(false);
      expect(containsSorry('')).toBe(false);
    });
  });

  describe('transformCauchyToRicisBridge', () => {
    it('should replace Cauchy limit syntax with RICIS bridge operators', () => {
      const input = '\\lim_{x \\to 0} \\frac{f(x)}{g(x)}';
      const transformed = transformCauchyToRicisBridge(input);
      expect(transformed).not.toContain('\\lim');
      expect(transformed).toContain('RICIS');
    });

    it('should leave canonical RICIS formulas unchanged', () => {
      const input = '\\text{det}(u,v) = F \\cdot G';
      const transformed = transformCauchyToRicisBridge(input);
      expect(transformed).toContain('F \\cdot G');
    });
  });

  describe('auditProofContent', () => {
    it('should validate canonical proofs with all essential RICIS phases', () => {
      const canonicalProof = buildCanonicalRicisProofLatex('Axiom Verification', '0_4 * inf_4', 'node-1');
      const audit = auditProofContent(canonicalProof);
      expect(audit.isValid).toBe(true);
      expect(audit.issues).toHaveLength(0);
    });

    it('should detect missing RICIS rules or sorry placeholders', () => {
      const incompleteProof = 'Proof with sorry placeholder';
      const audit = auditProofContent(incompleteProof);
      expect(audit.isValid).toBe(false);
      expect(audit.issues.length).toBeGreaterThan(0);
    });
  });
});
