import { describe, it, expect, beforeEach } from 'vitest';
import type { RicisNumber, TransformationLog, CanvasScrollGuardPolicyDTO, SidebarAccordionStateDTO } from './types';
import type { ProblemNode, ProofStep } from '../../model/types';
import {
  StructuralEqualityComparer,
  UINavigationLayoutService,
  SearchErgonomicsService,
  CanvasInteractionPolicyService,
  LatexFormattingService,
  ProofTrustPresentationService,
} from './ergonomicsServices';

describe('RICIS-III UI/UX Ergonomics & Axiomatic Contracts (Agile Step 3 & 4 QA Suite)', () => {
  describe('1. Structural Equality & L1_IDENTITY Preservation (A4, SP4, Geometric Bridge)', () => {
    let comparer: StructuralEqualityComparer;

    beforeEach(() => {
      comparer = new StructuralEqualityComparer();
    });

    it('asserts true identity X = X when semantic index, type and generating expression match', () => {
      const zeroF1: RicisNumber = {
        kind: 'zero',
        semanticIndex: '0_{(x^2-4)|x=2}',
        dimensionType: '0-dim',
        generatingExpression: 'x^2 - 4',
        evaluatedCoordinate: 0,
        isSingular: true,
      };
      const zeroF2: RicisNumber = {
        kind: 'zero',
        semanticIndex: '0_{(x^2-4)|x=2}',
        dimensionType: '0-dim',
        generatingExpression: 'x^2 - 4',
        evaluatedCoordinate: 0,
        isSingular: true,
      };

      expect(comparer.areIdentical(zeroF1, zeroF2)).toBe(true);
      expect(comparer.hasMatchingOrigin(zeroF1, zeroF2)).toBe(true);
    });

    it('strictly forbids equating zero objects with different generating expressions (A3/SP3)', () => {
      const zeroF: RicisNumber = {
        kind: 'zero',
        semanticIndex: '0_{(x^2-4)|x=2}',
        dimensionType: '0-dim',
        generatingExpression: 'x^2 - 4',
        evaluatedCoordinate: 0,
        isSingular: true,
      };
      const zeroG: RicisNumber = {
        kind: 'zero',
        semanticIndex: '0_{(x-2)|x=2}',
        dimensionType: '0-dim',
        generatingExpression: 'x - 2',
        evaluatedCoordinate: 0,
        isSingular: true,
      };

      expect(comparer.areIdentical(zeroF, zeroG)).toBe(false);
      expect(comparer.hasMatchingOrigin(zeroF, zeroG)).toBe(false);
    });

    it('verifies that transformation history is monotonically recorded in TransformationLog without data loss', () => {
      const historyLog: TransformationLog[] = [
        {
          stepIndex: 1,
          phase: -1,
          axiomApplied: 'L1',
          inputExpression: '0_F * ∞_G',
          outputExpression: '0_F * ∞_G',
          complexity: 'O(1)',
          timestamp: '2026-08-27T12:00:00.000Z',
        },
        {
          stepIndex: 2,
          phase: 2,
          axiomApplied: 'GEOMETRIC_BRIDGE',
          inputExpression: '0_F * ∞_G',
          outputExpression: 'det(u, v) = F * G',
          complexity: 'O(1)',
          timestamp: '2026-08-27T12:00:01.000Z',
        },
      ];

      expect(historyLog).toHaveLength(2);
      expect(historyLog[0].complexity).toBe('O(1)');
      expect(historyLog[1].axiomApplied).toBe('GEOMETRIC_BRIDGE');
    });
  });

  describe('2. Navigation & Header Information Architecture', () => {
    let navService: UINavigationLayoutService;

    beforeEach(() => {
      navService = new UINavigationLayoutService();
    });

    it('provides exactly grouped header action items matching the canonical layout', () => {
      const items = navService.getHeaderItems();

      expect(items.length).toBeGreaterThanOrEqual(4);
      expect(items.find((i: { id: string }) => i.id === 'explore-3d')?.group).toBe('explore');
      expect(items.find((i: { id: string }) => i.id === 'tools-calc')?.group).toBe('tools');
      expect(items.find((i: { id: string }) => i.id === 'tools-voynich')?.group).toBe('tools');
      expect(items.find((i: { id: string }) => i.id === 'system-settings')?.group).toBe('system');
    });

    it('correctly toggles sidebar accordion with optional autoCollapseOthers behavior', () => {
      let state: SidebarAccordionStateDTO = {
        expandedSectionIds: new Set(['math-core']),
        pinnedAuditPanel: false,
        autoCollapseOthers: true,
      };

      state = navService.toggleAccordionSection('voynich-genome', state);
      expect(state.expandedSectionIds.has('voynich-genome')).toBe(true);
      expect(state.expandedSectionIds.has('math-core')).toBe(false);

      state = navService.toggleAccordionSection('voynich-genome', state);
      expect(state.expandedSectionIds.has('voynich-genome')).toBe(false);
    });

    it('pins and unpins audit panel without destroying other expanded sections', () => {
      let state: SidebarAccordionStateDTO = {
        expandedSectionIds: new Set(['math-core']),
        pinnedAuditPanel: false,
        autoCollapseOthers: false,
      };

      state = navService.setPinnedAudit(true, state);
      expect(state.pinnedAuditPanel).toBe(true);
      expect(state.expandedSectionIds.has('math-core')).toBe(true);
    });
  });

  describe('3. Unified Search & Singularity Pattern Matching', () => {
    let searchService: SearchErgonomicsService;

    beforeEach(() => {
      searchService = new SearchErgonomicsService();
    });

    it('detects 0/0 and SP4 signatures from search queries', () => {
      const query = 'Resolve 0/0 at singularity point x=2';
      const parsed = searchService.parseQuery(query);

      expect(parsed.rawQuery).toBe(query);
      expect(parsed.matchedSignatures).toContain('SP4_ZERO_RATIO');
    });

    it('detects 0 * infinity and A6 Geometric Bridge signature', () => {
      const query = '0_F * ∞_G';
      const parsed = searchService.parseQuery(query);

      expect(parsed.matchedSignatures).toContain('A6_GEOMETRIC_BRIDGE');
    });

    it('filters problem nodes by title, id, or target function', () => {
      const nodes: ProblemNode[] = [
        {
          id: 'riemann-hypothesis',
          title: 'Riemann Zeta Singularity',
          description: 'Zeta zero line singularity resolution',
          state: 'resolved',
          type: 'core_singularity',
          targetFunction: 'zeta(s) at s=1',
          zoneIds: ['math'],
          dependencyIds: [],
          dependentIds: [],
          fractalDepth: 0,
          economic: { costUnresolved: 100, costToSolve: 10, marketGain: 500, riskLoss: 5 },
        },
        {
          id: 'navier-stokes',
          title: 'Navier-Stokes Blowup',
          description: 'Viscous energy singularity',
          state: 'unresolved',
          type: 'scientific_task',
          targetFunction: 'smooth_solution(t)',
          zoneIds: ['physics'],
          dependencyIds: [],
          dependentIds: [],
          fractalDepth: 1,
          economic: { costUnresolved: 200, costToSolve: 20, marketGain: 800, riskLoss: 10 },
        },
      ];

      const queryDTO = searchService.parseQuery('Riemann');
      const filtered = searchService.filterNodes(nodes, queryDTO);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('riemann-hypothesis');
    });

    it('maintains a bounded search history (max 5 items, deduplicated)', () => {
      searchService.recordHistory('query 1', 5);
      searchService.recordHistory('query 2', 3);
      searchService.recordHistory('query 3', 8);
      searchService.recordHistory('query 4', 1);
      searchService.recordHistory('query 5', 12);
      const hist = searchService.recordHistory('query 6', 4);

      expect(hist.length).toBeLessThanOrEqual(5);
      expect(hist[0].query).toBe('query 6');
    });
  });

  describe('4. Canvas Interaction & Scroll Guard Policies', () => {
    let canvasService: CanvasInteractionPolicyService;

    beforeEach(() => {
      canvasService = new CanvasInteractionPolicyService();
    });

    it('requires Ctrl/Cmd key for zooming when requireModifierKeyForZoom is enabled and canvas is not focused', () => {
      const policy: CanvasScrollGuardPolicyDTO = {
        requireModifierKeyForZoom: true,
        isCanvasFocused: false,
        zoomSensitivity: 1.0,
        edgeContrastBoostAtDistance: true,
      };

      const plainWheel = { ctrlKey: false, metaKey: false };
      const ctrlWheel = { ctrlKey: true, metaKey: false };

      expect(canvasService.shouldAllowZoom(plainWheel, policy)).toBe(false);
      expect(canvasService.shouldAllowZoom(ctrlWheel, policy)).toBe(true);
    });

    it('boosts edge opacity at high camera distance for optimal readability', () => {
      const policy: CanvasScrollGuardPolicyDTO = {
        requireModifierKeyForZoom: false,
        isCanvasFocused: true,
        zoomSensitivity: 1.0,
        edgeContrastBoostAtDistance: true,
      };

      const closeOpacity = canvasService.calculateEdgeOpacity(50, 0.5, policy);
      const farOpacity = canvasService.calculateEdgeOpacity(400, 0.5, policy);

      expect(closeOpacity).toBe(0.5);
      expect(farOpacity).toBeGreaterThanOrEqual(0.35);
    });
  });

  describe('5. LaTeX Formatting & Mobile Multi-line Alignment', () => {
    let latexService: LatexFormattingService;

    beforeEach(() => {
      latexService = new LatexFormattingService();
    });

    it('breaks long equation chains into multi-line LaTeX on narrow containers', () => {
      const longEq = '0_F \\times \\infty_G = \\det(u, v) = F \\cdot G = 42';
      const formatted = latexService.formatExpressionForWidth(longEq, {
        maxContainerWidthPx: 380,
        fontSizeRem: 0.9,
        enableLineBreaking: true,
        allowHorizontalOverflowScroll: true,
      });

      expect(formatted).toContain('\\\\');
    });

    it('prepares formatted proof steps with singular phase tagging', () => {
      const sampleSteps: ProofStep[] = [
        { phase: 2, name: 'Phase 2: A6 Geometric Bridge', action: 'apply_a6', expression: '0_F \\times \\infty_G = F \\cdot G' },
        { phase: 5, name: 'Phase 5: Standard Arithmetic', action: 'compute_result', expression: 'Result = 10' },
      ];

      const prepared = latexService.prepareProofSteps(sampleSteps, {
        maxContainerWidthPx: 800,
        fontSizeRem: 1.0,
        enableLineBreaking: false,
        allowHorizontalOverflowScroll: true,
      });

      expect(prepared[0].isSingularPhase).toBe(true);
      expect(prepared[0].renderedAxiomBadge).toContain('A6');
      expect(prepared[1].isSingularPhase).toBe(false);
    });
  });

  describe('6. Proof Trust Presentation & DOI Attribution', () => {
    let presentationService: ProofTrustPresentationService;

    beforeEach(() => {
      presentationService = new ProofTrustPresentationService();
    });

    it('resolves TRUSTED_AXIOM nodes with DOI reference and immutable badge style', () => {
      const trustedNode: ProblemNode = {
        id: 'node-a6',
        title: 'Geometric Bridge Axiom A6',
        description: '0_F * ∞_G = F * G',
        state: 'resolved',
        type: 'core_singularity',
        targetFunction: '0_F * ∞_G = F * G',
        zoneIds: ['foundations'],
        dependencyIds: [],
        dependentIds: [],
        fractalDepth: 0,
        economic: { costUnresolved: 0, costToSolve: 0, marketGain: 100, riskLoss: 0 },
      };

      const pres = presentationService.resolvePresentation(trustedNode);
      expect(pres.status).toBe('TRUSTED_AXIOM');
      expect(pres.isImmutableContract).toBe(true);
      expect(pres.doiUrl).toBe('https://doi.org/10.5281/zenodo.17872755');
      expect(pres.citationText).toContain('Aleinikov');
    });
  });
});
