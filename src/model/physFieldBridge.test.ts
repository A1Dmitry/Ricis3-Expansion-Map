import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import * as fs from 'fs';
import * as path from 'path';
import { initialMap } from './initialMap';
import { nodeHasSorry } from './audit';
import { auditProofContent, LEAN_SPEC_DOI } from './ricisCoreRules';

const LEAN_REL_PATH = 'artifacts/proofs/lean/UnifiedField_GeometricBridge.lean';
const GEOMETRIC_BRIDGE_DOI = '10.5281/zenodo.22124493';

/** Minimal Lean comment/string blanker: block /- -/ (nested), line --, strings "...". */
function blankLeanCommentsAndStrings(source: string): string {
  const chars = source.split('');
  let index = 0;
  let depth = 0;
  while (index < chars.length) {
    const char = chars[index];
    const next = chars[index + 1];
    if (depth === 0 && char === '/' && next === '-') {
      chars[index] = ' ';
      chars[index + 1] = ' ';
      depth = 1;
      index += 2;
      continue;
    }
    if (depth > 0) {
      if (char === '/' && next === '-') {
        chars[index] = ' ';
        chars[index + 1] = ' ';
        depth += 1;
        index += 2;
        continue;
      }
      if (char === '-' && next === '/') {
        chars[index] = ' ';
        chars[index + 1] = ' ';
        depth -= 1;
        index += 2;
        continue;
      }
      if (char !== '\n') chars[index] = ' ';
      index += 1;
      continue;
    }
    if (char === '-' && next === '-') {
      while (index < chars.length && chars[index] !== '\n') {
        chars[index] = ' ';
        index += 1;
      }
      continue;
    }
    if (char === '"') {
      chars[index] = ' ';
      index += 1;
      while (index < chars.length && chars[index] !== '"') {
        if (chars[index] === '\\') {
          chars[index] = ' ';
          index += 1;
          if (index < chars.length && chars[index] !== '\n') {
            chars[index] = ' ';
            index += 1;
          }
          continue;
        }
        if (chars[index] !== '\n') chars[index] = ' ';
        index += 1;
      }
      if (index < chars.length) {
        chars[index] = ' ';
        index += 1;
      }
      continue;
    }
    index += 1;
  }
  return chars.join('');
}

