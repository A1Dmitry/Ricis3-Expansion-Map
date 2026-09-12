import { describe, expect, it } from 'vitest';
import { createRicisSystem } from './ricisSeed.domain';
import { axiomFromDefinition, createSeed, createSeedAxioms, findAxiom } from './ricisSeed.domain';
import { DEMO_RESOLVERS } from './ricisSeed.unsolvedRegistry';
import type { CandidateAxiom, RicisState } from './contracts';
import { axiomFingerprint, canonicalize, fnv1a64Hex, seedFingerprint } from './fingerprint';
import { SEED_AXIOM_TABLE } from './seedTable';
import { DEPRECATED_AXIOM_IDS, PROTECTED_CORE_IDS } from './contracts';

const Ric = createRicisSystem({ resolvers: DEMO_RESOLVERS });

describe('RICIS SEED — контракты зерна', () => {
  it('содержит все законы, протоколы SP1–SP5, запрет P1, аксиомы A1–A10 и мета-аксиому A11', () => {
    const expectedIds = [
      'L0', 'L1', 'L1C1', 'L1C2', 'L1C3',
      'SP1', 'SP2', 'SP3', 'SP4', 'SP5',
      'P1',
      'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10',
      'A11',
    ];
    expect(SEED_AXIOM_TABLE.map(entry => entry.id)).toEqual(expectedIds);
  });

  it('не включает снятые аксиомы в активное зерно R0, но сохраняет их как историю (v7.9: A3 removed)', () => {
    const active = createSeedAxioms().map(axiom => axiom.id);
    expect(active).not.toContain('A3');
    expect(SEED_AXIOM_TABLE.find(entry => entry.id === 'A3')?.deprecated).toBe(true);
    expect(DEPRECATED_AXIOM_IDS).toContain('A3');
  });

  it('помечает A11 как мета-аксиому, а не как одиннадцатую математическую аксиому', () => {
    const a11 = SEED_AXIOM_TABLE.find(entry => entry.id === 'A11');
    expect(a11?.layer).toBe('META_AXIOM');
    for (const id of ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']) {
      expect(SEED_AXIOM_TABLE.find(entry => entry.id === id)?.layer).toBe('AXIOM');
    }
  });

  it('держит защищённое ядро (законы, SP1–SP5, P1, A11) в явном списке', () => {
    expect([...PROTECTED_CORE_IDS].sort()).toEqual(
      ['A11', 'L0', 'L1', 'L1C1', 'L1C2', 'L1C3', 'P1', 'SP1', 'SP2', 'SP3', 'SP4', 'SP5'].sort(),
    );
  });

  it('не даёт расширению переопределить ни один элемент защищённого ядра', () => {
    for (const id of PROTECTED_CORE_IDS) {
      const candidate: CandidateAxiom = Object.freeze({
        id,
        layer: 'AXIOM',
        statement: 'X = 1',
        covers: [] as const,
        consequences: [] as const,
      });
      const result = Ric.ExpandTo((x: RicisState) => ({
        kind: 'RESOLVED',
        resolution: {
          problem: Object.freeze({
            id: `U-REDEFINE-${id}`,
            statement: 'X',
            inputForm: 'X',
            singularityClasses: ['ZERO_OVER_ZERO'] as const,
            coverageClaim: ['L1'] as const,
          }),
          candidate,
          proof: Object.freeze({
            strategy: 'RICIS_STRUCTURAL',
            steps: [Object.freeze({ rule: 'L1', from: 'X', to: '1' })] as const,
            conclusion: '1',
            usesLimits: false,
            usesNumericApproximation: false,
          }),
        },
      }));
      expect(result.kind, id).toBe('REJECTED');
      if (result.kind !== 'REJECTED') continue;
      expect(result.reason, id).toBe('PROTECTED_CORE_MUTATION');
    }
  });

  it('даёт каждой аксиоме зерна уникальный и детерминированный отпечаток', () => {
    const fingerprints = createSeedAxioms().map(axiom => axiom.fingerprint);
    expect(new Set(fingerprints).size).toBe(fingerprints.length);
    const again = createSeedAxioms().map(axiom => axiom.fingerprint);
    expect(again).toEqual(fingerprints);
  });

  it('не считает происхождение и доказательство частью математического содержания аксиомы', () => {
    const seedAxiom = axiomFromDefinition(SEED_AXIOM_TABLE.find(entry => entry.id === 'A4')!);
    const expandedTwin = {
      ...seedAxiom,
      origin: 'EXPANSION' as const,
      solvedProblemId: 'U-SOME-PROBLEM',
    };
    expect(axiomFingerprint({
      id: expandedTwin.id,
      layer: expandedTwin.layer,
      statement: expandedTwin.statement,
      covers: expandedTwin.covers,
      consequences: expandedTwin.consequences,
    })).toBe(seedAxiom.fingerprint);
  });

  it('стабильно вычисляет отпечаток при перестановке полей объекта', () => {
    expect(canonicalize({ a: 1, b: [1, 2, { x: 'y', z: null }] })).toBe(canonicalize({ b: [1, 2, { z: null, x: 'y' }], a: 1 }));
    expect(fnv1a64Hex('RICIS')).toHaveLength(16);
    expect(fnv1a64Hex('RICIS')).toBe(fnv1a64Hex('RICIS'));
    expect(fnv1a64Hex('RICIS')).not.toBe(fnv1a64Hex('RICISS'));
    expect(seedFingerprint(0, ['b', 'a'])).toBe(seedFingerprint(0, ['a', 'b']));
    expect(seedFingerprint(0, ['a'])).not.toBe(seedFingerprint(1, ['a']));
  });

  it('стартует с поколения 0, пустого журнала и воспроизводимого отпечатка', () => {
    const first = createSeed();
    const second = createSeed();
    expect(first.generation).toBe(0);
    expect(first.ledger).toHaveLength(0);
    expect(first.fingerprint).toBe(second.fingerprint);
    expect(first.fingerprint.startsWith('seed-v1:')).toBe(true);
    expect(findAxiom(first, 'A11')?.layer).toBe('META_AXIOM');
  });
});
