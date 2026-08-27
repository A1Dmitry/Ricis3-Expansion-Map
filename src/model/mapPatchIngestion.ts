/**
 * @file src/model/mapPatchIngestion.ts
 * Сервис слияния и импорта внешних проблем, решений и доказательств RICIS-III (DRY, DDD, SOLID).
 */

import type { DependencyEdge, ProblemNode, Proof } from './types';
import type {
  IMapEdgePatchDTO,
  IMapPatchGraphMerge,
  IMapPatchPayloadDTO,
  IMapPatchIngestionResult,
  IMapPatchIngestionService,
  IMapNodePatchDTO,
} from './mapPatchIngestion.types';

export class MapPatchIngestionService implements IMapPatchIngestionService {
  public validateAndParse(raw: string | unknown): {
    valid: boolean;
    mode: 'patch_merge' | 'direct_full_state' | 'unknown';
    payload?: IMapPatchPayloadDTO;
    error?: string;
  } {
    if (!raw) {
      return { valid: false, mode: 'unknown', error: 'Входные данные пусты' };
    }

    let parsed: any;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch (err: any) {
        return { valid: false, mode: 'unknown', error: `Некорректный JSON синтаксис: ${err?.message || 'ошибка парсинга'}` };
      }
    } else {
      parsed = raw;
    }

    if (typeof parsed !== 'object' || parsed === null) {
      return { valid: false, mode: 'unknown', error: 'JSON должен содержать корневой объект' };
    }

    const typeField = parsed['@type'];
    const isExplicitPatch = typeField === 'RICIS.MapStatePatch';
    const isFullMapState = Array.isArray(parsed.nodes) && (Array.isArray(parsed.edges) || Array.isArray(parsed.zones));
    const hasPatchElements = Array.isArray(parsed.nodePatches) || (typeof parsed.proofs === 'object' && parsed.proofs !== null);

    if (isExplicitPatch || (hasPatchElements && !isFullMapState)) {
      // Режим патча
      if (Array.isArray(parsed.nodePatches)) {
        for (const item of parsed.nodePatches) {
          if (!item || typeof item.id !== 'string' || !item.id.trim()) {
            return { valid: false, mode: 'patch_merge', error: 'Каждый элемент nodePatches обязан содержать непустой строковый "id"' };
          }
        }
      }
      return {
        valid: true,
        mode: 'patch_merge',
        payload: parsed as IMapPatchPayloadDTO,
      };
    }

    if (isFullMapState) {
      return {
        valid: true,
        mode: 'direct_full_state',
        payload: parsed as IMapPatchPayloadDTO,
      };
    }

