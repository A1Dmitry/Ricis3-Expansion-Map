import type { ProblemNode, Proof } from '../model/types';

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
): ProofTrustPresentation {
  const externalLean = proof?.externalLean;

  if (externalLean?.trustStatus === 'LEAN_VERIFIED') {
    return {
      code: 'LEAN_VERIFIED',
      label: 'Lean kernel verified',
      description: 'Есть воспроизводимые toolchain, compiler output и axiom report для внешнего исходника Lean.',
      tone: 'emerald',
    };
  }

  if (externalLean?.trustStatus === 'TRUSTED_AXIOM') {
    return {
      code: 'TRUSTED_AXIOM',
      label: 'Trusted external axiom',
      description: 'Внешний неизменяемый Lean-исходник принят как явно маркированный trusted contract; это не автоматически сгенерированная теорема.',
      tone: 'cyan',
    };
  }

  if (externalLean?.trustStatus === 'REJECTED' || (node.leanErrors?.length ?? 0) > 0) {
    return {
      code: 'REJECTED',
      label: 'Verification rejected',
      description: 'Есть ошибка Lean-проверки или внешнее доказательство отклонено. Утверждение нельзя использовать как подтверждённое.',
      tone: 'rose',
    };
  }

  if (externalLean?.trustStatus === 'REQUIRES_CORE_LEAN' || node.state === 'partial') {
    return {
      code: 'REQUIRES_CORE_LEAN',
      label: 'Requires Core / Lean evidence',
      description: 'Структурный RICIS-результат или исходник сохранён, но Lean kernel evidence ещё не приложен.',
      tone: 'amber',
    };
  }

  if (proof && node.state === 'resolved') {
    return {
      code: 'NODE_STATE_ONLY',
      label: 'Resolved workflow state',
      description: 'Узел отмечен как resolved в карте. Этот статус сам по себе не является Lean kernel verification.',
      tone: 'slate',
    };
  }

  return {
    code: 'NO_PROOF',
    label: 'No proof evidence attached',
    description: 'Для узла пока не приложен proof artifact с проверяемой provenance.',
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
  const presentation = getProofTrustPresentation(node, proof);

  return (
    <div className={`rounded border px-2 py-1 ${TONE_CLASSES[presentation.tone]}`}>
      <p className="text-[8px] font-bold uppercase tracking-wider">{presentation.label}</p>
      {expanded && <p className="mt-1 text-[10px] leading-relaxed opacity-90">{presentation.description}</p>}
    </div>
  );
}
