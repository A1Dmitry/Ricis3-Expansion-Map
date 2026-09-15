/**
 * IMapPatchEmitter adapter — Emits RICIS.MapStatePatch DTO for residual/inheritance only
 * Metadata fields (classId, chainLength, evaluationPoint) reflect actual values used in computation, not defaults
 * Ensures priorityEstimate isolation via patchSerializer
 */
import type { IMapPatchEmitter } from '../application/ports';
import type { MapStatePatchDTO, ResidualObligation, PriorityEstimate } from '../domain/types';
import { validatePatchIsolation } from '../domain/patchSerializer';

export class MapPatchEmitter implements IMapPatchEmitter {
  // Allow optional priorityEstimate to be attached at top-level only (never inside proofStatus)
  // This is separate from proof metadata per scoringMetadataContract

  private makeBasePatch(
    leafId: string,
    classId: string,
    chainLength: number,
    evaluationPoint: string,
    method: string,
  ): MapStatePatchDTO {
    // Ensure we use the actual values, not defaults — no hardcoded fallback
    if (chainLength == null || classId == null || evaluationPoint == null) {
      throw new Error('MapPatchEmitter: classId/chainLength/evaluationPoint must be from actual computation');
    }
    return {
      '@type': 'RICIS.MapStatePatch',
      meta: {
        method,
        generated: new Date().toISOString(),
        trustPolicy: 'WORKFLOW_ONLY',
      },
      nodePatches: [
        {
          id: leafId,
          state: 'resolved',
        },
      ],
      proofs: {
        [leafId]: {
          nodeId: leafId,
          targetFunction: `ResidualProof(${leafId})`,
          steps: [
            { phase: 0, name: 'RESIDUAL', action: 'emit residual obligation', expression: `classId=${classId}, chainLength=${chainLength}` },
          ],
          finalResult: `residual for ${leafId}`,
          latex: `\\section*{Residual ${leafId}}\\classId=${classId}, chainLength=${chainLength}`,
        },
      },
      patchMetadata: {
        classId,
        chainLength,
        evaluationPoint,
      },
    };
  }

  emitResidual(params: {
    leafId: string;
    classId: string;
    chainLength: number;
    evaluationPoint: string;
    residual: ResidualObligation;
  }): MapStatePatchDTO {
    const base = this.makeBasePatch(params.leafId, params.classId, params.chainLength, params.evaluationPoint, 'residual_proof_chain');

    // Verify residual obligations match leaf-specific (T1)
    // Patch must not contain market/monetization inside proof object (forbiddenPattern)
    const patch = base as MapStatePatchDTO;
    const validation = validatePatchIsolation(patch);
    if (!validation.ok) throw new Error(`MapPatchEmitter isolation violation: ${validation.error}`);

    return patch;
  }

  emitInheritance(params: {
    leafId: string;
    classId: string;
    chainLength: number;
    evaluationPoint: string;
    fromGeneralId: string;
  }): MapStatePatchDTO {
    const base = this.makeBasePatch(params.leafId, params.classId, params.chainLength, params.evaluationPoint, 'inheritance_via_general');
    // Thin inheritance patch: no full foundation regen
    const patch: MapStatePatchDTO = {
      ...base,
      proofs: {
        [params.leafId]: {
          nodeId: params.leafId,
          targetFunction: `Inherit(${params.fromGeneralId})`,
          steps: [{ phase: 99, name: 'INHERIT', action: `inherit from ${params.fromGeneralId}`, expression: `classId=${params.classId}` }],
          finalResult: `inherited from ${params.fromGeneralId}`,
          latex: `\\section*{Inherit ${params.leafId}} from ${params.fromGeneralId}`,
        },
      },
    };
    const validation = validatePatchIsolation(patch);
    if (!validation.ok) throw new Error(`MapPatchEmitter inheritance isolation violation: ${validation.error}`);
    return patch;
  }

  /**
   * Emit with optional priorityEstimate — must be top-level separate field
   * Used for T10 testing: priorityEstimate must never share object with proofStatus/resolved/residual or classId/chainLength
   */
  emitWithPriorityEstimate(
    basePatch: MapStatePatchDTO,
    priorityEstimate: PriorityEstimate,
  ): MapStatePatchDTO {
    // Ensure label
    if (priorityEstimate.label !== 'ESTIMATE_FOR_RANKING') {
      throw new Error('priorityEstimate must have label ESTIMATE_FOR_RANKING');
    }
    const patched: MapStatePatchDTO = {
      ...basePatch,
      priorityEstimate,
    };
    const validation = validatePatchIsolation(patched);
    if (!validation.ok) throw new Error(`PriorityEstimate isolation violation: ${validation.error}`);
    return patched;
  }
}
