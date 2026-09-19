import { describe, expect, it } from 'vitest';
import { initialMap } from './initialMap';
import { NODE_CLAIM_ORCHESTRATION_PLAN } from './nodeClaimOrchestration';

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
  // NODE-CLAIM-ORCHESTRATION (AGENTS.md §13), 2026-09-19: к тому же перечню добавлены
  // узлы, перечисленные планом оркестрации (`nodeClaimOrchestration.ts`) с исходом
  // `partial` — проверка ниже опирается на ПЛАН, а не на рукописный список, поэтому
  // дерево и источник истины не могут разойтись незаметно.
  const OPEN_EXTERNAL_NODE_IDS = NODE_CLAIM_ORCHESTRATION_PLAN
    .filter((entry) => entry.outcome.state !== 'resolved')
    .map((entry) => entry.nodeId);

  it('scen_3: verifies every core research node is resolved except the documented partial-by-design ones', () => {
    expect(OPEN_EXTERNAL_NODE_IDS.length).toBeGreaterThanOrEqual(20);
    const unresolved = initialMap.nodes.filter(n => n.state !== 'resolved');
    expect(unresolved.map(n => n.id).sort()).toEqual([
      'phys-unified',
      'real-catalog-3',
      'registry-117',
      'riemann-complex-pole-regularizer',
      ...OPEN_EXTERNAL_NODE_IDS,
    ].sort());
    for (const node of unresolved) {
      if (node.id === 'phys-unified') continue;
      expect(node.informalExternalClaim?.startsWith('INFORMAL')).toBe(true);
    }
    // Узлы, чьим предметом является открытая задача Clay, не могут быть «решаемыми
    // протоколом»: узел хранит структурную редукцию, а не решение внешней задачи.
    for (const nodeId of ['real-catalog-3', 'registry-117']) {
      expect(initialMap.nodes.find(n => n.id === nodeId)?.ricisSolvable).toBe(false);
    }
    // Управляемые планом узлы не могут одновременно нести INFORMAL-заявку и считаться
    // решаемыми протоколом RICIS: понижение состояния и флаг `ricisSolvable` идут вместе.
    for (const nodeId of OPEN_EXTERNAL_NODE_IDS) {
      const node = initialMap.nodes.find(n => n.id === nodeId);
      expect(node?.state, `${nodeId} обязан быть partial по плану`).toBe('partial');
      expect(node?.ricisSolvable, `${nodeId}: INFORMAL-заявка несовместима с ricisSolvable=true`).toBe(false);
    }
  });

  it('scen_3b: phys-unified stays partial (never unresolved) with OPEN continuum proof', () => {
    const node = initialMap.nodes.find(n => n.id === 'phys-unified');
    expect(node?.state).toBe('partial');
    expect(initialMap.proofs['phys-unified'].finalResult).toContain('OPEN');
  });
});
