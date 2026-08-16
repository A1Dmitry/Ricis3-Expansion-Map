import { create } from 'zustand';
import type { ITerminalStore, ProofReportMode } from '../model/terminal.types';
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
      
      // 1. Пошаговое вычисление выражения
      const res = await engine.evaluate({ expression: currentInput, contextProblemId: 'terminal' });
      
      // 2. Генерация формальной теоремы и Lean 4 спецификации через RicisCoreEngine
      let formalProof = null;
      try {
        formalProof = await engine.generateFormalProof(currentInput);
      } catch (err) {
        console.warn('Formal proof generation fallback error:', err);
      }

      // 3. Формирование пошагового лога
      let newLog = null;
      if (res && res.trace && res.trace.length > 0) {
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
            phaseIdentifier: 2,
            phaseBadgeLabel: t.phase,
            isAxiomApplied: !!t.appliedAxiom,
            requiresL1Verification: true
          }))
        };
      }
      
      const newEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        expression: currentInput,
        result: newLog,
        formalProof: formalProof,
        error: res.error || null,
      };
      
      set({
        isEvaluating: false,
        history: [newEntry, ...history],
        currentInput: res.error ? currentInput : ''
      });
      
    } catch (e: any) {
      const newEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        expression: currentInput,
        result: null,
        formalProof: null,
        error: e.message || String(e),
      };
      
      set({
        isEvaluating: false,
        history: [newEntry, ...history],
        currentInput: currentInput
      });
    }
  }
}));
