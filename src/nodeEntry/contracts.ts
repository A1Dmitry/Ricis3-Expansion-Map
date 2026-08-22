import type { ProblemNode } from '../model/types';

/**
 * NodeEntry and NodeFocus architecture contracts.
 *
 * This module is intentionally side-effect free. It does not import React,
 * Three.js, DOM APIs, URL/window, server modules, Core, Lean, storage or
 * SEO/provider SDKs. Renderers, route generation and camera execution are
 * adapters supplied after QA approval.
 */

export type NodeEntryBrand<TValue, TName extends string> = TValue & {
  readonly __nodeEntryBrand: TName;
};

export type NodeEntrySlug = NodeEntryBrand<string, 'NodeEntry.Slug'>;
export type NodeEntryNodeId = NodeEntryBrand<string, 'NodeEntry.NodeId'>;
export type NodeEntryCanonicalUrl = NodeEntryBrand<string, 'NodeEntry.CanonicalUrl'>;
export type GraphHandoffUrl = NodeEntryBrand<string, 'NodeEntry.GraphHandoffUrl'>;

export type NodeEntryLocale = 'ru';
export type NodeEntryDiscipline = 'physics' | 'number_theory' | 'agi' | 'pharmacy';
export type NodeEntryTrustFraming =
  | 'research_node_unresolved'
  | 'research_node_partial'
  | 'kernel_checked_evidence';
export type NodeEntryPublicationState = 'draft' | 'reviewed' | 'published' | 'withdrawn';
export type NodeEntrySafetyNotice =
  | 'research_only'
  | 'not_medical_advice'
  | 'not_a_formal_proof'
  | 'hypothesis_not_prediction';

export interface NodeEntrySourceReference {
  readonly citationKey: string;
  readonly title: string;
  readonly url: string;
  readonly sourceKind: 'primary' | 'academic' | 'official' | 'catalog_provenance';
}

export interface NodeEntryReview {
  readonly reviewedAt: number;
  readonly reviewerRole: 'subject_editor' | 'formal_methods_reviewer' | 'medical_editor';
  readonly editorialPolicyVersion: string;
}

/**
 * Editorial framing of a catalog node. It cannot replace catalog identity,
 * proof status or graph dependency data.
 */
export interface NodeEntryManifest {
  readonly slug: NodeEntrySlug;
  readonly locale: NodeEntryLocale;
  readonly nodeId: NodeEntryNodeId;
  readonly discipline: NodeEntryDiscipline;
  readonly publicTitle: string;
  readonly searchDescription: string;
  readonly readerQuestion: string;
  readonly editorialSummary: string;
  readonly sourceReferences: readonly NodeEntrySourceReference[];
  readonly review?: NodeEntryReview;
  readonly safetyNotices: readonly NodeEntrySafetyNotice[];
  readonly trustFraming: NodeEntryTrustFraming;
  readonly publicationState: NodeEntryPublicationState;
}

/** Browser-safe catalog projection used by entry-page mappers, never proof authority. */
export interface NodeEntryCatalogProjection {
  readonly nodeId: NodeEntryNodeId;
  readonly title: string;
  readonly description: string;
  readonly state: ProblemNode['state'];
  readonly type: ProblemNode['type'];
  readonly targetFunction: string;
  readonly singularityHint?: string;
  readonly dependencyIds: readonly NodeEntryNodeId[];
  readonly dependentIds: readonly NodeEntryNodeId[];
  readonly zoneIds: readonly string[];
}

export interface NodeEntryViewModel {
  readonly slug: NodeEntrySlug;
  readonly locale: NodeEntryLocale;
  readonly canonicalUrl: NodeEntryCanonicalUrl;
  readonly graphHandoffUrl: GraphHandoffUrl;
  readonly manifest: NodeEntryManifest;
  readonly catalogNode: NodeEntryCatalogProjection;
  readonly neighbours: readonly NodeEntryCatalogProjection[];
}

export type NodeEntryBuildOutcome =
  | { readonly kind: 'rendered'; readonly entry: NodeEntryViewModel }
  | { readonly kind: 'manifest_not_found' }
  | { readonly kind: 'node_not_found'; readonly nodeId: NodeEntryNodeId }
  | { readonly kind: 'entry_not_reviewed' }
  | { readonly kind: 'source_provenance_required' }
  | { readonly kind: 'trust_framing_conflict' }
  | { readonly kind: 'medical_safety_notice_required' }
  | { readonly kind: 'duplicate_canonical' };

