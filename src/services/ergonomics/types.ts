import type { ProblemNode, ProofStep, ExternalLeanTrustStatus, LeanKernelVerificationEvidence } from '../../model/types';

/**
 * Онтологический тип сингулярности или скаляра в пространстве R_RICIS^2.
 */
export type RicisDimensionType = '0-dim' | '1-dim' | '2-dim' | 'monolith_order_0' | 'monolith_order_1' | 'monolith_order_2';

/**
 * Структурированное число/монада RICIS-III с семантическим индексом SP4.
 */
export interface RicisNumber<T = string> {
  readonly kind: 'zero' | 'infinity' | 'scalar' | 'monad';
  readonly generatingExpression: T;
  readonly evaluatedCoordinate: number | null;
  readonly dimensionType: RicisDimensionType;
  readonly semanticIndex: string;
  readonly isSingular: boolean;
}

/**
 * Неизменяемая запись шага алгебраической трансформации (сохранение истории L1_IDENTITY).
 */
export interface TransformationLog<T = string> {
  readonly stepIndex: number;
  readonly phase: -1 | 0 | 0.5 | 1 | 2 | 3 | 4 | 5 | 6;
  readonly axiomApplied: 'L0' | 'L1' | 'SP1' | 'SP2' | 'SP3' | 'SP4' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7' | 'A8' | 'A9' | 'A10' | 'GEOMETRIC_BRIDGE';
  readonly inputExpression: T;
  readonly outputExpression: T;
  readonly complexity: 'O(1)' | 'O(log N)' | 'structural_reduction';
  readonly timestamp: string;
}

/**
 * Протокол структурного равенства (приоритет SP4 над числовым сравнением).
 */
export interface IStructuralEqualityComparer<T = string> {
  areIdentical(a: RicisNumber<T>, b: RicisNumber<T>): boolean;
  hasMatchingOrigin(a: RicisNumber<T>, b: RicisNumber<T>): boolean;
}

export type HeaderMenuGroup = 'explore' | 'tools' | 'system';

export interface HeaderActionItemDTO {
  readonly id: string;
  readonly group: HeaderMenuGroup;
  readonly label: string;
  readonly shortLabel?: string;
  readonly iconName: string;
  readonly badge?: string;
  readonly priority: 'primary' | 'secondary' | 'subtle';
  readonly tooltip: string;
  readonly shortcut?: string;
}

export interface SidebarAccordionStateDTO {
  readonly expandedSectionIds: ReadonlySet<string>;
  readonly autoCollapseOthers: boolean;
  readonly pinnedAuditPanel: boolean;
}

export interface IUINavigationLayoutService {
  getHeaderItems(): readonly HeaderActionItemDTO[];
  toggleAccordionSection(sectionId: string, currentState: SidebarAccordionStateDTO): SidebarAccordionStateDTO;
  setPinnedAudit(pinned: boolean, currentState: SidebarAccordionStateDTO): SidebarAccordionStateDTO;
}

export interface SearchQueryDTO {
  readonly rawQuery: string;
  readonly matchedNodeIds: readonly string[];
  readonly matchedSignatures: readonly string[];
  readonly activeZoneFilter: string | null;
  readonly activeRewardClass: string | null;
}

export interface SearchHistoryEntryDTO {
  readonly id: string;
  readonly query: string;
  readonly executedAt: string;
  readonly resultCount: number;
}

export interface ISearchErgonomicsService {
  parseQuery(query: string): SearchQueryDTO;
  filterNodes(nodes: readonly ProblemNode[], searchDTO: SearchQueryDTO): readonly ProblemNode[];
  recordHistory(query: string, resultCount: number): readonly SearchHistoryEntryDTO[];
  clearHistory(): void;
}

export interface CanvasScrollGuardPolicyDTO {
  readonly requireModifierKeyForZoom: boolean;
  readonly isCanvasFocused: boolean;
  readonly zoomSensitivity: number;
  readonly edgeContrastBoostAtDistance: boolean;
}

export interface ICanvasInteractionPolicyService {
  shouldAllowZoom(event: { ctrlKey: boolean; metaKey: boolean }, policy: CanvasScrollGuardPolicyDTO): boolean;
  calculateEdgeOpacity(cameraDistance: number, baseStrength: number, policy: CanvasScrollGuardPolicyDTO): number;
}

export interface LatexRenderingConstraintDTO {
  readonly maxContainerWidthPx: number;
  readonly fontSizeRem: number;
  readonly enableLineBreaking: boolean;
  readonly allowHorizontalOverflowScroll: boolean;
}

export interface FormattedProofStepDTO {
  readonly step: ProofStep;
  readonly formattedLatex: string;
  readonly isSingularPhase: boolean;
  readonly renderedAxiomBadge: string;
}

export interface ILatexFormattingService {
  formatExpressionForWidth(rawLatex: string, constraints: LatexRenderingConstraintDTO): string;
  prepareProofSteps(steps: readonly ProofStep[], constraints: LatexRenderingConstraintDTO): readonly FormattedProofStepDTO[];
}

export interface ProofTrustPresentationDTO {
  readonly status: ExternalLeanTrustStatus;
  readonly badgeLabel: string;
  readonly badgeColorClass: string;
  readonly doiUrl?: string;
  readonly citationText: string;
  readonly kernelEvidenceSummary?: string;
  readonly isImmutableContract: boolean;
}

export interface IProofTrustPresentationService {
  resolvePresentation(
    node: ProblemNode,
    evidence?: LeanKernelVerificationEvidence
  ): ProofTrustPresentationDTO;
}
