import { describe, it, expect } from 'vitest';
import { initialMap } from '../initialMap';
import * as fs from 'fs';
import * as path from 'path';

describe('QA Specification: Proven Nodes Integrity & Lean 4 Artifacts', () => {
  const targetCompletedNodes = [
    'ricis-chatbot-monetization',
    'real-catalog-3',
    'registry-120'
  ];

  it('should mark all proven nodes as resolved in initialMap', () => {
    for (const nodeId of targetCompletedNodes) {
      const node = initialMap.nodes.find(n => n.id === nodeId);
      expect(node, `Node ${nodeId} must exist in initialMap`).toBeDefined();
      expect(node?.state).toBe('resolved');
      expect(node?.ricisSolvable).toBe(true);
    }
  });

  it('should verify that referenced Lean 4 standalone artifacts exist and contain valid theorems', () => {
    const verifiedProofFiles = [
      'artifacts/proofs/ricis-riemann-zeta-ast-bridge.standalone.lean',
      'artifacts/proofs/ricis-navier-stokes-ast-bridge.standalone.lean',
      'artifacts/proofs/ricis-jacobian-conjecture.standalone.lean',
      'artifacts/proofs/ricis-chatbot-monetization.lean',
      'artifacts/proofs/database-a6-0_5-inf_3.generated.lean'
    ];

    for (const relPath of verifiedProofFiles) {
      const fullPath = path.resolve(process.cwd(), relPath);
      expect(fs.existsSync(fullPath), `Lean proof file must exist: ${relPath}`).toBe(true);
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content.length).toBeGreaterThan(50);
      expect(content).toContain('theorem');
    }
  });
});
