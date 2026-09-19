import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { initialMap } from './initialMap';
import {
  NODE_CLAIM_ORCHESTRATION_BY_ID,
  NODE_CLAIM_ORCHESTRATION_PLAN,
  ORCHESTRATION_LEAN_SPEC_DOI,
  REFERENCE_ORCHESTRATED_NODE_IDS,
  buildInformalExternalClaim,
  buildNodeDescription,
  orchestrateNodeClaim,
} from './nodeClaimOrchestration';
import {
  INITIAL_MAP_PATH,
  MARKER_CLOSE,
  MARKER_OPEN,
  PROOF_MARKER_CLOSE,
  PROOF_MARKER_OPEN,
  renderInitialMap,
} from '../../scripts/applyNodeClaimOrchestration';

/**
 * QA Suite: NODE-CLAIM-ORCHESTRATION (AGENTS.md §13, план
 * `src/model/nodeClaimOrchestration.ts`).
 *
 * Контракт: утверждение узла карты ОТДЕЛИМО от внешней задачи. Узел, чей предмет —
 * открытая внешняя задача, не может быть `resolved`; его формулировка обязана
 * называть только то, что подтверждено применимым evidence, а внешняя задача —
 * лежать в `informalExternalClaim` с префиксом `INFORMAL:`.
 *
 * Стражи ниже держат этот контракт машинно: план, дерево `initialMap.ts`, записи
 * доказательств и реестр фактов ядрового прогона обязаны совпадать. Дрейф ловится
 * `npm run tps:nodes:check` (побайтовая регенерация дерева из плана).
 */

const REGISTRY_PATH = 'artifacts/proofs/core-checks/kernel-findings.json';

interface RegistryRunRecord {
  readonly runId: number;
  readonly priorCoreRun?: RegistryRunRecord;
}

interface RegistryArtifact {
  readonly artifactId: string;
  readonly outcome: string;
  readonly theorems: readonly { readonly name: string }[];
}

interface RegistryMathlibRun extends RegistryRunRecord {
  readonly priorMathlibRun?: RegistryRunRecord;
}

interface KernelFindings {
  readonly registryVersion: string;
  readonly generatedFrom: RegistryRunRecord;
  readonly mathlibRun?: RegistryMathlibRun;
  readonly artifacts: readonly RegistryArtifact[];
}

function readRegistry(): KernelFindings {
  return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as KernelFindings;
}

/** Номера прогонов цепочки: текущий + priorCoreRun (реестр v4). */
function coreRunChain(record: RegistryRunRecord): number[] {
  const ids: number[] = [];
  let cursor: RegistryRunRecord | undefined = record;
  while (cursor) {
    ids.push(cursor.runId);
    cursor = cursor.priorCoreRun;
  }
  return ids;
}

/** Номера прогонов Mathlib-цепочки: mathlibRun + priorMathlibRun. */
function mathlibRunChain(record: RegistryMathlibRun): number[] {
  const ids: number[] = [];
  let cursor: RegistryMathlibRun | undefined = record;
  while (cursor) {
    ids.push(cursor.runId);
    cursor = cursor.priorMathlibRun;
  }
  return ids;
}

const PLAN_IDS = NODE_CLAIM_ORCHESTRATION_PLAN.map((entry) => entry.nodeId);
const nodeById = new Map(initialMap.nodes.map((node) => [node.id, node]));

