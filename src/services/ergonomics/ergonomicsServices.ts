import type {
  RicisNumber,
  TransformationLog,
  IStructuralEqualityComparer,
  SidebarAccordionStateDTO,
  IUINavigationLayoutService,
  ISearchErgonomicsService,
  ICanvasInteractionPolicyService,
  ILatexFormattingService,
  IProofTrustPresentationService,
  HeaderActionItemDTO,
  SearchQueryDTO,
  SearchHistoryEntryDTO,
  CanvasScrollGuardPolicyDTO,
  LatexRenderingConstraintDTO,
  FormattedProofStepDTO,
  ProofTrustPresentationDTO,
} from './types';
import type { ProblemNode, ProofStep, LeanKernelVerificationEvidence, ExternalLeanTrustStatus } from '../../model/types';

/**
 * Сравнитель структурного равенства по аксиомам RICIS-III (SP4 + L1).
 */
export class StructuralEqualityComparer implements IStructuralEqualityComparer<string> {
  areIdentical(a: RicisNumber<string>, b: RicisNumber<string>): boolean {
    if (a.kind !== b.kind) return false;
    if (a.dimensionType !== b.dimensionType) return false;
    return a.semanticIndex === b.semanticIndex && a.generatingExpression === b.generatingExpression;
  }

  hasMatchingOrigin(a: RicisNumber<string>, b: RicisNumber<string>): boolean {
    return a.generatingExpression.trim() === b.generatingExpression.trim();
  }
}

/**
 * Сервис структуры навигации и управления аккордеонами.
 */
export class UINavigationLayoutService implements IUINavigationLayoutService {
  getHeaderItems(): readonly HeaderActionItemDTO[] {
    return [
      {
        id: 'explore-3d',
        group: 'explore',
        label: '3D Карта',
        shortLabel: '3D',
        iconName: 'Compass',
        priority: 'primary',
        tooltip: '3D Визуализация пространства сингулярностей',
        shortcut: '1',
      },
      {
        id: 'tools-calc',
        group: 'tools',
        label: 'Калькулятор',
        shortLabel: 'Кальк',
        iconName: 'Calculator',
        priority: 'secondary',
        tooltip: 'Разрешение сингулярностей 0/0 и 0*∞',
        shortcut: '2',
      },
      {
        id: 'tools-voynich',
        group: 'tools',
        label: 'Войнич EVA $50T',
        shortLabel: 'EVA',
        iconName: 'BookOpen',
        priority: 'secondary',
        tooltip: 'EVA Genome Дешифратор рукописи Войнича',
        shortcut: '3',
      },
      {
        id: 'system-settings',
        group: 'system',
        label: 'Настройки',
        shortLabel: 'Опции',
        iconName: 'Settings',
        priority: 'subtle',
        tooltip: 'Параметры системы, фильтрации и базы данных',
        shortcut: ',',
      },
    ];
  }

  toggleAccordionSection(sectionId: string, currentState: SidebarAccordionStateDTO): SidebarAccordionStateDTO {
    const nextSet = new Set(currentState.expandedSectionIds);
    if (nextSet.has(sectionId)) {
      nextSet.delete(sectionId);
    } else {
      if (currentState.autoCollapseOthers) {
        nextSet.clear();
      }
      nextSet.add(sectionId);
    }
    return {
      ...currentState,
      expandedSectionIds: nextSet,
    };
  }

  setPinnedAudit(pinned: boolean, currentState: SidebarAccordionStateDTO): SidebarAccordionStateDTO {
    return {
      ...currentState,
      pinnedAuditPanel: pinned,
    };
  }
}

/**
 * Сервис эргономики поиска и парсинга семантических сигнатур RICIS-III.
 */
export class SearchErgonomicsService implements ISearchErgonomicsService {
  private history: SearchHistoryEntryDTO[] = [];

  parseQuery(rawQuery: string): SearchQueryDTO {
    const trimmed = rawQuery.trim();
    const signatures: string[] = [];

    if (/0(_[a-zA-Z0-9]+)?\s*\/\s*0(_[a-zA-Z0-9]+)?|zero_ratio/i.test(trimmed)) signatures.push('SP4_ZERO_RATIO');
    if (/0(_[a-zA-Z0-9]+)?\s*[*x×·]\s*∞(_[a-zA-Z0-9]+)?|geometric_bridge|bridge/i.test(trimmed)) signatures.push('A6_GEOMETRIC_BRIDGE');
    if (/∞(_[a-zA-Z0-9]+)?\s*-\s*∞(_[a-zA-Z0-9]+)?|inf_sub/i.test(trimmed)) signatures.push('A7_INFINITY_SUBTRACTION');
    if (/∞(_[a-zA-Z0-9]+)?\s*\/\s*∞(_[a-zA-Z0-9]+)?|inf_ratio/i.test(trimmed)) signatures.push('A5_INFINITY_RATIO');

    return {
      rawQuery: trimmed,
      matchedNodeIds: [],
      matchedSignatures: signatures,
      activeZoneFilter: null,
      activeRewardClass: null,
    };
  }

