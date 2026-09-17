import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { deepCopyInitialMap, initialMap } from './initialMap';
import { MapPatchIngestionService } from './mapPatchIngestion';
import { auditProofContent, LEAN_SPEC_DOI } from './ricisCoreRules';
import { verifyLeanProof } from './leanVerifier';

/**
 * CONTRACT-LAYERS MERGE (expand_phys_field_bridge_contract_layers, 0.4.193).
 *
 * Provenance chain pinned here:
 *   import-patches/ricis-map-patch-phys-field-bridge-contract-layers.json (owner artifact)
 *     -> seed nodes / proofs / edges in initialMap (worked-through integration)
 *
 * Seed-integration normalizations (documented, not silent):
 *  - patch `type: protocol_contract` -> seed `scientific_task`: the repo ProblemNode
 *    union has no protocol_contract (it exists only as an aspirational note in
 *    ARENA_REPORT.md); scientific_task is the honest mapping for Lean workflow layers.
 *  - patch `sourceUrl` markdown links `[https://...](https://...)` -> plain URL in seed.
 *  - patch carries no `edges` and raw ingestion ignores `dependencyIds`, so seed edges
 *    and dep/dependent links are wired manually below (15 edges, canonical ids).
 *  - patch proofs carry no `latex`; seed latex is composed per proof (sibling style),
 *    must audit clean (score 100, zero issues) like every other seed proof.
 *  - no `externalLean` on the 7 touched proofs: the single Lean binding for
 *    UnifiedField_GeometricBridge.lean stays 1:1 on phys-field-bridge; contract proofs
 *    cite it via steps / axiomsUsed / DOI instead of duplicating the hash.
 */

const PATCH_REL_PATH = 'import-patches/ricis-map-patch-phys-field-bridge-contract-layers.json';
const BRIDGE_DOI = '10.5281/zenodo.22124493';
const BRIDGE_URL = `https://doi.org/${BRIDGE_DOI}`;

const CONTRACT_NODE_IDS = [
  'contract-sp4-path-index',
  'contract-l1-field-monolith',
  'contract-a6-product-proxy',
  'contract-a6-ratio-proxy',
  'contract-path-gated-eval',
  'phys-field-bridge-contract',
] as const;

const ALL_PATCH_IDS = [...CONTRACT_NODE_IDS, 'phys-unified'] as const;

