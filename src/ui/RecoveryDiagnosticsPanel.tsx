import { Check, Clipboard, RefreshCw } from 'lucide-react';
import type { HealthProbeViewState, RecoveryDiagnosticProjection } from './recoveryDiagnostics.types';

export interface RecoveryDiagnosticsPanelProps {
  readonly projection: RecoveryDiagnosticProjection;
  readonly healthState: HealthProbeViewState;
  readonly copied: boolean;
  readonly onProbe: () => void;
  readonly onCopy: () => void;
  readonly probeDisabled: boolean;
}

/**
 * Pure presentation for the allowlisted recovery diagnostic projection.
 * The page owns all browser, recovery-service and health-probe side effects.
 */
export function RecoveryDiagnosticsPanel({
  projection,
  healthState,
  copied,
  onProbe,
  onCopy,
  probeDisabled,
}: RecoveryDiagnosticsPanelProps) {
  return (
    <section className="space-y-4" data-testid="recovery-diagnostics-panel">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
        {projection.fields.map(field => (
          <div
            key={field.id}
            data-testid={`recovery-diagnostic-${field.id}`}
            className="rounded-lg border border-neutral-800 bg-black/30 p-3"
          >
            <span className="block text-[9px] uppercase tracking-wider text-slate-500">{field.label}</span>
            <span className="mt-1 block font-mono text-slate-200 break-words">{field.value}</span>
          </div>
        ))}
      </div>

      {healthState.kind !== 'idle' && healthState.message && (
        <div
          data-testid="recovery-health-state"
          role="status"
          aria-live="polite"
          className={`rounded-lg border p-3 text-sm ${healthState.kind === 'available'
            ? 'border-emerald-800 bg-emerald-950/30 text-emerald-200'
            : healthState.kind === 'unavailable'
              ? 'border-red-900 bg-red-950/30 text-red-200'
              : 'border-cyan-900 bg-cyan-950/20 text-cyan-200'}`}
        >
          {healthState.message}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-neutral-800 pt-5 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          data-testid="recovery-health-probe"
          onClick={onProbe}
          disabled={probeDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-700 bg-cyan-950/50 px-4 py-2.5 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-900/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={probeDisabled ? 'animate-spin' : ''} aria-hidden="true" />
          {healthState.kind === 'checking' ? healthState.message : 'Повторить проверку Core'}
        </button>
        <button
          type="button"
          data-testid="recovery-diagnostic-copy"
          onClick={onCopy}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-neutral-800"
        >
          {copied ? <Check size={16} className="text-emerald-300" aria-hidden="true" /> : <Clipboard size={16} aria-hidden="true" />}
          {copied ? 'Диагностика скопирована' : 'Скопировать безопасную диагностику'}
        </button>
      </div>
    </section>
  );
}