    return {
      valid: false,
      mode: 'unknown',
      error: `Неизвестный тип payload: ${typeField || 'отсутствует @type, nodePatches или структура nodes/edges'}`,
    };
  }

  public applyPatch(
    currentNodes: ProblemNode[],
    currentEdges: DependencyEdge[],
    proofsRegistry: Record<string, Proof>,
    payload: IMapPatchPayloadDTO
  ): IMapPatchGraphMerge {
    const reject = (error: string): IMapPatchGraphMerge => ({
      nextNodes: currentNodes,
      nextEdges: currentEdges,
      nextProofs: proofsRegistry,
      result: {
        success: false,
        mode: 'patch_merge',
        updatedNodeCount: 0,
        createdNodeCount: 0,
        proofsAttachedCount: 0,
        createdEdgeCount: 0,
        affectedNodeIds: [],
        warnings: [],
        error,
      },
    });
    const isFullMap = Array.isArray(payload.nodes) && !Array.isArray(payload.nodePatches);
    const normalizedEdges: Array<Readonly<{ fromId: string; toId: string; patch: IMapEdgePatchDTO }>> = [];

    if (!isFullMap && payload.edges) {
      const knownNodeIds = new Set(currentNodes.map(node => node.id));
      for (const patch of payload.nodePatches || []) knownNodeIds.add(patch.id.trim());
      const payloadEdgeKeys = new Set<string>();

      for (const patch of payload.edges) {
        const fromId = patch.fromId?.trim() || patch.from?.trim() || '';
        const toId = patch.toId?.trim() || patch.to?.trim() || '';
        if (!fromId || !toId) return reject('Invalid edge: both fromId and toId must be non-empty strings.');
        if (patch.fromId && patch.from && patch.fromId.trim() !== patch.from.trim()) {
          return reject('Invalid edge: from and fromId disagree.');
        }
        if (patch.toId && patch.to && patch.toId.trim() !== patch.to.trim()) {
          return reject('Invalid edge: to and toId disagree.');
        }
        if (fromId === toId) return reject(`Invalid edge: self-reference '${fromId}'.`);
        if (!knownNodeIds.has(fromId) || !knownNodeIds.has(toId)) {
          return reject(`Invalid edge: unknown endpoint '${!knownNodeIds.has(fromId) ? fromId : toId}'.`);
        }
        const canonicalId = `edge-${fromId}-${toId}`;
        if (patch.id && patch.id !== canonicalId) return reject(`Invalid edge: id must be '${canonicalId}'.`);
        if (payloadEdgeKeys.has(canonicalId)) return reject(`Invalid edge: duplicate directed identity '${canonicalId}'.`);
        payloadEdgeKeys.add(canonicalId);
        normalizedEdges.push({ fromId, toId, patch });
      }
    }

    if (isFullMap && payload.nodes) {
      // Прямой импорт полного состояния (Direct MapState Ingestion)
      const nextProofs: Record<string, Proof> = { ...proofsRegistry };
      if (payload.proofs) {
        for (const [key, proofDTO] of Object.entries(payload.proofs)) {
          const nodeId = proofDTO.nodeId || key;
          nextProofs[nodeId] = {
            nodeId,
            targetFunction: proofDTO.targetFunction || 'RICIS Target Function',
            steps: Array.isArray(proofDTO.steps) ? proofDTO.steps : [],
            finalResult: proofDTO.finalResult || `RICIS-III resolved: ${nodeId}`,
            latex: proofDTO.latex || '',
            externalLean: proofDTO.externalLean,
          };
        }
      }
      return {
        nextNodes: payload.nodes,
        nextEdges: currentEdges,
        nextProofs,
        result: {
          success: true,
          mode: 'direct_full_state',
          updatedNodeCount: payload.nodes.length,
          createdNodeCount: 0,
          proofsAttachedCount: Object.keys(nextProofs).length,
          createdEdgeCount: 0,
          affectedNodeIds: payload.nodes.map(n => n.id),
          warnings: Array.isArray(payload.edges) && payload.edges.length > 0
            ? ['Full-state edge replacement is not supported by the add-only patch importer.']
            : [],
        },
      };
    }

    // Режим слияния патча (Merge into Export / State)
    const nodeMap = new Map<string, ProblemNode>();
    for (const node of currentNodes) {
      nodeMap.set(node.id, { ...node });
    }

    const nextProofs: Record<string, Proof> = { ...proofsRegistry };
    const affectedNodeIds = new Set<string>();
    const warnings: string[] = [];
    let updatedNodeCount = 0;
    let createdNodeCount = 0;
    let proofsAttachedCount = 0;

    // Проверка согласованности типов узлов (Type Consistency Check под L1C2)
    if (payload.nodePatches) {
      for (const p of payload.nodePatches) {
        const existing = nodeMap.get(p.id);
        const expectedType = p.nodeType || p.type;
        if (existing && expectedType) {
          const existingType = existing.type || existing.zoneIds?.[0];
          if (existingType && existingType !== expectedType) {
            return {
              nextNodes: currentNodes,
              nextEdges: currentEdges,
              nextProofs: proofsRegistry,
              result: {
                success: false,
                mode: 'patch_merge',
                updatedNodeCount: 0,
                createdNodeCount: 0,
                proofsAttachedCount: 0,
                createdEdgeCount: 0,
                affectedNodeIds: [],
                warnings: [],
                error: `Type mismatch at ${p.id}: export=${existingType}, patch=${expectedType}`,
              },
            };
          }
        }
      }
    }

    // 1. Применяем доказательства из секции proofs
    if (payload.proofs) {
      for (const [key, proofDTO] of Object.entries(payload.proofs)) {
        const nodeId = proofDTO.nodeId || key;
        const normalizedProof: Proof = {
          nodeId,
          targetFunction: proofDTO.targetFunction || 'RICIS Target Function',
          steps: Array.isArray(proofDTO.steps) ? proofDTO.steps : [],
          finalResult: proofDTO.finalResult || `RICIS-III resolved: ${nodeId}`,
          latex: proofDTO.latex || '',
          externalLean: proofDTO.externalLean,
        };

        nextProofs[nodeId] = normalizedProof;
        proofsAttachedCount++;
        affectedNodeIds.add(nodeId);

        const existingNode = nodeMap.get(nodeId);
        if (existingNode) {
          if (proofDTO.targetFunction && (!existingNode.targetFunction || existingNode.targetFunction.trim() === '')) {
            existingNode.targetFunction = proofDTO.targetFunction;
          }
        }
      }
    }

    // 2. Обрабатываем патчи узлов nodePatches
    if (payload.nodePatches) {
      for (const patch of payload.nodePatches) {
        const nodeId = patch.id.trim();
        affectedNodeIds.add(nodeId);

        const existing = nodeMap.get(nodeId);
        if (existing) {
          existing.state = patch.state || existing.state;
          if (patch.name) existing.title = patch.name;
          if (patch.description) existing.description = patch.description;
          if (patch.targetFunction) existing.targetFunction = patch.targetFunction;
          if (patch.fractalDepth !== undefined) existing.fractalDepth = patch.fractalDepth;
          updatedNodeCount++;
        } else {
          const newNode = this.createNewNodeFromPatch(patch, nextProofs[nodeId]?.targetFunction);
          nodeMap.set(nodeId, newNode);
          createdNodeCount++;
        }
      }
    }

    // 3. Создаем узлы для доказательств без явного nodePatch
    if (payload.proofs) {
      for (const [key, proofDTO] of Object.entries(payload.proofs)) {
        const nodeId = proofDTO.nodeId || key;
        if (!nodeMap.has(nodeId)) {
          const mockPatch: IMapNodePatchDTO = {
            id: nodeId,
            name: proofDTO.targetFunction || nodeId,
            state: 'resolved',
            targetFunction: proofDTO.targetFunction,
          };
          const newNode = this.createNewNodeFromPatch(mockPatch, proofDTO.targetFunction);
          nodeMap.set(nodeId, newNode);
          createdNodeCount++;
        }
      }
    }

    const nextEdges = currentEdges.map(edge => ({ ...edge }));
    const existingEdgeKeys = new Set(nextEdges.map(edge => `${edge.fromId}->${edge.toId}`));
    let createdEdgeCount = 0;

    for (const edge of normalizedEdges) {
      const edgeKey = `${edge.fromId}->${edge.toId}`;
      affectedNodeIds.add(edge.fromId);
      affectedNodeIds.add(edge.toId);
      const source = nodeMap.get(edge.fromId);
      const target = nodeMap.get(edge.toId);
      if (!source || !target) return reject(`Invalid edge: unknown endpoint '${!source ? edge.fromId : edge.toId}'.`);

      if (existingEdgeKeys.has(edgeKey)) continue;

      const edgeId = `edge-${edge.fromId}-${edge.toId}`;
      nextEdges.push({
        id: edgeId,
        fromId: edge.fromId,
        toId: edge.toId,
        strength: edge.patch.strength ?? 0.7,
        stateColor: edge.patch.stateColor ?? 'red',
        economicInfluence: edge.patch.economicInfluence ?? 0.5,
      });
      source.dependentIds = source.dependentIds.includes(edge.toId)
        ? source.dependentIds
        : [...source.dependentIds, edge.toId];
      target.dependencyIds = target.dependencyIds.includes(edge.fromId)
        ? target.dependencyIds
        : [...target.dependencyIds, edge.fromId];
      existingEdgeKeys.add(edgeKey);
      createdEdgeCount++;
    }

    const nextNodes = Array.from(nodeMap.values());

    return {
      nextNodes,
      nextEdges,
      nextProofs,
      result: {
        success: true,
        mode: 'patch_merge',
        updatedNodeCount,
        createdNodeCount,
        proofsAttachedCount,
        createdEdgeCount,
        affectedNodeIds: Array.from(affectedNodeIds),
        warnings,
      },
    };
  }

  private createNewNodeFromPatch(patch: IMapNodePatchDTO, fallbackTarget?: string): ProblemNode {
    return {
      id: patch.id,
      title: patch.name || patch.id,
      description: patch.description || `Импортированная проблема RICIS: ${patch.id}`,
      state: patch.state || 'hypothetical',
      type: (patch.nodeType as any) || (patch.type as any) || 'scientific_task',
      fractalDepth: patch.fractalDepth ?? 1,
      targetFunction: patch.targetFunction || fallbackTarget || '',
      dependencyIds: [],
      dependentIds: [],
      zoneIds: patch.zoneIds || (patch.zoneId ? [patch.zoneId] : ['general']),
      economic: {
        costUnresolved: 100_000_000,
        costToSolve: 10_000,
        marketGain: 500_000,
        riskLoss: 100_000,
      },
      ricisSolvable: true,
    } as ProblemNode;
  }
}

export const defaultMapPatchIngestionService = new MapPatchIngestionService();
export * from './mapPatchIngestion.types';
