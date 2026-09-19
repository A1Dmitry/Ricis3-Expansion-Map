import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { TaskResolutionEngine } from './taskResolutionEngine';

describe('RICIS-III v7.7 Task Resolution Engine (DDD / SOLID / Anti-Tukhta)', () => {
  const engine = TaskResolutionEngine.getInstance();

  describe('1. Elementary Tasks: Exact RICIS-III Resolution & Lean Verification', () => {
    it('provides elementary tasks with complete 7-phase trace (Phases -1 to 6)', () => {
      const solved = engine.getResolvedElementaryTasks();
      expect(solved.length).toBeGreaterThanOrEqual(3);

      for (const task of solved) {
        expect(task.status).toBe('SOLVED');
        expect(task.category).toBe('elementary');
        expect(task.evaluatedInvariant).toBeDefined();
        expect(task.evaluatedInvariant.length).toBeGreaterThan(0);
        expect(task.axiomsUsed.length).toBeGreaterThanOrEqual(2);

        // Verify phase structure
        expect(task.phases.length).toBe(9); // -1, 0, 0.5, 1, 2, 3, 4, 5, 6
        const phaseNames = task.phases.map(p => p.phase);
        expect(phaseNames[0]).toContain('Phase -1');
        expect(phaseNames[1]).toContain('Phase 0');
        expect(phaseNames[2]).toContain('Phase 0.5');
        expect(phaseNames[3]).toContain('Phase 1');
        expect(phaseNames[4]).toContain('Phase 2');
        expect(phaseNames[5]).toContain('Phase 3');
        expect(phaseNames[6]).toContain('Phase 4');
        expect(phaseNames[7]).toContain('Phase 5');
        expect(phaseNames[8]).toContain('Phase 6');

        // All steps must be O(1)
        for (const phase of task.phases) {
          expect(phase.complexity).toBe('O(1)');
        }

        // Lean proof must be kernel verified and free of sorry
        expect(task.leanProof.kernelVerified).toBe(true);
        expect(task.leanProof.codeSnippet).not.toContain('sorry');
        expect(task.leanProof.fileRef).toBeDefined();
      }
    });

    it('resolves removable zero singularity f(x) = (x^2 - 4)/(x - 2) at x = 2 to invariant 4 in O(1)', () => {
      const task = engine.getTaskById('elem-removable-zero');
      expect(task).toBeDefined();
      expect(task?.status).toBe('SOLVED');
      if (task?.status === 'SOLVED') {
        expect(task.evaluatedInvariant).toBe('4');
        expect(task.axiomsUsed).toContain('A4_ZERO_RATIO');
        expect(task.axiomsUsed).toContain('SP2');
        expect(task.axiomsUsed).toContain('SP1_LOCALITY');
      }
    });

    it('resolves geometric bridge 0_5 * inf_3 to 15 in O(1) via Axiom A6', () => {
      const task = engine.getTaskById('elem-geometric-bridge-a6');
      expect(task).toBeDefined();
      expect(task?.status).toBe('SOLVED');
      if (task?.status === 'SOLVED') {
        expect(task.evaluatedInvariant).toBe('15');
        expect(task.axiomsUsed).toContain('A6_GEOMETRIC_BRIDGE');
      }
    });

    it('evaluates safe singularities dynamically with accurate phase trace', () => {
      const bridgeRes = engine.evaluateSafeSingularity('0_7 * inf_6');
      expect(bridgeRes.invariant).toBe('42');
      expect(bridgeRes.appliedAxiom).toBe('A6_GEOMETRIC_BRIDGE');
      expect(bridgeRes.phases.length).toBe(9);

      const ratioRes = engine.evaluateSafeSingularity('0_12 / 0_3');
      expect(ratioRes.invariant).toBe('4');
      expect(ratioRes.appliedAxiom).toBe('A4_ZERO_RATIO');
    });
  });

  /**
   * F-16 (HIGH, FABRICATED_KERNEL_REFERENCE): движок ссылался на ядровые теоремы, которых нет
   * ни в одном записанном прогоне (ricis_removable_singularity_eval, theta_skew_product_eval,
   * polar_kinematic_inversion_exact). Страж независим от текста ссылки: он берёт реестр фактов
   * прогона (артефакт → #print axioms) и требует, чтобы каждая ссылка движка там существовала.
   */
  describe('QA-LEAN-1: каждая ядровая ссылка движка существует в реестре прогонов (F-16)', () => {
    const registryPath = join(__dirname, '../../artifacts/proofs/core-checks/kernel-findings.json');
    const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as {
      readonly artifacts: readonly {
        readonly artifactId: string;
        readonly theorems: readonly { readonly name: string; readonly axioms: readonly string[] }[];
      }[];
    };

    it('не ссылается на выдуманное имя: artifactId + theoremName находятся в #print axioms', () => {
      let checked = 0;
      for (const task of engine.getResolvedElementaryTasks()) {
        const { fileRef, theoremName, axioms } = task.leanProof;
        const artifactId = fileRef.split('/').pop()?.replace(/\.lean$/u, '') ?? '';

        const fact = registry.artifacts.find((item) => item.artifactId === artifactId);
        expect(fact, `${task.taskId}: артефакт ${artifactId} отсутствует в реестре прогонов`).toBeDefined();

        const theorem = fact?.theorems.find((item) => item.name === theoremName);
        expect(
          theorem,
          `${task.taskId}: ${theoremName} не встречается в #print axioms артефакта ${artifactId} — ядровая ссылка выдумана`,
        ).toBeDefined();
        // Заявленные аксиомы обязаны совпадать с фактическим выводом ядра, а не с ожиданием автора.
        expect(theorem?.axioms ?? [], `${task.taskId}: ${theoremName}`).toEqual([...axioms]);
        expect(task.leanProof.kernelVerified, `${task.taskId}: ядровая ссылка без подтверждённого прогона`).toBe(true);
        checked += 1;
      }
      expect(checked).toBeGreaterThanOrEqual(3);
    });

    it('реестр прогонов содержит запись шаблона, на которую указывают ссылки (страховка от пустого реестра)', () => {
      const template = registry.artifacts.find((item) => item.artifactId === 'ricis-universal-orchestration-template');
      expect(template, 'реестр не содержит артефакт шаблона — страж был бы слепым').toBeDefined();
      expect(template?.theorems.map((item) => item.name)).toEqual(
        expect.arrayContaining([
          'RICIS_Template.divSelf_one',
          'RICIS_Template.A6_geometric_realization',
          'RICIS_Template.complex_divSelf_one',
        ]),
      );
    });
  });

  describe('2. Challenge Tasks: Honest Anti-Tukhta Classification & Model Routing', () => {
    it('classifies non-trivial open problems as UNRESOLVED_CHALLENGE without fake proofs', () => {
      const challenges = engine.getUnresolvedChallengeTasks();
      expect(challenges.length).toBeGreaterThanOrEqual(5);

      for (const task of challenges) {
        expect(task.status).toBe('UNRESOLVED_CHALLENGE');
        expect(task.category).toBe('challenge');
        // Must declare the attempting model version
        expect(task.modelAttempt).toBe('gemini-3.8-flash');
        // Must recommend next stronger model / experts
        expect(task.targetModelRecommended).toBeDefined();
        expect(task.targetModelRecommended.length).toBeGreaterThan(10);
        // Must explain the mathematical barrier preventing O(1) resolution
        expect(task.mathematicalBarrier).toBeDefined();
        expect(task.mathematicalBarrier.length).toBeGreaterThan(20);
        // Must document required higher-order monolith or missing Lean artifact
        expect(task.ricisMonolithRequirement).toBeDefined();
        expect(task.leanMissingArtifact).toBeDefined();
      }
    });

    it('explicitly documents Goldbach Conjecture (registry-101) barrier and model attribution', () => {
      const task = engine.getTaskById('registry-101');
      expect(task).toBeDefined();
      expect(task?.status).toBe('UNRESOLVED_CHALLENGE');
      if (task?.status === 'UNRESOLVED_CHALLENGE') {
        expect(task.modelAttempt).toBe('gemini-3.8-flash');
        expect(task.targetModelRecommended).toContain('gemini-1.5-pro');
        expect(task.mathematicalBarrier).toContain('мультипликативно-аддитивный монолит');
      }
    });

    it('explicitly documents Collatz Conjecture (registry-107) barrier and model attribution', () => {
      const task = engine.getTaskById('registry-107');
      expect(task).toBeDefined();
      expect(task?.status).toBe('UNRESOLVED_CHALLENGE');
      if (task?.status === 'UNRESOLVED_CHALLENGE') {
        expect(task.modelAttempt).toBe('gemini-3.8-flash');
        expect(task.mathematicalBarrier).toContain('дерево обратных предков');
      }
    });

    it('explicitly documents phys-unified continuum status as OPEN challenge', () => {
      const task = engine.getTaskById('phys-unified');
      expect(task).toBeDefined();
      expect(task?.status).toBe('UNRESOLVED_CHALLENGE');
      if (task?.status === 'UNRESOLVED_CHALLENGE') {
        expect(task.modelAttempt).toBe('gemini-3.8-flash');
        expect(task.mathematicalBarrier).toContain('Континуумное объединение квантовой механики и гравитации остается OPEN');
      }
    });
  });
});
