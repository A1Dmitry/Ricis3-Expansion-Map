import type { MapState, ProblemNode, ScienceZone } from '../model/types';
import type {
  CanonicalCatalogNodeId,
  CanonicalCatalogSnapshot,
  CatalogReconciliationApplicationInput,
  CatalogReconciliationApplicationOutcome,
  CatalogReconciliationInput,
  CatalogReconciliationOutcome,
  CatalogReconciliationPlan,
  CatalogSearchInput,
  DeepLinkFocusInput,
  DeepLinkFocusOutcome,
  ICanonicalCatalogReconciliationPlanner,
  ICanonicalNodeSearchMatcher,
  ICatalogReconciliationApplication,
  IDeepLinkFocusResolver,
  INodeVisibilityProjector,
  NodeVisibilityProjection,
} from './catalogVisibility.contracts';

function canonicalNodeId(value: string): CanonicalCatalogNodeId {
  return value as CanonicalCatalogNodeId;
}

function cloneNode(node: ProblemNode): ProblemNode {
  return {
    ...node,
    zoneIds: [...node.zoneIds],
    dependencyIds: [...node.dependencyIds],
    dependentIds: [...node.dependentIds],
    economic: { ...node.economic },
    matchedSignatures: node.matchedSignatures ? [...node.matchedSignatures] : undefined,
    leanErrors: node.leanErrors ? [...node.leanErrors] : undefined,
    leanWarnings: node.leanWarnings ? [...node.leanWarnings] : undefined,
  };
}

function cloneZone(zone: ScienceZone): ScienceZone {
  return {
    ...zone,
    nodeIds: [...zone.nodeIds],
    economicProfile: { ...zone.economicProfile },
  };
}

function duplicateId<T extends { readonly id: string }>(items: readonly T[]): string | null {
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.id.trim()) return item.id;
    if (seen.has(item.id)) return item.id;
    seen.add(item.id);
  }
  return null;
}

function allRelationshipsAreArrays(node: ProblemNode): boolean {
  return Array.isArray(node.zoneIds) && Array.isArray(node.dependencyIds) && Array.isArray(node.dependentIds);
}

function matchingText(value: string, normalizedQuery: string): boolean {
  return value.toLowerCase().includes(normalizedQuery);
}

export class CanonicalCatalogReconciliationPlanner implements ICanonicalCatalogReconciliationPlanner {
  public plan(input: CatalogReconciliationInput): CatalogReconciliationOutcome {
    const canonicalNodeProblem = duplicateId(input.canonical.nodes);
    if (canonicalNodeProblem !== null) {
      return {
        kind: 'catalog_reconciliation_rejected',
        code: canonicalNodeProblem.trim() ? 'duplicate_canonical_id' : 'blank_canonical_id',
        affectedId: canonicalNodeProblem,
      };
    }

    const canonicalZoneProblem = duplicateId(input.canonical.zones);
    if (canonicalZoneProblem !== null) {
      return {
        kind: 'catalog_reconciliation_rejected',
        code: canonicalZoneProblem.trim() ? 'duplicate_canonical_id' : 'blank_canonical_id',
        affectedId: canonicalZoneProblem,
      };
    }

    const canonicalZonesById = new Map(input.canonical.zones.map((zone) => [zone.id, zone]));
    const persistedZoneIds = new Set(input.persistedZones.map((zone) => zone.id));
    const persistedNodeIds = new Set(input.persistedNodes.map((node) => node.id));
    const nodeAdditions: ProblemNode[] = [];
    const zoneAdditions: ScienceZone[] = [];
    const plannedZoneIds = new Set<string>();

    for (const candidate of input.canonical.nodes) {
      if (!allRelationshipsAreArrays(candidate)) {
        return {
          kind: 'catalog_reconciliation_rejected',
          code: 'invalid_catalog_record',
          affectedId: candidate.id,
        };
      }

      for (const zoneId of candidate.zoneIds) {
        if (!persistedZoneIds.has(zoneId) && !canonicalZonesById.has(zoneId)) {
          return {
            kind: 'catalog_reconciliation_rejected',
            code: 'missing_canonical_zone',
            affectedId: zoneId,
          };
        }
      }

      if (persistedNodeIds.has(candidate.id)) continue;
      nodeAdditions.push(cloneNode(candidate));

      for (const zoneId of candidate.zoneIds) {
        const zone = canonicalZonesById.get(zoneId);
        if (!zone || persistedZoneIds.has(zoneId) || plannedZoneIds.has(zoneId)) continue;
        zoneAdditions.push(cloneZone(zone));
        plannedZoneIds.add(zoneId);
      }
    }

    if (nodeAdditions.length === 0 && zoneAdditions.length === 0) {
      return { kind: 'no_reconciliation_required' };
    }

    return {
      kind: 'reconciliation_planned',
      nodeAdditions,
      zoneAdditions,
    };
  }
}

