import { useEffect, useState } from 'react';

/**
 * Compact layout is selected from actual viewport/input capabilities rather than
 * user-agent strings. It covers phones and touch-first small tablets while
 * preserving the desktop layout for large screens and mouse-first devices.
 */
export const MOBILE_LAYOUT_MEDIA_QUERY = '(max-width: 767px), ((pointer: coarse) and (max-width: 1023px))';

export function isMobileLayoutViewport(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY).matches
    : false;
}

export function useMobileLayout(): boolean {
  const [isMobileLayout, setIsMobileLayout] = useState(isMobileLayoutViewport);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY);
    const update = () => setIsMobileLayout(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return isMobileLayout;
}
