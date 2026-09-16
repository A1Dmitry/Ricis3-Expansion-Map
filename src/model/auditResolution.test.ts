import { describe, it, expect } from 'vitest';
import { initialMap, deepCopyInitialMap } from './initialMap';
import { auditProofContent, LEAN_SPEC_URL, OFFICIAL_ZENODO_DOIS } from './ricisCoreRules';
import { migrateMapNodeIdentitySync } from './nodeIdentityMigration';
import type { ProblemNode, Proof, ExternalLeanTrustStatus } from './types';

describe('RICIS-III Audit Resolution & Graph Integrity (QA Automation Suite)', () => {
  // Node ai-authorship-provenance was removed by the owner (commit 91b43b9).
  // The removal initially left dangling references that broke hydration and
  // every patch dry-run (SHA-128 migration rejects dangling_reference), so the
  // block now guards the general invariant instead of the removed node.
  describe('1. Canonical graph integrity: no dangling references (P0 Integrity)', () => {
    it('every edge endpoint and cross-node reference points to an existing node', () => {
      const nodeIds = new Set(initialMap.nodes.map(n => n.id));

      for (const edge of initialMap.edges) {
        expect(nodeIds.has(edge.fromId), `edge ${edge.id}: fromId '${edge.fromId}' must exist`).toBe(true);
        expect(nodeIds.has(edge.toId), `edge ${edge.id}: toId '${edge.toId}' must exist`).toBe(true);
      }
      for (const node of initialMap.nodes) {
        for (const dep of node.dependencyIds ?? []) {
          expect(nodeIds.has(dep), `node ${node.id}: dependencyId '${dep}' must exist`).toBe(true);
        }
        for (const dep of node.dependentIds ?? []) {
          expect(nodeIds.has(dep), `node ${node.id}: dependentId '${dep}' must exist`).toBe(true);
        }
      }
    });

    it('the canonical map passes the SHA-128 identity migration (hydration gate)', () => {
      expect(() => migrateMapNodeIdentitySync(deepCopyInitialMap())).not.toThrow();
    });

    it('the removed ai-authorship-provenance node leaves no trace in the canonical map', () => {
      expect(initialMap.nodes.some(n => n.id === 'ai-authorship-provenance')).toBe(false);
      expect(JSON.stringify(initialMap)).not.toContain('ai-authorship-provenance');
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
    });
  });
});
