import type {
  IKinematicLogEntry,
  IAdvantageEvent,
  IKinematicTelemetryLedger,
} from '../../model/kinematicEngine.contracts';

export class KinematicTelemetryLogger {
  private readonly maxLogs: number;
  private logs: IKinematicLogEntry[] = [];
  private advantageEvents: IAdvantageEvent[] = [];
  private dlsScore = { placedBalls: 0, graspMisses: 0, avgDeviationDeg: 0 };
  private ricisScore = { placedBalls: 0, graspMisses: 0, avgDeviationDeg: 0 };

  constructor(maxLogs = 120) {
    this.maxLogs = maxLogs;
  }

  public pushEntry(entry: IKinematicLogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (entry.advantageEvent) {
      this.advantageEvents.push(entry.advantageEvent);
      // Keep last 100 advantage events
      if (this.advantageEvents.length > 100) {
        this.advantageEvents.shift();
      }
    }
  }

  public recordScore(winner: 'RICIS' | 'DLS' | 'BOTH', dlsMiss = false): void {
    if (winner === 'RICIS' || winner === 'BOTH') {
      this.ricisScore.placedBalls++;
    }
    if (winner === 'DLS' || winner === 'BOTH') {
      this.dlsScore.placedBalls++;
    }
    if (dlsMiss) {
      this.dlsScore.graspMisses++;
    }
  }

  public clear(): void {
    this.logs = [];
    this.advantageEvents = [];
  }

  public getLedger(): IKinematicTelemetryLedger {
    return {
      logs: [...this.logs],
      advantageEvents: [...this.advantageEvents],
      totalAdvantageCount: this.advantageEvents.length,
      dlsScore: { ...this.dlsScore },
      ricisScore: { ...this.ricisScore },
    };
  }
}
