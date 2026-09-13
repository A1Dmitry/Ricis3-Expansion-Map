/**
 * RICIS SEED — долговременный граф знаний доказательств (Persistent Knowledge Graph)
 * и атомарный механизм фиксации поколений (Atomic Persistent Commit).
 *
 * Принцип:
 *   - RAM — это рабочий кэш;
 *   - Долговременное хранение сериализует и восстанавливает поколения R_0...R_n;
 *   - Недоказанное или отклонённое расширение НЕ продвигает поколение и не коммитится;
 *   - Инвариант R(n+1) ⊇ R(n) (L1C4) сохраняется при перезапусках процесса.
 */

import type {
  AxiomFingerprint,
  RicisAxiom,
  RicisSeedState,
  ExpansionRecord,
  SeedFingerprint,
} from './contracts';
import { verifySeedInvariants } from './ricisSeed.domain';

export interface SerializedSeedState {
  readonly version: '1.0';
  readonly generation: number;
  readonly fingerprint: SeedFingerprint;
  readonly axioms: readonly RicisAxiom[];
  readonly ledger: readonly ExpansionRecord[];
}

/**
 * Сериализует состояние зерна RICIS в детерминированный канонический JSON.
 */
export function serializeSeedStateToJson(seed: RicisSeedState): string {
  const payload: SerializedSeedState = {
    version: '1.0',
    generation: seed.generation,
    fingerprint: seed.fingerprint,
    axioms: seed.axioms,
    ledger: seed.ledger,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Восстанавливает состояние зерна RICIS из канонического JSON с проверкой инвариантов.
 */
export function deserializeSeedStateFromJson(json: string): RicisSeedState {
  const parsed = JSON.parse(json) as SerializedSeedState;
  if (!parsed || parsed.version !== '1.0' || typeof parsed.generation !== 'number') {
    throw new Error('Некорректный формат сериализованного состояния RICIS Seed');
  }

  const state: RicisSeedState = Object.freeze({
    generation: parsed.generation,
    fingerprint: parsed.fingerprint,
    axioms: Object.freeze(parsed.axioms.map(a => Object.freeze({
      ...a,
      covers: Object.freeze([...(a.covers ?? [])]),
      consequences: Object.freeze((a.consequences ?? []).map(c => Object.freeze({ ...c }))),
      proof: a.proof ? Object.freeze({
        ...a.proof,
        steps: Object.freeze([...a.proof.steps]),
      }) : undefined,
    }))),
    ledger: Object.freeze(parsed.ledger.map(rec => Object.freeze({ ...rec }))),
  });

  const report = verifySeedInvariants(state);
  if (!report.ok) {
    throw new Error(`Нарушение инвариантов зерна при восстановлении: ${report.violations.join('; ')}`);
  }

  return state;
}

/**
 * Драйвер постоянного хранилища (PersistentSeedStorage).
 * Гарантирует атомарность: запись производится только при валидности всех инвариантов.
 */
export class PersistentSeedStorage {
  private persistedJson: string | null = null;

  constructor(initialSeed?: RicisSeedState) {
    if (initialSeed) {
      this.commitSnapshot(initialSeed);
    }
  }

  /**
   * Загружает текущий сохранённый снимок.
   */
  loadSnapshot(): RicisSeedState | null {
    if (!this.persistedJson) return null;
    return deserializeSeedStateFromJson(this.persistedJson);
  }

  /**
   * Атомарная фиксация состояния.
   * Если инварианты нарушены, запись не изменяется.
   */
  tryCommitAtomic(candidateSeed: RicisSeedState): { readonly ok: boolean; readonly reason?: string } {
    const report = verifySeedInvariants(candidateSeed);
    if (!report.ok) {
      return { ok: false, reason: report.violations.join('; ') };
    }

    try {
      const json = serializeSeedStateToJson(candidateSeed);
      // Валидация roundtrip перед сохранением
      deserializeSeedStateFromJson(json);
      this.persistedJson = json;
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: String(err) };
    }
  }

  /**
   * Безусловная фиксация валидного снимка.
   */
  commitSnapshot(seed: RicisSeedState): void {
    const result = this.tryCommitAtomic(seed);
    if (!result.ok) {
      throw new Error(`Atomic commit failed: ${result.reason}`);
    }
  }
}
