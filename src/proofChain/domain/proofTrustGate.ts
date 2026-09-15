/**
 * IProofTrustGate — Align with AuthoritativeProofStatePolicy / WORKFLOW_ONLY.
 * Must reject inherited/resolved status for any node whose upstream state originated from
 * manual/UI-test data rather than a traceable production derivation.
 *
 * Caution for ricis-map-patch-core-agi-target-2026-09-01.json:
 * Part of state-fields were set manually for UI-testing, not via production pipeline.
 * This gate requires own production provenance (derivation journal / walker output) before
 * assigning resolved/inherited status.
 */
import type { ProblemNode } from '../../model/types';
import type { TrustOrigin } from './types';

export interface IProofTrustGate {
  canResolve(chain: readonly ProblemNode[], leaf: ProblemNode): { allowed: boolean; reason?: string };
  canInherit(chain: readonly ProblemNode[], leaf: ProblemNode): { allowed: boolean; reason?: string };
}

const MANUAL_TEST_NODE_IDS = new Set<string>(['core-agi-target']);
const CONTINUUM_PARENT_IDS = new Set<string>(['phys-unified']);

function getProvenance(node: ProblemNode): TrustOrigin {
  const anyNode = node as unknown as Record<string, unknown>;
  const prov = anyNode['__provenance'] as TrustOrigin | undefined;
  if (prov === 'production' || prov === 'manual-ui-test') return prov;
  // Heuristic: nodes that carry PENDING_DOI or lack derivation journal for manual list
  if (MANUAL_TEST_NODE_IDS.has(node.id)) {
    const journal = anyNode['__derivationJournal'] as string | undefined;
    if (journal && typeof journal === 'string' && journal.length > 0) return 'production';
    // Fallback: if node sourceUrl contains PENDING_DOI, treat as manual
    if (typeof node.description === 'string' && node.description.includes('PENDING_DOI')) return 'manual-ui-test';
    // Default for core-agi-target without explicit production flag => manual
    if (!prov) return 'manual-ui-test';
  }
  return 'production';
}

export class ProofTrustGate implements IProofTrustGate {
  canResolve(chain: readonly ProblemNode[], leaf: ProblemNode): { allowed: boolean; reason?: string } {
    // Invariant: Node state must not flip to resolved via ad-hoc boolean bypassing trust policy
    // We check upstream manual origins + continuum guard
    for (const node of chain) {
      if (node.id === leaf.id) continue; // leaf itself will be resolved via this workflow, not inherited
      if (node.state === 'resolved' && getProvenance(node) === 'manual-ui-test') {
        return {
          allowed: false,
          reason: `WORKFLOW_ONLY violation: upstream node ${node.id} has manual/UI-test origin, not production derivation (requires derivation journal/walker output)`,
        };
      }
    }
    // Continuum parents must not become resolved solely from contract/instance success
    for (const node of chain) {
      if (CONTINUUM_PARENT_IDS.has(node.id) && node.state !== 'resolved') {
        // This is technically debt, but trust gate also blocks auto-resolving continuum via instance
        // We do not block debt return; we block false resolve. Since canResolve is called only when debt==0,
        // a continuum parent unresolved would already be debt, so this path is when continuum is resolved manually
        // Check manual case above already covers.
      }
      if (CONTINUUM_PARENT_IDS.has(node.id) && node.state === 'resolved' && getProvenance(node) === 'manual-ui-test') {
        return { allowed: false, reason: `Continuum parent ${node.id} must not become resolved solely from manual contract/instance success` };
      }
    }
    return { allowed: true };
  }

  canInherit(chain: readonly ProblemNode[], leaf: ProblemNode): { allowed: boolean; reason?: string } {
    // Inheritance requires equal SingularityClassId already checked by inheritance policy;
    // additionally, trust gate must reject if any upstream manual resolved would be inherited
    for (const node of chain) {
      if (node.state === 'resolved' && getProvenance(node) === 'manual-ui-test') {
        return {
          allowed: false,
          reason: `inheritance blocked: upstream node ${node.id} manual/UI-test resolved cannot be inherited as real`,
        };
      }
    }
    // Also leaf inheriting must not be continuum auto-resolve
    if (CONTINUUM_PARENT_IDS.has(leaf.id)) {
      return { allowed: false, reason: `continuum node ${leaf.id} must not be inherited via instance GENERALIZE` };
    }
    return { allowed: true };
  }
}
