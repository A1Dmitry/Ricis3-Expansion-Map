/**
 * Аудит-заметка (closing principle) — три независимых слоя будущего аудита:
 *   1. Что утверждает Main.
 *   2. Что фактически делает реализация.
 *   3. Что формально доказывает Lean/тесты.
 *
 * Только пересечение трёх множеств = формально реализованная часть RICIS.
 * НЕ считать metadata доказательством.
 *
 * DDD: доменная служба аудита. ISP: узкий интерфейс записи/отчёта.
 */
export type ProofStatus = 'proven' | 'tested' | 'unproven';

export interface AuditClaim {
  readonly id: string; // напр. 'R-12'
  readonly mainSpec: string; // что утверждает Main
  readonly implementation: string; // что делает реализация
  readonly proofStatus: ProofStatus; // доказано ли формально/тестом
  readonly honestNote?: string; // где метаданные не дотягивают до доказательства
}

export interface AuditReportEntry {
  readonly id: string;
  readonly mainSpec: string;
  readonly implementation: string;
  readonly proofStatus: ProofStatus;
  readonly substantiated: boolean; // proofStatus !== 'unproven'
  readonly honestNote?: string;
}

export class ThreeLayerAudit {
  private readonly claims: AuditClaim[] = [];

  record(claim: AuditClaim): void {
    this.claims.push(claim);
  }

  report(): AuditReportEntry[] {
    return this.claims.map((c) => ({
      id: c.id,
      mainSpec: c.mainSpec,
      implementation: c.implementation,
      proofStatus: c.proofStatus,
      substantiated: c.proofStatus !== 'unproven',
      honestNote: c.honestNote,
    }));
  }

  /** Метаданные честности: заявления, НЕ подтверждённые доказательством. */
  unprovenClaims(): AuditReportEntry[] {
    return this.report().filter((e) => !e.substantiated);
  }

  allSubstantiated(): boolean {
    return this.unprovenClaims().length === 0;
  }
}