  filterNodes(nodes: readonly ProblemNode[], searchDTO: SearchQueryDTO): readonly ProblemNode[] {
    if (!searchDTO.rawQuery) return nodes;
    const lower = searchDTO.rawQuery.toLowerCase();
    return nodes.filter(
      (n) =>
        n.id.toLowerCase().includes(lower) ||
        n.title.toLowerCase().includes(lower) ||
        (n.targetFunction && n.targetFunction.toLowerCase().includes(lower)) ||
        (n.description && n.description.toLowerCase().includes(lower)) ||
        (n.zoneIds && n.zoneIds.some((z) => z.toLowerCase().includes(lower)))
    );
  }

  recordHistory(query: string, resultCount: number): readonly SearchHistoryEntryDTO[] {
    const clean = query.trim();
    if (!clean) return this.history;
    const entry: SearchHistoryEntryDTO = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      query: clean,
      executedAt: new Date().toISOString(),
      resultCount,
    };
    this.history = [entry, ...this.history.filter((h) => h.query !== clean)].slice(0, 5);
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
  }
}

/**
 * Сервис взаимодействия с холстом и защиты от случайного зума колесиком.
 */
export class CanvasInteractionPolicyService implements ICanvasInteractionPolicyService {
  shouldAllowZoom(
    event: { ctrlKey: boolean; metaKey: boolean },
    policy: CanvasScrollGuardPolicyDTO
  ): boolean {
    if (!policy.requireModifierKeyForZoom) return true;
    return event.ctrlKey || event.metaKey || policy.isCanvasFocused;
  }

  calculateEdgeOpacity(
    cameraDistance: number,
    baseStrength: number,
    policy: CanvasScrollGuardPolicyDTO
  ): number {
    if (cameraDistance <= 100) return Math.min(1.0, Math.max(0.1, baseStrength));
    if (!policy.edgeContrastBoostAtDistance) {
      return Math.max(0.08, baseStrength * (100 / cameraDistance));
    }
    // Boost edge visibility at long distances
    return Math.min(0.9, Math.max(0.35, baseStrength * 1.4));
  }
}

/**
 * Сервис форматирования LaTeX для предотвращения горизонтального переполнения карточек.
 */
export class LatexFormattingService implements ILatexFormattingService {
  formatExpressionForWidth(rawLatex: string, constraints: LatexRenderingConstraintDTO): string {
    if (!constraints.enableLineBreaking || constraints.maxContainerWidthPx > 650) {
      return rawLatex;
    }
    if (rawLatex.includes('\\begin{aligned}') || rawLatex.includes('\\\\')) {
      return rawLatex;
    }
    return rawLatex.replace(/(\s*=\s*)/g, ' \\\\\n  = ');
  }

  prepareProofSteps(
    steps: readonly ProofStep[],
    constraints: LatexRenderingConstraintDTO
  ): readonly FormattedProofStepDTO[] {
    return steps.map((step) => {
      const stepText = `${step.name} ${step.action}`;
      return {
        step,
        formattedLatex: this.formatExpressionForWidth(step.expression, constraints),
        isSingularPhase:
          stepText.includes('A4') ||
          stepText.includes('A6') ||
          stepText.includes('SP4') ||
          stepText.includes('Bridge'),
        renderedAxiomBadge: `AXIOM: ${step.name}`,
      };
    });
  }
}

/**
 * Сервис отображения границ доверия Lean 4.
 */
export class ProofTrustPresentationService implements IProofTrustPresentationService {
  resolvePresentation(
    node: ProblemNode,
    evidence?: LeanKernelVerificationEvidence
  ): ProofTrustPresentationDTO {
    const isLeanProved = node.state === 'resolved' && (!node.leanErrors || node.leanErrors.length === 0);
    const isTrusted = isLeanProved && node.fractalDepth === 0;

    const status: ExternalLeanTrustStatus = isTrusted
      ? 'TRUSTED_AXIOM'
      : isLeanProved
      ? 'LEAN_VERIFIED'
      : 'REQUIRES_CORE_LEAN';

    return {
      status,
      badgeLabel: isTrusted
        ? 'Lean 4 Trusted Contract'
        : isLeanProved
        ? 'Lean 4 Proved'
        : 'RICIS-III Core Hypothesis',
      badgeColorClass: isTrusted
        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
        : 'bg-slate-900/80 text-slate-300 border-slate-700/50',
      doiUrl: isTrusted ? 'https://doi.org/10.5281/zenodo.17872755' : undefined,
      citationText: 'Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)',
      kernelEvidenceSummary: evidence ? `Verified with Lean 4 kernel at ${evidence.verifiedAt}` : undefined,
      isImmutableContract: isTrusted,
    };
  }
}