describe('QA Suite: NODE-CLAIM-ORCHESTRATION', () => {
  it('NODE-1: план — единственный источник для управляемых узлов (реестровые + декомпозиция задач)', () => {
    expect(PLAN_IDS.length).toBe(27);
    expect(new Set(PLAN_IDS).size).toBe(PLAN_IDS.length);
    expect(PLAN_IDS.filter((id) => id.startsWith('registry-')).length).toBe(20);
    expect(PLAN_IDS.filter((id) => id.startsWith('task-')).length).toBe(7);
    expect(NODE_CLAIM_ORCHESTRATION_BY_ID.size).toBe(PLAN_IDS.length);

    for (const id of PLAN_IDS) {
      expect(nodeById.get(id), `${id} отсутствует в дереве карты`).toBeDefined();
      expect(initialMap.proofs[id], `${id}: запись доказательства обязана существовать`).toBeDefined();
    }
    // Эталонные узлы (уже отработанные тактом TASK-05) в план не входят — они держатся
    // отдельным перечнем, чтобы план не переписывал чужие решения.
    for (const id of REFERENCE_ORCHESTRATED_NODE_IDS) {
      expect(PLAN_IDS).not.toContain(id);
    }
  });

  it('NODE-2: дерево сгенерировано из плана, а не правилось руками (маркеры регионов + нулевой дрейф)', () => {
    const source = readFileSync(INITIAL_MAP_PATH, 'utf8');
    for (const id of PLAN_IDS) {
      expect(source, `${id}: нет маркера узла`).toContain(`${MARKER_OPEN}${id}`);
      expect(source, `${id}: нет закрывающего маркера узла`).toContain(`${MARKER_CLOSE}${id}`);
      expect(source, `${id}: нет маркера записи доказательства`).toContain(`${PROOF_MARKER_OPEN}${id}`);
      expect(source, `${id}: нет закрывающего маркера записи доказательства`).toContain(`${PROOF_MARKER_CLOSE}${id}`);
    }
    // Побайтовая регенерация: любая ручная правка управляемого региона роняет этот страж
    // (и `npm run tps:nodes:check`) до тех пор, пока план не приведён в соответствие.
    expect(renderInitialMap(source)).toBe(source);
  });

  it('NODE-3: класс заявления определяет состояние узла (partial для открытых задач, resolved только по evidence)', () => {
    for (const entry of NODE_CLAIM_ORCHESTRATION_PLAN) {
      const node = nodeById.get(entry.nodeId);
      expect(node?.state, `${entry.nodeId}: состояние узла`).toBe(entry.outcome.state);
      expect(node?.ricisSolvable, `${entry.nodeId}: ricisSolvable`).toBe(entry.outcome.ricisSolvable);
      expect(node?.title).toBe(entry.title);
      expect(node?.description).toBe(buildNodeDescription(entry));

      if (entry.externalProblem) {
        expect(node?.informalExternalClaim, `${entry.nodeId}: внешняя задача обязана жить в INFORMAL-поле`).toBe(
          buildInformalExternalClaim(entry),
        );
        expect(node?.informalExternalClaim?.startsWith('INFORMAL:')).toBe(true);
      } else {
        expect(node?.informalExternalClaim).toBeUndefined();
      }

      if (entry.claimClass === 'OPEN_EXTERNAL_PROBLEM' || entry.claimClass === 'CONTRACT_SPECIFICATION') {
        expect(node?.state, `${entry.nodeId}: открытая внешняя задача не может быть resolved`).toBe('partial');
        expect(node?.ricisSolvable).toBe(false);
      }
      if (entry.claimClass === 'KERNEL_BACKED_STRUCTURAL') {
        expect(node?.state, `${entry.nodeId}: структурное ядровое утверждение — resolved`).toBe('resolved');
        expect(node?.ricisSolvable).toBe(true);
      }
    }
    // Пересчёт по классам: правило выше не должно «протекать» — иначе страж проходит вхолостую.
    const partial = NODE_CLAIM_ORCHESTRATION_PLAN.filter((entry) => entry.outcome.state === 'partial');
    const resolved = NODE_CLAIM_ORCHESTRATION_PLAN.filter((entry) => entry.outcome.state === 'resolved');
    expect(partial.length).toBe(23);
    expect(resolved.length).toBe(4);
    expect(partial.every((entry) => entry.externalProblem !== undefined)).toBe(true);
  });

  it('NODE-4: утверждение узла отделено от внешней задачи (никаких утвердительных заявлений о ней)', () => {
    for (const entry of NODE_CLAIM_ORCHESTRATION_PLAN) {
      const node = nodeById.get(entry.nodeId);
      const proof = initialMap.proofs[entry.nodeId];
      expect(proof, `${entry.nodeId}: запись доказательства`).toBeDefined();
      expect(proof?.latex).toContain('RICIS-III Proof');
      expect(proof?.latex).toContain(ORCHESTRATION_LEAN_SPEC_DOI);
      expect(proof?.steps.length).toBeGreaterThanOrEqual(5);
      expect(proof?.targetFunction).toBe(entry.structuralStatement);

      if (!entry.externalProblem) continue;
      // Описание обязано содержать границу заявления дословно, а не «аккуратный пересказ».
      expect(node?.description).toContain('ЧТО НЕ УТВЕРЖДАЕТСЯ:');
      expect(node?.description).toContain(entry.boundaryText);
      // Заголовок LaTeX-документа не называет внешнюю задачу: прежняя формула
      // «RICIS-III Proof: <открытая задача>» читалась как доказательство этой задачи.
      const latexSeparator = '\\n';
      const titleEnd = proof?.latex.indexOf(latexSeparator) ?? -1;
      expect(titleEnd, `${entry.nodeId}: в LaTeX-записи нет разделителя строк`).toBeGreaterThan(0);
      const sectionTitle = proof?.latex.slice(0, titleEnd) ?? '';
      expect(sectionTitle.startsWith('\\section*{RICIS-III Proof:')).toBe(true);
      expect(sectionTitle).not.toContain(entry.externalProblem);
      // Итог записи прямо говорит, что внешний предмет не решён.
      expect(proof?.finalResult).toContain('не решён');
      expect(proof?.finalResult).toContain('не заявляется');
    }
  });

  it('NODE-5: ядровые ссылки плана существуют в реестре и принадлежат цепочке прогонов (класс F-16)', () => {
    const registry = readRegistry();
    expect(registry.registryVersion).toBe('4');
    const chain = coreRunChain(registry.generatedFrom);
    const mathlibChain = registry.mathlibRun ? mathlibRunChain(registry.mathlibRun) : [];

    let kernelBacked = 0;
    for (const entry of NODE_CLAIM_ORCHESTRATION_PLAN) {
      const evidence = entry.evidence;
      if (evidence.kind !== 'KERNEL_RUN') continue;
      kernelBacked += 1;
      const artifact = registry.artifacts.find((item) => item.artifactId === evidence.artifactId);
      expect(artifact, `${entry.nodeId}: артефакт ${evidence.artifactId} отсутствует в реестре фактов`).toBeDefined();
      // Имена в реестре квалифицированы пространством имён (`RICIS_Jacobian.…`), в плане —
      // короткие имена шаблона; сравнение идёт по последнему сегменту, как в `#print axioms`.
      expect(
        artifact?.theorems.some(
          (theorem) =>
            theorem.name === evidence.theorem || theorem.name.endsWith(`.${evidence.theorem}`),
        ),
        `${entry.nodeId}: теорема ${evidence.theorem} не подтверждена выводом #print axioms`,
      ).toBe(true);
      expect(artifact?.outcome).toBe('LEAN_VERIFIED');
      expect([...chain, ...mathlibChain], `${entry.nodeId}: прогон ${evidence.run} вне цепочки реестра`).toContain(
        evidence.run,
      );
    }
    // Ядровой носитель обязан быть у большинства управляемых узлов: иначе план выродился бы
    // в перечень контрактов и перестал бы отделять подтверждённое от заявленного.
    expect(kernelBacked).toBeGreaterThanOrEqual(17);
  });

  it('NODE-6: инженерная проверка узла ссылается на существующие модуль и тест (не на «ядро»)', () => {
    const engineEntries = NODE_CLAIM_ORCHESTRATION_PLAN.filter((entry) => entry.evidence.kind === 'REPO_TEST_RUN');
    expect(engineEntries.length).toBeGreaterThanOrEqual(1);

    for (const entry of engineEntries) {
      const evidence = entry.evidence;
      expect(entry.claimClass).toBe('ENGINE_EVIDENCE');
      expect(existsSync(evidence.modulePath ?? ''), `${entry.nodeId}: модуль ${evidence.modulePath} не найден`).toBe(true);
      expect(existsSync(evidence.testPath ?? ''), `${entry.nodeId}: тест ${evidence.testPath} не найден`).toBe(true);
      const proof = initialMap.proofs[entry.nodeId];
      expect(proof?.finalResult).toContain('НЕ ядровое доказательство');
      expect(proof?.latex).toContain('прогон тестов репозитория');
    }
  });

  it('NODE-7: запись доказательства показывает все пять стадий оркестрации и решение E-03', () => {
    const expectedStages = [
      'PARSING_AND_L1_CHECK',
      'AXIOMATIC_REDUCTION',
      'LEAN_CODEGEN',
      'GATEWAY_DISPATCH',
      'TRUST_VALIDATION',
    ];
    for (const entry of NODE_CLAIM_ORCHESTRATION_PLAN) {
      const run = orchestrateNodeClaim(entry);
      expect(run.stages.map((stage) => stage.stage)).toEqual(expectedStages);
      for (const stage of run.stages) {
        expect(stage.note.length, `${entry.nodeId}/${stage.stage}: пустая нота стадии`).toBeGreaterThan(20);
      }
      // Контракт и инженерная проверка не могут «дойти до ядра»: стадия отправки в ядро
      // обязана честно сообщать об отсутствии носителя.
      if (entry.evidence.kind === 'CONTRACT_ONLY') {
        expect(run.stages.find((stage) => stage.stage === 'GATEWAY_DISPATCH')?.status).toBe('NO_KERNEL_EVIDENCE');
      }
      if (entry.evidence.kind === 'REPO_TEST_RUN') {
        expect(run.stages.find((stage) => stage.stage === 'GATEWAY_DISPATCH')?.status).toBe('REPO_TEST_ONLY');
      }
      const proof = initialMap.proofs[entry.nodeId];
      const stepNames = (proof?.steps ?? []).map((step) => step.name).join(' | ');
      expect(stepNames).toContain('TRUST_VALIDATION (E-03)');
      expect(proof?.steps.map((step) => step.phase)).toEqual([-1, 0.5, 2, 4, 6]);
    }
  });

  it('NODE-8: эталонные узлы TASK-05 держат тот же контракт (partial + INFORMAL)', () => {
    for (const nodeId of REFERENCE_ORCHESTRATED_NODE_IDS) {
      const node = nodeById.get(nodeId);
      expect(node, `${nodeId} отсутствует в дереве`).toBeDefined();
      expect(node?.state, `${nodeId}: внешняя задача не может быть resolved`).toBe('partial');
      expect(node?.informalExternalClaim?.startsWith('INFORMAL')).toBe(true);
      const proof = initialMap.proofs[nodeId];
      expect(proof, `${nodeId}: запись доказательства`).toBeDefined();
      expect(proof?.latex).toContain(ORCHESTRATION_LEAN_SPEC_DOI);
    }
  });
});
