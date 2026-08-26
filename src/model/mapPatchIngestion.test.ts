/**
 * @file src/model/mapPatchIngestion.test.ts
 * Юнит-тесты на валидацию, слияние патчей, сохранение L1_IDENTITY и проверку типов (TypeConsistencyProtocol).
 */

import { describe, it, expect } from 'vitest';
import { MapPatchIngestionService } from './mapPatchIngestion';
import type { ProblemNode, Proof } from './types';
import type { IMapPatchPayloadDTO } from './mapPatchIngestion.types';

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
    const { nextNodes, nextProofs, result } = service.applyPatch(mockBaseNodes, initialProofs, patchPayload);

    expect(result.success).toBe(true);
    expect(result.updatedNodeCount).toBe(1);
    expect(result.createdNodeCount).toBe(1);
    expect(result.proofsAttachedCount).toBe(1);

    const updatedNode = nextNodes.find(n => n.id === 'math-singularity');
    expect(updatedNode?.state).toBe('resolved');
    expect(nextProofs['math-singularity']).toBeDefined();

    const createdNode = nextNodes.find(n => n.id === 'new-discovered-problem');
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

    const { result } = service.applyPatch(mockBaseNodes, {}, mismatchPayload);
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

    const { nextNodes, result } = service.applyPatch(mockBaseNodes, {}, validation.payload!);
    expect(result.success).toBe(true);
    expect(result.mode).toBe('direct_full_state');
    expect(nextNodes.length).toBe(1);
    expect(nextNodes[0].id).toBe('node-1');
  });
});
