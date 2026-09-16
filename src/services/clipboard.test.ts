// ============================================================================
// BUG-07 REGRESSION: the unified clipboard helper must never throw in
// non-secure contexts (navigator.clipboard === undefined, http over LAN)
// and must degrade through the legacy textarea fallback.
// ============================================================================

import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from './clipboard';

function stubNavigator(partial: Partial<Navigator>): void {
  Object.defineProperty(window, 'navigator', {
    value: { ...navigator, ...partial },
    configurable: true,
  });
}

describe('copyToClipboard (BUG-07)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    stubNavigator({});
  });

  it('uses the async Clipboard API in a secure context', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubNavigator({ clipboard: { writeText } as unknown as Clipboard });

    await expect(copyToClipboard('hello')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to the legacy textarea path when clipboard is undefined (non-secure context)', async () => {
    stubNavigator({ clipboard: undefined });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });

    await expect(copyToClipboard('fallback-text')).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
    // The temporary textarea must be cleaned up.
    expect(document.body.querySelector('textarea')).toBeNull();
  });

  it('resolves false (never throws) when both clipboard paths fail', async () => {
    stubNavigator({ clipboard: undefined });
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn(() => { throw new Error('not implemented'); }),
      configurable: true,
    });

    await expect(copyToClipboard('doomed')).resolves.toBe(false);
  });

  it('falls back when the async Clipboard API rejects', async () => {
    stubNavigator({
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } as unknown as Clipboard,
    });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });

    await expect(copyToClipboard('rejected-then-fallback')).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
  });
});
