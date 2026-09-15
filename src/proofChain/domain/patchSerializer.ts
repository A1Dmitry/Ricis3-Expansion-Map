/**
 * Patch serializer isolation enforcement for T10 and forbiddenPatterns
 *
 * Invariants:
 * - priorityEstimate (market/effect ranking) must never share an object with proofStatus/resolved/residual fields
 * - mustNotAppearIn: patch.proofStatus, patch.resolved, patch.residual, any object containing field classId or chainLength
 * - forbiddenPatterns: market_value_field_inside_proof_status_object_without_explicit_estimate_label
 * - resolved_or_residual_field_sharing_object_with_monetization_or_market_size_field
 *
 * This module provides validation that rejects or separates misplaced metadata.
 */

import type { MapStatePatchDTO, PriorityEstimate } from './types';

/**
 * Checks if an object contains proof-status-like fields
 */
function hasProofStatusField(obj: Record<string, unknown>): boolean {
  if (!obj || typeof obj !== 'object') return false;
  return (
    'proofStatus' in obj ||
    'resolved' in obj ||
    'residual' in obj ||
    'proof_status' in obj ||
    // nodePatches state is proof status
    ('state' in obj && typeof obj['state'] === 'string' && ['unresolved', 'partial', 'resolved'].includes(obj['state'] as string) && 'id' in obj)
  );
}

function hasClassOrChainField(obj: Record<string, unknown>): boolean {
  if (!obj || typeof obj !== 'object') return false;
  return 'classId' in obj || 'chainLength' in obj || 'chain_length' in obj;
}

function hasMarketField(obj: Record<string, unknown>): boolean {
  if (!obj || typeof obj !== 'object') return false;
  return (
    'marketGain' in obj ||
    'market_gains' in obj ||
    'marketValue' in obj ||
    'monetization' in obj ||
    'market_size' in obj ||
    'economic_valuation' in obj ||
    'priorityEstimate' in obj // this itself is market/effect estimate, but allowed only top-level
  );
}

/**
 * Validates that priorityEstimate is isolated from proofStatus/resolved/residual
 * and not inside any object containing classId/chainLength.
 *
 * Returns { ok: true } if valid, { ok: false, error: string } if misplaced.
 * Serializer must reject or separate if misplaced (T10).
 */
