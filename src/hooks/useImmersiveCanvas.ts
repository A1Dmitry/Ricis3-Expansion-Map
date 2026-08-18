import { useCallback, useEffect, useState } from 'react';

/**
 * Provides a browser fullscreen toggle when supported and an in-app immersive
 * fallback otherwise. Both paths are invoked only by an explicit user action.
 */
export function useImmersiveCanvas() {
  const [isImmersive, setIsImmersive] = useState(false);

  useEffect(() => {
    const sync = () => setIsImmersive(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const exit = useCallback(async () => {
    if (typeof document === 'undefined') return;
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // The local in-app fallback below still restores the standard shell.
      }
    }
    setIsImmersive(false);
  }, []);

  const toggle = useCallback(async (element: HTMLElement | null) => {
    if (!element || typeof document === 'undefined') return;
    if (isImmersive || document.fullscreenElement) {
      await exit();
      return;
    }

    try {
      if (document.fullscreenEnabled && typeof element.requestFullscreen === 'function') {
        await element.requestFullscreen();
      } else {
        setIsImmersive(true);
      }
    } catch {
      setIsImmersive(true);
    }
  }, [exit, isImmersive]);

  return { isImmersive, toggle, exit } as const;
}
