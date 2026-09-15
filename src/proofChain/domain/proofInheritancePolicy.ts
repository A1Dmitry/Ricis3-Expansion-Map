/**
 * IProofInheritancePolicy — If general resolved and classId matches → inherit; else needs instance proof
 * Requires equal SingularityClassId (SP4 of class; no silent collapse)
 */
import type { ProblemNode } from '../../model/types';
import type { SingularityClassId, InheritanceResult } from './types';
import type { IGeneralizationPolicy } from './generalizationPolicy';

export interface IProofInheritancePolicy {
  tryInherit(leaf: ProblemNode, classId: SingularityClassId): InheritanceResult;
}

export class ProofInheritancePolicy implements IProofInheritancePolicy {
  constructor(private readonly generalization: IGeneralizationPolicy) {}

  tryInherit(_leaf: ProblemNode, classId: SingularityClassId): InheritanceResult {
    const task = this.generalization.getTask(classId);
    if (!task) {
      return { inherited: false, reason: 'NO_GENERAL', details: `no GENERALIZE task for class ${classId}` };
    }
    if (task.status !== 'resolved') {
      return { inherited: false, reason: 'GENERAL_NOT_RESOLVED', details: `GENERALIZE ${task.id} is ${task.status}` };
    }
    // classId equality already enforced by lookup key; no silent collapse
    return {
      inherited: true,
      fromGeneralId: task.id,
      classId,
      chainLength: 0, // filled by caller with actual chainLength
    };
  }
}