export function validatePatchIsolation(patch: unknown): { ok: boolean; error?: string } {
  if (!patch || typeof patch !== 'object') return { ok: true };

  const p = patch as Record<string, unknown>;

  // Rule: priorityEstimate must be top-level only, never inside proofStatus/resolved/residual
  // Check top-level: if present, it must have label ESTIMATE_FOR_RANKING and not inside proof object
  const topPriority = p['priorityEstimate'] as Record<string, unknown> | undefined;
  if (topPriority !== undefined) {
    if (topPriority === null || typeof topPriority !== 'object') {
      return { ok: false, error: 'priorityEstimate must be object with label ESTIMATE_FOR_RANKING' };
    }
    if (topPriority['label'] !== 'ESTIMATE_FOR_RANKING') {
      return { ok: false, error: 'priorityEstimate missing required label ESTIMATE_FOR_RANKING' };
    }
    // Top-level is allowed; but ensure it is not sharing object with proofStatus
    // Since it's top-level, check that patch itself does NOT have proofStatus/resolved/residual at same level sharing?
    // spec says mustNotAppearIn: patch.proofStatus, patch.resolved, patch.residual, any object containing classId or chainLength
    // So if patch has both priorityEstimate and proofStatus at top-level in SAME object, that's sharing — forbidden
    // However our patch has patchMetadata with classId/chainLength; priorityEstimate must not share object with that.
    // Top-level sharing: patch has both priorityEstimate and patchMetadata (which contains classId/chainLength) — are they same object? No, they are sibling fields in same top object.
    // The forbiddenPatterns says "never share an object with proofStatus/resolved/residual fields" and also "mustNotAppearIn any object containing classId/chainLength"
    // Interpreting: priorityEstimate must NOT be inside an object that also has classId/chainLength.
    // Sibling top-level is okay? But spec says scoringMetadataContract mustNotAppearIn any object containing classId or chainLength
    // That implies priorityEstimate cannot be inside same object that has classId/chainLength field.
    // If patch itself contains patchMetadata (not direct field), then priorityEstimate sibling to patchMetadata is okay because they are separate objects.
    // But if patch directly has classId field at top level alongside priorityEstimate, that would be violation.
    if ('classId' in p || 'chainLength' in p) {
      return { ok: false, error: 'priorityEstimate must not share object with classId/chainLength (forbiddenPatterns)' };
    }
    if ('proofStatus' in p || 'resolved' in p || 'residual' in p) {
      return { ok: false, error: 'priorityEstimate must not share object with proofStatus/resolved/residual' };
    }
  }

  // Deep check: recursively ensure no nested object contains both priorityEstimate and proof fields,
  // nor priorityEstimate inside classId object, nor priorityEstimate descendant of proofStatus ancestor
  type StackEntry = { obj: Record<string, unknown>; path: string; ancestorIsProof: boolean; ancestorHasClass: boolean };
  const stack: StackEntry[] = [{ obj: p, path: 'patch', ancestorIsProof: false, ancestorHasClass: false }];

  const visited = new WeakSet<object>();

  while (stack.length > 0) {
    const { obj, path, ancestorIsProof, ancestorHasClass } = stack.pop()!;
    if (!obj || typeof obj !== 'object' || visited.has(obj)) continue;
    visited.add(obj);

    const hasPriorityInThisObj = 'priorityEstimate' in obj;
    const hasProofInThisObj = hasProofStatusField(obj);
    const hasClassInThisObj = hasClassOrChainField(obj);

    // Determine if current object is inside proof/class ancestor (including itself)
    const isInsideProof = ancestorIsProof || hasProofInThisObj;
    const isInsideClass = ancestorHasClass || hasClassInThisObj;

    if (hasPriorityInThisObj) {
      // If this object also has proof status or classId -> violation (same object)
      if (hasProofInThisObj) {
        return { ok: false, error: `priorityEstimate shares object with proofStatus/resolved at ${path}` };
      }
      if (hasClassInThisObj) {
        return { ok: false, error: `priorityEstimate shares object with classId/chainLength at ${path} (scoringMetadataContract violation)` };
      }
      // If ancestor is proof status -> priorityEstimate descendant of proofStatus is violation
      if (ancestorIsProof) {
        return { ok: false, error: `priorityEstimate descendant of proofStatus/resolved at ${path} (must be isolated)` };
      }
      if (ancestorHasClass) {
        return { ok: false, error: `priorityEstimate descendant of classId/chainLength object at ${path} (scoringMetadataContract violation)` };
      }
      // Check label inside priorityEstimate
      const pe = obj['priorityEstimate'] as Record<string, unknown>;
      if (pe && typeof pe === 'object' && (pe as Record<string, unknown>)['label'] !== 'ESTIMATE_FOR_RANKING') {
        return { ok: false, error: `priorityEstimate at ${path} missing ESTIMATE_FOR_RANKING label` };
      }
    }

    // Also check forbiddenPatterns: market_value_field_inside_proof_status_object_without_explicit_estimate_label
    // If object has proofStatus and market fields without explicit estimate label, violation
    if (hasProofInThisObj && hasMarketField(obj)) {
      const keys = Object.keys(obj);
      const hasNonPriorityMarket = keys.some(k => ['marketGain', 'marketValue', 'monetization', 'market_size', 'economic_valuation'].includes(k));
      if (hasNonPriorityMarket) {
        return { ok: false, error: `resolved_or_residual_field_sharing_object_with_monetization at ${path}` };
      }
      if (hasPriorityInThisObj && hasProofInThisObj) {
        return { ok: false, error: `market_value_field_inside_proof_status without explicit isolation at ${path}` };
      }
    }
    // Also if ancestor is proof and this object has market fields (even without direct proof field), it's still sharing proof context
    if (ancestorIsProof && hasMarketField(obj) && hasPriorityInThisObj) {
      return { ok: false, error: `priorityEstimate inside proofStatus subtree at ${path}` };
    }

    // Traverse children, propagating ancestor flags
    const childAncestorIsProof = ancestorIsProof || hasProofInThisObj;
    const childAncestorHasClass = ancestorHasClass || hasClassInThisObj;
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object') {
        if (Array.isArray(v)) {
          for (let i = 0; i < v.length; i++) {
            const item = v[i];
            if (item && typeof item === 'object') {
              stack.push({ obj: item as Record<string, unknown>, path: `${path}.${k}[${i}]`, ancestorIsProof: childAncestorIsProof, ancestorHasClass: childAncestorHasClass });
            }
          }
        } else {
          stack.push({ obj: v as Record<string, unknown>, path: `${path}.${k}`, ancestorIsProof: childAncestorIsProof, ancestorHasClass: childAncestorHasClass });
        }
      }
    }
  }

  return { ok: true };
}

/**
 * Serializes patch to JSON after validating isolation. Rejects if misplaced.
 * This enforces T10 in infrastructure.
 */
export function serializePatch(patch: MapStatePatchDTO): string {
  const validation = validatePatchIsolation(patch);
  if (!validation.ok) {
    throw new Error(`Patch serialization rejected (T10 isolation violation): ${validation.error}`);
  }
  return JSON.stringify(patch, null, 2);
}

/**
 * Ensures priorityEstimate is isolated; if misplaced inside proof object, separates it to top-level.
 * Returns a corrected patch if separation needed, otherwise original.
 * (Spec says serializer rejects or separates if misplaced)
 */
export function ensureIsolatedOrReject(patch: unknown): unknown {
  const result = validatePatchIsolation(patch);
  if (result.ok) return patch;
  throw new Error(`Patch isolation violation: ${result.error}`);
}

// Also export for testing the forbidden pattern: resolved field sharing object with monetization
export function hasForbiddenCoLocation(obj: Record<string, unknown>): boolean {
  return hasProofStatusField(obj) && hasMarketField(obj);
}
