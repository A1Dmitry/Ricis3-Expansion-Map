import { afterEach, describe, expect, it, vi } from 'vitest';
import { isMobileLayoutViewport, MOBILE_LAYOUT_MEDIA_QUERY } from './useMobileLayout';

describe('mobile layout viewport classifier', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses a compact viewport and coarse-pointer media query', () => {
    expect(MOBILE_LAYOUT_MEDIA_QUERY).toContain('max-width: 767px');
    expect(MOBILE_LAYOUT_MEDIA_QUERY).toContain('pointer: coarse');
  });

  it('returns false without browser media capabilities', () => {
    vi.stubGlobal('window', {});
    expect(isMobileLayoutViewport()).toBe(false);
  });

  it('returns true when the compact touch-first query matches', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    vi.stubGlobal('window', { matchMedia });

    expect(isMobileLayoutViewport()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith(MOBILE_LAYOUT_MEDIA_QUERY);
  });

  it('keeps desktop layout when the compact query does not match', () => {
    vi.stubGlobal('window', { matchMedia: vi.fn().mockReturnValue({ matches: false }) });
    expect(isMobileLayoutViewport()).toBe(false);
  });
});
