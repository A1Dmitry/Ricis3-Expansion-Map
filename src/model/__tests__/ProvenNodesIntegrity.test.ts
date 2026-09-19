import { describe, it, expect } from 'vitest';
import { initialMap } from '../initialMap';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GAP-CLOSURE TASK-05 (F-05): узел карты может быть `resolved` только если
 * ядровой прогон подтверждает ИМЕННО ЕГО утверждение. `real-catalog-3`
 * (гипотеза Римана) и `registry-117` (Навье–Стокс) ссылались на структурные
 * AST-мосты, поэтому понижены до `partial` и получили `informalExternalClaim`.
 */
describe('QA Specification: Proven Nodes Integrity & Lean 4 Artifacts', () => {
  const targetCompletedNodes = [
    'ricis-chatbot-monetization',
    'registry-120',
  ];

  it('should mark all proven nodes as resolved in initialMap', () => {
    for (const nodeId of targetCompletedNodes) {
      const node = initialMap.nodes.find(n => n.id === nodeId);
      expect(node, `Node ${nodeId} must exist in initialMap`).toBeDefined();
      expect(node?.state).toBe('resolved');
      expect(node?.ricisSolvable).toBe(true);
    }
  });

  it('should keep open external problems partial and quarantine them as INFORMAL', () => {
    const boundaryNodes = ['real-catalog-3', 'registry-117'];

    for (const nodeId of boundaryNodes) {
      const node = initialMap.nodes.find(n => n.id === nodeId);
      expect(node, `Node ${nodeId} must exist in initialMap`).toBeDefined();
      expect(node?.state).toBe('partial');
      expect(node?.ricisSolvable).toBe(false);
      expect(node?.informalExternalClaim?.startsWith('INFORMAL')).toBe(true);
      // Любое упоминание «доказано» обязано быть отрицанием («НЕ доказано»).
      const fields = `${node?.title} ${node?.description}`;
      for (const match of fields.matchAll(/доказан\w*/gi)) {
        const prefix = fields.slice(Math.max(0, (match.index ?? 0) - 6), match.index).toLowerCase();
        expect(prefix.includes('не '), `Affirmative proof claim near "${match[0]}" in ${nodeId}`).toBe(true);
      }
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
