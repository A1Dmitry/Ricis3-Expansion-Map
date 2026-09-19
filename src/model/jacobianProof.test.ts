import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { initialMap } from './initialMap';

/** Запись прогона в цепочке реестра: текущая + предыдущая (priorCoreRun). */
interface RegistryRunRecord {
  readonly runId: number;
  readonly priorCoreRun?: RegistryRunRecord;
}

interface RegistryArtifact {
  readonly artifactId: string;
  readonly immutableSource: string;
  readonly sourceSha256: string;
  readonly outcome: string;
  readonly compilerExit: number;
  readonly theorems: readonly { readonly name: string; readonly axioms: readonly string[] }[];
  readonly successor?: { readonly artifactId: string; readonly runId: number };
}

interface KernelFindings {
  readonly registryVersion: string;
  readonly generatedFrom: RegistryRunRecord;
  readonly artifacts: readonly RegistryArtifact[];
}

function readRegistry(): KernelFindings {
  return JSON.parse(
    readFileSync('artifacts/proofs/core-checks/kernel-findings.json', 'utf8'),
  ) as KernelFindings;
}

/** Номера прогонов всей цепочки: текущий + priorCoreRun (реестр v4). */
function recordedRunIds(record: RegistryRunRecord): number[] {
  const ids: number[] = [];
  let cursor: RegistryRunRecord | undefined = record;
  while (cursor) {
    ids.push(cursor.runId);
    cursor = cursor.priorCoreRun;
  }
  return ids;
}

/**
 * QA Suite: Jacobian Conjecture Resolution
 *
 * F-01 (CRITICAL, зафиксирован прогоном ядра Lean 4.33.1, run 34870620154):
 * исходник `artifacts/proofs/ricis-jacobian-conjecture.standalone.lean` не является
 * валидным Lean-файлом (конструктор `partial` — зарезервированное слово Lean),
 * а центральное тождество производной с минимальным ремонтом не является
 * определительным (rfl failed → sorryAx). Основание `TRUSTED_AXIOM` отсутствует
 * ни в одной конфигурации.
 *
 * Решение владельца (2026-09-14, README `artifacts/proofs`): классификация
 * arтефактов — `STRUCTURALLY_VALIDATED` (структурная модель; не
 * MATHEMATICALLY_PROVEN). trustStatus метаданных понижен с `TRUSTED_AXIOM`;
 * этот QA-контракт обновлён соответствующим образом (QA-2, QA-4).
 *
 * ОСТАЁТСЯ ОТДЕЛЬНЫМ РЕШЕНИЕМ ВЛАДЕЛЬЦА (L9): запись узла `registry-120`
 * в `src/model/initialMap.ts`. Решение владельца (unblock-l9, 2026-09-18): узел
 * понижен с `TRUSTED_AXIOM` до `STRUCTURALLY_VALIDATED`, в согласии с уже
 * принятой классификацией артефакта (F-01, owner decision 2026-09-14). QA-3
 * ниже проверяет ИТОГОВОЕ состояние узла (см. F-01/F-05/TPS-0006).
 */
