/**
 * @file src/model/mapPatchIngestion.types.ts
 * Контракты и DTO для подсистемы импорта внешних проблем, решений и доказательств RICIS-III.
 */

import type { ProblemNode, Proof, ProofStep, ExternalLeanProvenance, NodeState, ScienceZone, DependencyEdge } from './types';

export interface IMapPatchMetaDTO {
  method?: string;
  baseSeed?: string;
  generated?: string;
  waves?: number;
  saturated?: boolean;
  trustPolicy?: string;
  author?: string;
  sourceSystem?: string;
}

export interface IMapNodePatchDTO {
  id: string;
  name?: string;
  nodeType?: string;
  type?: string;
  description?: string;
  state: NodeState;
  targetFunction?: string;
  zoneId?: string;
  zoneIds?: string[];
  complexity?: number;
  fractalDepth?: number;
  position?: { x: number; y: number; z: number };
}

export interface IMapEdgePatchDTO {
  id?: string;
  from?: string;
  to?: string;
  fromId?: string;
  toId?: string;
  label?: string;
  strength?: number;
  stateColor?: DependencyEdge['stateColor'];
  economicInfluence?: number;
}

export interface IMapProofDTO {
  nodeId: string;
  targetFunction: string;
  steps: ProofStep[];
  finalResult?: string;
  latex?: string;
  externalLean?: ExternalLeanProvenance;
  axiomsUsed?: string[];
}

export interface IMapPatchPayloadDTO {
  '@type'?: 'RICIS.MapStatePatch' | 'RICIS.MapState' | string;
  meta?: IMapPatchMetaDTO;
  nodePatches?: IMapNodePatchDTO[];
  proofs?: Record<string, IMapProofDTO>;
  edges?: IMapEdgePatchDTO[];
  nodes?: ProblemNode[];
  zones?: ScienceZone[];
}

export interface IMapPatchGraphMerge {
  nextNodes: ProblemNode[];
  nextEdges: DependencyEdge[];
  nextProofs: Record<string, Proof>;
  nodeIdAliases?: Record<string, string>;
  result: IMapPatchIngestionResult;
}

export interface IMapPatchIngestionResult {
  success: boolean;
  mode: 'patch_merge' | 'direct_full_state';
  updatedNodeCount: number;
  createdNodeCount: number;
  proofsAttachedCount: number;
  createdEdgeCount: number;
  affectedNodeIds: string[];
  warnings: string[];
  nodeIdAliases?: Record<string, string>;
  error?: string;
}

export interface IMapPatchIngestionService {
  validateAndParse(raw: string | unknown): {
    valid: boolean;
    mode: 'patch_merge' | 'direct_full_state' | 'unknown';
    payload?: IMapPatchPayloadDTO;
    error?: string;
  };
  applyPatch(
    currentNodes: ProblemNode[],
    currentEdges: DependencyEdge[],
    proofsRegistry: Record<string, Proof>,
    payload: IMapPatchPayloadDTO,
    nodeIdAliases?: Record<string, string>
  ): IMapPatchGraphMerge;
}
