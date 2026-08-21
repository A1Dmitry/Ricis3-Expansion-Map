import type { ProblemNode, Proof } from '../model/types';
import { DICTIONARY, type SupportedLocale } from '../model/i18n.types';
import { useI18nStore } from '../store/useI18nStore';

export type ProofTrustTone = 'emerald' | 'amber' | 'rose' | 'slate' | 'cyan';

export interface ProofTrustPresentation {
  readonly code:
    | 'LEAN_VERIFIED'
    | 'TRUSTED_AXIOM'
    | 'REQUIRES_CORE_LEAN'
    | 'REJECTED'
    | 'NODE_STATE_ONLY'
    | 'NO_PROOF';
  readonly label: string;
  readonly description: string;
  readonly tone: ProofTrustTone;
}

const TONE_CLASSES: Readonly<Record<ProofTrustTone, string>> = {
  emerald: 'border-emerald-700/70 bg-emerald-950/80 text-emerald-200',
  amber: 'border-amber-700/70 bg-amber-950/80 text-amber-200',
  rose: 'border-rose-700/70 bg-rose-950/80 text-rose-200',
  slate: 'border-slate-700 bg-slate-900 text-slate-300',
  cyan: 'border-cyan-700/70 bg-cyan-950/80 text-cyan-100',
};

/**
 * Presents only evidence that the persisted Proof model can support. A map node's
 * workflow state is deliberately never upgraded into Lean kernel verification.
 */
export function getProofTrustPresentation(
  node: Pick<ProblemNode, 'state' | 'leanErrors' | 'leanWarnings'>,
  proof?: Proof,
  locale: SupportedLocale = 'en',
): ProofTrustPresentation {
  const externalLean = proof?.externalLean;

  if (externalLean?.trustStatus === 'LEAN_VERIFIED') {
    return {
      code: 'LEAN_VERIFIED',
      label: DICTIONARY['proofTrust.leanVerified.label'][locale],
      description: DICTIONARY['proofTrust.leanVerified.description'][locale],
      tone: 'emerald',
    };
  }

  if (externalLean?.trustStatus === 'TRUSTED_AXIOM') {
    return {
      code: 'TRUSTED_AXIOM',
      label: DICTIONARY['proofTrust.trustedAxiom.label'][locale],
      description: DICTIONARY['proofTrust.trustedAxiom.description'][locale],
      tone: 'cyan',
    };
  }

  if (externalLean?.trustStatus === 'REJECTED' || (node.leanErrors?.length ?? 0) > 0) {
    return {
      code: 'REJECTED',
      label: DICTIONARY['proofTrust.rejected.label'][locale],
      description: DICTIONARY['proofTrust.rejected.description'][locale],
      tone: 'rose',
    };
  }

  if (externalLean?.trustStatus === 'REQUIRES_CORE_LEAN' || node.state === 'partial') {
    return {
      code: 'REQUIRES_CORE_LEAN',
      label: DICTIONARY['proofTrust.requiresCoreLean.label'][locale],
      description: DICTIONARY['proofTrust.requiresCoreLean.description'][locale],
      tone: 'amber',
    };
  }

  if (proof && node.state === 'resolved') {
    return {
      code: 'NODE_STATE_ONLY',
      label: DICTIONARY['proofTrust.nodeStateOnly.label'][locale],
      description: DICTIONARY['proofTrust.nodeStateOnly.description'][locale],
      tone: 'slate',
    };
  }

  return {
    code: 'NO_PROOF',
    label: DICTIONARY['proofTrust.noProof.label'][locale],
    description: DICTIONARY['proofTrust.noProof.description'][locale],
    tone: 'slate',
  };
}

export function ProofTrustBadge({
  node,
  proof,
  expanded = false,
}: {
  readonly node: Pick<ProblemNode, 'state' | 'leanErrors' | 'leanWarnings'>;
  readonly proof?: Proof;
  readonly expanded?: boolean;
}) {
  const locale = useI18nStore(state => state.locale);
  const presentation = getProofTrustPresentation(node, proof, locale);

  return (
    <div className={`rounded border px-2 py-1 ${TONE_CLASSES[presentation.tone]}`}>
      <p className="text-[8px] font-bold uppercase tracking-wider">{presentation.label}</p>
      {expanded && <p className="mt-1 text-[10px] leading-relaxed opacity-90">{presentation.description}</p>}
    </div>
  );
}
