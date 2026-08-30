export interface IRicisNumber<TType extends string> {
  readonly originExpression: string;
  readonly semanticIndex: TType;
  readonly isSingularity: boolean;
  readonly value: number;
}

export interface ITransformationLog {
  readonly step: number;
  readonly axiomApplied: 'SP1' | 'SP4' | 'A6_GENERAL' | 'L1_IDENTITY';
  readonly invariantBefore: string;
  readonly invariantAfter: string;
}

export interface IChatbotProofTransaction {
  readonly transactionId: string;
  readonly problemStatement: string;
  readonly computationCost: IRicisNumber<'0_C'>;
  readonly scaleFactor: IRicisNumber<'infinity_N'>;
  readonly history: ITransformationLog[];
}

export interface IMonetizationService {
  evaluateNetworkValue(transaction: IChatbotProofTransaction): IRicisNumber<'C_times_N'>;
}
