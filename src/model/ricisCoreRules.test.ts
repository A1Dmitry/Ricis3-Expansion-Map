import { describe, it, expect } from 'vitest';
import {
  buildCanonicalRicisProofLatex,
  containsSorry,
  transformCauchyToRicisBridge,
  auditProofContent
} from './ricisCoreRules';

describe('ricisCoreRules Unit Tests', () => {
  describe('buildCanonicalRicisProofLatex', () => {
    it('should generate a structural RICIS draft with an explicit external-verification boundary', () => {
      const latex = buildCanonicalRicisProofLatex('Test Singularity', '0_5 * inf_3', 'test-node');
      expect(latex).toContain('RICIS-III структурный черновик');
      expect(latex).toContain('0_5 * inf_3');
      expect(latex).toContain('A6');
      expect(latex).toContain('Geometric Bridge');
      expect(latex).toContain('REQUIRES_CORE_LEAN');
      expect(latex).not.toContain('theorem resolve_');
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
    it('should require external Lean verification for a canonical structural draft', () => {
      const canonicalProof = buildCanonicalRicisProofLatex('Axiom Verification', '0_4 * inf_4', 'node-1');
      const audit = auditProofContent(canonicalProof);
      expect(audit.isValid).toBe(false);
      expect(audit.issues.some(issue => issue.includes('Lean 4'))).toBe(true);
    });

    it('should detect missing RICIS rules or sorry placeholders', () => {
      const incompleteProof = 'Proof with sorry placeholder';
      const audit = auditProofContent(incompleteProof);
      expect(audit.isValid).toBe(false);
      expect(audit.issues.length).toBeGreaterThan(0);
    });

    it('should reject L\'Hôpital rule substitution as TUKHTA', () => {
      const lhopitalProof = 'RICIS proof using 0_f / 0_g = f\'/g\' and 0_F * \\infty_G = F * G https://doi.org/10.5281/zenodo.21529989';
      const audit = auditProofContent(lhopitalProof);
      expect(audit.isValid).toBe(false);
      expect(audit.issues.some(i => i.includes('Лопиталя'))).toBe(true);
      expect(audit.containsPlaceholders).toBe(true);
    });

    it('should reject circular reasoning in factorization (Petitio Principii) as TUKHTA', () => {
      const circularProof = 'факторизация: gamma = index_g / index_h, p = sqrt(N / |gamma|) https://doi.org/10.5281/zenodo.21529989 0_F * \\infty_G = F * G';
      const audit = auditProofContent(circularProof);
      expect(audit.isValid).toBe(false);
      expect(audit.issues.some(i => i.includes('круговая порука') || i.includes('Petitio Principii'))).toBe(true);
      expect(audit.containsPlaceholders).toBe(true);
    });

    it('should accept Axiom A15 Equal-Order Structural Profile resolution', () => {
      const a15Proof = `
        Доказательство устранения сингулярности по Аксиоме A15 (Equal-Order Structural Profile Law):
        Исходное выражение: (t - \\sin t) / t^3 в особой точке t = 0.
        Семантическая индексация SP4: числитель и знаменатель образуют нули 0_{t - \\sin t} и 0_{t^3}.
        Проверка SP2: алгебраическое сокращение общих полиномиальных множителей невозможно.
        Разрешение по Аксиоме A15:
        Структурный порядок нулей одинаков: ord_0(t - \\sin t) = ord_0(t^3) = 3 < \\infty.
        Структурные производные третьего порядка: D^3 (t - \\sin t)|_{t=0} = 1, D^3 (t^3)|_{t=0} = 6.
        Профили совместимы (PC), следовательно:
        Resolve([(t - \\sin t)/t^3], 0) := D^3(t - \\sin t)(0) / D^3(t^3)(0) = 1/6.
        Геометрическая реализация A6: 0_F * \\infty_G = F * G сохраняет ортогональные оси.
        Спецификация Lean 4: https://doi.org/10.5281/zenodo.21529989
      `;
      const audit = auditProofContent(a15Proof);
      expect(audit.issues.some(i => i.includes('Лопиталя'))).toBe(false);
      expect(audit.score).toBeGreaterThanOrEqual(70);
      expect(audit.isValid).toBe(true);
    });
  });
});
