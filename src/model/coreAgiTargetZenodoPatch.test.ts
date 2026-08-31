import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('RICIS-III Core AGI Target Zenodo Package & Patch Validation', () => {
  const rootDir = process.cwd();
  const patchPath = path.join(rootDir, 'ricis-map-patch-core-agi-target-PENDING.json');
  const texPath = path.join(rootDir, 'artifacts', 'proofs', 'ricis_agi_target_sp4.tex');
  const leanPath = path.join(rootDir, 'artifacts', 'proofs', 'RicisAgiTarget.lean');
  const readmePath = path.join(rootDir, 'artifacts', 'proofs', 'README.md');

  it('scen_1: validates JSON patch structure and unlocks list', () => {
    expect(fs.existsSync(patchPath)).toBe(true);
    const raw = fs.readFileSync(patchPath, 'utf-8');
    const patch = JSON.parse(raw);

    expect(patch['@type']).toBe('RICIS.MapStatePatch');
    expect(patch.meta.method).toBe('resolve_core_agi_target_sp4_l1_a6');
    expect(patch.meta.trustPolicy).toContain('WORKFLOW_ONLY');
    expect(patch.meta.unlocks).toEqual([
      'med-diagnostics',
      'pharm-design',
      'econ-value',
      'ethic-alignment',
      'ricis-chatbot-monetization',
    ]);
    expect(patch.nodePatches).toHaveLength(1);
    expect(patch.nodePatches[0].id).toBe('core-agi-target');
    expect(patch.nodePatches[0].state).toBe('resolved');
    expect(patch.proofs['core-agi-target']).toBeDefined();
    expect(patch.proofs['core-agi-target'].axiomsUsed).toContain('A6_GEOMETRIC_BRIDGE');
    expect(patch.proofs['core-agi-target'].axiomsUsed).toContain('SP4');
  });

  it('scen_2: verifies existence and mathematical content of LaTeX technical note', () => {
    expect(fs.existsSync(texPath)).toBe(true);
    const content = fs.readFileSync(texPath, 'utf-8');
    expect(content).toContain('Goal');
    expect(content).toContain('SP4');
    expect(content).toContain('10.5281/zenodo.22124493');
    expect(content).toContain('Dmitry');
  });

  it('scen_3: verifies computable Lean 4 prototype file and full algebraic system', () => {
    expect(fs.existsSync(leanPath)).toBe(true);
    const content = fs.readFileSync(leanPath, 'utf-8');
    expect(content).toContain('namespace RICIS3.AgiTarget');
    expect(content).toContain('sp4_no_silent_collapse');
    expect(content).toContain('detBridge_eq_mul');
    expect(content).toContain('reducePipeline');
    expect(content).toContain('simplifySystem');
    expect(content).toContain('GoalMonolith');
    expect(content).not.toContain('sorry');
  });

  it('scen_4: verifies boundary note README in artifacts/proofs', () => {
    expect(fs.existsSync(readmePath)).toBe(true);
    const content = fs.readFileSync(readmePath, 'utf-8');
    expect(content).toContain('ricis_agi_target_sp4.tex');
    expect(content).toContain('RicisAgiTarget.lean');
    expect(content).toContain('10.5281/zenodo.22124493');
  });
});
