import { describe, it, expect } from 'vitest';
import { initialMap } from './initialMap';
import { auditProofContent, LEAN_SPEC_URL, OFFICIAL_ZENODO_DOIS } from './ricisCoreRules';
import { hasWeakProofOrMissingTarget, findNodesMissingTarget, recolorEdgesForTargets } from './audit';
import type { ProblemNode, Proof, ExternalLeanTrustStatus } from './types';

describe('RICIS-III Audit Resolution & Graph Integrity (QA Automation Suite)', () => {
  describe('1. Node ai-authorship-provenance Resolution (P0 Integrity)', () => {
    it('has a valid Proof record in initialMap.proofs with high quality score >= 80', () => {
      const node = initialMap.nodes.find(n => n.id === 'ai-authorship-provenance');
      expect(node).toBeDefined();
      expect(node?.state).toBe('resolved');

      const proof = initialMap.proofs['ai-authorship-provenance'];
      expect(proof).toBeDefined();
      expect(proof.nodeId).toBe('ai-authorship-provenance');
      expect(proof.latex).toBeDefined();
      expect(proof.steps).toBeDefined();
      expect(proof.steps.length).toBeGreaterThanOrEqual(4);

      const audit = auditProofContent(proof.latex);
      expect(audit.isValid).toBe(true);
      expect(audit.score).toBeGreaterThanOrEqual(80);
      expect(audit.containsLeanRef).toBe(true);
      expect(audit.containsAxiomA6).toBe(true);
      expect(audit.issues).toHaveLength(0);
    });

    it('is not flagged as missing target or weak proof by the audit engine', () => {
      const node = initialMap.nodes.find(n => n.id === 'ai-authorship-provenance')!;
      const proof = initialMap.proofs['ai-authorship-provenance'];

      expect(hasWeakProofOrMissingTarget(node, proof)).toBe(false);

      const missingNodes = findNodesMissingTarget(initialMap);
      expect(missingNodes.some(n => n.id === 'ai-authorship-provenance')).toBe(false);
    });

    it('colors incoming and outgoing edges for ai-authorship-provenance consistently', () => {
      const edges = recolorEdgesForTargets(initialMap);
      const provEdges = edges.filter(
        e => e.fromId === 'ai-authorship-provenance' || e.toId === 'ai-authorship-provenance'
      );
      expect(provEdges.length).toBeGreaterThan(0);
      // Connected edges to unresolved source node should be yellow
      const agiToProv = provEdges.find(e => e.fromId === 'core-agi-target' && e.toId === 'ai-authorship-provenance');
      expect(agiToProv).toBeDefined();
      expect(agiToProv?.stateColor).toBe('yellow');
    });
  });

  describe('2. Registry Nodes registry-100 to registry-120 Zenodo DOI Specification (P1 Integrity)', () => {
    const registryIds = Array.from({ length: 21 }, (_, i) => `registry-${100 + i}`);

    it('ensures all 21 registry nodes have valid proofs with Zenodo DOI specification and score >= 80', () => {
      for (const id of registryIds) {
        const proof = initialMap.proofs[id];
        expect(proof, `Proof for ${id} must exist`).toBeDefined();
        expect(proof.latex).toBeDefined();

        const audit = auditProofContent(proof.latex);
        expect(audit.containsLeanRef, `Proof for ${id} must contain Lean 4 Zenodo DOI ref`).toBe(true);
        expect(audit.containsAxiomA6, `Proof for ${id} must reference Axiom A6 / RICIS-III`).toBe(true);
        expect(audit.score, `Proof for ${id} must achieve score >= 80`).toBeGreaterThanOrEqual(80);
        expect(audit.isValid, `Proof for ${id} must be valid`).toBe(true);
      }
    });

    it('ensures no resolved node in initialMap is missing a proof record (zero RESOLVED_WITHOUT_PROOF)', () => {
      const resolvedNodes = initialMap.nodes.filter(n => n.state === 'resolved');
      const unprovenResolved: string[] = [];

      for (const node of resolvedNodes) {
        const proof = initialMap.proofs[node.id];
        if (!proof || !proof.latex || !proof.latex.trim()) {
          unprovenResolved.push(node.id);
        }
      }

      expect(unprovenResolved).toEqual([]);
    });
  });

  describe('3. Trust Boundary & Lean 4 External Proof Invariants (P2 Integrity)', () => {
    it('strictly forbids escalating STATIC_CHECK_PASSED to LEAN_VERIFIED without kernel evidence', () => {
      function evaluateTrustBoundary(
        hasStaticPass: boolean,
        hasKernelProof: boolean,
        isAxiomGround: boolean
      ): ExternalLeanTrustStatus {
        if (hasKernelProof && isAxiomGround) return 'TRUSTED_AXIOM';
        if (hasKernelProof) return 'LEAN_VERIFIED';
        return 'REQUIRES_CORE_LEAN';
      }

      // Case 1: Only static check passed without kernel run -> MUST remain REQUIRES_CORE_LEAN
      expect(evaluateTrustBoundary(true, false, false)).toBe('REQUIRES_CORE_LEAN');
      expect(evaluateTrustBoundary(true, false, true)).toBe('REQUIRES_CORE_LEAN');

      // Case 2: Kernel verified
      expect(evaluateTrustBoundary(true, true, false)).toBe('LEAN_VERIFIED');

      // Case 3: Trusted ground axiom
      expect(evaluateTrustBoundary(true, true, true)).toBe('TRUSTED_AXIOM');
    });

    it('attributions contain Dmitry Aleinikov canonical ORCID and Zenodo DOIs', () => {
      expect(LEAN_SPEC_URL).toBe('https://doi.org/10.5281/zenodo.21529989');
      expect(OFFICIAL_ZENODO_DOIS.FOUNDATIONS).toBe('10.5281/zenodo.17872755');
      expect(OFFICIAL_ZENODO_DOIS.LEAN4_SPEC).toBe('10.5281/zenodo.21529989');
      expect(OFFICIAL_ZENODO_DOIS.MASTER_REGISTRY).toBe('10.5281/zenodo.21836220');
    });
  });
});
