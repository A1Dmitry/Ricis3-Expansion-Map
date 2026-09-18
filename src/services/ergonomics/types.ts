import type { ProblemNode, ProofStep, ExternalLeanTrustStatus, LeanKernelVerificationEvidence } from '../../model/types';
import type { AxiomId } from '../../ricisSeed/contracts';

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
  /**
   * Метка применённого правила. Идентификаторы берутся из канонического типа зерна
   * (`AxiomId`), а не из ручной копии списка: копия содержала снятую в v7.7/v7.9 `A3`
   * и не содержала активных `L1C1`–`L1C3`/`SP5`/`P1`/`A11` (андон A-0014).
   * `GEOMETRIC_BRIDGE` — историческая метка геометрического моста R^2_RICIS (не идентификатор зерна).
   * Принадлежность активному ядру и запрет снятых аксиом проверяются по данным зерна
   * (`ACTIVE_SEED_AXIOM_IDS` / `DEPRECATED_AXIOM_IDS`), тип этого выразить не может.
   */
  readonly axiomApplied: AxiomId | 'GEOMETRIC_BRIDGE';
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