export class CatalogReconciliationApplication implements ICatalogReconciliationApplication {
  public apply(input: CatalogReconciliationApplicationInput): CatalogReconciliationApplicationOutcome {
    const existingNodeIds = new Set(input.map.nodes.map((node) => node.id));
    const existingZoneIds = new Set(input.map.zones.map((zone) => zone.id));
    const nodeAdditions = input.plan.nodeAdditions
      .filter((node) => !existingNodeIds.has(node.id))
      .map(cloneNode);
    const zoneAdditions = input.plan.zoneAdditions
      .filter((zone) => !existingZoneIds.has(zone.id))
      .map(cloneZone);

    if (nodeAdditions.length === 0 && zoneAdditions.length === 0) {
      return {
        kind: 'no_change',
        map: input.map,
        addedNodeIds: [],
        addedZoneIds: [],
      };
    }

    return {
      kind: 'applied',
      map: {
        ...input.map,
        nodes: [...input.map.nodes, ...nodeAdditions],
        zones: [...input.map.zones, ...zoneAdditions],
      },
      addedNodeIds: nodeAdditions.map((node) => canonicalNodeId(node.id)),
      addedZoneIds: zoneAdditions.map((zone) => zone.id),
    };
  }
}

export class CanonicalNodeSearchMatcher implements ICanonicalNodeSearchMatcher {
  public matches(input: CatalogSearchInput): boolean {
    if (!input.isZoneVisible) return false;
    if (input.showOnlyDerivatives && !input.isDerivativeNode) return false;
    const query = input.normalizedQuery.trim().toLowerCase();
    if (!query) return true;

    return (
      matchingText(input.node.id, query) ||
      matchingText(input.node.title, query) ||
      matchingText(input.node.description, query) ||
      matchingText(input.node.targetFunction, query)
    );
  }
}

export class DeepLinkFocusResolver implements IDeepLinkFocusResolver {
  public resolve(input: DeepLinkFocusInput): DeepLinkFocusOutcome {
    const requestedNodeId = input.requestedNodeId?.trim() ?? '';
    if (!requestedNodeId) return { kind: 'no_deep_link_request' };

    const resolvedNodeId = input.nodeIdAliases?.[requestedNodeId] ?? requestedNodeId;
    const node = input.hydratedNodes.find((candidate) => candidate.id === resolvedNodeId);
    if (!node) {
      return {
        kind: 'unknown_deep_link_target',
        requestedNodeId,
        diagnosticCode: 'unknown_deep_link_target',
      };
    }

    return {
      kind: 'focused_catalog_node',
      nodeId: canonicalNodeId(node.id),
      inclusion: 'include_selected_node',
    };
  }
}

export class NodeVisibilityProjector implements INodeVisibilityProjector {
  public project(input: {
    readonly filteredNodeIds: ReadonlySet<string>;
    readonly focus: DeepLinkFocusOutcome;
  }): NodeVisibilityProjection {
    const visibleNodeIds = new Set(input.filteredNodeIds);

    switch (input.focus.kind) {
      case 'focused_catalog_node':
        visibleNodeIds.add(input.focus.nodeId);
        return {
          visibleNodeIds,
          selectedNodeId: input.focus.nodeId,
          deepLinkDiagnostic: null,
        };
      case 'unknown_deep_link_target':
        return {
          visibleNodeIds,
          selectedNodeId: null,
          deepLinkDiagnostic: input.focus,
        };
      case 'no_deep_link_request':
        return {
          visibleNodeIds,
          selectedNodeId: null,
          deepLinkDiagnostic: null,
        };
    }
  }
}
