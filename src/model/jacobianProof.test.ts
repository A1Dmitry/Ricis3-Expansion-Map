import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { initialMap } from './initialMap';

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

    // Машиночитаемый реестр фактов существует, ссылается на тот же run
    // и содержит запись артефакта.
    const registry = JSON.parse(
      readFileSync('artifacts/proofs/core-checks/kernel-findings.json', 'utf8'),
    );
    expect(kernelCheck.run).toBe(registry.generatedFrom.runId);
    const entry = registry.artifacts.find((item: { artifactId: string }) => item.artifactId === 'ricis-jacobian-conjecture');
    expect(entry, 'реестр фактов не содержит запись jacobian-артефакта').toBeDefined();
    expect(entry.outcome).toBe(kernelCheck.statusAfterKernelRun);
  });
});
