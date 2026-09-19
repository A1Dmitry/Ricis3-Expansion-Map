import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { initialMap } from './initialMap';

/**
 * OIR03 / GAP-CLOSURE TASK-05 (finding F-05, MEDIUM).
 *
 * До 2026-09-19 узел `real-catalog-3` был помечен `resolved`, а его LaTeX
 * озаглавлен «Resolution of the Riemann Hypothesis». Ядровой прогон
 * `ricis-riemann-zeta-ast-bridge.standalone.lean` (run 34891262489, exit 0,
 * без sorryAx) доказывает только структурную редукцию узла AST
 * `ricisReduceZeta (divSelf …) = one`, а не гипотезу Римана.
 *
 * Тесты ниже обновлены НАМЕРЕННО: узел понижен до `partial`, внешняя задача
 * вынесена в `informalExternalClaim` (поле с префиксом INFORMAL), а формулировка
 * доказательства описывает ровно то, что подтверждено ядром. Артефакты
 * (`artifacts/proofs/*.lean` и их JSON) не изменялись — §7 AGENTS.md.
 */
describe('QA Suite: Riemann Hypothesis & Intermediate AST Reduction Proofs', () => {
  it('QA-1: verifies the existence of the Lean 4 standalone proof file', () => {
    const leanPath = 'artifacts/proofs/ricis-riemann-zeta-ast-bridge.standalone.lean';
    expect(existsSync(leanPath)).toBe(true);

    const content = readFileSync(leanPath, 'utf8');
    expect(content).toContain('namespace RICIS.RiemannZeta');
    expect(content).toContain('inductive ZetaExpr');
    expect(content).toContain('ricisReduceZeta');
    expect(content).toContain('theorem riemann_bridge_reduced');
    expect(content).toContain('theorem riemann_bridge_independent_of_complexity');
  });

  it('QA-2: verifies the metadata JSON is valid and trust status is TRUSTED_AXIOM', () => {
    const jsonPath = 'artifacts/proofs/ricis-riemann-zeta-ast-bridge.json';
    expect(existsSync(jsonPath)).toBe(true);

    const raw = readFileSync(jsonPath, 'utf8');
    const metadata = JSON.parse(raw);
    expect(metadata.claim).toContain('ricisReduceZeta');
    expect(metadata.claim).toContain('ZetaExpr.one');
    expect(metadata.verification.trustStatus).toBe('TRUSTED_AXIOM');
    expect(metadata.verification.contentHash).toBe('85fd84aca47bf193245a65617c64a5d5b47c101863e868d3260b1e71e4c9798b');
  });

  it('QA-3: the Riemann Hypothesis node is partial and the external problem is quarantined as INFORMAL', () => {
    const riemannNode = initialMap.nodes.find(n => n.id === 'real-catalog-3');
    expect(riemannNode).toBeDefined();
    // TASK-05: понижение с 'resolved' — ядро не доказывало гипотезу Римана.
    expect(riemannNode?.state).toBe('partial');
    expect(riemannNode?.title).toContain('Риман');
    expect(riemannNode?.description).toContain('ОТКРЫТА');
    expect(riemannNode?.description).toContain('ЧТО ФАКТИЧЕСКИ ПОДТВЕРЖДЕНО ЯДРОМ');
    expect(riemannNode?.informalExternalClaim?.startsWith('INFORMAL')).toBe(true);
    // узел больше не заявляет о решаемости открытой задачи протоколом
    expect(riemannNode?.ricisSolvable).toBe(false);
  });

  it('QA-4: verifies intermediate nodes are registered and correctly linked (structural result only)', () => {
    const patternNode = initialMap.nodes.find(n => n.id === 'ricis-ast-reduction-pattern');
    expect(patternNode).toBeDefined();
    expect(patternNode?.state).toBe('resolved');
    expect(patternNode?.dependencyIds).toContain('math-singularity');

    const regNode = initialMap.nodes.find(n => n.id === 'riemann-complex-pole-regularizer');
    expect(regNode).toBeDefined();
    // TASK-05: аналитическая регулярность ζ(s) в s=1 не доказана ядром -> partial
    expect(regNode?.state).toBe('partial');
    expect(regNode?.description).toContain('НЕ ДОКАЗАНО');
    expect(regNode?.informalExternalClaim?.startsWith('INFORMAL')).toBe(true);
    expect(regNode?.dependencyIds).toContain('ricis-ast-reduction-pattern');

    const riemannNode = initialMap.nodes.find(n => n.id === 'real-catalog-3');
    expect(riemannNode?.dependencyIds).toContain('riemann-complex-pole-regularizer');
  });

  it('QA-5: the map proof states the structural AST reduction and never phrases RH as solved', () => {
    const proof = initialMap.proofs['real-catalog-3'];
    expect(proof).toBeDefined();
    expect(proof.nodeId).toBe('real-catalog-3');
    expect(proof.externalLean).toBeDefined();
    // Статус относится к АРТЕФАКТУ (ядровой прогон 34891262489 артефакта
    // ricis-riemann-zeta-ast-bridge), а не к гипотезе Римана.
    expect(proof.externalLean?.trustStatus).toBe('LEAN_VERIFIED');
    expect(proof.externalLean?.sourceHash).toContain('85fd84aca47bf193245a65617c64a5d5b47c101863e868d3260b1e71e4c9798b');
    expect(proof.externalLean?.kernelEvidence?.command).toContain('ricis-riemann-zeta-ast-bridge');

    expect(proof.targetFunction).toContain('ZetaExpr AST');
    expect(proof.finalResult).toContain('NOT solved');
    expect(proof.latex).toContain('Boundary of the claim');
    // Формулировки, приписывающие узлу решение внешней задачи, запрещены.
    expect(proof.latex).not.toMatch(/Resolution of the Riemann Hypothesis/i);
    expect(proof.latex).not.toMatch(/Proof Status:\s*LEAN_VERIFIED\s*$/i);
  });

  it('QA-6: the 3D Navier–Stokes node keeps the same boundary (structural AST reduction only)', () => {
    const nsNode = initialMap.nodes.find(n => n.id === 'registry-117');
    expect(nsNode).toBeDefined();
    expect(nsNode?.state).toBe('partial');
    expect(nsNode?.type).toBe('derived_problem');
    expect(nsNode?.description).toContain('ОТКРЫТА');
    expect(nsNode?.informalExternalClaim?.startsWith('INFORMAL')).toBe(true);

    const proof = initialMap.proofs['registry-117'];
    expect(proof).toBeDefined();
    expect(proof.externalLean?.trustStatus).toBe('LEAN_VERIFIED');
    expect(proof.externalLean?.sourceHash).toContain('85edafc2dd5fdcd3fc694cd246f8faf9337e9b036fe05f9fcd105b95cc6cc77a');
    expect(proof.latex).toContain('Boundary of the claim');
    expect(proof.finalResult).toContain('NOT solved');
    expect(proof.latex).not.toMatch(/Navier--Stokes existence and smoothness\s*(is|—)?\s*resolved/i);
  });
});
