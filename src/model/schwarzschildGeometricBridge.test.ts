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
 * proxy monolith). The artifact WAS kernel-run (run 35145205870, job
 * kernel-check, Lean 4.33.1): its derivative without the three unused Mathlib
 * imports compiled exit 0, no sorryAx — artifact-level LEAN_VERIFIED.
 * The NODE-level `externalLean` stays REQUIRES_CORE_LEAN on purpose: the
 * kernel run verified the structural artifact, not a physics claim, and node
 * state is never upgraded into Lean kernel verification (anti-tukhta:
 * tools/proofTrustBoundary.test.ts; AGENTS.md §7).
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

  it('QA-5: trust boundary is honest — artifact LEAN_VERIFIED by a real run, node stays REQUIRES_CORE_LEAN, hash pinned, scope boundary declared', () => {
    const artifact = readFileSync(join(process.cwd(), ARTIFACT_PATH), 'utf8');
    const artifactHash = sha256(artifact);

    // NODE level: the physics claim is NOT what the kernel run verified, so the
    // node-level externalLean must remain REQUIRES_CORE_LEAN (anti-tukhta:
    // tools/proofTrustBoundary.test.ts — node state is never upgraded by an
    // artifact-level structural run).
    const proof = initialMap.proofs[NODE_ID];
    expect(proof?.externalLean).toBeDefined();
    expect(proof!.externalLean!.trustStatus).toBe('REQUIRES_CORE_LEAN');
    expect(proof!.externalLean!.sourceLocked).toBe(true);
    expect(proof!.externalLean!.sourceHash).toBe(artifactHash);

    const metadata = JSON.parse(readFileSync(join(process.cwd(), METADATA_PATH), 'utf8')) as {
      proof: { problemId: string };
      verification: { contentHash: string; trustStatus: string; claimLevel?: string };
      kernelCheck?: {
        run: number;
        job: string;
        registry: string;
        rawEvidence: string;
        compilerExit: number;
        statusAfterKernelRun: string;
        immutableSourceSha256: string;
      };
    };
    expect(metadata.proof.problemId).toBe(NODE_ID);
    expect(metadata.verification.contentHash).toBe(artifactHash);

    // ARTIFACT level: run 35145205870 (job kernel-check, Lean 4.33.1) compiled the
    // Mathlib-import-free derivative exit 0 with no sorryAx. The evidence is real
    // and must be present — and it must point at that exact run, not be fabricated.
    expect(metadata.verification.trustStatus).toBe('LEAN_VERIFIED');
    expect(metadata.verification.claimLevel).toBe('STRUCTURALLY_VALIDATED');
    expect(metadata.kernelCheck, 'kernel run exists, evidence must not be dropped').toBeDefined();
    expect(metadata.kernelCheck!.run).toBe(35145205870);
    expect(metadata.kernelCheck!.job).toBe('kernel-check');
    expect(metadata.kernelCheck!.compilerExit).toBe(0);
    expect(metadata.kernelCheck!.statusAfterKernelRun).toBe('LEAN_VERIFIED');
    expect(metadata.kernelCheck!.immutableSourceSha256).toBe(artifactHash);
    expect(existsSync(join(process.cwd(), metadata.kernelCheck!.registry))).toBe(true);
    expect(existsSync(join(process.cwd(), metadata.kernelCheck!.rawEvidence))).toBe(true);
    // The registry must agree: no LEAN_VERIFIED without a matching artifact entry.
    const registry = JSON.parse(readFileSync(join(process.cwd(), metadata.kernelCheck!.registry), 'utf8')) as {
      artifacts: ReadonlyArray<{ artifactId: string; outcome: string; compilerExit: number }>;
    };
    const entry = registry.artifacts.find(a => a.artifactId === 'Schwarzschild_GeometricBridge');
    expect(entry, 'registry fact for the artifact').toBeDefined();
    expect(entry!.outcome).toBe('LEAN_VERIFIED');
    expect(entry!.compilerExit).toBe(0);

    // Scope boundary: GR-level claims are explicitly refused in the artifact header
    // and were never the subject of the kernel run.
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
