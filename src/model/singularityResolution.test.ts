import { describe, expect, it } from 'vitest';
import { initialMap } from './initialMap';

describe('RICIS-III Singularity Resolution & Graph Completion Verification', () => {
  it('scen_1 (Task 1): verifies math-singularity is fully resolved with A4/A6 axioms and DOI 10.5281/zenodo.22124493', () => {
    const node = initialMap.nodes.find(n => n.id === 'math-singularity');
    expect(node).toBeDefined();
    expect(node?.state).toBe('resolved');
    expect(node?.sourceUrl).toBe('https://doi.org/10.5281/zenodo.22124493');
    expect(node?.targetFunction).toContain('ResolveSingularity');

    const proof = initialMap.proofs['math-singularity'];
    expect(proof).toBeDefined();
    expect(proof.axiomsUsed).toContain('A4_ZERO_RATIO');
    expect(proof.axiomsUsed).toContain('A6_GEOMETRIC_BRIDGE');
    expect(proof.axiomsUsed).toContain('10.5281/zenodo.22124493');
  });

  it('scen_2 (Task 2): verifies core-agi-target is fully resolved with Goal_P invariant and DOI 10.5281/zenodo.22225762', () => {
    const node = initialMap.nodes.find(n => n.id === 'core-agi-target');
    expect(node).toBeDefined();
    expect(node?.state).toBe('resolved');
    expect(node?.sourceUrl).toBe('https://doi.org/10.5281/zenodo.22225762');
    expect(node?.targetFunction).toContain('FormalizeAGITarget');

    const proof = initialMap.proofs['core-agi-target'];
    expect(proof).toBeDefined();
    expect(proof.axiomsUsed).toContain('L1_IDENTITY');
    expect(proof.axiomsUsed).toContain('SP4');
    expect(proof.axiomsUsed).toContain('10.5281/zenodo.22225762');
  });

  // Contract-layers merge (expand_phys_field_bridge_contract_layers, 0.4.193):
  // phys-unified is partial BY DESIGN — the prior det-only resolved marking was an
  // overclaim (continuum QM–GR unification was never established). Owner-authorized
  // correction; every other seed node must remain resolved.
  // GAP-CLOSURE TASK-05 (F-05), 2026-09-19: перечень partial-by-design расширен.
  // real-catalog-3 (гипотеза Римана), riemann-complex-pole-regularizer и registry-117
  // (Навье–Стокс) были 'resolved' по структурным AST-мостам: ядровой прогон подтверждает
  // только редукцию divSelf → one, а не внешнюю задачу. Состояние понижено до 'partial',
  // внешняя задача вынесена в поле informalExternalClaim (INFORMAL:).
  it('scen_3: verifies every core research node is resolved except the documented partial-by-design ones', () => {
    const unresolved = initialMap.nodes.filter(n => n.state !== 'resolved');
    expect(unresolved.map(n => n.id).sort()).toEqual([
      'phys-unified',
      'real-catalog-3',
      'registry-117',
      'riemann-complex-pole-regularizer',
    ]);
    for (const node of unresolved) {
      if (node.id === 'phys-unified') continue;
      expect(node.informalExternalClaim?.startsWith('INFORMAL')).toBe(true);
    }
    // Узлы, чьим предметом является открытая задача Clay, не могут быть «решаемыми
    // протоколом»: узел хранит структурную редукцию, а не решение внешней задачи.
    for (const nodeId of ['real-catalog-3', 'registry-117']) {
      expect(initialMap.nodes.find(n => n.id === nodeId)?.ricisSolvable).toBe(false);
    }
  });

  it('scen_3b: phys-unified stays partial (never unresolved) with OPEN continuum proof', () => {
    const node = initialMap.nodes.find(n => n.id === 'phys-unified');
    expect(node?.state).toBe('partial');
    expect(initialMap.proofs['phys-unified'].finalResult).toContain('OPEN');
  });
});