describe('RICIS-III Field-Bridge (phys-field-bridge) map integration', () => {
  const leanPath = path.join(process.cwd(), LEAN_REL_PATH);

  it('registers the phys-field-bridge node with an honest discrete-proxy scope', () => {
    const node = initialMap.nodes.find(n => n.id === 'phys-field-bridge');
    expect(node, 'Node phys-field-bridge must exist in initialMap').toBeDefined();
    expect(node?.state).toBe('resolved');
    expect(node?.type).toBe('scientific_task');
    expect(node?.zoneIds).toContain('physics');
    expect(node?.dependencyIds).toContain('math-singularity');
    expect(node?.targetFunction.length).toBeGreaterThan(0);
    expect(node?.ricisSolvable).toBe(true);
    expect(node?.sourceUrl).toBe(`https://doi.org/${GEOMETRIC_BRIDGE_DOI}`);
    expect(node?.leanErrors ?? []).toEqual([]);
    // Scope honesty on the node itself: provenance DOI + explicit non-claims, continuum kept apart.
    expect(node?.description).toContain(GEOMETRIC_BRIDGE_DOI);
    expect(node?.description).toContain('НЕ ЗАЯВЛЕНО');
    expect(node?.description).toContain('phys-unified');
    expect(nodeHasSorry(node!)).toBe(false);
  });

  it('attaches a complete audited proof with locked external source', () => {
    const node = initialMap.nodes.find(n => n.id === 'phys-field-bridge')!;
    const proof = initialMap.proofs['phys-field-bridge'];
    expect(proof, 'Proof for phys-field-bridge must exist').toBeDefined();
    expect(proof.nodeId).toBe('phys-field-bridge');
    expect(proof.steps.length).toBeGreaterThanOrEqual(4);
    expect(proof.finalResult.length).toBeGreaterThan(0);
    expect(proof.finalResult).toContain('NOT claimed');
    expect(proof.latex.length).toBeGreaterThan(100);
    expect(proof.latex).toContain(LEAN_SPEC_DOI);
    expect(proof.latex).toContain('Axiom A6');
    expect(proof.latex).toContain(GEOMETRIC_BRIDGE_DOI);
    expect(proof.latex).toContain('Scope boundary');
    expect(proof.latex).toContain('NOT CLAIMED');
    expect(proof.axiomsUsed).toEqual(
      expect.arrayContaining(['L1_IDENTITY', 'SP2', 'SP4', 'A6_GEOMETRIC_BRIDGE', GEOMETRIC_BRIDGE_DOI]),
    );

    const audit = auditProofContent(proof.latex);
    expect(audit.isValid, `Audit failed: ${JSON.stringify(audit.issues)}`).toBe(true);
    expect(audit.score).toBeGreaterThanOrEqual(80);
    expect(audit.issues).toEqual([]);
    expect(nodeHasSorry(node, proof)).toBe(false);
  });

  it('keeps the external Lean source byte-locked and kernel-unclaimed (no self-certification)', () => {
    const proof = initialMap.proofs['phys-field-bridge'];
    const externalLean = proof.externalLean;
    expect(externalLean, 'externalLean provenance must be attached').toBeDefined();
    // No kernel run exists in this repository for the file yet: only REQUIRES_CORE_LEAN is honest.
    expect(externalLean?.trustStatus).toBe('REQUIRES_CORE_LEAN');
    expect(externalLean?.trustStatus).not.toBe('LEAN_VERIFIED');
    expect(externalLean?.trustStatus).not.toBe('TRUSTED_AXIOM');
    expect(externalLean?.sourceLocked).toBe(true);
    expect(externalLean?.kernelEvidence).toBeUndefined();
    expect(externalLean?.submittedAt.length).toBeGreaterThan(0);

    expect(fs.existsSync(leanPath), `Lean source must exist: ${LEAN_REL_PATH}`).toBe(true);
    const bytes = fs.readFileSync(leanPath);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    expect(externalLean?.sourceHash).toBe(`sha256:${sha256}`);
  });

  it('verifies the Lean source structure: namespace, proxies, gated eval, no unfinished proofs', () => {
    const content = fs.readFileSync(leanPath, 'utf-8');
    expect(content).toContain('namespace RICIS3.UnifiedFieldBridge');
    expect(content).toContain('structure FieldMonolith');
    expect(content).toContain('sp4_no_silent_collapse');
    expect(content).toContain('a6_product_proxy');
    expect(content).toContain('a6_ratio_proxy');
    expect(content).toContain('evalProductUnderPath');
    expect(content).toContain('evalRatioUnderPath');
    expect(content).toContain('phys-field-bridge/a6-proxy-v1');
    expect(content).toContain(GEOMETRIC_BRIDGE_DOI);
    expect(content).toContain('NOT CLAIMED');

    const code = blankLeanCommentsAndStrings(content);
    expect(code).toContain('theorem');
    expect(code).not.toMatch(/\bsorry\b/i);
    expect(code).not.toContain('sorryAx');
    expect(code).not.toMatch(/\badmit\b/i);
    expect(code).not.toMatch(/^\s*axiom\s/m);
    expect(code).toContain('end RICIS3.UnifiedFieldBridge');
  });

  it('links the node into the physics zone and math-singularity ancestry without breaking the graph', () => {
    const edge = initialMap.edges.find(
      e => e.fromId === 'math-singularity' && e.toId === 'phys-field-bridge',
    );
    expect(edge, 'Edge math-singularity -> phys-field-bridge must exist').toBeDefined();

    const physics = initialMap.zones.find(z => z.id === 'physics');
    expect(physics?.nodeIds).toContain('phys-field-bridge');

    const math = initialMap.nodes.find(n => n.id === 'math-singularity');
    expect(math?.dependentIds).toContain('phys-field-bridge');

    // Graph integrity: every edge endpoint resolves, no duplicate node ids introduced.
    const ids = new Set(initialMap.nodes.map(n => n.id));
    expect(ids.size).toBe(initialMap.nodes.length);
    for (const e of initialMap.edges) {
      expect(ids.has(e.fromId), `Edge ${e.id} has unknown fromId ${e.fromId}`).toBe(true);
      expect(ids.has(e.toId), `Edge ${e.id} has unknown toId ${e.toId}`).toBe(true);
    }
  });

  it('updates phys-unified with an explicit scope boundary and no inherited kernel claim', () => {
    const node = initialMap.nodes.find(n => n.id === 'phys-unified');
    expect(node?.description).toContain('phys-field-bridge');
    expect(node?.description).toContain(GEOMETRIC_BRIDGE_DOI);

    const proof = initialMap.proofs['phys-unified'];
    expect(proof.latex).toContain('phys-field-bridge');
    expect(proof.latex).toContain('Scope note');
    // The discrete proxy never certifies the continuum node: no externalLean may appear here.
    expect(proof.externalLean).toBeUndefined();

    const audit = auditProofContent(proof.latex);
    expect(audit.isValid, `Audit failed: ${JSON.stringify(audit.issues)}`).toBe(true);
    expect(audit.score).toBeGreaterThanOrEqual(80);
  });
});
