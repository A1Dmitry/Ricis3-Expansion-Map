import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initialMap } from './initialMap';
import { auditProofContent } from './ricisCoreRules';

/**
 * QA contract for the Schwarzschild Geometric Bridge map node.
 *
 * The node is bound to the immutable artifact
 * artifacts/proofs/Schwarzschild_GeometricBridge.lean (path-indexed SP4/L1/A6
 * proxy monolith). The artifact has NO Lean kernel run in this repository, so
 * the node and its metadata must stay at REQUIRES_CORE_LEAN and must never
 * present kernel evidence that does not exist (anti-tukhta: status is stored
 * outside the source, per AGENTS.md §7; node state is never upgraded into
 * Lean kernel verification, per tools/proofTrustBoundary.test.ts).
 */

const NODE_ID = 'schwarzschild-geometric-bridge';
const ARTIFACT_PATH = 'artifacts/proofs/Schwarzschild_GeometricBridge.lean';
const METADATA_PATH = 'artifacts/proofs/Schwarzschild_GeometricBridge.json';
const BINDING_DOI = '10.5281/zenodo.22124493';

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

describe('Schwarzschild Geometric Bridge — map node, connections and artifact binding', () => {
  it('QA-1: node exists, is resolved, and is registered in its zones', () => {
    const node = initialMap.nodes.find(n => n.id === NODE_ID);
    expect(node, `Node ${NODE_ID} must exist in initialMap`).toBeDefined();
    expect(node!.state).toBe('resolved');
    expect(node!.leanErrors ?? []).toEqual([]);
    expect(node!.zoneIds).toContain('physics');
    expect(node!.zoneIds).toContain('astrophysics');

    const physicsZone = initialMap.zones.find(z => z.id === 'physics');
    const astroZone = initialMap.zones.find(z => z.id === 'astrophysics');
    expect(physicsZone?.nodeIds).toContain(NODE_ID);
    expect(astroZone?.nodeIds).toContain(NODE_ID);
  });

  it('QA-2: node connections — three edges, all endpoints exist, ids reciprocal', () => {
    const nodeIds = new Set(initialMap.nodes.map(n => n.id));
    const requiredEdges: ReadonlyArray<readonly [string, string]> = [
      ['math-singularity', NODE_ID],
      ['phys-unified', NODE_ID],
      [NODE_ID, 'calculator-node-gravitational'],
    ];

    for (const [fromId, toId] of requiredEdges) {
      const edge = initialMap.edges.find(e => e.fromId === fromId && e.toId === toId);
      expect(edge, `Edge ${fromId} -> ${toId} must exist`).toBeDefined();
      expect(nodeIds.has(edge!.fromId), `Dangling edge source ${edge!.fromId}`).toBe(true);
      expect(nodeIds.has(edge!.toId), `Dangling edge target ${edge!.toId}`).toBe(true);
    }

    const node = initialMap.nodes.find(n => n.id === NODE_ID)!;
    expect(node.dependencyIds).toContain('math-singularity');
    expect(node.dependencyIds).toContain('phys-unified');
    expect(node.dependentIds).toContain('calculator-node-gravitational');

    const mathNode = initialMap.nodes.find(n => n.id === 'math-singularity')!;
    const physNode = initialMap.nodes.find(n => n.id === 'phys-unified')!;
    expect(mathNode.dependentIds).toContain(NODE_ID);
    expect(physNode.dependentIds).toContain(NODE_ID);
  });

  it('QA-3: proof record is present and passes the RICIS content audit', () => {
    const proof = initialMap.proofs[NODE_ID];
    expect(proof).toBeDefined();
    expect(proof!.nodeId).toBe(NODE_ID);
    expect(proof!.steps.length).toBeGreaterThanOrEqual(3);
    expect(proof!.finalResult.length).toBeGreaterThan(0);

    const audit = auditProofContent(proof!.latex);
    expect(audit.isValid, `Audit failed: ${JSON.stringify(audit.issues)}`).toBe(true);
    expect(audit.score).toBeGreaterThanOrEqual(80);
    expect(audit.issues).toEqual([]);
  });

  it('QA-4: artifact exists with the declared theorems and no sorry-term', () => {
    const fullPath = join(process.cwd(), ARTIFACT_PATH);
    expect(existsSync(fullPath), `Artifact must exist: ${ARTIFACT_PATH}`).toBe(true);

    const content = readFileSync(fullPath, 'utf8');
    expect(content).toContain('namespace RICIS3.SchwarzschildBridge');
    for (const theorem of [
      'l1_trivial',
      'sp4_no_silent_collapse',
      'a6_product_proxy',
      'a6_ratio_proxy',
      'evalProductUnderPath',
      'evalRatioUnderPath',
    ]) {
      expect(content, `Artifact must declare ${theorem}`).toContain(theorem);
    }
    // The header documents "No sorry." as intent; guard against an actual sorry-term.
    expect(content).not.toMatch(/:=\s*sorry|\bby\s+sorry\b/u);
  });

  it('QA-5: trust boundary is honest — REQUIRES_CORE_LEAN, hash pinned, scope boundary declared', () => {
    const artifact = readFileSync(join(process.cwd(), ARTIFACT_PATH), 'utf8');
    const artifactHash = sha256(artifact);

    const proof = initialMap.proofs[NODE_ID];
    expect(proof?.externalLean).toBeDefined();
    expect(proof!.externalLean!.trustStatus).toBe('REQUIRES_CORE_LEAN');
    expect(proof!.externalLean!.sourceLocked).toBe(true);
    expect(proof!.externalLean!.sourceHash).toBe(artifactHash);

    const metadata = JSON.parse(readFileSync(join(process.cwd(), METADATA_PATH), 'utf8')) as {
      proof: { problemId: string };
      verification: { contentHash: string; trustStatus: string };
      kernelCheck?: unknown;
    };
    expect(metadata.proof.problemId).toBe(NODE_ID);
    expect(metadata.verification.trustStatus).toBe('REQUIRES_CORE_LEAN');
    expect(metadata.verification.contentHash).toBe(artifactHash);
    // No kernel run exists in this repo, so no kernelCheck evidence may be fabricated.
    expect(metadata.kernelCheck).toBeUndefined();

    // Scope boundary: GR-level claims are explicitly refused in the artifact header.
    expect(artifact).toContain('Scope boundary');
    expect(artifact).toContain('NOT CLAIMED');
    const raw = readFileSync(join(process.cwd(), METADATA_PATH), 'utf8');
    expect(raw).toContain('AUDITOR: SELF (same-pipeline)');

    const readme = readFileSync(join(process.cwd(), 'artifacts/proofs/README.md'), 'utf8');
    expect(readme).toContain('Schwarzschild_GeometricBridge.lean');
  });

  it('QA-6: node provenance points at the geometric-bridge package DOI', () => {
    const node = initialMap.nodes.find(n => n.id === NODE_ID)!;
    expect(node.sourceUrl).toBe(`https://doi.org/${BINDING_DOI}`);
    const proof = initialMap.proofs[NODE_ID]!;
    expect(proof.axiomsUsed ?? []).toContain('A6_GEOMETRIC_BRIDGE');
    expect(proof.axiomsUsed ?? []).toContain(BINDING_DOI);
    expect(proof.latex).toContain(BINDING_DOI);
  });
});
