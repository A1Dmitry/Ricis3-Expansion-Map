
export type FinalStatus = 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'BLOCKED' | 'REJECTED' | 'HYPOTHESIS';

export interface ICanonicalReport {
  originalGoal: string;
  result: string;
  verification: string;
  positiveResults: string[];
  negativeResults: string[];
  tukhtaFound: string[];
  rootCauses: string[];
  repairs: string[];
  remainingRisks: string[];
  evidence: string[];
  finalStatus: FinalStatus;
  confidence: number; // 0..1
}
