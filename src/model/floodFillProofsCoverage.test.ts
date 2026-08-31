import { describe, it, expect } from 'vitest';
import { initialMap } from './initialMap';
import { auditProofContent } from './ricisCoreRules';

describe('RICIS-III Flood-Fill Proofs Full Graph Coverage & Audit Verification', () => {
  const targetNodeIds = [
    'med-diagnostics',
    'pharm-design',
    'phys-unified',
    'econ-value',
    'ethic-alignment',
    'informatics-complexity',
    'manipulator-core-kinematics',
    'manipulator-constraints-workspace',
    'manipulator-singularities',
    'manipulator-ui-visualization',
    'calculator-node-complex-analysis',
    'calculator-node-riemann',
    'calculator-node-bsd',
    'calculator-node-hodge',
    'calculator-node-poincare',
    'calculator-node-mandelbrot',
    'calculator-node-gravitational',
    'calculator-node-yang-mills',
    'calculator-node-chladni',
    'calculator-node-kinematic'
  ];

  it('verifies all 20 target nodes exist in the initial map and are in resolved state', () => {
    for (const nodeId of targetNodeIds) {
      const node = initialMap.nodes.find(n => n.id === nodeId);
      expect(node).toBeDefined();
      expect(node!.state).toBe('resolved');
      expect(node!.leanErrors || []).toEqual([]);
    }
  });

  it('verifies each of the 20 target nodes has a complete, valid proof with 100% audit score', () => {
    for (const nodeId of targetNodeIds) {
      const proof = initialMap.proofs[nodeId];
      expect(proof).toBeDefined();
      expect(proof!.nodeId).toBe(nodeId);
      expect(proof!.steps.length).toBeGreaterThanOrEqual(3);
      expect(proof!.finalResult.length).toBeGreaterThan(0);
      expect(proof!.latex.length).toBeGreaterThan(100);

      const audit = auditProofContent(proof!.latex);
      expect(audit.isValid, `Audit failed for node ${nodeId}: ${JSON.stringify(audit.issues)}`).toBe(true);
      expect(audit.score).toBeGreaterThanOrEqual(70);
      expect(audit.issues).toEqual([]);
    }
  });
});
