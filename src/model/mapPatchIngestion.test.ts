/**
 * @file src/model/mapPatchIngestion.test.ts
 * Юнит-тесты на валидацию, слияние патчей, сохранение L1_IDENTITY и проверку типов (TypeConsistencyProtocol).
 */

import { describe, it, expect } from 'vitest';
import { MapPatchIngestionService } from './mapPatchIngestion';
import type { ProblemNode, Proof } from './types';
import type { IMapPatchPayloadDTO } from './mapPatchIngestion.types';

type IdentityMergeLike = { nodeIdAliases?: Record<string, string> };
const resolveNodeId = (merge: IdentityMergeLike, legacyId: string): string => merge.nodeIdAliases?.[legacyId] ?? legacyId;

describe('MapPatchIngestionService (RICIS-III Ingestion Engine)', () => {
  const service = new MapPatchIngestionService();

  const mockBaseNodes: ProblemNode[] = [
    {
      id: 'math-singularity',
      title: 'Division by zero',
      description: 'Singularity at 0/0',
      state: 'unresolved',
      type: 'core_singularity',
      fractalDepth: 1,
      targetFunction: 'ResolveSingularity',
      dependencyIds: [],
      dependentIds: [],
      zoneIds: ['math'],
      economic: { costUnresolved: 1000, costToSolve: 10, marketGain: 1000, riskLoss: 10 },
      ricisSolvable: true,
    },
    {
      id: 'phys-unified',
      title: 'Unified Field',
      description: 'Quantum Gravity singularity',
      state: 'partial',
      type: 'scientific_task',
      fractalDepth: 1,
      targetFunction: 'UnifiedField',
      dependencyIds: [],
      dependentIds: [],
      zoneIds: ['physics'],
      economic: { costUnresolved: 2000, costToSolve: 20, marketGain: 2000, riskLoss: 20 },
      ricisSolvable: true,
    },
  ];

  it('TC-PATCH-1: successfully parses and validates the user provided example JSON', () => {
    const userJson = {
      meta: {
        method: 'flood_fill_BFS',
        baseSeed: 'src/model/initialMap.ts @ v0.4.57 (c1931f0)',
        generated: '2026-08-26',
        waves: 2,
        saturated: true,
        trustPolicy: 'state=resolved — это workflow-статус RICIS; Lean kernel verification приложена только там, где есть externalLean',
      },
      nodePatches: [
        { id: 'math-singularity', state: 'resolved' },
        { id: 'core-agi-target', state: 'resolved' },
        { id: 'ai-authorship-provenance', state: 'resolved' },
      ],
      proofs: {
        'math-singularity': {
          nodeId: 'math-singularity',
          targetFunction: 'ResolveSingularity(0_F/0_G)',
          steps: [
            { phase: -1, name: 'L1_IDENTITY', action: 'Verify identity and types', expression: 'X/X = 1; typed zeros 0_F, 0_G' },
            { phase: 2, name: 'RICIS transform', action: 'Axiom A6', expression: '0_F/0_G = F/G' },
          ],
          finalResult: 'RICIS-III solved: math-singularity_resolved',
          latex: '\\frac{0_F}{0_G}=\\frac{F}{G}',
          externalLean: {
            sourceHash: 'sha256-abc',
            submittedAt: '2026-08-26T00:00:00Z',
            sourceLocked: true as const,
            trustStatus: 'REQUIRES_CORE_LEAN' as const,
          },
        },
      },
    };

    const validation = service.validateAndParse(userJson);
    expect(validation.valid).toBe(true);
    expect(validation.mode).toBe('patch_merge');
    expect(validation.payload?.nodePatches?.length).toBe(3);
  });

  it('TC-PATCH-2: performs upsert: updates existing nodes and dynamically creates non-existing nodes', () => {
    const patchPayload: IMapPatchPayloadDTO = {
      '@type': 'RICIS.MapStatePatch',
      nodePatches: [
        { id: 'math-singularity', state: 'resolved' },
        { id: 'new-discovered-problem', state: 'unresolved', name: 'New Singularity Problem' },
      ],
      proofs: {
        'math-singularity': {
          nodeId: 'math-singularity',
          targetFunction: '0_F/0_G = F/G',
          steps: [],
        },
      },
    };

    const initialProofs: Record<string, Proof> = {};
    const merged = service.applyPatch(mockBaseNodes, [], initialProofs, patchPayload);
    const { nextNodes, nextProofs, result } = merged;

    expect(result.success).toBe(true);
    expect(result.updatedNodeCount).toBe(1);
    expect(result.createdNodeCount).toBe(1);
    expect(result.proofsAttachedCount).toBe(1);

    const updatedNode = nextNodes.find(n => n.id === resolveNodeId(merged, 'math-singularity'));
    expect(updatedNode?.state).toBe('resolved');
    expect(nextProofs[resolveNodeId(merged, 'math-singularity')]).toBeDefined();

    const createdNode = nextNodes.find(n => n.id === resolveNodeId(merged, 'new-discovered-problem'));
    expect(createdNode).toBeDefined();
    expect(createdNode?.title).toBe('New Singularity Problem');
  });

  it('TC-PATCH-3: validates TypeConsistencyProtocol and catches type mismatches', () => {
    const mismatchPayload: IMapPatchPayloadDTO = {
      '@type': 'RICIS.MapStatePatch',
      nodePatches: [
        { id: 'math-singularity', nodeType: 'bio_genomics', state: 'resolved' },
      ],
    };

    const { result } = service.applyPatch(mockBaseNodes, [], {}, mismatchPayload);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Type mismatch at math-singularity');
  });

  it('TC-PATCH-4: supports direct import when payload contains full nodes and edges array', () => {
    const fullStateJson = {
      nodes: [
        {
          id: 'node-1',
          title: 'N1',
          description: 'N1 desc',
          state: 'resolved' as const,
          type: 'scientific_task' as const,
          targetFunction: 'T1',
          zoneIds: ['math'],
          dependencyIds: [],
          dependentIds: [],
          fractalDepth: 1,
          economic: { costUnresolved: 1, costToSolve: 1, marketGain: 1, riskLoss: 1 },
          ricisSolvable: true,
        },
      ],
      edges: [{ fromId: 'node-1', toId: 'node-2', id: 'e1', strength: 1, stateColor: 'green' as const, economicInfluence: 1 }],
    };

    const validation = service.validateAndParse(fullStateJson);
    expect(validation.valid).toBe(true);
    expect(validation.mode).toBe('direct_full_state');

    const { nextNodes, result } = service.applyPatch(mockBaseNodes, [], {}, validation.payload!);
    expect(result.success).toBe(true);
    expect(result.mode).toBe('direct_full_state');
    expect(nextNodes.length).toBe(1);
    expect(nextNodes[0].id).toMatch(/^[0-9a-f]{32}$/);
    expect(nextNodes[0].canonicalPath).toBe('/n1');
  });
});


