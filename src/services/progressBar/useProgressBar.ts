import { useEffect, useState } from 'react';
import type { ProgressState } from './progressBar.types';
import { getProgressBar } from './progressBarService';

export function useProgressBar(): ProgressState & {
  requestCancel: () => void;
} {
  const progressBar = getProgressBar();
  const [state, setState] = useState<ProgressState>(() => progressBar.getState());

  useEffect(() => {
    const unsubscribe = progressBar.subscribe((nextState) => {
      setState(nextState);
    });
    return () => {
      unsubscribe();
    };
  }, [progressBar]);

  return {
    ...state,
    requestCancel: () => progressBar.requestCancel(),
  };
}