export interface INodeCatalogPort {
  findById(nodeId: NodeEntryNodeId): Promise<NodeEntryCatalogProjection | null>;
  findDirectNeighbours(nodeId: NodeEntryNodeId): Promise<readonly NodeEntryCatalogProjection[]>;
}

export interface INodeEntryManifestPort {
  findBySlug(input: { readonly slug: NodeEntrySlug; readonly locale: NodeEntryLocale }): Promise<NodeEntryManifest | null>;
  listPublished(locale: NodeEntryLocale): Promise<readonly NodeEntryManifest[]>;
}

export interface INodeEntryValidator {
  validate(input: {
    readonly manifest: NodeEntryManifest;
    readonly catalogNode: NodeEntryCatalogProjection | null;
  }): NodeEntryBuildOutcome | { readonly kind: 'valid' };
}

export interface INodeEntryRouteBuilder {
  canonicalUrl(input: { readonly slug: NodeEntrySlug; readonly locale: NodeEntryLocale }): NodeEntryCanonicalUrl;
}

/** One graph handoff builder; query serialization is delegated to the browser adapter. */
export interface IGraphHandoffUrlBuilder {
  build(input: { readonly nodeId: NodeEntryNodeId; readonly source: 'node_entry' }): GraphHandoffUrl;
}

export interface INodeEntryViewMapper {
  map(input: {
    readonly manifest: NodeEntryManifest;
    readonly catalogNode: NodeEntryCatalogProjection;
    readonly neighbours: readonly NodeEntryCatalogProjection[];
    readonly canonicalUrl: NodeEntryCanonicalUrl;
    readonly graphHandoffUrl: GraphHandoffUrl;
  }): NodeEntryViewModel;
}

export interface INodeEntrySeoMetadataBuilder {
  build(entry: NodeEntryViewModel): {
    readonly title: string;
    readonly description: string;
    readonly canonicalUrl: NodeEntryCanonicalUrl;
    readonly jsonLd: Readonly<Record<string, unknown>>;
  };
}

export interface INodeEntryStaticRenderer {
  render(input: {
    readonly entry: NodeEntryViewModel;
    readonly seo: ReturnType<INodeEntrySeoMetadataBuilder['build']>;
  }): Promise<{ readonly html: string; readonly canonicalUrl: NodeEntryCanonicalUrl }>;
}

export type NodeFocusSource =
  | 'node_entry_handoff'
  | 'graph_click'
  | 'search_result'
  | 'dependency_navigation'
  | 'navigation_back'
  | 'url_restore';

export interface ReadonlyVector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface NodeFocusRequest {
  readonly nodeId: NodeEntryNodeId;
  readonly source: NodeFocusSource;
  readonly nodePosition: ReadonlyVector3;
  readonly nodeVisualRadius: number;
  readonly currentCameraPosition: ReadonlyVector3;
  readonly currentOrbitTarget: ReadonlyVector3;
  readonly viewportKind: 'desktop' | 'mobile';
}

/** A plan always keeps the node as rotation target and uses a readable-context distance. */
export interface NodeFocusPlan {
  readonly nodeId: NodeEntryNodeId;
  readonly orbitCenter: ReadonlyVector3;
  readonly cameraPosition: ReadonlyVector3;
  readonly distance: number;
  readonly durationMs: number;
  readonly mode: 'readable_context';
}

export interface NodeFocusReadabilityPolicy {
  readonly minimumDesktopDistance: number;
  readonly minimumMobileDistance: number;
  readonly radiusMultiplier: number;
  readonly neighbourContextPadding: number;
  readonly maxInwardDistanceFactor: number;
  readonly minFlightDurationMs: number;
  readonly maxFlightDurationMs: number;
}

export type NodeFocusOutcome =
  | { readonly kind: 'focus_planned'; readonly plan: NodeFocusPlan }
  | { readonly kind: 'node_position_unavailable' }
  | { readonly kind: 'invalid_focus_geometry' };

/** Pure policy seam. A Three.js adapter executes a returned plan but does not own focus rules. */
export interface INodeFocusPolicy {
  plan(input: NodeFocusRequest): NodeFocusOutcome;
}

/** Presentation coordinator adapts graph layout and current controls into a pure focus request. */
export interface INodeFocusCoordinator {
  focus(input: { readonly nodeId: NodeEntryNodeId; readonly source: NodeFocusSource }): NodeFocusOutcome;
}
