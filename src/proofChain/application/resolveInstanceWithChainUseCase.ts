/**
 * ResolveInstanceWithChainUseCase — first working slice of Expansion Map pipeline
 * Algorithm per PROOF_CHAIN_RESIDUAL_V1:
 *  chain = walker.walkToRoot(leafId)
 *  if cycle → BLOCKED(CYCLE)
 *  if broken_link → BLOCKED(BROKEN_LINK)
 *  classId = classifier.classify(leaf)
 *  inherit = inheritance.tryInherit(leaf, classId)
 *  if inherited → emit thin inheritance patch only, with classId/chainLength reflecting actual chain; stop
 *  residual = residualCalc.calculate(chain, leaf)
 *  if ancestors incomplete → return debt list; do not resolve
 *  patch = mapPatchEmitter.emit(residual) — patch metadata must equal values actually computed above, not defaults
 *  on workflow success → generalization.onInstanceResolved (≤1 GENERALIZE per classId)
 */
import type { MapState, ProblemNode } from '../../model/types';
import type { IProofChainWalker } from '../domain/proofChainWalker';
import type { IResidualObligationCalculator } from '../domain/residualObligationCalculator';
import type { ISingularityClassifier } from '../domain/singularityClassifier';
import type { IGeneralizationPolicy } from '../domain/generalizationPolicy';
import type { IProofInheritancePolicy } from '../domain/proofInheritancePolicy';
import type { IProofTrustGate } from '../domain/proofTrustGate';
import type { IMapPatchEmitter } from './ports';
import type { UseCaseResult } from '../domain/types';

export interface ResolveInstanceWithChainInput {
  readonly leafId: string;
  readonly mapState: MapState;
}

export class ResolveInstanceWithChainUseCase {
  constructor(
    private readonly walker: IProofChainWalker,
    private readonly classifier: ISingularityClassifier,
    private readonly inheritance: IProofInheritancePolicy,
    private readonly residualCalc: IResidualObligationCalculator,
    private readonly patchEmitter: IMapPatchEmitter,
    private readonly generalization: IGeneralizationPolicy,
    private readonly trustGate: IProofTrustGate,
  ) {}

  execute(input: ResolveInstanceWithChainInput): UseCaseResult {
    const { leafId, mapState } = input;

    // 1. Walk to root
    const chainResult = this.walker.walkToRoot(leafId, mapState);
    if (chainResult.status === 'BLOCKED') {
      if (chainResult.reason === 'CYCLE') {
        return { kind: 'BLOCKED', reason: 'CYCLE' };
      }
      return { kind: 'BLOCKED', reason: 'BROKEN_LINK', missingId: chainResult.missingId };
    }

    // Extract leaf node from chain (first element should be leaf)
    const leaf = chainResult.chain.find(n => n.id === leafId);
    if (!leaf) {
      return { kind: 'BLOCKED', reason: 'BROKEN_LINK', missingId: leafId };
    }

    // 2. Classify
    const classId = this.classifier.classify(leaf);

    // 3. Try inheritance (requires general resolved + class match)
    const inherit = this.inheritance.tryInherit(leaf, classId);
    if (inherit.inherited) {
      // Trust gate check before allowing inheritance
      const trust = this.trustGate.canInherit(chainResult.chain as readonly ProblemNode[], leaf);
      if (!trust.allowed) {
        // Treat as not inherited → proceed to residual path, but do not inherit
        // We do not emit inheritance patch; fall through to residual
        // Alternative would be REJECTED_TRUST, but spec says inheritance requires equal class + trust; else needs instance proof
      } else {
        // Emit thin inheritance patch only, with actual classId/chainLength
        const patch = this.patchEmitter.emitInheritance({
          leafId: leaf.id,
          classId,
          chainLength: chainResult.chainLength,
          evaluationPoint: chainResult.evaluationPoint,
          fromGeneralId: inherit.fromGeneralId,
        });
        // Ensure metadata reflects actual computation (defense against defaults)
        if (patch.patchMetadata.classId !== classId || patch.patchMetadata.chainLength !== chainResult.chainLength) {
          throw new Error('Patch metadata mismatch: classId/chainLength must reflect actual computation (T8)');
        }
        return { kind: 'INHERITED', patch, inheritance: { ...inherit, chainLength: chainResult.chainLength } };
      }
    }

    // 4. Residual calculation
    const residualResult = this.residualCalc.calculate(
      chainResult.chain as readonly ProblemNode[],
      leaf,
      classId,
      chainResult.chainLength,
    );

    if (!residualResult.ready) {
      // Ancestors incomplete → debt list; do not resolve
      return { kind: 'DEBT', debt: residualResult.debt, blockedAncestors: residualResult.blockedAncestors };
    }

    // 5. Trust gate for resolving leaf (WORKFLOW_ONLY)
    const canResolve = this.trustGate.canResolve(chainResult.chain as readonly ProblemNode[], leaf);
    if (!canResolve.allowed) {
      return { kind: 'REJECTED_TRUST', reason: canResolve.reason ?? 'trust gate rejected' };
    }

    // 6. Emit residual patch — metadata must equal actual values computed above
    const patch = this.patchEmitter.emitResidual({
      leafId: leaf.id,
      classId,
      chainLength: chainResult.chainLength,
      evaluationPoint: chainResult.evaluationPoint,
      residual: residualResult.residual,
    });

    if (patch.patchMetadata.classId !== classId || patch.patchMetadata.chainLength !== chainResult.chainLength || patch.patchMetadata.evaluationPoint !== chainResult.evaluationPoint) {
      throw new Error('Patch metadata accuracy violation (T8): emitted metadata must equal actual computation');
    }

    // 7. On workflow success → generalization idempotent
    const gen = this.generalization.onInstanceResolved(classId, leaf.id);

    return {
      kind: 'RESIDUAL_READY',
      patch,
      residual: residualResult.residual,
      generalization: gen,
    };
  }
}
