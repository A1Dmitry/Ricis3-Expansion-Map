/**
 * IResidualObligationCalculator — Compute residual obligation given chain + instance
 * Pure domain service; no React/DOM/network
 */
import type { ProblemNode } from '../../model/types';
import type { ResidualResult, SingularityClassId } from './types';

export interface IResidualObligationCalculator {
  calculate(chain: readonly ProblemNode[], leaf: ProblemNode, classId: SingularityClassId, chainLength: number): ResidualResult;
}

export class ResidualObligationCalculator implements IResidualObligationCalculator {
  calculate(
    chain: readonly ProblemNode[],
    leaf: ProblemNode,
    classId: SingularityClassId,
    chainLength: number,
  ): ResidualResult {
    // Ancestors are all nodes in chain except leaf
    const ancestors = chain.filter(n => n.id !== leaf.id);

    // Invariant: continuum parents (e.g. phys-unified) must not become resolved solely from contract/instance success
    // We treat them as blocked if they are not already production-resolved; but state check suffices here.
    // Debt detection is state-based; trust gate will enforce production provenance separately.

    const blockedAncestors = ancestors.filter(a => a.state !== 'resolved');

    if (blockedAncestors.length > 0) {
      const debt = blockedAncestors.map(a => a.id);
      return {
        ready: false,
        debt,
        blockedAncestors,
      };
    }

    // All ancestors resolved → residual contains only leaf-specific obligation
    const obligations = [`leaf:${leaf.id}:class:${classId}:obligation`];

    return {
      ready: true,
      residual: {
        leafId: leaf.id,
        classId,
        obligations,
        chainLength,
        evaluationPoint: leaf.id,
      },
    };
  }
}
