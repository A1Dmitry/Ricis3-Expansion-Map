import type { MapState, ProblemNode, ScienceZone } from '../model/types';

export type CatalogVisibilityBrand<TValue, TName extends string> = TValue & {
  readonly __catalogVisibilityBrand: TName;
};

export type CanonicalCatalogNodeId = CatalogVisibilityBrand<string, 'CatalogVisibility.CanonicalNodeId'>;

export type CatalogVisibilityDiagnosticCode =
  | 'unknown_deep_link_target'
  | 'duplicate_canonical_id'
  | 'blank_canonical_id'
  | 'missing_canonical_zone'
  | 'invalid_catalog_record';

export interface CanonicalCatalogSnapshot {
  readonly nodes: readonly ProblemNode[];
  readonly zones: readonly ScienceZone[];
}

export interface CatalogReconciliationInput {
  readonly persistedNodes: readonly ProblemNode[];
  readonly persistedZones: readonly ScienceZone[];
  readonly canonical: CanonicalCatalogSnapshot;
}

export interface CatalogReconciliationPlan {
  readonly kind: 'reconciliation_planned';
  readonly nodeAdditions: readonly ProblemNode[];
  readonly zoneAdditions: readonly ScienceZone[];
}

export type CatalogReconciliationOutcome =
  | { readonly kind: 'no_reconciliation_required' }
  | CatalogReconciliationPlan
  | {
      readonly kind: 'catalog_reconciliation_rejected';
      readonly code: CatalogVisibilityDiagnosticCode;
      readonly affectedId?: string;
    };

export interface CatalogReconciliationApplicationInput {
  readonly map: MapState;
  readonly plan: CatalogReconciliationPlan;
}

export interface CatalogReconciliationApplicationOutcome {
  readonly kind: 'applied' | 'no_change';
  readonly map: MapState;
  readonly addedNodeIds: readonly CanonicalCatalogNodeId[];
  readonly addedZoneIds: readonly string[];
}

export interface CatalogSearchInput {
  readonly node: ProblemNode;
  readonly normalizedQuery: string;
  readonly isZoneVisible: boolean;
  readonly showOnlyDerivatives: boolean;
  readonly isDerivativeNode: boolean;
}

export interface DeepLinkFocusInput {
  readonly requestedNodeId: string | null;
  readonly hydratedNodes: readonly ProblemNode[];
  readonly activeVisibleNodeIds: ReadonlySet<string>;
}

export type DeepLinkFocusOutcome =
  | { readonly kind: 'no_deep_link_request' }
  | {
      readonly kind: 'focused_catalog_node';
      readonly nodeId: CanonicalCatalogNodeId;
      readonly inclusion: 'include_selected_node';
    }
  | {
      readonly kind: 'unknown_deep_link_target';
      readonly requestedNodeId: string;
      readonly diagnosticCode: 'unknown_deep_link_target';
    };

export interface NodeVisibilityProjection {
  readonly visibleNodeIds: ReadonlySet<string>;
  readonly selectedNodeId: CanonicalCatalogNodeId | null;
  readonly deepLinkDiagnostic: Extract<DeepLinkFocusOutcome, { readonly kind: 'unknown_deep_link_target' }> | null;
}

export interface ICanonicalCatalogReconciliationPlanner {
  plan(input: CatalogReconciliationInput): CatalogReconciliationOutcome;
}

export interface ICatalogReconciliationApplication {
  apply(input: CatalogReconciliationApplicationInput): CatalogReconciliationApplicationOutcome;
}

export interface ICanonicalNodeSearchMatcher {
  matches(input: CatalogSearchInput): boolean;
}

export interface IDeepLinkFocusResolver {
  resolve(input: DeepLinkFocusInput): DeepLinkFocusOutcome;
}

export interface INodeVisibilityProjector {
  project(input: {
    readonly filteredNodeIds: ReadonlySet<string>;
    readonly focus: DeepLinkFocusOutcome;
  }): NodeVisibilityProjection;
}