type ImportedEdge = Readonly<{
  id: string;
  fromId: string;
  toId: string;
  strength: number;
  stateColor: 'green' | 'yellow' | 'red';
  economicInfluence: number;
}>;

type EdgeAwarePatchMerge = Readonly<{
  nextNodes: ProblemNode[];
  nextEdges: ImportedEdge[];
  nextProofs: Record<string, Proof>;
  nodeIdAliases?: Record<string, string>;
  result: Readonly<{
    success: boolean;
    createdNodeCount: number;
    createdEdgeCount: number;
    proofsAttachedCount: number;
    affectedNodeIds: string[];
    error?: string;
  }>;
}>;

interface EdgeAwarePatchService {
  applyPatch(
    currentNodes: ProblemNode[],
    currentEdges: ImportedEdge[],
    proofsRegistry: Record<string, Proof>,
    payload: IMapPatchPayloadDTO,
    nodeIdAliases?: Record<string, string>,
  ): EdgeAwarePatchMerge;
}

describe('MapPatchIngestionService — P1 add-only graph edges', () => {
  const service = new MapPatchIngestionService() as unknown as EdgeAwarePatchService;

  const root: ProblemNode = {
    id: 'core-agi-target',
    title: 'Целевая функция AGI (RICIS Core)',
    description: 'Корневой структурный узел.',
    state: 'unresolved',
    type: 'core_singularity',
    fractalDepth: 0,
    targetFunction: 'FormalizeAGITarget()',
    dependencyIds: [],
    dependentIds: [],
    zoneIds: ['informatics'],
    economic: { costUnresolved: 10, costToSolve: 1, marketGain: 20, riskLoss: 30 },
    ricisSolvable: true,
  };

  const lockedProof: Proof = {
    nodeId: 'source-locked-node',
    targetFunction: 'ExistingInput',
    steps: [],
    finalResult: 'Existing source-locked result',
    latex: 'immutable external source bytes',
    externalLean: {
      sourceHash: 'sha256-source-locked',
      submittedAt: '2026-08-27T00:00:00Z',
      sourceLocked: true,
      trustStatus: 'REQUIRES_CORE_LEAN',
    },
  };

  const referencePatch: IMapPatchPayloadDTO = {
    '@type': 'RICIS.MapStatePatch',
    meta: {
      method: 'add_only_catalog_graph_repair',
      trustPolicy: 'Adds structural graph identity only; unresolved node and proof boundary remain unchanged.',
    },
    nodePatches: [
      {
        id: 'real-catalog-98',
        name: 'Распределение богатства Парето',
        description: 'Концентрация капитала.',
        state: 'unresolved',
        type: 'core_singularity',
        targetFunction: 'Formalize(РаспределениебогатстваПарето)',
        zoneIds: ['economics'],
        fractalDepth: 1,
      },
    ],
    edges: [
      { fromId: 'core-agi-target', toId: 'real-catalog-98' },
    ],
  };

  it('EDGE-QA-01: atomically creates the unresolved catalog node and its directed root connection without proof evidence', () => {
    const initialProofs = { 'source-locked-node': lockedProof };
    const merged = service.applyPatch([root], [], initialProofs, referencePatch);

    expect(merged.result.success).toBe(true);
    expect(merged.result.createdNodeCount).toBe(1);
    expect(merged.result.createdEdgeCount).toBe(1);
    expect(merged.result.proofsAttachedCount).toBe(0);
    const targetId = resolveNodeId(merged, 'real-catalog-98');
    const sourceId = resolveNodeId(merged, 'core-agi-target');
    expect(merged.result.affectedNodeIds).toEqual([targetId, sourceId]);

    const target = merged.nextNodes.find(node => node.id === targetId);
    const source = merged.nextNodes.find(node => node.id === sourceId);
    expect(target?.state).toBe('unresolved');
    expect(target?.dependencyIds).toEqual([sourceId]);
    expect(source?.dependentIds).toEqual([targetId]);
    expect(merged.nextEdges).toEqual([
      expect.objectContaining({
        id: `edge-${sourceId}-${targetId}`,
        fromId: sourceId,
        toId: targetId,
      }),
    ]);
    expect(merged.nextProofs['source-locked-node']).toBe(lockedProof);
    expect(merged.nextProofs[targetId]).toBeUndefined();
  });

  it('EDGE-QA-02: repeats the same reference patch without duplicating node, edge or reciprocal identity references', () => {
    const first = service.applyPatch([root], [], {}, referencePatch);
    const second = service.applyPatch(first.nextNodes, first.nextEdges, first.nextProofs, referencePatch, first.nodeIdAliases);

    expect(second.result.success).toBe(true);
    expect(second.result.createdNodeCount).toBe(0);
    expect(second.result.createdEdgeCount).toBe(0);
    const secondTargetId = resolveNodeId(second, 'real-catalog-98');
    const secondSourceId = resolveNodeId(second, 'core-agi-target');
    expect(second.nextNodes.filter(node => node.id === secondTargetId)).toHaveLength(1);
    expect(second.nextEdges.filter(edge => edge.id === `edge-${secondSourceId}-${secondTargetId}`)).toHaveLength(1);
    expect(second.nextNodes.find(node => node.id === secondSourceId)?.dependentIds).toEqual([secondTargetId]);
    expect(second.nextNodes.find(node => node.id === secondTargetId)?.dependencyIds).toEqual([secondSourceId]);
  });

  it('EDGE-QA-03: rejects an invalid edge atomically and leaves nodes, edges and existing source-locked evidence unchanged', () => {
    const initialNodes = [root];
    const initialEdges: ImportedEdge[] = [];
    const initialProofs = { 'source-locked-node': lockedProof };
    const invalidPatch: IMapPatchPayloadDTO = {
      '@type': 'RICIS.MapStatePatch',
      nodePatches: referencePatch.nodePatches,
      edges: [{ fromId: '', toId: 'real-catalog-98' }],
    };

    const rejected = service.applyPatch(initialNodes, initialEdges, initialProofs, invalidPatch);

    expect(rejected.result.success).toBe(false);
    expect(rejected.result.error).toMatch(/edge/i);
    expect(rejected.nextNodes).toBe(initialNodes);
    expect(rejected.nextEdges).toBe(initialEdges);
    expect(rejected.nextProofs).toBe(initialProofs);
    expect(rejected.result.createdNodeCount).toBe(0);
    expect(rejected.result.createdEdgeCount).toBe(0);
    expect(rejected.result.proofsAttachedCount).toBe(0);
  });

  it('EDGE-QA-04: rejects a self-reference and an edge with an endpoint absent from current state and the same patch', () => {
    const selfReference: IMapPatchPayloadDTO = {
      '@type': 'RICIS.MapStatePatch',
      edges: [{ fromId: 'core-agi-target', toId: 'core-agi-target' }],
    };
    const unknownEndpoint: IMapPatchPayloadDTO = {
      '@type': 'RICIS.MapStatePatch',
      edges: [{ fromId: 'core-agi-target', toId: 'missing-node' }],
    };

    const selfRejected = service.applyPatch([root], [], {}, selfReference);
    const unknownRejected = service.applyPatch([root], [], {}, unknownEndpoint);

    expect(selfRejected.result.success).toBe(false);
    expect(selfRejected.result.error).toMatch(/self|edge/i);
    expect(unknownRejected.result.success).toBe(false);
    expect(unknownRejected.result.error).toMatch(/unknown|edge/i);
  });

  it('EDGE-QA-05: link-only patch preserves the existing runtime scientific_task type and unresolved state', () => {
    const runtimePareto: ProblemNode = {
      id: 'real-catalog-98',
      title: 'Распределение богатства Парето',
      description: 'Концентрация капитала.',
      state: 'unresolved',
      type: 'scientific_task',
      fractalDepth: 1,
      targetFunction: 'Formalize(РаспределениебогатстваПарето)',
      dependencyIds: [],
      dependentIds: [],
      zoneIds: ['economics'],
      economic: { costUnresolved: 482000000, costToSolve: 4900000, marketGain: 510000000, riskLoss: 353000000 },
      ricisSolvable: true,
    };
    const linkOnlyPatch: IMapPatchPayloadDTO = {
      '@type': 'RICIS.MapStatePatch',
      edges: [{ fromId: 'core-agi-target', toId: 'real-catalog-98' }],
    };

    const merged = service.applyPatch([root, runtimePareto], [], {}, linkOnlyPatch);
    const target = merged.nextNodes.find(node => node.id === resolveNodeId(merged, 'real-catalog-98'));

    expect(merged.result.success).toBe(true);
    expect(merged.result.createdNodeCount).toBe(0);
    expect(merged.result.createdEdgeCount).toBe(1);
    expect(merged.result.proofsAttachedCount).toBe(0);
    expect(target?.type).toBe('scientific_task');
    expect(target?.state).toBe('unresolved');
    expect(target?.dependencyIds).toEqual([resolveNodeId(merged, 'core-agi-target')]);
    expect(merged.nextProofs[resolveNodeId(merged, 'real-catalog-98')]).toBeUndefined();
  });
});
