import { describe, expect, it } from 'vitest';
import { MapPatchIngestionService } from './mapPatchIngestion';
import { base64FromSha128Hex, sha256Truncated128Hex } from './nodeIdentityMigration';
import type { ProblemNode } from './types';

const rootId = '00112233445566778899aabbccddeeff';
const root: ProblemNode = {
  id: rootId,
  title: 'Root',
  description: 'Root node',
  targetFunction: 'X = X',
  state: 'resolved',
  type: 'core_singularity',
  zoneIds: ['math'],
  dependencyIds: [],
  dependentIds: [],
  fractalDepth: 0,
  canonicalPath: '/math/root',
  economic: { costUnresolved: 0, costToSolve: 0, marketGain: 1, riskLoss: 0 },
};

describe('MapPatchIngestionService SHA-128 identity contract', () => {
  it('assigns a canonical SHA-128 ID to a patch-created node and remaps its edge endpoint', async () => {
    const service = new MapPatchIngestionService();
    const legacyPatchId = 'legacy-imported-node';
    const result = service.applyPatch([root], [], {}, {
      '@type': 'RICIS.MapStatePatch',
      nodePatches: [{ id: legacyPatchId, name: 'Imported Node', state: 'unresolved', type: 'scientific_task' }],
      edges: [{ fromId: rootId, toId: legacyPatchId }],
    });

    const expectedId = await sha256Truncated128Hex('/math/root/imported-node');
    const imported = result.nextNodes.find((node) => node.title === 'Imported Node');
    expect(imported?.id).toBe(expectedId);
    expect(imported?.canonicalPath).toBe('/math/root/imported-node');
    const expectedRootId = await sha256Truncated128Hex('/math/root');
    expect(result.nextEdges).toContainEqual(expect.objectContaining({ fromId: expectedRootId, toId: expectedId }));
    expect(result.nextEdges.some((edge) => edge.toId === legacyPatchId || edge.fromId === rootId)).toBe(false);
    expect(result.result.affectedNodeIds).toContain(expectedId);
  });

  it('remaps proof nodeId and proof registry key together with a newly imported node', () => {
    const service = new MapPatchIngestionService();
    const legacyPatchId = 'legacy-proof-node';
    const result = service.applyPatch([root], [], {}, {
      '@type': 'RICIS.MapStatePatch',
      nodePatches: [{ id: legacyPatchId, name: 'Proof Node', state: 'resolved', type: 'scientific_task' }],
      proofs: {
        [legacyPatchId]: {
          nodeId: legacyPatchId,
          targetFunction: 'X = X',
          steps: [],
          finalResult: 'X = X',
          latex: 'X = X',
        },
      },
    });

    const imported = result.nextNodes.find((node) => node.title === 'Proof Node');
    expect(imported?.id).toMatch(/^[0-9a-f]{32}$/);
    expect(Object.keys(result.nextProofs)).toEqual([imported?.id]);
    expect(result.nextProofs[imported?.id ?? '']?.nodeId).toBe(imported?.id);
  });

  it('does not expose Base64 as the importer domain ID', async () => {
    const service = new MapPatchIngestionService();
    const result = service.applyPatch([root], [], {}, {
      '@type': 'RICIS.MapStatePatch',
      nodePatches: [{ id: 'legacy-ui-key', name: 'UI Key Node', state: 'unresolved', type: 'scientific_task' }],
    });
    const imported = result.nextNodes.find((node) => node.title === 'UI Key Node');
    expect(imported?.id).not.toBe(base64FromSha128Hex(imported?.id ?? '00112233445566778899aabbccddeeff'));
  });
});
