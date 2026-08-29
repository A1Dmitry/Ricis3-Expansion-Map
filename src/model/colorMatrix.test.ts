import { describe, expect, it } from 'vitest';
import {
  NodeResolutionStatusCode,
  EdgeStateCode,
  GraphColorStateManager,
  NODE_PROJECTIONS,
  EDGE_PROJECTIONS
} from './colorMatrix';
import { ProblemNode, Proof, DependencyEdge } from './types';

describe('GraphColorStateManager & Enum State Topology', () => {
  const manager = new GraphColorStateManager();

  describe('Node Resolution Status Code & Visual Projections', () => {
    it('QA-COLOR-01: maps fully resolved and proven nodes to PROVEN_RESOLVED with pure green color', () => {
      const node: ProblemNode = {
        id: 'node-1',
        title: 'Resolved Node',
        description: 'Test',
        state: 'resolved',
        type: 'scientific_task',
        targetFunction: '0_F \\times \\infty_G = F \\cdot G',
        zoneIds: ['math'],
        dependencyIds: [],
        dependentIds: [],
        fractalDepth: 1,
        economic: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 }
      };
      const proof: Proof = {
        nodeId: 'node-1',
        targetFunction: '0_F \\times \\infty_G = F \\cdot G',
        steps: [
          { phase: -1, name: 'L1', action: 'Verify', expression: 'X=X' },
          { phase: 2, name: 'RICIS', action: 'A6', expression: '0_F x inf_G = F*G' }
        ],
        finalResult: 'Proven Invariant',
        latex: '\\section*{RICIS Proof}'
      };

      const code = manager.resolveNodeStatusCode(node, proof);
      expect(code).toBe(NodeResolutionStatusCode.PROVEN_RESOLVED);

      const projection = manager.getNodeProjection(code);
      expect(projection.hexColor).toBe('#22c55e'); // Pure green
      expect(projection.rgb).toEqual({ r: 0.133, g: 0.773, b: 0.369 });
    });

    it('QA-COLOR-02: maps unresolved nodes to UNRESOLVED_SINGULARITY with pure red color', () => {
      const node: ProblemNode = {
        id: 'node-2',
        title: 'Unresolved Node',
        description: 'Open singularity',
        state: 'unresolved',
        type: 'core_singularity',
        targetFunction: '',
        zoneIds: ['singularity'],
        dependencyIds: [],
        dependentIds: [],
        fractalDepth: 1,
        economic: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 }
      };

      const code = manager.resolveNodeStatusCode(node);
      expect(code).toBe(NodeResolutionStatusCode.UNRESOLVED_SINGULARITY);

      const projection = manager.getNodeProjection(code);
      expect(projection.hexColor).toBe('#ef4444'); // Pure red
      expect(projection.rgb).toEqual({ r: 0.937, g: 0.267, b: 0.267 });
    });

    it('QA-COLOR-03: maps resolved nodes with weak or missing proof to RESOLVED_WITH_WARNINGS (Lime Green)', () => {
      const node: ProblemNode = {
        id: 'node-3',
        title: 'Weak Proof Node',
        description: 'Resolved without proper proof',
        state: 'resolved',
        type: 'scientific_task',
        targetFunction: 'F(x)',
        zoneIds: ['analysis'],
        dependencyIds: [],
        dependentIds: [],
        fractalDepth: 1,
        economic: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 }
      };

      const code = manager.resolveNodeStatusCode(node, undefined);
      expect(code).toBe(NodeResolutionStatusCode.RESOLVED_WITH_WARNINGS);

      const projection = manager.getNodeProjection(code);
      expect(projection.hexColor).toBe('#84cc16'); // Lime green
    });

    it('QA-COLOR-04: verifies all 8-16 node status codes have valid normalized RGB vectors and unique hex colors', () => {
      const codes = Object.values(NodeResolutionStatusCode);
      expect(codes.length).toBeGreaterThanOrEqual(8);

      const seenColors = new Set<string>();
      for (const code of codes) {
        const proj = NODE_PROJECTIONS[code];
        expect(proj).toBeDefined();
        expect(proj.hexColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(proj.rgb.r).toBeGreaterThanOrEqual(0);
        expect(proj.rgb.r).toBeLessThanOrEqual(1);
        expect(proj.rgb.g).toBeGreaterThanOrEqual(0);
        expect(proj.rgb.g).toBeLessThanOrEqual(1);
        expect(proj.rgb.b).toBeGreaterThanOrEqual(0);
        expect(proj.rgb.b).toBeLessThanOrEqual(1);
        seenColors.add(proj.hexColor);
      }
      expect(seenColors.size).toBe(codes.length);
    });
  });

  describe('Edge State Code Matrix (Tensor Product From x To)', () => {
    it('QA-COLOR-05: resolves connection between two PROVEN_RESOLVED nodes to STABLE_PROVEN (Pure Green)', () => {
      const edgeCode = manager.resolveEdgeStateCode(
        NodeResolutionStatusCode.PROVEN_RESOLVED,
        NodeResolutionStatusCode.PROVEN_RESOLVED
      );
      expect(edgeCode).toBe(EdgeStateCode.STABLE_PROVEN);

      const proj = manager.getEdgeProjection(edgeCode);
      expect(proj.hexColor).toBe('#22c55e');
    });

    it('QA-COLOR-06: resolves connection between two UNRESOLVED nodes to OPEN_SINGULARITY_LINK (Pure Red)', () => {
      const edgeCode = manager.resolveEdgeStateCode(
        NodeResolutionStatusCode.UNRESOLVED_SINGULARITY,
        NodeResolutionStatusCode.UNRESOLVED_SINGULARITY
      );
      expect(edgeCode).toBe(EdgeStateCode.OPEN_SINGULARITY_LINK);

      const proj = manager.getEdgeProjection(edgeCode);
      expect(proj.hexColor).toBe('#ef4444');
    });

    it('QA-COLOR-07: resolves transition from PROVEN to UNRESOLVED to TRANSITION_FRONT (Orange)', () => {
      const edgeCode = manager.resolveEdgeStateCode(
        NodeResolutionStatusCode.PROVEN_RESOLVED,
        NodeResolutionStatusCode.UNRESOLVED_SINGULARITY
      );
      expect(edgeCode).toBe(EdgeStateCode.TRANSITION_FRONT);

      const proj = manager.getEdgeProjection(edgeCode);
      expect(proj.hexColor).toBe('#f97316');
    });

    it('QA-COLOR-08: prioritizes ACTIVE_L1_STREAM (Neon Cyan) when edge is on the active proof path', () => {
      const edgeCode = manager.resolveEdgeStateCode(
        NodeResolutionStatusCode.PROVEN_RESOLVED,
        NodeResolutionStatusCode.PROVEN_RESOLVED,
        true // isL1Path
      );
      expect(edgeCode).toBe(EdgeStateCode.ACTIVE_L1_STREAM);

      const proj = manager.getEdgeProjection(edgeCode);
      expect(proj.hexColor).toBe('#06b6d4');
    });

    it('QA-COLOR-09: verifies complete 16-color palette for edge state codes with zero NaN vectors', () => {
      const edgeCodes = Object.values(EdgeStateCode);
      expect(edgeCodes.length).toBe(16);

      for (const code of edgeCodes) {
        const proj = EDGE_PROJECTIONS[code];
        expect(proj).toBeDefined();
        expect(proj.hexColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(Number.isNaN(proj.rgb.r)).toBe(false);
        expect(Number.isNaN(proj.rgb.g)).toBe(false);
        expect(Number.isNaN(proj.rgb.b)).toBe(false);
      }
    });
  });

  describe('Batch Graph Edge State Recalculation', () => {
    it('QA-COLOR-10: updates edge list assigning both semantic stateCode and stateColor projection', () => {
      const nodes: ProblemNode[] = [
        {
          id: 'A',
          title: 'A',
          description: '',
          state: 'resolved',
          type: 'scientific_task',
          targetFunction: 'FA',
          zoneIds: [],
          dependencyIds: [],
          dependentIds: [],
          fractalDepth: 1,
          economic: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 }
        },
        {
          id: 'B',
          title: 'B',
          description: '',
          state: 'resolved',
          type: 'scientific_task',
          targetFunction: 'FB',
          zoneIds: [],
          dependencyIds: [],
          dependentIds: [],
          fractalDepth: 1,
          economic: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 }
        },
        {
          id: 'C',
          title: 'C',
          description: '',
          state: 'unresolved',
          type: 'core_singularity',
          targetFunction: '',
          zoneIds: [],
          dependencyIds: [],
          dependentIds: [],
          fractalDepth: 1,
          economic: { costUnresolved: 0, costToSolve: 0, marketGain: 0, riskLoss: 0 }
        }
      ];
      const proofs: Record<string, Proof> = {
        A: { nodeId: 'A', targetFunction: 'FA', steps: [{ phase: 1, name: 'S', action: 'A', expression: 'E' }], finalResult: 'ok', latex: 'latex' },
        B: { nodeId: 'B', targetFunction: 'FB', steps: [{ phase: 1, name: 'S', action: 'A', expression: 'E' }], finalResult: 'ok', latex: 'latex' }
      };
      const edges: DependencyEdge[] = [
        { id: 'e1', fromId: 'A', toId: 'B', strength: 1, stateColor: '#64748b', economicInfluence: 0 },
        { id: 'e2', fromId: 'A', toId: 'C', strength: 1, stateColor: '#64748b', economicInfluence: 0 }
      ];

      const recalculated = manager.recalculateGraphEdgeStates(nodes, edges, proofs, new Set(['A', 'B']));

      expect(recalculated[0]?.stateCode).toBe(EdgeStateCode.ACTIVE_L1_STREAM);
      expect(recalculated[0]?.stateColor).toBe('#06b6d4');

      expect(recalculated[1]?.stateCode).toBe(EdgeStateCode.TRANSITION_FRONT);
      expect(recalculated[1]?.stateColor).toBe('#f97316');
    });
  });
});
