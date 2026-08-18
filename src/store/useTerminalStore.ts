import { create } from 'zustand';
import type { ITerminalStore, ProofReportMode } from '../model/terminal.types';
import type { ITransformationLogDTO, TransformationPhase } from '../model/traceVisualizer.types';
import { writeCoreRecovery } from '../services/coreRecovery';
import { isCoreExecutionFailure } from '../services/ricisCore/IRicisCoreEngine';
import { getRicisCoreEngine } from '../services/ricisCore';

export const useTerminalStore = create<ITerminalStore>((set, get) => ({
  isOpen: false,
  activeReportMode: 'trace',
  currentInput: '',
  isEvaluating: false,
  history: [],

  toggleTerminal: (force?: boolean) => set((state) => ({ isOpen: force !== undefined ? force : !state.isOpen })),

  setReportMode: (mode: ProofReportMode) => set({ activeReportMode: mode }),

  setInput: (expression: string) => set({ currentInput: expression }),

  clearHistory: () => set({ history: [] }),

  loadFromHistory: (expression: string) => set({ currentInput: expression }),

  evaluateExpression: async () => {
    const { currentInput, history } = get();
    if (!currentInput.trim()) return;

    set({ isEvaluating: true });

    try {
      const engine = getRicisCoreEngine();
      const res = await engine.evaluate({ expression: currentInput, contextProblemId: 'terminal' });

      if (isCoreExecutionFailure(res)) {
        set({
          isEvaluating: false,
          history: [{
            id: Date.now().toString(),
            timestamp: Date.now(),
            expression: currentInput,
            result: null,
            formalProof: null,
            error: `[${res.code}] ${res.userMessage}`,
          }, ...history],
          currentInput,
        });
        writeCoreRecovery(res);
        return;
      }

      let newLog: ITransformationLogDTO | null = null;
      if (res.trace.length > 0) {
        newLog = {
          evaluationId: Date.now().toString(),
          targetExpression: currentInput,
          finalInvariant: res.invariant,
          isSingular: res.isSingular,
          semanticIndex: res.semanticIndex,
          steps: res.trace.map(t => ({
            title: t.title,
            inputState: t.inputState,
            outputState: t.outputState,
            appliedAxiom: t.appliedAxiom,
            complexity: t.complexity,
            phaseIdentifier: 2 as TransformationPhase,
            phaseBadgeLabel: t.phase,
            isAxiomApplied: !!t.appliedAxiom,
            requiresL1Verification: true,
          })),
        };
      }

      set({
        isEvaluating: false,
        history: [{
          id: Date.now().toString(),
          timestamp: Date.now(),
          expression: currentInput,
          result: newLog,
          formalProof: null,
          error: null,
        }, ...history],
        currentInput: '',
      });
    } catch {
      const failure = {
        success: false as const,
        code: 'CORE_INFRASTRUCTURE_ERROR' as const,
        userMessage: 'Инфраструктура Ricis.Core не завершила запрос. Результат не вычислялся.',
        diagnostic: {
          origin: 'terminal' as const,
          runtime: 'not_ready' as const,
          retryable: true,
          occurredAt: Date.now(),
        },
      };

      set({
        isEvaluating: false,
        history: [{
          id: Date.now().toString(),
          timestamp: Date.now(),
          expression: currentInput,
          result: null,
          formalProof: null,
          error: `[${failure.code}] ${failure.userMessage}`,
        }, ...history],
        currentInput,
      });
      writeCoreRecovery(failure);
    }
  },
}));