describe('QA Suite: Jacobian Conjecture Resolution', () => {
  it('QA-1: verifies the existence of the Lean 4 Jacobian proof file', () => {
    const leanPath = 'artifacts/proofs/ricis-jacobian-conjecture.standalone.lean';
    expect(existsSync(leanPath)).toBe(true);

    const content = readFileSync(leanPath, 'utf8');
    expect(content).toContain('namespace RICIS_Jacobian');
    expect(content).toContain('def ricisResolve');
    expect(content).toContain('theorem Jacobian_singularity_resolved');
  });

  it('QA-2: verifies the Jacobian metadata JSON is valid and trust status is STRUCTURALLY_VALIDATED (F-01, owner decision)', () => {
    const jsonPath = 'artifacts/proofs/ricis-jacobian-conjecture.json';
    expect(existsSync(jsonPath)).toBe(true);

    const raw = readFileSync(jsonPath, 'utf8');
    const metadata = JSON.parse(raw);
    expect(metadata.claim).toContain('Jacobian_singularity_resolved');
    // Понижен с TRUSTED_AXIOM решением владельца (2026-09-14): ядрового основания нет
    // (исходник не парсится; rfl failed в производной, run 34870620154).
    expect(metadata.verification.trustStatus).toBe('STRUCTURALLY_VALIDATED');
    expect(metadata.verification.contentHash).toBe('2e043f2738df8d8b02754aebb5fa93580fb87e6cc71733557c620c463c4de56b');
  });

  it('QA-3: verifies the Jacobian node is registered with structurally-validated proofs in initialMap (owner decision L9 / unblock-l9, 2026-09-18)', () => {
    const node = initialMap.nodes.find(n => n.id === 'registry-120');
    expect(node).toBeDefined();

    const proof = initialMap.proofs['registry-120'];
    expect(proof).toBeDefined();
    expect(proof.externalLean).toBeDefined();
    expect(proof.externalLean?.trustStatus).toBe('STRUCTURALLY_VALIDATED');
    expect(proof.externalLean?.sourceHash).toBe('2e043f2738df8d8b02754aebb5fa93580fb87e6cc71733557c620c463c4de56b');
  });

  it('QA-4: the kernel-run evidence is recorded outside the immutable source and matches the facts registry', () => {
    const jsonPath = 'artifacts/proofs/ricis-jacobian-conjecture.json';
    const metadata = JSON.parse(readFileSync(jsonPath, 'utf8'));
    const kernelCheck = metadata.kernelCheck;
    expect(kernelCheck, 'F-01: kernelCheck-блок обязателен после прогона ядра').toBeDefined();

    // Статус записан снаружи исходника: фактический исход прогона, а не заявленный.
    expect(kernelCheck.statusAfterKernelRun).toBe('NOT_VERIFIED_CORE_ONLY');
    expect(kernelCheck.compilerExit).toBe(1);
    expect(kernelCheck.rootCause.length).toBeGreaterThan(40);

    // Машиночитаемый реестр фактов существует и содержит запись артефакта.
    // Реестр v4 (прогон 35404189840, цепочка priorCoreRun) больше не выводит
    // generatedFrom из записи v1: запись v1 зафиксирована прогоном 34891262489,
    // который теперь лежит в ЦЕПОЧКЕ прогонов, поэтому проверяется принадлежность
    // цепочке, а не равенство текущему прогону.
    const registry = readRegistry();
    const chain = recordedRunIds(registry.generatedFrom);
    expect(chain).toContain(kernelCheck.run);
    expect(chain[0]).toBe(registry.generatedFrom.runId);
    expect(chain.length).toBeGreaterThan(1);

    const entry = registry.artifacts.find((item) => item.artifactId === 'ricis-jacobian-conjecture');
    expect(entry, 'реестр фактов не содержит запись jacobian-артефакта').toBeDefined();
    expect(entry?.outcome).toBe(kernelCheck.statusAfterKernelRun);
    expect(entry?.compilerExit).toBe(kernelCheck.compilerExit);
    expect(entry?.sourceSha256).toBe(metadata.verification.contentHash);
  });

  it('QA-5: F-01 закрыт со стороны факта — у v1 есть зарегистрированный преемник, v2 принят ядром', () => {
    const registry = readRegistry();
    const v1 = registry.artifacts.find((item) => item.artifactId === 'ricis-jacobian-conjecture');
    const v2 = registry.artifacts.find((item) => item.artifactId === 'ricis-jacobian-conjecture-v2');
    expect(v1?.successor?.artifactId, 'реестр обязан связывать v1 с преемником').toBe(
      'ricis-jacobian-conjecture-v2',
    );
    expect(v2, 'реестр обязан содержать запись v2').toBeDefined();
    expect(v2?.outcome).toBe('LEAN_VERIFIED');
    expect(v2?.compilerExit).toBe(0);
    expect(v1?.successor?.runId).toBe(v2 && registry.generatedFrom.runId);

    // Байты v1 не изменены (§7): преемник не переписывает исходник — он его опровергает.
    expect(v1?.immutableSource).toBe('artifacts/proofs/ricis-jacobian-conjecture.standalone.lean');
    expect(v1?.sourceSha256).toBe('2e043f2738df8d8b02754aebb5fa93580fb87e6cc71733557c620c463c4de56b');

    const theoremNames = (v2?.theorems ?? []).map((theorem) => theorem.name);
    expect(theoremNames).toContain('RICIS_Jacobian.jacobian_v1_identity_refuted');
    expect(theoremNames).toContain('RICIS_Jacobian.Jacobian_singularity_resolved');
    expect((v2?.theorems ?? []).every((theorem) => !theorem.axioms.includes('sorryAx'))).toBe(true);
    expect((v2?.theorems ?? []).length).toBeGreaterThanOrEqual(8);

    // Метаданные v2 фиксируют тот же прогон и статус, что и реестр.
    const v2Metadata = JSON.parse(readFileSync('artifacts/proofs/ricis-jacobian-conjecture-v2.json', 'utf8'));
    expect(v2Metadata.kernelCheck.run).toBe(registry.generatedFrom.runId);
    expect(v2Metadata.kernelCheck.statusAfterKernelRun).toBe(v2?.outcome);
    expect(v2Metadata.kernelCheck.immutableSourceSha256).toBe(v2?.sourceSha256);
  });
});