function loadPatchArtifact(): any {
  const full = path.resolve(process.cwd(), PATCH_REL_PATH);
  expect(fs.existsSync(full), `patch artifact must exist: ${PATCH_REL_PATH}`).toBe(true);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

describe('Field-bridge contract layers: patch artifact integrity', () => {
  it('stores the owner patch as valid RICIS.MapStatePatch with 7 nodes + 7 proofs', () => {
    const patch = loadPatchArtifact();
    expect(patch['@type']).toBe('RICIS.MapStatePatch');
    expect(patch.meta?.method).toBe('expand_phys_field_bridge_contract_layers');
    expect(patch.meta?.mode).toBe('patch_merge');
    expect(patch.nodePatches).toHaveLength(7);
    expect(Object.keys(patch.proofs)).toHaveLength(7);
    expect(patch.nodePatches.map((n: any) => n.id).sort()).toEqual([...ALL_PATCH_IDS].sort());
  });

  it('passes the repo ingestion validator and dry-runs 6 created + 1 updated + 7 proofs', () => {
    const raw = fs.readFileSync(path.resolve(process.cwd(), PATCH_REL_PATH), 'utf8');
    const service = new MapPatchIngestionService();
    const parsed = service.validateAndParse(raw);
    expect(parsed.valid).toBe(true);
    expect(parsed.mode).toBe('patch_merge');

    // Dry-run against the reconstructed pre-merge base (contract nodes removed):
    // proves the artifact applies cleanly and yields exactly this integration.
    const copy = deepCopyInitialMap();
    const baseNodes = copy.nodes.filter((n) => !(CONTRACT_NODE_IDS as readonly string[]).includes(n.id));
    const baseIds = new Set(baseNodes.map((n) => n.id));
    const baseEdges = copy.edges.filter((e) => baseIds.has(e.fromId) && baseIds.has(e.toId));
    const baseProofs = { ...copy.proofs };
    for (const id of CONTRACT_NODE_IDS) delete baseProofs[id];
    const merged = service.applyPatch(baseNodes, baseEdges, baseProofs, parsed.payload!);
    expect(merged.result.success).toBe(true);
    expect(merged.result.createdNodeCount).toBe(6);
    expect(merged.result.updatedNodeCount).toBe(1);
    expect(merged.result.proofsAttachedCount).toBe(7);
    // The patch carries no edges array: seed edge wiring is manual enrichment (see below).
    expect(merged.result.createdEdgeCount).toBe(0);
    // Core semantic parity between raw ingestion and the worked-through seed
    // (ids are SHA-128-migrated by finalizeImportedGraph: resolve via aliases).
    const physId = merged.nodeIdAliases?.['phys-unified'] ?? 'phys-unified';
    expect(merged.nextNodes.find((n) => n.id === physId)?.state).toBe('partial');
    expect(merged.nextProofs[physId].finalResult).toContain('OPEN');
  });
});

describe('Field-bridge contract layers: seed nodes', () => {
  it('creates the 6 contract nodes with patch content and normalized sourceUrl', () => {
    const patch = loadPatchArtifact();
    const byId = new Map<string, any>(patch.nodePatches.map((n: any) => [n.id, n]));
    for (const id of CONTRACT_NODE_IDS) {
      const want = byId.get(id)!;
      const node = initialMap.nodes.find((n) => n.id === id);
      expect(node, `node ${id} must exist`).toBeDefined();
      expect(node?.state).toBe(want.state);
      expect(node?.title).toBe(want.name);
      expect(node?.description).toBe(want.description);
      expect(node?.targetFunction).toBe(want.targetFunction);
      expect(node?.zoneIds).toEqual(want.zoneIds);
      expect(node?.fractalDepth).toBe(want.fractalDepth);
      expect(node?.dependencyIds).toEqual(want.dependencyIds);
      expect(node?.sourceUrl).toBe(BRIDGE_URL);
      expect(node?.leanErrors ?? []).toEqual([]);
      expect(node?.ricisSolvable).toBe(true);
      expect(node?.economic.costUnresolved).toBeGreaterThan(0);
      expect(node?.economic.marketGain).toBeGreaterThan(node!.economic.costToSolve);
    }
  });

  it('maps patch type protocol_contract to repo type scientific_task (documented)', () => {
    const patch = loadPatchArtifact();
    const byId = new Map<string, any>(patch.nodePatches.map((n: any) => [n.id, n]));
    for (const id of CONTRACT_NODE_IDS.slice(0, 5)) {
      // The artifact says protocol_contract; the repo ProblemNode union has no such
      // member, so the seed honestly maps these Lean workflow layers to scientific_task.
      expect(byId.get(id)!.type).toBe('protocol_contract');
      expect(initialMap.nodes.find((n) => n.id === id)?.type).toBe('scientific_task');
    }
    expect(byId.get('phys-field-bridge-contract')!.type).toBe('scientific_task');
    expect(initialMap.nodes.find((n) => n.id === 'phys-field-bridge-contract')?.type).toBe('scientific_task');
  });

  it('lists every contract node in its zones', () => {
    for (const id of CONTRACT_NODE_IDS) {
      const node = initialMap.nodes.find((n) => n.id === id)!;
      for (const zoneId of node.zoneIds) {
        const zone = initialMap.zones.find((z) => z.id === zoneId);
        expect(zone, `zone ${zoneId} must exist`).toBeDefined();
        expect(zone!.nodeIds, `${id} must be listed in zone ${zoneId}`).toContain(id);
      }
    }
  });
});

describe('Field-bridge contract layers: phys-unified partial correction', () => {
  it('marks phys-unified partial by design (never resolved): overclaim withdrawn', () => {
    const patch = loadPatchArtifact();
    const want = patch.nodePatches.find((n: any) => n.id === 'phys-unified')!;
    const node = initialMap.nodes.find((n) => n.id === 'phys-unified');
    expect(node?.state).not.toBe('resolved');
    expect(node?.state).toBe('partial');
    expect(node?.title).toBe(want.name);
    expect(node?.description).toBe(want.description);
    expect(node?.targetFunction).toBe(want.targetFunction);
    expect(node?.dependencyIds).toEqual(expect.arrayContaining(want.dependencyIds));
    expect(node?.sourceUrl).toBe(BRIDGE_URL);
    // Downstream link intact: the gravitational calculator still hangs off phys-unified.
    expect(node?.dependentIds).toContain('calculator-node-gravitational');
  });

  it('unlinks core-agi-target from phys-unified (node link and edge)', () => {
    const agi = initialMap.nodes.find((n) => n.id === 'core-agi-target');
    expect(agi?.dependentIds).not.toContain('phys-unified');
    expect(
      initialMap.edges.filter((e) => e.fromId === 'core-agi-target' && e.toId === 'phys-unified'),
    ).toEqual([]);
  });
});

describe('Field-bridge contract layers: edges and link symmetry', () => {
  const EXPECTED_EDGES: Array<[string, string, 'green' | 'yellow']> = [
    ['math-singularity', 'contract-sp4-path-index', 'green'],
    ['contract-sp4-path-index', 'contract-l1-field-monolith', 'green'],
    ['math-singularity', 'contract-a6-product-proxy', 'green'],
    ['contract-sp4-path-index', 'contract-a6-product-proxy', 'green'],
    ['contract-a6-product-proxy', 'contract-a6-ratio-proxy', 'green'],
    ['contract-l1-field-monolith', 'contract-path-gated-eval', 'green'],
    ['contract-a6-product-proxy', 'contract-path-gated-eval', 'green'],
    ['contract-a6-ratio-proxy', 'contract-path-gated-eval', 'green'],
    ['contract-sp4-path-index', 'phys-field-bridge-contract', 'green'],
    ['contract-l1-field-monolith', 'phys-field-bridge-contract', 'green'],
    ['contract-a6-product-proxy', 'phys-field-bridge-contract', 'green'],
    ['contract-a6-ratio-proxy', 'phys-field-bridge-contract', 'green'],
    ['contract-path-gated-eval', 'phys-field-bridge-contract', 'green'],
    ['math-singularity', 'phys-field-bridge-contract', 'green'],
    // Only edge into the partial node stays yellow (mirrors pre-existing edge-6).
    ['phys-field-bridge-contract', 'phys-unified', 'yellow'],
  ];

  it('wires the 15 canonical contract edges with honest colors', () => {
    for (const [fromId, toId, color] of EXPECTED_EDGES) {
      const edge = initialMap.edges.find((e) => e.fromId === fromId && e.toId === toId);
      expect(edge, `edge ${fromId} -> ${toId} must exist`).toBeDefined();
      expect(edge!.id).toBe(`edge-${fromId}-${toId}`);
      expect(edge!.stateColor).toBe(color);
    }
    const ids = initialMap.edges.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps dependency/dependent links symmetric with edges across the patch subgraph', () => {
    const patch = loadPatchArtifact();
    const byId = new Map(initialMap.nodes.map((n) => [n.id, n]));
    const edgeKeys = new Set(initialMap.edges.map((e) => `${e.fromId}->${e.toId}`));
    for (const nodePatch of patch.nodePatches as Array<{ id: string; dependencyIds: string[] }>) {
      for (const depId of nodePatch.dependencyIds) {
        expect(
          edgeKeys.has(`${depId}->${nodePatch.id}`),
          `missing edge ${depId} -> ${nodePatch.id}`,
        ).toBe(true);
        expect(
          byId.get(depId)?.dependentIds,
          `missing reverse link ${depId} -> ${nodePatch.id}`,
        ).toContain(nodePatch.id);
      }
    }
  });
});

describe('Field-bridge contract layers: proofs', () => {
  it('attaches patch-faithful proofs (steps, finalResult, axiomsUsed) to all 7 nodes', () => {
    const patch = loadPatchArtifact();
    for (const id of ALL_PATCH_IDS) {
      const proof = initialMap.proofs[id];
      const want = patch.proofs[id];
      expect(proof, `proof ${id} must exist`).toBeDefined();
      expect(proof.nodeId).toBe(id);
      expect(proof.targetFunction).toBe(want.targetFunction);
      expect(proof.steps).toEqual(want.steps);
      expect(proof.finalResult).toBe(want.finalResult);
      expect(proof.axiomsUsed).toEqual(want.axiomsUsed);
      expect(proof.steps.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('gives every touched proof an audit-clean latex with Lean-spec and bridge DOIs', () => {
    for (const id of ALL_PATCH_IDS) {
      const proof = initialMap.proofs[id];
      expect(proof.latex.length).toBeGreaterThan(100);
      expect(proof.latex).toContain(LEAN_SPEC_DOI);
      expect(proof.latex).toContain(BRIDGE_DOI);
      expect(proof.latex).not.toContain('sorry');
      expect(proof.latex).not.toContain('REQUIRES_CORE_LEAN');
      const audit = auditProofContent(proof.latex);
      expect(audit.isValid, `Audit failed for ${id}: ${JSON.stringify(audit.issues)}`).toBe(true);
      expect(audit.issues).toEqual([]);
      expect(audit.score).toBeGreaterThanOrEqual(80);
      expect(verifyLeanProof(proof.latex, id, proof.targetFunction).errors).toEqual([]);
    }
  });

  it('documents OPEN continuum scope on phys-unified without any kernel claim', () => {
    const proof = initialMap.proofs['phys-unified'];
    expect(proof.latex).toContain('phys-field-bridge-contract');
    expect(proof.latex).toContain('Scope note');
    expect(proof.latex).toContain('OPEN');
    expect(proof.finalResult).toContain('OPEN');
    // The discrete proxy never certifies the continuum node: no externalLean may appear here.
    expect(proof.externalLean).toBeUndefined();
  });

  it('keeps the single Lean binding 1:1 on phys-field-bridge (no hash duplication)', () => {
    for (const id of ALL_PATCH_IDS) {
      expect(initialMap.proofs[id].externalLean, `${id} must not duplicate the Lean binding`).toBeUndefined();
    }
    const bridge = initialMap.proofs['phys-field-bridge'];
    expect(bridge.externalLean?.trustStatus).toBe('REQUIRES_CORE_LEAN');
    expect(bridge.externalLean?.sourceLocked).toBe(true);
  });
});
