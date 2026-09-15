/**
 * Application ports — thin use-case boundaries (interface-first)
 * All domain ports are re-exported here for application layer DI
 */
export type { IProofChainWalker } from '../domain/proofChainWalker';
export type { IResidualObligationCalculator } from '../domain/residualObligationCalculator';
export type { ISingularityClassifier } from '../domain/singularityClassifier';
export type { IGeneralizationPolicy } from '../domain/generalizationPolicy';
export type { IProofInheritancePolicy } from '../domain/proofInheritancePolicy';
export type { IProofTrustGate } from '../domain/proofTrustGate';

// Emitter ports
export interface IMapPatchEmitter {
  emitResidual(params: {
    leafId: string;
    classId: string;
    chainLength: number;
    evaluationPoint: string;
    residual: import('../domain/types').ResidualObligation;
  }): import('../domain/types').MapStatePatchDTO;

  emitInheritance(params: {
    leafId: string;
    classId: string;
    chainLength: number;
    evaluationPoint: string;
    fromGeneralId: string;
  }): import('../domain/types').MapStatePatchDTO;
}

export interface ILatexArtifactEmitter {
  emit(proof: unknown): string | null;
  isStub(): boolean;
}

export interface ILeanArtifactEmitter {
  emit(proof: unknown): string | null;
  isStub(): boolean;
}
