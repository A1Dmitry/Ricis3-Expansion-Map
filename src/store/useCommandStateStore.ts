// ============================================================================
// SHARED COMMAND-BUS STATE (BUG-02)
// State that must be visible to the App-level CommandContext (toolbar
// indicators, menu enable/active states) while being owned by the page that
// actually performs the action: 3D/2D presentation, kinematic simulation
// run-state, Auto Prover run-state.
// ============================================================================

import { create } from 'zustand';

interface CommandState {
  readonly is3DMode: boolean;
  readonly isSimulationRunning: boolean;
  readonly isAutoProverRunning: boolean;
  set3DMode: (value: boolean) => void;
  toggle3DMode: () => void;
  setSimulationRunning: (value: boolean) => void;
  setAutoProverRunning: (value: boolean) => void;
}

export const useCommandStateStore = create<CommandState>()((set) => ({
  is3DMode: true,
  isSimulationRunning: false,
  isAutoProverRunning: false,
  set3DMode: (value) => set({ is3DMode: value }),
  toggle3DMode: () => set((state) => ({ is3DMode: !state.is3DMode })),
  setSimulationRunning: (value) => set({ isSimulationRunning: value }),
  setAutoProverRunning: (value) => set({ isAutoProverRunning: value }),
}));
