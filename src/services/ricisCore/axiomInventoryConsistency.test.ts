/**
 * Страж состава аксиоматики: списки идентификаторов в слоях верификации
 * производятся из канонической таблицы зерна, а не копируются вручную.
 *
 * Основание (андон A-0014, такт 2026-09-18): `RicisFallbackEngine.verifyProofChain`
 * держал собственную копию списка (`new Set(['L0','L1','L1C1','L1C2','SP1',…,'A3',…,'TCP'])`).
 * Факты, измеренные прогоном ДО ремонта:
 *   - шаг с обоснованием `A3` (снята в v7.7/v7.9) → `valid: true` (доверие к снятой аксиоме);
 *   - шаги с обоснованием `L1C3`, `SP5`, `P1`, `A11` (активное зерно, все четыре —
 *     защищённое ядро `PROTECTED_CORE_IDS`) → `valid: false`, «Неизвестная или некорректная аксиома».
 *
 * Отдельно (исправление записи этого же такта): `L1C4` в ложном отклонении НЕ участвовала —
 * строки в таблице зерна у неё нет по замыслу (`protected_core_derived` в
 * `scripts/generateSeedExpansionSpec.ts`: выводимая гарантия `A11 + L1`, обеспечивается
 * воротами `MONOTONIC_COMMIT`), поэтому её отклонение корректно и закреплено тестом ниже.
 * Класс тот же, что A-0013: метка без действительного основания проходила проверку,
 * а действительное основание отклонялось.
 *
 * Тесты — стражи класса, а не иллюстрация: sweep идёт по ЖИВОЙ таблице зерна,
 * поэтому новая аксиома без согласованного списка краснит прогон, а не проходит молча.
 *
 * AUDITOR: SELF (same-pipeline).
 */

import { describe, expect, it } from 'vitest';
import { RicisFallbackEngine, FALLBACK_ENGINE_PROTOCOL_MARKERS } from './RicisFallbackEngine';
import type { RicisFormalProof } from './IRicisCoreEngine';
import {
  ACTIVE_SEED_AXIOM_IDS,
  DEPRECATED_SEED_AXIOM_IDS,
  SEED_AXIOM_TABLE,
  seedAxiomDeprecationInconsistencies,
} from '../../ricisSeed/seedTable';
import { DEPRECATED_AXIOM_IDS, PROTECTED_CORE_IDS } from '../../ricisSeed/contracts';

const engine = new RicisFallbackEngine();

async function proofWithJustification(axiom: string): Promise<RicisFormalProof> {
  const base = await engine.generateFormalProof('0_4 * inf_4', 'geometric_bridge');
  return {
    ...base,
    steps: base.steps.map((step, index) => (index === 0 ? { ...step, justificationAxiom: axiom } : step)),
  };
}

describe('Состав аксиоматики: единый канонический источник (A-0014)', () => {
  it('два представления «снятости» согласованы: таблица зерна и DEPRECATED_AXIOM_IDS', () => {
    expect(seedAxiomDeprecationInconsistencies()).toEqual([]);
    // Страж не может быть слепым: снятая запись в таблице обязана существовать.
    expect(DEPRECATED_SEED_AXIOM_IDS.length).toBeGreaterThan(0);
    for (const id of DEPRECATED_SEED_AXIOM_IDS) {
      expect(DEPRECATED_AXIOM_IDS).toContain(id);
    }
  });

  it('активное зерно и снятые записи не пересекаются', () => {
    const active = new Set<string>(ACTIVE_SEED_AXIOM_IDS);
    for (const id of DEPRECATED_AXIOM_IDS) {
      expect(active.has(id), `${id} не может быть одновременно активной и снятой`).toBe(false);
    }
    expect(ACTIVE_SEED_AXIOM_IDS.length).toBe(SEED_AXIOM_TABLE.length - DEPRECATED_SEED_AXIOM_IDS.length);
  });

  it('sweep: каждая активная аксиома зерна принимается верификатором движения доказательства', async () => {
    expect(ACTIVE_SEED_AXIOM_IDS.length).toBeGreaterThanOrEqual(20); // sweep по живому реестру, не по примеру

    for (const axiom of ACTIVE_SEED_AXIOM_IDS) {
      const verification = await engine.verifyProofChain(await proofWithJustification(axiom));
      expect(verification.valid, `${axiom} принадлежит активному ядру R0 и обязана приниматься: ${verification.reason ?? ''}`).toBe(true);
    }
  });

  it('защищённое ядро целиком признаётся верификатором (L1C3/SP5/P1/A11 раньше отклонялись)', async () => {
    for (const axiom of PROTECTED_CORE_IDS) {
      const verification = await engine.verifyProofChain(await proofWithJustification(axiom));
      expect(verification.valid, `${axiom} — защищённое ядро: ${verification.reason ?? ''}`).toBe(true);
    }
  });

  it('снятая аксиома отклоняется с отдельной причиной (не «неизвестная метка»)', async () => {
    for (const axiom of DEPRECATED_AXIOM_IDS) {
      const verification = await engine.verifyProofChain(await proofWithJustification(axiom));
      expect(verification.valid, `${axiom} снята и не может обосновывать шаг`).toBe(false);
      expect(verification.reason, axiom).toContain('снята');
    }
  });

  it('выдуманная метка по-прежнему отклоняется (сторона отказа сохранена)', async () => {
    const verification = await engine.verifyProofChain(await proofWithJustification('A999'));
    expect(verification.valid).toBe(false);
    expect(verification.reason).toContain('Неизвестная или некорректная аксиома');
  });

  it('протокольные метки движка объявлены явно и не маскируются под аксиомы зерна', () => {
    expect(FALLBACK_ENGINE_PROTOCOL_MARKERS).toEqual(['TCP']);
    for (const marker of FALLBACK_ENGINE_PROTOCOL_MARKERS) {
      expect(ACTIVE_SEED_AXIOM_IDS as readonly string[]).not.toContain(marker);
    }
  });

  it('генерируемое движком доказательство по-прежнему верифицируется (эталон зелёный до мутации)', async () => {
    const proof = await engine.generateFormalProof('0_4 * inf_4', 'geometric_bridge');
    const verification = await engine.verifyProofChain(proof);
    expect(verification.valid).toBe(true);
    expect(verification.verifiedAxioms).toContain('A6');
  });

  it('L1C4 не является строкой зерна: её отклонение корректно и закреплено (исправление записи этого такта)', async () => {
    // `L1C4` объявлена в типе `LawId` и называется в документах, но строки в таблице зерна
    // у неё нет намеренно: scripts/generateSeedExpansionSpec.ts выносит её в
    // protected_core_derived — «выводимая гарантия A11 + L1, обеспечивается воротами
    // MONOTONIC_COMMIT», а не отдельная аксиома R0. Значит верификатор обязан её отклонять:
    // обосновать шаг правилом, которого нет в активном ядре, нельзя.
    expect(ACTIVE_SEED_AXIOM_IDS as readonly string[]).not.toContain('L1C4');
    expect(PROTECTED_CORE_IDS as readonly string[]).not.toContain('L1C4');
    expect(SEED_AXIOM_TABLE.some(entry => entry.id === 'L1C4')).toBe(false);

    const verification = await engine.verifyProofChain(await proofWithJustification('L1C4'));
    expect(verification.valid).toBe(false);
    expect(verification.reason).toContain('Неизвестная или некорректная аксиома');
  });
});
