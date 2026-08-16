import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { ITerminalStore, ProofReportMode } from '../model/terminal.types';

// Создаем мок-стор для тестирования логики
const createTestStore = () => {
  return create<ITerminalStore>((set, get) => ({
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
      const { currentInput } = get();
      if (!currentInput.trim()) return;
      
      set({ isEvaluating: true });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const newEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        expression: currentInput,
        result: null,
        formalProof: null,
        error: currentInput === 'error' ? 'Syntax Error' : null,
      };
      
      set((state) => ({
        isEvaluating: false,
        history: [newEntry, ...state.history],
        currentInput: currentInput === 'error' ? currentInput : ''
      }));
    }
  }));
};

describe('Terminal Store (Sandbox) Tests', () => {
  let useStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useStore = createTestStore();
  });

  it('должен открывать и закрывать терминал', () => {
    const store = useStore.getState();
    expect(store.isOpen).toBe(false);
    
    useStore.getState().toggleTerminal();
    expect(useStore.getState().isOpen).toBe(true);
    
    useStore.getState().toggleTerminal(true);
    expect(useStore.getState().isOpen).toBe(true);
    
    useStore.getState().toggleTerminal(false);
    expect(useStore.getState().isOpen).toBe(false);
  });

  it('должен переключать режимы отчетов доказательства', () => {
    expect(useStore.getState().activeReportMode).toBe('trace');
    
    useStore.getState().setReportMode('theorem');
    expect(useStore.getState().activeReportMode).toBe('theorem');

    useStore.getState().setReportMode('lean4');
    expect(useStore.getState().activeReportMode).toBe('lean4');
  });

  it('должен обновлять строку ввода', () => {
    useStore.getState().setInput('0_F * inf_G');
    expect(useStore.getState().currentInput).toBe('0_F * inf_G');
  });

  it('должен очищать историю вычислений', () => {
    useStore.setState({
      history: [
        { id: '1', timestamp: Date.now(), expression: '0_1/0_1', result: null, error: null }
      ]
    });
    expect(useStore.getState().history.length).toBe(1);
    
    useStore.getState().clearHistory();
    expect(useStore.getState().history.length).toBe(0);
  });
});
